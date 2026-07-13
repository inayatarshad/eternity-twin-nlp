# 02 — Cognitive Model

> Status: Phase 0 proposal. Items marked **[CONFIRMED]** come directly from `Project-Report.md`
> (the Eternity Twin backend that already exists). Everything else is a **conceptual proposal**
> requiring product approval before it becomes a requirement.

## Grounding: what the backend actually produces **[CONFIRMED]**

From `Project-Report.md`, the existing Eternity Twin system provides:

- **Emotion classification:** RoBERTa head trained on GoEmotions — **28 emotion labels + neutral**,
  multi-label, threshold 0.25. This is the canonical emotion vocabulary for the UI.
- **Persona Specification Schema:** Big 5 traits (1–100), quantified Core Values (e.g. Honesty: 90,
  Ambition: 70, Loyalty: 85), an Emotional Baseline, and Backstory/Context memory anchors.
- **Response engine output (per exchange):**
  `{ dominant_internal_emotion, triggered_core_value, inner_monologue, verbal_response }`.
- **Validation scenarios:** predefined high-stress contexts (e.g. *Corporate Espionage / Leaked
  Roadmap*) used for ablation testing.

The UI's cognitive model is designed so every conceptual entity can be *populated* from these
sources (plus mock data until a graph-building pipeline exists — see Open Questions).

## Proposed brain lobes

| ID (slug) | Display name | Purpose | Primary data | Accent |
|---|---|---|---|---|
| `frontal` | Frontal — Reasoning | Deliberation, decisions, contradictions | `inner_monologue` traces, decision nodes | Neural cyan |
| `limbic` | Limbic — Emotion | Felt states and their intensities | GoEmotions labels, `dominant_internal_emotion`, baseline | Emotion magenta |
| `temporal` | Temporal — Memory | Episodic and biographical memory | Backstory anchors, event history | Memory violet |
| `parietal` | Parietal — Association | Concepts and semantic structure | Concept nodes, cross-domain links, insights | Aurora teal |
| `occipital` | Occipital — Perception | What the twin has been exposed to | Scenarios, stimuli, people encountered | Deep signal blue |
| `core` | Core — Identity | Who the twin is | Big 5 vector, Core Values, self-model | Consciousness gold |

Notes:
- `core` renders as a luminous nucleus at the brain's center rather than a cortical surface region —
  identity is what everything else surrounds.
- Nodes belong to a **home lobe** but may appear as "echoes" in others via cross-lobe edges (a memory
  echoes in Limbic through its emotion links).

## Node categories

| Type | Home lobe | Description | Source |
|---|---|---|---|
| `memory` | temporal | Episodic memory / backstory anchor | Backstory **[CONFIRMED]**, conversation history |
| `emotion` | limbic | One of the 28 GoEmotions labels + neutral, instantiated with intensity | RoBERTa **[CONFIRMED]** |
| `concept` | parietal | Abstract idea the twin reasons with | Derived (proposal) |
| `person` | occipital | A person/identity known to the twin | Backstory, scenarios (proposal) |
| `event` | temporal | Time-anchored occurrence | Scenarios, conversation log (proposal) |
| `value` | core | A quantified core value | Persona schema **[CONFIRMED]** |
| `trait` | core | A Big 5 dimension with score | Persona schema **[CONFIRMED]** |
| `reasoning` | frontal | A captured inner-monologue / decision trace | Response engine **[CONFIRMED]** |
| `contradiction` | frontal | Detected tension (value vs. action, memory vs. claim) | Derived (proposal) |
| `insight` | parietal | System-surfaced pattern across nodes | Derived (proposal) |
| `stimulus` | occipital | An input scenario/prompt presented to the twin | Validation matrix **[CONFIRMED]** |

## Relationship categories (edges)

| Type | Meaning | Example |
|---|---|---|
| `felt_during` | emotion ↔ event/memory | *fear* felt_during *interrogation scenario* |
| `caused_by` | directional causation | *distrust of managers* caused_by *betrayal memory* |
| `involves` | event/memory ↔ person | *leaked roadmap* involves *rival CTO* |
| `triggered` | stimulus → value/emotion | scenario triggered *Loyalty* (`triggered_core_value` **[CONFIRMED]**) |
| `reinforces` | node strengthens node | *promotion memory* reinforces *Ambition* |
| `contradicts` | tension between nodes | *verbal_response* contradicts *inner_monologue* |
| `associated_with` | weak semantic link | concept ↔ concept |
| `derived_from` | insight/reasoning provenance | insight derived_from {3 memories, 1 value} |
| `precedes` | temporal ordering | event A precedes event B |

Edges carry `strength` (0–1) and inherit visual weight from it.

## Memory types (within `memory`)

`episodic` (a specific happening) · `biographical` (backstory fact) · `procedural` (learned behavior)
· `declarative` (known fact). Phase 1 data will mostly be `biographical` + `episodic`.

## Emotion types

The 28 GoEmotions labels + neutral **[CONFIRMED]** grouped for UI color/cluster purposes into five
families (proposal): *joy-family, love-family, surprise-family, anger-family, sadness/fear-family*,
plus *neutral*. The families drive hue variation inside the Limbic lobe; exact grouping to be
finalized in Phase 5–6 against the actual label list.

## Concept, person, event, reasoning, contradiction, insight nodes

Covered in the node-category table. Two clarifications:

- **Reasoning nodes are verbatim artifacts** — each stores the actual `inner_monologue` +
  `verbal_response` pair from one exchange, making the twin's public/private divergence inspectable.
  This divergence is the project's core research value and deserves first-class UI treatment.
- **Contradiction nodes are computed**, not authored: e.g., cosine/semantic distance between
  monologue and response beyond a threshold, or an action conflicting with a value ≥ 75. Detection
  pipeline does not exist yet → mock in Phase 5–6, flag as backend work.

## Scalar dimensions on nodes

| Dimension | Range | Meaning | Visual encoding (see `04`) |
|---|---|---|---|
| `intensity` | 0–1 | Emotional charge | Glow radius |
| `confidence` | 0–1 | Classifier/system certainty (e.g. RoBERTa score) | Opacity / solidity |
| `recency` | 0–1 (decayed) | How recently touched | Pulse frequency |
| `relevance` | 0–1 | Contextual importance (query- or scenario-relative) | Size |
| `activation` | enum | `dormant · ambient · active · focused` | Material state |

Relationship `strength` (0–1) → edge thickness/brightness.

## Activation state machine

```
dormant  → ambient   (lobe entered; node in view)
ambient  → active    (hover, search hit, or edge-traced)
active   → focused   (selected; inspector open)
focused  → active    (deselect)
any      → dormant   (lobe exited)
```

At most **one** `focused` node globally; `active` capped (~12) to protect glow budget and legibility.

## Conceptual vs. confirmed — summary

**Confirmed by existing backend:** 28-emotion vocabulary; Big 5 + Core Values + baseline + backstory
schema; per-exchange `{emotion, value, monologue, response}` records; scenario matrix.

**Conceptual (needs approval / backend work):** the six-lobe mapping; graph extraction from backstory
and conversation logs; contradiction detection; insight generation; person/concept entity extraction;
recency decay function. Until approved and built, all of these run on **mock data** clearly separated
from production data (Working Rule 18).
