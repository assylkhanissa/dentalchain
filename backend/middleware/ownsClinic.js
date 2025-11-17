// backend/middleware/ownsClinic.js
import Clinic from "../models/Clinic.js";

export const ownsClinic = async (req, res, next) => {
  try {
    const clinicId = req.params.clinicId || req.body.clinicId;
    if (!clinicId) return res.status(400).json({ message: "clinicId қажет ❌" });

    const clinic = await Clinic.findById(clinicId).select("owner");
    if (!clinic) return res.status(404).json({ message: "Клиника табылмады ❌" });

    if (String(clinic.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: "Тек клиника иесі қолжетімді ❌" });
    }
    req.clinic = clinic;
    next();
  } catch (e) {
    res.status(500).json({ message: "Сервер қатесі ❌", detail: e.message });
  }
};
