import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStakeholderMap } from "@/hooks/useStakeholderMap";
import { StakeholderCard } from "@/components/stakeholders/StakeholderCard";
import { Button } from "@/components/ui/button";
import type { StakeholderRelationship } from "@/types/stakeholder";

const REL_COLORS: Record<StakeholderRelationship, string> = {
  reports: "#6366f1",
  collaborates: "#10b981",
  influences: "#f59e0b",
};

const REL_LABELS: Record<StakeholderRelationship, string> = {
  reports: "Reports to",
  collaborates: "Collaborates",
  influences: "Influences",
};

/**
 * SVG-based force-directed relationship graph. Nodes are positioned via
 * d3-force (computed in useStakeholderMap). Edges are drawn as colored lines.
 */
export function RelationshipGraph() {
  const { nodes, edges, forcePositions, addEdge, removeEdge } = useStakeholderMap(600, 400);

  const [addingEdge, setAddingEdge] = useState<{
    source: string;
    rel: StakeholderRelationship;
  } | null>(null);

  const posMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    forcePositions.forEach((p) => (map[p.id] = { x: p.x, y: p.y }));
    return map;
  }, [forcePositions]);

  const handleNodeClick = (id: string) => {
    if (addingEdge) {
      if (addingEdge.source !== id) {
        addEdge(addingEdge.source, id, addingEdge.rel);
      }
      setAddingEdge(null);
    }
  };

  if (nodes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Add stakeholders in the form to see the relationship graph.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Add edge:</span>
        {(Object.keys(REL_LABELS) as StakeholderRelationship[]).map((rel) => (
          <Button
            key={rel}
            size="sm"
            variant={addingEdge?.rel === rel ? "default" : "outline"}
            onClick={() =>
              setAddingEdge(addingEdge?.rel === rel ? null : { source: "", rel })
            }
          >
            <Plus className="h-3 w-3" /> {REL_LABELS[rel]}
          </Button>
        ))}
      </div>

      {addingEdge && !addingEdge.source && (
        <p className="text-xs text-muted-foreground">
          Click the <strong>source</strong> node, then the <strong>target</strong>.
        </p>
      )}

      <div className="relative overflow-hidden rounded-lg border bg-card" style={{ height: 400 }}>
        <svg width="100%" height="100%" viewBox="0 0 600 400">
          {/* Edges */}
          {edges.map((e) => {
            const from = posMap[e.source];
            const to = posMap[e.target];
            if (!from || !to) return null;
            return (
              <g key={`${e.source}-${e.target}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={REL_COLORS[e.relationship]}
                  strokeWidth={2}
                  strokeOpacity={0.6}
                />
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  fontSize={9}
                  fill={REL_COLORS[e.relationship]}
                  textAnchor="middle"
                >
                  {REL_LABELS[e.relationship]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Node cards positioned absolutely over the SVG */}
        {nodes.map((node) => {
          const pos = posMap[node.id];
          if (!pos) return null;
          const isSelecting = addingEdge && !addingEdge.source;
          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: pos.x - 80,
                top: pos.y - 20,
                width: 160,
              }}
            >
              <StakeholderCard
                node={node}
                className={isSelecting ? "ring-2 ring-primary cursor-crosshair" : ""}
                onClick={() => {
                  if (addingEdge && !addingEdge.source) {
                    setAddingEdge({ ...addingEdge, source: node.id });
                  } else {
                    handleNodeClick(node.id);
                  }
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Edge list */}
      {edges.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Relationships</p>
          {edges.map((e) => {
            const srcName = nodes.find((n) => n.id === e.source)?.name ?? e.source;
            const tgtName = nodes.find((n) => n.id === e.target)?.name ?? e.target;
            return (
              <div
                key={`${e.source}-${e.target}`}
                className="flex items-center justify-between rounded border px-2 py-1 text-xs"
              >
                <span>
                  {srcName} <span className="text-muted-foreground">&rarr;</span>{" "}
                  {tgtName}{" "}
                  <span style={{ color: REL_COLORS[e.relationship] }}>
                    ({REL_LABELS[e.relationship]})
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => removeEdge(e.source, e.target)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
