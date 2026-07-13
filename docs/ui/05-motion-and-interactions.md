# 05 — Motion & Interactions

> Status: Phase 0 proposal. Governing law: **animation communicates cognition, attention, memory,
> connection, or activation — decoration-only motion gets cut.** Every entry below names its purpose;
> if a purpose can't be named, it doesn't ship.

## Global motion constants

```
--ease-breathe:  cubic-bezier(0.37, 0, 0.63, 1)    (sinusoidal feel — idle life)
--ease-enter:    cubic-bezier(0.22, 1, 0.36, 1)    (decelerating arrivals)
--ease-exit:     cubic-bezier(0.55, 0, 1, 0.45)    (accelerating departures)
--ease-snap:     cubic-bezier(0.2, 0.8, 0.2, 1)    (UI chrome)

--dur-instant: 100ms   --dur-fast: 250ms   --dur-move: 500ms
--dur-travel: 800ms    --dur-cinematic: 1200ms (hard ceiling for blocking motion)
```

Feedback within 100 ms of input, always — cinematic easing applies to the *world*, never to
acknowledgment. All world-transitions are skippable (any input completes them instantly).

## Animation inventory

Format — **Trigger / Duration / Easing / Purpose / Perf risk / Reduced-motion (RM) alternative**

### Brain idle (breathing)
- Continuous · 6 s loop · ease-breathe · **Purpose:** the twin is alive; ambient presence.
- Scale ±1.2%, emissive ±8% — shader uniforms only. **Risk:** negligible.
- **RM:** static brain; a slow 12 s opacity shimmer ±3% (near-imperceptible) or fully static per OS setting.

### Ambient synaptic pulses
- Continuous, stochastic (2–5 concurrent) · 1.5–3 s each · linear along path · **Purpose:** background
  cognition; also a live-activity signal (rate ∝ backend activity).
- Shader-driven points on precomputed cortical paths. **Risk:** low (instanced).
- **RM:** removed; activity shown as a numeric "activity" caption instead.

### Lobe hover / focus
- Hover or keyboard focus · in 100 ms, out 250 ms · ease-snap · **Purpose:** attention — "this region
  hears you."
- Emissive +30%, rim refraction up, label fade-in, other lobes dim 15%. **Risk:** negligible.
- **RM:** identical (state change, not motion) minus the dimming crossfade — instant swap.

### Lobe activation pulse
- Selection (click/`Enter`) · 200 ms · ease-exit · **Purpose:** acknowledgment — input landed;
  masks fetch kickoff.
- One radial emissive wave through the lobe volume. **Risk:** negligible.
- **RM:** instant highlight state, no wave.

### Enter-lobe transition (warp dive)
- After activation pulse · 600–900 ms · ease-enter (decelerate into arrival) · **Purpose:** spatial
  continuity — the lobe is *inside* the brain; masks graph load. Master reference: the hand→warp
  beat in `system design/hand_focuses into the brain.mp4`.
- Camera dolly through cortex + pooled warp particles + brief FOV stretch + DOF pull.
  **Risk: highest in app** — full-frame motion + particle burst; pre-warm particle pool, half-res
  post during transit, never allocate mid-flight.
- **RM:** 300 ms crossfade brain → graph; arrival announced.

### Exit-lobe transition
- Breadcrumb / `Esc` / zoom-out threshold · 700 ms · ease-exit → ease-enter · **Purpose:** reverse
  continuity; restores orbit pose (memory of place).
- **RM:** 300 ms crossfade.

### Node materialization (lobe arrival)
- On graph data ready · staged, 400 ms clusters → 300 ms leaves (60 ms stagger waves) · ease-enter ·
  **Purpose:** legible build-up — structure first, detail second; doubles as progressive-load display.
- Scale 0→1 + emissive ramp, instanced attribute. **Risk:** low.
- **RM:** nodes appear immediately at full state.

### Node hover
- Pointer/focus · 100 ms · ease-snap · **Purpose:** target confirmation.
- Ring fade-in + glow-soft→active + label. **Risk:** negligible. **RM:** identical (instant).

### Node activation (selection)
- Click/`Enter` · 500 ms camera frame + 250 ms state · ease-enter · **Purpose:** focus — the world
  reorganizes around one thought; unrelated nodes dim to 30%, related edges ignite.
- **Risk:** low. **RM:** no camera glide (instant reframe), dimming as instant state.

### Node expansion (inspector)
- Selection settled · 300 ms slide+fade from right · ease-snap · **Purpose:** detail-on-demand.
- Pure DOM/CSS transform. **Risk:** negligible. **RM:** instant appear.

### Relationship tracing (edge pulse)
- Hover edge / hover relationship row / guided insight tour · 400 ms per edge · linear ·
  **Purpose:** direction + causality made visible (source → target).
- Shader packet along curve. **Risk:** low. **RM:** edge highlights statically with an arrowhead
  glyph; direction stated in text.

### Cross-lobe transit (white-matter hop)
- Following a cross-lobe edge · ~1 s · ease-enter · **Purpose:** topological honesty — travel through
  connection, not teleport; masks destination load.
- Tunnel of filament lines (cheap camera-space effect). **Risk:** medium (full-frame). **RM:** crossfade + announcement.

### Cluster formation (filter/layout change)
- Filter toggle / re-layout · 250 ms (filter) – 600 ms (layout) · ease-snap · **Purpose:** object
  permanence — the same nodes rearranged, not a new dataset.
- Position tween via layout interpolation; excluded nodes fade to ember 30%. **Risk:** medium at
  high node counts — tween positions in a single buffer update per frame.
- **RM:** instant re-layout; count change announced ("12 of 48 visible").

### Particle attraction (activation events)
- Node focus / lobe activation · 800 ms · ease-enter · **Purpose:** energy flows toward attention.
- Local dust drift bias toward target (shader uniform, no physics). **Risk:** low. **RM:** removed.

### Search-result focus (travel)
- Result chosen · ≤1.2 s total (palette close 150 ms + travel + frame) · ease-enter · **Purpose:**
  continuity from query to answer; skippable mid-flight.
- Reuses enter-lobe machinery. **Risk:** same as warp. **RM:** instant cut + announcement.

### Loading (awakening assembly)
- Initial asset load · real-progress-driven, target < 5 s · ease-enter per particle wave ·
  **Purpose:** loading *is* the narrative (mind assembling); skip affordance at 1.5 s.
- **Risk:** medium — must not delay interactivity; assemble with the same pooled particle system.
- **RM:** static image + determinate progress bar.

### Timeline scrub
- Playhead drag · continuous, ≤16 ms response · linear · **Purpose:** recency re-weighting made
  tangible; formation order visible on "play."
- Emissive/opacity from a time uniform — no per-node JS. **Risk:** low. **RM:** stepped window
  updates (no tween), dates announced.

## Reduced-motion policy (summary)

`prefers-reduced-motion: reduce` (or in-app toggle — see `09`):
- All camera flights → crossfades ≤300 ms; all ambient/looping motion → off or ≤ near-static shimmer.
- No parallax, no warp, no particle systems.
- Every removed animation that carried information gets a text/state replacement (activity captions,
  arrowhead direction glyphs, announced counts).
- State-change feedback (hover/focus/selection styling) is retained — those are states, not motion.

## Interaction timing contract

| Input | Feedback deadline |
|---|---|
| Hover/focus | 100 ms |
| Click acknowledgment | 100 ms (pulse starts) |
| Route-changing transitions | begin ≤100 ms, complete ≤1.2 s, skippable always |
| Filter/scrub | ≤16 ms (frame-locked) |
