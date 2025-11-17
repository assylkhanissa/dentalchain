import React from "react";
import { Link } from "react-router-dom";
import "../styles/HeroSection.css";

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>
          Заманауи стоматологияға арналған <span>IT шешім 💡</span>
        </h1>
        <p>
          DentalChain — клиникалар мен пациенттер арасындағы медициналық
          байланысты қауіпсіз және ашық етуге арналған инновациялық жүйе.
        </p>
        <Link to="/clinics" className="hero-btn">
          Клиника іздеу
        </Link>
      </div>
    </section>
  );
};

export default HeroSection;
