import { useStakeholderMap } from "@/hooks/useStakeholderMap";
import { StakeholderCard } from "@/components/stakeholders/StakeholderCard";
import { QUADRANT_LABELS, type Quadrant } from "@/types/stakeholder";
import { getQuadrant } from "@/lib/stakeholderLayout";
import { cn } from "@/lib/utils";

const QUADRANT_GRID: { q: Quadrant; row: number; col: number; bg: string }[] = [
  { q: "keep-satisfied", row: 0, col: 0, bg: "bg-amber-50" },
  { q: "manage-closely", row: 0, col: 1, bg: "bg-rose-50" },
  { q: "monitor", row: 1, col: 0, bg: "bg-slate-50" },
  { q: "keep-informed", row: 1, col: 1, bg: "bg-indigo-50" },
];

/**
 * 2x2 Power/Interest matrix. Stakeholders are placed into quadrants based
 * on their influence (y-axis) and interest (x-axis) scores.
 */
export function InfluenceMatrix() {
  const { nodes } = useStakeholderMap();

  const grouped = nodes.reduce<Record<Quadrant, typeof nodes>>(
    (acc, node) => {
      const q = getQuadrant(node);
      acc[q].push(node);
      return acc;
    },
    {
      "keep-satisfied": [],
      "manage-closely": [],
      monitor: [],
      "keep-informed": [],
    },
  );

  return (
    <div className="space-y-2">
      {/* Axis labels */}
      <div className="flex items-end justify-between text-xs text-muted-foreground">
        <span>High Influence</span>
        <span>High Interest &rarr;</span>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border">
        {QUADRANT_GRID.map(({ q, bg }) => (
          <div key={q} className={cn("min-h-[180px] p-3", bg)}>
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              {QUADRANT_LABELS[q]}
            </p>
            <div className="flex flex-col gap-2">
              {grouped[q].length === 0 ? (
                <p className="text-xs text-muted-foreground/60">None</p>
              ) : (
                grouped[q].map((node) => (
                  <StakeholderCard key={node.id} node={node} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start justify-between text-xs text-muted-foreground">
        <span>Low Influence</span>
      </div>
    </div>
  );
}
