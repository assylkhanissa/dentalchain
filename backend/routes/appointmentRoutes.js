// backend/routes/appointmentRoutes.js
import express from "express";
import Appointment from "../models/Appointment.js";
import { auth } from "../middleware/auth.js";
import Clinic from "../models/Clinic.js";

const router = express.Router();

// пациент создаёт запись — patient берём из токена
router.post("/", auth(), async (req, res) => {
  try {
    const { clinic, dateTime, note, status } = req.body;
    const patientId = req.user?.id;
    if (!clinic || !dateTime) {
      return res.status(400).json({ message: "clinic и dateTime міндетті" });
    }

    const dt = new Date(dateTime);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ message: "dateTime жарамсыз формат" });
    }

    // опционально: проверить, существует ли клиника
    const c = await Clinic.findById(clinic);
    if (!c) return res.status(400).json({ message: "Клиника табылмады" });

    const appt = await Appointment.create({
      clinic,
      patient: patientId,
      dateTime: dt,
      note: note || "",
      status: status || "pending",
    });

    res.status(201).json({ message: "Created", appointment: appt });
  } catch (e) {
    console.error("Create appointment error:", e);
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

// получить все записи текущего пациента
router.get("/me", auth(), async (req, res) => {
  try {
    const items = await Appointment.find({ patient: req.user.id })
      .populate("clinic", "name address phone image")
      .sort({ createdAt: -1 })
      .lean();
    res.json(items);
  } catch (e) {
    console.error("Get my appointments error:", e);
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

// получить одну запись (если нужно)
router.get("/:id", auth(), async (req, res) => {
  try {
    const item = await Appointment.findById(req.params.id)
      .populate("clinic", "name address phone image")
      .populate("patient", "fullName email");
    if (!item)
      return res.status(404).json({ message: "Appointment not found" });

    // позволяем получить если владелец или админ
    if (
      item.patient._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Рұқсат жоқ" });
    }

    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

// пациент может удалить свою запись; админ — любую
router.delete("/:id", auth(), async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt)
      return res.status(404).json({ message: "Appointment not found" });

    // если не владелец и не админ — запрет
    if (appt.patient.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Рұқсат жоқ" });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    // опционально: вернуть оставшиеся записи пациента
    const remaining = await Appointment.find({ patient: req.user.id })
      .populate("clinic", "name address phone image")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ message: "Deleted", remaining });
  } catch (e) {
    console.error("Delete appointment error:", e);
    res.status(500).json({ message: "Қате орын алды", detail: e.message });
  }
});

export default router;
