import { z } from "zod";
import type { Charter, MinimalInputs } from "@/types/charter";
import type { ConfidenceScore, GeneratedSection } from "@/types/ai";
import { callFunction } from "@/lib/apiClient";

const scoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  flags: z.array(z.string()),
});

/**
 * Score how well a generated section is grounded in the original inputs by
 * calling the `score-confidence` Netlify Function. Returns a 0–100 score with
 * reasoning and reviewer flags.
 */
export async function scoreConfidence(
  generated: GeneratedSection,
  sources: MinimalInputs,
  existingCharter?: Charter,
): Promise<ConfidenceScore> {
  const response = await callFunction<z.infer<typeof scoreResponseSchema>>(
    "score-confidence",
    {
      generatedSection: generated,
      sourceInputs: sources,
      existingCharter,
    },
  );

  const parsed = scoreResponseSchema.parse(response);

  return {
    sectionId: generated.sectionId,
    score: Math.round(parsed.score),
    reasoning: parsed.reasoning,
    flags: parsed.flags,
  };
}
