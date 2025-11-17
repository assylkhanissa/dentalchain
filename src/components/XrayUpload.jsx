import React, { useState } from "react";
import API from "../api";

export default function XrayUpload({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Файл таңда!");

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    try {
      const res = await API.post("/patient/upload-xray", formData);
      setMessage(res.data.message);
      onUploaded();
      setFile(null);
    } catch (err) {
      console.error(err);
      setMessage("Қате: файл жүктелмеді ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow mb-6">
      <h2 className="font-semibold mb-2">📸 Рентген жүктеу</h2>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-2"
        />
        <button
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Жүктелуде..." : "Жүктеу"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
    </div>
  );
}
