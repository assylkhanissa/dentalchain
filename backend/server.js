// backend/server.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env (файл рядом с корнем репозитория)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// маршруты
import chatRoutes from "./routes/chatRoutes.js";
import clinicRoutes from "./routes/clinicRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();
const PORT = process.env.PORT || 5001;

/**
 * CORS
 *
 * PUBLIC_APP_URL can be a single origin or a comma-separated list of origins.
 * Examples:
 *   PUBLIC_APP_URL=https://dentalchain-jj3v.vercel.app
 *   PUBLIC_APP_URL=https://dentalchain-jj3v.vercel.app,https://staging.example.com
 *
 * IMPORTANT: do NOT include paths (like /api/clinics) — only origin (scheme + host + optional port).
 */
const rawPublic = process.env.PUBLIC_APP_URL || "";
const FRONT_ORIGINS = rawPublic
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// debug
console.log("CORS: PUBLIC_APP_URL raw:", rawPublic);
console.log("CORS: allowed FRONT_ORIGINS:", FRONT_ORIGINS);

// cors options with dynamic origin check
const corsOptions = {
  origin: function (origin, callback) {
    // origin === undefined for same-origin requests (e.g., curl without Origin)
    if (!origin) {
      // allow non-browser tools or same-origin
      return callback(null, true);
    }

    // if whitelist provided, check it strictly
    if (FRONT_ORIGINS.length > 0) {
      if (FRONT_ORIGINS.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn("CORS: blocked origin:", origin);
        return callback(new Error("Not allowed by CORS"), false);
      }
    }

    // no whitelist — reflect origin (DEV convenience). Be careful in production.
    console.warn("CORS: no whitelist configured — reflecting origin for:", origin);
    return callback(null, true);
  },
  credentials: true,
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
};

// apply CORS middleware
app.use(cors(corsOptions));

// quick middleware to log origin for debug
app.use((req, res, next) => {
  const origin = req.header("Origin");
  if (origin) {
    // small log to help debug CORS problems (can be removed later)
    console.log("[CORS-DEBUG] request Origin:", origin, "url:", req.originalUrl);
  }
  next();
});

// Парсеры — обязательно до маршрутов
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// логирование времени ответа
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
});

// статические файлы для uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// маршруты
app.use("/api/chat", chatRoutes);
app.use("/api/clinics", clinicRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admin", adminRoutes);

// MongoDB
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

// тест маршрут
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Сервер жұмыс істеп тұр ✅" });
});

// 404 fallback (json)
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// глобальный обработчик ошибок (включая CORS ошибку от cors())
app.use((err, req, res, next) => {
  console.error("Server error:", err && (err.message || err));
  if (err && err.message && err.message.indexOf("CORS") !== -1) {
    return res.status(403).json({ message: "CORS blocked", detail: err.message });
  }
  res.status(500).json({ message: "Server error", detail: err?.message || err });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер ${PORT} портында қосылды`);
  console.log(`🔗 FRONT_ORIGINS = ${FRONT_ORIGINS.length ? FRONT_ORIGINS.join(",") : "(none configured)"}`);
});
