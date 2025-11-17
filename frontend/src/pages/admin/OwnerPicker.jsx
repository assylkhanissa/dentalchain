// frontend/src/components/OwnerPickerInline.jsx
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { authHeaders } from "../helpers/api"; // путь как в вашем проекте

// Простой debounce
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
  minSearchLength = 2,
  maxResults = 10,
}) => {
  const [term, setTerm] = useState(value || "");
  const debounced = useDebounced(term, 300);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);

  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);

  useEffect(() => {
    setTerm(value || "");
  }, [value]);

  useEffect(() => {
    // short-circuit
    if (!debounced || debounced.length < minSearchLength) {
      setItems([]);
      setLoading(false);
      setErrMsg("");
      return;
    }

    // cached?
    const cached = cacheRef.current.get(debounced);
    if (cached) {
      setItems(cached.slice(0, maxResults));
      setOpen(true);
      setErrMsg("");
      setLoading(false);
      return;
    }

    // must have auth headers
    const headers = authHeaders();
    if (!headers || Object.keys(headers).length === 0) {
      setErrMsg("Требуется admin-токен (войдите как админ).");
      setItems([]);
      setLoading(false);
      return;
    }

    // abort previous
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const load = async () => {
      setLoading(true);
      setErrMsg("");
      try {
        console.log("[OwnerPicker] request q=", debounced);
        const res = await axios.get(
          `/api/admin/users?role=owner&q=${encodeURIComponent(debounced)}`,
          { headers, signal: controller.signal }
        );
        const list = res.data?.items || [];
        cacheRef.current.set(debounced, list);
        setItems(list.slice(0, maxResults));
        setOpen(true);
      } catch (e) {
        if (axios.isCancel(e)) {
          console.log("[OwnerPicker] request canceled");
        } else {
          const status = e?.response?.status;
          if (status === 401 || status === 403) {
            setErrMsg("Нет прав: требуется admin. (401/403)");
          } else {
            setErrMsg("Ошибка при загрузке владельцев");
          }
          setItems([]);
          console.error(
            "[OwnerPicker] error:",
            e?.response?.data || e.message || e
          );
        }
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch {}
        abortRef.current = null;
      }
    };
  }, [debounced, minSearchLength, maxResults]);

  // click outside -> close
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
    onChange?.(v); // allow free input
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
      if (activeIndex >= 0 && items[activeIndex])
        pick(items[activeIndex].email);
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
            zIndex: 40,
            left: 0,
            right: 0,
            marginTop: 6,
            background: "#fff",
            boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            borderRadius: 8,
            maxHeight: 260,
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

export default OwnerPickerInline;
