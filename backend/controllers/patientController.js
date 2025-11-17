import PatientRecord from "../models/PatientRecord.js";

export const getPatientRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await PatientRecord.find({ patient: id })
      .populate("clinic", "name")
      .sort({ createdAt: -1 });

    res.json({
      records: records.map(r => ({
        clinicName: r.clinic?.name || "Белгісіз клиника",
        procedure: r.procedure,
        date: new Date(r.createdAt).toLocaleDateString("kk-KZ"),
      })),
    });
  } catch (error) {
    console.error("Қате:", error);
    res.status(500).json({ message: "Сервер қатесі", error: error.message });
  }
};
