import mongoose from "mongoose";

const xraySchema = new mongoose.Schema(
  {
    patientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: { type: String, required: true },
    meta: {
      originalName: String,
      mimeType: String,
      size: Number,
    },
  },
  { timestamps: true }
);

xraySchema.index({ patientUser: 1, createdAt: -1 });

export const Xray = mongoose.model("Xray", xraySchema);
