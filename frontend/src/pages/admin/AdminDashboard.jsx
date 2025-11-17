// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import api, { authHeaders } from "../../helpers/api";

const AdminDashboard = () => {
  const [counts, setCounts] = useState({
    users: 0,
    clinics: 0,
    appointments: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get("/api/admin/users?limit=1", { headers: authHeaders() }),
      api.get("/api/admin/clinics?limit=1", { headers: authHeaders() }),
      api.get("/api/admin/appointments?limit=1", { headers: authHeaders() }),
    ])
      .then(([u, c, a]) => {
        setCounts({
          users: u.data.total || 0,
          clinics: c.data.total || 0,
          appointments: a.data.total || 0,
        });
      })
      .catch((err) => {
        console.error("AdminDashboard load error:", err);
      });
  }, []);

  return (
    <div className="grid cols-2">
      <div className="admin-card">
        <h3>Users</h3>
        <p style={{ fontSize: 28, fontWeight: 700 }}>{counts.users}</p>
      </div>
      <div className="admin-card">
        <h3>Clinics</h3>
        <p style={{ fontSize: 28, fontWeight: 700 }}>{counts.clinics}</p>
      </div>
      <div className="admin-card">
        <h3>Appointments</h3>
        <p style={{ fontSize: 28, fontWeight: 700 }}>{counts.appointments}</p>
      </div>
    </div>
  );
};
export default AdminDashboard;
