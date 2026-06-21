// Netlify Function: suggest-engagement
// POST { stakeholder, projectContext } → { summary, actions: string[] }
// Endpoint: /.netlify/functions/suggest-engagement

import { chatCompletion, jsonResponse } from "./_shared/openai.mts";
import { buildEngagementSuggestionPrompt } from "./_shared/prompts.mts";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { stakeholder, projectContext } = await req.json();
    if (!stakeholder) {
      return jsonResponse({ error: "Missing 'stakeholder'" }, 400);
    }

    const { system, user } = buildEngagementSuggestionPrompt(
      stakeholder,
      projectContext ?? { name: "", summary: "", goals: "" },
    );
    const result = await chatCompletion([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    const parsed = JSON.parse(result.content);
    return jsonResponse({
      summary: parsed.summary ?? "",
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    });
  } catch (err) {
    return jsonResponse(
      { error: (err as Error).message ?? "Suggestion failed" },
      500,
    );
  }
};
