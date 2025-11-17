// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Универсальный мидлвар авторизации.
 * Использование:
 *   router.get("/path", auth(), handler)               // только авторизованным
 *   router.get("/admin", auth("admin"), handler)       // только админам
 *   router.get("/owner", auth("owner"), handler)       // только владельцам
 *   router.get("/patient", auth("patient"), handler)   // только пациентам
 */
export const auth = (requiredRole = null) => {
  return async (req, res, next) => {
    try {
      const header = req.headers?.authorization || req.headers?.Authorization;
      if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Токен табылмады ❌" });
      }

      const token = header.split(" ")[1];
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (e) {
        return res.status(401).json({ message: "Жарамсыз токен ❌" });
      }

      const user = await User.findById(decoded.id).select(
        "role email fullName"
      );
      if (!user) {
        return res.status(404).json({ message: "Пайдаланушы табылмады ❌" });
      }

      // Пробрасываем пользователя в запрос
      req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        fullName: user.fullName,
      };

      // Если требуется конкретная роль — проверяем
      if (requiredRole && user.role !== requiredRole) {
        return res
          .status(403)
          .json({ message: `Рұқсат жоқ (${requiredRole} үшін ғана) ❌` });
      }

      return next();
    } catch (error) {
      console.error("Auth error:", error);
      return res.status(401).json({ message: "Авторизация қатесі ❌" });
    }
  };
};

/**
 * Если где-то хочется отдельной проверки роли поверх уже прошедшего auth():
 *   router.get("/admin-only", auth(), requireRole("admin"), handler)
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Авторизация қажет ❌" });
    }
    if (req.user.role !== role) {
      return res
        .status(403)
        .json({ message: `Рұқсат жоқ (${role} үшін ғана) ❌` });
    }
    next();
  };
};
