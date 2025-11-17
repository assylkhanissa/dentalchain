// backend/server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// .env файлын нақты жолмен жүктеу (server.js бекенд папкасында болса ../.env дұрыс)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// ============================
// 🚀 Негізгі тәуелділіктер
// ============================
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// 🔹 Маршруттар
import chatRoutes from "./routes/chatRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

// ============================
// ⚙️ Қолданбаны баптау
// ============================
const app = express();
const PORT = process.env.PORT || 5001;

// CORS баптамасын орталықтандырдық
const FRONT_ORIGIN = process.env.PUBLIC_APP_URL || "https://dentalchain-jj3v.vercel.app/clinics";

app.use(
  cors({
    origin: FRONT_ORIGIN,
    credentials: true,
  })
);

// Парсерлер — міндетті түрде ROUTES-тен бұрын
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(
      `[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`
    );
  });
  next();
});
// 📂 Uploads қалтасын статикалық ету (рентген суреттері үшін)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================
// 🧩 Маршруттар
// ============================
app.use("/api/chat", chatRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

// ============================
// 🧠 MongoDB қосылуы
// ============================
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI жоқ. .env файлын тексеріңіз.");
} else {
  mongoose
    .connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB-мен байланыс орнатылды"))
    .catch((err) => console.error("❌ MongoDB қатесі:", err));
}

// ============================
// 🧪 Тест маршруты
// ============================
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Сервер жұмыс істеп тұр ✅" });
});

// ============================
// 🟢 Серверді қосу
// ============================
app.listen(PORT, () => {
  console.log(`✅ Сервер ${PORT} портында қосылды`);
  console.log(`🔗 FRONT_ORIGIN = ${FRONT_ORIGIN}`);
});
