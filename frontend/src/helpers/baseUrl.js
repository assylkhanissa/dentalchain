// frontend/src/helpers/baseUrl.js

export const API_BASE = "http://localhost:5001";

export const getImageUrl = (imagePath) => {
  if (!imagePath) return "";
  if (/^https?:\/\//i.test(imagePath)) return imagePath;
  if (imagePath.startsWith("/")) return `${API_BASE}${imagePath}`;
  return `${API_BASE}/${imagePath}`;
};

export default getImageUrl;
