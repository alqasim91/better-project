import { z } from "zod";

/**
 * Zod schemas mirroring src/types/charter.ts.
 * Used by React Hook Form resolvers and by the Phase 2 validation engine.
 */

export const prioritySchema = z.enum(["low", "medium", "high", "critical"]);

export const projectBasicsSchema = z.object({
  projectName: z.string().min(2, "Project name is required"),
  sponsor: z.string().min(1, "Sponsor is required"),
  projectManager: z.string().min(1, "Project manager is required"),
  startDate: z.string().min(1, "Start date is required"),
  targetEndDate: z.string().min(1, "Target end date is required"),
  summary: z.string().min(10, "Provide a short summary (10+ characters)"),
});

export const objectiveSchema = z.object({
  id: z.string(),
  statement: z.string().min(1, "Objective statement is required"),
  metric: z.string().min(1, "A success metric is required"),
  priority: prioritySchema,
});

export const goalsObjectivesSchema = z.object({
  visionStatement: z.string().min(10, "Vision statement is required"),
  businessCase: z.string().min(10, "Business case is required"),
  objectives: z.array(objectiveSchema).min(1, "Add at least one objective"),
  successCriteria: z.array(z.string().min(1)).min(1, "Add at least one success criterion"),
});

export const stakeholderSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  category: z.enum(["internal", "external", "regulatory"]),
  influence: z.number().int().min(1).max(5),
  interest: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export const stakeholdersSchema = z.object({
  stakeholders: z.array(stakeholderSchema).min(1, "Add at least one stakeholder"),
});

export const constraintSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  type: z.enum(["budget", "time", "resource", "technical", "regulatory"]),
});

export const scopeConstraintsSchema = z.object({
  inScope: z.array(z.string().min(1)).min(1, "Define at least one in-scope item"),
  outOfScope: z.array(z.string().min(1)),
  constraints: z.array(constraintSchema),
});

export const riskSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  probability: prioritySchema,
  impact: prioritySchema,
  mitigation: z.string().min(1, "Mitigation is required"),
});

export const riskAssumptionsSchema = z.object({
  risks: z.array(riskSchema),
  assumptions: z.array(z.string().min(1)),
  dependencies: z.array(z.string().min(1)),
});

export const deliverableSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  acceptanceCriteria: z.string().min(1, "Acceptance criteria are required"),
  dueDate: z.string().min(1, "Due date is required"),
});

export const deliverablesSchema = z.object({
  deliverables: z.array(deliverableSchema).min(1, "Add at least one deliverable"),
});

export const milestoneSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  date: z.string().min(1, "Date is required"),
  type: z.enum(["milestone", "deliverable", "review"]),
  owner: z.string().optional(),
});

export const timelineBudgetSchema = z.object({
  milestones: z.array(milestoneSchema).min(1, "Add at least one milestone"),
  totalBudget: z.number().min(0, "Budget cannot be negative"),
  currency: z.string().min(1),
  budgetNotes: z.string(),
});

export const charterSchema = z.object({
  id: z.string(),
  templateId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  basics: projectBasicsSchema,
  goals: goalsObjectivesSchema,
  stakeholders: stakeholdersSchema,
  scope: scopeConstraintsSchema,
  risks: riskAssumptionsSchema,
  deliverables: deliverablesSchema,
  timeline: timelineBudgetSchema,
});

/** Per-section schema lookup, keyed by CharterSectionId. */
export const sectionSchemas = {
  basics: projectBasicsSchema,
  goals: goalsObjectivesSchema,
  stakeholders: stakeholdersSchema,
  scope: scopeConstraintsSchema,
  risks: riskAssumptionsSchema,
  deliverables: deliverablesSchema,
  timeline: timelineBudgetSchema,
} as const;

export type ProjectBasicsInput = z.infer<typeof projectBasicsSchema>;
export type GoalsObjectivesInput = z.infer<typeof goalsObjectivesSchema>;
export type StakeholdersInput = z.infer<typeof stakeholdersSchema>;
export type ScopeConstraintsInput = z.infer<typeof scopeConstraintsSchema>;
export type RiskAssumptionsInput = z.infer<typeof riskAssumptionsSchema>;
export type DeliverablesInput = z.infer<typeof deliverablesSchema>;
export type TimelineBudgetInput = z.infer<typeof timelineBudgetSchema>;
