/**
 * Core domain model for a Project Charter.
 *
 * A Charter is composed of seven sections that map 1:1 to the wizard steps.
 * Every downstream feature (AI generation, validation, timeline, export)
 * reads from this shape, so it is the single source of truth.
 */

export type Priority = "low" | "medium" | "high" | "critical";

export type StakeholderCategory = "internal" | "external" | "regulatory";

export type MilestoneType = "milestone" | "deliverable" | "review";

/** Section 1 — Project Basics */
export interface ProjectBasics {
  projectName: string;
  sponsor: string;
  projectManager: string;
  startDate: string; // ISO date
  targetEndDate: string; // ISO date
  summary: string;
}

/** Section 2 — Goals & Objectives */
export interface Objective {
  id: string;
  statement: string;
  metric: string; // how success is measured
  priority: Priority;
}

export interface GoalsObjectives {
  visionStatement: string;
  businessCase: string;
  objectives: Objective[];
  successCriteria: string[];
}

/** Section 3 — Stakeholders */
export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  category: StakeholderCategory;
  influence: 1 | 2 | 3 | 4 | 5;
  interest: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export interface Stakeholders {
  stakeholders: Stakeholder[];
}

/** Section 4 — Scope & Constraints */
export interface Constraint {
  id: string;
  description: string;
  type: "budget" | "time" | "resource" | "technical" | "regulatory";
}

export interface ScopeConstraints {
  inScope: string[];
  outOfScope: string[];
  constraints: Constraint[];
}

/** Section 5 — Risks & Assumptions */
export interface Risk {
  id: string;
  description: string;
  probability: Priority;
  impact: Priority;
  mitigation: string;
}

export interface RiskAssumptions {
  risks: Risk[];
  assumptions: string[];
  dependencies: string[];
}

/** Section 6 — Deliverables */
export interface Deliverable {
  id: string;
  name: string;
  description: string;
  acceptanceCriteria: string;
  dueDate: string; // ISO date
}

export interface Deliverables {
  deliverables: Deliverable[];
}

/** Section 7 — Timeline & Budget */
export interface Milestone {
  id: string;
  title: string;
  date: string; // ISO date
  type: MilestoneType;
  owner?: string;
}

export interface TimelineBudget {
  milestones: Milestone[];
  totalBudget: number;
  currency: string;
  budgetNotes: string;
}

/** The full Charter aggregate. */
export interface Charter {
  id: string;
  templateId: string | null;
  createdAt: string;
  updatedAt: string;
  basics: ProjectBasics;
  goals: GoalsObjectives;
  stakeholders: Stakeholders;
  scope: ScopeConstraints;
  risks: RiskAssumptions;
  deliverables: Deliverables;
  timeline: TimelineBudget;
}

/** Identifiers for each wizard section, in order. */
export type CharterSectionId =
  | "basics"
  | "goals"
  | "stakeholders"
  | "scope"
  | "risks"
  | "deliverables"
  | "timeline";

export const CHARTER_SECTION_IDS: CharterSectionId[] = [
  "basics",
  "goals",
  "stakeholders",
  "scope",
  "risks",
  "deliverables",
  "timeline",
];

export const SECTION_LABELS: Record<CharterSectionId, string> = {
  basics: "Project Basics",
  goals: "Goals & Objectives",
  stakeholders: "Stakeholders",
  scope: "Scope & Constraints",
  risks: "Risks & Assumptions",
  deliverables: "Deliverables",
  timeline: "Timeline & Budget",
};

/**
 * Minimal inputs the AI auto-generator (Phase 2) needs to draft a charter.
 * Defined here so Phase 1 forms can collect them without a forward dependency.
 */
export interface MinimalInputs {
  projectName: string;
  goals: string;
  stakeholders: string;
  industry?: string;
}
