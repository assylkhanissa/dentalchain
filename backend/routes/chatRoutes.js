// backend/routes/chatRoutes.js
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const router = express.Router();

// helper: sanitize value from .env (remove inline comments and trim)
const sanitizeEnv = (raw) => {
  if (!raw) return "";
  const withoutHash = raw.split("#")[0];
  const firstPart = withoutHash.split(/\s+/)[0];
  return (firstPart || "").trim();
};

const rawOpenAI = sanitizeEnv(process.env.OPENAI_API_KEY);
const rawOpenRouter = sanitizeEnv(process.env.OPENROUTER_API_KEY);

// choose key: first OPENAI_API_KEY, otherwise OPENROUTER_API_KEY
const API_KEY = rawOpenAI || rawOpenRouter;
const OPENROUTER_BASE =
  process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
const PUBLIC_ORIGIN = process.env.PUBLIC_APP_URL || "http://localhost:3000";

// debug (don't print keys themselves)
console.log(
  "chatRoutes: OPENAI_API_KEY present:",
  Boolean(rawOpenAI),
  "len:",
  rawOpenAI?.length || 0
);
console.log(
  "chatRoutes: OPENROUTER_API_KEY present:",
  Boolean(rawOpenRouter),
  "len:",
  rawOpenRouter?.length || 0
);

let client = null;
if (API_KEY) {
  try {
    client = new OpenAI({
      apiKey: API_KEY,
      baseURL: OPENROUTER_BASE,
      defaultHeaders: {
        "HTTP-Referer": PUBLIC_ORIGIN,
        "X-Title": "DentalChain",
      },
    });
    console.log("chatRoutes: OpenAI client initialized");
  } catch (e) {
    console.error(
      "chatRoutes: failed to initialize OpenAI client:",
      e.message || e
    );
    client = null;
  }
}

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    hasKey: Boolean(API_KEY),
    base: OPENROUTER_BASE,
    model: MODEL,
  });
});

/**
 * POST /api/chat
 * body: { message: string, style?: string }
 *
 * style priority:
 * 1) req.body.style (if provided)
 * 2) process.env.AI_STYLE
 * 3) default "friendly"
 *
 * Supported styles: friendly, professional, marketing, multilingual
 */
router.post("/", async (req, res) => {
  try {
    const { message: rawMessage, style: reqStyle } = req.body || {};
    const message = (rawMessage || "").toString().trim();

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // If no key and in dev, return a helpful stub so frontend can be tested
    if (!API_KEY || !client) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "chatRoutes: AI key missing — returning dev stub response."
        );
        return res.json({
          reply: `Тест режимі: AI кілті орнатылмаған. Сұрауыңыз: "${message.slice(
            0,
            200
          )}". Бұл — тест жауабы.`,
        });
      }
      return res.status(500).json({
        message: "AI key is missing",
        detail:
          "Set OPENAI_API_KEY or OPENROUTER_API_KEY in .env (remove inline comments).",
      });
    }

    // determine style
    const style = (reqStyle || process.env.AI_STYLE || "friendly").toString();

    // system prompts by style
    const systemPrompts = {
      friendly:
        "You are a friendly, concise dental assistant for the DentalChain app. Detect the user's language (Kazakh, Russian, or English) and reply in the same language. Use empathetic, plain language, short paragraphs, and bullet points for steps. Encourage seeing a dentist for proper diagnosis. Do NOT provide definitive medical diagnoses; provide general guidance only.",
      professional:
        "You are a professional dental assistant for clinicians. Provide clear, evidence-based and clinically-minded answers. Use medical terms when appropriate but briefly explain them in plain language. Keep tone neutral and precise.",
      marketing:
        "You are a medical copywriter. Produce polished, persuasive text suitable for a dental clinic website. Provide a short headline (one line), 2–3 benefit bullets, and a one-line call-to-action.",
      multilingual:
        "Detect the user's language (Kazakh, Russian, English) and reply in the same language. Be concise and polite. For technical questions about code, reply in English.",
    };

    const systemMessage = systemPrompts[style] || systemPrompts.friendly;

    // few-shot examples to guide tone/format (keeps model consistent)
    // Example pairs are short and multilingual-friendly
    const fewShot = [
      { role: "user", content: "Менің тісім қатты ауырады. Не істеуім керек?" },
      {
        role: "assistant",
        content:
          "Қысқа нұсқа: ауырсынуды жеңілдету үшін ұсынылатын OTC препарат (мыс., ибупрофен) алыңыз, ыстық/суықтан аулақ болыңыз, және 24–48 сағат ішінде стоматологқа жазыылыңыз. Егер ісік немесе қызба болса — тез арада жедел жәрдемге барыңыз.",
      },
      {
        role: "user",
        content: "Tooth sensitivity after whitening — what should I do?",
      },
      {
        role: "assistant",
        content:
          "Short: Use sensitivity toothpaste, avoid very hot/cold foods for a few days, and consult your dentist if sensitivity persists beyond one week.",
      },
    ];

    // assemble messages for model
    const messagesForModel = [
      { role: "system", content: systemMessage },
      // few-shot examples (optional)
      ...fewShot,
      { role: "user", content: message },
    ];

    // call model
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages: messagesForModel,
      temperature: Number(process.env.AI_TEMPERATURE ?? 0.6),
      max_tokens: Number(process.env.AI_MAX_TOKENS ?? 600),
      top_p: Number(process.env.AI_TOP_P ?? 0.9),
      // presence_penalty / frequency_penalty can be added if provider supports
    });

    // extract reply safely
    let reply = completion?.choices?.[0]?.message?.content || "";
    if (typeof reply !== "string") reply = String(reply || "");

    // simple post-processing: trim, collapse multiple blank lines, ensure punctuation
    reply = reply
      .trim()
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n");
    // if reply is short and doesn't end punctuation, add a period for neatness
    if (reply.length > 0 && !/[.!?]$/.test(reply)) reply = reply + ".";

    // enforce maximum length (safety)
    const MAX_REPLY_CHARS = Number(process.env.AI_REPLY_MAX_CHARS ?? 4000);
    if (reply.length > MAX_REPLY_CHARS) {
      reply = reply.slice(0, MAX_REPLY_CHARS - 3).trim() + "...";
    }

    // respond to client
    return res.json({ reply });
  } catch (err) {
    const status = err.status || err.response?.status || 500;
    const detail = err.message || err.response?.data || "Unknown error";

    // detailed logging to help debug external API responses
    console.error("[CHAT] error status:", status);
    if (err.response?.data) {
      try {
        console.error(
          "[CHAT] error response data:",
          JSON.stringify(err.response.data, null, 2)
        );
      } catch (e) {
        console.error("[CHAT] error response (raw):", err.response.data);
      }
    } else {
      console.error("[CHAT] error:", err);
    }

    // preserve 401 if external service returned 401 (helps diagnostics on frontend)
    return res.status(status).json({ message: "Chat error", detail });
  }
});

export default router;
