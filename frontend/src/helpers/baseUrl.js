// frontend/src/helpers/baseUrl.js

export const API_BASE = "https://dentalchain.onrender.com";

// Получение полного URL изображения
export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) return `${API_BASE}${imagePath}`;
  return `${API_BASE}/${imagePath}`;
};

// Главный экспорт — API_BASE
export default API_BASE;
