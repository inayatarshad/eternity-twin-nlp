# 11 — Decisions & Open Questions

> Living document. Major product decisions are **not** made silently (Working Rule 24) — anything
> under "Proposed" or "Open" needs user/product sign-off before it hardens.

## Confirmed decisions

*(Facts established by existing material, or explicitly given in the project brief.)*

| # | Decision | Source | Date |
|---|---|---|---|
| C1 | Central concept: luminous interactive brain → lobes → internal spatial knowledge environment | Project brief | 2026-07-11 |
| C2 | Emotion vocabulary = GoEmotions 28 labels + neutral (RoBERTa head already trained) | Project-Report.md | 2026-07-11 |
| C3 | Persona schema = Big 5 (1–100) + quantified Core Values + Emotional Baseline + Backstory | Project-Report.md | 2026-07-11 |
| C4 | Per-exchange record = `{dominant_internal_emotion, triggered_core_value, inner_monologue, verbal_response}` | Project-Report.md | 2026-07-11 |
| C5 | Backend is a decoupled FastAPI service (Cloudflare-tunneled) | Project-Report.md | 2026-07-11 |
| C6 | Accessibility + reduced-motion + non-WebGL fallback are requirements, not extras | Project brief | 2026-07-11 |
| C7 | Phase-gated delivery; no dependency installs before plan approval | Project brief | 2026-07-11 |

## Proposed decisions — **approved by user 2026-07-11** ("ok approved start building")

P1–P8 below are now confirmed, including the dependency list in `08` (installed 2026-07-11).

| # | Proposal | Rationale | Doc |
|---|---|---|---|
| P1 | Six-lobe cognitive map (frontal/limbic/temporal/parietal/occipital/core-identity) | Maps cleanly onto confirmed backend artifacts | `02` |
| P2 | Stack: Next.js + TS + Tailwind + R3F + Zustand + TanStack Query | Continuity with prior MVP stack; ecosystem fit | `08` |
| P3 | Custom instanced graph inside the R3F scene (no graph library for 3D view) | One renderer/camera/transition system | `08` |
| P4 | Route scheme `/brain/[lobe]/node/[nodeId]` + URL-as-source-of-truth | Deep-linking, shareable filters | `01`, `07` |
| P5 | Phone default = 2D fallback mode; 3D opt-in | Perf + usability honesty | `08`, `09` |
| P6 | Static (settled) graph layout, not live simulation | Spatial memory, constellation metaphor, perf | `08` |
| P7 | Token palette / type stack in `04` | Derived from reference imagery; validated in Phase 1 gallery | `04` |
| P8 | This UI *reads* the persona; slider-editing stays out of v1 scope | Focus; existing MVP already edits | `00` |

## Phase 1 implementation decisions (2026-07-11)

| # | Decision | Rationale |
|---|---|---|
| I1 | Display serif = **Instrument Serif** (D1 resolved) | Single weight keeps font payload small; sharper at display sizes. Revisit only if Phase 2 composition demands weight range (Fraunces). |
| I2 | `Meter` uses `role="meter"` on a styled div, not native `<meter>` | Native `<meter>` styling is inconsistent cross-browser; ARIA meter + always-visible text value is AT-equivalent. Deviation from `09` wording. |
| I3 | Focus ring never transitions: global `* { outline-color: var(--color-focus) }` | Tailwind's `transition-colors` includes `outline-color`; without the pre-set, the ring fades in over 100 ms. Focus feedback must be instant. |
| I4 | `text-muted` calibrated `#6b7394` → `#757e9f` | Measured 4.34:1 on space-950 (below AA); new value 5.05:1. Caught by the automated contrast suite. |
| I5 | Muted text banned on tinted surfaces (see `04` tinted-surface rule) | axe measured 3.94:1 on the cyan-tinted selected row in Settings. |
| I6 | ESLint uses `eslint-config-next` native flat exports (no FlatCompat) | Next 16 exports flat configs directly; FlatCompat crashes on it. |

## Phase 2 implementation decisions (2026-07-11)

| # | Decision | Rationale |
|---|---|---|
| I7 | Placeholder brain = procedural noise-displaced ellipsoid lobes + fresnel hologram shader (additive, no depth write) | No GLB asset yet (OQ #6); additive blending sidesteps transparency sorting; luminous-glass look matches `00` |
| I8 | Phase-2 ambient particles = drei `Sparkles`; custom pooled system deferred to Phase 4 (warp) | Less custom code until the warp requires pooling; tier caps still honored |
| I9 | Lobe labels = drei `Html` (screen-space DOM) for Phase 2 | Token styling + AT-readable for free; SDF `Text` reconsidered when labels move in-scene (Phase 3 hover reveal) |
| I10 | Bloom + vignette enabled at high tier only in Phase 2; tuning deferred to Phase 7 | Keeps mid-tier budgets safe before instancing-heavy phases |
| I11 | `SceneRoot` reports "first frame" for the 2D fallback immediately | Found in verification: the loading veil never lifted in fallback mode (no WebGL frame ever fires) |

## Phase 3 implementation decisions (2026-07-11)

| # | Decision | Rationale |
|---|---|---|
| I12 | `react-hooks/immutability` lint rule disabled for `components/scene/**` only | R3F's model *is* imperative mutation of three.js objects in `useFrame`; the rule targets plain React data flow. Scoped narrowly; chrome/app code keeps the rule. |
| I13 | Lobe attention = one `attended: LobeId ∣ null` state fed by both raycast hover and DOM-proxy focus | Guarantees the single-attended cap; keyboard and mouse share one visual system |
| I14 | Keyboard proxies are `sr-only`; visible focus indication = the lobe's brightening + revealed label in-scene | A visible DOM ring floating unanchored would be noise; the scene response is the focus ring (re-evaluate in Phase 9 NVDA/contrast audit) |
| I15 | Phase 3 activation: 220 ms pulse acknowledgment, then a plain route cut | Doc 03's "push at gesture time" applies once the Phase 4 transition masks load; with a hard cut, pushing instantly would swallow the acknowledgment |

## Phase 4 implementation decisions (2026-07-11)

| # | Decision | Rationale |
|---|---|---|
| I16 | Canvas moved to a persistent `app/brain/layout.tsx`; route pages are DOM overlays | The camera must fly across the `/brain` ⇄ `/brain/[lobe]` route change; also the architecture Phase 5's in-scene graph requires |
| I17 | `TransitionDirector` reacts to URL-derived `view` only — gestures just `router.push` | One code path means browser back/forward mirror transitions with zero extra logic |
| I18 | Warp = camera-locked `LineSegments` streaks + FOV bump; DOF pull deferred to Phase 7 | One draw call, no pooled-particle system needed yet; post-chain tuning belongs to the cinematic phase |
| I19 | Enter 850 ms / exit 700 ms constants live in `lib/scene/cameraPaths.ts` with unit tests enforcing the ≤900/≤700 ceilings | Acceptance criteria as executable contract |
| I20 | Reduced-motion transition = instant camera snap in the director + a 300 ms DOM crossfade veil in the layout | Snap is frame-loop-independent; the veil supplies the "crossfade" feel without touching the camera |

## Phase 5 + brain-restyle decisions (2026-07-12)

| # | Decision | Rationale |
|---|---|---|
| I21 | Brain visual = anatomical OBJ with x-ray fresnel shader (c 0.9, p 6.7, glow #84ccff, additive/DoubleSide/no-depth-write) + 14k-point synapse vertex cloud | User-directed restyle to match github.com/victors1681/3dbrain; shader adapted (procedural world-Y scan band replaces the UV texture band — our mesh has no UVs) |
| I22 | Assets vendored from that repo: `brain-parts-big_04.OBJ` (1.66 MB → `public/models/brain_mesh.obj`) and `brain_vertex_low.obj` (300 KB point cloud) | Only faced mesh within our ≤3 MB budget; **repo has NO license file** → see OQ #11 |
| I23 | Six lobes became near-invisible attention **highlight** overlays + raycast proxies above the x-ray shell (mode="highlight"); core nucleus stays solid | Preserves all Phase 3 interactivity on a single-mesh brain |
| I24 | Graph data flows DOM-side (TanStack Query) → zustand store → scene | React context doesn't bridge into the R3F reconciler |
| I25 | Layout worker posts a transferable Float32Array; falls back to inline compute | Zero main-thread blocking normally; never breaks without workers |

## 2026-07-12 second batch (user feedback: real regions, light mode, shadow, motion)

| # | Decision | Rationale |
|---|---|---|
| I26 | Lobes are now **actual anatomy**: every shell vertex (aLobe attribute) is classified into a cortical lobe by anatomical position; the x-ray shader mixes the lobe accent per-region; the shell itself is the raycast target (face → vertex → lobe) | User: "an actual area that's already in the brain that gets highlighted, not an oval over the brain." The ellipsoid overlays are gone; ellipsoid definitions remain as the spatial classifier + label anchors + camera targets |
| I27 | Light theme added (`html[data-theme="light"]`, backdrop #a7b6d2 per the 3dbrain reference); Tailwind v4 var-based utilities re-theme automatically; light palette AA-verified in the contrast suite | User request; theme = system default + persisted override; toggle in /brain header + Settings |
| I28 | Floor shadow via the repo's real technique scaled down: shadow-only `ShadowMaterial` plane + overhead spotlight; shell casts; gated off at low tier | Grounding the brain like the reference; nothing else is lit so the light has no side effects |
| I29 | Motion tuned to the repo: rotateSpeed 0.12, zoomSpeed 0.25, damping 0.12, autoRotateSpeed 0.5 | User: "make my brain move like the repo" — the silk comes from low rotateSpeed |
| I30 | Additive materials get normal-blending/brighter variants in light mode (edges normal-blend; glow pushed toward white) | Additive blending can only brighten — near-invisible on a light background |

## 2026-07-12 third batch (user feedback: shimmer, faint hover, no dark shadow)

| # | Decision | Rationale |
|---|---|---|
| I31 | Synapse points get per-particle shimmer via `onBeforeCompile` on the stock `PointsMaterial` (attributes `aPhase`/`aSpeed`/`aSizeMul`, sine-driven size+alpha twinkle, size-biased toward a few bright outliers) | User: "why has mine not got that shimmer" — matches the reference's BAS-driven sparkle without adopting the BAS library |
| I32 | Region-highlight fill is now theme-split: dark keeps its strong `1.6×` fill multiplier (validated good); light gets `0.55×` — a straight theme-uniform multiplier (2.1×) blew the light-mode highlight into a formless white blob once combined with Bloom's 0.85 threshold | First light-mode attempt overshot badly (screenshotted, corrected same session) — bloom amplifies any near-white region past its threshold; light theme's baseline glow color is already near-white, so headroom is much smaller than dark theme's near-black baseline |
| I33 | BrainShadow dropped real shadow-mapping (spotlight + ShadowMaterial) for a procedural radial-gradient disc, theme-tinted independently of scene lighting | A shadow cannot render darker than an already near-black background (`#05060e`) — the real shadow was mathematically invisible in dark mode. The disc also moved from y −2.05 to −1.15: the old position sat past the camera's default vertical frustum edge and was clipped even where color contrast would have shown it |

## 2026-07-12 fourth batch (user feedback: vivid outlines, repo-exact shadow, galaxy light mode)

| # | Decision | Rationale |
|---|---|---|
| I34 | Dark-mode hover reverted to **rim tinting** — the fresnel outline itself recolors to the lobe accent and brightens ×2.5; the flat regional fill now exists ONLY in light mode | User: solid fill read as "clumsy dark blobs"; they want vivid colored outlines. Light keeps the fill because rim tint doesn't read against the pale backdrop |
| I35 | Floor shadow = the vertex cloud projected flat onto the floor plane as a second Points pass (stippled brain footprint) + a soft base disc | Matches the repo exactly — their `systemPoints.castShadow = true` casts per-point shadows; our projection gives the identical dotted silhouette without shadow maps, and stays theme-tintable (visible even on the near-black dark bg) |
| I36 | Galaxy treatment: twinkle deepened (size 0.3–1.3×, alpha 0.18–1.0 — points visibly appear/disappear), light-mode points bigger/brighter (0.03 @ 0.8), bloom theme-split (light 1.2 @ 0.8 threshold vs dark 0.75 @ 0.85), plus a second Sparkles layer of ~large slow motes drifting above the brain | User: light mode "too basic, no shimmer/galaxy"; the reference's life comes from deep per-point animation + bloom halos + airborne particles |

## 2026-07-12 fifth item (user: "why has the 3d movement stopped")

| # | Decision | Rationale |
|---|---|---|
| I37 | Auto-rotation no longer pauses on hover (`attended` removed from the autoRotate condition) | The pause was designed when hover targets were small ellipsoids; once the whole shell became the raycast target (I26), the cursor rests on the brain most of the time and rotation effectively never ran — users read it as broken. The reference repo also rotates continuously while hovered. Rotation still pauses during transitions, inside lobes, and under reduced motion. |

## Open question added

11. **Brain asset licensing:** victors1681/3dbrain has no license file; the vendored OBJs are fine
    for this prototype but must be replaced or cleared before any public/commercial release
    (fold into OQ #6 — commission the final Blender asset).

## Rejected ideas (with reasons — keep for the record)

| # | Idea | Why rejected |
|---|---|---|
| R1 | Spline for the brain scene | Black-box runtime; can't host instanced graph, weak a11y (see `08`) |
| R2 | react-force-graph-3d for lobe interiors | Owns its own renderer/camera; breaks scene continuity |
| R3 | SVG for the immersive graph | DOM cost beyond ~200 nodes; no depth |
| R4 | Live force simulation during exploration | Drifting landmarks defeat spatial memory; main-thread cost |
| R5 | Raymarched volumetrics in v1 | Perf budget; billboards + bloom + fog achieve the look |
| R6 | Realistic anatomical brain rendering | Uncanny/medical tone conflicts with the glass-light language (`00`) |

## Open questions

*(Numbered; referenced throughout the docs. Owner = user unless noted.)*

1. **Where is the existing MVP dashboard repo?** Project-Report describes a built Next.js/Tailwind
   dashboard (sliders, Neural Core status, JSON terminal). It is not in this directory. Can it be
   added/linked? Reusable pieces (API client, persona types) would shortcut Phases 1/5.
2. **What API does the FastAPI backend actually expose?** Endpoint shapes, auth, availability of
   conversation history. Needed before `apiProvider` (Phase 5+ can run entirely on mocks).
3. **Is there (or will there be) a graph-extraction pipeline** turning backstory/conversations into
   nodes+edges — or is the graph UI expected to define that contract for the backend to implement?
   (Docs currently assume the latter: UI defines `07` interfaces, backend fills them later.)
4. **Does persona editing belong in this UI eventually?** (P8 keeps it out of v1.)
5. **Confirm phone strategy** (P5): 2D-default acceptable?
6. **Who authors the final brain asset?** Blender artist available, or should the stylized
   procedural placeholder be the shipped look for v1?
7. **Is there a live "activity" signal** (recent exchanges) the brain view can reflect, or is
   activity mocked for v1?
8. **Brand/naming:** is "Eternity Twin" the product name for the UI, and is there any existing
   brand language (logos, fonts) to honor? None found in this repo.
9. **Deployment target:** Vercel assumed (matches report). Confirm.
10. **Timeline data:** do memories/events have real timestamps in any existing data, or is the
    timeline mock-only for v1?

## Technical uncertainties

- T1 — Placeholder-vs-final brain mesh raycast fidelity (Phase 3 risk; proxy hulls planned).
- T2 — d3-force-3d cluster-layout quality on real data shapes (time-boxed tuning, precomputed fallback).
- T3 — `backdrop-filter` performance over WebGL canvas on Windows/Firefox (fallback surface ready).
- T4 — GoEmotions family grouping (5 families) needs validation against the actual 28-label list.

## Product uncertainties

- U1 — Primary audience assumption: researcher validating twin behavior (drives Insights framing).
  If the audience is end-users exploring "their" twin, tone of copy shifts (not architecture).
- U2 — Multi-persona support (switching twins) — not designed for v1; would touch routes (`/[persona]/brain`?).

## Design uncertainties

- D1 — Serif display face choice (Instrument Serif vs. Fraunces) — decide in Phase 1 gallery.
- D2 — Exact lobe hues under bloom (tokens may shift after Phase 2 on-screen calibration).

## Dependencies requiring approval

The full install list in `08` (Next.js, R3F stack, Zustand, TanStack Query, d3-force-3d, Framer
Motion, Lucide, dev tooling). **None installed as of 2026-07-11.**
