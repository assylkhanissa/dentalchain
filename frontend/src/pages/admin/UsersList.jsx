import React, { useEffect, useState } from "react";
import axios, { authHeaders } from "../../helpers/api";

const UsersList = () => {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "patient",
  });
  const [editing, setEditing] = useState(null);

  const load = async (page = 1) => {
    const res = await axios.get(
      `/api/admin/users?page=${page}&q=${q}&role=${role}`,
      {
        headers: authHeaders(),
      }
    );
    setData(res.data);
  };

  useEffect(() => {
    load();
  }, []); // начальная загрузка

  const submit = async (e) => {
    e.preventDefault();
    if (editing) {
      await axios.put(`/api/admin/users/${editing}`, form, {
        headers: authHeaders(),
      });
    } else {
      await axios.post(`/api/admin/users`, form, { headers: authHeaders() });
    }
    setForm({ fullName: "", email: "", password: "", role: "patient" });
    setEditing(null);
    load(data.page);
  };

  const edit = async (id) => {
    const res = await axios.get(`/api/admin/users/${id}`, {
      headers: authHeaders(),
    });
    setEditing(id);
    setForm({ ...res.data, password: "" });
  };

  const del = async (id) => {
    if (!window.confirm("Удалить?")) return;
    await axios.delete(`/api/admin/users/${id}`, { headers: authHeaders() });
    load(data.page);
  };

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="admin-toolbar">
        <input
          className="input"
          placeholder="Поиск..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="select"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Все роли</option>
          <option value="admin">admin</option>
          <option value="owner">owner</option>
          <option value="patient">patient</option>
        </select>
        <button className="btn" onClick={() => load(1)}>
          Найти
        </button>
      </div>

      <div className="admin-card">
        <form onSubmit={submit} className="grid cols-2">
          <input
            className="input"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) =>
              setForm((p) => ({ ...p, fullName: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
          <input
            className="input"
            type="password"
            placeholder="Password (изменить/создать)"
            value={form.password}
            onChange={(e) =>
              setForm((p) => ({ ...p, password: e.target.value }))
            }
          />
          <select
            className="select"
            value={form.role}
            onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
          >
            <option value="patient">patient</option>
            <option value="owner">owner</option>
            <option value="admin">admin</option>
          </select>
          <div>
            <button className="btn" type="submit">
              {editing ? "Сохранить" : "Создать"}
            </button>
            {editing && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setEditing(null);
                  setForm({
                    fullName: "",
                    email: "",
                    password: "",
                    role: "patient",
                  });
                }}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((u) => (
              <tr key={u._id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn secondary" onClick={() => edit(u._id)}>
                    Edit
                  </button>{" "}
                  <button className="btn danger" onClick={() => del(u._id)}>
                    Del
                  </button>
                </td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan="4">Пусто</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default UsersList;
