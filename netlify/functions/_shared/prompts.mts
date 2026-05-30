// Self-contained prompt builders for the Netlify Functions runtime.
// Mirror of src/services/ai/promptBuilders.ts (the client can't import these
// server files, and vice-versa, so the prompt text is duplicated here).

interface MinimalInputs {
  projectName?: string;
  goals?: string;
  stakeholders?: string;
  industry?: string;
}

const OUTPUT_CONTRACT = `Return ONLY valid JSON of the form:
{ "sections": [ { "sectionId": one of "basics"|"goals"|"stakeholders"|"scope"|"risks"|"deliverables"|"timeline", "title": string, "summary": string, "data": object } ] }
Data shapes:
- basics: { projectName, sponsor, projectManager, startDate, targetEndDate, summary }
- goals: { visionStatement, businessCase, objectives:[{statement,metric,priority}], successCriteria:string[] }
- stakeholders: { stakeholders:[{name,role,category,influence,interest}] }
- scope: { inScope:string[], outOfScope:string[], constraints:[{description,type}] }
- risks: { risks:[{description,probability,impact,mitigation}], assumptions:string[], dependencies:string[] }
- deliverables: { deliverables:[{name,description,acceptanceCriteria,dueDate}] }
- timeline: { milestones:[{title,date,type}], totalBudget:number, currency, budgetNotes }`;

export function buildGenerationPrompt(
  inputs: MinimalInputs,
  templateContext?: string,
): { system: string; user: string } {
  const system = [
    "You are an expert project management consultant who drafts complete, realistic project charters.",
    "Extrapolate sensible, industry-appropriate detail from sparse inputs, but never invent specific people, vendors, or figures that imply false precision.",
    "Use ISO 8601 dates and conservative estimates.",
    OUTPUT_CONTRACT,
  ].join("\n\n");

  const user = [
    `Project name: ${inputs.projectName || "(unspecified)"}`,
    `Primary goals: ${inputs.goals || "(unspecified)"}`,
    `Key stakeholders: ${inputs.stakeholders || "(unspecified)"}`,
    inputs.industry ? `Industry: ${inputs.industry}` : null,
    templateContext ? `Template context: ${templateContext}` : null,
    "",
    "Draft every section. Note extrapolation assumptions in each section summary.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export function buildConfidenceScoringPrompt(
  generatedSection: { sectionId: string; data: unknown },
  sourceInputs: MinimalInputs,
): { system: string; user: string } {
  const system = [
    "You audit AI-generated project charter sections for over-extrapolation.",
    "Judge how well-grounded the section is on a 0-100 scale (100 = directly supported by inputs, 0 = pure speculation).",
    'Return ONLY JSON: { "score": number, "reasoning": string, "flags": string[] }.',
  ].join("\n\n");

  const user = [
    "ORIGINAL INPUTS:",
    `- Project: ${sourceInputs.projectName ?? "(none)"}`,
    `- Goals: ${sourceInputs.goals ?? "(none)"}`,
    `- Stakeholders: ${sourceInputs.stakeholders ?? "(none)"}`,
    "",
    `GENERATED SECTION (${generatedSection.sectionId}):`,
    JSON.stringify(generatedSection.data, null, 2),
  ].join("\n");

  return { system, user };
}
