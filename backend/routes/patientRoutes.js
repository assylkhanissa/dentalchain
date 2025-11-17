// backend/routes/patientRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { auth } from "../middleware/auth.js";

const router = express.Router();

/** ========= uploads/xrays ========= */
const xrayDir = path.resolve("uploads/xrays");
if (!fs.existsSync(xrayDir)) fs.mkdirSync(xrayDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, xrayDir),
  filename: (_, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

/** ========= "БД" JSON ========= */
const dbFile = path.resolve("uploads/xrays/data.json");
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify({}));

const readDB = () => {
  try {
    return JSON.parse(fs.readFileSync(dbFile, "utf-8"));
  } catch {
    return {};
  }
};
const writeDB = (data) =>
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

/** ========= Список X-ray ТЕКУЩЕГО пациента =========
 * GET /api/patients/xray/mine
 */
router.get("/xray/mine", auth("patient"), async (req, res) => {
  try {
    const email = req.user.email; // из токена
    const db = readDB();
    res.json({ xrayImages: db[email] || [] });
  } catch (e) {
    res.status(500).json({ message: "Қате орын алды ❌", error: e.message });
  }
});

/** ========= Загрузить X-ray для текущего пациента =========
 * POST /api/patients/upload-xray  (form-data: xray)
 */
router.post(
  "/upload-xray",
  auth("patient"),
  upload.single("xray"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "Файл қажет ❌" });

      const email = req.user.email;
      const db = readDB();
      if (!db[email]) db[email] = [];

      const imagePath = `/uploads/xrays/${req.file.filename}`;
      db[email].push(imagePath);
      writeDB(db);

      res.json({ message: "✅ Сурет сәтті жүктелді!", xrayImages: db[email] });
    } catch (e) {
      res.status(500).json({ message: "Жүктеу қатесі ❌", error: e.message });
    }
  }
);

/** ========= Удалить свой X-ray по имени файла =========
 * DELETE /api/patients/xray/:filename
 */
router.delete("/xray/:filename", auth("patient"), async (req, res) => {
  try {
    const email = req.user.email;
    const filename = req.params.filename;
    const db = readDB();

    if (!db[email])
      return res.status(404).json({ message: "Файл табылмады ❌" });

    // удаляем из JSON
    const before = db[email].length;
    db[email] = db[email].filter((p) => !p.endsWith("/" + filename));
    if (db[email].length === before) {
      return res.status(404).json({ message: "Файл табылмады ❌" });
    }
    writeDB(db);

    // удаляем физический файл
    const fullPath = path.join(xrayDir, filename);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);

    res.json({ message: "🗑️ Файл жойылды", xrayImages: db[email] });
  } catch (e) {
    res.status(500).json({ message: "Жою қатесі ❌", error: e.message });
  }
});

export default router;
