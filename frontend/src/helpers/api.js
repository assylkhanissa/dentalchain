// frontend/src/helpers/api.js
import axios from "axios";

/**
 * API_BASE
 * Указывайте в окружении REACT_APP_API_URL без завершающего слэша, например:
 * REACT_APP_API_URL=https://dentalchain.onrender.com
 *
 * Локально оставляем http://localhost:5001
 */
const raw = process.env.REACT_APP_API_URL || "http://localhost:5001";
const API_BASE = raw.endsWith("/") ? raw.slice(0, -1) : raw;

// создаём инстанс с разумным таймаутом
const instance = axios.create({
  baseURL: API_BASE,
  timeout: 30000, // 30s
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Автоматически добавлять токен в заголовки
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Удобный единый обработчик ошибок (можно расширить)
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    // Для дебага — печатаем подробно
    console.error("[API] error:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      url: err.config?.url,
      method: err.config?.method,
    });
    return Promise.reject(err);
  }
);

// Утилита возвращающая заголовки авторизации (если нужно)
export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// default экспорт инстанса
export default instance;
