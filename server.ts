import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy initialize GoogleGenAI (optional fallback)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Map frontend model IDs to IO Intelligence supported model identifiers
function mapToIOModel(modelId: string): string {
  switch (modelId) {
    case "auto":
      return "meta-llama/Llama-3.3-70B-Instruct";
    case "deepseek-r1":
      return "deepseek-ai/DeepSeek-R1";
    case "llama-3-3-70b":
      return "meta-llama/Llama-3.3-70B-Instruct";
    case "qwen-2-5-coder":
      return "Qwen/Qwen2.5-Coder-32B-Instruct";
    case "gpt-4o-mini":
      return "gpt-4o-mini";
    case "claude-3-5-haiku":
      return "claude-3-5-haiku";
    case "gemini-3-8-flash":
      return "gemini-2.0-flash";
    default:
      return modelId;
  }
}

// IO Intelligence Free Models Catalog
const IO_INTELLIGENCE_MODELS = [
  {
    id: "auto",
    name: "Умный выбор",
    modelTag: "Автоматически",
    provider: "IO Intelligence Router",
    color: "#60a5fa",
    accentGlow: "rgba(96, 165, 250, 0.4)",
    description: "Автоматически выбирает лучшую нейросеть под конкретную задачу",
    contextWindow: "128K",
    latency: "85ms",
    isFree: true,
    badge: "Рекомендуется",
    category: "general",
  },
  {
    id: "gpt-4o-mini",
    name: "ChatGPT",
    modelTag: "GPT-4o mini",
    provider: "OpenAI / IO Intelligence",
    color: "#34d399",
    accentGlow: "rgba(52, 211, 153, 0.4)",
    description: "Сверхбыстрая универсальная модель для текста, поиска ответов и логики",
    contextWindow: "128K",
    latency: "110ms",
    isFree: true,
    badge: "Быстрый",
    category: "general",
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude",
    modelTag: "3.5 Haiku",
    provider: "Anthropic / IO Intelligence",
    color: "#fb923c",
    accentGlow: "rgba(251, 146, 60, 0.4)",
    description: "Лидер в точности формулировок, писательском мастерстве и нюансах",
    contextWindow: "200K",
    latency: "135ms",
    isFree: true,
    badge: "Элегантный",
    category: "creative",
  },
  {
    id: "deepseek-r1",
    name: "DeepSeek",
    modelTag: "R1 Reasoning",
    provider: "DeepSeek / IO Intelligence",
    color: "#a855f7",
    accentGlow: "rgba(168, 85, 247, 0.4)",
    description: "Мощная модель с пошаговым логическим мышлением и анализом кода",
    contextWindow: "128K",
    latency: "190ms",
    isFree: true,
    badge: "Рассуждение",
    category: "reasoning",
  },
  {
    id: "llama-3-3-70b",
    name: "Meta Llama",
    modelTag: "3.3 70B Instruct",
    provider: "Meta / IO Intelligence",
    color: "#38bdf8",
    accentGlow: "rgba(56, 189, 248, 0.4)",
    description: "Флагманская открытая модель для сложных диалогов и эрудиции",
    contextWindow: "128K",
    latency: "140ms",
    isFree: true,
    badge: "Флагман",
    category: "general",
  },
  {
    id: "qwen-2-5-coder",
    name: "Qwen Coder",
    modelTag: "2.5 Coder 32B",
    provider: "Alibaba / IO Intelligence",
    color: "#f43f5e",
    accentGlow: "rgba(244, 63, 94, 0.4)",
    description: "Специализированная модель для разработки, отладки и алгоритмов",
    contextWindow: "128K",
    latency: "125ms",
    isFree: true,
    badge: "Разработка",
    category: "code",
  },
  {
    id: "gemini-3-8-flash",
    name: "Google Gemini",
    modelTag: "3.8 Flash",
    provider: "Google DeepMind / IO Intelligence",
    color: "#facc15",
    accentGlow: "rgba(250, 204, 21, 0.4)",
    description: "Новейшая мультимодальная архитектура с ультра-низкой задержкой",
    contextWindow: "1M",
    latency: "75ms",
    isFree: true,
    badge: "Ультра-скорость",
    category: "speed",
  },
];

// Helper to formulate prompt persona based on chosen model and conversation state
function getPersonaInstruction(modelId: string, hasPriorHistory: boolean = false): string {
  let baseRules =
    "Ты — полезный, дружелюбный и высокоинтеллектуальный ИИ-ассистент платформы Simplify AI (агрегатор нейросетей через IO Intelligence). Отвечай на чистом, грамотном русском языке (или на языке запроса пользователя). Всегда используй богатое Markdown-форматирование: заголовки, списки, жирный шрифт, блоки кода с указанием языка программирования.";

  if (hasPriorHistory) {
    baseRules += `\n\nОБЯЗАТЕЛЬНАЯ СИСТЕМА ПАМЯТИ ДИАЛОГА:
Поскольку этот запрос продолжает предыдущий диалог, перед своим основным ответом ОБЯЗАТЕЛЬНО начни сообщение с блока контекста прошлых сообщений в тегах <context>...</context> строго по образцу:
<context>
**До этого:**
- *Тема/вопрос ранее*: краткая выжимка того, что обсуждалось или спрашивалось
- *Предыдущее решение*: ключевой тезис или вывод прошлого ответа
</context>
Затем сразу давай исчерпывающий, структурированный и связный ответ на новый запрос, опираясь на этот контекст.`;
  }

  switch (modelId) {
    case "deepseek-r1":
      return `${baseRules} Ты действуешь в стиле DeepSeek-R1. Перед окончательным ответом покажи ход своих размышлений внутри тегов <think>краткий ход рассуждения, проверка граничных условий, план ответа</think>, а затем дай исчерпывающий и четкий ответ.`;
    case "claude-3-5-haiku":
      return `${baseRules} Ты действуешь в стиле Claude 3.5 Haiku от Anthropic. Твой тон вежлив, глубок, структурирован, с безупречной литературной точностью, ясными аналогиями и структурированными выводами.`;
    case "gpt-4o-mini":
      return `${baseRules} Ты действуешь в стиле GPT-4o mini от OpenAI. Отвечай максимально оперативно, конкретно, по существу, с практическими примерами и четким фокусом на решении.`;
    case "qwen-2-5-coder":
      return `${baseRules} Ты действуешь в стиле Qwen 2.5 Coder. Если вопрос касается программирования или архитектуры, предоставляй чистый, идиоматичный, протестированный код с комментариями, лучшими практиками и пояснениями.`;
    case "llama-3-3-70b":
      return `${baseRules} Ты действуешь в стиле Meta Llama 3.3 70B. Предоставляй развернутые, объективные, эрудированные ответы с широким кругозором и глубоким раскрытием темы.`;
    case "gemini-3-8-flash":
      return `${baseRules} Ты действуешь в стиле Google Gemini 3.8 Flash. Предоставляй актуальные, современные, лаконичные и точные сведения.`;
    case "auto":
    default:
      return `${baseRules} Ты — интеллектуальный маршрутизатор Simplify AI. Ты автоматически оптимизируешь структуру ответа под тип вопроса: для кода даешь идеальные примеры, для креатива — выразительный стиль, для фактов — проверяемую точность.`;
  }
}

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Models endpoint
app.get("/api/models", (_req, res) => {
  res.json({
    models: IO_INTELLIGENCE_MODELS,
    provider: "IO Intelligence Free Tier",
    uptime: "99.99%",
    avgLatencyMs: 95,
  });
});

// Chat completion endpoint with Server-Sent Events (SSE) streaming
app.post("/api/chat", async (req, res) => {
  const { messages, model = "auto" } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Массив сообщений обязателен" });
    return;
  }

  // Set headers for SSE streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const rawIoKey = process.env.IO_INTELLIGENCE_API_KEY || process.env.VITE_IO_INTELLIGENCE_API_KEY || "";
  const ioKey = rawIoKey.trim().replace(/^["']|["']$/g, "").trim();
  const ioBaseUrl = (process.env.IO_INTELLIGENCE_BASE_URL || "https://api.intelligence.io.solutions/api/v1").replace(/\/+$/, "");

  let hasStartedStreaming = false;

  // 1. PRIMARY & MANDATORY PROVIDER: IO Intelligence
  if (ioKey !== "") {
    try {
      const targetModel = mapToIOModel(model);
      const formattedMessages = [
        {
          role: "system",
          content: getPersonaInstruction(model, messages.length > 1),
        },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        })),
      ];

      const ioResponse = await fetch(`${ioBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ioKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: formattedMessages,
          stream: true,
          temperature: model === "deepseek-r1" ? 0.3 : 0.7,
        }),
      });

      if (ioResponse.ok && ioResponse.body) {
        const reader = ioResponse.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") continue;

            if (trimmed.startsWith("data: ")) {
              try {
                const json = JSON.parse(trimmed.slice(6));
                const text =
                  json.choices?.[0]?.delta?.content ??
                  json.choices?.[0]?.text ??
                  "";
                if (text) {
                  hasStartedStreaming = true;
                  res.write(`data: ${JSON.stringify({ text })}\n\n`);
                }
              } catch {
                // Non-JSON SSE payload
              }
            }
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
        return;
      } else {
        const errBody = await ioResponse.text().catch(() => "");
        console.warn(`IO Intelligence API returned HTTP ${ioResponse.status}:`, errBody);
      }
    } catch (err: any) {
      console.warn("IO Intelligence streaming error:", err?.message || err);
    }
  }

  // If partial tokens were already sent through IO Intelligence, close stream cleanly
  if (hasStartedStreaming) {
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }

  // 2. OPTIONAL FALLBACK PROVIDER: Google Gemini (only if GEMINI_API_KEY is configured)
  const ai = getAIClient();
  if (ai) {
    if (!ioKey) {
      console.warn("⚠️ IO_INTELLIGENCE_API_KEY is not configured. Falling back to optional GEMINI_API_KEY.");
    } else {
      console.warn("IO Intelligence request failed. Falling back to optional GEMINI_API_KEY.");
    }

    try {
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      const conversationHistory = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      const personaInstruction = getPersonaInstruction(model, conversationHistory.length > 0);

      const candidateModels = [
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      let success = false;
      let lastError: any = null;

      for (const candidateModel of candidateModels) {
        try {
          const responseStream = await ai.models.generateContentStream({
            model: candidateModel,
            contents: [
              ...conversationHistory,
              {
                role: "user",
                parts: [{ text: lastUserMessage }],
              },
            ],
            config: {
              systemInstruction: personaInstruction,
              temperature: model === "deepseek-r1" ? 0.3 : 0.7,
            },
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              hasStartedStreaming = true;
              res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }
          }

          success = true;
          break;
        } catch (err: any) {
          lastError = err;
          console.warn(`Candidate model ${candidateModel} failed:`, err?.message || err);
          if (hasStartedStreaming) break;
          await new Promise((resolve) => setTimeout(resolve, 350));
        }
      }

      if (success) {
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      if (!hasStartedStreaming) {
        const errStr = String(lastError?.message || lastError || "");
        const isHighDemand =
          errStr.includes("503") ||
          errStr.includes("high demand") ||
          errStr.includes("UNAVAILABLE") ||
          lastError?.code === 503 ||
          lastError?.status === "UNAVAILABLE";

        const fallbackMessage = isHighDemand
          ? "⚠️ **Сервер ИИ временно перегружен**.\n\nПожалуйста, нажмите кнопку **«Повторить запрос»** ниже через пару секунд."
          : "⚠️ **Временная задержка соединения с ИИ**.\n\nПожалуйста, нажмите **«Повторить запрос»**.";

        res.write(`data: ${JSON.stringify({ text: fallbackMessage })}\n\n`);
      }

      res.write("data: [DONE]\n\n");
      res.end();
      return;
    } catch (error: any) {
      console.error("Gemini API fallback error:", error);
    }
  }

  // 3. Neither IO Intelligence nor Gemini could answer
  if (!ioKey || ioKey.trim() === "") {
    const missingKeyMsg =
      "⚠️ **Обязательный API-ключ IO Intelligence не настроен**\n\nДля работы с моделями необходим ключ `IO_INTELLIGENCE_API_KEY`.\n\nПожалуйста, укажите его в файле `.env`:\n```env\nIO_INTELLIGENCE_API_KEY=\"ваш_ключ_io_intelligence\"\n```\n*(Ключ Gemini API теперь опционален)*";
    res.write(`data: ${JSON.stringify({ text: missingKeyMsg })}\n\n`);
  } else {
    const serviceErrorMsg =
      "⚠️ **Не удалось связаться с платформой IO Intelligence**\n\nПроверьте баланс или правильность ключа `IO_INTELLIGENCE_API_KEY` в файле `.env` и нажмите кнопку **«Повторить запрос»**.";
    res.write(`data: ${JSON.stringify({ text: serviceErrorMsg })}\n\n`);
  }

  res.write("data: [DONE]\n\n");
  res.end();
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Simplify AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
