# 07 — Data & State Model

> Status: Phase 0 proposal. There are no existing data models in this repository; the only confirmed
> external contract is the response-engine JSON from `Project-Report.md`:
> `{ dominant_internal_emotion, triggered_core_value, inner_monologue, verbal_response }` and the
> persona schema (Big 5 1–100, quantified core values, emotional baseline, backstory). All interfaces
> below are proposals to be firmed up in Phase 5 (graph foundation) and adjusted when the real
> graph-extraction backend is designed. Mock data implements these same interfaces
> (`data/mock/**`, clearly separated — Working Rule 18).

## Core vocabulary types

```ts
export type LobeId =
  | 'frontal' | 'limbic' | 'temporal' | 'parietal' | 'occipital' | 'core';

export type CognitiveNodeType =
  | 'memory' | 'emotion' | 'concept' | 'person' | 'event'
  | 'value' | 'trait' | 'reasoning' | 'contradiction' | 'insight' | 'stimulus';

export type EdgeType =
  | 'felt_during' | 'caused_by' | 'involves' | 'triggered'
  | 'reinforces' | 'contradicts' | 'associated_with' | 'derived_from' | 'precedes';

export type ActivationState = 'dormant' | 'ambient' | 'active' | 'focused';

/** 28 GoEmotions labels + neutral — [CONFIRMED] vocabulary, enumerate in code from a single source */
export type EmotionLabel = string; // narrowed to a literal union in implementation
export type EmotionFamily =
  | 'joy' | 'love' | 'surprise' | 'anger' | 'sadness_fear' | 'neutral';
```

## Graph entities

```ts
export interface CognitiveNode {
  id: string;                       // stable, URL-safe (e.g. "mem-042")
  type: CognitiveNodeType;
  label: string;
  summary?: string;
  lobeId: LobeId;                   // home lobe
  echoLobeIds?: LobeId[];           // lobes where it appears as an echo
  intensity: number;                // 0–1 emotional charge
  confidence: number;               // 0–1 system certainty
  relevance: number;                // 0–1 contextual importance
  recency: number;                  // 0–1, decayed server- or selector-side
  createdAt?: string;               // ISO 8601
  updatedAt?: string;
  clusterId?: string;
  metadata?: Record<string, unknown>;
}

export interface CognitiveEdge {
  id: string;
  type: EdgeType;
  sourceId: string;
  targetId: string;
  strength: number;                 // 0–1
  directed: boolean;                // contradicts/associated_with are undirected
  summary?: string;
}

export interface MemoryCluster {
  id: string;
  lobeId: LobeId;
  label: string;
  nodeIds: string[];
  themeHint?: string;
}

export interface LobeGraph {
  lobeId: LobeId;
  nodes: CognitiveNode[];
  edges: CognitiveEdge[];           // includes cross-lobe edges (one endpoint external)
  clusters: MemoryCluster[];
  fetchedAt: string;
}
```

## Type-specific payloads (`metadata` narrowed per type)

```ts
export interface EmotionNodeMeta {
  emotionLabel: EmotionLabel;       // GoEmotions vocabulary [CONFIRMED]
  family: EmotionFamily;
  baselineDelta?: number;           // vs. persona emotional baseline
  classifierScore?: number;         // raw RoBERTa score
}

export interface ReasoningNodeMeta {
  innerMonologue: string;           // [CONFIRMED] field
  verbalResponse: string;           // [CONFIRMED] field
  dominantInternalEmotion: EmotionLabel;   // [CONFIRMED]
  triggeredCoreValue?: string;             // [CONFIRMED]
  scenarioId?: string;
  divergenceScore?: number;         // monologue↔response distance (derived, proposal)
}

export interface ValueNodeMeta   { score: number; }            // 0–100 [CONFIRMED scale]
export interface TraitNodeMeta   { dimension: 'openness'|'conscientiousness'|'extraversion'|'agreeableness'|'neuroticism'; score: number; }
export interface PersonNodeMeta  { relation?: string; sentiment?: number; }
export interface EventNodeMeta   { occurredAt?: string; scenarioId?: string; }
export interface InsightNodeMeta { derivedFromIds: string[]; statement: string; }
export interface StimulusNodeMeta{ scenarioName: string; prompt: string; }   // validation matrix [CONFIRMED]
```

## Persona & lobe summaries

```ts
export interface PersonaSpec {                          // mirrors Persona Specification Schema [CONFIRMED]
  name: string;
  big5: Record<TraitNodeMeta['dimension'], number>;     // 1–100
  coreValues: Record<string, number>;                   // e.g. { honesty: 90, ambition: 70 }
  emotionalBaseline: EmotionLabel[];
  backstorySummary?: string;
}

export interface LobeSummary {
  lobeId: LobeId;
  displayName: string;
  tagline: string;                  // one-line hover summary
  nodeCount: number;
  activity: number;                 // 0–1 live activity for glow drive
  lastActivityAt?: string;
}

export interface Insight {
  id: string;
  statement: string;                // "Ambition suppressed Empathy in 3 of 4 threat scenarios"
  derivedFromIds: string[];
  primaryLobeId: LobeId;
  createdAt: string;
}
```

## UI state (client store — proposal: Zustand slices, see `08`)

```ts
export interface NavigationState {
  view: 'awakening' | 'brain' | 'lobe';
  activeLobeId: LobeId | null;
  selectedNodeId: string | null;    // ⇄ mirrored with the route (single source: URL wins on load)
  breadcrumb: BreadcrumbSegment[];
  pathwayHistory: string[];         // node-hop chain (Flow 7)
}

export interface CameraState {
  mode: 'orbit' | 'transition' | 'framed';
  savedPoses: Partial<Record<LobeId | 'brain', CameraPose>>;  // "coming back" memory
  transition: { kind: 'enter'|'exit'|'transit'|'travel'; progress: number; skippable: true } | null;
}
export interface CameraPose { position: [number,number,number]; target: [number,number,number]; zoom: number; }

export interface FilterState {
  nodeTypes: CognitiveNodeType[];   // empty = all
  emotionFamilies: EmotionFamily[];
  timeWindow: { from?: string; to?: string } | null;
  minStrength: number;              // edge threshold
}                                    // ⚠ serialized to URL query — shareable

export interface SearchState {
  open: boolean;
  query: string;
  results: SearchResult[];
  status: 'idle' | 'loading' | 'offline-fallback' | 'error';
}
export interface SearchResult { nodeId: string; lobeId: LobeId; label: string; snippet?: string; score: number; }

export interface AnimationState {
  reducedMotion: boolean;           // OS pref OR user override (override wins)
  perfTier: 'high' | 'medium' | 'low' | 'fallback2d';
  activeNodeIds: string[];          // capped ~12 (see 02)
  ambientPulseRate: number;
}

export interface LoadingState {
  bootProgress: number;             // 0–1, drives awakening assembly
  lobeStatus: Partial<Record<LobeId, 'idle'|'loading'|'ready'|'error'>>;
}
```

## Data-flow rules

1. **URL is the source of truth** for lobe/node/filters/time window; stores hydrate from it and
   write back (replace-state for filters, push-state for navigation).
2. **Scene reads stores via selectors; never fetches.** Fetch lives in a thin data layer
   (`lib/data/`) with two interchangeable providers: `mockProvider` (Phases 2–6) and `apiProvider`
   (FastAPI backend — endpoint shapes TBD, Open Question #2).
3. **Derived visuals are pure functions** `(node scalars, activation, tier) → InstanceAttributes` —
   testable without a renderer (Working Rule 17).
4. **Server cache** (if/when live API lands): stale-while-revalidate per lobe; graph payloads are
   immutable snapshots with `fetchedAt`, so transitions never mutate mid-flight.
5. Mock data lives in `data/mock/` with a `// MOCK` banner and a build-time flag; it must implement
   the exact interfaces above so swapping providers is a one-line change.
