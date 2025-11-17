// backend/controllers/chatController.js
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const sanitizeEnv = (raw) => raw?.split("#")[0].split(/\s+/)[0].trim() || "";

const API_KEY =
  sanitizeEnv(process.env.OPENAI_API_KEY) ||
  sanitizeEnv(process.env.OPENROUTER_API_KEY);
const client = API_KEY
  ? new OpenAI({
      apiKey: API_KEY,
      baseURL: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",
    })
  : null;

export const askAI = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message)
      return res.status(400).json({ reply: "Хабарлама бос болмауы керек." });

    if (!client) {
      if (process.env.NODE_ENV !== "production")
        return res.json({ reply: "Тестовый режим — ключ жоқ." });
      return res.status(500).json({ reply: "AI key missing" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Сен стоматология саласының көмекшісісің." },
        { role: "user", content: message },
      ],
    });

    res.json({ reply: completion.choices?.[0]?.message?.content || "" });
  } catch (error) {
    console.error("❌ Chat error:", error);
    res
      .status(error.status || 500)
      .json({
        reply: "❌ Серверге қосылу қатесі.",
        detail: error.message || error,
      });
  }
};
