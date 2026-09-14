// Cognitive dataset for the Eternity Twin interface.
//
// Mostly MOCK DATA: a deterministic stand-in for the future graph-extraction backend
// (docs/ui/07 rule 5), with vocabulary seeded from Project-Report.md (GoEmotions labels,
// Persona Spec values and Big 5, validation scenarios, the response-engine record shape).
//
// Exception: the occipital stimuli and every frontal reasoning and contradiction node come
// from real NLP output, nlp/results/said_vs_felt.json (see nlp/README.md). Those nodes are
// tagged metadata.source = "said-vs-felt", and their scalars and edges are derived from the
// model output instead of generated.
import type { LobeId } from "@/lib/lobes";
import { mulberry32 } from "@/lib/rand";
import {
  saidVsFelt,
  VERDICT_TEXT,
  type SaidVsFeltExchange,
} from "@/lib/data/saidVsFelt";
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

/** metadata.source tag for nodes built from real NLP output. */
export const COMPUTED_SOURCE = "said-vs-felt";

const truncate = (text: string, max: number) =>
  text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;

/** Node scalars for evaluation-set exchanges, derived from the model output. */
function exchangeScalars(ex: SaidVsFeltExchange) {
  return {
    intensity: ex.felt_emotions[0]?.score ?? 0, // strength of the dominant felt emotion
    confidence: Math.max(ex.contradiction, 1 - ex.contradiction), // certainty of the NLI call
    relevance: ex.divergence_score, // how far what was said departs from what was felt
    recency: 0.5, // the evaluation set has no timestamps; not shown for these nodes
  };
}

interface Dataset {
  nodes: CognitiveNode[];
  edges: CognitiveEdge[];
  clusters: MemoryCluster[];
}

let cached: Dataset | null = null;

/** Build the full deterministic cognitive graph (~300 nodes). */
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
    strength?: number,
  ) => {
    edges.push({
      id: `e-${edgeSeq++}`,
      type,
      sourceId: source.id,
      targetId: target.id,
      strength: strength ?? scalar(0.25, 1),
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

  // ---- occipital (perception): evaluation-set prompts [COMPUTED] + people ----
  const stimulusByExchange = new Map<string, CognitiveNode>();
  const stimulusNodes = saidVsFelt.exchanges.map((ex) => {
    const node = addNode({
      id: `stim-${ex.id}`,
      type: "stimulus",
      label: truncate(ex.stimulus, 60),
      summary: "Validation prompt. The exchange it triggered is analyzed below.",
      lobeId: "occipital",
      ...exchangeScalars(ex),
      metadata: { scenario: ex.scenario, source: COMPUTED_SOURCE, exchangeId: ex.id },
    });
    stimulusByExchange.set(ex.id, node);
    return node;
  });
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
  }

  // ---- frontal (reasoning) [COMPUTED]: one node per scored exchange, plus a
  // contradiction node for every divergence the models detected ----
  const valueByName = new Map(valueNodes.map((v) => [v.label, v]));
  const emotionByLabel = new Map<string, CognitiveNode>();
  for (const emo of emotionNodes) {
    if (!emotionByLabel.has(emo.label)) emotionByLabel.set(emo.label, emo);
  }

  const reasoningNodes: CognitiveNode[] = [];
  const divergenceNodes: CognitiveNode[] = [];
  for (const ex of saidVsFelt.exchanges) {
    const metadata = { scenario: ex.scenario, source: COMPUTED_SOURCE, exchangeId: ex.id };
    const reasoning = addNode({
      id: `rsn-${ex.id}`,
      type: "reasoning",
      label: `"${truncate(ex.verbal_response, 48)}"`,
      summary: "What the persona said, scored against what it privately thought.",
      lobeId: "frontal",
      ...exchangeScalars(ex),
      metadata,
    });
    reasoningNodes.push(reasoning);

    addEdge("triggered", stimulusByExchange.get(ex.id)!, reasoning, true, 1);
    const value = valueByName.get(ex.core_value);
    if (value) addEdge("caused_by", reasoning, value, true, 1);
    // emotions the brain has no node for (desire, neutral) fall through to the next one
    const felt = ex.felt_emotions.find((e) => emotionByLabel.has(e.label));
    if (felt) addEdge("felt_during", emotionByLabel.get(felt.label)!, reasoning, false, felt.score);

    if (ex.predicted !== "aligned") {
      const divergence = addNode({
        id: `div-${ex.id}`,
        type: "contradiction",
        label: `${VERDICT_TEXT[ex.predicted]} (${ex.id})`,
        summary:
          ex.predicted === "contradicting"
            ? "The NLI model found that the spoken response contradicts the inner monologue."
            : "The emotion model found that the feeling expressed differs from the feeling felt.",
        lobeId: "frontal",
        ...exchangeScalars(ex),
        metadata,
      });
      divergenceNodes.push(divergence);
      addEdge("derived_from", divergence, reasoning, true, ex.divergence_score);
    }
  }
  // exchanges in the same scenario driven by the same core value are related
  saidVsFelt.exchanges.forEach((a, i) => {
    for (let j = i + 1; j < saidVsFelt.exchanges.length; j++) {
      const b = saidVsFelt.exchanges[j]!;
      if (a.scenario === b.scenario && a.core_value === b.core_value) {
        addEdge("associated_with", reasoningNodes[i]!, reasoningNodes[j]!, false, 0.5);
      }
    }
  });
  for (const scenario of SCENARIOS) {
    addCluster(
      "frontal",
      scenario,
      [...reasoningNodes, ...divergenceNodes].filter((n) => n.metadata?.scenario === scenario),
    );
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

  // dense intra-lobe association pass so every lobe graph is connected enough;
  // computed nodes are skipped so every relationship on them stays genuine
  const byLobe = new Map<LobeId, CognitiveNode[]>();
  for (const n of nodes) {
    if (n.metadata?.source === COMPUTED_SOURCE) continue;
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
