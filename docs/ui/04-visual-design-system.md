# 04 — Visual Design System

> Status: Phase 0 proposal. **There is no existing styling system in this repository** (audited
> 2026-07-11: no CSS, no Tailwind config, no tokens), so these values are *initial proposals* to be
> validated on real screens in Phase 1 — not inherited constraints. Token values below are starting
> points, deliberately conservative; expect calibration against the reference imagery.

## Palette philosophy

Derived from the two reference images: a near-black blue-charcoal space (`data_points` image) carrying
restrained spectral accents (`chromatic aberation` image). Darkness is 90% of every screen; saturated
light is budgeted and always encodes data.

## Design tokens — color

```css
/* Space (backgrounds, darkest → lightest) */
--color-space-950: #05060e;   /* void — page & scene background */
--color-space-900: #0a0d1a;   /* scene fog floor */
--color-space-800: #111527;   /* elevated surfaces base */
--color-space-700: #1a2036;   /* hairlines, subtle borders */

/* Lobe / semantic accents */
--color-neural-cyan:        #5ee6ff;  /* frontal — reasoning */
--color-emotion-magenta:    #ff5ea8;  /* limbic — emotion */
--color-memory-violet:      #9d7bff;  /* temporal — memory */
--color-association-teal:   #4fd8c4;  /* parietal — association */
--color-perception-blue:    #4f8dff;  /* occipital — perception */
--color-consciousness-gold: #ffd66e;  /* core — identity */

/* Text */
--color-text-primary:   #eef1ff;      /* 17.96:1 on space-950 */
--color-text-secondary: #a9b1d6;      /* 9.57:1 */
--color-text-muted:     #757e9f;      /* 5.05:1 — minimum for meaningful text.
                                         Phase 1 calibration: original proposal #6b7394
                                         measured 4.34:1 and was brightened. */

/* Semantic */
--color-positive: #6ee7a0;
--color-warning:  #ffc46b;
--color-danger:   #ff7a7a;
--color-focus:    #ffffff;            /* focus ring — white, never a lobe hue */
```

Rules: lobe hues are reserved for lobe/node identity — never reused for generic UI states. Body text
never rendered in an accent hue. All text-on-surface pairs must pass WCAG AA (4.5:1); the pairs above
were chosen with headroom (enforced by `tests/contrast.test.ts`).

**Tinted-surface rule (Phase 1 finding):** `text-muted` is only safe on the plain space surfaces
(950/900/800). On accent-tinted surfaces — e.g. a selected row with a `neural-cyan/10` wash — muted
drops below AA (measured 3.94:1). Meaningful text on tinted or glass-over-glow surfaces uses
`text-secondary` or brighter.

**Focus-ring rule (Phase 1 finding):** `outline-color` is pre-set to `--color-focus` on every
element (`* { outline-color: var(--color-focus) }`) so that utilities whose transition set includes
`outline-color` (e.g. `transition-colors`) can never fade the focus ring in. Focus indication is
instant, always.

## Lobe color system

Each lobe accent generates a derived scale at runtime (or build time): `--lobe-glow` (accent @ 35%
alpha), `--lobe-dim` (accent mixed 70% into space-900, for dormant state), `--lobe-edge` (accent @
80% for refraction rims). Emotion nodes inside Limbic vary hue ±18° around the family anchor.

## Typography

No fonts are currently installed; proposal (self-hosted via `next/font`, no CDN):

| Role | Face | Notes |
|---|---|---|
| Display / titles | **Instrument Serif** or **Fraunces** (pick one in Phase 1) | The "sacred/celestial" voice; used sparingly — awakening title, lobe names |
| UI / body | **Inter** (variable) | Workhorse; tabular numerals for meters |
| Data / mono | **JetBrains Mono** | Provenance JSON, IDs, timestamps |

Scale (rem, 1.25 ratio, `clamp()`ed for viewport):
`--text-xs .694 · --text-sm .833 · --text-base 1 · --text-lg 1.25 · --text-xl 1.563 ·
--text-2xl 1.953 · --text-3xl 2.441 · --text-display 3.5+`
Letterspacing: display slightly tight (-1%); overline labels (lobe captions) +8% in small caps.

## Spacing, radius, layers

```css
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

--radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;  --radius-pill: 999px;

/* Z-index strata (2D DOM) */
--z-scene: 0;        /* WebGL canvas */
--z-scene-labels: 10;/* projected 3D labels */
--z-chrome: 20;      /* breadcrumb, filters, minimap */
--z-panel: 30;       /* inspector, timeline drawer */
--z-overlay: 40;     /* command palette, insights */
--z-toast: 50;
```

## Glass materials

```css
--glass-surface:  rgba(17, 21, 39, 0.55);   /* panel fill */
--glass-border:   rgba(169, 177, 214, 0.14);/* 1px inner hairline */
--glass-blur:     16px;                     /* backdrop-filter blur */
--glass-blur-heavy: 28px;                   /* command palette only */
```

Rules: at most **two** stacked glass layers ever; glass panels always carry the hairline border +
a 1px top edge highlight (rgba white 6%) to read as material, not fog. Fallback when
`backdrop-filter` unsupported: solid `--color-space-800` at 92% opacity.

## Shadow & glow system

Shadows are nearly invisible in a dark UI; depth comes from glow and blur instead.

```css
--glow-soft:   0 0 24px 0 var(--lobe-glow);              /* ambient presence */
--glow-active: 0 0 48px 8px var(--lobe-glow);            /* hover / active */
--glow-focus:  0 0 64px 12px var(--lobe-glow);           /* selected node — max tier */
--shadow-panel: 0 8px 40px rgba(0, 0, 0, 0.5);           /* glass panels only */
```

## Bloom rules (3D post-processing)

- Single bloom pass, threshold ≥ 1.0 (only intentionally emissive material blooms).
- Global intensity cap ~0.9; **selected-node bloom must never white-out its label**.
- Bloom budget: at most 1 `focused` + ~12 `active` emitters at high tier (see `02` activation caps).
- Performance tiers (see `09`): high = bloom on; medium = half-res bloom; low/fallback = disabled,
  replaced by pre-baked sprite glows.

## Particle rules

- Ambient dust: ≤ 2,000 (high) / 800 (medium) / 0 (low) — single instanced buffer.
- Particles respond to camera (slight parallax) and to activation events (local attraction), never
  free physics per-particle on CPU.
- Warp transition particles are a separate pooled system, alive only during transitions.

## Depth layers (scene)

```
--depth-far:  starfield & nebula backplate (static, cheapest)
--depth-mid:  brain / graph (interactive)
--depth-near: dust motes + lens effects (parallax)
```

DOF/blur implies distance; UI chrome never blurs.

## Iconography

Thin-line (1.5px) geometric icons, 24px grid — proposal: Lucide (already the aesthetic norm for this
stack, tree-shakeable). Node-type glyphs: memory ◈, emotion ❋, concept ◎, person ⬡, event ◷,
value ✦, reasoning ⟁, contradiction ⚡, insight ✧, stimulus ▷ — rendered as SVG sprites in-scene and
as icons in panels (same silhouettes both places).

## Graph styling

| Element | Treatment |
|---|---|
| Node core | Emissive sphere/billboard in type hue; size ∝ `relevance` (clamped 0.6×–1.8×) |
| Node halo | Glow radius ∝ `intensity`; opacity ∝ `confidence` |
| Node ring | Thin ring appears on `active`; double ring + bloom on `focused` |
| Edge | Curved line; width & brightness ∝ `strength`; color = gradient between endpoint hues |
| Edge pulse | Directional light packet on hover/trace (see `05`) |
| Cluster | Faint volumetric fog tint + small-caps label billboard |
| Cross-lobe edge | Dashed spectral filament exiting volume toward a portal glyph |

## Interaction states (uniform contract, 2D and 3D)

| State | Treatment |
|---|---|
| Hover | Brightness +30%, glow-soft → glow-active, cursor pointer, label reveals |
| Selected | Focus ring (3D: double ring; 2D: 2px `--color-focus` outline offset 2px) + glow-focus |
| Disabled | 40% opacity, glow removed, `not-allowed` cursor, still announced with reason |
| Focus (keyboard) | Always the white `--color-focus` outline — **never suppressed**, identical prominence to hover |
| Dimmed (contextual) | 30% opacity when unrelated to current selection — reversible, never removes hit target |

## Anti-goals (restraint rules)

- No hue cycling / rainbow animation on UI chrome; spectral effects live in the scene only.
- Bloom, blur, and particles have hard numeric caps above — exceeding them is a review-blocking bug.
- No pure white (#fff) fills except the focus ring and specular highlights.
