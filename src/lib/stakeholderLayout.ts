import {
  forceSimulation,
  forceManyBody,
  forceCenter,
  forceLink,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from "d3-force";
import type { StakeholderNode, StakeholderEdge, Quadrant } from "@/types/stakeholder";

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  quadrant?: Quadrant;
}

/**
 * Map each node to a quadrant in the Power/Interest matrix.
 * Threshold is 3 (mid-point of 1-5 scale).
 */
export function getQuadrant(node: StakeholderNode): Quadrant {
  const highInfluence = node.influence >= 3;
  const highInterest = node.interest >= 3;
  if (highInfluence && highInterest) return "manage-closely";
  if (highInfluence && !highInterest) return "keep-satisfied";
  if (!highInfluence && highInterest) return "keep-informed";
  return "monitor";
}

/**
 * Place nodes into power/interest matrix positions.
 * Each node gets a (x, y) inside its quadrant, jittered to avoid overlap.
 */
export function calculateQuadrantPositions(
  nodes: StakeholderNode[],
  width: number,
  height: number,
): PositionedNode[] {
  const halfW = width / 2;
  const halfH = height / 2;
  const pad = 40;

  // Group by quadrant and scatter within the quadrant area.
  const counts: Record<Quadrant, number> = {
    "keep-satisfied": 0,
    "manage-closely": 0,
    monitor: 0,
    "keep-informed": 0,
  };

  return nodes.map((node) => {
    const q = getQuadrant(node);
    const idx = counts[q]++;
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const spacing = 60;

    let baseX: number;
    let baseY: number;
    switch (q) {
      case "monitor":          baseX = pad;          baseY = pad;          break;
      case "keep-informed":    baseX = halfW + pad;  baseY = pad;          break;
      case "keep-satisfied":   baseX = pad;          baseY = halfH + pad;  break;
      case "manage-closely":   baseX = halfW + pad;  baseY = halfH + pad;  break;
    }

    return {
      id: node.id,
      x: baseX + col * spacing,
      y: baseY + row * spacing,
      quadrant: q,
    };
  });
}

interface SimNode extends SimulationNodeDatum {
  id: string;
}

/**
 * Run a d3-force simulation to produce a relationship graph layout.
 * Returns after the simulation settles (synchronous tick loop).
 */
export function calculateForceLayout(
  nodes: StakeholderNode[],
  edges: StakeholderEdge[],
  width: number,
  height: number,
): PositionedNode[] {
  const simNodes: SimNode[] = nodes.map((n) => ({
    id: n.id,
    x: n.x ?? width / 2 + (Math.random() - 0.5) * 200,
    y: n.y ?? height / 2 + (Math.random() - 0.5) * 200,
  }));

  const simLinks: SimulationLinkDatum<SimNode>[] = edges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const sim = forceSimulation(simNodes)
    .force("charge", forceManyBody().strength(-200))
    .force("center", forceCenter(width / 2, height / 2))
    .force(
      "link",
      forceLink<SimNode, SimulationLinkDatum<SimNode>>(simLinks).id((d) => d.id).distance(120),
    )
    .force("collide", forceCollide(30))
    .stop();

  // Run synchronously until settled.
  for (let i = 0; i < 300; i++) sim.tick();

  return simNodes.map((n) => ({
    id: n.id,
    x: n.x ?? width / 2,
    y: n.y ?? height / 2,
  }));
}
