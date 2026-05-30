export type TimelineItemType = "milestone" | "deliverable" | "review";
export type TimelineItemStatus = "pending" | "in-progress" | "complete";
export type TimelineView = "linear" | "compact" | "gantt";

export interface TimelineMilestone {
  id: string;
  title: string;
  date: string; // ISO date
  type: TimelineItemType;
  dependencies: string[]; // ids of predecessor milestones
  status: TimelineItemStatus;
  owner?: string;
}

export interface TimelineData {
  milestones: TimelineMilestone[];
  startDate: string;
  endDate: string;
  zoomLevel: number;
}
