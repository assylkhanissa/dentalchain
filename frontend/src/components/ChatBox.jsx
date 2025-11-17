// src/components/ChatBox.jsx
import React, { useState } from "react";
import api from "../helpers/api";

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      // POST в /api/chat (бэкенд ожидает этот маршрут)
      const res = await api.post("/api/chat", { message: input });
      const botMsg = { sender: "bot", text: res.data.reply || "Жауап жоқ." };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("ChatBox error:", error);
      const errMsg = { sender: "bot", text: "⚠️ Қате: сервер жауап бермеді." };
      setMessages((prev) => [...prev, errMsg]);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`msg ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Сұрағыңызды жазыңыз..."
        />
        <button type="submit">Жіберу</button>
      </form>
    </div>
  );
};

export default ChatBox;
