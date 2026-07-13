# 06 — Component Architecture

> Status: Phase 0 proposal. Greenfield — no components exist yet. Naming assumes React + TypeScript +
> React Three Fiber (see `08`). Convention: R3F scene components live under `components/scene/`,
> DOM chrome under `components/chrome/`, shared primitives under `components/ui/`.
> Guiding rules: small and focused (Working Rules 13–14, 17); rendering logic never owns product
> data — data flows in via props/stores.

## Layer map

```
app routes (Next.js)
└── SceneRoot (Canvas, renderer config, perf tier)         [3D]
    ├── BrainScene                    — /brain composition
    │   ├── DivineLightSource
    │   ├── BrainModel
    │   │   └── BrainLobe ×6 (+ LobeLabel, LobeTooltip)
    │   ├── NeuralPulse (ambient system)
    │   └── ParticleField
    ├── LobeScene                     — /brain/[lobe] composition
    │   ├── KnowledgeGraph (GraphNode, GraphEdge, MemoryCluster, EmotionField)
    │   ├── RelationshipTracer
    │   └── ParticleField (reused)
    └── TransitionDirector            — owns warp/exit/travel choreography
DOM chrome (parallel tree)
    ├── CognitiveNavigation (breadcrumb + mode controls)
    ├── NodeInspector · InsightPanel · TimelineNavigator
    ├── SemanticSearch / CommandPalette · SpatialMinimap
    ├── LoadingExperience · ReducedMotionFallback (2D graph mode)
    └── ui/ primitives (GlassPanel, Meter, Chip, Kbd, Toast…)
```

## Scene components

### `SceneRoot`
- **Responsibility:** single R3F `<Canvas>`; renderer setup, color management, post-processing chain,
  perf-tier context, WebGL-loss recovery.
- **Props:** `tier: PerfTier`, `reducedMotion: boolean`, `children`.
- **State:** none (context provider only). **Events:** `onContextLost/Restored`.
- **Perf:** owns frameloop mode (`demand` on idle brain view, `always` during transitions).
- **A11y:** hosts the visually-hidden live region that scene events announce into.
- **Mobile:** may render nothing — parent decides tier and can mount the 2D fallback instead.

### `BrainScene`
- **Responsibility:** compose brain view: model, light, pulses, particles, orbit controls (clamped).
- **Props:** `lobes: LobeSummary[]`, `activity: ActivitySnapshot`, callbacks `onLobeEnter(lobeId)`.
- **State:** hovered/focused lobe (local); everything routable lives in the store.
- **Perf:** static scene → on-demand frames when idle.

### `BrainModel`
- **Responsibility:** load/instantiate the brain asset (GLB, DRACO-compressed); expose per-lobe
  meshes; glass/emissive material config.
- **Props:** `onReady`, `materialOverrides?`. **State:** load status.
- **Perf:** model ≤ 3 MB compressed budget; single material with per-lobe uniforms, not 6 materials.
- **Note (Phase 2):** starts as a stylized placeholder (see `11` open question on final asset).

### `BrainLobe`
- **Responsibility:** interaction proxy per lobe — raycast target, hover/focus/selected state,
  emissive drive, activation pulse.
- **Props:** `lobe: Lobe`, `state: LobeVisualState`, `onHover/onFocus/onSelect`.
- **Events:** pointer + synthetic keyboard focus (from the a11y ring — see `09`).
- **A11y:** each lobe mirrored by an offscreen focusable element (name, summary, node count).

### `LobeLabel` / `LobeTooltip`
- Billboard label (SDF text) + DOM-projected tooltip (name, one-liner, counts). Tooltip content is
  the same string given to `aria-describedby`. Small, dumb, reusable for cluster labels.

### `DivineLightSource`
- **Responsibility:** the key light + visible halo/god-ray backplate behind the brain (the video's
  sun-reveal beat). Purely presentational; intensity may track global activity.
- **Perf:** fake rays (billboard shader), not volumetric raymarching, except on high tier.

### `NeuralPulse`
- **Responsibility:** ambient + on-demand pulses along precomputed paths (cortical or graph edges).
- **Props:** `paths`, `rate`, `burst(pathId)` imperative handle. Instanced; shared by both scenes.

### `ParticleField`
- **Responsibility:** ambient dust + transition warp bursts from one pooled instanced buffer.
- **Props:** `mode: 'ambient' | 'warp'`, `density` (tier-derived), `attractor?: Vec3`.
- **Perf:** hard caps from `04`; zero allocation at runtime.

### `KnowledgeGraph`
- **Responsibility:** render the lobe's node universe: layout results → instanced nodes + edge
  curves; frustum/LOD management; picking.
- **Props:** `graph: LobeGraph`, `selection`, `filters`, `timeWindow`, `onNodeFocus/Select`,
  `onEdgeTrace`.
- **State:** none product-level (all in store); internal spatial index (octree) for picking.
- **Perf:** the app's hot spot — instancing mandatory; layout computed in a worker (see `08`);
  target 500 visible nodes / 1,500 edges at high tier (see `09`).
- **A11y:** emits the ordered node list consumed by the "Explore as list" fallback.

### `GraphNode` / `GraphEdge`
- Logical components (write into instanced buffers, do not mount meshes per node). `GraphNode`
  computes visual attributes from scalars (size ∝ relevance, glow ∝ intensity, opacity ∝ confidence);
  `GraphEdge` builds curve + width/brightness ∝ strength, gradient endpoint hues.

### `MemoryCluster`
- Cluster hull fog tint + label + "frame cluster" interaction. Props: `cluster`, `onFrame`.

### `EmotionField`
- Limbic-only layer arranging emotion families and driving spectral-diffusion shading on
  emotion-linked edges (Flow 12). Props: `families`, `selection`.

### `RelationshipTracer`
- **Responsibility:** directional edge pulses, path-chain playback for insight tours, pathway
  history recording.
- **Props:** `trace: TraceRequest | null`, `onStep`, `onDone`. Imperative `play/pause/step`.
- **A11y:** every step mirrored to the live region + transcript panel.

### `TransitionDirector`
- **Responsibility:** owns all camera choreography (enter/exit lobe, cross-lobe transit, search
  travel); coordinates route timing, particle bursts, and skippability. One authority — components
  request transitions, never drive the camera themselves.
- **Props:** none (store-driven). **State:** active transition, progress, skip flag.
- **Perf:** pre-warms pools; downshifts post-processing during flight.

## Chrome components (DOM)

### `CognitiveNavigation`
- Breadcrumb + contextual mode controls; the "where am I / how do I get back" instrument.
- Props: `path: BreadcrumbSegment[]`. A11y: `nav` landmark, keyboard operable.

### `NodeInspector`
- Right glass panel: identity, type badge, scalar meters, relationship list, provenance, actions
  (trace, pin, open-in-timeline). Props: `node: CognitiveNodeDetail`, `onTrace`, `onHop`, `onClose`.
- A11y: complementary landmark; focus managed in/out; meters as real `<meter>` elements.

### `TimelineNavigator`
- Bottom drawer: density band, playhead, window handles, play/pause. Props: `range`, `window`,
  `density`, `onWindowChange`. A11y: slider semantics with date announcements.

### `SemanticSearch` (`CommandPalette`)
- `⌘K` overlay: combobox, grouped results, recents; also exposes commands ("Go to Limbic",
  "Toggle reduced motion"). Props: `onTravel(nodeRef)`. A11y: combobox pattern, the primary
  keyboard navigation surface.

### `SpatialMinimap`
- Miniature brain + current lobe highlight + camera frustum hint; click = exit-to-brain shortcut.
- Renders from the same lobe geometry, static thumbnail per lobe (not a second live 3D view).

### `InsightPanel`
- Insight cards + "Trace" launcher; transcript view during tours. Props: `insights`, `onTrace`.

### `LoadingExperience`
- Awakening sequence wrapper: drives particle assembly from real load progress; skip affordance;
  RM/2D variants. Props: `progress`, `onEnter`.

### `ReducedMotionFallback` (2D graph mode)
- Complete non-WebGL experience: SVG/Canvas 2D lobe map + 2D force graph + the same chrome
  components (inspector, search, timeline are shared — they are DOM already). See `09`.

## Shared `ui/` primitives

`GlassPanel`, `Meter`, `Chip` (filter toggles), `Kbd`, `Toast`, `EmptyState`, `VisuallyHidden`,
`FocusRing`. Built in Phase 1; everything above composes them.

## Cross-cutting contracts

- **No god components:** scene compositions (`BrainScene`, `LobeScene`) stay under ~150 lines by
  delegating to the systems above.
- **Data in, events out:** scene components never fetch; hooks/stores do (see `07`).
- **Every interactive scene element has a DOM twin** (offscreen focusable or list item) — the
  accessibility tree is built from data, not from WebGL.
