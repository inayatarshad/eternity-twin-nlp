# 00 — UI Vision

> Status: Phase 0 proposal — derived from `Project-Report.md`, the `system design/` references, and the
> project brief. Nothing in this document is a confirmed product requirement unless marked **[CONFIRMED]**.

## Product experience summary

**Eternity Twin — Cognitive Interface** is the immersive front-end to the Eternity Twin digital-twin
system. Where the existing MVP dashboard (Next.js sliders + JSON terminal, built previously,
**not present in this repository**) exposed the twin's raw telemetry, this interface presents the twin
as what it conceptually is: **a mind you can enter**.

The centerpiece is a luminous, semi-transparent 3D brain floating in a dark celestial space. Each lobe
is a living region of the twin's cognition — memory, emotion, identity, reasoning, perception,
association. Hovering a lobe makes it breathe and glow; selecting it dives the camera *through* the
cortex into an internal spatial knowledge environment: a constellation of nodes (memories, emotions,
concepts, people, events, insights) linked by synaptic pathways, explorable like an Obsidian graph
rendered as a galaxy.

## Emotional objective

The user should feel they are **communing with a mind, not operating a dashboard**.

- **Awe, not spectacle** — the visual language borrows from nebulae, prisms, and sacred geometry, but
  every glow means something (activation, relevance, recency).
- **Intimacy** — this is *someone's* inner world (the persona's). Exploration should feel respectful,
  quiet, contemplative — closer to a planetarium than a video game.
- **Comprehension** — beneath the cinema, this is an analytical tool. A researcher validating persona
  behavior must be able to answer real questions: *why did the twin respond this way? which value
  fired? what memory anchored it?*

## Core visual metaphor

**The mind as a cosmos.** The reference material makes this explicit:

- `data_points kinda image.jpg` — neural filaments indistinguishable from the cosmic web: **knowledge
  as large-scale structure**, clusters as galaxies, edges as filaments of light.
- `chromatic aberation.jpg` — light refracted through glass into spectra: **cognition as light passing
  through a prism**; one white input (a stimulus) diffracting into many colored outputs (emotions,
  values, memories).
- `hand_focuses into the brain.mp4` — a hand reaches toward a nebula, the camera dives through a
  particle warp, and emerges at planetary scale: **crossing a scale boundary**. This is the master
  reference for the lobe-entry transition — entering a lobe is traveling from the outside of a mind
  to the inside of a universe.

## The role of the brain

The brain is the **home screen, navigation device, and system-status display** simultaneously:

1. **Map** — its lobes are the top-level information architecture. There is no traditional nav bar at
   home; the anatomy *is* the menu.
2. **Instrument** — lobe glow intensity reflects live state (e.g., recent emotional activation from
   the response engine's `dominant_internal_emotion`, memory recency, value conflicts).
3. **Presence** — idle breathing, ambient particles, and slow synaptic pulses signal that the twin is
   "alive" even when the user does nothing.

## The meaning of each lobe

(Full model in `02-cognitive-model.md`; summary here.)

| Lobe | Cognitive function | Backed by (from Project-Report.md) |
|---|---|---|
| **Frontal — Reasoning** | Inner monologue, decisions, contradictions | `inner_monologue`, high-stress scenario traces |
| **Limbic — Emotion** | Felt states, intensity, baseline | RoBERTa GoEmotions head (28 labels), `dominant_internal_emotion`, Emotional Baseline |
| **Temporal — Memory** | Episodic anchors, backstory, events | Backstory / Context memory anchors |
| **Parietal — Association** | Concepts, semantic relations, insights | Derived / conceptual (no backend source yet) |
| **Occipital — Perception** | Incoming scenarios, stimuli, people | Validation scenario matrix, conversation inputs |
| **Core — Identity** | Big 5 traits, core values, the persona itself | Persona Specification Schema (Big 5 1–100, Core Values) |

## The internal knowledge universe

Inside a lobe, the user is in a **spatial knowledge graph**:

- **Nodes** = memories, emotions, concepts, people, events, values, insights, contradictions.
- **Edges** = typed semantic relationships (caused-by, felt-during, contradicts, reinforces,
  involves, derived-from).
- **Clusters** = thematically bound constellations (e.g., all nodes touching one scenario).
- **Light** = meaning. Brightness ⇒ activation/relevance; hue ⇒ node category; pulse ⇒ recency.

## How the experience should feel

Slow, weighty, luminous, deliberate. Long easings, physical camera moves, sound-less gravity.
Interactions respond instantly (≤100 ms feedback) even when the *aesthetic* motion is slow — the
cinema must never make the tool feel laggy.

## What makes this interface different

1. Navigation through anatomy instead of menus.
2. A knowledge graph treated as a *place*, not a diagram.
3. Every visual effect doubles as data encoding (glow = activation, spectra = emotional diffusion).
4. Grounded in a real behavioral backend — the persona vectors and emotion classifier already exist.

## Design principles

1. **Light is information.** No glow without a variable behind it.
2. **One world, many scales.** Brain → lobe → node is a continuous zoom, never a hard page swap.
3. **Cinema serves comprehension.** Any effect that slows understanding gets cut.
4. **Darkness is the canvas.** The interface is 90% near-black; luminance is spent like a budget.
5. **Anatomical honesty, poetic license.** The brain should read as a brain, but it is a stylized
   cognitive map, not a medical model.

## UX principles

1. Every pointer interaction has a keyboard and screen-reader equivalent.
2. The current location (lobe / node / depth) is always visible and always escapable (breadcrumb + Esc).
3. Progressive disclosure: labels on hover, summaries on focus, full inspector on selection.
4. Reduced-motion and non-WebGL users get a *complete* experience, not an apology.
5. Never trap the user in a transition — all cinematic moves are skippable.

## Non-goals

- Not a chat client (conversation with the twin may surface as *data* here, but the chat UI itself is
  out of scope for this plan).
- Not a persona *editor* in v1 — the existing MVP dashboard's sliders are a separate concern; this
  interface reads the persona. (Open question #4 in `11-decisions-and-open-questions.md`.)
- Not a medical/neuroscience visualization; anatomical accuracy beyond recognizability is a non-goal.
- Not a mobile-first product; mobile gets a functional fallback, not the full 3D experience.

## Visual styles to avoid

- Neon cyberpunk clutter (hot pink grids, glitch text, scanlines).
- Sci-fi HUD kitsch (rotating rings, fake radar sweeps, decorative hexagons).
- Corporate dashboard chrome (cards with drop shadows, KPI tiles) inside the immersive views.
- Excessive bloom that crushes readability — bloom is capped and purposeful (see `04`, `05`).
- Skeuomorphic gore — no realistic wet tissue; the brain is glass, light, and energy.
