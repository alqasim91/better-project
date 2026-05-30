import type { TimelineMilestone } from "@/types/timeline";

interface DependencyLinesProps {
  milestones: TimelineMilestone[];
  /** Position map keyed by milestone id; may come from a DOM layout or a fixed grid. */
  positions: Record<string, { x: number; y: number }>;
  width: number;
  height: number;
}

/**
 * SVG overlay drawing dependency arrows between milestone positions. Consumed
 * by the timeline dashboard when dependency data is present.
 */
export function DependencyLines({
  milestones,
  positions,
  width,
  height,
}: DependencyLinesProps) {
  const lines: { x1: number; y1: number; x2: number; y2: number; id: string }[] = [];

  milestones.forEach((m) => {
    const to = positions[m.id];
    if (!to) return;
    m.dependencies.forEach((depId) => {
      const from = positions[depId];
      if (!from) return;
      lines.push({ x1: from.x, y1: from.y, x2: to.x, y2: to.y, id: `${depId}-${m.id}` });
    });
  });

  if (lines.length === 0) return null;

  return (
    <svg
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0"
      style={{ overflow: "visible" }}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="hsl(var(--muted-foreground))" />
        </marker>
      </defs>
      {lines.map((l) => (
        <line
          key={l.id}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          markerEnd="url(#arrow)"
        />
      ))}
    </svg>
  );
}
