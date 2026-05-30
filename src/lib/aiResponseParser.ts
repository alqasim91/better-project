import type { ZodSchema } from "zod";

/** Thrown when an AI response cannot be coerced into the expected schema. */
export class AiParseError extends Error {
  constructor(
    message: string,
    public readonly raw: string,
  ) {
    super(message);
    this.name = "AiParseError";
  }
}

/**
 * Extract the first balanced JSON object/array from a raw model response.
 * Handles code fences (```json ... ```) and leading/trailing prose.
 */
export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : raw).trim();

  const start = candidate.search(/[[{]/);
  if (start === -1) {
    throw new AiParseError("No JSON object found in response", raw);
  }

  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }

  throw new AiParseError("Unbalanced JSON in response", raw);
}

/**
 * Safely parse a structured AI response against a Zod schema.
 * Throws AiParseError with the raw payload attached on any failure so callers
 * can surface a useful message or fall back gracefully.
 */
export function parseStructuredResponse<T>(raw: string, schema: ZodSchema<T>): T {
  let json: unknown;
  try {
    json = JSON.parse(extractJson(raw));
  } catch (err) {
    if (err instanceof AiParseError) throw err;
    throw new AiParseError(
      `Invalid JSON: ${(err as Error).message}`,
      raw,
    );
  }

  const result = schema.safeParse(json);
  if (!result.success) {
    throw new AiParseError(
      `Response did not match schema: ${result.error.issues
        .map((i) => `${i.path.join(".")} ${i.message}`)
        .join("; ")}`,
      raw,
    );
  }
  return result.data;
}

/** Non-throwing variant returning a discriminated result. */
export function safeParseStructuredResponse<T>(
  raw: string,
  schema: ZodSchema<T>,
): { success: true; data: T } | { success: false; error: AiParseError } {
  try {
    return { success: true, data: parseStructuredResponse(raw, schema) };
  } catch (err) {
    const error =
      err instanceof AiParseError
        ? err
        : new AiParseError((err as Error).message, raw);
    return { success: false, error };
  }
}
