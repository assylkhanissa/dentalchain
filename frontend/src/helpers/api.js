// frontend/src/helpers/api.js
import axios from "axios";

const API_BASE = process.env.REACT_APP_API_URL || "https://dentalchain.onrender.com/";

// создаём инстанс с большим таймаутом
const instance = axios.create({
  baseURL: API_BASE,
  timeout: 10000, // 60s
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
    });
    return Promise.reject(err);
  }
);

// экспорты
export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default instance;
