import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      // ✅ Отправляем с фиксированной ролью "patient"
      const regRes = await axios.post("/api/auth/register", {
        ...form,
        role: "patient",
      });

      setMessage(regRes.data?.message || "Тіркелу сәтті өтті ✅");

      // ✅ Авто-логин
      const loginRes = await axios.post("/api/auth/login", {
        email: form.email,
        password: form.password,
      });

      const { token, user, message: loginMsg } = loginRes.data || {};

      if (token && user) {
        localStorage.setItem("token", token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            id: user.id,
            fullName: user.fullName,
            role: user.role,
            email: user.email,
          })
        );
      }

      setMessage(loginMsg || "Сәтті кірдіңіз ✅");

      setTimeout(() => {
        navigate("/dashboard");
      }, 600);
    } catch (err) {
      setMessage(err.response?.data?.message || "Қате орын алды ❌");
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
              color: /қате|❌/i.test(message) ? "red" : "green",
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
