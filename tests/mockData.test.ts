import { describe, expect, it } from "vitest";
import { LOBES } from "@/lib/lobes";
import { generateMockDataset } from "@/lib/data/mock/generate";
import { mockProvider } from "@/lib/data/provider";
import { computeLayout } from "@/lib/scene/graphLayout";

const { nodes, edges, clusters } = generateMockDataset();

describe("mock cognitive dataset (docs/ui/07, Working Rule 18)", () => {
  it("has roughly the roadmap's ~300 nodes", () => {
    expect(nodes.length).toBeGreaterThanOrEqual(250);
    expect(nodes.length).toBeLessThanOrEqual(400);
  });

  it("has unique node and edge ids", () => {
    expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
    expect(new Set(edges.map((e) => e.id)).size).toBe(edges.length);
  });

  it("populates every lobe", () => {
    for (const lobe of LOBES) {
      expect(
        nodes.filter((n) => n.lobeId === lobe.id).length,
        `lobe ${lobe.id}`,
      ).toBeGreaterThan(5);
    }
  });

  it("keeps every edge endpoint resolvable", () => {
    const ids = new Set(nodes.map((n) => n.id));
    for (const e of edges) {
      expect(ids.has(e.sourceId), e.id).toBe(true);
      expect(ids.has(e.targetId), e.id).toBe(true);
    }
  });

  it("keeps scalars inside [0, 1]", () => {
    for (const n of nodes) {
      for (const v of [n.intensity, n.confidence, n.relevance, n.recency]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    }
  });

  it("assigns every clustered node to an existing cluster", () => {
    const clusterIds = new Set(clusters.map((c) => c.id));
    for (const n of nodes) {
      if (n.clusterId) expect(clusterIds.has(n.clusterId)).toBe(true);
    }
  });

  it("models the confirmed persona schema in the core lobe", () => {
    const core = nodes.filter((n) => n.lobeId === "core");
    expect(core.filter((n) => n.type === "trait")).toHaveLength(5); // Big 5
    expect(core.filter((n) => n.type === "value").length).toBeGreaterThanOrEqual(3);
  });

  it("is deterministic across calls", () => {
    const again = generateMockDataset();
    expect(again.nodes.length).toBe(nodes.length);
    expect(again.nodes[0]!.id).toBe(nodes[0]!.id);
  });
});

describe("mock provider", () => {
  it("scopes lobe graphs to intra-lobe edges", async () => {
    const graph = await mockProvider.getLobeGraph("limbic");
    const ids = new Set(graph.nodes.map((n) => n.id));
    expect(graph.nodes.every((n) => n.lobeId === "limbic")).toBe(true);
    for (const e of graph.edges) {
      expect(ids.has(e.sourceId) && ids.has(e.targetId)).toBe(true);
    }
    expect(graph.crossLobeEdgeCount).toBeGreaterThan(0);
  });

  it("returns node detail with neighbors, null for unknown ids", async () => {
    const graph = await mockProvider.getLobeGraph("temporal");
    const detail = await mockProvider.getNodeDetail(graph.nodes[0]!.id);
    expect(detail?.node.id).toBe(graph.nodes[0]!.id);
    expect(detail!.neighbors.length).toBeGreaterThan(0);
    expect(await mockProvider.getNodeDetail("nope")).toBeNull();
  });
});

describe("force layout", () => {
  it("positions every node within the target radius", async () => {
    const graph = await mockProvider.getLobeGraph("frontal");
    const positions = computeLayout({
      nodes: graph.nodes.map((n) => ({ id: n.id, clusterId: n.clusterId })),
      edges: graph.edges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        strength: e.strength,
      })),
    });
    expect(positions.length).toBe(graph.nodes.length * 3);
    for (let i = 0; i < graph.nodes.length; i++) {
      const r = Math.hypot(
        positions[i * 3]!,
        positions[i * 3 + 1]!,
        positions[i * 3 + 2]!,
      );
      expect(Number.isFinite(r)).toBe(true);
      expect(r).toBeLessThanOrEqual(1.5001);
    }
  });

  it("spreads nodes apart (no total collapse)", async () => {
    const graph = await mockProvider.getLobeGraph("parietal");
    const positions = computeLayout({
      nodes: graph.nodes.map((n) => ({ id: n.id, clusterId: n.clusterId })),
      edges: graph.edges.map((e) => ({
        sourceId: e.sourceId,
        targetId: e.targetId,
        strength: e.strength,
      })),
    });
    let spread = 0;
    for (let i = 0; i < positions.length; i++) spread += Math.abs(positions[i]!);
    expect(spread / positions.length).toBeGreaterThan(0.1);
  });
});
