// frontend/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../helpers/api"; // используем единый axios instance
import "../styles/AuthForm.css";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // Отправляем регистрацию (фиксируем роль patient)
      const regRes = await api.post("/api/auth/register", {
        ...form,
        role: "patient",
      });

      const regData = regRes?.data || {};
      setMessage(regData.message || "Тіркелу сәтті өтті ✅");

      // Авто-логин после успешной регистрации
      try {
        const loginRes = await api.post("/api/auth/login", {
          email: form.email,
          password: form.password,
        });

        const loginData = loginRes?.data || {};
        const token = loginData.token;
        const user = loginData.user;

        if (token) localStorage.setItem("token", token);
        if (user)
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: user._id || user.id || user?.id,
              fullName: user.fullName || user.name || "",
              role: user.role || "patient",
              email: user.email || form.email,
            })
          );

        setMessage(loginData.message || "Сәтті кірдіңіз ✅");

        setTimeout(() => {
          navigate("/dashboard");
        }, 450);
      } catch (loginErr) {
        // Если авто-логин не прошёл — показываем сообщение, но ничего критичного
        console.warn("Auto-login failed:", loginErr);
        setMessage(
          (loginErr?.response?.data?.message || "Авто-кіру мүмкін болмады") +
            " — Кіру үшін жүйеге қайта кіріңіз."
        );
        // Если токен всё же пришёл в рег ответ, сохраним
        if (regData.token) {
          localStorage.setItem("token", regData.token);
          if (regData.user) localStorage.setItem("user", JSON.stringify(regData.user));
          setTimeout(() => navigate("/dashboard"), 450);
        }
      }
    } catch (err) {
      console.error("REGISTER ERROR:", err);
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Қате орын алды ❌";
      setMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>📝 Тіркелу</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Атыңыз"
            value={form.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Электронды пошта"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Құпия сөз"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Жүктелуде..." : "Тіркелу"}
          </button>
        </form>

        <p>
          Аккаунтыңыз бар ма?{" "}
          <span className="auth-link" onClick={() => navigate("/login")}>
            Кіру
          </span>
        </p>

        {message && (
          <p
            style={{
              color: /қате|❌|error|invalid/i.test(message) ? "red" : "green",
              fontWeight: "bold",
              marginTop: "10px",
            }}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
