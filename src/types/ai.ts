import type { CharterSectionId } from "@/types/charter";

/**
 * AI generation & confidence-scoring contracts shared between the client
 * services, the React hooks, and the Supabase edge functions.
 */

/** One AI-drafted charter section. `data` is shaped like the matching Charter section. */
export interface GeneratedSection {
  sectionId: CharterSectionId;
  title: string;
  /** Structured payload to merge into the charter store. */
  data: Record<string, unknown>;
  /** Short prose rationale shown in the preview. */
  summary: string;
}

/** Confidence verdict for a single generated section. */
export interface ConfidenceScore {
  sectionId: CharterSectionId;
  /** 0–100 certainty that the extrapolation is well-grounded. */
  score: number;
  reasoning: string;
  /** Notable assumptions or gaps the reviewer should check. */
  flags: string[];
}

export interface GenerationMetadata {
  model: string;
  tokensUsed: number;
}

/** Full payload returned by the generate-charter edge function. */
export interface GenerationResult {
  sections: GeneratedSection[];
  metadata: GenerationMetadata;
}

/** Confidence bands used for badge coloring across the UI. */
export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}
