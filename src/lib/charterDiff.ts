/**
 * Compute human-readable diffs between an existing charter section and a
 * proposed AI revision. Used by the refine-mode review UI so the user can
 * see exactly what changed before accepting.
 *
 * Returns an array of FieldDiff entries describing scalar field changes
 * (with old + new values) and list field summaries (counts only — diffing
 * arrays of objects without stable ids is unreliable).
 */
import type { Charter, CharterSectionId } from "@/types/charter";
import type { GeneratedSection } from "@/types/ai";

export type FieldChangeKind = "unchanged" | "filled" | "modified" | "list";

export interface FieldDiff {
  label: string;
  kind: FieldChangeKind;
  /** For scalar fields: the old value as a string. */
  oldValue?: string;
  /** For scalar fields: the new value as a string. */
  newValue?: string;
  /** For list fields: summary like "3 → 5". */
  listSummary?: { before: number; after: number };
}

export interface SectionDiff {
  sectionId: CharterSectionId;
  fields: FieldDiff[];
  /** True if any field changed (filled, modified, or list size changed). */
  hasChanges: boolean;
}

const SCALAR_FIELDS: Partial<Record<CharterSectionId, Array<{ key: string; label: string }>>> = {
  basics: [
    { key: "projectName", label: "Project name" },
    { key: "sponsor", label: "Sponsor" },
    { key: "projectManager", label: "Project manager" },
    { key: "startDate", label: "Start date" },
    { key: "targetEndDate", label: "Target end date" },
    { key: "summary", label: "Summary" },
  ],
  goals: [
    { key: "visionStatement", label: "Vision statement" },
    { key: "businessCase", label: "Business case" },
  ],
  timeline: [
    { key: "totalBudget", label: "Total budget" },
    { key: "currency", label: "Currency" },
    { key: "budgetNotes", label: "Budget notes" },
  ],
};

const LIST_FIELDS: Partial<Record<CharterSectionId, Array<{ key: string; label: string }>>> = {
  goals: [
    { key: "objectives", label: "Objectives" },
    { key: "successCriteria", label: "Success criteria" },
  ],
  stakeholders: [{ key: "stakeholders", label: "Stakeholders" }],
  scope: [
    { key: "inScope", label: "In scope" },
    { key: "outOfScope", label: "Out of scope" },
    { key: "constraints", label: "Constraints" },
  ],
  risks: [
    { key: "risks", label: "Risks" },
    { key: "assumptions", label: "Assumptions" },
    { key: "dependencies", label: "Dependencies" },
  ],
  deliverables: [{ key: "deliverables", label: "Deliverables" }],
  timeline: [{ key: "milestones", label: "Milestones" }],
};

function getSectionPayload(
  charter: Charter,
  sectionId: CharterSectionId,
): Record<string, unknown> {
  return charter[sectionId] as unknown as Record<string, unknown>;
}

function toStringForDisplay(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return "";
}

export function diffSection(
  charter: Charter,
  generated: GeneratedSection,
): SectionDiff {
  const before = getSectionPayload(charter, generated.sectionId);
  const after = generated.data;

  const fields: FieldDiff[] = [];

  const scalars = SCALAR_FIELDS[generated.sectionId] ?? [];
  for (const { key, label } of scalars) {
    const oldRaw = before?.[key];
    const newRaw = after?.[key];
    const oldStr = toStringForDisplay(oldRaw);
    const newStr = toStringForDisplay(newRaw);
    if (oldStr === newStr || newStr === "") {
      fields.push({ label, kind: "unchanged", oldValue: oldStr, newValue: newStr });
    } else if (oldStr === "") {
      fields.push({ label, kind: "filled", oldValue: "", newValue: newStr });
    } else {
      fields.push({ label, kind: "modified", oldValue: oldStr, newValue: newStr });
    }
  }

  const lists = LIST_FIELDS[generated.sectionId] ?? [];
  for (const { key, label } of lists) {
    const oldArr = Array.isArray(before?.[key]) ? (before[key] as unknown[]) : [];
    const newArr = Array.isArray(after?.[key]) ? (after[key] as unknown[]) : [];
    fields.push({
      label,
      kind: "list",
      listSummary: { before: oldArr.length, after: newArr.length },
    });
  }

  const hasChanges = fields.some(
    (f) =>
      f.kind === "filled" ||
      f.kind === "modified" ||
      (f.kind === "list" &&
        f.listSummary !== undefined &&
        f.listSummary.before !== f.listSummary.after),
  );

  return { sectionId: generated.sectionId, fields, hasChanges };
}
