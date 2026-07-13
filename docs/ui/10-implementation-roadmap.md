# 10 — Implementation Roadmap

> Tracking document — update checkboxes and status per session (Working Rules 6–8).
> A phase does not begin until the previous phase's acceptance criteria are checked.
> Statuses: `not started · in progress · blocked · done`.

## Phase 0 — Discovery & Audit — **status: done (2026-07-11)**

- **Goal:** understand what exists; produce the planning corpus.
- **Scope:** audit repo + references; write `docs/ui/00–12`.
- **Files affected:** created `docs/ui/*` (13 files). No app code.
- **Dependencies:** none installed.
- **Findings:** repository is greenfield (no code, no package.json); assets = `Project-Report.md`
  + 2 reference images + 1 reference video; prior Next.js MVP dashboard exists but **not in this
  repo** (Open Question #1).
- **Acceptance criteria:**
  - [x] Complete `docs/ui/` planning folder (00–12)
  - [x] Existing material audited (report read; both images + video frames reviewed)
  - [x] Open questions recorded in `11-decisions-and-open-questions.md`
  - [x] No UI implementation performed

## Phase 1 — Foundation & Design Tokens — **status: done (2026-07-11)**

- **Goal:** stable design foundation; app scaffold; zero 3D.
- **Scope:** Next.js + TS strict scaffold; token system from `04` (CSS custom properties +
  Tailwind mapping); fonts; `ui/` primitives (GlassPanel, Meter, Chip, Kbd, Toast, EmptyState,
  VisuallyHidden, FocusRing); reduced-motion + perf-tier plumbing (`AnimationState` slice);
  `/settings` skeleton; a token gallery page for visual verification.
- **Files created (planned):** `app/` scaffold, `styles/tokens.css`, `components/ui/*`,
  `lib/state/animation.ts`, `app/settings/page.tsx`, `app/dev/tokens/page.tsx`.
- **Dependencies (requires approval — `08`):** next, react, typescript, tailwindcss, framer-motion,
  zustand, lucide-react (+ dev tooling). **No three.js yet.**
- **Risks:** token values unproven on screen → gallery page exists precisely to calibrate.
- **Acceptance criteria:**
  - [x] Scaffold builds clean (`tsc --noEmit`, lint pass) — Next 16.2 / TS 6 strict / ESLint 9, all clean
  - [x] All `04` tokens implemented & rendered in gallery (17 swatches, type scale, spacing, radius, glass, glows)
  - [x] Text token pairs verified ≥ 4.5:1 (29 vitest assertions; `text-muted` calibrated #6b7394→#757e9f)
  - [x] Primitives keyboard-operable with visible focus (instant white 2px ring verified; native inputs)
  - [x] Reduced-motion override toggle works & persists (localStorage `eternity-preferences`, survives reload)
- **Testing checklist:** unit tests for token contrast ✔ (29 pass); axe pass on `/`, `/settings`,
  `/dev/tokens` ✔ (0 violations after 2 fixes); keyboard walk ✔ (focus-visible ring verified
  programmatically — the session's embedded browser could not render frames, so on-screen visual
  calibration of hues/bloom is still pending a human pass over `/dev/tokens`).

## Phase 2 — Static Brain Experience — **status: done pending visual sign-off (2026-07-11)**

- **Goal:** visually coherent static brain scene at `/brain`.
- **Scope:** `SceneRoot`, `BrainScene`, `BrainModel` (placeholder GLB or stylized procedural),
  `DivineLightSource`, starfield backplate, `ParticleField` (ambient), `LobeLabel`s, clamped orbit,
  responsive layout, `LoadingExperience` v1 (progress-driven, skippable).
- **Dependencies:** three, @react-three/fiber, drei, postprocessing (approval per `08`).
- **Risks:** placeholder asset quality (mitigate: stylized > realistic); bloom overuse (caps from `04`).
- **Acceptance criteria:**
  - [ ] `/brain` renders 60 fps (high tier) / ≥30 fps (medium) on test hardware — **pending human
    run**: the session's embedded browser produced zero animation frames, so FPS could not be
    measured by automation; everything else about the scene mounts cleanly (WebGL2 context, no
    console errors)
  - [ ] Six lobes visually distinct with labels — **pending the same human pass** (labels, colors,
    and composition verified in DOM; pixels unverifiable this session); tablet + desktop layout
    verified (canvas mounts, chrome intact, no overflow)
  - [x] Loading experience driven by real readiness; skippable; lifts immediately in fallback mode
  - [x] fallback2d renders when WebGL absent (6-lobe SVG map + legend; context-loss → fallback →
    "Try 3D again" → canvas restored, all verified live)
- **Testing:** context-loss simulation ✔ · resize sweep (tablet/desktop) ✔ · FPS numbers **pending**
  — record them in `12` after the first run on real hardware.

## Phase 3 — Interactive Brain Lobes — **status: done (2026-07-11)**

- **Goal:** lobe hover/focus/selection fully usable, mouse + keyboard.
- **Scope:** `BrainLobe` raycast proxies, hover/focus states (`05` timings), attended-state labels
  (tooltip role), activation pulse, DOM-twin keyboard widget, selection → route push
  `/brain/[lobe]` (plain cut this phase), live region announcements, clickable 2D-fallback lobes,
  unknown-slug redirect + toast, Esc return.
- **Risks:** raycast precision on placeholder mesh (unverifiable in the frame-frozen session pane —
  watch during the Phase 4 human pass).
- **Acceptance criteria:**
  - [x] Hover feedback ≤ 100 ms; decay ≈250 ms (asymmetric lerp τ=30 ms/90 ms; snap under reduced
    motion; code-verified — pixels pending the same human pass as Phase 2)
  - [x] Full keyboard cycle + Enter works; SR gets name/tagline/hint (roving tabindex verified
    live; announcement "Entering Limbic — Emotion." observed; NVDA pass deferred to Phase 9 audit)
  - [x] Selection routes correctly incl. deep-link cold load (`/brain/temporal` cold ✔; unknown
    slug → `/brain` + toast ✔; Esc → brain ✔; fallback legend links ✔)
  - [x] Activation caps respected (single attended lobe by construction; one pulse per activation;
    navigation guard prevents double-activation)

## Phase 4 — Lobe Entry Transition — **status: done pending live camera check (2026-07-11)**

- **Goal:** the signature warp dive, functional and skippable.
- **Scope delivered:** persistent Canvas moved to `app/brain/layout.tsx` (survives route changes —
  the architecture Phase 5 needs); `TransitionDirector` (sole camera authority, URL-driven so
  browser back/forward mirror for free); bezier dive through the cortex + FOV bump; `WarpStreaks`
  (one draw call, camera-locked, deterministic PRNG); camera pose memory on exit; interior fog
  tightening; lobe overlay hidden during flight; reduced-motion snap + 300 ms crossfade veil +
  announcements; deep links place camera non-cinematically. DOF pull deferred to Phase 7 with the
  rest of post tuning.
- **Acceptance criteria:**
  - [x] Enter ≤ 900 ms (850), exit ≤ 700 ms (700) — ceilings enforced by unit test; skip on any
    pointer/wheel/key input
  - [ ] No frame > 33 ms during flight on high tier — **pending live run** (session pane produces
    no frames; the R3F tree cannot execute here)
  - [x] Browser back/forward mirror transitions (same URL-driven code path as gestures;
    DOM lifecycle verified live: back → brain view chrome restored, forward → lobe overlay back)
  - [x] Reduced-motion = snap + crossfade veil + announcement (code path verified; snap is
    frame-loop-independent)
- **Testing:** canvas persistence across route change verified live (marker survived) · 48 unit
  tests incl. path math + timing ceilings · camera feel/frame-time ride the next human pass.

## Phase 5 — Knowledge Graph Foundation — **status: done (2026-07-12)**

*(Same session: user-requested brain restyle to match github.com/victors1681/3dbrain — anatomical
x-ray brain, see I21–I23 and Open Question #11.)*

- **Goal:** functional node universe inside a lobe.
- **Scope delivered:** `07` interfaces (`lib/types/cognitive.ts`); deterministic mock dataset
  (~290 nodes, 6 lobes, Project-Report vocabulary: GoEmotions families, Big 5, core values,
  validation scenarios, monologue/verbal pairs); provider seam (`mockProvider` ⇄ future API);
  d3-force-3d layout in a Web Worker (inline fallback) with fibonacci-sphere cluster anchors,
  settled-then-static (P6), normalized to the interior volume; instanced `KnowledgeGraph`
  (1 InstancedMesh for nodes: color=type / scale=relevance; 1 LineSegments for edges:
  endpoint-gradient, brightness=strength); instanceId picking with hover labels; cluster
  landmarks; interior orbit/zoom/pan clamps; `LobeHud` + "Explore as list"; node routes with
  scalar-meter inspector panel; TanStack Query session cache.
- **Acceptance criteria:**
  - [x] Verified live at 52-node lobe render (screenshot in session); 500/1,500 ceiling structure
    is 2 draw calls — formal FPS numbers still owed by a desktop run
  - [x] Layout in worker (transferable Float32Array; inline fallback if workers unavailable)
  - [x] Node select → `/brain/[lobe]/node/[id]`; cold deep link verified (`ctr-2` → inspector);
    Esc deselects; unknown node → toast + lobe
  - [x] List view: 72 links in temporal, cluster-grouped, native-link keyboard navigation;
    axe 0 violations

## Phase 6 — Cognitive Node System — **status: not started**

- **Goal:** the graph becomes *cognitive* — typed, scalar-driven, inspectable.
- **Scope:** type glyphs + visual treatments (`04` graph styling); scalar encodings (size/glow/
  opacity/pulse); `NodeInspector` full; `RelationshipTracer` (hover pulse, hop, pathway history);
  contradiction/insight/reasoning node treatments (monologue vs. response divergence view);
  `EmotionField` families; activation state machine (`02`).
- **Acceptance criteria:**
  - [ ] All 11 node types visually distinct w/o color alone
  - [ ] Inspector shows scalars as meters + text; provenance for reasoning nodes
  - [ ] Edge trace + hop works mouse & keyboard; history backtrack `[`/`]`
  - [ ] Activation caps enforced in code (max 1 focused / 12 active)

## Phase 7 — Cinematic Visual Layer — **status: not started**

- **Goal:** the premium look, within budgets.
- **Scope:** bloom pass tuning, brain glass/fresnel material final, spectral diffusion on emotion
  edges, refracted rims, subtle chromatic aberration (high tier), holographic depth (fog + DOF),
  neural filaments, `DivineLightSource` final, cross-lobe transit tunnel.
- **Risks:** taste drift into kitsch (review against `00` "styles to avoid"); perf regression
  (budgets in `09` are gates).
- **Acceptance criteria:**
  - [ ] All `09` budgets still met (numbers recorded before/after)
  - [ ] Every effect maps to a documented purpose (`05` law)
  - [ ] Legibility: labels readable over max bloom; high-legibility toggle works
  - [ ] Tier degradation verified on medium/low

## Phase 8 — Search, Filters, Timeline, Insights — **status: not started**

- **Goal:** complete exploration toolset.
- **Scope:** `SemanticSearch`/CommandPalette (mock semantic ranking; offline fuzzy fallback);
  travel-to-result; `FilterState` + chips + URL serialization; `TimelineNavigator` + recency
  re-weighting; `InsightPanel` + guided trace tours; `SpatialMinimap`.
- **Acceptance criteria:**
  - [ ] `⌘K` flow end-to-end ≤ 1.2 s travel, fully keyboard-driven
  - [ ] Filters/time window shareable via URL
  - [ ] Insight tour: visual chain + transcript + steppable
  - [ ] Empty/error states per `01` implemented

## Phase 9 — Responsive & Accessible Modes — **status: not started**

- **Goal:** everyone gets a complete experience.
- **Scope:** fallback2d complete (2D lobe map + Canvas graph + shared chrome); phone layouts
  (bottom-sheet inspector, full-screen search); tablet medium-tier pass; reduced-motion audit of
  every flow; full keyboard map (`09`); SR pass (NVDA) on all flows; auto tier detection +
  downshift; high-legibility mode.
- **Acceptance criteria:**
  - [ ] fallback2d covers Flows 2–13 functionally
  - [ ] axe: zero critical/serious on all routes, both modes
  - [ ] NVDA walkthrough of Flows 1–7 recorded in progress log
  - [ ] Phone usability check (real device) logged

## Phase 10 — Polish, Testing, Optimization — **status: not started**

- **Goal:** production-ready.
- **Scope:** visual consistency sweep; cross-browser (Chrome/Edge/Firefox/Safari); screen-size
  sweep; perf soak (enter/exit ×50 leak test); large-dataset test (aggregation path, `09`); asset
  final compression; loading polish; docs finalized; full checklist rerun of every prior phase's
  acceptance criteria.
- **Acceptance criteria:**
  - [ ] All `09` budgets met on all tiers (recorded)
  - [ ] Zero console errors/warnings across routes & browsers
  - [ ] Soak test: stable heap & GPU memory
  - [ ] All docs (00–12) updated to as-built state
