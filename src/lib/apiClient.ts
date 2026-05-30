/**
 * Thin client for the Netlify Functions that proxy OpenAI. The functions live
 * at /.netlify/functions/<name> and read OPENAI_API_KEY server-side, so no API
 * key is ever exposed to the browser.
 *
 * In local dev, run `netlify dev` (not plain `vite`) so these endpoints exist.
 */

const FUNCTIONS_BASE =
  (import.meta.env.VITE_FUNCTIONS_BASE as string | undefined)?.replace(/\/$/, "") ||
  "/.netlify/functions";

export async function callFunction<TResponse>(
  name: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
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
