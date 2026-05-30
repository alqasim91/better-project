import type { Charter } from "@/types/charter";

/**
 * A Smart Template seeds a new charter with sensible, industry-specific
 * defaults. Templates supply a deep-partial Charter; the store merges it
 * over an empty charter when a template is selected.
 */
export type CharterDefaults = {
  basics?: Partial<Charter["basics"]>;
  goals?: Partial<Charter["goals"]>;
  stakeholders?: Partial<Charter["stakeholders"]>;
  scope?: Partial<Charter["scope"]>;
  risks?: Partial<Charter["risks"]>;
  deliverables?: Partial<Charter["deliverables"]>;
  timeline?: Partial<Charter["timeline"]>;
};

export interface CharterTemplate {
  id: string;
  name: string;
  industry: string;
  description: string;
  /** Lucide icon name, resolved in the UI. */
  icon: string;
  /** Accent color (Tailwind class fragment) for the template card. */
  accent: string;
  defaults: CharterDefaults;
}

import { INDUSTRY_TEMPLATES, BLANK_TEMPLATE } from "@/data/industryTemplates";

const REGISTRY: Map<string, CharterTemplate> = new Map(
  [BLANK_TEMPLATE, ...INDUSTRY_TEMPLATES].map((t) => [t.id, t]),
);

export function getAllTemplates(): CharterTemplate[] {
  return [BLANK_TEMPLATE, ...INDUSTRY_TEMPLATES];
}

export function getTemplateById(id: string): CharterTemplate | undefined {
  return REGISTRY.get(id);
}

export function getTemplatesByIndustry(industry: string): CharterTemplate[] {
  return getAllTemplates().filter((t) => t.industry === industry);
}

export function listIndustries(): string[] {
  return Array.from(new Set(INDUSTRY_TEMPLATES.map((t) => t.industry)));
}
