import { useCallback, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import { useCharterStore } from "@/stores/charterStore";
import type {
  StakeholderNode,
  StakeholderEdge,
  StakeholderRelationship,
} from "@/types/stakeholder";
import type { Stakeholder } from "@/types/charter";
import {
  calculateQuadrantPositions,
  calculateForceLayout,
  type PositionedNode,
} from "@/lib/stakeholderLayout";

/** Convert a charter Stakeholder to the map-specific node shape. */
function toNode(s: Stakeholder): StakeholderNode {
  return {
    id: s.id,
    name: s.name,
    role: s.role,
    influence: s.influence,
    interest: s.interest,
    category: s.category,
  };
}

/**
 * Manages stakeholder nodes/edges and computes layouts (quadrant matrix and
 * force-directed graph). Node data is sourced from the charter store;
 * edges are local to this view (not persisted yet).
 */
export function useStakeholderMap(width = 600, height = 400) {
  const charterStakeholders = useCharterStore(
    (s) => s.charter.stakeholders.stakeholders,
  );
  const updateSection = useCharterStore((s) => s.updateSection);

  const [edges, setEdges] = useState<StakeholderEdge[]>([]);

  const nodes = useMemo<StakeholderNode[]>(
    () => charterStakeholders.map(toNode),
    [charterStakeholders],
  );

  const quadrantPositions = useMemo<PositionedNode[]>(
    () => calculateQuadrantPositions(nodes, width, height),
    [nodes, width, height],
  );

  const forcePositions = useMemo<PositionedNode[]>(
    () => calculateForceLayout(nodes, edges, width, height),
    [nodes, edges, width, height],
  );

  const addNode = useCallback(
    (data: { name: string; role: string; category: StakeholderNode["category"] }) => {
      const stakeholder: Stakeholder = {
        id: uuid(),
        name: data.name,
        role: data.role,
        category: data.category,
        influence: 3,
        interest: 3,
      };
      updateSection("stakeholders", {
        stakeholders: [...charterStakeholders, stakeholder],
      });
    },
    [charterStakeholders, updateSection],
  );

  const updateNode = useCallback(
    (id: string, patch: Partial<Stakeholder>) => {
      updateSection("stakeholders", {
        stakeholders: charterStakeholders.map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      });
    },
    [charterStakeholders, updateSection],
  );

  const removeNode = useCallback(
    (id: string) => {
      updateSection("stakeholders", {
        stakeholders: charterStakeholders.filter((s) => s.id !== id),
      });
      setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    },
    [charterStakeholders, updateSection],
  );

  const addEdge = useCallback(
    (source: string, target: string, relationship: StakeholderRelationship) => {
      setEdges((prev) => [...prev, { source, target, relationship }]);
    },
    [],
  );

  const removeEdge = useCallback((source: string, target: string) => {
    setEdges((prev) =>
      prev.filter((e) => !(e.source === source && e.target === target)),
    );
  }, []);

  return {
    nodes,
    edges,
    quadrantPositions,
    forcePositions,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
  };
}
