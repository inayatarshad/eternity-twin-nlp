# Eternity Twin UI — What We Built (handoff summary)

> One-file summary of the `digital_twin_ui` Next.js app, written so another agent (Codex) or
> developer can absorb the project in one read. Full planning corpus lives in `docs/ui/00–12`.

## The product

An immersive cognitive interface for **Eternity Twin** — a digital-twin backend that already
exists (RoBERTa GoEmotions classifier with 28 emotion labels, persona spec with Big 5 scores +
quantified core values + backstory, and a response engine that outputs
`{dominant_internal_emotion, triggered_core_value, inner_monologue, verbal_response}` per
exchange via FastAPI).

The UI presents the twin as **a mind you can enter**: a luminous x-ray brain floating in space;
each lobe is a cognitive region; selecting one dives the camera inside, where that region's
knowledge lives as a navigable 3D constellation of nodes (memories, emotions, concepts, people,
events, values, reasoning traces, contradictions, insights) linked by typed relationships.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript 6 strict · Tailwind CSS 4 (tokens in
`@theme`) · three.js 0.185 via React Three Fiber 9 + drei + postprocessing · zustand 5 ·
TanStack Query 5 · d3-force-3d (layout in a Web Worker) · framer-motion · vitest (60 tests).

## The six cognitive lobes (reused everywhere — including the 3dbrain port)

| id | Display name | Meaning | Accent |
|---|---|---|---|
| `frontal` | Frontal — Reasoning | Inner monologue, decisions, contradictions | `#5ee6ff` cyan |
| `limbic` | Limbic — Emotion | Felt states (GoEmotions), intensity | `#ff5ea8` magenta |
| `temporal` | Temporal — Memory | Episodic + biographical memory | `#9d7bff` violet |
| `parietal` | Parietal — Association | Concepts, semantic links, insights | `#4fd8c4` teal |
| `occipital` | Occipital — Perception | Stimuli/scenarios, people encountered | `#4f8dff` blue |
| `core` | Core — Identity | Big 5 traits + core values (golden nucleus at brain center) | `#ffd66e` gold |

## What was delivered (Phases 0–5, all gates green)

**Phase 0 — Planning corpus.** 13 docs (`docs/ui/00–12`): vision, IA/routes, cognitive model,
user flows, design system, motion spec, component architecture, data/state contracts, tech
choices with rejected alternatives, a11y/perf budgets, phased roadmap, decision log, progress log.

**Phase 1 — Foundation.** Design tokens (space-950…700 dark palette, lobe accents, text tiers,
glass material, glow tiers, z-strata, durations/easings) as CSS custom properties + Tailwind
utilities, mirrored in TS with a 29-assertion WCAG contrast test suite. Primitives: GlassPanel,
Meter (role="meter"), Chip, Kbd, Toast, EmptyState, VisuallyHidden. Persisted preference store
(reduced motion override / performance tier / high legibility) stamping `data-*` on `<html>`.
`/settings` + `/dev/tokens` calibration gallery. Focus ring is a global instant white outline
(pre-set `outline-color` everywhere so Tailwind transitions can never fade it in).

**Phase 2 — Brain scene.** R3F canvas with tier detection (high/medium/low/fallback2d — phones
default to a 2D SVG lobe-map mode), starfield + fog depth, tier-capped particles, loading veil
driven by real readiness (skippable), WebGL context-loss → 2D fallback → "Try 3D again" restore.

**Phase 3 — Interactive lobes.** Raycast hover with asymmetric intensity lerp (attack ≤100 ms,
decay ≈250 ms, snap under reduced motion); attended lobe brightens ×1.35 while others dim;
activation flash; **DOM-twin keyboard widget** (one tab stop, arrow-key roving over sr-only
buttons with full accessible names) driving the same attention state as the mouse; live-region
announcements; `/brain/[lobe]` routes with breadcrumb, Esc-return, unknown-slug toast redirect.

**Phase 4 — Warp transition.** The Canvas moved into a persistent `app/brain/layout.tsx` so it
survives route changes; pages are DOM overlays. `TransitionDirector` (sole camera authority)
reacts only to the URL-derived view — so gestures, Esc, breadcrumb, and browser back/forward all
share one path. Enter: 850 ms bezier through the cortex with +14° FOV bump and 240 camera-locked
warp streaks; exit: 700 ms back to the **saved** orbit pose. Any input skips. Reduced motion:
instant snap + 300 ms crossfade veil + spoken announcement. Timing ceilings are unit tests.

**Brain restyle (user request).** Visuals adapted from `github.com/victors1681/3dbrain`:
anatomical OBJ (`public/models/brain_mesh.obj`, 1.66 MB, 26k faces) under an x-ray fresnel
shader — `intensity = pow(c − |dot(viewNormal, z)|, p)` with the repo's constants
`c 0.9, p 6.7, glow #84ccff`, additive/DoubleSide/no-depth-write — plus the repo's 14k-point
vertex cloud as soft synapse sprites. The six lobes became near-invisible **highlight overlays +
raycast proxies** above the shell, so all interactivity survived. ⚠️ That repo has **no license
file** — assets must be cleared/replaced before any public release (Open Question #11).
Later feedback removed the golden halo light and hid the core nucleus inside lobe interiors.

**Phase 5 — Knowledge graph.** Doc-07 data contracts (`lib/types/cognitive.ts`); deterministic
~290-node mock dataset seeded from the Project-Report vocabulary (provider seam swaps to the real
API later); d3-force-3d layout in a Web Worker (cluster gravity anchors on a fibonacci sphere,
settles once then static, transferable Float32Array, inline fallback); rendering is 2 draw calls
(InstancedMesh nodes: color=type/size=relevance; LineSegments edges: endpoint-gradient,
brightness=strength) with instanceId picking, hover labels, cluster landmark captions; interior
orbit/zoom/pan; `/brain/[lobe]/node/[id]` routes with a glass inspector (scalar meters +
relationship hop-links); "Explore as list" accessible view. Data flows Query → zustand → scene
(React context does not bridge into the R3F reconciler).

## Key architectural facts

- **URL is the source of truth** — view, selected node, everything navigable deep-links cold.
- **One persistent Canvas** across `/brain` ⇄ `/brain/[lobe]` ⇄ node routes.
- **Every interactive scene element has a DOM twin** — the accessibility tree is built from
  data, never from WebGL. axe runs clean (0 violations) on all routes.
- **Reduced motion is a complete parallel experience**, not an afterthought.
- All effects have numeric budgets (docs/ui/04 + 09); mock data is quarantined behind a provider
  interface.

## Current status / what's next

Phases 0–5 done (60/60 tests, lint/tsc/build clean). Phase 6 (full node inspector with
monologue-vs-response provenance, relationship tracing, activation states) is next in the
roadmap, then cinematics (7), search/timeline/insights (8), a11y/responsive hardening (9),
polish (10). Pending human checks: sustained FPS numbers on desktop, brain-mesh orientation
sanity, transition feel.
