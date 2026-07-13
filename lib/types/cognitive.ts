import type { LobeId } from "@/lib/lobes";

/**
 * Cognitive graph data model — contract from docs/ui/07-data-and-state-model.md.
 * [CONFIRMED] pieces mirror the Eternity Twin backend (Project-Report.md);
 * the rest is the UI-defined contract a future graph pipeline fills.
 */

export type CognitiveNodeType =
  | "memory"
  | "emotion"
  | "concept"
  | "person"
  | "event"
  | "value"
  | "trait"
  | "reasoning"
  | "contradiction"
  | "insight"
  | "stimulus";

export type EdgeType =
  | "felt_during"
  | "caused_by"
  | "involves"
  | "triggered"
  | "reinforces"
  | "contradicts"
  | "associated_with"
  | "derived_from"
  | "precedes";

export interface CognitiveNode {
  id: string;
  type: CognitiveNodeType;
  label: string;
  summary?: string;
  lobeId: LobeId;
  intensity: number; // 0–1
  confidence: number; // 0–1
  relevance: number; // 0–1
  recency: number; // 0–1
  createdAt?: string;
  clusterId?: string;
  metadata?: Record<string, unknown>;
}

export interface CognitiveEdge {
  id: string;
  type: EdgeType;
  sourceId: string;
  targetId: string;
  strength: number; // 0–1
  directed: boolean;
}

export interface MemoryCluster {
  id: string;
  lobeId: LobeId;
  label: string;
  nodeIds: string[];
}

export interface LobeGraph {
  lobeId: LobeId;
  nodes: CognitiveNode[];
  /** Edges with both endpoints inside this lobe (cross-lobe: Phase 6+). */
  edges: CognitiveEdge[];
  clusters: MemoryCluster[];
  /** Count of edges leaving this lobe — surfaced in UI copy. */
  crossLobeEdgeCount: number;
  fetchedAt: string;
}

export interface NodeDetail {
  node: CognitiveNode;
  neighbors: Array<{
    edge: CognitiveEdge;
    node: CognitiveNode;
  }>;
}

/** Node positions from the force layout, aligned with LobeGraph.nodes order. */
export interface PositionedLobeGraph extends LobeGraph {
  positions: Float32Array; // xyz triplets
}

/** Type accents (docs/ui/04 graph styling) — hue never the sole encoding. */
export const NODE_TYPE_COLORS: Record<CognitiveNodeType, string> = {
  memory: "#9d7bff",
  emotion: "#ff5ea8",
  concept: "#4fd8c4",
  person: "#4f8dff",
  event: "#b48cff",
  value: "#ffd66e",
  trait: "#ffe9a8",
  reasoning: "#5ee6ff",
  contradiction: "#ff7a7a",
  insight: "#6ee7a0",
  stimulus: "#7fa3ff",
};

/** Glyphs used in DOM views (docs/ui/04 iconography). */
export const NODE_TYPE_GLYPHS: Record<CognitiveNodeType, string> = {
  memory: "◈",
  emotion: "❋",
  concept: "◎",
  person: "⬡",
  event: "◷",
  value: "✦",
  trait: "✧",
  reasoning: "⟁",
  contradiction: "⚡",
  insight: "✺",
  stimulus: "▷",
};
