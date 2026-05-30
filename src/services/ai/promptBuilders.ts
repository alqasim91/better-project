import type { MinimalInputs } from "@/types/charter";
import type { GeneratedSection } from "@/types/ai";

export interface ChatPrompt {
  system: string;
  user: string;
}

/**
 * JSON schema description embedded in the generation prompt so GPT-4 returns
 * a predictable, parseable shape. Kept as prose (not a $ref schema) because
 * the model reads it as instructions.
 */
const GENERATION_OUTPUT_CONTRACT = `Return ONLY valid JSON of the form:
{
  "sections": [
    {
      "sectionId": "basics" | "goals" | "stakeholders" | "scope" | "risks" | "deliverables" | "timeline",
      "title": string,
      "summary": string,            // one sentence describing what you inferred
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

/**
 * Build the GPT-4 prompt that drafts a full charter from minimal inputs.
 * `templateContext` carries industry hints from the selected Smart Template.
 */
export function buildGenerationPrompt(
  minimalInputs: MinimalInputs,
  templateContext?: string,
): ChatPrompt {
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
