// src/pages/Clinics.jsx
import React, { useEffect, useState } from "react";
import api from "../helpers/api"; // вместо axios — ваш инстанс
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaPhone,
  FaCalendarAlt,
  FaClock,
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "../styles/Clinics.css";
import toothIcon from "../assets/tooth.svg";
import { getImageUrl } from "../helpers/baseUrl";

// fix leaflet marker 404
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// custom small clinic icon (uses provided tooth.svg if exists)
const clinicIcon = new L.Icon({
  iconUrl: toothIcon || markerIcon,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  className: "tooth-marker",
});

const DEFAULT_CENTER = [43.2389, 76.8897];

const Clinics = () => {
  const [clinics, setClinics] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [form, setForm] = useState({ date: "", time: "", note: "" });

  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Утилита: попробовать достать [lat, lng] из разных возможных форматов
  const getLatLng = (clinic) => {
    if (!clinic) return null;

    // 1) объект { location: { lat, lng } }
    if (clinic.location && typeof clinic.location === "object") {
      if (clinic.location.lat != null && clinic.location.lng != null) {
        return [Number(clinic.location.lat), Number(clinic.location.lng)];
      }

      // 2) GeoJSON: { location: { type: 'Point', coordinates: [lng, lat] } }
      if (
        Array.isArray(clinic.location.coordinates) &&
        clinic.location.coordinates.length >= 2
      ) {
        const [lng, lat] = clinic.location.coordinates;
        return [Number(lat), Number(lng)];
      }
    }

    // 3) plain array: location: [lng, lat] OR clinic.location could be an array
    if (Array.isArray(clinic.location) && clinic.location.length >= 2) {
      const [lng, lat] = clinic.location;
      return [Number(lat), Number(lng)];
    }

    // 4) maybe stored as coordinates on root: clinic.coordinates = [lng, lat]
    if (Array.isArray(clinic.coordinates) && clinic.coordinates.length >= 2) {
      const [lng, lat] = clinic.coordinates;
      return [Number(lat), Number(lng)];
    }

    // fallback
    return null;
  };

  useEffect(() => {
    let mounted = true;
    api
      .get("/api/clinics")
      .then((res) => {
        if (!mounted) return;
        const data = Array.isArray(res.data) ? res.data : res.data.items || [];
        setClinics(data);
        if (data.length) {
          console.log("First clinic (raw):", data[0]);
          console.log("getLatLng for first clinic:", getLatLng(data[0]));
        }
      })
      .catch((err) => {
        console.error("Clinics load error:", err);
        alert("Ошибка загрузки клиник — см. консоль");
      });
    return () => {
      mounted = false;
    };
  }, []);

  const onBookClick = (clinic) => {
    if (!user) return alert("Алдымен жүйеге кіріңіз");
    if (user.role !== "patient") return alert("Тек пациент жазыла алады");
    setSelectedClinic(clinic);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelectedClinic(null);
    setForm({ date: "", time: "", note: "" });
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!selectedClinic) return alert("Клиника не выбрана");

    if (!form.date || !form.time) {
      return alert("Толығымен күн мен уақытты таңдаңыз");
    }

    // формируем ISO строку (локальное время)
    const dateTimeString = `${form.date}T${form.time}:00`;
    const dateObj = new Date(dateTimeString);
    if (isNaN(dateObj.getTime())) {
      return alert("Невалидная дата/время");
    }

    try {
      // ВАЖНО: бек ожидает поле "clinic" (id) и dateTime
      const payload = {
        clinic: selectedClinic._id || selectedClinic.id,
        dateTime: dateObj.toISOString(),
        note: form.note || "",
      };

      console.log("Booking payload:", payload);

      const res = await api.post("/api/appointments", payload);
      alert(res.data?.message || "Өтініш сәтті жіберілді");
      closeModal();
    } catch (err) {
      console.error("Booking error:", err);
      const serverMsg = err.response?.data?.message || err.message;
      alert(serverMsg || "Қате орын алды");
    }
  };

  return (
    <div className="clinics-container">
      <h1 className="clinics-title">Біздің клиникалар</h1>

      <div className="clinic-list">
        {clinics.map((clinic, index) => {
          const latLng = getLatLng(clinic);
          const center = latLng || DEFAULT_CENTER;

          return (
            <motion.div
              key={clinic._id || clinic.id || index}
              className="clinic-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <img
                src={
                  clinic.image ? getImageUrl(clinic.image) : "/default-clinic.jpg"
                }
                alt={clinic.name}
                className="clinic-img"
                onError={(e) => (e.currentTarget.src = "/default-clinic.jpg")}
              />

              <h2>{clinic.name}</h2>
              <p className="clinic-desc">{clinic.description || "—"}</p>

              <div className="clinic-info">
                <p>
                  <FaMapMarkerAlt /> {clinic.address || "—"}
                </p>
                <p>
                  <FaPhone /> {clinic.phone || "—"}
                </p>
              </div>

              <div className="clinic-map">
                <MapContainer
                  center={center}
                  zoom={13}
                  scrollWheelZoom={false}
                  style={{ height: "200px", width: "100%" }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap"
                  />
                  <Marker position={center} icon={clinicIcon}>
                    <Popup>
                      <strong>{clinic.name}</strong>
                      <div style={{ marginTop: 6 }}>{clinic.address || "—"}</div>
                      <div style={{ marginTop: 6 }}>
                        <a href={`tel:${clinic.phone || ""}`}>{clinic.phone || ""}</a>
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button className="book-btn" onClick={() => onBookClick(clinic)}>
                  Жазылу
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {open && selectedClinic && (
          <motion.div
            className="modal-bg"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ zIndex: 1200 }}
          >
            <motion.div
              className="modal-card"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <h3>Клиникаға жазылу</h3>
              <h2>{selectedClinic.name}</h2>

              <form onSubmit={submitBooking}>
                <label>
                  <FaCalendarAlt /> Күні:
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </label>

                <label>
                  <FaClock /> Уақыты:
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Сипаттама:
                  <textarea
                    placeholder="Мысалы: тіс ауырады..."
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </label>

                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <button type="submit" className="book-btn">
                    Жіберу
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    Болдырмау
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Clinics;
