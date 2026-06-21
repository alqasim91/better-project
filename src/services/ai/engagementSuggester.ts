import { z } from "zod";
import { callFunction } from "@/lib/apiClient";
import type { Charter, Stakeholder } from "@/types/charter";
import type { Quadrant } from "@/types/stakeholder";

const responseSchema = z.object({
  summary: z.string(),
  actions: z.array(z.string()),
});

export interface EngagementSuggestion {
  summary: string;
  actions: string[];
}

export async function suggestEngagement(
  stakeholder: Stakeholder,
  quadrant: Quadrant,
  charter: Charter,
): Promise<EngagementSuggestion> {
  const response = await callFunction<unknown>("suggest-engagement", {
    stakeholder: {
      name: stakeholder.name,
      role: stakeholder.role,
      category: stakeholder.category,
      influence: stakeholder.influence,
      interest: stakeholder.interest,
      quadrant,
    },
    projectContext: {
      name: charter.basics.projectName,
      summary: charter.basics.summary,
      goals: charter.goals.visionStatement || charter.goals.businessCase,
    },
  });

  return responseSchema.parse(response);
}
