// Chat Completions helper for Netlify Functions (Node runtime).
// Uses the Kimi 2 API (Moonshot AI) via its OpenAI-compatible endpoint.
//
// Env vars (set in Netlify → Site settings → Environment variables):
//   MOONSHOT_API_KEY  — required
//   AI_MODEL          — optional, defaults to kimi-k2-0711-chat

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatResult {
  content: string;
  model: string;
  tokensUsed: number;
}

const KIMI_URL = "https://api.moonshot.cn/v1/chat/completions";
const DEFAULT_MODEL = "kimi-k2-0711-chat";
const TIMEOUT_MS = 25_000;

export async function chatCompletion(
  messages: ChatMessage[],
  options: { temperature?: number } = {},
): Promise<ChatResult> {
  const apiKey = process.env.MOONSHOT_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MOONSHOT_API_KEY is not set. Add it in Netlify → Site settings → Environment variables.",
    );
  }

  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(KIMI_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: options.temperature ?? 0.4,
        response_format: { type: "json_object" },
        messages,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Kimi API error ${res.status}: ${detail}`);
    }

    const json = await res.json();
    return {
      content: json.choices?.[0]?.message?.content ?? "",
      model: json.model ?? model,
      tokensUsed: json.usage?.total_tokens ?? 0,
    };
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
