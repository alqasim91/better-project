import type { Charter, MinimalInputs } from "@/types/charter";
import type { GeneratedSection } from "@/types/ai";

export interface ChatPrompt {
  system: string;
  user: string;
}

/**
 * JSON schema description embedded in the generation prompt so the model
 * returns a predictable, parseable shape. Kept as prose (not a $ref schema)
 * because the model reads it as instructions.
 */
const GENERATION_OUTPUT_CONTRACT = `Return ONLY valid JSON of the form:
{
  "sections": [
    {
      "sectionId": "basics" | "goals" | "stakeholders" | "scope" | "risks" | "deliverables" | "timeline",
      "title": string,
      "summary": string,            // one sentence describing what you inferred or refined
      "data": object                // fields matching that charter section
    }
  ]
}
Data shapes per sectionId:
- basics: { projectName, sponsor, projectManager, startDate (ISO), targetEndDate (ISO), summary }
- goals: { visionStatement, businessCase, objectives: [{ statement, metric, priority }], successCriteria: string[] }
- stakeholders: { stakeholders: [{ name, role, category: "internal"|"external"|"regulatory", influence: 1-5, interest: 1-5 }] }
- scope: { inScope: string[], outOfScope: string[], constraints: [{ description, type }] }
- risks: { risks: [{ description, probability, impact, mitigation }], assumptions: string[], dependencies: string[] }
- deliverables: { deliverables: [{ name, description, acceptanceCriteria, dueDate (ISO) }] }
- timeline: { milestones: [{ title, date (ISO), type: "milestone"|"deliverable"|"review" }], totalBudget: number, currency, budgetNotes }
Do not include markdown fences or commentary outside the JSON.`;

function hasMeaningfulContent(charter?: Charter): boolean {
  if (!charter) return false;
  return Boolean(
    charter.basics.summary?.trim() ||
      charter.basics.sponsor?.trim() ||
      charter.basics.projectManager?.trim() ||
      charter.goals.visionStatement?.trim() ||
      charter.goals.businessCase?.trim() ||
      charter.goals.objectives.length > 0 ||
      charter.stakeholders.stakeholders.length > 0 ||
      charter.scope.inScope.length > 0 ||
      charter.scope.outOfScope.length > 0 ||
      charter.deliverables.deliverables.length > 0 ||
      charter.risks.risks.length > 0 ||
      charter.timeline.milestones.length > 0,
  );
}

/**
 * Build the model prompt that drafts or refines a project charter.
 * If `existingCharter` already has user content, the model is told to
 * preserve and polish it rather than regenerate from scratch.
 */
export function buildGenerationPrompt(
  minimalInputs: MinimalInputs,
  templateContext?: string,
  existingCharter?: Charter,
): ChatPrompt {
  if (hasMeaningfulContent(existingCharter)) {
    const system = [
      "You are an expert project management consultant refining an in-progress project charter.",
      "Your job is to POLISH and EXTEND what the user has already written — not replace it.",
      "Rules:",
      "1. PRESERVE every concrete fact the user provided: names, dates, numbers, vendors, specific wording of objectives. Do not change a person's name, swap a date, or alter a budget number.",
      "2. REPHRASE rough notes and incomplete sentences into clear, professional charter language while keeping the user's meaning.",
      "3. FILL empty fields with plausible, industry-appropriate detail. If a field already has content, only improve wording — do not invent new facts on top.",
      "4. EXPAND short lists with additional plausible items only if the list looks too thin, noting the addition's reasoning in the section summary.",
      "5. Never invent specific named people, vendors, or precise financial figures.",
      "6. Use ISO 8601 dates and conservative estimates.",
      GENERATION_OUTPUT_CONTRACT,
    ].join("\n\n");

    const user = [
      "USER'S CURRENT CHARTER DRAFT (refine this — do not replace it):",
      JSON.stringify(existingCharter, null, 2),
      "",
      "ADDITIONAL CONTEXT FROM USER:",
      `- Project name: ${minimalInputs.projectName || "(use what's in the charter)"}`,
      minimalInputs.goals ? `- Primary goals hint: ${minimalInputs.goals}` : null,
      minimalInputs.stakeholders ? `- Key stakeholders hint: ${minimalInputs.stakeholders}` : null,
      minimalInputs.industry ? `- Industry: ${minimalInputs.industry}` : null,
      templateContext ? `- Template context: ${templateContext}` : null,
      "",
      "Return the FULL refined charter, all seven sections. Each section summary should briefly note what you refined vs. filled in.",
    ]
      .filter(Boolean)
      .join("\n");

    return { system, user };
  }

  const system = [
    "You are an expert project management consultant who drafts complete, realistic project charters.",
    "Extrapolate sensible, industry-appropriate detail from sparse inputs, but never invent specific people, vendors, or figures that imply false precision.",
    "Prefer ISO 8601 dates and conservative, defensible estimates.",
    GENERATION_OUTPUT_CONTRACT,
  ].join("\n\n");

  const user = [
    `Project name: ${minimalInputs.projectName || "(unspecified)"}`,
    `Primary goals: ${minimalInputs.goals || "(unspecified)"}`,
    `Key stakeholders: ${minimalInputs.stakeholders || "(unspecified)"}`,
    minimalInputs.industry ? `Industry: ${minimalInputs.industry}` : null,
    templateContext ? `Template context: ${templateContext}` : null,
    "",
    "Draft every section of the charter. Where you extrapolate beyond the inputs, keep it plausible and note the assumption in the section summary.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

/**
 * Build the prompt that scores how confidently a generated section is
 * grounded in the source inputs (vs. speculative extrapolation).
 */
export function buildConfidenceScoringPrompt(
  generatedSection: GeneratedSection,
  sourceInputs: MinimalInputs,
): ChatPrompt {
  const system = [
    "You audit AI-generated project charter sections for over-extrapolation.",
    "Given the original sparse inputs and a generated section, judge how well-grounded the section is on a 0-100 scale (100 = directly supported by inputs, 0 = pure speculation).",
    'Return ONLY JSON: { "score": number, "reasoning": string, "flags": string[] }.',
    "Each flag names a specific assumption or fabricated detail a human should verify.",
  ].join("\n\n");

  const user = [
    "ORIGINAL INPUTS:",
    `- Project: ${sourceInputs.projectName || "(none)"}`,
    `- Goals: ${sourceInputs.goals || "(none)"}`,
    `- Stakeholders: ${sourceInputs.stakeholders || "(none)"}`,
    "",
    `GENERATED SECTION (${generatedSection.sectionId} — ${generatedSection.title}):`,
    JSON.stringify(generatedSection.data, null, 2),
  ].join("\n");

  return { system, user };
}
