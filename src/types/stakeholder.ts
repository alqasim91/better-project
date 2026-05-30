export type StakeholderRelationship = "reports" | "collaborates" | "influences";

export interface StakeholderNode {
  id: string;
  name: string;
  role: string;
  influence: 1 | 2 | 3 | 4 | 5;
  interest: 1 | 2 | 3 | 4 | 5;
  category: "internal" | "external" | "regulatory";
  x?: number;
  y?: number;
}

export interface StakeholderEdge {
  source: string;
  target: string;
  relationship: StakeholderRelationship;
}

export interface StakeholderMap {
  nodes: StakeholderNode[];
  edges: StakeholderEdge[];
  layoutVersion: number;
}

/** Quadrant labels for the Power/Interest matrix. */
export type Quadrant =
  | "keep-satisfied"   // high influence, low interest
  | "manage-closely"   // high influence, high interest
  | "monitor"          // low influence, low interest
  | "keep-informed";   // low influence, high interest

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  "keep-satisfied": "Keep Satisfied",
  "manage-closely": "Manage Closely",
  monitor: "Monitor",
  "keep-informed": "Keep Informed",
};
