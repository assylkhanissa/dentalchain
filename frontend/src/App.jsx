import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import HomePage from "./pages/HomePage";
import Clinics from "./pages/Clinics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import PatientDashboard from "./pages/PatientDashboard";
import OwnerClinics from "./pages/OwnerClinics";
import OwnerAppointments from "./pages/OwnerAppointments";

// admin
import AdminProtectedRoute from "./components/auth/AdminProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersList from "./pages/admin/UsersList";
import ClinicsList from "./pages/admin/ClinicsList";
import AppointmentsList from "./pages/admin/AppointmentsList";
import XraysList from "./pages/admin/XraysList";
import ChatWidget from "./components/ChatWidget";

const App = () => {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/clinics" element={<Clinics />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* patient */}
        <Route path="/dashboard" element={<PatientDashboard />} />

        {/* owner */}
        <Route path="/owner/clinics" element={<OwnerClinics />} />
        <Route
          path="/owner/clinics/:id/appointments"
          element={<OwnerAppointments />}
        />

        {/* admin (вложенные роуты!) */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersList />} />
          <Route path="clinics" element={<ClinicsList />} />
          <Route path="appointments" element={<AppointmentsList />} />
          <Route path="xrays" element={<XraysList />} />
        </Route>
      </Routes>
      <ChatWidget />
      <Footer />
    </BrowserRouter>
  );
};

export default App;
