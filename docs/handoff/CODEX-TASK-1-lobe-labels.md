# Task 1 — Interactive cognitive lobe labels on the 3D brain

> Instruction file for a coding agent working in a clone of `victors1681/3dbrain`
> (vanilla Three.js + Webpack, JS not TypeScript, dev server: `npm install && npm run dev`
> → http://localhost:8080). Read this whole file before editing.

## Goal

Overlay six labeled, hoverable, clickable **cognitive lobe regions** on the existing particle
brain, matching the Eternity Twin cognitive model. Do not break the existing loading animation,
particle system, or dat.GUI controls.

## The six lobes (canonical — do not rename)

| id | Label | Tagline | Color |
|---|---|---|---|
| `frontal` | FRONTAL — REASONING | Deliberation, decisions, contradictions | `#5ee6ff` |
| `limbic` | LIMBIC — EMOTION | Felt states and their intensities | `#ff5ea8` |
| `temporal` | TEMPORAL — MEMORY | Episodic and biographical memory | `#9d7bff` |
| `parietal` | PARIETAL — ASSOCIATION | Concepts and semantic structure | `#4fd8c4` |
| `occipital` | OCCIPITAL — PERCEPTION | What the twin has been exposed to | `#4f8dff` |
| `core` | CORE — IDENTITY | Who the twin is | `#ffd66e` |

## Where things live in this repo

- Scene/bootstrap: `src/js/MainBrain.js`, `src/js/views/AbstractApplication.js`
- Brain model + particles: `src/js/services/particlesSystem.js` (loads via `src/js/Loaders/Loaders.js`)
- GUI: `src/js/services/gui.js` (dat.GUI)
- Styles: `src/css/style.css`

## Implementation requirements

1. **New module `src/js/services/lobes.js`** exporting the table above plus an anchor for each
   lobe expressed as **fractions of the brain's bounding box** (compute `THREE.Box3` from the
   loaded brain object once it's ready — never hardcode world units; the model is hundreds of
   units wide). Suggested fractions `[fx, fy, fz]` of the box (0 = min, 1 = max), assuming the
   brain faces +Z with frontal at the front — **verify visually and flip Z fractions if the
   frontal label lands on the cerebellum side**:
   - frontal `[0.5, 0.62, 0.85]` · parietal `[0.5, 0.88, 0.45]` · occipital `[0.5, 0.55, 0.10]`
   - temporal `[0.85, 0.35, 0.55]` · limbic `[0.42, 0.48, 0.55]` · core `[0.5, 0.42, 0.5]`
2. **Labels as DOM overlay**, not sprites: absolutely-positioned `<div class="lobe-label">`
   elements in a full-screen `pointer-events: none` container; every frame, project each anchor
   with `vector.project(camera)` → convert NDC to pixels → `transform: translate(-50%,-50%)
   translate(xpx, ypx)`. Hide a label (`opacity: 0`) when its anchor faces away from the camera
   (dot of camera-to-anchor direction vs camera forward, or simply when `projected.z > 1`).
3. **Hover + click targets:** one invisible `THREE.Mesh` sphere per lobe at its anchor
   (radius ≈ 12% of the bounding-box max dimension; `material.visible = false`). A shared
   `THREE.Raycaster` on `mousemove`/`click` over the renderer canvas:
   - hover → that label scales to 1.15 and brightens to full color; the other five dim to 35%
     opacity; cursor becomes `pointer`.
   - click → dispatch `window.dispatchEvent(new CustomEvent("lobe:selected", { detail: { id } }))`
     and `console.info("lobe selected:", id)`. (Navigation comes later — just the event now.)
4. **Label styling** (in `style.css`): 11px uppercase, `letter-spacing: 0.14em`, font stack
   `Inter, system-ui, sans-serif`, color = lobe accent, plus a second line (tagline) at 10px
   that is visible **only while hovered**; text-shadow `0 0 12px rgba(0,0,0,0.9)` so labels stay
   readable over bright particles. Labels must use theme variables (see Task 2) for the tagline
   text color.
5. **dat.GUI:** add a "Lobes" folder with a single `showLabels` boolean (default true) toggling
   the overlay container.
6. Keep everything frame-budget-friendly: no per-frame allocations (reuse one `Vector3`), one
   raycaster, six proxy meshes total.

## Acceptance criteria

- [ ] Six labels track their anatomical regions while the camera orbits/animates; back-facing
      labels hide.
- [ ] Hovering a region highlights exactly one label (others dim), shows its tagline, and sets
      the pointer cursor; leaving restores all.
- [ ] Clicking fires `lobe:selected` with the correct id (verify in console).
- [ ] `showLabels` GUI toggle works.
- [ ] Existing intro animation, particles, and GUI behave exactly as before.
- [ ] No console errors; `npm run dev` builds clean.
