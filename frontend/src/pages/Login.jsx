import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../helpers/api";
import "../styles/AuthForm.css";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // ВАЖНО: используем api (axios instance с baseURL)
      const res = await api.post("/api/auth/login", form);
      const data = res?.data || {};

      const token = data.token;
      const user = data.user;

      // === Сохраняем токен ===
      if (token) localStorage.setItem("token", token);
      if (user) localStorage.setItem("user", JSON.stringify(user));

      setMessage(data.message || "Сәтті кірдіңіз");

      // малая задержка чтобы показать сообщение
      setTimeout(() => {
        if (user?.role === "admin") navigate("/admin");
        else if (user?.role === "owner") navigate("/owner/clinics");
        else navigate("/dashboard");
      }, 300);

    } catch (err) {
      console.error("LOGIN ERROR:", err);

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
    <div className="auth2-wrapper">
      <div className="auth2-card">
        <h2 className="auth2-title">🔒 Кіру</h2>

        <form onSubmit={handleSubmit} className="auth2-form">

          <input
            type="email"
            name="email"
            className="auth2-input"
            placeholder="Электронды пошта"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            className="auth2-input"
            placeholder="Құпия сөз"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button type="submit" className="auth2-btn" disabled={loading}>
            {loading ? "Жүктелуде..." : "Кіру"}
          </button>
        </form>

        <p className="auth2-hint">
          Тіркелмегенсіз бе?{" "}
          <Link to="/register" className="auth2-link">
            Тіркелу
          </Link>
        </p>

        {message && (
          <p
            className={`auth2-msg ${
              /қате|❌|error|invalid/i.test(message) ? "err" : "ok"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Login;
