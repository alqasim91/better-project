// Netlify Function: score-confidence
// POST { generatedSection, sourceInputs } → { score, reasoning, flags }
// Endpoint: /.netlify/functions/score-confidence
//
// Requires env var OPENAI_API_KEY (set in the Netlify dashboard).

import { chatCompletion, jsonResponse } from "./_shared/openai.mts";
import { buildConfidenceScoringPrompt } from "./_shared/prompts.mts";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { generatedSection, sourceInputs, existingCharter } = await req.json();
    if (!generatedSection || !sourceInputs) {
      return jsonResponse(
        { error: "Missing 'generatedSection' or 'sourceInputs'" },
        400,
      );
    }

    const { system, user } = buildConfidenceScoringPrompt(
      generatedSection,
      sourceInputs,
      existingCharter,
    );
    const result = await chatCompletion(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.1 },
    );

    const parsed = JSON.parse(result.content);
    return jsonResponse({
      score: parsed.score ?? 0,
      reasoning: parsed.reasoning ?? "",
      flags: parsed.flags ?? [],
    });
  } catch (err) {
    return jsonResponse(
      { error: (err as Error).message ?? "Scoring failed" },
      500,
    );
  }
};
