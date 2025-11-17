import React from "react";

export default function XrayList({ xrays }) {
  if (!xrays.length) {
    return <p className="text-gray-500">Рентген суреттері әлі жүктелмеген 📁</p>;
  }

  return (
    <div>
      <h2 className="font-semibold mb-2">🧾 Рентген тарихы</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {xrays.map((x) => (
          <div key={x.id} className="bg-white shadow rounded-lg p-2">
            <img
              src={`http://localhost:5000${x.url}`}
              alt="xray"
              className="rounded-lg mb-2"
            />
            <p className="text-xs text-gray-500">{new Date(x.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
