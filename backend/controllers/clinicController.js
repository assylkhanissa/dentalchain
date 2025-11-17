// backend/controllers/clinicController.js
import Clinic from "../models/Clinic.js";

export const createClinic = async (req, res) => {
  try {
    const { name, email, address, phone, description, image } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Атауы мен email міндетті ❌" });
    }

    const exists = await Clinic.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Бұл email клиника ретінде тіркелген ❌" });
    }

    const clinic = await Clinic.create({
      name,
      email,
      address: address || "",
      phone: phone || "",
      description: description || "",
      image: image || "",
    });

    res.status(201).json({ message: "Клиника қосылды ✅", clinic });
  } catch (err) {
    console.error("CREATE CLINIC ERROR:", err);
    res.status(500).json({ message: "Сервер қатесі ❌" });
  }
};

export const listClinics = async (_req, res) => {
  try {
    const clinics = await Clinic.find().sort({ createdAt: -1 });
    res.json(clinics);
  } catch (err) {
    console.error("LIST CLINICS ERROR:", err);
    res.status(500).json({ message: "Сервер қатесі ❌" });
  }
};
