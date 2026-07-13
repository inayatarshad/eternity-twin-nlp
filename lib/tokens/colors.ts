/**
 * Canonical color token values — must stay in sync with the @theme block in
 * styles/globals.css. tests/contrast.test.ts enforces the sync and the WCAG
 * contrast contract from docs/ui/04-visual-design-system.md.
 */
export const colorTokens = {
  "space-950": "#05060e",
  "space-900": "#0a0d1a",
  "space-800": "#111527",
  "space-700": "#1a2036",

  "neural-cyan": "#5ee6ff",
  "emotion-magenta": "#ff5ea8",
  "memory-violet": "#9d7bff",
  "association-teal": "#4fd8c4",
  "perception-blue": "#4f8dff",
  "consciousness-gold": "#ffd66e",

  "text-primary": "#eef1ff",
  "text-secondary": "#a9b1d6",
  "text-muted": "#757e9f",

  positive: "#6ee7a0",
  warning: "#ffc46b",
  danger: "#ff7a7a",
  focus: "#ffffff",
} as const;

export type ColorTokenName = keyof typeof colorTokens;

/**
 * Light-theme overrides (html[data-theme="light"] in globals.css) — mirrored
 * here so the contrast suite verifies both themes.
 */
export const lightColorTokens = {
  "space-950": "#a7b6d2",
  "space-900": "#b7c3dc",
  "space-800": "#e6ecf6",
  "space-700": "#8c9cbd",
  "text-primary": "#10162b",
  "text-secondary": "#2e3854",
  "text-muted": "#3a445f",
} as const;

export const lobeAccents: Record<string, ColorTokenName> = {
  frontal: "neural-cyan",
  limbic: "emotion-magenta",
  temporal: "memory-violet",
  parietal: "association-teal",
  occipital: "perception-blue",
  core: "consciousness-gold",
};
