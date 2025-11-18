import React, { useEffect, useState } from "react";
import api, { authHeaders } from "../helpers/api";
import { motion } from "framer-motion";
import {
  FaUser,
  FaCalendarAlt,
  FaTooth,
  FaStethoscope,
  FaMoneyBillWave,
  FaRegStickyNote,
} from "react-icons/fa";

const OwnerAppointments = () => {
  const [list, setList] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    performedWork: "",
    price: "",
    doctorName: "",
    tooth: "",
    recommendations: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/api/appointments/owner/mine", {
        headers: authHeaders(),
      });
      setList(res.data || []);
    } catch (err) {
      console.error("[OwnerAppointments] load error:", err.response?.data || err);
      setList([]);
    }
  };

  const openEdit = (appt) => {
    setEditing(appt._id);
    setForm({
      performedWork: appt.performedWork || "",
      price: appt.price ?? "",
      doctorName: appt.doctorName || "",
      tooth: appt.tooth || "",
      recommendations: appt.recommendations || appt.ownerComment || "",
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm({
      performedWork: "",
      price: "",
      doctorName: "",
      tooth: "",
      recommendations: "",
    });
  };

  const finalize = async (id) => {
    try {
      await api.patch(
        `/api/appointments/${id}/done`,
        {
          performedWork: form.performedWork,
          price: form.price ? Number(form.price) : undefined,
          doctorName: form.doctorName,
          tooth: form.tooth,
          recommendations: form.recommendations,
        },
        { headers: authHeaders() }
      );

      setList((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                performedWork: form.performedWork,
                price: form.price ? Number(form.price) : a.price,
                doctorName: form.doctorName,
                tooth: form.tooth,
                recommendations: form.recommendations,
                status: "done",
                completedAt: new Date().toISOString(),
              }
            : a
        )
      );
      cancelEdit();
    } catch (err) {
      console.error("[OwnerAppointments] finalize error:", err.response?.data || err);
      alert(err.response?.data?.message || "Ошибка при сохранении");
    }
  };

  return (
    <div
      style={{
        fontFamily: "Montserrat, sans-serif",
        padding: "60px 20px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: "center",
          color: "#023e8a",
          fontSize: "32px",
          marginBottom: "40px",
          fontWeight: "700",
        }}
      >
        📋 Өтініштер
      </motion.h2>

      {list.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            textAlign: "center",
            color: "#666",
            fontSize: "18px",
          }}
        >
          Өтініштер жоқ 😔
        </motion.p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
          }}
        >
          {list.map((a, index) => {
            const isEditing = editing === a._id;
            const statusColor =
              a.status === "done"
                ? "#06d6a0"
                : a.status === "pending"
                ? "#ffd166"
                : "#118ab2";

            return (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                style={{
                  background: "#fff",
                  borderRadius: "16px",
                  boxShadow: "0 6px 15px rgba(0,0,0,0.08)",
                  padding: "24px",
                }}
              >
                <div style={{ marginBottom: "10px" }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "600",
                      color: "#023e8a",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <FaUser /> Пациент: {a.patient?.fullName}
                  </h3>
                  <p
                    style={{
                      color: "#555",
                      fontSize: "14px",
                      marginLeft: "26px",
                    }}
                  >
                    {a.patient?.email}
                  </p>
                </div>

                <p style={{ color: "#333", fontSize: "15px", margin: "4px 0" }}>
                  <FaCalendarAlt style={{ color: "#0077b6", marginRight: "6px" }} />
                  {new Date(a.dateTime).toLocaleString("kk-KZ")}
                </p>

                <p style={{ color: statusColor, fontWeight: "600", marginTop: "8px" }}>
                  Статус: {a.status}
                </p>

                {a.doctorName && (
                  <p>
                    <FaStethoscope style={{ color: "#00b4d8", marginRight: "6px" }} />
                    Дәрігер: {a.doctorName}
                  </p>
                )}
                {a.tooth && (
                  <p>
                    <FaTooth style={{ color: "#00b4d8", marginRight: "6px" }} />
                    Зуб: {a.tooth}
                  </p>
                )}
                {a.performedWork && <p>Жұмыс: {a.performedWork}</p>}
                {typeof a.price === "number" && (
                  <p>
                    <FaMoneyBillWave style={{ color: "#06d6a0", marginRight: "6px" }} />
                    Баға: {a.price} ₸
                  </p>
                )}
                {a.recommendations && (
                  <p>
                    <FaRegStickyNote style={{ color: "#0077b6", marginRight: "6px" }} />
                    Ұсыныстар: {a.recommendations}
                  </p>
                )}

                {!isEditing && a.status !== "done" && (
                  <button
                    onClick={() => openEdit(a)}
                    style={{
                      background: "#0077b6",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 14px",
                      marginTop: "12px",
                      cursor: "pointer",
                    }}
                  >
                    ✏️ Өңдеу
                  </button>
                )}

                {isEditing && (
                  <div style={{ marginTop: "16px", display: "grid", gap: "10px" }}>
                    <input
                      placeholder="Имя врача"
                      value={form.doctorName}
                      onChange={(e) => setForm((p) => ({ ...p, doctorName: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Зуб (16, 27)"
                      value={form.tooth}
                      onChange={(e) => setForm((p) => ({ ...p, tooth: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      placeholder="Атқарылған жұмыс"
                      value={form.performedWork}
                      onChange={(e) => setForm((p) => ({ ...p, performedWork: e.target.value }))}
                      style={inputStyle}
                    />
                    <input
                      type="number"
                      placeholder="Баға (₸)"
                      value={form.price}
                      onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                      style={inputStyle}
                    />
                    <textarea
                      placeholder="Ұсыныстар"
                      value={form.recommendations}
                      onChange={(e) => setForm((p) => ({ ...p, recommendations: e.target.value }))}
                      rows={3}
                      style={{ ...inputStyle, resize: "none" }}
                    />

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => finalize(a._id)} style={finalizeBtnStyle}>
                        ✅ Аяқтау
                      </button>
                      <button onClick={cancelEdit} style={cancelBtnStyle}>
                        ❌ Болдырмау
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputStyle = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
};

const finalizeBtnStyle = {
  flex: 1,
  background: "#06d6a0",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const cancelBtnStyle = {
  flex: 1,
  background: "#adb5bd",
  color: "white",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  cursor: "pointer",
};

export default OwnerAppointments;
