import { z } from "zod";
import type { Charter, MinimalInputs, CharterSectionId } from "@/types/charter";
import type { GenerationResult } from "@/types/ai";
import { callFunction } from "@/lib/apiClient";

const SECTION_IDS = [
  "basics",
  "goals",
  "stakeholders",
  "scope",
  "risks",
  "deliverables",
  "timeline",
] as const satisfies readonly CharterSectionId[];

const generatedSectionSchema = z.object({
  sectionId: z.enum(SECTION_IDS),
  title: z.string(),
  summary: z.string(),
  data: z.record(z.unknown()),
});

const generationResultSchema = z.object({
  sections: z.array(generatedSectionSchema),
  metadata: z.object({
    model: z.string(),
    tokensUsed: z.number(),
  }),
});

export interface GenerateOptions {
  templateId?: string | null;
  templateContext?: string;
  existingCharter?: Charter;
  /** Restrict generation to a single section. The model is told to return
   * only that one section's data. Used by per-section "improve with AI". */
  onlySectionId?: CharterSectionId;
}

/**
 * Generate a charter draft (full or single-section) by calling the AI backend.
 * Returns sections plus provider metadata so the UI can surface what ran.
 */
export async function generateCharterDraft(
  inputs: MinimalInputs,
  options: GenerateOptions = {},
): Promise<GenerationResult> {
  const response = await callFunction<GenerationResult>("generate-charter", {
    inputs,
    templateId: options.templateId ?? null,
    templateContext: options.templateContext,
    existingCharter: options.existingCharter,
    onlySectionId: options.onlySectionId ?? null,
  });

  return generationResultSchema.parse(response);
}
