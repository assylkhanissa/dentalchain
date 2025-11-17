import React, { useEffect, useState } from "react";
import axios, { authHeaders } from "../../helpers/api";

const AppointmentsList = () => {
  const [status, setStatus] = useState("");
  const [data, setData] = useState({ items: [], total: 0 });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: "",
    dateTime: "",
    note: "",
  });

  const load = async () => {
    const res = await axios.get(`/api/admin/appointments?status=${status}`, {
      headers: authHeaders(),
    });
    setData(res.data);
  };

  useEffect(() => {
    load();
  }, [status]);

  const openEdit = (appt) => {
    setEditingId(appt._id);
    setEditForm({
      status: appt.status,
      dateTime: appt.dateTime?.substring(0, 16),
      note: appt.note || "",
    });
  };

  const saveEdit = async () => {
    await axios.put(`/api/admin/appointments/${editingId}`, editForm, {
      headers: authHeaders(),
    });
    setEditingId(null);
    load();
  };

  const del = async (id) => {
    if (!window.confirm("Удалить?")) return;
    await axios.delete(`/api/admin/appointments/${id}`, {
      headers: authHeaders(),
    });
    load();
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="admin-toolbar">
        <select
          className="select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Все статусы</option>
          <option value="pending">pending</option>
          <option value="processing">processing</option>
          <option value="done">done</option>
        </select>
        <button className="btn" onClick={load}>
          Обновить
        </button>
      </div>

      <div className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>Клиника</th>
              <th>Пациент</th>
              <th>Дата</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((a) => (
              <tr key={a._id}>
                <td>{a.clinic?.name}</td>
                <td>{a.patient?.email}</td>
                <td>{new Date(a.dateTime).toLocaleString()}</td>
                <td>{a.status}</td>
                <td>
                  <button className="btn secondary" onClick={() => openEdit(a)}>
                    Edit
                  </button>
                  <button className="btn danger" onClick={() => del(a._id)}>
                    Del
                  </button>
                </td>
              </tr>
            ))}

            {data.items.length === 0 && (
              <tr>
                <td colSpan="5">Нет данных</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editingId && (
        <div className="admin-card">
          <h3>Редактирование записи</h3>
          <div className="grid cols-2">
            <select
              className="select"
              value={editForm.status}
              onChange={(e) =>
                setEditForm({ ...editForm, status: e.target.value })
              }
            >
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="done">done</option>
            </select>

            <input
              className="input"
              type="datetime-local"
              value={editForm.dateTime}
              onChange={(e) =>
                setEditForm({ ...editForm, dateTime: e.target.value })
              }
            />

            <textarea
              className="input"
              placeholder="Note"
              value={editForm.note}
              onChange={(e) =>
                setEditForm({ ...editForm, note: e.target.value })
              }
            />

            <button className="btn" onClick={saveEdit}>
              Сохранить
            </button>
            <button
              className="btn secondary"
              onClick={() => setEditingId(null)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsList;
