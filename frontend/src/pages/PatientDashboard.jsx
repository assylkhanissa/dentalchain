// frontend/src/pages/PatientDashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const API = "https://dentalchain.onrender.com";

const PatientDashboard = () => {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || null;
    } catch {
      return null;
    }
  });
  const [token] = useState(() => localStorage.getItem("token") || "");

  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [xrayImages, setXrayImages] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !token) navigate("/login");
  }, [user, token, navigate]);

  // свои X-ray
  useEffect(() => {
    const fetchXrays = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API}/api/patients/xray/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setXrayImages(res.data?.xrayImages || []);
      } catch (err) {
        console.error("X-ray load error:", err);
        setMessage(
          err.response?.data?.message || "❌ Рентгендерді жүктеу қатесі"
        );
      }
    };
    fetchXrays();
  }, [token]);

  // все мои заявки (и автоматически заполнение completedAppointments)
  useEffect(() => {
    const fetchMyAppointments = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // ожидается, что backend вернёт массив записей текущего пользователя
        const res = await axios.get(`${API}/api/appointments/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const items = Array.isArray(res.data) ? res.data : res.data.items || [];
        setMyAppointments(items);

        const done = items.filter(
          (a) =>
            a.status === "done" ||
            a.status === "completed" ||
            a.status === "завершено"
        );
        setCompletedAppointments(done);
      } catch (err) {
        console.error("Appointments load error:", err);
        setMessage(
          err.response?.data?.message ||
            (err.response?.status === 403
              ? "❌ Рұқсат жоқ"
              : "❌ Қабылдаулар қатесі")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyAppointments();
  }, [token]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setMessage("❌ Алдымен файл таңдаңыз!");

    const formData = new FormData();
    formData.append("xray", file);

    try {
      const res = await axios.post(
        `${API}/api/patients/upload-xray`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data?.message || "✅ Рентген жүктелді");
      setXrayImages(res.data?.xrayImages || []);
      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage(err.response?.data?.message || "❌ Жүктеу қатесі");
    }
  };

  const filenameFromPath = (p) => {
    try {
      return p.split("/").pop();
    } catch {
      return "";
    }
  };

  const deleteXray = async (imgPath) => {
    const fname = filenameFromPath(imgPath);
    if (!fname) return;
    if (!window.confirm("Бұл рентгенді өшіру керек пе?")) return;

    try {
      const res = await axios.delete(`${API}/api/patients/xray/${fname}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setXrayImages(res.data?.xrayImages || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Өшіру қатесі ❌");
    }
  };

  const cancelAppointment = async (appointmentId) => {
    if (!window.confirm("Бұл жазбаны шын мәнінде болдырмау керек пе?")) return;

    try {
      // backend должен позволять пациенту удалить/отменить свою запись по ID
      const res = await axios.delete(
        `${API}/api/appointments/${appointmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // обновляем локально список (если backend вернул обновлённый массив — используем его)
      if (Array.isArray(res.data)) {
        setMyAppointments(res.data);
      } else {
        setMyAppointments((prev) =>
          prev.filter((a) => a._id !== appointmentId && a.id !== appointmentId)
        );
      }

      setMessage(res.data?.message || "Өтініш сәтті жойылды");
    } catch (err) {
      console.error("Cancel appointment error:", err);
      alert(err.response?.data?.message || "Өшіру қатесі ❌");
    }
  };

  if (!user) return null;

  return (
    <div className="patient-dashboard">
      <div className="patient-header">
        <div className="patient-user-info">
          <img
            className="patient-avatar"
            alt="avatar"
            src="https://api.dicebear.com/9.x/thumbs/svg?seed=dental"
          />
          <div>
            <h2 className="patient-name">Сәлем, {user.fullName}! 🦷</h2>
            <p>Бұл — сіздің жеке кабинеңіз</p>
          </div>
        </div>
        <button
          className="patient-logout-btn"
          onClick={() => {
            localStorage.clear();
            navigate("/login");
          }}
        >
          Шығу
        </button>
      </div>

      {/* upload */}
      <div className="patient-upload-card">
        <h3>📤 Рентген суретін жүктеу</h3>
        <form onSubmit={handleUpload} className="patient-upload-form">
          <input
            type="file"
            className="patient-file-input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button type="submit" className="patient-upload-btn">
            Жүктеу
          </button>
        </form>
        {message && <p className="patient-status-msg">{message}</p>}
      </div>

      {/* gallery */}
      <div className="patient-gallery-card">
        <h3>📁 Менің рентген суреттерім</h3>
        {xrayImages.length > 0 ? (
          <div className="patient-xray-gallery">
            {xrayImages.map((img, i) => (
              <div className="patient-xray-item" key={i}>
                <img
                  src={`${API}${img}`}
                  alt={`xray-${i}`}
                  className="patient-xray-img"
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "10px",
                    marginTop: 8,
                  }}
                >
                  <a
                    href={`${API}${img}`}
                    download
                    className="patient-upload-btn"
                    style={{
                      background: "#0077b6",
                      textDecoration: "none",
                      textAlign: "center",
                    }}
                  >
                    Жүктеу
                  </a>

                  <button
                    className="patient-upload-btn"
                    style={{ background: "#d64545" }}
                    onClick={() => deleteXray(img)}
                  >
                    Өшіру
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="patient-no-images">Суреттер жүктелмеген 😔</p>
        )}
      </div>

      {/* my appointments */}
      <div className="patient-appointments-section">
        <h3>🗓 Менің өтініштерім</h3>

        {loading ? (
          <p>Жүктеліп жатыр...</p>
        ) : myAppointments.length > 0 ? (
          <div className="patient-appointments-list">
            {myAppointments.map((app) => (
              <div key={app._id || app.id} className="patient-appointment-card">
                <h4>{app.clinic?.name || "Клиника"}</h4>
                <p>
                  <strong>Күні/Уақыты:</strong>{" "}
                  {app.dateTime ? new Date(app.dateTime).toLocaleString() : "—"}
                </p>
                <p>
                  <strong>Мәртебесі:</strong> {app.status || "—"}
                </p>
                <p>
                  <strong>Ескерту:</strong> {app.note || "—"}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 12,
                    width: "100%",
                  }}
                >
                  {["pending", "waiting", "scheduled", "created"].includes(
                    String(app.status).toLowerCase()
                  ) && (
                    <button
                      className="patient-upload-btn"
                      style={{
                        background: "#d64545",
                        minWidth: "140px",
                        textAlign: "center",
                      }}
                      onClick={() => cancelAppointment(app._id || app.id)}
                    >
                      Бас тарту
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="patient-no-appointments">Сізде әлі жазбалар жоқ 😌</p>
        )}
      </div>

      {/* history (completed) */}
      <div className="patient-appointments-section" style={{ marginTop: 20 }}>
        <h3>🩺 Аяқталған қабылдаулар</h3>
        {completedAppointments.length > 0 ? (
          <div className="patient-appointments-list">
            {completedAppointments.map((app, index) => (
              <div key={index} className="patient-appointment-card">
                <h4>{app.clinic?.name || "Клиника"}</h4>
                <p>
                  <strong>Күні:</strong>{" "}
                  {app.dateTime
                    ? new Date(app.dateTime).toLocaleDateString()
                    : "—"}
                </p>
                <p>
                  <strong>Дәрігер:</strong> {app.doctorName || "Белгісіз"}
                </p>
                <p>
                  <strong>Жұмыс:</strong> {app.performedWork || "—"}
                </p>
                <p>
                  <strong>Ұсыныстар:</strong> {app.recommendations || "—"}
                </p>
                <p>
                  <strong>Баға:</strong> {app.price ? `${app.price} ₸` : "—"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="patient-no-appointments">
            Профильде әзірше аяқталған өтінім жоқ 😌
          </p>
        )}
      </div>

      <div className="patient-actions">
        <button onClick={() => navigate("/")} className="patient-back-btn">
          ⬅️ Басты бетке оралу
        </button>
      </div>
    </div>
  );
};

export default PatientDashboard;
