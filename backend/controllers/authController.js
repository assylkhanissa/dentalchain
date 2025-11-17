import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const send400 = (res, msg) => res.status(400).json({ message: msg });

// 🔹 ТІРКЕЛУ
export const register = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;
    if (!fullName || !email || !password || !role)
      return send400(res, "Барлық өрісті толтырыңыз ❌");

    const existing = await User.findOne({ email });
    if (existing) return send400(res, "Бұл email тіркелген ❌");

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, password: hashed, role });

    res.status(201).json({
      message: "Тіркелу сәтті өтті ✅",
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Сервер қатесі ❌" });
  }
};

// 🔹 КІРУ
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return send400(res, "Email мен құпия сөзді енгізіңіз ❌");

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Қолданушы табылмады ❌" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return send400(res, "Құпия сөз қате ❌");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Сәтті кірдіңіз ✅",
      token,
      user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Сервер қатесі ❌" });
  }
};
