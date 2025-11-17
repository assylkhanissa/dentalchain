// backend/models/Clinic.js
import mongoose from "mongoose";

const clinicSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    address: String,
    phone: String,
    description: String,
    image: String,
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // добавляем координаты (опционально)
    location: {
      type: {
        lat: Number,
        lng: Number,
      },
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Clinic", clinicSchema);
