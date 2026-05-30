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

function hasMeaningfulContent(charter: unknown): boolean {
  if (!charter || typeof charter !== "object") return false;
  const c = charter as Record<string, any>;
  const basics = c.basics ?? {};
  const goals = c.goals ?? {};
  const stakeholders = c.stakeholders?.stakeholders ?? [];
  const scope = c.scope ?? {};
  const deliverables = c.deliverables?.deliverables ?? [];
  const risks = c.risks?.risks ?? [];
  const milestones = c.timeline?.milestones ?? [];

  return Boolean(
    basics.summary?.trim() ||
      basics.sponsor?.trim() ||
      basics.projectManager?.trim() ||
      goals.visionStatement?.trim() ||
      goals.businessCase?.trim() ||
      (goals.objectives?.length ?? 0) > 0 ||
      stakeholders.length > 0 ||
      (scope.inScope?.length ?? 0) > 0 ||
      (scope.outOfScope?.length ?? 0) > 0 ||
      deliverables.length > 0 ||
      risks.length > 0 ||
      milestones.length > 0,
  );
}

export function buildGenerationPrompt(
  inputs: MinimalInputs,
  templateContext?: string,
  existingCharter?: unknown,
): { system: string; user: string } {
  const isRefinement = hasMeaningfulContent(existingCharter);

  if (isRefinement) {
    const system = [
      "You are an expert project management consultant refining an in-progress project charter.",
      "Your job is to POLISH and EXTEND what the user has already written — not replace it.",
      "Rules:",
      "1. PRESERVE every concrete fact the user provided: names, dates, numbers, vendors, specific wording of objectives, etc. Do not change a person's name, swap a date, or alter a budget number.",
      "2. REPHRASE rough notes and incomplete sentences into clear, professional charter language while keeping the user's meaning.",
      "3. FILL empty fields with plausible, industry-appropriate detail. If a field already has content, only improve wording — do not invent new facts on top.",
      "4. EXPAND short lists (objectives, stakeholders, risks, etc.) with additional plausible items only if the list looks too thin, marking the addition's reasoning in the section summary.",
      "5. Never invent specific named people, vendors, or precise financial figures.",
      "6. Use ISO 8601 dates and conservative estimates.",
      OUTPUT_CONTRACT,
    ].join("\n\n");

    const user = [
      "USER'S CURRENT CHARTER DRAFT (refine this — do not replace it):",
      JSON.stringify(existingCharter, null, 2),
      "",
      "ADDITIONAL CONTEXT FROM USER:",
      `- Project name: ${inputs.projectName || "(use what's in the charter)"}`,
      inputs.goals ? `- Primary goals hint: ${inputs.goals}` : null,
      inputs.stakeholders ? `- Key stakeholders hint: ${inputs.stakeholders}` : null,
      inputs.industry ? `- Industry: ${inputs.industry}` : null,
      templateContext ? `- Template context: ${templateContext}` : null,
      "",
      "Return the FULL refined charter, all seven sections. Each section summary should briefly note what you refined vs. filled in.",
    ]
      .filter(Boolean)
      .join("\n");

    return { system, user };
  }

  // Cold-start generation from minimal inputs
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
