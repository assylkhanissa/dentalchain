import React from "react";
import "../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-logo">
          <span role="img" aria-label="tooth">
            🦷
          </span>{" "}
          DentalChain
        </div>

        <div className="footer-links">
          <a href="/">Басты бет</a>
          <a href="/clinics">Клиникалар</a>
          <a href="/about">Біз туралы</a>
          <a href="/contact">Байланыс</a>
        </div>

        <p className="footer-copy">
          © 2025 <strong>DentalChain</strong> | Барлық құқықтар қорғалған.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
