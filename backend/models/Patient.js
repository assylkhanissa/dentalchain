import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: String,
  allergies: [String],
  medicalHistory: [
    {
      date: Date,
      treatment: String,
      doctor: String,
      notes: String,
    },
  ],
  xrayImages: [String], // сурет сілтемелері
}, { timestamps: true });

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
