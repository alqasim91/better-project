/**
 * Thin client for the AI backend.
 *
 * Three modes (checked in order):
 *  - BYOK mode: if the user has saved an API key via the settings modal,
 *    the call goes directly from the browser to their chosen provider.
 *    Keys never touch our server.
 *  - Local mode (VITE_LOCAL_AI=true at build time): calls LM Studio's
 *    OpenAI-compatible endpoint directly from the browser. Used for the
 *    standalone single-file build.
 *  - Hosted mode (default): proxies through Netlify Functions at
 *    /.netlify/functions/<name>, which read GEMINI_API_KEY server-side.
 */
import {
  buildGenerationPrompt,
  buildConfidenceScoringPrompt,
  buildEngagementSuggestionPrompt,
  type StakeholderForSuggestion,
} from "@/services/ai/promptBuilders";
import type { Charter, MinimalInputs } from "@/types/charter";
import type { GeneratedSection } from "@/types/ai";
import { getActiveByokConfig } from "@/stores/byokStore";
import { clientChatCompletion, type ByokConfig } from "@/services/ai/clientAi";

const LOCAL_AI = import.meta.env.VITE_LOCAL_AI === "true";
const LOCAL_AI_URL =
  (import.meta.env.VITE_LOCAL_AI_URL as string | undefined) ||
  "http://localhost:1234/v1/chat/completions";
const LOCAL_AI_MODEL =
  (import.meta.env.VITE_LOCAL_AI_MODEL as string | undefined) || "local-model";

const FUNCTIONS_BASE =
  (import.meta.env.VITE_FUNCTIONS_BASE as string | undefined)?.replace(/\/$/, "") ||
  "/.netlify/functions";

export async function callFunction<TResponse>(
  name: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const byok = getActiveByokConfig();
  if (byok) {
    return (await callByokAi(byok, name, body)) as TResponse;
  }

  if (LOCAL_AI) {
    return (await callLocalAi(name, body)) as TResponse;
  }

  let res: Response;
  try {
    res = await fetch(`${FUNCTIONS_BASE}/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      `Could not reach the "${name}" function. In local dev, run "netlify dev" so functions are served.`,
    );
  }

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const message =
      (json as { error?: string } | null)?.error ??
      `Request to "${name}" failed (${res.status})`;
    throw new Error(message);
  }

  if (json == null) {
    throw new Error(`Function "${name}" returned no data`);
  }
  return json as TResponse;
}

/**
 * Route a function call to the user's BYOK provider. Builds prompts with the
 * same client-side builders, dispatches to the provider adapter, then
 * reshapes the response to match the Netlify function contract. The user's
 * API key never leaves their browser — request goes straight to the provider.
 */
async function callByokAi(
  cfg: ByokConfig,
  name: string,
  body: Record<string, unknown>,
): Promise<unknown> {
  if (name === "generate-charter") {
    const { inputs, templateContext, existingCharter, onlySectionId } = body as {
      inputs: MinimalInputs;
      templateContext?: string;
      existingCharter?: Charter;
      onlySectionId?: import("@/types/charter").CharterSectionId;
    };
    const { system, user } = buildGenerationPrompt(
      inputs,
      templateContext,
      existingCharter,
      onlySectionId,
    );
    const result = await clientChatCompletion(
      cfg,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.4 },
    );
    const parsed = safeParseJson(result.content) as { sections?: unknown[] };
    return {
      sections: parsed.sections ?? [],
      metadata: { model: result.model, tokensUsed: result.tokensUsed },
    };
  }

  if (name === "score-confidence") {
    const { generatedSection, sourceInputs, existingCharter } = body as {
      generatedSection: GeneratedSection;
      sourceInputs: MinimalInputs;
      existingCharter?: Charter;
    };
    const { system, user } = buildConfidenceScoringPrompt(
      generatedSection,
      sourceInputs,
      existingCharter,
    );
    const result = await clientChatCompletion(
      cfg,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.2 },
    );
    const parsed = safeParseJson(result.content) as {
      score?: number;
      reasoning?: string;
      flags?: string[];
    };
    return {
      score: parsed.score ?? 0,
      reasoning: parsed.reasoning ?? "",
      flags: parsed.flags ?? [],
    };
  }

  if (name === "suggest-engagement") {
    const { stakeholder, projectContext } = body as {
      stakeholder: StakeholderForSuggestion;
      projectContext: { name: string; summary: string; goals: string };
    };
    const { system, user } = buildEngagementSuggestionPrompt(
      stakeholder,
      projectContext,
    );
    const result = await clientChatCompletion(
      cfg,
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.4 },
    );
    const parsed = safeParseJson(result.content) as {
      summary?: string;
      actions?: string[];
    };
    return {
      summary: parsed.summary ?? "",
      actions: parsed.actions ?? [],
    };
  }

  throw new Error(`BYOK mode: unknown function "${name}"`);
}

/**
 * Route a function call to LM Studio. Builds the prompt with the same
 * builders the server uses, calls /v1/chat/completions, then reshapes the
 * response so callers can't tell whether they hit a Netlify Function or a
 * local model.
 */
async function callLocalAi(name: string, body: Record<string, unknown>): Promise<unknown> {
  if (name === "generate-charter") {
    const { inputs, templateContext, existingCharter } = body as {
      inputs: MinimalInputs;
      templateContext?: string;
      existingCharter?: Charter;
    };
    const { system, user } = buildGenerationPrompt(
      inputs,
      templateContext,
      existingCharter,
    );
    const raw = await lmStudioChat(system, user);
    const parsed = safeParseJson(raw) as { sections?: unknown[] };
    return {
      sections: parsed.sections ?? [],
      metadata: { model: LOCAL_AI_MODEL, tokensUsed: 0 },
    };
  }

  if (name === "score-confidence") {
    const { generatedSection, sourceInputs, existingCharter } = body as {
      generatedSection: GeneratedSection;
      sourceInputs: MinimalInputs;
      existingCharter?: Charter;
    };
    const { system, user } = buildConfidenceScoringPrompt(
      generatedSection,
      sourceInputs,
      existingCharter,
    );
    const raw = await lmStudioChat(system, user);
    return safeParseJson(raw);
  }

  throw new Error(`Local AI mode: unknown function "${name}"`);
}

async function lmStudioChat(system: string, user: string): Promise<string> {
  // Small models love to "think out loud" before emitting the requested JSON.
  // Append a strict, terminal instruction and pair it with response_format so
  // both prompt-level and API-level guards push the model toward clean JSON.
  const guardedSystem =
    system +
    "\n\nCRITICAL OUTPUT RULES:\n" +
    "- Respond with ONLY a JSON object. No prose. No analysis. No markdown fences.\n" +
    "- Your FIRST character MUST be `{` and your LAST character MUST be `}`.\n" +
    "- Do not restate the task, do not explain your reasoning, do not add closing remarks.";

  let res: Response;
  try {
    res = await fetch(LOCAL_AI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: LOCAL_AI_MODEL,
        messages: [
          { role: "system", content: guardedSystem },
          { role: "user", content: user },
        ],
        temperature: 0.2,
        // LM Studio rejects `json_object`; it accepts `json_schema` or `text`.
        // A real schema would be ideal but each section uses a different shape,
        // so we rely on the prompt rules + tolerant parser instead.
        stream: false,
      }),
    });
  } catch {
    throw new Error(
      `Could not reach LM Studio at ${LOCAL_AI_URL}. Make sure LM Studio is running with a model loaded and the local server enabled (CORS on).`,
    );
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LM Studio error ${res.status}: ${detail || res.statusText}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

/**
 * Local models often wrap JSON in markdown fences, add a stray prose line, or
 * emit minor syntax quirks (trailing commas, dangling periods after numbers).
 * Strip fences, isolate the outer JSON object, then sanitize before parsing.
 */
function safeParseJson(text: string): unknown {
  const trimmed = text.trim();
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const attempts: string[] = [stripped];
  // Greedy: largest substring from first `{` to last `}`.
  const first = stripped.indexOf("{");
  const last = stripped.lastIndexOf("}");
  if (first >= 0 && last > first) {
    attempts.push(stripped.slice(first, last + 1));
  }
  // Strict: find the first balanced `{...}` block (handles "prose then JSON").
  const balanced = extractBalancedJsonObject(stripped);
  if (balanced) attempts.push(balanced);

  for (const raw of attempts) {
    const cleaned = sanitizeLooseJson(raw);
    try {
      return JSON.parse(cleaned);
    } catch {
      // fall through to next attempt
    }
  }

  const preview = stripped.slice(0, 200).replace(/\s+/g, " ");
  throw new Error(
    `Local model returned non-JSON output. First chars: "${preview}". Try a more capable model or lower temperature.`,
  );
}

/**
 * Scan for the first top-level `{...}` whose braces balance, respecting
 * strings and escapes. Useful when the model emits reasoning prose first and
 * the JSON block sits in the middle/end of the response.
 */
function extractBalancedJsonObject(s: string): string | null {
  for (let i = 0; i < s.length; i++) {
    if (s[i] !== "{") continue;
    let depth = 0;
    let inStr = false;
    let escape = false;
    for (let j = i; j < s.length; j++) {
      const ch = s[j];
      if (inStr) {
        if (escape) escape = false;
        else if (ch === "\\") escape = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return s.slice(i, j + 1);
      }
    }
  }
  return null;
}

/** Forgiving rewrites for the kinds of small JSON mistakes local models make. */
function sanitizeLooseJson(raw: string): string {
  return raw
    // "score": 95. → "score": 95   (trailing dot on a number before , } or ])
    .replace(/(\d)\.(\s*[,}\]])/g, "$1$2")
    // trailing comma before } or ]
    .replace(/,(\s*[}\]])/g, "$1")
    // smart quotes → straight quotes
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");
}
