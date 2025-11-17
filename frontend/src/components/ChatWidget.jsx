// frontend/src/components/ChatWidget.jsx
import React, { useState, useRef, useEffect } from "react";
import axios, { authHeaders } from "../helpers/api";
import "../styles/ChatWidget.css";

// === VARIANT 4: Cute Tooth Icon ===
const ToothIcon = ({ className = "", title = "Dental chat" }) => (
  <svg
    className={className}
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>{title}</title>

    <path d="M12 2c2.4 0 4 1.8 4 5 0 2.4.8 4.6 2 5.5" />
    <path d="M12 2c-2.4 0-4 1.8-4 5 0 2.4-.8 4.6-2 5.5" />

    <path d="M10 13c0 5-1 7-2.5 7S5 18.5 5 16" />
    <path d="M14 13c0 5 1 7 2.5 7S19 18.5 19 16" />

    <circle cx="9.5" cy="8.5" r="0.7" />
    <circle cx="14.5" cy="8.5" r="0.7" />

    <path d="M10 11c.5.5 1 .8 2 .8s1.5-.3 2-.8" />
  </svg>
);

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const messagesRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setUnread(
        messages.filter((m) => m.role === "assistant" && !m.seen).length
      );
      return;
    }

    let updated = false;
    const newMsgs = messages.map((m) => {
      if (m.role === "assistant" && !m.seen) {
        updated = true;
        return { ...m, seen: true };
      }
      return m;
    });

    if (updated) setMessages(newMsgs);
    setUnread(0);
  }, [messages, isOpen]);

  const sendMessage = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, seen: true },
    ]);
    setInput("");

    const token = localStorage.getItem("token");
    if (!token) {
      return setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Өтініш, жүйеге кіріңіз.", seen: false },
      ]);
    }

    try {
      const res = await axios.post(
        "/api/chat",
        { message: text },
        { headers: authHeaders() }
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: res.data.reply, seen: isOpen },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: err.response?.data?.detail || "❌ Сервер қатесі.",
          seen: isOpen,
        },
      ]);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="chat-widget-wrapper">
      {isOpen && (
        <div className="chat-card">
          <div className="chat-header">
            <div className="chat-header-title">
              <ToothIcon className="header-icon" />
              <div className="title-text">
                <strong>AI көмекші</strong>
                <span className="subtitle">
                  Сұрақ қойыңыз — қысқа жауап ала аласыз
                </span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="chat-messages" ref={messagesRef}>
            {messages.length === 0 && (
              <div className="chat-empty">Сәлем! Қалай көмектесе аламын?</div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`chat-msg ${
                  m.role === "user" ? "msg-user" : "msg-bot"
                }`}
              >
                <div className="msg-content">{m.content}</div>
              </div>
            ))}
          </div>

          <form className="chat-input-row" onSubmit={sendMessage}>
            <textarea
              className="chat-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Хабарлама жазыңыз..."
              rows={2}
            />
            <button className="chat-send" type="submit">
              <svg
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 11L21 3L14 21L11 14L3 11Z" />
              </svg>
            </button>
          </form>
        </div>
      )}

      <button
        className={`chat-floating-btn ${unread > 0 ? "has-unread" : ""}`}
        onClick={() => setIsOpen((s) => !s)}
      >
        <ToothIcon className="floating-icon" />
        {unread > 0 && <span className="chat-badge">{unread}</span>}
      </button>
    </div>
  );
};

export default ChatWidget;
