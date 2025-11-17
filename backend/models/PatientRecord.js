import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true }, // 👈 фикс
    procedure: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("PatientRecord", recordSchema);
