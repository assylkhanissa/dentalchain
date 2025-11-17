// frontend/src/pages/AdminAddClinic.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminAddClinic = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const token = localStorage.getItem("token");
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    description: "",
    imageUrl: "",
  });
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");
  const [clinics, setClinics] = useState([]);

  const isAdmin = user?.role === "admin";

  const loadClinics = async () => {
    try {
      const res = await axios.get("/api/clinics");
      setClinics(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadClinics();
  }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    if (!isAdmin) {
      return setMsg("Тек админге рұқсат ❌");
    }

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (file) fd.append("image", file); // поле файла: image

      const res = await axios.post("/api/clinics", fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setMsg(res.data.message || "Клиника қосылды ✅");
      setForm({ name: "", email: "", address: "", phone: "", description: "", imageUrl: "" });
      setFile(null);
      loadClinics();
    } catch (err) {
      setMsg(err.response?.data?.message || "Қате ❌");
    }
  };

  if (!isAdmin) return <p style={{ padding: 20 }}>Тек админге рұқсат ❌</p>;

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Админ панель — Клиника қосу</h1>

      <form onSubmit={submit} style={{ display: "grid", gap: 10, maxWidth: 600, marginBottom: 30 }}>
        <input name="name" placeholder="Атауы *" value={form.name} onChange={handleChange} required />
        <input name="email" placeholder="Email *" value={form.email} onChange={handleChange} required />
        <input name="address" placeholder="Мекенжай" value={form.address} onChange={handleChange} />
        <input name="phone" placeholder="Телефон" value={form.phone} onChange={handleChange} />
        <textarea name="description" placeholder="Сипаттама" value={form.description} onChange={handleChange} />
        <input
          name="imageUrl"
          placeholder="Image URL (если без файла)"
          value={form.imageUrl}
          onChange={handleChange}
        />
        <div>
          <label>Фото клиники (jpg/png): </label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <button type="submit">Қосу</button>
      </form>

      {msg && <p>{msg}</p>}

      <h2>Бар клиникалар</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {clinics.map((c) => (
          <div key={c._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "flex", gap: 12 }}>
            <img
              src={c.image || "/default-clinic.jpg"}
              alt={c.name}
              style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
            />
            <div>
              <strong>{c.name}</strong> — {c.email}
              <div>📍 {c.address || "-"}</div>
              <div>☎ {c.phone || "-"}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAddClinic;
