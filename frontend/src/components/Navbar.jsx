import React from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Navbar.css";

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  // 🔹 Профильге бағыттау логикасы (әр рөлге бөлек)
  const getProfileLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "patient":
        return "/dashboard";
      case "owner":
      case "clinic":
        return "/owner/clinics";
      default:
        return "/login";
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo" onClick={() => navigate("/")}>
        🦷 <span>DentalChain</span>
      </div>

      <div className="navbar-links">
        <Link to="/">Басты бет</Link>
        <Link to="/clinics">Клиникалар</Link>

        {user?.role === "owner" && (
          <Link to="/owner/clinics">Менің клиникаларым</Link>
        )}

        {user?.role === "admin" && <Link to="/admin">Admin Page</Link>}
      </div>

      <div className="navbar-user">
        {user ? (
          <>
            <span className="navbar-email">{user.email}</span>

            {/* ✅ Админге профиль кнопкасы көрінбейді */}
            {user.role !== "admin" && (
              <Link to={getProfileLink()} className="profile-btn">
                Профиль
              </Link>
            )}

            <button onClick={handleLogout} className="logout-btn">
              Шығу
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="profile-btn">
              Кіру
            </Link>
            <Link to="/register" className="profile-btn">
              Тіркелу
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
