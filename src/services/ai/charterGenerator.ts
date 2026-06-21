import { z } from "zod";
import type {
  Charter,
  MinimalInputs,
  CharterSectionId,
} from "@/types/charter";
import type { GenerationResult, GeneratedSection } from "@/types/ai";
import { callFunction } from "@/lib/apiClient";
import { mergeSectionIntoCharter } from "@/lib/applyGenerated";
import { CHARTER_SECTION_IDS, SECTION_LABELS } from "@/types/charter";

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

export interface SequentialProgress {
  /** 0-indexed position in CHARTER_SECTION_IDS of the section being drafted. */
  index: number;
  total: number;
  sectionId: CharterSectionId;
  label: string;
}

export interface SequentialOptions extends GenerateOptions {
  /** Called whenever a section finishes (or fails). */
  onProgress?: (p: SequentialProgress) => void;
  /** Called with each completed section so the UI can stream results in. */
  onSection?: (section: GeneratedSection) => void;
}

/**
 * Generate a charter one section at a time, feeding each completed section
 * back as context for the next. Slower in total wall-clock for cloud APIs
 * (7 round-trips) but much more reliable on local models (LM Studio/Ollama)
 * where one big JSON blob risks both timeouts AND mid-output token truncation.
 *
 * A single section failing is non-fatal: the loop logs the error and moves
 * on, so the user keeps whatever did succeed.
 */
export async function generateCharterDraftSequential(
  inputs: MinimalInputs,
  baseCharter: Charter,
  options: SequentialOptions = {},
): Promise<GenerationResult> {
  let workingCharter: Charter = baseCharter;
  const collected: GeneratedSection[] = [];
  let lastModel = "";
  let totalTokens = 0;
  const errors: string[] = [];

  for (let i = 0; i < CHARTER_SECTION_IDS.length; i++) {
    const sectionId = CHARTER_SECTION_IDS[i];
    options.onProgress?.({
      index: i,
      total: CHARTER_SECTION_IDS.length,
      sectionId,
      label: SECTION_LABELS[sectionId],
    });

    try {
      const result = await callFunction<GenerationResult>("generate-charter", {
        inputs,
        templateId: options.templateId ?? null,
        templateContext: options.templateContext,
        // Always pass the accumulated charter as context. For section 0 it's
        // mostly empty (or template defaults); from section 1 onward it
        // includes earlier AI-drafted sections so dependent fields stay
        // consistent (risks reference stakeholders, timeline references
        // deliverables, etc.).
        existingCharter: workingCharter,
        onlySectionId: sectionId,
      });
      const parsed = generationResultSchema.parse(result);
      const section = parsed.sections.find((s) => s.sectionId === sectionId);
      if (section) {
        collected.push(section);
        workingCharter = mergeSectionIntoCharter(workingCharter, section);
        options.onSection?.(section);
      } else {
        errors.push(`${sectionId}: model returned no matching section`);
      }
      lastModel = parsed.metadata.model || lastModel;
      totalTokens += parsed.metadata.tokensUsed || 0;
    } catch (err) {
      errors.push(`${sectionId}: ${(err as Error).message}`);
    }
  }

  if (collected.length === 0) {
    // Every section failed — surface the first error so the caller can show it.
    throw new Error(
      errors[0] ?? "Sequential generation produced no sections.",
    );
  }

  return {
    sections: collected,
    metadata: { model: lastModel, tokensUsed: totalTokens },
  };
}
