import { z } from "zod";
import type { Charter, MinimalInputs, CharterSectionId } from "@/types/charter";
import type { GeneratedSection, GenerationResult } from "@/types/ai";
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
}

/**
 * Generate a full charter draft from minimal inputs by calling the
 * `generate-charter` Netlify Function, which performs the GPT-4 call
 * server-side to keep the API key off the client.
 */
export async function generateCharterDraft(
  inputs: MinimalInputs,
  options: GenerateOptions = {},
): Promise<GeneratedSection[]> {
  const response = await callFunction<GenerationResult>("generate-charter", {
    inputs,
    templateId: options.templateId ?? null,
    templateContext: options.templateContext,
    existingCharter: options.existingCharter,
  });

  const result = generationResultSchema.parse(response);
  return result.sections;
}
