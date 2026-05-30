import { create } from "zustand";
import { v4 as uuid } from "uuid";
import type { Charter, CharterSectionId } from "@/types/charter";
import { getTemplateById, type CharterDefaults } from "@/lib/templateRegistry";

/** Build an empty charter with all sections initialized to safe defaults. */
export function createEmptyCharter(): Charter {
  const now = new Date().toISOString();
  return {
    id: uuid(),
    templateId: null,
    createdAt: now,
    updatedAt: now,
    basics: {
      projectName: "",
      sponsor: "",
      projectManager: "",
      startDate: "",
      targetEndDate: "",
      summary: "",
    },
    goals: {
      visionStatement: "",
      businessCase: "",
      objectives: [],
      successCriteria: [],
    },
    stakeholders: { stakeholders: [] },
    scope: { inScope: [], outOfScope: [], constraints: [] },
    risks: { risks: [], assumptions: [], dependencies: [] },
    deliverables: { deliverables: [] },
    timeline: {
      milestones: [],
      totalBudget: 0,
      currency: "USD",
      budgetNotes: "",
    },
  };
}

/** Shallow-merge template defaults into a charter (one level deep per section). */
function applyDefaults(charter: Charter, defaults: CharterDefaults): Charter {
  const next = { ...charter };
  (Object.keys(defaults) as (keyof CharterDefaults)[]).forEach((section) => {
    const partial = defaults[section];
    if (!partial) return;
    next[section] = { ...next[section], ...partial } as never;
  });
  return next;
}

interface CharterState {
  charter: Charter;
  currentStep: number;
  /** Replace the entire charter (used on load / reset). */
  setCharter: (charter: Charter) => void;
  /** Select a template, seeding a fresh charter with its defaults. */
  selectTemplate: (templateId: string) => void;
  /** Update one section, merging the patch and bumping updatedAt. */
  updateSection: <K extends CharterSectionId>(
    section: K,
    data: Charter[K],
  ) => void;
  setCurrentStep: (step: number) => void;
  reset: () => void;
}

export const useCharterStore = create<CharterState>((set) => ({
  charter: createEmptyCharter(),
  currentStep: 0,

  setCharter: (charter) => set({ charter }),

  selectTemplate: (templateId) =>
    set(() => {
      const template = getTemplateById(templateId);
      const base = createEmptyCharter();
      base.templateId = templateId;
      const charter = template
        ? applyDefaults(base, template.defaults)
        : base;
      return { charter, currentStep: 0 };
    }),

  updateSection: (section, data) =>
    set((state) => ({
      charter: {
        ...state.charter,
        [section]: data,
        updatedAt: new Date().toISOString(),
      },
    })),

  setCurrentStep: (step) => set({ currentStep: step }),

  reset: () => set({ charter: createEmptyCharter(), currentStep: 0 }),
}));
