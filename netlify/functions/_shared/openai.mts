// Chat Completions helper for Netlify Functions (Node runtime).
// Uses the Google Gemini API.
//
// Env vars (set in Netlify → Site settings → Environment variables):
//   GEMINI_API_KEY  — required
//   AI_MODEL        — optional, defaults to gemini-2.5-flash

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
  tokensUsed: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const TIMEOUT_MS = 25_000;

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<ChatResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in Netlify → Site settings → Environment variables.",
    );
  }

  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  // Split system message out; Gemini uses systemInstruction separately
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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${detail}`);
    }

    const json = await res.json();
    const text: string = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokensUsed: number = json.usageMetadata?.totalTokenCount ?? 0;

    return { content: text, model, tokensUsed };
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(
        `Gemini request timed out after ${TIMEOUT_MS / 1000}s (model: ${model}).`,
      );
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
