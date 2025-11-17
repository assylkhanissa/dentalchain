import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import Clinic from "../models/Clinic.js";
import Appointment from "../models/Appointment.js";
import { Xray } from "../models/Xray.js";
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/* ================= Uploads (картинки, если нужны) ================= */
const uploadDir = path.resolve("uploads/admin");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/* ================= Router-level debug/log middleware ================= */
router.use((req, res, next) => {
  console.log("[ADMIN ROUTE]", req.method, req.originalUrl);
  next();
});

/* ================= Test ping ================= */
router.get("/ping", (req, res) => {
  res.json({ ok: true, msg: "admin ping" });
});

/* ================= Утилита пагинации ================= */
const paged = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit || "20", 10), 1),
    100
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/* ===================================================================
   USERS CRUD
=================================================================== */
// NOTE: auth is used as a factory -> call it with required role
router.get("/users", auth("admin"), async (req, res) => {
  try {
    const { q, role } = req.query;
    const { limit, skip, page } = paged(req);

    const filter = {};
    if (role) filter.role = role;
    if (q) {
      filter.$or = [
        { fullName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.get("/users/:id", auth("admin"), async (req, res) => {
  try {
    const item = await User.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "User not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.post("/users", auth("admin"), async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role)
      return res.status(400).json({ message: "Missing fields" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashed, role });
    res.status(201).json({ message: "Created", user });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.put("/users/:id", auth("admin"), async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (password) updates.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Updated", user });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.delete("/users/:id", auth("admin"), async (req, res) => {
  try {
    const x = await User.findByIdAndDelete(req.params.id);
    if (!x) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

/* ===================================================================
   CLINICS CRUD
=================================================================== */
router.get("/clinics", auth("admin"), async (req, res) => {
  try {
    const { q, ownerEmail } = req.query;
    const { limit, skip, page } = paged(req);

    const filter = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { address: { $regex: q, $options: "i" } },
      ];
    }

    if (ownerEmail) {
      const owner = await User.findOne({ email: ownerEmail, role: "owner" });
      filter.owner = owner ? owner._id : null;
    }

    const [items, total] = await Promise.all([
      Clinic.find(filter)
        .populate("owner", "fullName email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Clinic.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.get("/clinics/:id", auth("admin"), async (req, res) => {
  try {
    const item = await Clinic.findById(req.params.id).populate(
      "owner",
      "fullName email role"
    );
    if (!item) return res.status(404).json({ message: "Clinic not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

// создать (поддержка file image или imageUrl)
router.post(
  "/clinics",
  auth("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        address,
        phone,
        description,
        imageUrl,
        ownerEmail,
        ownerFullName,
      } = req.body;

      if (!name || !email)
        return res.status(400).json({ message: "name, email required" });

      let image = imageUrl || "";
      if (req.file) image = `/uploads/admin/${req.file.filename}`;

      let owner = null;
      if (ownerEmail) {
        owner = await User.findOne({ email: ownerEmail });
        if (!owner) {
          const tmpPass = Math.random().toString(36).slice(-8);
          const hashed = await bcrypt.hash(tmpPass, 10);
          owner = await User.create({
            fullName: ownerFullName || "Clinic Owner",
            email: ownerEmail,
            role: "owner",
            password: hashed,
          });
        } else if (owner.role !== "owner") {
          return res
            .status(400)
            .json({ message: "Owner email is not 'owner' role ❌" });
        }
      }

      const clinic = await Clinic.create({
        name,
        email,
        address,
        phone,
        description,
        image,
        owner: owner?._id,
      });

      res.status(201).json({ message: "Clinic created", clinic });
    } catch (e) {
      res.status(500).json({ message: "Қате орын алды", detail: e.message });
    }
  }
);

router.put(
  "/clinics/:id",
  auth("admin"),
  upload.single("image"),
  async (req, res) => {
    try {
      const updates = { ...req.body };
      if (req.file) updates.image = `/uploads/admin/${req.file.filename}`;

      // переназначить owner по ownerEmail (если прислали)
      if (updates.ownerEmail) {
        let owner = await User.findOne({
          email: updates.ownerEmail,
          role: "owner",
        });
        if (!owner) return res.status(400).json({ message: "Owner not found" });
        updates.owner = owner._id;
        delete updates.ownerEmail;
      }

      const clinic = await Clinic.findByIdAndUpdate(req.params.id, updates, {
        new: true,
      });
      if (!clinic) return res.status(404).json({ message: "Clinic not found" });
      res.json({ message: "Updated", clinic });
    } catch (e) {
      res.status(500).json({ message: "Қате орын алды", detail: e.message });
    }
  }
);

router.delete("/clinics/:id", auth("admin"), async (req, res) => {
  try {
    const x = await Clinic.findByIdAndDelete(req.params.id);
    if (!x) return res.status(404).json({ message: "Clinic not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

/* ===================================================================
   APPOINTMENTS CRUD
=================================================================== */
router.get("/appointments", auth("admin"), async (req, res) => {
  try {
    const { status } = req.query;
    const { limit, skip, page } = paged(req);

    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patient", "fullName email")
        .populate("clinic", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Appointment.countDocuments(filter),
    ]);

    res.json({ items, total, page, pages: Math.ceil(total / limit) });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.get("/appointments/:id", auth("admin"), async (req, res) => {
  try {
    const item = await Appointment.findById(req.params.id)
      .populate("patient", "fullName email")
      .populate("clinic", "name email address phone image");
    if (!item)
      return res.status(404).json({ message: "Appointment not found" });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.post("/appointments", auth("admin"), async (req, res) => {
  try {
    const { clinic, patient, dateTime, note, status } = req.body;
    if (!clinic || !patient || !dateTime)
      return res
        .status(400)
        .json({ message: "clinic, patient, dateTime required" });

    const appt = await Appointment.create({
      clinic,
      patient,
      dateTime,
      note: note || "",
      status: status || "pending",
    });
    res.status(201).json({ message: "Created", appointment: appt });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.put("/appointments/:id", auth("admin"), async (req, res) => {
  try {
    const updates = { ...req.body };
    const appt = await Appointment.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Updated", appointment: appt });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.delete("/appointments/:id", auth("admin"), async (req, res) => {
  try {
    const x = await Appointment.findByIdAndDelete(req.params.id);
    if (!x) return res.status(404).json({ message: "Appointment not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

/* ===================================================================
   XRAYS (если используешь отдельную коллекцию)
=================================================================== */
router.get("/xrays", auth("admin"), async (req, res) => {
  try {
    const { email, patientId } = req.query;
    const filter = {};
    if (patientId) filter.patientUser = patientId;
    if (email) {
      const u = await User.findOne({ email });
      filter.patientUser = u?._id || null;
    }
    const items = await Xray.find(filter)
      .populate("patientUser", "fullName email")
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

router.delete("/xrays/:id", auth("admin"), async (req, res) => {
  try {
    const x = await Xray.findByIdAndDelete(req.params.id);
    if (!x) return res.status(404).json({ message: "Xray not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

export default router;
