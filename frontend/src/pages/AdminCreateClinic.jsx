import React, { useState } from "react";
import axios, { authHeaders } from "../helpers/api";
import "../styles/AdminCreateClinic.css";
import { FaClinicMedical } from "react-icons/fa";

const AdminCreateClinic = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    description: "",
    imageUrl: "",
    ownerEmail: "",
    ownerFullName: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null); // 👈 preview image
  const [msg, setMsg] = useState("");

  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user || user.role !== "admin") {
    return <div className="admin-warning">Бұл бет тек админ үшін.</div>;
  }

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f);
    if (f) {
      setPreview(URL.createObjectURL(f)); // 👈 показываем превью
    } else {
      setPreview(null);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (file) fd.append("image", file);

      const res = await axios.post("/api/clinics", fd, {
        headers: {
          ...authHeaders(),
          "Content-Type": "multipart/form-data",
        },
      });

      const temp = res.data?.ownerTempPassword
        ? ` (Owner уақытша пароль: ${res.data.ownerTempPassword})`
        : "";

      setMsg((res.data?.message || "✅ Клиника құрылды") + temp);

      setForm({
        name: "",
        email: "",
        address: "",
        phone: "",
        description: "",
        imageUrl: "",
        ownerEmail: "",
        ownerFullName: "",
      });
      setFile(null);
      setPreview(null);
    } catch (err) {
      setMsg(err.response?.data?.message || "❌ Қате орын алды");
    }
  };

  return (
    <div className="clinic-page">
      <div className="clinic-box">
        <h2>
          <FaClinicMedical /> Клиника құру
        </h2>

        <form className="clinic-form" onSubmit={submit}>
          <div className="clinic-row">
            <div className="clinic-col">
              <label>Атауы</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="clinic-col">
              <label>Клиника Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="clinic-row">
            <div className="clinic-col">
              <label>Owner Email</label>
              <input
                type="email"
                name="ownerEmail"
                value={form.ownerEmail}
                onChange={handleChange}
                required
              />
            </div>
            <div className="clinic-col">
              <label>Owner аты (опционал)</label>
              <input
                name="ownerFullName"
                value={form.ownerFullName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="clinic-row">
            <div className="clinic-col">
              <label>Мекенжай</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
              />
            </div>
            <div className="clinic-col">
              <label>Телефон</label>
              <input name="phone" value={form.phone} onChange={handleChange} />
            </div>
          </div>

          <div className="clinic-col">
            <label>Сипаттама</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="clinic-col">
            <label>Сурет URL</label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://... немесе /uploads/..."
            />
          </div>

          <div className="clinic-col">
            <label>Немесе суретті жүктеңіз</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </div>

          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
            </div>
          )}

          <button type="submit" className="clinic-btn">
            Құру
          </button>

          {msg && (
            <p
              className={`clinic-msg ${
                /қате|❌/i.test(msg) ? "error" : "success"
              }`}
            >
              {msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default AdminCreateClinic;
