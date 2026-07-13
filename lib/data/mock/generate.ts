// MOCK DATA — deterministic stand-in for the future graph-extraction backend
// (docs/ui/07 rule 5, Working Rule 18). Vocabulary seeded from Project-Report.md:
// GoEmotions labels, Persona Spec (Big 5 + core values), validation scenarios,
// and the response-engine record shape.
import type { LobeId } from "@/lib/lobes";
import { mulberry32 } from "@/lib/rand";
import type {
  CognitiveEdge,
  CognitiveNode,
  EdgeType,
  MemoryCluster,
} from "@/lib/types/cognitive";

const SCENARIOS = [
  "Leaked Roadmap",
  "Corporate Espionage",
  "Acquisition Rumor",
  "Whistleblower Dilemma",
];

const EMOTION_FAMILIES: Record<string, string[]> = {
  joy: ["joy", "amusement", "excitement", "gratitude", "optimism", "pride", "relief"],
  love: ["love", "admiration", "caring", "approval"],
  surprise: ["surprise", "realization", "curiosity", "confusion"],
  anger: ["anger", "annoyance", "disapproval", "disgust"],
  sadness_fear: ["sadness", "grief", "fear", "nervousness", "remorse", "disappointment", "embarrassment"],
};

const CORE_VALUES: Array<[string, number]> = [
  ["Honesty", 90],
  ["Loyalty", 85],
  ["Ambition", 70],
  ["Compassion", 62],
  ["Independence", 58],
  ["Curiosity", 76],
];

const BIG5: Array<[string, number]> = [
  ["Openness", 74],
  ["Conscientiousness", 81],
  ["Extraversion", 42],
  ["Agreeableness", 66],
  ["Neuroticism", 38],
];

const PEOPLE = [
  "The Rival CTO",
  "Dr. Miyagi",
  "The Board Chair",
  "Anne",
  "The Founder",
  "Sister — Amara",
  "Skarsgard",
  "The journalist",
];

const CONCEPTS = [
  "Trust",
  "Betrayal",
  "Secrecy",
  "Integrity",
  "Power",
  "Belonging",
  "Reputation",
  "Sacrifice",
  "Fairness",
  "Legacy",
  "Risk",
  "Forgiveness",
];

const MEMORY_STEMS = [
  "First day at the company",
  "The night the prototype finally worked",
  "Being passed over for the promotion",
  "Confronting a friend about a lie",
  "Father's workshop on Sunday mornings",
  "The failed startup and the empty office",
  "Winning the science fair at fourteen",
  "The mentor's warning about shortcuts",
  "Signing the first big contract",
  "The argument that ended a friendship",
  "Moving cities alone at twenty-two",
  "The apology that came too late",
];

const MONOLOGUE_STEMS = [
  "If I reveal what I know, everything changes",
  "Ambition is pulling harder than loyalty here",
  "They are testing me — stay measured",
  "The honest answer will cost me the deal",
  "I owe Dr. Chen more than this",
  "Something in this story does not add up",
  "Protect the team first, the roadmap second",
  "I want the credit and I hate that I want it",
];

interface Dataset {
  nodes: CognitiveNode[];
  edges: CognitiveEdge[];
  clusters: MemoryCluster[];
}

let cached: Dataset | null = null;

/** Build the full deterministic mock cognitive graph (~300 nodes). */
export function generateMockDataset(): Dataset {
  if (cached) return cached;
  const rand = mulberry32(0x7717);
  const nodes: CognitiveNode[] = [];
  const edges: CognitiveEdge[] = [];
  const clusters: MemoryCluster[] = [];
  let edgeSeq = 0;

  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const scalar = (min = 0.15, max = 0.95) => min + rand() * (max - min);
  const dateWithin = (days: number) =>
    new Date(Date.UTC(2026, 6, 11) - rand() * days * 86400000).toISOString();

  const addNode = (
    n: Omit<CognitiveNode, "intensity" | "confidence" | "relevance" | "recency" | "createdAt"> &
      Partial<CognitiveNode>,
  ): CognitiveNode => {
    const node: CognitiveNode = {
      intensity: scalar(),
      confidence: scalar(0.35, 0.98),
      relevance: scalar(),
      recency: scalar(0.05, 1),
      createdAt: dateWithin(720),
      ...n,
    };
    nodes.push(node);
    return node;
  };

  const addEdge = (
    type: EdgeType,
    source: CognitiveNode,
    target: CognitiveNode,
    directed = true,
  ) => {
    edges.push({
      id: `e-${edgeSeq++}`,
      type,
      sourceId: source.id,
      targetId: target.id,
      strength: scalar(0.25, 1),
      directed,
    });
  };

  const addCluster = (lobeId: LobeId, label: string, members: CognitiveNode[]) => {
    const id = `cl-${lobeId}-${clusters.length}`;
    clusters.push({ id, lobeId, label, nodeIds: members.map((m) => m.id) });
    for (const m of members) m.clusterId = id;
  };

  // ---- core (identity): traits + values [CONFIRMED schema] ----
  const valueNodes = CORE_VALUES.map(([name, score], i) =>
    addNode({
      id: `val-${i}`,
      type: "value",
      label: name,
      summary: `Core value, weight ${score}/100.`,
      lobeId: "core",
      metadata: { score },
    }),
  );
  const traitNodes = BIG5.map(([name, score], i) =>
    addNode({
      id: `trait-${i}`,
      type: "trait",
      label: name,
      summary: `Big 5 dimension, ${score}/100.`,
      lobeId: "core",
      metadata: { score },
    }),
  );
  addCluster("core", "Values", valueNodes);
  addCluster("core", "Temperament", traitNodes);
  for (const t of traitNodes) addEdge("associated_with", t, pick(valueNodes), false);

  // ---- occipital (perception): stimuli + people ----
  const stimulusNodes = SCENARIOS.flatMap((scenario, si) =>
    Array.from({ length: 8 }, (_, i) =>
      addNode({
        id: `stim-${si}-${i}`,
        type: "stimulus",
        label: `${scenario} — probe ${i + 1}`,
        summary: `High-stress validation prompt from the ${scenario} matrix.`,
        lobeId: "occipital",
        metadata: { scenario },
      }),
    ),
  );
  const personNodes = PEOPLE.map((name, i) =>
    addNode({
      id: `person-${i}`,
      type: "person",
      label: name,
      lobeId: "occipital",
    }),
  );
  SCENARIOS.forEach((scenario) =>
    addCluster(
      "occipital",
      scenario,
      stimulusNodes.filter((n) => n.metadata?.scenario === scenario),
    ),
  );
  addCluster("occipital", "People", personNodes);

  // ---- temporal (memory): memories + events ----
  const MEMS_PER_STEM = 5;
  const memoryNodes = MEMORY_STEMS.flatMap((stem, mi) =>
    Array.from({ length: MEMS_PER_STEM }, (_, i) =>
      addNode({
        id: `mem-${mi}-${i}`,
        type: "memory",
        label: i === 0 ? stem : `${stem} — trace ${i}`,
        summary: `${i === 0 ? "Biographical" : "Episodic"} memory anchor.`,
        lobeId: "temporal",
        metadata: { kind: i === 0 ? "biographical" : "episodic" },
      }),
    ),
  );
  const eventNodes = SCENARIOS.flatMap((scenario, si) =>
    Array.from({ length: 3 }, (_, i) =>
      addNode({
        id: `evt-${si}-${i}`,
        type: "event",
        label: `${scenario}: exchange ${i + 1}`,
        summary: "Simulated conversation event.",
        lobeId: "temporal",
        metadata: { scenario },
      }),
    ),
  );
  for (let i = 0; i < MEMORY_STEMS.length; i += 3) {
    addCluster(
      "temporal",
      MEMORY_STEMS[i]!.split(" ").slice(0, 3).join(" "),
      memoryNodes.slice(i * MEMS_PER_STEM, (i + 3) * MEMS_PER_STEM),
    );
  }
  addCluster("temporal", "Scenario timeline", eventNodes);
  for (const evt of eventNodes) addEdge("precedes", pick(eventNodes), evt);
  for (const mem of memoryNodes) {
    if (rand() > 0.5) addEdge("involves", mem, pick(personNodes));
    if (rand() > 0.6) addEdge("reinforces", mem, pick(valueNodes));
  }

  // ---- limbic (emotion): instantiated GoEmotions labels ----
  const emotionNodes: CognitiveNode[] = [];
  for (const [family, labels] of Object.entries(EMOTION_FAMILIES)) {
    const familyNodes = labels.flatMap((label, li) =>
      Array.from({ length: 2 }, (_, i) =>
        addNode({
          id: `emo-${family}-${li}-${i}`,
          type: "emotion",
          label,
          summary: `Felt ${label} (${family.replace("_", "/")} family).`,
          lobeId: "limbic",
          metadata: { family, classifierScore: Number(scalar(0.25, 0.97).toFixed(2)) },
        }),
      ),
    );
    emotionNodes.push(...familyNodes);
    addCluster("limbic", family.replace("_", " / "), familyNodes);
  }
  for (const emo of emotionNodes) {
    addEdge("felt_during", emo, rand() > 0.5 ? pick(memoryNodes) : pick(eventNodes), false);
    if (rand() > 0.7) addEdge("caused_by", emo, pick(stimulusNodes));
  }

  // ---- frontal (reasoning): monologue/verbal pairs + contradictions ----
  const reasoningNodes = MONOLOGUE_STEMS.flatMap((stem, ri) =>
    Array.from({ length: 5 }, (_, i) =>
      addNode({
        id: `rsn-${ri}-${i}`,
        type: "reasoning",
        label: stem,
        summary: "Captured inner monologue vs. verbal response.",
        lobeId: "frontal",
        metadata: {
          innerMonologue: stem,
          verbalResponse: "A measured, guarded reply.",
          dominantInternalEmotion: pick(Object.values(EMOTION_FAMILIES).flat()),
          triggeredCoreValue: pick(CORE_VALUES)[0],
          scenario: pick(SCENARIOS),
        },
      }),
    ),
  );
  const contradictionNodes = Array.from({ length: 8 }, (_, i) =>
    addNode({
      id: `ctr-${i}`,
      type: "contradiction",
      label: `Said ≠ felt #${i + 1}`,
      summary: "Divergence between inner monologue and verbal response.",
      lobeId: "frontal",
    }),
  );
  const halfReasoning = Math.floor(reasoningNodes.length / 2);
  addCluster("frontal", "Deliberations", reasoningNodes.slice(0, halfReasoning));
  addCluster("frontal", "Decisions under pressure", reasoningNodes.slice(halfReasoning));
  addCluster("frontal", "Contradictions", contradictionNodes);
  for (const r of reasoningNodes) {
    addEdge("triggered", pick(stimulusNodes), r);
    if (rand() > 0.55) addEdge("reinforces", r, pick(valueNodes));
  }
  for (const c of contradictionNodes) {
    addEdge("contradicts", pick(reasoningNodes), c, false);
    addEdge("felt_during", pick(emotionNodes), c, false);
  }

  // ---- parietal (association): concepts + insights ----
  const conceptNodes = CONCEPTS.flatMap((concept, ci) =>
    Array.from({ length: 4 }, (_, i) =>
      addNode({
        id: `con-${ci}-${i}`,
        type: "concept",
        label: i === 0 ? concept : `${concept} (facet ${i})`,
        lobeId: "parietal",
      }),
    ),
  );
  const insightNodes = Array.from({ length: 10 }, (_, i) =>
    addNode({
      id: `ins-${i}`,
      type: "insight",
      label: `Pattern ${i + 1}: ${pick(CONCEPTS)} shapes ${pick(CONCEPTS).toLowerCase()}`,
      summary: "System-surfaced pattern across memories and values.",
      lobeId: "parietal",
    }),
  );
  const halfConcepts = Math.floor(conceptNodes.length / 2);
  addCluster("parietal", "Concept lattice", conceptNodes.slice(0, halfConcepts));
  addCluster("parietal", "Associations", conceptNodes.slice(halfConcepts));
  addCluster("parietal", "Insights", insightNodes);
  for (let i = 0; i < conceptNodes.length; i++) {
    addEdge("associated_with", conceptNodes[i]!, pick(conceptNodes), false);
  }
  for (const ins of insightNodes) {
    addEdge("derived_from", ins, pick(memoryNodes));
    addEdge("derived_from", ins, pick(valueNodes));
  }

  // dense intra-lobe association pass so every lobe graph is connected enough
  const byLobe = new Map<LobeId, CognitiveNode[]>();
  for (const n of nodes) {
    const list = byLobe.get(n.lobeId) ?? [];
    list.push(n);
    byLobe.set(n.lobeId, list);
  }
  for (const [, lobeNodes] of byLobe) {
    for (let i = 0; i < lobeNodes.length; i++) {
      const a = lobeNodes[i]!;
      const b = lobeNodes[Math.floor(rand() * lobeNodes.length)]!;
      if (a.id !== b.id) addEdge("associated_with", a, b, false);
    }
  }

  cached = { nodes, edges, clusters };
  return cached;
}
