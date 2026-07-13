# Task 2 — Light mode + dark mode theming

> Instruction file for a coding agent working in a clone of `victors1681/3dbrain`.
> Do Task 1 (lobe labels) first if possible — this task themes those labels too.

## Goal

A proper two-theme system: the current bright look becomes **light mode**, and a new **dark
mode** (deep-space look) is added. Default follows the OS (`prefers-color-scheme`), a visible
toggle overrides it, and the choice persists in `localStorage`.

## Palettes

| Token | Light | Dark |
|---|---|---|
| `background` (scene clear color / page bg) | `#c9d4ea` (match the current bluish backdrop) | `#05060e` |
| `fogColor` (if fog is used) | same as background | same as background |
| `surface` (panels/GUI wrap) | `rgba(255,255,255,0.7)` | `rgba(17,21,39,0.55)` |
| `textPrimary` | `#1a2036` | `#eef1ff` |
| `textSecondary` | `#3d4763` | `#a9b1d6` |
| `brainGlow` (x-ray/particle tint) | `#4a7dbd` (darker so it reads on light) | `#84ccff` |
| `particleColor` | `#5a7fb5` | `#cfe9ff` |

Lobe accent colors (Task 1 table) stay the same in both themes — but check each against the
light background; if any label text falls below WCAG AA 4.5:1 on `#c9d4ea` (the gold `#ffd66e`
and cyan `#5ee6ff` will), darken **the label text only** in light mode (e.g. gold → `#8a6b1f`,
cyan → `#1f7f99`, magenta → `#c2185b`, violet → `#6d3fd8`, teal → `#1e7d6e`, blue → `#2456c4`)
while keeping the original hues for 3D highlights.

## Implementation requirements

1. **New module `src/js/services/theme.js`:**
   - exports `getTheme()`, `setTheme("light"|"dark")`, `toggleTheme()`, `onThemeChange(cb)`;
   - initial value: `localStorage.theme` if set, else `matchMedia("(prefers-color-scheme: dark)")`;
   - applies `data-theme="light|dark"` to `<html>` and notifies subscribers.
2. **Scene hookup:** on theme change update — `renderer.setClearColor(background)` (or
   `scene.background`), fog color if present, the particle/points material colors, and any
   glow/x-ray shader color uniforms (search the material definitions in
   `src/js/services/particlesSystem.js` and `src/js/shaders/` for color uniforms such as
   `glowColor`). Use `THREE.Color` objects updated in place — do not recreate materials.
3. **CSS:** define both palettes as CSS custom properties under `:root[data-theme="light"]` and
   `:root[data-theme="dark"]` in `src/css/style.css`; all DOM (labels from Task 1, any headings,
   the toggle button) must use the variables — no hardcoded colors left in DOM styles.
4. **Toggle UI:** a small fixed button (top-left, above the canvas) showing ☾ in light mode and
   ☀ in dark mode, `aria-label="Switch to dark theme"` / `"…light theme"` accordingly, keyboard
   focusable with a visible focus outline. Also add a `theme` control to dat.GUI if trivial.
5. **No flash of wrong theme:** apply the stored/OS theme synchronously before first render
   (an inline snippet in `index.html`/template or the very top of `src/app.js`).

## Acceptance criteria

- [ ] First load with OS dark → dark scene; OS light → current bright look; no flash of the
      wrong theme.
- [ ] Toggle switches everything live — scene background, particle/glow colors, labels, UI —
      with no material recreation stutter; choice survives a reload.
- [ ] All label/UI text meets WCAG AA (4.5:1) against its background in **both** themes
      (spot-check gold and cyan on light especially).
- [ ] Toggle is keyboard operable with a visible focus ring and a correct, state-dependent
      `aria-label`.
- [ ] No console errors; existing animations and Task 1 behavior unchanged in both themes.
