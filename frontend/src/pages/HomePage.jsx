import React from "react";
import HeroSection from "../components/HeroSection";
import "../styles/HomePage.css";
import { Link } from "react-router-dom";
import {
  FaTooth,
  FaUserMd,
  FaCalendarCheck,
  FaLock,
  FaSmile,
  FaLaptopMedical,
  FaHandshake,
} from "react-icons/fa";

const HomePage = () => {
  return (
    <>
      <HeroSection />

      <div className="home-container">
        <h2 className="homepage-title">
          DentalChain — стоматологияның жаңа деңгейі 🦷
        </h2>
        <p className="homepage-subtitle">
          Біз пациенттер мен клиникаларды{" "}
          <strong>біртұтас цифрлық экожүйеде</strong> байланыстырамыз.
        </p>

        {/* Преимущества */}
        <div className="homepage-cards">
          <div className="home-card">
            <FaTooth className="home-icon" />
            <h3>Жеке кабинет</h3>
            <p>
              Пациент өз рентген суреттерін жүктей алады және оларды
              клиникалармен қауіпсіз бөліседі.
            </p>
          </div>

          <div className="home-card">
            <FaUserMd className="home-icon" />
            <h3>Клиника үшін</h3>
            <p>
              Дәрігерлер пациент жазбаларын, суреттерін және емдеу тарихын оңай
              басқара алады.
            </p>
          </div>

          <div className="home-card">
            <FaCalendarCheck className="home-icon" />
            <h3>Онлайн жазылу</h3>
            <p>Пациенттер стоматологқа үйден шықпай-ақ жазыла алады.</p>
          </div>

          <div className="home-card">
            <FaLock className="home-icon" />
            <h3>Қауіпсіздік</h3>
            <p>
              Барлық деректер шифрланып, заманауи қауіпсіздік стандарттарымен
              қорғалған.
            </p>
          </div>
        </div>

        {/* Миссия */}
        <div className="mission-section">
          <h2>Біздің миссиямыз 💙</h2>
          <p>
            Біз стоматология саласын цифрландыру арқылы{" "}
            <strong>сенімді, жылдам және ыңғайлы</strong> тәжірибе жасауға
            тырысамыз.
          </p>
          <div className="mission-icons">
            <div>
              <FaSmile className="mission-icon" />
              <p>Бақытты пациенттер</p>
            </div>
            <div>
              <FaLaptopMedical className="mission-icon" />
              <p>Инновациялық технологиялар</p>
            </div>
            <div>
              <FaHandshake className="mission-icon" />
              <p>Сенімді серіктестік</p>
            </div>
          </div>
        </div>

        {/* Как это работает */}
        <div className="how-section">
          <h2>Қалай жұмыс істейді?</h2>
          <div className="how-steps">
            <div className="how-step">
              <span>1</span>
              <p>Пациент аккаунт ашады және рентген суретін жүктейді.</p>
            </div>
            <div className="how-step">
              <span>2</span>
              <p>Клиника пациент деректерін қарап, ем тағайындайды.</p>
            </div>
            <div className="how-step">
              <span>3</span>
              <p>Барлығы блокчейн арқылы қауіпсіз сақталады.</p>
            </div>
          </div>
        </div>

        {/* Отзывы */}
        <div className="testimonial-section">
          <h2>Пікірлер 💬</h2>
          <div className="testimonial-cards">
            <div className="testimonial-card">
              <p>“Керемет жүйе! Барлық рентгендер мен талдаулар бір жерде.”</p>
              <h4>— Айгүл, пациент</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “DentalChain арқасында біз пациенттермен жұмыс істеуді әлдеқайда
                оңайлаттық.”
              </p>
              <h4>— Dr. Ержан, дәрігер</h4>
            </div>
            <div className="testimonial-card">
              <p>
                “Уақыт үнемдеймін және деректердің қауіпсіздігіне сенімдімін.”
              </p>
              <h4>— Нұрлан, пациент</h4>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <h2>Сіздің стоматологиялық тәжірибеңізді жаңа деңгейге көтеріңіз!</h2>
          <p>
            Тіркеліп, DentalChain жүйесінің мүмкіндіктерін қазір қолданып
            көріңіз.
          </p>
          <div className="cta-buttons">
            <Link to="/clinics" className="cta-btn secondary">
              Клиникалар тізімі
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
