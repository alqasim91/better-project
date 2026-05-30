import type { Charter, CharterSectionId } from "@/types/charter";
import { CHARTER_SECTION_IDS, SECTION_LABELS } from "@/types/charter";

/**
 * A single completeness check on the charter. `critical` checks gate export
 * (PDF/HTML); non-critical ones only affect the completeness percentage.
 */
interface FieldCheck {
  section: CharterSectionId;
  label: string;
  critical: boolean;
  isComplete: (c: Charter) => boolean;
}

const nonEmpty = (s: string) => s.trim().length > 0;

const CHECKS: FieldCheck[] = [
  // Basics
  { section: "basics", label: "Project name", critical: true, isComplete: (c) => nonEmpty(c.basics.projectName) },
  { section: "basics", label: "Sponsor", critical: false, isComplete: (c) => nonEmpty(c.basics.sponsor) },
  { section: "basics", label: "Project manager", critical: false, isComplete: (c) => nonEmpty(c.basics.projectManager) },
  { section: "basics", label: "Start date", critical: false, isComplete: (c) => nonEmpty(c.basics.startDate) },
  { section: "basics", label: "Target end date", critical: false, isComplete: (c) => nonEmpty(c.basics.targetEndDate) },
  { section: "basics", label: "Executive summary", critical: true, isComplete: (c) => c.basics.summary.trim().length >= 10 },
  // Goals
  { section: "goals", label: "Vision statement", critical: true, isComplete: (c) => nonEmpty(c.goals.visionStatement) },
  { section: "goals", label: "Business case", critical: false, isComplete: (c) => nonEmpty(c.goals.businessCase) },
  { section: "goals", label: "At least one objective", critical: true, isComplete: (c) => c.goals.objectives.some((o) => nonEmpty(o.statement)) },
  { section: "goals", label: "At least one success criterion", critical: false, isComplete: (c) => c.goals.successCriteria.length > 0 },
  // Stakeholders
  { section: "stakeholders", label: "At least one stakeholder", critical: true, isComplete: (c) => c.stakeholders.stakeholders.some((s) => nonEmpty(s.name)) },
  // Scope
  { section: "scope", label: "At least one in-scope item", critical: true, isComplete: (c) => c.scope.inScope.length > 0 },
  { section: "scope", label: "Out-of-scope defined", critical: false, isComplete: (c) => c.scope.outOfScope.length > 0 },
  // Risks
  { section: "risks", label: "At least one risk", critical: false, isComplete: (c) => c.risks.risks.some((r) => nonEmpty(r.description)) },
  { section: "risks", label: "Assumptions noted", critical: false, isComplete: (c) => c.risks.assumptions.length > 0 },
  // Deliverables
  { section: "deliverables", label: "At least one deliverable", critical: true, isComplete: (c) => c.deliverables.deliverables.some((d) => nonEmpty(d.name)) },
  // Timeline & budget
  { section: "timeline", label: "At least one milestone", critical: true, isComplete: (c) => c.timeline.milestones.some((m) => nonEmpty(m.title)) },
  { section: "timeline", label: "Budget set", critical: false, isComplete: (c) => c.timeline.totalBudget > 0 },
];

export interface SectionCompleteness {
  section: CharterSectionId;
  label: string;
  total: number;
  complete: number;
  percent: number;
  missing: string[];
}

export interface CompletenessReport {
  /** 0–100 overall completeness across all checks. */
  percent: number;
  /** All incomplete field labels. */
  missingFields: string[];
  /** Incomplete fields flagged `critical` (these block export). */
  missingCritical: string[];
  /** Per-section breakdown, in wizard order. */
  sections: SectionCompleteness[];
  /** True once no critical field is missing. */
  isExportReady: boolean;
}

/** Compute a full completeness report for a charter. Pure and cheap. */
export function computeCompleteness(charter: Charter): CompletenessReport {
  const sections: SectionCompleteness[] = CHARTER_SECTION_IDS.map((id) => {
    const checks = CHECKS.filter((c) => c.section === id);
    const missing = checks
      .filter((c) => !c.isComplete(charter))
      .map((c) => c.label);
    const complete = checks.length - missing.length;
    return {
      section: id,
      label: SECTION_LABELS[id],
      total: checks.length,
      complete,
      percent: checks.length === 0 ? 100 : Math.round((complete / checks.length) * 100),
      missing,
    };
  });

  const total = CHECKS.length;
  const completed = CHECKS.filter((c) => c.isComplete(charter)).length;
  const missingCritical = CHECKS.filter(
    (c) => c.critical && !c.isComplete(charter),
  ).map((c) => c.label);

  return {
    percent: total === 0 ? 100 : Math.round((completed / total) * 100),
    missingFields: CHECKS.filter((c) => !c.isComplete(charter)).map((c) => c.label),
    missingCritical,
    sections,
    isExportReady: missingCritical.length === 0,
  };
}
