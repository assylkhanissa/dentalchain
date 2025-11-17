// backend/routes/clinicRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import path from "path";
import Clinic from "../models/Clinic.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js"; // ✅ Пациенттерді алу үшін
import { auth, requireRole } from "../middleware/auth.js";

const router = express.Router();

/** ========== uploads/clinics папка ========== */
const uploadDir = path.resolve("uploads/clinics");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/** Вспомогательная функция: парсинг location из body */
const parseLocation = (body) => {
  try {
    if (!body) return null;
    if (body.location) {
      if (typeof body.location === "string") {
        const parsed = JSON.parse(body.location);
        if (
          parsed &&
          typeof parsed.lat === "number" &&
          typeof parsed.lng === "number"
        )
          return parsed;
      } else if (
        typeof body.location === "object" &&
        typeof body.location.lat === "number" &&
        typeof body.location.lng === "number"
      ) {
        return body.location;
      }
    }
    if (body.lat && body.lng) {
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return { lat, lng };
    }
  } catch (e) {
    // ignore parse errors
  }
  return null;
};

/** ========== OWNER: өз клиникаларының тізімі ========== */
router.get("/owner/mine/list", auth, requireRole("owner"), async (req, res) => {
  try {
    const clinics = await Clinic.find({ owner: req.user.id })
      .select("-__v")
      .populate("owner", "fullName email");
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: "Қате орын алды", error: error.message });
  }
});

/** ========== ✅ КЛИНИКА: өзіне тіркелген пациенттердің тізімі ========== */
router.get("/patients", auth, requireRole("clinic"), async (req, res) => {
  try {
    const appointments = await Appointment.find({ clinic: req.user.id })
      .populate("patient", "fullName email")
      .sort({ dateTime: -1 });

    if (!appointments.length) {
      return res.json([]);
    }

    const patients = appointments.map((a) => ({
      patientName: a.patient?.fullName || "Белгісіз",
      patientEmail: a.patient?.email || "—",
      dateTime: a.dateTime,
      serviceType: a.serviceType || "—",
    }));

    res.json(patients);
  } catch (error) {
    console.error("Clinic patients load error:", error);
    res.status(500).json({
      message: "❌ Сервер қатесі",
      error: error.message,
    });
  }
});

/** ========== ПУБЛИК: барлық клиникалар тізімі ========== */
router.get("/", async (req, res) => {
  try {
    const clinics = await Clinic.find()
      .select("-__v")
      .populate("owner", "fullName email role");
    res.json(clinics);
  } catch (error) {
    res.status(500).json({ message: "Қате орын алды", error: error.message });
  }
});

/** ========== ПУБЛИК: нақты клиника (email арқылы) ========== */
router.get("/:email", async (req, res) => {
  try {
    const clinic = await Clinic.findOne({ email: req.params.email }).populate(
      "owner",
      "fullName email role"
    );
    if (!clinic) return res.status(404).json({ message: "Клиника табылмады" });
    res.json(clinic);
  } catch (error) {
    res.status(500).json({ message: "Қате орын алды", error: error.message });
  }
});

/** ========== ADMIN: жаңа клиника қосу ========== */
router.post(
  "/",
  auth,
  requireRole("admin"),
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

      if (!name || !email || !ownerEmail) {
        return res.status(400).json({
          message: "name, email және ownerEmail қажет ❌",
        });
      }

      // Email тексеру
      const existingClinic = await Clinic.findOne({ email });
      if (existingClinic) {
        return res
          .status(400)
          .json({ message: "Бұл клиника email тіркелген ❌" });
      }

      // Владелец (owner) табу/жасау
      let owner = await User.findOne({ email: ownerEmail });
      let tempPass = null;

      if (!owner) {
        tempPass = Math.random().toString(36).slice(-8);
        const hashed = await bcrypt.hash(tempPass, 10);
        owner = await User.create({
          role: "owner",
          fullName: ownerFullName || "Clinic Owner",
          email: ownerEmail,
          password: hashed,
        });
      } else if (owner.role !== "owner") {
        return res.status(400).json({
          message: "Бұл email иесі рөлімен тіркелмеген ❌",
        });
      }

      // Фото
      let image = "";
      if (imageUrl) image = imageUrl;
      if (req.file) image = `/uploads/clinics/${req.file.filename}`;

      // Парсим координаты
      const location = parseLocation(req.body);

      // Клиника жасау
      const clinic = await Clinic.create({
        name,
        email,
        address,
        phone,
        description,
        image,
        owner: owner._id,
        location,
      });

      res.status(201).json({
        message: "✅ Клиника құрылды",
        clinic,
        ownerTempPassword: tempPass || null,
      });
    } catch (error) {
      console.error("CREATE CLINIC ERROR:", error);
      res
        .status(500)
        .json({ message: "❌ Сервер қатесі", error: error.message });
    }
  }
);

/** ========== OWNER: өз клиникасын өңдеу ========== */
router.put(
  "/:clinicId",
  auth,
  requireRole("owner"),
  upload.single("image"),
  async (req, res) => {
    try {
      const clinic = await Clinic.findById(req.params.clinicId);
      if (!clinic)
        return res.status(404).json({ message: "Клиника табылмады" });

      if (String(clinic.owner) !== String(req.user.id)) {
        return res.status(403).json({ message: "Тек иесі өңдей алады ❌" });
      }

      const { address, phone, description } = req.body;
      clinic.address = address ?? clinic.address;
      clinic.phone = phone ?? clinic.phone;
      clinic.description = description ?? clinic.description;

      if (req.file) {
        clinic.image = `/uploads/clinics/${req.file.filename}`;
      } else if (req.body.image) {
        clinic.image = req.body.image;
      }

      // update location if provided
      const newLoc = parseLocation(req.body);
      if (newLoc) clinic.location = newLoc;

      await clinic.save();

      res.json({ message: "✅ Клиника деректері жаңартылды", clinic });
    } catch (error) {
      console.error("UPDATE CLINIC ERROR:", error);
      res
        .status(500)
        .json({ message: "❌ Сервер қатесі", error: error.message });
    }
  }
);

export default router;
