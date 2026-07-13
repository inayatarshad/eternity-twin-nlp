# 09 — Accessibility & Performance

> Status: Phase 0 proposal. Non-negotiable principle from the brief: **the experience must remain
> understandable without advanced visual effects.** The 2D fallback is a first-class mode, not an
> apology screen — it shares all chrome components and all data models with the 3D mode.

## Accessibility

### Keyboard navigation (complete map)

| Context | Keys |
|---|---|
| Global | `⌘K`/`Ctrl+K` or `/` search · `Esc` back/close (node → lobe → brain) · `?` shortcut help |
| Brain view | `Tab` into brain widget · `←→↑↓` cycle lobes · `Enter` enter lobe |
| Lobe view | `Tab` between chrome regions · arrows walk nodes in spatial-neighbor order · `Enter` select · `[` `]` walk pathway history · `f` filter bar · `t` timeline |
| Inspector | standard tab order · `Enter` on relationship = hop · `Esc` returns focus to node |
| Insight tour | `Space` pause/resume · `←→` step · `Esc` end |

Rules: no keyboard traps; transitions never steal focus (focus moves *after* arrival, once);
skip-link to main chrome on every route; all shortcuts listed in a `?` overlay and remappable later.

### Screen-reader strategy (DOM-twin pattern)

WebGL is invisible to assistive tech, so **the accessibility tree is generated from data, not
pixels** (see `06`):

- Brain = a labeled widget of 6 focusable lobe proxies ("Limbic — Emotion. 48 nodes. High recent
  activity. Press Enter to explore.").
- Every lobe view renders an **"Explore as list"** view (visible button, not SR-only): nodes grouped
  by cluster, with type, scalars in words ("intensity high"), and relationship links. This doubles
  as the mobile/2D data view — one implementation, two audiences.
- A single polite `aria-live` region narrates scene events (arrivals, counts, trace steps); throttled
  to one message per event class per second.
- Insight tours emit a text transcript panel (Flow 11).

### Focus management

Visible focus ring always (white, `04`), in-scene via ring shader on the focused proxy's node.
Route changes move focus predictably: enter lobe → graph container; open inspector → panel heading;
close → back to owning node proxy. Focus restoration stack tested in Phase 3/9.

### Color & non-color cues

- Text pairs ≥ 4.5:1 (tokens chosen with headroom, `04`); UI glyphs ≥ 3:1.
- Hue never the sole encoding: node types also differ by glyph; emotion families by label +
  position; edge direction by arrowhead + text; activation by ring/size, not just glow.
- A "high legibility" toggle: raises dimmed-state floor 30%→60%, thickens edges, disables
  chromatic aberration.

### Reduced motion

OS `prefers-reduced-motion` respected automatically; in-app override (Settings + command palette).
Full policy in `05`: crossfades replace flights, ambient loops off, information carried by motion
gets text/state equivalents. Reduced motion ≠ reduced information.

### Low-power & fallback modes

| Tier | Trigger | What changes |
|---|---|---|
| high | default desktop w/ decent GPU | everything on |
| medium | weak GPU, tablet, battery-saver | half-res bloom, particles 800, DOF off, aberration off |
| low | very weak GPU | post chain off (sprite glows), particles 0, simplified brain material |
| fallback2d | no WebGL2 / context loss ×2 / phones (default) / user choice | 2D lobe map (SVG) + Canvas 2D force graph + full chrome |

Tier detected at boot (GPU heuristic + `deviceMemory`), user-overridable in Settings, persisted.
Auto-downshift if sustained FPS < 40 for 10 s (with toast, reversible).

### Mobile fallback

Phone default = fallback2d: lobe map as a tappable 2D brain diagram, graph as pan/zoom Canvas,
inspector as bottom sheet, search full-screen. Full 3D remains opt-in on capable phones.
(Product confirmation = Open Question #5.)

## Performance

### Budgets & targets

| Metric | Target |
|---|---|
| Frame rate | 60 fps high tier; ≥ 30 fps medium; fallback2d always ≥ 60 |
| Boot → interactive brain | < 5 s on mid-tier laptop, cold cache |
| JS initial route bundle (gzip) | < 300 KB before 3D chunk; 3D chunk lazy, < 700 KB |
| Brain GLB | ≤ 3 MB (DRACO) |
| Textures | KTX2/Basis, ≤ 2048², total GPU texture mem ≤ 96 MB |
| GPU memory total | ≤ 256 MB |
| Visible graph | ≤ 500 nodes / 1,500 edges (high); 250/700 (medium); LOD beyond |
| Particles | 2,000 / 800 / 0 by tier (single instanced buffer) |
| Active glow emitters | 1 focused + ≤ 12 active (`02`) |
| Draw calls (lobe view) | < 120 |

### Loading strategy

1. Route chrome renders immediately (no 3D in critical path).
2. Awakening consumes real progress: GLB + KTX2 + shader warm-up drive the particle assembly (`05`).
3. Lobe graphs fetched on entry (masked by warp), cached per session; adjacent-lobe summary prefetch
   on hover ≥ 300 ms.
4. Skeletons only inside DOM panels; the scene shows staged materialization instead.

### Asset & code optimization

- glTF: DRACO meshes, KTX2 textures, no embedded lights/cameras; meshopt if needed.
- Shaders: compiled at boot behind awakening (no first-hover jank); shared programs via material
  variants, not unique materials.
- Code splitting: `three` + scene code in a lazy chunk per `08`; fallback2d never downloads it.
- Fonts: `next/font` self-hosted subsets, variable where possible.

### Runtime discipline

- Instancing for all nodes/edges/particles; buffer attribute updates batched once per frame.
- Zero allocation in `useFrame` paths (pooled vectors); layout in a Web Worker (`08`).
- `frameloop="demand"` when idle; `visibilitychange` pauses the loop entirely.
- Octree picking; frustum + distance LOD (far nodes → points, labels culled).
- WebGL context-loss handler: dispose, attempt restore, else fallback2d with state intact.

### Large dataset strategy (beyond caps)

If a lobe exceeds visible caps: cluster-level aggregation first (clusters render as single
super-nodes with counts; expand on demand), then relevance-ranked windowing within the expanded
cluster, plus "load more" in the list view. Search always operates on the full dataset server-side
(or full mock set), never just the visible window.

### Memory-leak guardrails

Dispose geometries/materials/textures on scene unmount (single `SceneRoot` registry); Playwright
soak test in Phase 10 (enter/exit lobes ×50, assert stable heap & GPU mem).

### Verification tooling (Phase 10 checklist feeds from here)

FPS + draw-call HUD in dev builds; Lighthouse + bundle-size CI gates; axe-core automated a11y pass +
manual NVDA (Windows) run; reduced-motion and fallback2d snapshot tests.
