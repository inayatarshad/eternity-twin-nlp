# Eternity Twin: Cognitive Interface

**A mind you can enter.** An immersive 3D interface that visualizes an AI persona's memory as a
luminous, navigable brain. Hover a cognitive region to see it light up as real anatomy, then dive
in and explore that region's memories, emotions, and reasoning as a living knowledge graph.

**Live:** [digitalbrain-green.vercel.app](https://digitalbrain-green.vercel.app)

---

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

The persona this interface visualizes is not a static dataset; it comes from a real classification
pipeline. A RoBERTa model fine tuned on GoEmotions performs multi label emotion classification
across 28 categories, paired with a persona specification of quantified Big Five traits and core
values. For every exchange, the response engine records two signals: the persona's inner monologue
and the verbal response it actually gives, a small, concrete window into the gap between a model's
internal state and its external behavior.

That gap is the reason the "reasoning" and "contradiction" node types exist in the graph: they turn
an otherwise opaque decision into something you can trace back to the value it triggered and the
emotion behind it. Every node carries a confidence scalar designed to mirror the classifier's real
uncertainty once wired to live data, not to decorate it. Sensing (the classifier reading text),
inference (which value or memory activates), and decision (what gets said out loud) are treated as
three separate, inspectable stages rather than one black box. Making that pipeline legible, rather
than just visually impressive, was the part of this project I cared about most.

## Highlights

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
  without a mouse. Audited clean with `axe-core` on every route.
- **Two real themes, not a filter.** Light and dark are fully independent visual treatments, not a
  CSS invert, with contrast validated by an automated WCAG test suite and bloom and particle tuning
  calibrated separately for each, since a glow that reads on near black is invisible on pale.
- **Respects reduced motion completely.** Every camera flight, particle system, and idle animation
  has a true static or instant equivalent, not just a shorter duration.
- **Graceful everywhere.** Automatic performance tier detection (high, medium, low), a complete 2D
  fallback for phones and non WebGL browsers, and live recovery from a lost WebGL context.

## Cognitive model

| Region | Represents | Backed by |
|---|---|---|
| Frontal (Reasoning) | Deliberation, decisions, contradictions | Inner monologue vs. verbal response records |
| Limbic (Emotion) | Felt states and their intensity | 28 label GoEmotions classifier output |
| Temporal (Memory) | Episodic and biographical memory | Backstory and event history |
| Parietal (Association) | Concepts, semantic links, insights | Derived cross domain relationships |
| Occipital (Perception) | Stimuli and people encountered | Scenario inputs |
| Core (Identity) | Who the persona is | Big Five traits and quantified core values |

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript 6 (strict) |
| 3D | three.js with React Three Fiber, drei, custom GLSL shaders, `@react-three/postprocessing` |
| Graph layout | `d3-force-3d`, off the main thread in a Web Worker |
| State | Zustand (scene, camera, attention), with the URL as the single source of navigational truth |
| Data | TanStack Query over a swappable provider interface (mock today, real API later) |
| Styling | Tailwind CSS 4, design tokens as CSS custom properties, dual light and dark themes |
| Testing | Vitest, covering data invariants, camera path math, WCAG contrast, and performance tier logic |
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

## Project structure

```
app/                     routes: /, /brain, /brain/[lobe], /brain/[lobe]/node/[nodeId], /settings
components/scene/        the 3D layer: brain shell, shader materials, knowledge graph, camera director
components/chrome/       DOM UI that floats over the persistent Canvas: HUD, list view, loading veil
components/ui/           design system primitives (glass panels, meters, toasts, chips)
lib/scene/               pure, unit-testable math: camera paths, force layout, perf-tier detection
lib/data/                the mock cognitive dataset plus a provider seam for a future real API
lib/state/               Zustand stores (scene/camera/attention, user preferences)
docs/ui/                 the full design system, architecture decisions, and phased roadmap
public/models/           the anatomical brain mesh and synapse point cloud
```

## Status

Foundation, the interactive brain, the region entry transition, and the per region knowledge graph
are built and tested. Next up: a richer node inspector with full provenance, relationship tracing
with pathway history, semantic search, and a timeline view. The detailed phase by phase roadmap,
every architectural decision, and the reasoning behind them live in
[`docs/ui/`](docs/ui/10-implementation-roadmap.md).
