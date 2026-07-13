import {
  forceCenter,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  forceZ,
  type SimLink,
  type SimNode,
} from "d3-force-3d";
import { mulberry32 } from "@/lib/rand";

/**
 * Force layout (docs/ui/08): simulate to rest, then stay static — stable
 * constellations aid spatial memory (decision P6). Pure function shared by
 * the Web Worker and the inline fallback.
 */

export interface LayoutInput {
  nodes: Array<{ id: string; clusterId?: string }>;
  edges: Array<{ sourceId: string; targetId: string; strength: number }>;
}

const TICKS = 220;
const TARGET_RADIUS = 1.5;

/** Fibonacci-sphere anchor for each cluster — gravity wells (docs/ui/08). */
function clusterAnchors(clusterIds: string[]): Map<string, [number, number, number]> {
  const anchors = new Map<string, [number, number, number]>();
  const n = Math.max(clusterIds.length, 1);
  const golden = Math.PI * (3 - Math.sqrt(5));
  clusterIds.forEach((id, i) => {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    anchors.set(id, [Math.cos(theta) * r * 0.9, y * 0.9, Math.sin(theta) * r * 0.9]);
  });
  return anchors;
}

export function computeLayout(input: LayoutInput): Float32Array {
  const rand = mulberry32(0x1ab7);
  const clusterIds = [...new Set(input.nodes.map((n) => n.clusterId ?? "_"))];
  const anchors = clusterAnchors(clusterIds);

  const simNodes: SimNode[] = input.nodes.map((n) => ({
    id: n.id,
    clusterId: n.clusterId ?? "_",
    x: (rand() - 0.5) * 2,
    y: (rand() - 0.5) * 2,
    z: (rand() - 0.5) * 2,
  }));
  const simLinks: SimLink[] = input.edges.map((e) => ({
    source: e.sourceId,
    target: e.targetId,
    strength: e.strength,
  }));

  const anchorOf = (node: SimNode, axis: 0 | 1 | 2) =>
    anchors.get(node.clusterId as string)?.[axis] ?? 0;

  const sim = forceSimulation(simNodes, 3)
    .force(
      "link",
      forceLink(simLinks)
        .id((n) => n.id as string)
        .distance((l) => 0.35 + (1 - ((l.strength as number) ?? 0.5)) * 0.4)
        .strength((l) => 0.3 + ((l.strength as number) ?? 0.5) * 0.4),
    )
    .force("charge", forceManyBody().strength(-0.045))
    .force("center", forceCenter(0, 0, 0))
    .force("clusterX", forceX((n) => anchorOf(n, 0)).strength(0.1))
    .force("clusterY", forceY((n) => anchorOf(n, 1)).strength(0.1))
    .force("clusterZ", forceZ((n) => anchorOf(n, 2)).strength(0.1))
    .alpha(1)
    .alphaDecay(0.021)
    .stop();

  sim.tick(TICKS);

  // normalize into the target radius so every lobe constellation fits the volume
  let maxLen = 1e-6;
  for (const n of simNodes) {
    maxLen = Math.max(maxLen, Math.hypot(n.x ?? 0, n.y ?? 0, n.z ?? 0));
  }
  const scale = TARGET_RADIUS / maxLen;
  const out = new Float32Array(simNodes.length * 3);
  simNodes.forEach((n, i) => {
    out[i * 3] = (n.x ?? 0) * scale;
    out[i * 3 + 1] = (n.y ?? 0) * scale;
    out[i * 3 + 2] = (n.z ?? 0) * scale;
  });
  return out;
}
