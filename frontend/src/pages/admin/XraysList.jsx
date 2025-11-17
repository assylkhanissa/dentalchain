import React, { useEffect, useState } from "react";
import axios, { authHeaders } from "../../helpers/api";

const XraysList = () => {
  const [email, setEmail] = useState("");
  const [list, setList] = useState([]);

  const load = async () => {
    const res = await axios.get(`/api/admin/xrays?email=${email}`, {
      headers: authHeaders(),
    });
    setList(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const del = async (id) => {
    if (!window.confirm("Удалить снимок?")) return;
    await axios.delete(`/api/admin/xrays/${id}`, { headers: authHeaders() });
    load();
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="admin-toolbar">
        <input
          className="input"
          placeholder="Поиск по email пациента"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn" onClick={load}>
          Найти
        </button>
      </div>

      <div className="admin-card">
        {list.length === 0 && <p>Нет изображений</p>}

        <div className="xray-admin-grid">
          {list.map((x) => (
            <div key={x._id} className="xray-admin-card">
              <img src={`http://localhost:5001${x.image}`} alt="xray" />
              <p>{x.patientUser?.email}</p>

              <button className="btn danger" onClick={() => del(x._id)}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default XraysList;
