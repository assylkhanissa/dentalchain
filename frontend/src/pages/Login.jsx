import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthForm.css"; // важно: путь верный

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", form);
      const { token, user, message } = res.data || {};
      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      setMessage(message || "Сәтті кірдіңіз ✅");

      setTimeout(() => {
        if (user?.role === "admin") navigate("/admin");
        else if (user?.role === "owner") navigate("/owner/clinics");
        else navigate("/dashboard");
      }, 400);
    } catch (err) {
      setMessage(err.response?.data?.message || "Қате орын алды ❌");
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
