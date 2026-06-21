// Netlify Function: generate-charter
// POST { inputs, templateContext } → { sections, metadata }
// Endpoint: /.netlify/functions/generate-charter
//
// Requires env var OPENAI_API_KEY (set in the Netlify dashboard).

import { chatCompletion, jsonResponse } from "./_shared/openai.mts";
import { buildGenerationPrompt } from "./_shared/prompts.mts";

export default async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const { inputs, templateContext, existingCharter, onlySectionId } = await req.json();
    if (!inputs) {
      return jsonResponse({ error: "Missing 'inputs'" }, 400);
    }

    const { system, user } = buildGenerationPrompt(
      inputs,
      templateContext,
      existingCharter,
      onlySectionId,
    );
    const result = await chatCompletion([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);

    const parsed = JSON.parse(result.content);
    return jsonResponse({
      sections: parsed.sections ?? [],
      metadata: { model: result.model, tokensUsed: result.tokensUsed },
    });
  } catch (err) {
    return jsonResponse(
      { error: (err as Error).message ?? "Generation failed" },
      500,
    );
  }
};
