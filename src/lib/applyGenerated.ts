import { v4 as uuid } from "uuid";
import type { Charter, Priority } from "@/types/charter";
import type { GeneratedSection } from "@/types/ai";

/**
 * Merge an AI-generated section's loosely-typed `data` into a charter,
 * coercing fields and minting ids for array items. Unknown/missing fields
 * fall back to whatever the charter already holds, so a partial draft never
 * wipes existing user input.
 */
export function mergeSectionIntoCharter(
  charter: Charter,
  section: GeneratedSection,
): Charter {
  const d = section.data as Record<string, unknown>;
  const str = (v: unknown, fallback = ""): string =>
    typeof v === "string" ? v : fallback;
  const num = (v: unknown, fallback = 0): number =>
    typeof v === "number" ? v : fallback;
  const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
  const strList = (v: unknown): string[] =>
    arr(v).filter((x): x is string => typeof x === "string");
  const priority = (v: unknown): Priority =>
    v === "low" || v === "medium" || v === "high" || v === "critical"
      ? v
      : "medium";
  const clamp5 = (v: unknown): 1 | 2 | 3 | 4 | 5 => {
    const n = Math.round(num(v, 3));
    return (Math.min(5, Math.max(1, n)) as 1 | 2 | 3 | 4 | 5);
  };

  const next = { ...charter, updatedAt: new Date().toISOString() };

  switch (section.sectionId) {
    case "basics":
      next.basics = {
        ...charter.basics,
        projectName: str(d.projectName, charter.basics.projectName),
        sponsor: str(d.sponsor, charter.basics.sponsor),
        projectManager: str(d.projectManager, charter.basics.projectManager),
        startDate: str(d.startDate, charter.basics.startDate),
        targetEndDate: str(d.targetEndDate, charter.basics.targetEndDate),
        summary: str(d.summary, charter.basics.summary),
      };
      break;

    case "goals":
      next.goals = {
        visionStatement: str(d.visionStatement, charter.goals.visionStatement),
        businessCase: str(d.businessCase, charter.goals.businessCase),
        objectives: arr(d.objectives).map((o) => {
          const obj = o as Record<string, unknown>;
          return {
            id: uuid(),
            statement: str(obj.statement),
            metric: str(obj.metric),
            priority: priority(obj.priority),
          };
        }),
        successCriteria: strList(d.successCriteria),
      };
      break;

    case "stakeholders":
      next.stakeholders = {
        stakeholders: arr(d.stakeholders).map((s) => {
          const st = s as Record<string, unknown>;
          const category =
            st.category === "external" || st.category === "regulatory"
              ? st.category
              : "internal";
          return {
            id: uuid(),
            name: str(st.name),
            role: str(st.role),
            category,
            influence: clamp5(st.influence),
            interest: clamp5(st.interest),
            notes: typeof st.notes === "string" ? st.notes : undefined,
          };
        }),
      };
      break;

    case "scope": {
      const constraintType = (v: unknown) =>
        v === "time" || v === "resource" || v === "technical" || v === "regulatory"
          ? v
          : "budget";
      next.scope = {
        inScope: strList(d.inScope),
        outOfScope: strList(d.outOfScope),
        constraints: arr(d.constraints).map((c) => {
          const con = c as Record<string, unknown>;
          return {
            id: uuid(),
            description: str(con.description),
            type: constraintType(con.type),
          };
        }),
      };
      break;
    }

    case "risks":
      next.risks = {
        risks: arr(d.risks).map((r) => {
          const risk = r as Record<string, unknown>;
          return {
            id: uuid(),
            description: str(risk.description),
            probability: priority(risk.probability),
            impact: priority(risk.impact),
            mitigation: str(risk.mitigation),
          };
        }),
        assumptions: strList(d.assumptions),
        dependencies: strList(d.dependencies),
      };
      break;

    case "deliverables":
      next.deliverables = {
        deliverables: arr(d.deliverables).map((dl) => {
          const del = dl as Record<string, unknown>;
          return {
            id: uuid(),
            name: str(del.name),
            description: str(del.description),
            acceptanceCriteria: str(del.acceptanceCriteria),
            dueDate: str(del.dueDate),
          };
        }),
      };
      break;

    case "timeline": {
      const mtype = (v: unknown) =>
        v === "deliverable" || v === "review" ? v : "milestone";
      next.timeline = {
        milestones: arr(d.milestones).map((m) => {
          const ms = m as Record<string, unknown>;
          return {
            id: uuid(),
            title: str(ms.title),
            date: str(ms.date),
            type: mtype(ms.type),
            owner: typeof ms.owner === "string" ? ms.owner : undefined,
          };
        }),
        totalBudget: num(d.totalBudget, charter.timeline.totalBudget),
        currency: str(d.currency, charter.timeline.currency),
        budgetNotes: str(d.budgetNotes, charter.timeline.budgetNotes),
      };
      break;
    }
  }

  return next;
}
