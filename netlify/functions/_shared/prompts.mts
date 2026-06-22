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
- timeline: { milestones:[{title,date,type}], totalBudget:number, currency, budgetNotes }
The "summary" of each section is ONE plain sentence on what you drafted/refined — no methodology commentary.`;

// Volume guardrails for cold-start generation. Without these the model fills
// every array with 7-10 items and invents stakeholders the user never named.
const COLD_START_VOLUME_RULES = [
  "KEEP THE CHARTER FOCUSED — volume rules (this matters):",
  "- Every list (objectives, successCriteria, stakeholders, inScope, outOfScope, constraints, risks, assumptions, dependencies, deliverables, milestones) must contain AT MOST 3-5 items. Pick only the most important, highest-impact ones. Never pad a list to look thorough.",
  "- Do NOT invent stakeholders, people, teams, vendors, or named entities the user did not mention. Use the stakeholders the user named, plus at most 1-2 additional roles, and only if one is genuinely essential to the project.",
  "- Prefer fewer, stronger, specific items over many generic ones. Quality over quantity.",
  '- Each section "summary" is ONE plain sentence stating what you drafted or inferred. Do not narrate your methodology or note that something is "typical" or "based on standard structures".',
].join("\n");

// Lighter volume guidance for the refine path: never cap or delete the user's
// own items — only stop over-expansion of empty sections and invented entities.
const REFINE_VOLUME_RULES = [
  "KEEP IT FOCUSED:",
  "- When filling empty fields or expanding thin lists, add only what's essential — do not pad a list beyond about 5 items. Never remove or shorten items the user already entered.",
  "- Never invent named people, vendors, teams, or stakeholders the user did not mention.",
  '- Each section "summary" is ONE plain sentence. No methodology narration.',
].join("\n");

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

type CharterSectionId =
  | "basics"
  | "goals"
  | "stakeholders"
  | "scope"
  | "risks"
  | "deliverables"
  | "timeline";

const SECTION_DATA_SHAPE: Record<CharterSectionId, string> = {
  basics:
    "{ projectName, sponsor, projectManager, startDate (ISO), targetEndDate (ISO), summary }",
  goals:
    "{ visionStatement, businessCase, objectives:[{statement,metric,priority}], successCriteria:string[] }",
  stakeholders:
    '{ stakeholders:[{name,role,category:"internal"|"external"|"regulatory",influence:1-5,interest:1-5}] }',
  scope:
    "{ inScope:string[], outOfScope:string[], constraints:[{description,type}] }",
  risks:
    "{ risks:[{description,probability,impact,mitigation}], assumptions:string[], dependencies:string[] }",
  deliverables:
    "{ deliverables:[{name,description,acceptanceCriteria,dueDate}] }",
  timeline:
    '{ milestones:[{title,date,type:"milestone"|"deliverable"|"review"}], totalBudget:number, currency, budgetNotes }',
};

const SECTION_LABEL: Record<CharterSectionId, string> = {
  basics: "Project Basics",
  goals: "Goals & Objectives",
  stakeholders: "Stakeholders",
  scope: "Scope & Constraints",
  risks: "Risks & Assumptions",
  deliverables: "Deliverables",
  timeline: "Timeline & Budget",
};

export function buildGenerationPrompt(
  inputs: MinimalInputs,
  templateContext?: string,
  existingCharter?: unknown,
  onlySectionId?: CharterSectionId | null,
): { system: string; user: string } {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (onlySectionId) {
    const shape = SECTION_DATA_SHAPE[onlySectionId];
    const label = SECTION_LABEL[onlySectionId];
    const system = [
      "You are an expert project management consultant improving ONE section of an in-progress project charter.",
      `Today's date is ${today}. All generated dates MUST be today or in the future.`,
      `You will improve ONLY the "${onlySectionId}" (${label}) section. Do NOT touch any other section.`,
      "Rules:",
      "1. PRESERVE every concrete fact the user already entered in this section: names, dates, numbers.",
      "2. REPHRASE rough notes into clear, professional charter language.",
      "3. FILL empty fields and extend short lists with plausible, industry-appropriate detail.",
      "4. Use the OTHER sections of the charter as context to keep this section consistent.",
      "5. Never invent specific named people, vendors, or precise financial figures.",
      `Return ONLY valid JSON of the form: { "sections": [ { "sectionId": "${onlySectionId}", "title": "${label}", "summary": "one sentence on what changed", "data": ${shape} } ] }`,
      "Do not include any other sections. No markdown fences. No commentary.",
    ].join("\n\n");

    const user = [
      "FULL CHARTER FOR CONTEXT (only improve the marked section):",
      JSON.stringify(existingCharter ?? {}, null, 2),
      "",
      `SECTION TO IMPROVE: ${onlySectionId} (${label})`,
      "",
      "ADDITIONAL CONTEXT FROM USER:",
      `- Project name: ${inputs.projectName || "(use what's in the charter)"}`,
      inputs.goals ? `- Notes: ${inputs.goals}` : null,
      inputs.industry ? `- Industry: ${inputs.industry}` : null,
      templateContext ? `- Template context: ${templateContext}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    return { system, user };
  }

  const isRefinement = hasMeaningfulContent(existingCharter);

  if (isRefinement) {
    const system = [
      "You are an expert project management consultant refining an in-progress project charter.",
      "Your job is to POLISH and EXTEND what the user has already written — not replace it.",
      `Today's date is ${today}. All generated dates MUST be today or in the future — never in the past. If the user has not specified a start date, default it to today.`,
      "Rules:",
      "1. PRESERVE every concrete fact the user provided: names, dates, numbers, vendors, specific wording of objectives, etc. Do not change a person's name, swap a date, or alter a budget number.",
      "2. REPHRASE rough notes and incomplete sentences into clear, professional charter language while keeping the user's meaning.",
      "3. FILL empty fields with plausible, industry-appropriate detail. If a field already has content, only improve wording — do not invent new facts on top.",
      "4. EXPAND short lists (objectives, stakeholders, risks, etc.) with additional plausible items only if the list looks too thin, marking the addition's reasoning in the section summary.",
      "5. Never invent specific named people, vendors, or precise financial figures.",
      "6. Use ISO 8601 dates and conservative estimates.",
      REFINE_VOLUME_RULES,
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
    `Today's date is ${today}. All generated dates MUST be today or in the future — never in the past. Default the project start date to today unless the user specifies otherwise.`,
    "Extrapolate sensible, industry-appropriate detail from sparse inputs, but never invent specific people, vendors, or figures that imply false precision.",
    "Use ISO 8601 dates and conservative estimates.",
    COLD_START_VOLUME_RULES,
    OUTPUT_CONTRACT,
  ].join("\n\n");

  const user = [
    `Project name: ${inputs.projectName || "(unspecified)"}`,
    `Primary goals: ${inputs.goals || "(unspecified)"}`,
    `Key stakeholders: ${inputs.stakeholders || "(unspecified)"}`,
    inputs.industry ? `Industry: ${inputs.industry}` : null,
    templateContext ? `Template context: ${templateContext}` : null,
    "",
    "Draft every section. Keep each list to the few most important items (3-5 max) and do not invent stakeholders or entities beyond what's given.",
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export interface StakeholderForSuggestion {
  name: string;
  role: string;
  category: string;
  influence: number;
  interest: number;
  quadrant: string;
}

export function buildEngagementSuggestionPrompt(
  stakeholder: StakeholderForSuggestion,
  projectContext: { name: string; summary: string; goals: string },
): { system: string; user: string } {
  const system = [
    "You are an expert project management consultant advising on stakeholder engagement.",
    "Given one stakeholder, their power/interest quadrant, and the project context, return a concrete engagement strategy in 3 specific bullets.",
    "Be specific and actionable. Avoid generic advice. Reference the project context where useful.",
    'Return ONLY valid JSON: { "summary": "one-line strategy", "actions": [string, string, string] }. No markdown, no commentary.',
  ].join("\n\n");

  const user = [
    `PROJECT: ${projectContext.name || "(unnamed)"}`,
    projectContext.summary ? `Summary: ${projectContext.summary}` : null,
    projectContext.goals ? `Goals: ${projectContext.goals}` : null,
    "",
    "STAKEHOLDER:",
    `- Name: ${stakeholder.name || "(unnamed)"}`,
    `- Role: ${stakeholder.role || "(unspecified)"}`,
    `- Category: ${stakeholder.category}`,
    `- Influence: ${stakeholder.influence}/5`,
    `- Interest: ${stakeholder.interest}/5`,
    `- Quadrant: ${stakeholder.quadrant}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export function buildConfidenceScoringPrompt(
  generatedSection: { sectionId: string; data: unknown },
  sourceInputs: MinimalInputs,
  existingCharter?: unknown,
): { system: string; user: string } {
  const isRefinement = hasMeaningfulContent(existingCharter);

  const system = [
    "You audit AI-generated project charter sections for over-extrapolation.",
    isRefinement
      ? "The user already had a partial charter; the AI was asked to refine and fill gaps. Judge how well-grounded the generated section is in the user's existing charter content PLUS any additional context they provided. Content that simply rephrases existing user content, or fills empty fields with plausible industry-standard detail, should score HIGH (80-100). Score LOW only for invented specific facts (names, exact figures, dates that contradict the user's input)."
      : "Judge how well-grounded the section is on a 0-100 scale (100 = directly supported by inputs, 0 = pure speculation).",
    'Return ONLY JSON: { "score": number, "reasoning": string, "flags": string[] }.',
  ].join("\n\n");

  const user = [
    isRefinement ? "USER'S EXISTING CHARTER (treat as authoritative source):" : null,
    isRefinement ? JSON.stringify(existingCharter, null, 2) : null,
    isRefinement ? "" : null,
    "ADDITIONAL USER INPUTS:",
    `- Project: ${sourceInputs.projectName ?? "(none)"}`,
    `- Goals: ${sourceInputs.goals ?? "(none)"}`,
    `- Stakeholders: ${sourceInputs.stakeholders ?? "(none)"}`,
    "",
    `GENERATED SECTION (${generatedSection.sectionId}):`,
    JSON.stringify(generatedSection.data, null, 2),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { system, user };
}
