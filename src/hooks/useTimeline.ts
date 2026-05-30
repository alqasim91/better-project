import { useCallback, useMemo, useRef } from "react";
import { v4 as uuid } from "uuid";
import { DataSet } from "vis-data/esnext";
import { useCharterStore } from "@/stores/charterStore";
import type {
  TimelineMilestone,
  TimelineItemType,
} from "@/types/timeline";
import type { Milestone } from "@/types/charter";

/** Convert a charter Milestone to the richer TimelineMilestone shape. */
function toTimelineMilestone(m: Milestone): TimelineMilestone {
  return {
    id: m.id,
    title: m.title,
    date: m.date,
    type: m.type,
    dependencies: [],
    status: "pending",
    owner: m.owner,
  };
}

/**
 * Manages timeline state backed by both a vis-data DataSet (for the
 * vis-timeline widget) and the charter store (for persistence/export).
 */
export function useTimeline() {
  const charterMilestones = useCharterStore((s) => s.charter.timeline.milestones);
  const updateSection = useCharterStore((s) => s.updateSection);
  const timeline = useCharterStore((s) => s.charter.timeline);

  const datasetRef = useRef(new DataSet<{ id: string; content: string; start: string; className: string; type: string }>());

  const milestones = useMemo<TimelineMilestone[]>(
    () => charterMilestones.map(toTimelineMilestone),
    [charterMilestones],
  );

  // Sync dataset for vis-timeline rendering.
  const dataset = useMemo(() => {
    const ds = datasetRef.current;
    ds.clear();
    milestones
      .filter((m) => m.date)
      .forEach((m) =>
        ds.add({
          id: m.id,
          content: m.title || "Untitled",
          start: m.date,
          className: `type-${m.type} status-${m.status}`,
          type: "box",
        }),
      );
    return ds;
  }, [milestones]);

  const addMilestone = useCallback(
    (data: { title: string; date: string; type: TimelineItemType; owner?: string }) => {
      const milestone: Milestone = {
        id: uuid(),
        title: data.title,
        date: data.date,
        type: data.type,
        owner: data.owner,
      };
      updateSection("timeline", {
        ...timeline,
        milestones: [...timeline.milestones, milestone],
      });
    },
    [timeline, updateSection],
  );

  const updateMilestone = useCallback(
    (id: string, patch: Partial<Milestone>) => {
      updateSection("timeline", {
        ...timeline,
        milestones: timeline.milestones.map((m) =>
          m.id === id ? { ...m, ...patch } : m,
        ),
      });
    },
    [timeline, updateSection],
  );

  const removeMilestone = useCallback(
    (id: string) => {
      updateSection("timeline", {
        ...timeline,
        milestones: timeline.milestones.filter((m) => m.id !== id),
      });
    },
    [timeline, updateSection],
  );

  return {
    milestones,
    dataset,
    addMilestone,
    updateMilestone,
    removeMilestone,
  };
}
