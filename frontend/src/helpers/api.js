// frontend/src/helpers/api.js
import axios from "axios";

/**
 * API_BASE
 * Указывайте REACT_APP_API_URL без завершающего слэша:
 * REACT_APP_API_URL=https://dentalchain.onrender.com
 */
const raw = process.env.REACT_APP_API_URL || "http://localhost:5001";
const API_BASE = raw.endsWith("/") ? raw.slice(0, -1) : raw;

// создаём axios instance
const instance = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },

  // ОБЯЗАТЕЛЬНО for CORS
  withCredentials: true,
});

// Добавляем токен в заголовки
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Глобальный обработчик ошибок
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API] error:", {
      message: err.message,
      code: err.code,
      status: err.response?.status,
      url: err.config?.url,
      method: err.config?.method,
      data: err.response?.data,
    });
    return Promise.reject(err);
  }
);

export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default instance;
