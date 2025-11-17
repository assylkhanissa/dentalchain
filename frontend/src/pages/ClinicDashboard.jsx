import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Dashboard.css";

const ClinicDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5001/api/appointments/owner/mine",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAppointments(res.data || []);
      } catch (err) {
        console.error("Clinic appointments load error:", err);
        setMessage("❌ Пациенттерді алу кезінде қате шықты");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  return (
    <div className="clinic-dashboard">
      <h2 className="clinic-title">🏥 Клиника панелі</h2>
      <p className="clinic-subtitle">Тіркелген пациенттердің карталары</p>

      {loading ? (
        <p>⏳ Жүктеліп жатыр...</p>
      ) : appointments.length > 0 ? (
        <div className="patient-appointments-list">
          {appointments.map((app, index) => (
            <div key={index} className="patient-appointment-card">
              <h4>{app.patient?.fullName || "Пациент"}</h4>
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
        <p className="no-patients">Пациенттер әзірше тіркелмеген 😌</p>
      )}

      {message && <p className="clinic-message">{message}</p>}
    </div>
  );
};

export default ClinicDashboard;
