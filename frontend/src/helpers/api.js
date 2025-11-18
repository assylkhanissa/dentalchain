// frontend/src/helpers/api.js
import axios from "axios";

/**
 * Базовый URL API берём из переменных окружения (REACT_APP_API_URL).
 * Если не задан — пробуем production URL (render/vercel). По умолчанию пусто (тогда используются относительные /api в dev через proxy).
 */
const RAW_API = process.env.REACT_APP_API_URL || "https://dentalchain.onrender.com";
// убираем завершающие слеши, чтобы baseURL был аккуратно сформирован
const API_BASE = RAW_API.replace(/\/+$/, "");

// создаём инстанс с увеличенным таймаутом (60s)
const instance = axios.create({
  baseURL: API_BASE || undefined, // если пусто — axios будет использовать относительные пути
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Автоматически добавлять токен в заголовки (не перезаписываем другие заголовки)
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("token");
      config.headers = config.headers || {};
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore
      // console.warn("auth interceptor error", e);
    }
    return config;
  },
  (err) => Promise.reject(err)
);

// Удобный единый обработчик ошибок (можно расширить)
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error("[API] error:", {
      message: err?.message,
      code: err?.code,
      status: err?.response?.status,
      url: err?.config?.url,
    });

    // Можно показывать уведомление пользователю здесь, если нужно.
    return Promise.reject(err);
  }
);

// Доп. помощник — возвращает заголовки авторизации (используется в некоторых компонентах)
export const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default instance;
