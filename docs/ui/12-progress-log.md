# 12 — Progress Log

> Chronological. One entry per development session (Working Rule 8).

---

## 2026-07-11 — Phase 0: Discovery & Audit

**Phase:** 0 — Discovery & Audit

**Work completed:**
- Full repository audit. Finding: **greenfield** — no application code, no `package.json`, no
  styling system, no routes, no assets beyond references. Contents before this session:
  `Project-Report.md` + `system design/` (2 images, 1 video).
- Studied `Project-Report.md` (Eternity Twin v1.0): RoBERTa/GoEmotions emotion pipeline (28 labels),
  Persona Specification Schema (Big 5, core values, baseline, backstory), Qwen2.5-1.5B response
  engine with fixed JSON output, FastAPI backend, and a previously built Next.js MVP dashboard
  that is **not** in this repo.
- Reviewed reference imagery: `chromatic aberation.jpg` (spectral refraction language),
  `data_points kinda image.jpg` (neural-filament/cosmic-web graph language).
- Extracted and reviewed 5 frames from `hand_focuses into the brain.mp4` (9 s, 720×1280, 30 fps):
  hand-reach → particle warp dive → cosmic-scale reveal. Adopted as the master reference for the
  lobe-entry transition.
- Authored the complete planning corpus `docs/ui/00–12` (13 files).

**Files changed:** created `docs/ui/00-ui-vision.md` … `12-progress-log.md`.

**Decisions made:** recorded as C1–C7 (confirmed) and P1–P8 (proposed, awaiting approval) in
`11-decisions-and-open-questions.md`. No dependencies installed.

**Problems encountered:**
- No prior context in the Twin Brain vault for this project (no wiki page; log has no entries).
- `ffmpeg` unavailable on this machine; used Python + OpenCV (5.0.0 via `py` launcher) for video
  frame extraction instead.
- The brief references an "existing codebase / UI components / routes" — none exist in this
  directory. Docs written as greenfield proposals; raised as Open Question #1 (locate prior MVP repo).

**Tests performed:** none applicable (documentation-only phase).

**Remaining tasks:** none for Phase 0.

**Next recommended step:** review the open questions (especially #1 backend/MVP repo, #5 phone
strategy, and the dependency approval list in `08`), then begin **Phase 1 — Foundation & Design
Tokens** once the plan is approved.

---

## 2026-07-11 — Phase 1: Foundation & Design Tokens

**Phase:** 1 — Foundation & Design Tokens (plan approved by user this session)

**Work completed:**
- Manual Next.js scaffold (dir wasn't empty, so no `create-next-app`): Next 16.2 (Turbopack),
  React 19.2, TypeScript 6 strict (+`noUncheckedIndexedAccess`), Tailwind CSS 4.3 via
  `@tailwindcss/postcss`, ESLint 9 (Next flat configs), Vitest 4, Zustand 5, Framer Motion 12,
  Lucide. Fonts self-hosted via `next/font`: Inter, Instrument Serif, JetBrains Mono.
- Full token system in `styles/globals.css` `@theme` (colors, radius, easings, shadows) +
  `:root` (glass, glow tiers, z strata, durations, dim floor) mirrored canonically in
  `lib/tokens/colors.ts`.
- Primitives: GlassPanel, Meter (role="meter"), Chip (aria-pressed), Kbd, Toast
  (provider + polite region), EmptyState, VisuallyHidden; focus ring is global CSS.
- Preference system: `lib/state/animation.ts` (Zustand + persist) → `ClientPreferences` stamps
  `data-reduced-motion` / `data-perf-tier` / `data-legibility` on `<html>`; CSS honors override
  and OS `prefers-reduced-motion`.
- Pages: `/` placeholder home, `/settings` (motion / perf tier / high legibility),
  `/dev/tokens` calibration gallery with live WCAG contrast table.
- Tests: `tests/contrast.test.ts` — 29 assertions (AA for 9 text/surface pairs, 3:1 for semantic
  glyphs, CSS↔TS token sync).

**Files changed:** scaffold configs; `styles/globals.css`; `app/{layout,page}.tsx`,
`app/settings/page.tsx`, `app/dev/tokens/page.tsx`; `components/ui/*` (7), `components/ClientPreferences.tsx`;
`lib/{cn,tokens/colors,tokens/contrast,state/animation}.ts`; `tests/contrast.test.ts`;
`.claude/launch.json`; docs 04/10/11 updated.

**Decisions made:** I1–I6 in `11-decisions-and-open-questions.md` (Instrument Serif; div-based
meter; never-transition focus ring; muted #757e9f calibration; muted banned on tinted surfaces;
native flat ESLint config).

**Problems encountered:**
- `text-muted` proposal failed AA by measurement (4.34:1) — recalibrated, caught by tests.
- Focus ring faded in via Tailwind `transition-colors` (includes `outline-color`) — fixed with a
  global outline-color pre-set (I3).
- axe: 2 violations (`aria-label` on bare div; muted-on-tinted-surface contrast) — both fixed,
  re-audit clean on all 3 routes.
- Session's embedded browser rendered zero animation frames (rAF probe: 0 ticks/500 ms) —
  screenshots impossible; all verification done via DOM/computed styles/axe. **On-screen visual
  calibration of the palette still needs a human pass over `/dev/tokens`.**
- Turbopack served stale CSS across a server restart — cleared `.next` to recover.
- Non-fatal `patchIncorrectLockfile` JSON warning during build (our lockfile validates fine).

**Tests performed:** vitest 29/29 pass · `tsc --noEmit` clean · `eslint .` clean · production
build clean (4 static routes) · axe 0 violations on `/`, `/settings`, `/dev/tokens` ·
keyboard focus ring verified (2px solid #fff, offset 2px, instant) · reduced-motion toggle
persists across reload · chip/toast/meter functional checks.

**Remaining tasks:** human visual pass over `/dev/tokens` (hues under real rendering).

**Next recommended step:** **Phase 2 — Static Brain Experience** (install the approved R3F stack;
placeholder brain, light source, starfield, ambient particles, loading experience).

---

## 2026-07-11 — Phase 2: Static Brain Experience

**Phase:** 2 — Static Brain Experience (user approved continuing)

**Work completed:**
- Installed the 3D stack: three, @react-three/fiber 9, @react-three/drei, @react-three/postprocessing, maath (+ @types/three).
- Procedural placeholder brain: `lib/lobes.ts` (six lobe definitions with anatomy-ish positions),
  `lib/scene/noise.ts` (value noise + fbm for cortical lumpiness), fresnel hologram shader
  (`hologramMaterial.ts` — additive, depthWrite off), `BrainModel` (5 cortical lobes, bilateral
  temporal, golden core nucleus with interior point light + halo shell).
- Scene systems: `DivineLightSource` (procedural radial halo sprite + key/hemisphere lights),
  `ParticleField` (drei Sparkles, tier-capped counts, freezes under reduced motion), `LobeLabel`
  (screen-space Html labels: name + tagline), `BrainScene` (fog, Stars backplate, breathing
  ±1.2%/6s gated by reduced motion, clamped OrbitControls with slow auto-rotate), `SceneRoot`
  (Canvas config, tier resolution, bloom+vignette at high tier, context-loss → fallback with
  "Try 3D again").
- Chrome: `LoadingExperience` v1 (readiness-driven veil, Skip after 1.5 s, reduced-motion aware),
  `Fallback2D` (SVG lobe map + lobe legend), `/brain` route with minimal header chrome and orbit
  hint; home page now links "Enter the brain".
- `lib/scene/perf.ts`: pure `resolveTier` (override wins; heuristics: WebGL2, software renderer,
  coarse pointer/viewport, deviceMemory) + `detectDeviceCaps`; 9 new unit tests (38 total).

**Decisions made:** I7–I11 in `11-decisions-and-open-questions.md`.

**Problems encountered:**
- Loading veil never lifted in fallback2d mode (no WebGL first frame to report) — fixed: SceneRoot
  reports readiness immediately when presenting the fallback (I11). Found by live verification.
- The session's embedded browser still renders zero animation frames: the R3F loop cannot tick, so
  in-pane visual/FPS verification of the 3D scene is impossible. Canvas + WebGL2 context mount
  cleanly with zero console errors; 2D fallback fully verified in-pane.

**Tests performed:** vitest 38/38 · eslint clean · tsc clean · production build clean (5 routes) ·
/brain mounts with live WebGL2 context, no console errors · fallback2d path renders 6-lobe SVG map
+ legend with canvas correctly absent · loading veil releases pointer events on readiness.

**Verification completed after the outage cleared:**
- Context-loss listener refactored to attach to the canvas DOM node directly (was inside R3F
  `onCreated`, which never fires without a render loop — a real robustness gap, not just an
  environment quirk). Then verified live: `loseContext()` → 2D fallback + "3D rendering was
  interrupted / Try 3D again" → click → canvas remounts, fallback gone.
- Resize sweep: tablet (768×1024) and desktop — canvas mounts, header chrome intact, no
  horizontal overflow. Zero console errors throughout.
- Gates re-run after refactor: 38/38 tests, lint, tsc, build all clean.
- Real-Chrome pass unavailable (extension not connected) → FPS + on-screen composition remain
  **pending a human run of http://localhost:3000/brain**; record numbers here.

**Remaining tasks (verification):** human visual/FPS sign-off on real hardware — user accepted
("no thats fine, proceed"); FPS numbers still welcome whenever a real run happens.

**Next recommended step:** Phase 3 — Interactive Brain Lobes.

---

## 2026-07-11 — Phase 3: Interactive Brain Lobes

**Phase:** 3 — Interactive Brain Lobes

**Work completed:**
- `BrainLobe` component: per-lobe raycast target (nearest-hit + stopPropagation) with
  attention-driven emissive state — one asymmetric lerp (attack τ 30 ms, decay τ 90 ms → settles
  ≤250 ms; snaps under reduced motion); states idle / attended ×1.35 / dimmed ×0.85; activation
  flash (×2.4 boost decaying through the same lerp). Core nucleus interactive too. Cursor pointer
  on hover.
- `BrainModel` thinned to composition; `BrainScene` wires attention/pulse state; auto-rotate
  pauses while a lobe is attended. `LobeLabel` now attention-reactive: idle quiet, attended
  bright + tagline + "press Enter to explore", dimmed recedes.
- `LobeProxyList`: DOM twin — one tab stop, roving tabindex over six sr-only buttons with full
  accessible names (name, tagline, hint); Arrow/Home/End cycling; focus/blur drive the same
  attended state as mouse hover.
- `/brain/[lobe]` route: breadcrumb (Brain ▸ lobe), lobe-accent theming, "No memories have formed
  here yet" empty state, Esc → `/brain`, unknown slug → redirect + toast. Deep links cold-load.
- Fallback2D: legend rows are now links; SVG lobes clickable (pointer shortcut; legend is the
  accessible path).
- Brain page: single `attended` state (cap guaranteed), pulse counter, navigation guard against
  double-activation, polite live-region announcements ("Entering Limbic — Emotion.").

**Decisions made:** I12–I15 in `11-decisions-and-open-questions.md`, including scoping the
`react-hooks/immutability` lint rule off for `components/scene/**` (R3F imperative mutation is
by design).

**Problems encountered:**
- React Compiler lint rules rejected the standard R3F useFrame-mutation pattern → scoped rule
  disable (I12) rather than contorting scene code.
- drei `Html` labels never mount in the session's frame-frozen browser pane (portal mounts on
  first frame) — label reactivity verified structurally in code; on-screen check rides with the
  Phase 2 visual pass. First on-demand compile of the dynamic route made the first navigation
  look stalled (~2 s) — dev-only artifact.

**Tests performed:** vitest 39/39 · lint/tsc/build clean (`/brain/[lobe]` dynamic route) · live:
keyboard focus → ArrowRight roving → Enter → announcement → landed `/brain/limbic` with
breadcrumb/empty state · Esc → `/brain` · deep link `/brain/temporal` cold ✔ · `/brain/amygdala`
→ redirect + "That region of the mind could not be found." toast ✔ · fallback2d: 6 legend links,
parietal click → `/brain/parietal` ✔ · axe 0 violations on lobe page · zero console errors.

**Remaining tasks:** none blocking; raycast feel + hover visuals ride the next human pass.

**Next recommended step:** Phase 4 — Lobe Entry Transition (TransitionDirector, warp dive,
camera pose memory, reduced-motion crossfade).

---

## 2026-07-11 — Phase 4: Lobe Entry Transition

**Phase:** 4 — Lobe Entry Transition (user: "move")

**Work completed:**
- **Persistent scene shell:** Canvas relocated to `app/brain/layout.tsx`; `/brain` and
  `/brain/[lobe]` render as DOM overlays above it. Scene state moved to `lib/state/scene.ts`
  (view, attended, pulse, transition, savedBrainPose, announcement) — URL remains the source of
  truth (layout derives `view` from pathname).
- **`TransitionDirector`:** sole camera authority. Reacts to view changes (so gestures, Esc,
  breadcrumb, and browser back/forward all share one path): enter = quadratic bezier from current
  orbit pose through a cortex waypoint to the lobe interior (850 ms) with +14° FOV bump; exit =
  reverse to the *saved* orbit pose (700 ms, +6°). Any pointer/wheel/key input skips. Reduced
  motion snaps + announces; layout adds a 300 ms crossfade veil. Deep links snap non-cinematically.
  Controls disabled during flight and while interior; re-enabled + retargeted on return.
- **`WarpStreaks`:** 240 camera-locked line segments, one draw call, deterministic PRNG,
  sine-envelope opacity, z-stretch with progress; mounted only during transitions; lobe-colored.
- BrainScene: fog lerps tight (2.5/9) inside a lobe; labels only at brain view; auto-rotate also
  pauses during transitions. BrainLobe ignores pointer events when not at brain view.
- Lobe overlay page restyled as a floating glass panel that hides during flight and fades in on
  arrival; works standalone in fallback2d (layout passes no map on lobe routes).
- `lib/scene/cameraPaths.ts` pure math + `tests/cameraPaths.test.ts` (10 tests) including
  executable ceilings ENTER ≤900 ms / EXIT ≤700 ms and the core-lobe degenerate-direction case.

**Decisions made:** I16–I20.

**Problems encountered:**
- Stale `.next/dev/types` broke typecheck after adding the layout — cleared, regenerated.
- React Compiler lint: ref-write-during-render (moved into an effect, which also properly handles
  late-registering OrbitControls) and Math.random-in-render (replaced with seeded mulberry32 —
  streaks now stable across remounts). Both fixed properly, no suppressions.
- The session pane's R3F tree never commits (no frames), so the director cannot execute in-pane:
  camera flight, skip, pose memory, and arrival announcements are covered by unit tests + code
  review only until a live run.

**Tests performed:** vitest 48/48 · lint/tsc/build clean · live: canvas element persisted across
/brain → /brain/limbic navigation (marker survived) · overlay/proxies/hint mount-unmount correct
across back/forward · reduced-motion navigation lands with overlay visible · axe previously clean
on both routes (structure unchanged since).

**Remaining tasks:** live camera feel + frame-time check on real hardware (rides the standing
human pass with Phases 2–3 visuals).

**Next recommended step:** Phase 5 — Knowledge Graph Foundation (mock cognitive dataset,
d3-force-3d worker layout, instanced nodes/edges inside the lobe interior).

---

## 2026-07-12 — Brain restyle (user request) + Phase 5: Knowledge Graph Foundation

**Phase:** brain restyle + 5 (user: "move to the next phase, also… make the brain model just like
[github.com/victors1681/3dbrain]")

**Brain restyle:**
- Studied the repo (Loaders/MainBrain/particlesSystem + xRay shaders): anatomical OBJ + fresnel
  x-ray ShaderMaterial (c 0.9, p 6.7, glow #84ccff, additive, DoubleSide, depthWrite off) +
  flashing particles. Vendored `brain-parts-big_04.OBJ` (1.66 MB, 26k faces → brain_mesh.obj;
  rotated 90° — its A–P axis is X) and `brain_vertex_low.obj` (300 KB, pure 14k-vertex point
  cloud) into `public/models/`. **Repo has no license → OQ #11.**
- `xrayMaterial.ts` (adapted shader: procedural world-Y scan band replaces the UV texture band;
  softened whole-brain pulse; reduced-motion freezes uTime) + `XRayBrain.tsx` (bbox-normalized
  fit, soft radial point sprites). Lobes converted to `highlight` mode (near-invisible attention
  overlays + raycast proxies); core nucleus resized 0.26→0.16 after first screenshot review.

**Phase 5 work:**
- `lib/types/cognitive.ts` (doc-07 contract + type colors/glyphs), deterministic mock dataset
  (~290 nodes/1,100+ edges, Project-Report vocabulary), `provider.ts` seam, TanStack Query
  (`useLobeGraph`, session-cached), d3-force-3d worker layout (fibonacci cluster anchors, 220
  ticks, normalized radius 1.5, transferable buffer, inline fallback), `KnowledgeGraph`
  (InstancedMesh nodes + LineSegments edges + instanceId picking + hover labels + cluster
  landmarks), interior orbit/zoom/pan clamps, `LobeHud` + `LobeListView`, node route with
  scalar-meter inspector + relationship links, `types/d3-force-3d.d.ts`.
- deps installed: d3-force-3d, @tanstack/react-query (approved list).

**Milestone: first rendered screenshots of the app this session** (the pane produced frames in
bursts): brain view shows the x-ray cortex + golden core + labels; Limbic interior shows emotion
constellations under family labels. Point-sprite fix (squares → radial sprites) and core resize
came directly from screenshot review.

**Tests performed:** vitest 60/60 (12 new: dataset invariants, provider scoping, layout bounds) ·
lint/tsc/build clean (7 routes) · live: Limbic graph "52 nodes · 74 pathways beyond" · list view
72 links → node route → inspector (4 meters, 6 relationships, breadcrumb tail) · cold deep link
`/brain/frontal/node/ctr-2` ✓ · Esc deselect ✓ · axe 0 violations · zero console errors.

**Remaining:** formal FPS numbers on desktop hardware; raycast hover feel on the x-ray brain;
brain-mesh orientation sanity (rotated by bbox heuristic — confirm visually).

**Next recommended step:** Phase 6 — Cognitive Node System (full NodeInspector with provenance,
relationship tracing + pathway history, type-specific visual treatments, activation state machine).

---

## 2026-07-12 — Visual feedback: remove golden halo + interior core glare

**Phase:** polish (user feedback on screenshots)

**Work completed:** removed `DivineLightSource` entirely (halo sprite + lights — nothing in the
scene uses lighting since the x-ray restyle; all materials are unlit/shader-based); the core
nucleus now renders at brain view only — interior cameras face the brain center, so the bright
golden ball dominated every lobe interior (visible in the user's screenshots); dropped the core's
dead pointLight.

**Decisions:** supersedes the "DivineLightSource" element of the original composition (docs/ui/06)
— the divine-light visual language is retired in favor of the cleaner x-ray look. Doc 06's
component list should be read with I21–I23.

**Tests:** 60/60 · lint/tsc/build clean. Screenshot re-verified: /brain shows a clean profile
x-ray brain, no halo, modest core.

---

## 2026-07-12 — Handoff docs for the cloned 3dbrain repo

User pivoted: they cloned victors1681/3dbrain and want to drive Codex on it directly (lobe
labels + light/dark theming there). Created `docs/handoff/`:
- `WHAT-WE-BUILT.md` — one-file summary of this entire app (for context ingestion),
- `CODEX-TASK-1-lobe-labels.md` — six-lobe labels/hover/click spec against that repo's actual
  structure (bounding-box-fraction anchors, DOM-projected labels, raycast proxies, dat.GUI toggle),
- `CODEX-TASK-2-light-dark-mode.md` — two-theme system (current bright look = light; our space
  palette = dark; OS default + persisted toggle; AA contrast table incl. darkened label accents
  for light mode).

Note: work may continue in the cloned repo rather than this codebase for a while; the roadmap
here (Phase 6 next) remains valid if/when the user returns.

---

## 2026-07-12 — Real lobe regions, light/dark themes, floor shadow, repo motion

**Phase:** polish batch (user feedback; the cloned repo at C:\Users\hp\3dbrain used as reference —
read MainBrain.js/AbstractApplication.js/gui.js for the actual techniques).

**Work completed:**
- **Region-accurate lobes (I26):** removed the ellipsoid overlays. XRayBrain bakes an `aLobe`
  vertex attribute (anatomical classification via the lobe volumes as a spatial classifier,
  |x| for the bilateral temporal); the x-ray shader mixes each region toward its lobe accent by
  `uLobeBoost[5]` (attack/decay lerp + activation flash). The shell itself is the hover/click
  surface (intersection face → vertex → lobe). Keyboard proxies unchanged and drive the same
  highlights. Clicking a region still warps into that lobe's constellation.
- **Themes (I27):** `themePreference` (system/light/dark) in the persisted store; `data-theme`
  stamped alongside the other prefs; light palette (backdrop #a7b6d2 from the repo) overrides the
  @theme vars so all utilities re-theme; scene background/fog lerp between themes; Stars dark-only;
  glow/points pushed toward white in light (I30); edges normal-blend in light; label text-shadow
  via `--label-shadow`; sun/moon toggle in the /brain header + radio group in Settings; +13
  contrast tests (light AA + CSS↔TS sync), 73 total.
- **Floor shadow (I28):** BrainShadow = ShadowMaterial plane at y −2.05 + overhead spotlight
  (1024 PCFSoft); shell meshes castShadow; Canvas `shadows="soft"`; off at low tier.
- **Motion (I29):** repo values — rotateSpeed 0.12 / zoom 0.25 / damping 0.12 / autoRotate 0.5.

**Problems:** a `*/` inside a CSS comment (in "bg-space-*/text-*") terminated the comment and
broke the stylesheet — caught via build warning + console; Turbopack again served the stale broken
CSS across restarts until `.next` was cleared (second occurrence — pattern confirmed).

**Tests:** 73/73 · lint/tsc/build clean · live: theme toggle flips data-theme + body bg
(#a7b6d2 ⇄ #05060e), persists, aria-label updates; light-mode screenshots show white cortical
folds, ink labels, and the brain's floor shadow; dark screenshots from earlier session unchanged.
Region hover/click rides the next real-browser pass (frame-frozen pane can't dispatch pointer
raycasts) — classifier + shader logic reviewed and type-checked.

**Next:** Phase 6 — Cognitive Node System.

---

## 2026-07-12 — Rotation fix (I37)

User: "the 3d movement has stopped." Root cause: auto-rotate paused while a lobe was attended —
correct when hover targets were small ellipsoids, but since I26 the raycast target is the entire
shell, so a resting cursor pauses rotation ~always. Removed `attended === null` from the
autoRotate condition (still pauses for transitions/interior/reduced motion). Verified live: frame
captured mid-rotation with temporal hover active (violet rims + tagline showing). Bonus from the
pane's phantom-cursor click: first dark-mode screenshot of the full node inspector working
(meters + relationships) on /brain/temporal/node/…. Gates 73/73, lint/tsc/build clean.

---

## 2026-07-12 — Fourth visual batch: vivid outline hover, stipple shadow, galaxy light mode

**Phase:** polish (user feedback with reference screenshots from their local repo clone).

**Work completed:**
- **Vivid outlines (I34):** dark-mode hover no longer fills the region — it recolors the x-ray
  fresnel rims themselves to the lobe accent and brightens them (×2.5 at full attention), so the
  anatomical folds/outlines glow in the lobe color. The flat fill survives only in light mode
  (`fillMult = mix(0.0, 0.55, uThemeLight)`).
- **Repo-exact shadow (I35):** the 14k-point vertex cloud is projected flat onto the floor
  (y = FLOOR_Y from BrainShadow, slight scale/offset) as a second Points pass — the stippled
  brain footprint the repo gets from `systemPoints.castShadow`. Soft radial base disc beneath.
  Theme-tinted: `#5d6d94` @ 0.45 light, `#202b4f` @ 0.6 dark.
- **Galaxy light mode (I36):** twinkle amplitude deepened (points now visibly appear/disappear —
  reads on the pale bg where additive color saturates); light points 0.03 @ 0.8 white; bloom
  theme-split (1.2 @ 0.8 light); new second Sparkles layer of large slow motes above the brain.

**Verification:** gates green (73/73, lint/tsc/build). Screenshots: light-mode galaxy CONFIRMED
(dense white shimmer brain + airborne motes — the reference look); dark-mode frontal hover shows
brightened rims + tooltip; dark interior constellation (temporal) captured. The magenta-limbic
tint check and stipple-shadow closeup were blocked by the pane freezing on a stale frame —
**ride the user's next real-browser look**. Also: pane emitted trusted phantom pointermoves and
replayed stale queued inputs causing ghost navigations during verification (environment, not app —
instrumented: zero clicks/keys recorded during a clean 6 s window, no nav during that window).

**Next:** Phase 6 — Cognitive Node System.

---

## 2026-07-12 — Three visual fixes: shimmer, faint hover, missing dark shadow

**Phase:** polish batch (user feedback on live screenshots).

**Work completed:**
- **Shimmer (I31):** new `shimmerPoints.ts` grafts a per-particle twinkle onto the stock
  `PointsMaterial` via `onBeforeCompile` (baked `aPhase`/`aSpeed`/`aSizeMul` attributes, sine
  size+alpha modulation, size distribution biased toward a few bright outliers) instead of the
  flat static material. `XRayBrain.tsx` now builds this material for the synapse cloud and feeds
  it a running clock (frozen under reduced motion).
- **Faint light-mode hover (I32):** `xrayMaterial.ts` fragment shader's regional fill is no longer
  scaled only by the fresnel term — it now fills the whole anatomical region (not just silhouette
  edges) via a `uLobeBoost`-driven flat term, confirmed working extremely well in dark mode
  (screenshot: solid, correctly-shaped cyan frontal lobe). First light-mode pass overcorrected
  disastrously — a blown-out white blob (screenshotted, diagnosed as Bloom's 0.85 threshold
  amplifying the near-white light-theme baseline) — retuned to a theme-split multiplier
  (dark 1.6×, light 0.55×) and reverified: a legible, contained highlight with visible fold
  detail, not a cloud.
- **Missing dark-theme shadow (I33):** replaced real shadow-mapping (spotlight + ShadowMaterial)
  with a procedural radial-gradient disc, theme-tinted independent of lighting — a literal shadow
  cannot render darker than an already near-black background, so the physically-based approach
  was invisible by construction. Also repositioned from y −2.05 (past the default camera's
  vertical frustum edge, clipped) to −1.15 (comfortably in frame). Verified live: a clearly
  visible navy-blue ellipse beneath the brain in dark mode.

**Problems encountered:** the light-mode hover fix genuinely regressed to worse-than-original on
the first attempt (full white-out) — caught immediately via screenshot before calling it done,
which this session's environment finally allowed reliably (multiple successful screenshots this
round, unlike most of the session).

**Tests performed:** vitest 73/73 · lint/tsc/build clean · **live, with real screenshots**:
dark-mode region highlight (solid, correctly shaped) ✓ · light-mode region highlight (visible,
contained, not blown out) ✓ · dark-mode shadow disc (clearly visible navy ellipse) ✓ · shimmer
particles visible as varied-size sparkle dots across the shell in both themes ✓.

**Next:** Phase 6 — Cognitive Node System.
