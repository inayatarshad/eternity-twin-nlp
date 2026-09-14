import { describe, expect, it } from "vitest";
import { COMPUTED_SOURCE, generateMockDataset } from "@/lib/data/mock/generate";
import { getExchange, saidVsFelt } from "@/lib/data/saidVsFelt";

const { nodes, edges } = generateMockDataset();
const byId = new Map(nodes.map((n) => [n.id, n]));

describe("said-vs-felt NLP results", () => {
  it("covers the full hand-labeled evaluation set", () => {
    expect(saidVsFelt.exchanges).toHaveLength(saidVsFelt.meta.n_exchanges);
    expect(saidVsFelt.exchanges.length).toBe(40);
  });

  it("keeps every model score inside [0, 1]", () => {
    for (const ex of saidVsFelt.exchanges) {
      for (const v of [ex.contradiction, ex.emotional_divergence, ex.divergence_score]) {
        expect(v, ex.id).toBeGreaterThanOrEqual(0);
        expect(v, ex.id).toBeLessThanOrEqual(1);
      }
    }
  });

  it("derives each verdict from the reported thresholds", () => {
    const { contradiction: tc, emotional_divergence: te } = saidVsFelt.meta.thresholds;
    for (const ex of saidVsFelt.exchanges) {
      const expected =
        ex.contradiction >= tc
          ? "contradicting"
          : ex.emotional_divergence >= te
            ? "masked"
            : "aligned";
      expect(ex.predicted, ex.id).toBe(expected);
    }
  });
});

describe("said-vs-felt nodes in the cognitive graph", () => {
  it("gives every exchange a reasoning node in the frontal lobe", () => {
    for (const ex of saidVsFelt.exchanges) {
      const node = byId.get(`rsn-${ex.id}`);
      expect(node?.lobeId, ex.id).toBe("frontal");
      expect(node?.metadata?.exchangeId, ex.id).toBe(ex.id);
    }
  });

  it("creates a contradiction node exactly for each model-detected divergence", () => {
    const expected = saidVsFelt.exchanges
      .filter((ex) => ex.predicted !== "aligned")
      .map((ex) => `div-${ex.id}`)
      .sort();
    const actual = nodes
      .filter((n) => n.type === "contradiction")
      .map((n) => n.id)
      .sort();
    expect(actual).toEqual(expected);
  });

  it("links each exchange to its prompt, its core value, and a detected emotion", () => {
    for (const ex of saidVsFelt.exchanges) {
      const id = `rsn-${ex.id}`;
      const neighborTypes = edges
        .filter((e) => e.sourceId === id || e.targetId === id)
        .map((e) => byId.get(e.sourceId === id ? e.targetId : e.sourceId)!.type);
      expect(neighborTypes, ex.id).toContain("stimulus");
      expect(neighborTypes, ex.id).toContain("value");
      expect(neighborTypes, ex.id).toContain("emotion");
    }
  });

  it("derives computed node scalars from model output", () => {
    for (const ex of saidVsFelt.exchanges) {
      expect(byId.get(`rsn-${ex.id}`)!.relevance, ex.id).toBe(ex.divergence_score);
    }
  });

  it("keeps random sample-data associations off computed nodes", () => {
    const computed = new Set(
      nodes.filter((n) => n.metadata?.source === COMPUTED_SOURCE).map((n) => n.id),
    );
    const touching = edges.filter(
      (e) =>
        e.type === "associated_with" &&
        (computed.has(e.sourceId) || computed.has(e.targetId)),
    );
    expect(touching.length).toBeGreaterThan(0);
    for (const e of touching) {
      const a = getExchange(byId.get(e.sourceId)!.metadata!.exchangeId as string);
      const b = getExchange(byId.get(e.targetId)!.metadata!.exchangeId as string);
      expect(a && b, e.id).toBeTruthy();
      expect(a!.scenario).toBe(b!.scenario);
      expect(a!.core_value).toBe(b!.core_value);
    }
  });
});
