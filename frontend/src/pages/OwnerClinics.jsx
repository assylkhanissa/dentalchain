import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios, { authHeaders } from "../helpers/api";
import { motion } from "framer-motion";
import { FaClinicMedical, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";

const OwnerClinics = () => {
  const [list, setList] = useState([]);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    if (!user || user.role !== "owner") return;
    axios
      .get("/api/clinics/owner/mine/list", { headers: authHeaders() })
      .then((res) => setList(res.data || []))
      .catch((err) => console.error(err.response?.data || err));
  }, [user]);

  if (!user || user.role !== "owner") {
    return (
      <div className="text-center text-gray-700 mt-20 text-lg">
        Бұл бет тек клиника иесі үшін 🧑‍⚕
      </div>
    );
  }

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
        transition={{ duration: 0.6 }}
        style={{
          textAlign: "center",
          color: "#023e8a",
          fontSize: "32px",
          marginBottom: "40px",
          fontWeight: "700",
        }}
      >
        🏥 Менің клиникаларым
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
          Клиникалар табылған жоқ 😔
        </motion.p>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          }}
        >
          {list.map((c, index) => (
            <motion.div
              key={c._id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              style={{
                background: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 6px 15px rgba(0,0,0,0.08)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
              }}
              whileHover={{
                scale: 1.03,
                boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ marginBottom: "16px" }}>
                <h3
                  style={{
                    fontSize: "22px",
                    color: "#0077b6",
                    marginBottom: "8px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FaClinicMedical /> {c.name}
                </h3>
                <p
                  style={{
                    color: "#555",
                    fontSize: "15px",
                    marginBottom: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaMapMarkerAlt /> {c.address || "—"}
                </p>
                <p
                  style={{
                    color: "#555",
                    fontSize: "15px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <FaPhoneAlt /> {c.phone || "—"}
                </p>
              </div>

                <Link
                    to={`/owner/clinics/${c._id}/appointments`}
                    style={{
                        display: "inline-block",
                        textAlign: "center",
                        background: "linear-gradient(135deg, #0077b6, #00b4d8)",
                        color: "white",
                        padding: "10px 16px",
                        borderRadius: "10px",
                        textDecoration: "none",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                    }}
                >
                    Өтініштерді қарау
                </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerClinics;