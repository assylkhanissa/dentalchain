import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    clinic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dateTime: { type: Date, required: true },
    note: String,

    doctorName: String,
    tooth: String,
    performedWork: String,
    price: Number,
    recommendations: String,

    status: {
      type: String,
      enum: ["pending", "processing", "done"],
      default: "pending",
      index: true,
    },
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
