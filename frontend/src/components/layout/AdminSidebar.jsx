import React from "react";
import { NavLink } from "react-router-dom";
import "../../styles/AdminLayout.css";

const AdminSidebar = () => {
  return (
    <div className="admin-sidebar">
      <h2>DentalChain Admin</h2>
      <nav>
        <NavLink to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink to="/admin/users">Users</NavLink>
        <NavLink to="/admin/clinics">Clinics</NavLink>
        <NavLink to="/admin/appointments">Appointments</NavLink>
        <NavLink to="/admin/xrays">X-rays</NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
