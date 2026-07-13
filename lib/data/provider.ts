import type { LobeId } from "@/lib/lobes";
import type { LobeGraph, NodeDetail } from "@/lib/types/cognitive";
import { generateMockDataset } from "@/lib/data/mock/generate";

/**
 * Data provider seam (docs/ui/07 rule 2): the scene and chrome consume this
 * interface only. `mockProvider` is active until the FastAPI graph endpoints
 * exist (Open Questions #2/#3) — swap `activeProvider` then.
 */
export interface CognitiveDataProvider {
  getLobeGraph(lobeId: LobeId): Promise<LobeGraph>;
  getNodeDetail(nodeId: string): Promise<NodeDetail | null>;
}

const MOCK_LATENCY_MS = 120; // keep async plumbing honest

export const mockProvider: CognitiveDataProvider = {
  async getLobeGraph(lobeId) {
    const { nodes, edges, clusters } = generateMockDataset();
    await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
    const lobeNodes = nodes.filter((n) => n.lobeId === lobeId);
    const ids = new Set(lobeNodes.map((n) => n.id));
    const intra = edges.filter((e) => ids.has(e.sourceId) && ids.has(e.targetId));
    const cross = edges.filter(
      (e) => ids.has(e.sourceId) !== ids.has(e.targetId),
    );
    return {
      lobeId,
      nodes: lobeNodes,
      edges: intra,
      clusters: clusters.filter((c) => c.lobeId === lobeId),
      crossLobeEdgeCount: cross.length,
      fetchedAt: new Date().toISOString(),
    };
  },

  async getNodeDetail(nodeId) {
    const { nodes, edges } = generateMockDataset();
    await new Promise((r) => setTimeout(r, MOCK_LATENCY_MS));
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const neighbors = edges
      .filter((e) => e.sourceId === nodeId || e.targetId === nodeId)
      .map((edge) => {
        const otherId = edge.sourceId === nodeId ? edge.targetId : edge.sourceId;
        return { edge, node: byId.get(otherId)! };
      })
      .filter((n) => n.node !== undefined);
    return { node, neighbors };
  },
};

export const activeProvider: CognitiveDataProvider = mockProvider;
