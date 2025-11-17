// frontend/src/pages/admin/ClinicsList.jsx
import React, { useEffect, useState, useRef } from "react";
import axios, { authHeaders } from "../../helpers/api";
import "../../styles/AdminFormTweaks.css";
import "../../styles/Clinics.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import toothIcon from "../../assets/tooth.svg";

/* Fix Leaflet default icon paths (prevents 404 marker images) */
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ==================== OwnerPickerInline ==================== */
const useDebounced = (value, delay = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
};

const OwnerPickerInline = ({
  value,
  onChange,
  placeholder = "Owner email (optional)",
}) => {
  const [term, setTerm] = useState(value || "");
  const debounced = useDebounced(term, 300);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  useEffect(() => setTerm(value || ""), [value]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      setErrMsg("");
      setLoading(true);

      const headers = authHeaders();
      if (!headers || Object.keys(headers).length === 0) {
        if (!ignore) {
          setErrMsg("Требуется быть админом (token отсутствует).");
          setItems([]);
          setOpen(false);
        }
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(
          `/api/admin/users?role=owner&q=${encodeURIComponent(
            debounced || ""
          )}`,
          {
            headers,
          }
        );
        if (!ignore) {
          setItems(res.data?.items || []);
          setOpen(true);
          setActiveIndex(-1);
        }
      } catch (e) {
        if (!ignore) {
          setItems([]);
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            setErrMsg("Нет прав: требуется admin (войдите как админ).");
          } else {
            setErrMsg("Ошибка при загрузке владельцев");
          }
          console.error(
            "OwnerPickerInline load error:",
            e?.response?.data || e
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    // Запускаем при изменении debounced
    load();
    return () => {
      ignore = true;
    };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setTerm(v);
    onChange?.(v);
    setOpen(true);
  };

  const pick = (email) => {
    setTerm(email);
    onChange?.(email);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && items[activeIndex]) {
        pick(items[activeIndex].email);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <input
        className="input"
        placeholder={placeholder}
        value={term}
        onChange={handleInput}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        autoComplete="off"
        aria-label="Owner email"
      />

      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 30,
            left: 0,
            right: 0,
            marginTop: 6,
            background: "white",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            borderRadius: 8,
            maxHeight: 240,
            overflowY: "auto",
            border: "1px solid #eef2f6",
          }}
        >
          {loading && (
            <div style={{ padding: 10, fontSize: 13, color: "#666" }}>
              Loading...
            </div>
          )}

          {!loading && items.length === 0 && !errMsg && (
            <div style={{ padding: 10, fontSize: 13, color: "#666" }}>
              Ничего не найдено
            </div>
          )}

          {!loading &&
            items.map((u, idx) => (
              <div
                key={u._id}
                onClick={() => pick(u.email)}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: "10px 12px",
                  cursor: "pointer",
                  background: idx === activeIndex ? "#f3f7fb" : "transparent",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600 }}>
                  {u.fullName || u.email}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>{u.email}</div>
              </div>
            ))}

          {errMsg && (
            <div style={{ padding: 10, fontSize: 13, color: "crimson" }}>
              {errMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
/* ==================== end OwnerPickerInline ==================== */

/* ==================== Map helpers ==================== */
const DraggableMarker = ({ initialLocation, onChange }) => {
  const [pos, setPos] = useState(
    initialLocation ? [initialLocation.lat, initialLocation.lng] : null
  );
  const map = useMapEvents({
    click(e) {
      const p = [e.latlng.lat, e.latlng.lng];
      setPos(p);
      onChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });

  useEffect(() => {
    if (pos) map.setView(pos, 13);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos]);

  if (!pos) return null;

  return (
    <Marker
      position={pos}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          setPos([lat, lng]);
          onChange({ lat, lng });
        },
      }}
    />
  );
};

const MapSelector = ({ location, onChange }) => {
  const defaultPos = location
    ? [location.lat, location.lng]
    : [43.2389, 76.8897];
  return (
    <div style={{ marginTop: 8 }}>
      <MapContainer
        center={defaultPos}
        zoom={location ? 13 : 11}
        style={{ height: 220, borderRadius: 10 }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <DraggableMarker initialLocation={location} onChange={onChange} />
      </MapContainer>
      <div style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
        Клик по карте — установить точку. Или введите адрес и нажмите «Найти».
      </div>
    </div>
  );
};

/* ==================== ClinicsList ==================== */
const ClinicsList = () => {
  const [q, setQ] = useState("");
  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    phone: "",
    description: "",
    imageUrl: "",
    ownerEmail: "",
    location: null,
  });
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const [loadingGeo, setLoadingGeo] = useState(false);

  // внутри ClinicsList компонента — обновлённая load функция
  const load = async (page = 1) => {
    try {
      // явный timeout (переопределит default) и можно указать baseURL если нужно
      const res = await axios.get(
        `/api/admin/clinics?page=${page}&q=${encodeURIComponent(q)}`,
        {
          headers: authHeaders(),
          timeout: 60000, // 60s на всякий случай
        }
      );
      console.log("admin/clinics response:", res.data);
      setData(res.data);
    } catch (e) {
      // детальный разбор причины ошибки
      console.error("Load clinics error:", e?.response?.data || e.message || e);
      if (e?.code === "ECONNABORTED") {
        alert(
          "Ошибка: запрос к серверу превысил время ожидания. Проверьте, запущен ли backend и правильно ли указан URL (PORT, proxy)."
        );
      } else if (e?.response) {
        alert(
          `Ошибка сервера: ${e.response.status} — ${
            e.response.data?.message || e.response.statusText
          }`
        );
      } else {
        alert("Ошибка загрузки списка клиник: " + (e.message || "Unknown"));
      }
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geocodeAddress = async () => {
    if (!form.address || !form.address.trim())
      return alert("Введите адрес для поиска");
    setLoadingGeo(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        form.address
      )}&limit=1`;
      const res = await fetch(url, { headers: { "Accept-Language": "ru" } });
      const json = await res.json();
      if (json && json[0]) {
        const lat = parseFloat(json[0].lat);
        const lon = parseFloat(json[0].lon);
        setForm((p) => ({ ...p, location: { lat, lng: lon } }));
      } else {
        alert("Адрес не найден. Попробуйте другой запрос.");
      }
    } catch (e) {
      console.error("geocode error", e);
      alert("Ошибка геокодирования");
    } finally {
      setLoadingGeo(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries({
      name: form.name,
      email: form.email,
      address: form.address,
      phone: form.phone,
      description: form.description,
      imageUrl: form.imageUrl,
      ownerEmail: form.ownerEmail,
    }).forEach(([k, v]) => fd.append(k, v ?? ""));
    if (file) fd.append("image", file);
    if (form.location) fd.append("location", JSON.stringify(form.location));

    try {
      if (editing) {
        await axios.put(`/api/admin/clinics/${editing}`, fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      } else {
        await axios.post(`/api/admin/clinics`, fd, {
          headers: { ...authHeaders(), "Content-Type": "multipart/form-data" },
        });
      }

      setForm({
        name: "",
        email: "",
        address: "",
        phone: "",
        description: "",
        imageUrl: "",
        ownerEmail: "",
        location: null,
      });
      setFile(null);
      setEditing(null);
      load(data.page);
    } catch (err) {
      console.error("Submit clinic error:", err?.response?.data || err);
      alert(err?.response?.data?.message || "Ошибка при сохранении клиники");
    }
  };

  const edit = async (id) => {
    try {
      const res = await axios.get(`/api/admin/clinics/${id}`, {
        headers: authHeaders(),
      });
      const c = res.data;
      setEditing(id);
      setForm({
        name: c.name || "",
        email: c.email || "",
        address: c.address || "",
        phone: c.phone || "",
        description: c.description || "",
        imageUrl: c.image || "",
        ownerEmail: c.owner?.email || "",
        location: c.location || null,
      });
    } catch (e) {
      console.error("Edit load error:", e?.response?.data || e);
      alert("Ошибка загрузки клиники");
    }
  };

  const del = async (id) => {
    if (!window.confirm("Удалить клинику?")) return;
    try {
      await axios.delete(`/api/admin/clinics/${id}`, {
        headers: authHeaders(),
      });
      load(data.page);
    } catch (e) {
      console.error("Delete error:", e?.response?.data || e);
      alert("Ошибка удаления");
    }
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
        <button className="btn" onClick={() => load(1)}>
          Найти
        </button>
      </div>

      <div className="admin-card">
        <form onSubmit={submit} className="grid cols-2">
          <input
            className="input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
          />
          <input
            className="input"
            placeholder="Address"
            value={form.address}
            onChange={(e) =>
              setForm((p) => ({ ...p, address: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
          />
          <textarea
            className="input"
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
          />
          <input
            className="input"
            placeholder="Image URL (optional)"
            value={form.imageUrl}
            onChange={(e) =>
              setForm((p) => ({ ...p, imageUrl: e.target.value }))
            }
          />

          <OwnerPickerInline
            value={form.ownerEmail}
            onChange={(v) => setForm((p) => ({ ...p, ownerEmail: v }))}
          />

          <div>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={geocodeAddress}
              disabled={loadingGeo}
            >
              {loadingGeo ? "Поиск..." : "Найти на карте"}
            </button>

            <div style={{ flex: 1 }}>
              {form.location ? (
                <div style={{ fontSize: 13, color: "#333" }}>
                  Координаты: {form.location.lat.toFixed(5)},{" "}
                  {form.location.lng.toFixed(5)}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#777" }}>
                  Координаты не заданы
                </div>
              )}
            </div>

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
                      name: "",
                      email: "",
                      address: "",
                      phone: "",
                      description: "",
                      imageUrl: "",
                      ownerEmail: "",
                      location: null,
                    });
                    setFile(null);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  Отмена
                </button>
              )}
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <MapSelector
              location={form.location}
              onChange={(loc) => setForm((p) => ({ ...p, location: loc }))}
            />
          </div>
        </form>
      </div>

      <div className="admin-card">
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Email</th>
              <th>Owner</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>
                  {c.owner?.fullName
                    ? `${c.owner.fullName} (${c.owner.email})`
                    : c.owner?.email || "-"}
                </td>
                <td>
                  <button className="btn secondary" onClick={() => edit(c._id)}>
                    Edit
                  </button>{" "}
                  <button className="btn danger" onClick={() => del(c._id)}>
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

export default ClinicsList;
