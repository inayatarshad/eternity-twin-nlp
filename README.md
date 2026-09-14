# Eternity Twin NLP: Interpretable Persona Modeling

**A mind you can enter, with real language understanding underneath.** This is the NLP research
edition of Eternity Twin: the same immersive 3D brain interface, extended with an NLP pipeline that
detects when a persona's words diverge from its private thoughts, and shows that analysis inside the
brain.

**Original interface:** [digitalbrain-green.vercel.app](https://digitalbrain-green.vercel.app)
(the visualization this project builds on)

---

## Said vs. Felt

Every Eternity Twin exchange carries two texts: what the persona privately thinks (its inner
monologue) and what it says out loud. This project measures the gap between them with two
complementary NLP signals:

- **Contradiction:** a DeBERTa-v3 natural language inference model checks whether the spoken
  response contradicts the inner monologue. This catches lies.
- **Emotional divergence:** a RoBERTa GoEmotions classifier detects the emotions in both texts, and
  the Jensen-Shannon divergence between them measures how far the feeling expressed departs from the
  feeling felt. This catches masking (feeling furious, speaking calmly), which NLI alone misses.

Both were evaluated on a hand-labeled set of 40 exchanges across four high-stress scenarios, against
a word-overlap control that a model must beat to count as evidence:

| Task | Model | Word-overlap control |
|---|---|---|
| Detecting masked feelings | **0.928** AUROC | 0.533 |
| Separating divergent from honest answers | **0.952** AUROC | 0.705 |
| Detecting lies | 0.988 AUROC | 0.969 |

Three-way accuracy (aligned, masked, contradicting) is 72.5% against a 37.5% majority baseline. The
first version of the evaluation set had a lexical-overlap artifact that let word overlap alone match
the models; finding and removing it, the full results, error analysis, and limitations are
documented in [`nlp/README.md`](nlp/README.md).

### In the app

- The **frontal lobe** holds the 40 scored exchanges, plus a contradiction node for each of the 27
  divergences the models detected (17 lies, 10 masked feelings). Bigger nodes diverge more.
- The **occipital lobe** holds the 40 real prompts that triggered them.
- Each exchange links to the prompt that triggered it, the core value that drove it, and the emotion
  the model actually detected in the limbic lobe.
- Selecting any of these nodes opens a provenance panel: felt vs. said side by side, the detected
  emotions in each, both model scores, and the model's verdict next to the human label, including
  the cases where they disagree.

## What this is

Eternity Twin is the front end for a digital twin system: a persona modeled with a Big Five trait
profile, quantified core values, and a 28 label emotion classifier (RoBERTa / GoEmotions), with a
response engine that records, per exchange, the persona's inner monologue alongside what it
actually said out loud.

Instead of a dashboard of sliders and JSON, this project presents that mind as a place. A
translucent, x-ray brain floats in space. Six cognitive regions (reasoning, emotion, memory,
association, perception, and identity) are real anatomical areas of a single 3D mesh, classified
vertex by vertex, so hovering one lights up the actual folds and outlines of that region rather
than an invisible shape floating over it. Selecting a region flies the camera through the cortex
into a constellation of memories, emotions, people, and events, laid out by a physics simulation
and linked by typed relationships you can trace from node to node.

## The AI system underneath

The interface is built around the output format of the Eternity Twin pipeline: a RoBERTa model fine
tuned on GoEmotions for multi label emotion classification across 28 categories, a persona
specification of quantified Big Five traits and core values, and a Qwen2.5 response engine that
records, for every exchange, the persona's inner monologue and the verbal response it actually
gives. That pairing is a small, concrete window into the gap between a model's internal state and
its external behavior.

In this build, the reasoning and perception regions show real NLP analysis of the evaluation set
described above. The remaining regions (memory, association, and most of the emotion and identity
detail) use representative sample data, kept separate in code, so the interface can show what a
full mind map looks like. Sensing (a model reading text), inference (which value or emotion is
active), and decision (what gets said out loud) are treated as three separate, inspectable stages
rather than one black box. Making that pipeline legible, rather than just visually impressive, was
the part of this project I cared about most.

## Highlights

- **NLP analysis you can walk through.** The said-vs-felt pipeline's output lives inside the brain:
  every detected lie or masked feeling is a node you can open, with the evidence and the model's
  confidence beside the human judgment.
- **Anatomically real region detection.** Every vertex of the brain mesh is classified into a
  cognitive lobe at load time. A custom GLSL fresnel shader recolors that region's actual outline
  on hover and selection, driven by a single float uniform array. There are no overlay shapes and
  no fake hitboxes.
- **A living knowledge graph per region.** Nodes (memories, emotions, concepts, people, events,
  values, reasoning traces, contradictions, insights) and typed edges (`caused_by`, `precedes`,
  `contradicts`, `reinforces`, and more) are laid out with a force simulation running in a Web
  Worker, so the main thread never blocks. It renders as two draw calls total (one instanced mesh
  for nodes, one line segment buffer for edges) no matter how large the graph gets.
- **A cinematic but honest transition system.** A single `TransitionDirector` owns all camera
  movement and reacts only to the URL, so clicking a region, pressing Escape, using the breadcrumb,
  and the browser's Back button all produce the same correct animation for free.
- **Full keyboard and screen reader parity in a WebGL scene.** Every interactive 3D element has a
  DOM twin, an accessible, roving tabindex button with a real name and description, so the entire
  experience, including hovering, entering a region, and reading a memory's relationships, works
  without a mouse.
- **Two real themes, not a filter.** Light and dark are fully independent visual treatments, not a
  CSS invert, with contrast validated by an automated WCAG test suite and bloom and particle tuning
  calibrated separately for each, since a glow that reads on near black is invisible on pale.
- **Respects reduced motion completely.** Every camera flight, particle system, and idle animation
  has a true static or instant equivalent, not just a shorter duration.
- **Graceful everywhere.** Automatic performance tier detection (high, medium, low), a complete 2D
  fallback for phones and non WebGL browsers, and live recovery from a lost WebGL context.

## Cognitive model

| Region | Represents | Data in this build |
|---|---|---|
| Frontal (Reasoning) | Deliberation, decisions, contradictions | NLP-scored exchanges and detected divergences |
| Occipital (Perception) | Stimuli and people encountered | Evaluation-set prompts; sample people |
| Limbic (Emotion) | Felt states and their intensity | GoEmotions categories; links to detected emotions |
| Core (Identity) | Who the persona is | Persona spec values and Big Five traits |
| Temporal (Memory) | Episodic and biographical memory | Sample data |
| Parietal (Association) | Concepts, semantic links, insights | Sample data |

## Tech stack

| Layer | Choice |
|---|---|
| NLP | Python, Hugging Face `transformers`: DeBERTa-v3 NLI cross-encoder and RoBERTa GoEmotions classifier, run offline to produce JSON the app reads |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript 6 (strict) |
| 3D | three.js with React Three Fiber, drei, custom GLSL shaders, `@react-three/postprocessing` |
| Graph layout | `d3-force-3d`, off the main thread in a Web Worker |
| State | Zustand (scene, camera, attention), with the URL as the single source of navigational truth |
| Data | TanStack Query over a swappable provider interface |
| Styling | Tailwind CSS 4, design tokens as CSS custom properties, dual light and dark themes |
| Testing | Vitest, covering NLP result wiring, data invariants, camera path math, WCAG contrast, and performance tier logic |
| Deployment | Vercel |

## Getting started

```bash
npm install
npm run dev       # http://localhost:3000
```

Other scripts:

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
npm test           # vitest
```

The app reads committed NLP results, so it needs no Python to run. To re-run the pipeline, see
[`nlp/README.md`](nlp/README.md).

## Project structure

```
nlp/                     said-vs-felt pipeline: evaluation set, scoring script, results, write-up
app/                     routes: /, /brain, /brain/[lobe], /brain/[lobe]/node/[nodeId], /settings
components/scene/        the 3D layer: brain shell, shader materials, knowledge graph, camera director
components/chrome/       DOM UI over the persistent Canvas: HUD, list view, said-vs-felt panel
components/ui/           design system primitives (glass panels, meters, toasts, chips)
lib/data/                NLP result access, the cognitive dataset, and the provider seam
lib/scene/               pure, unit-testable math: camera paths, force layout, perf-tier detection
lib/state/               Zustand stores (scene/camera/attention, user preferences)
docs/ui/                 the design system, architecture decisions, and phased roadmap
public/models/           the anatomical brain mesh and synapse point cloud
```

## Status

Built: the interactive brain, the region entry transition, the per region knowledge graph, and the
said-vs-felt NLP pipeline wired into the reasoning and perception regions. Next: an independent
second annotator for the evaluation set, scoring real exchanges from the Qwen2.5 response engine,
and a stance-detection signal for the failure case both current models miss.
