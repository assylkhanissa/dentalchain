import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import "../styles/admin.css";

const AdminLayout = () => {
  return (
    <div className="admin-shell">
      <aside className="admin-aside">
        <div className="admin-logo">DentalChain Admin</div>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/users">Users</NavLink>
          <NavLink to="/admin/clinics">Clinics</NavLink>
          <NavLink to="/admin/appointments">Appointments</NavLink>
          <NavLink to="/admin/xrays">X-rays</NavLink>
        </nav>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
export default AdminLayout;
