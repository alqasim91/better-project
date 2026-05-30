import type { CharterTemplate } from "@/lib/templateRegistry";

/**
 * The blank template applies no defaults — a fully manual start.
 */
export const BLANK_TEMPLATE: CharterTemplate = {
  id: "blank",
  name: "Blank Charter",
  industry: "General",
  description: "Start from scratch with an empty charter and no preset content.",
  icon: "FileText",
  accent: "bg-slate-100 text-slate-700",
  defaults: {},
};

/**
 * Industry Smart Templates. Each seeds common objectives, scope, and risks
 * so a project manager can adapt rather than start cold.
 */
export const INDUSTRY_TEMPLATES: CharterTemplate[] = [
  {
    id: "software-delivery",
    name: "Software Delivery",
    industry: "Technology",
    description:
      "Agile product or platform build with sprints, releases, and QA gates.",
    icon: "Code2",
    accent: "bg-indigo-100 text-indigo-700",
    defaults: {
      goals: {
        visionStatement:
          "Ship a reliable, maintainable product increment that meets defined user needs.",
        successCriteria: [
          "Feature meets acceptance criteria",
          "Zero critical defects at release",
          "Performance budgets met",
        ],
      },
      scope: {
        inScope: ["Core feature development", "Automated testing", "Deployment pipeline"],
        outOfScope: ["Legacy system migration", "Third-party integrations beyond MVP"],
      },
      risks: {
        risks: [],
        assumptions: ["Stable requirements for the MVP scope", "Team availability as planned"],
        dependencies: ["Cloud infrastructure provisioning", "Design hand-off"],
      },
    },
  },
  {
    id: "marketing-campaign",
    name: "Marketing Campaign",
    industry: "Marketing",
    description:
      "Integrated campaign across channels with creative, media, and measurement.",
    icon: "Megaphone",
    accent: "bg-rose-100 text-rose-700",
    defaults: {
      goals: {
        visionStatement:
          "Drive measurable awareness and conversion within the target audience.",
        successCriteria: [
          "Reach target impressions",
          "Hit conversion-rate goal",
          "Stay within media budget",
        ],
      },
      scope: {
        inScope: ["Creative production", "Media buying", "Performance reporting"],
        outOfScope: ["Long-term brand strategy", "Product changes"],
      },
    },
  },
  {
    id: "construction-build",
    name: "Construction Project",
    industry: "Construction",
    description:
      "Capital build with phased milestones, permits, and safety compliance.",
    icon: "HardHat",
    accent: "bg-amber-100 text-amber-700",
    defaults: {
      scope: {
        inScope: ["Site preparation", "Structural build", "Inspections & handover"],
        outOfScope: ["Interior fit-out by tenant", "Landscaping"],
      },
      risks: {
        risks: [],
        assumptions: ["Permits granted on schedule", "Material prices stable"],
        dependencies: ["Regulatory approvals", "Subcontractor availability"],
      },
    },
  },
  {
    id: "clinical-program",
    name: "Clinical Program",
    industry: "Healthcare",
    description:
      "Regulated healthcare initiative with compliance and patient-safety controls.",
    icon: "Stethoscope",
    accent: "bg-emerald-100 text-emerald-700",
    defaults: {
      goals: {
        visionStatement:
          "Deliver a compliant program that improves patient outcomes safely.",
        successCriteria: [
          "Regulatory approval obtained",
          "Patient-safety thresholds met",
          "Program rolled out on schedule",
        ],
      },
      risks: {
        risks: [],
        assumptions: ["IRB approval secured", "Staffing levels maintained"],
        dependencies: ["Regulatory sign-off", "Vendor accreditation"],
      },
    },
  },
];
