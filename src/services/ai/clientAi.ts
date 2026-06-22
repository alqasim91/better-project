/**
 * Client-side AI adapter for BYOK (bring-your-own-key) mode.
 *
 * When a user has saved an API key in the BYOK settings, AI requests go
 * directly from the browser to the chosen provider — no Netlify proxy,
 * no server-side logging, no key ever touches our infrastructure.
 *
 * Supported providers:
 *   - gemini    → Google Generative Language API (REST)
 *   - openai    → OpenAI Chat Completions (also covers OpenAI-compatible
 *                 endpoints via custom baseUrl, e.g. Groq, OpenRouter, Together)
 *   - anthropic → Anthropic Messages API
 *
 * Returns the same shape as the Netlify function's chatCompletion helper.
 */

export type AiProvider = "gemini" | "openai" | "anthropic";

export interface ByokConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  /** Optional override for OpenAI-compatible providers (Groq, OpenRouter, ...). */
  baseUrl?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
  tokensUsed: number;
}

const TIMEOUT_MS = 60_000;

export async function clientChatCompletion(
  cfg: ByokConfig,
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<ChatResult> {
  switch (cfg.provider) {
    case "gemini":
      return geminiChat(cfg, messages, options);
    case "openai":
      return openaiChat(cfg, messages, options);
    case "anthropic":
      return anthropicChat(cfg, messages, options);
    default:
      throw new Error(`Unknown provider: ${cfg.provider}`);
  }
}

async function geminiChat(
  cfg: ByokConfig,
  messages: ChatMessage[],
  options: { temperature?: number },
): Promise<ChatResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${cfg.model}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

  const systemMsg = messages.find((m) => m.role === "system");
  const conversationMsgs = messages.filter((m) => m.role !== "system");

  const body: Record<string, unknown> = {
    contents: conversationMsgs.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.4,
      responseMimeType: "application/json",
    },
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const json = await postJson(url, body, {});
  const text: string =
    (json as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      .candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const tokensUsed: number =
    (json as { usageMetadata?: { totalTokenCount?: number } })
      .usageMetadata?.totalTokenCount ?? 0;
  return { content: text, model: cfg.model, tokensUsed };
}

async function openaiChat(
  cfg: ByokConfig,
  messages: ChatMessage[],
  options: { temperature?: number },
): Promise<ChatResult> {
  const customBase = Boolean(cfg.baseUrl?.trim());
  const base = (cfg.baseUrl ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const url = `${base}/chat/completions`;

  // `response_format: json_object` is real-OpenAI specific. LM Studio,
  // Ollama, and some OpenRouter models reject it. When the user has set a
  // custom baseUrl we assume a compatible (but not identical) backend and
  // rely on the prompt-level JSON instructions instead.
  const body: Record<string, unknown> = {
    model: cfg.model,
    messages,
    temperature: options.temperature ?? 0.4,
  };
  if (!customBase) {
    body.response_format = { type: "json_object" };
  }

  const json = await postJson(url, body, {
    Authorization: `Bearer ${cfg.apiKey}`,
  });

  const text: string =
    (json as { choices?: Array<{ message?: { content?: string } }> })
      .choices?.[0]?.message?.content ?? "";
  const tokensUsed: number =
    (json as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? 0;
  return { content: text, model: cfg.model, tokensUsed };
}

async function anthropicChat(
  cfg: ByokConfig,
  messages: ChatMessage[],
  options: { temperature?: number },
): Promise<ChatResult> {
  const url = "https://api.anthropic.com/v1/messages";

  const systemMsg = messages.find((m) => m.role === "system");
  const conversationMsgs = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: cfg.model,
    max_tokens: 8192,
    temperature: options.temperature ?? 0.4,
    messages: conversationMsgs,
  };
  if (systemMsg) body.system = systemMsg.content;

  const json = await postJson(url, body, {
    "x-api-key": cfg.apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-dangerous-direct-browser-access": "true",
  });

  const blocks =
    (json as { content?: Array<{ type?: string; text?: string }> }).content ?? [];
  const text = blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
  const usage = (json as { usage?: { input_tokens?: number; output_tokens?: number } }).usage;
  const tokensUsed = (usage?.input_tokens ?? 0) + (usage?.output_tokens ?? 0);
  return { content: text, model: cfg.model, tokensUsed };
}

async function postJson(
  url: string,
  body: unknown,
  extraHeaders: Record<string, string>,
): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...extraHeaders },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(
        `Provider API error ${res.status}${detail ? `: ${truncate(detail, 300)}` : ""}`,
      );
    }
    return await res.json();
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s.`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}
