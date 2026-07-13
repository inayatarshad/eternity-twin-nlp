# 08 — Technical Approach

> Status: Phase 0 proposal. **No dependencies are installed yet — nothing here is added until the
> plan is approved** (Working Rule 12 / prompt constraint). The repository currently contains zero
> code; the only stack signal is `Project-Report.md` stating the prior MVP dashboard used
> **Next.js + Tailwind CSS + Vercel** — matching that stack maximizes reuse of team knowledge and
> any salvageable MVP code (Open Question #1: obtain that repo).

## Summary of recommendations

| Concern | Recommendation | Runner-up |
|---|---|---|
| App framework | **Next.js (App Router) + TypeScript (strict)** | Vite + React Router |
| Styling | **Tailwind CSS v4 + CSS custom-property tokens** | vanilla-extract |
| 3D | **Three.js via React Three Fiber (@react-three/fiber + drei)** | Spline, Babylon.js |
| Post-processing | **@react-three/postprocessing (pmndrs)** | custom EffectComposer |
| Brain asset | **Blender-authored GLB, DRACO-compressed, lobe-segmented** | procedural geometry |
| Graph rendering | **Custom instanced rendering inside the R3F scene** | react-force-graph-3d |
| Graph layout | **d3-force-3d in a Web Worker (precomputed, then static)** | ngraph.forcelayout |
| 2D fallback graph | **d3-force + Canvas 2D** | Sigma.js |
| Animation (DOM) | **Framer Motion (motion)** | GSAP |
| Animation (scene) | **springs/lerp in useFrame + maath; TransitionDirector owns choreography** | theatre.js |
| State | **Zustand (slices) + URL as source of truth** | Jotai, Redux Toolkit |
| Data fetching | **TanStack Query over a provider interface (mock ⇄ FastAPI)** | SWR |

## 3D brain rendering

**Chosen: Three.js via React Three Fiber.**
- *Why:* declarative scene graph fits React routing/state; pmndrs ecosystem (drei, postprocessing)
  covers 80% of needs (GLTF+DRACO loading, SDF text, instances, effects); largest community; full
  shader access for the glass/emissive brain material.
- *Rejected — raw Three.js:* imperative lifecycle duplicates what React already manages; more code
  for the same result.
- *Rejected — Spline:* fastest to a pretty brain, but runtime is a black box — no instanced graph,
  weak a11y hooks, licensing/runtime weight; fails Phases 5–7.
- *Rejected — Babylon.js:* capable, but weaker React integration and smaller effect ecosystem here.
- *Performance:* R3F adds negligible overhead when using instancing and `frameloop="demand"` idle.
- *Compatibility:* WebGL2 baseline (all evergreen browsers); WebGPU not required.
- *Accessibility impact:* canvas is opaque to AT — mitigated by the DOM-twin pattern (`06`, `09`).
- *Maintenance:* mainstream, well-documented, hireable.

**Brain asset: Blender-exported GLB** with named per-lobe meshes (raycast targets need mesh
separation), DRACO ≤ 3 MB. Procedural fallback (icosphere-based stylized form) acceptable for
Phase 2 placeholder. Open Question #6: who authors the final asset.

## Shader effects & post-processing

- Single `EffectComposer` chain: **Bloom (threshold ≥1), DepthOfField (transitions only), Vignette,
  ChromaticAberration (edges, subtle, high tier only)** — all from @react-three/postprocessing.
- Custom shaders limited to: brain glass material (fresnel rim + refraction approximation), synaptic
  pulse lines, node/edge instanced materials, warp particles. No raymarched volumetrics in v1 —
  "volumetric" looks come from billboards + fog + bloom (budget rationale in `04`, `09`).

## Particle systems

Instanced `Points`/quad buffers with all animation in vertex shaders (time + attractor uniforms).
No CPU per-particle physics, no allocation after boot (pooled). Caps per tier in `04`/`09`.
*Rejected — three-nebula / GPU compute libs:* more capability than needed, extra dependency risk.

## Graph rendering

**Chosen: custom instanced nodes/edges inside the same R3F scene.**
- *Why:* the lobe interior *is* the scene — one renderer, one camera, one picking system, one
  post chain; lets node visuals encode scalars exactly as `04` specifies; 500 nodes/1.5k edges is
  trivial for instancing.
- *Rejected — react-force-graph-3d (3d-force-graph):* fast start, but owns its own renderer/camera —
  can't live inside our scene or share transitions; styling ceiling.
- *Rejected — Sigma.js / Cytoscape:* 2D-oriented; excellent for the **fallback**, wrong for the
  immersive view. (Sigma or d3+Canvas is the fallback pick — decide in Phase 9.)
- *Rejected — SVG graph:* DOM cost explodes past ~200 nodes; no depth.

**Layout: d3-force-3d in a Web Worker.** Simulate off-thread at lobe load (with cluster gravity
wells), stream positions once settled, then keep the layout static (stability aids spatial memory;
matches "constellation" metaphor). *Rejected — live simulation on main thread:* jank + drifting
landmarks. *Rejected — ngraph:* fine, but d3-force-3d's API and docs fit better.

## Animation libraries

- **DOM chrome:** Framer Motion — panels, palette, chips; respects `useReducedMotion` natively.
- **Scene:** no tween library — `useFrame` lerps/springs (maath helpers) driven by
  `TransitionDirector`; camera choreography is bespoke anyway.
- *Rejected — GSAP everywhere:* powerful but overlaps both layers, license weight, two animation
  vocabularies to maintain. *Rejected — theatre.js:* authoring tool value real, but heavy for v1.

## State management

**Zustand slices** (`navigation`, `camera`, `filters`, `search`, `animation`, `loading` — shapes in
`07`) + **URL as source of truth** for shareable state. TanStack Query for server data with the
mock/api provider seam.
- *Why:* transient 60 fps state (camera, activation) needs subscription granularity without
  re-render storms; Zustand's `subscribe` + refs integrate cleanly with `useFrame`.
- *Rejected — Redux Toolkit:* ceremony without benefit here. *Rejected — React context alone:*
  re-render behavior is wrong for frame-rate state.

## Performance strategy (headlines — details in `09`)

Perf tiers (high/medium/low/fallback2d) detected at boot (GPU heuristic + `deviceMemory` +
user override); instancing everywhere; `frameloop="demand"` when idle; workers for layout;
DRACO/KTX2 assets; route-level code splitting (3D bundles never block chrome); glow/particle caps.

## Mobile & fallback

- Tablet: full 3D at medium tier.
- Phone: **2D mode by default** (lobe map + Canvas graph + same chrome), 3D opt-in on capable
  devices. This is a product proposal — Open Question #5.
- No WebGL / context loss: fallback2d automatically (`09`).

## Browser compatibility

Evergreen Chrome/Edge/Firefox/Safari (last 2). WebGL2 required for 3D path; `backdrop-filter`
has a solid-surface fallback (`04`). No IE-era considerations.

## Dependency list awaiting approval

`next react react-dom typescript tailwindcss framer-motion zustand @tanstack/react-query
three @react-three/fiber @react-three/drei @react-three/postprocessing d3-force-3d maath lucide-react`
(+ dev: eslint, prettier, vitest + @testing-library/react, playwright). Nothing installed until
the plan is approved.
