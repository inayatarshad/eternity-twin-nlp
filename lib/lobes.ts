/**
 * The six cognitive lobes (docs/ui/02). Positions/scales describe the
 * placeholder procedural brain composition in scene units; they will be
 * replaced by named meshes when a final GLB asset exists (Open Question #6).
 */
export type LobeId =
  | "frontal"
  | "limbic"
  | "temporal"
  | "parietal"
  | "occipital"
  | "core";

export interface LobeDefinition {
  id: LobeId;
  displayName: string;
  tagline: string;
  /** Hex accent — canonical values in lib/tokens/colors.ts */
  color: string;
  /** Center of the lobe volume (brain local space). */
  position: [number, number, number];
  /** Ellipsoid radii of the lobe volume. */
  scale: [number, number, number];
  /** Label anchor offset direction (unit-ish vector away from brain center). */
  labelDirection: [number, number, number];
  /** Some lobes are bilateral in the placeholder model. */
  mirrored?: boolean;
}

export function isLobeId(value: string): value is LobeId {
  return LOBES.some((l) => l.id === value);
}

export function getLobeById(id: string): LobeDefinition | undefined {
  return LOBES.find((l) => l.id === id);
}

export const LOBES: LobeDefinition[] = [
  {
    id: "frontal",
    displayName: "Frontal — Reasoning",
    tagline: "Deliberation, decisions, contradictions",
    color: "#5ee6ff",
    position: [0, 0.28, 0.92],
    scale: [0.92, 0.78, 0.85],
    labelDirection: [0.25, 0.55, 1],
  },
  {
    id: "limbic",
    displayName: "Limbic — Emotion",
    tagline: "Felt states and their intensities",
    color: "#ff5ea8",
    position: [0, -0.02, 0.12],
    scale: [0.52, 0.42, 0.66],
    labelDirection: [-0.9, -0.7, 0.6],
  },
  {
    id: "temporal",
    displayName: "Temporal — Memory",
    tagline: "Episodic and biographical memory",
    color: "#9d7bff",
    position: [0.82, -0.28, 0.18],
    scale: [0.5, 0.46, 0.86],
    labelDirection: [1, -0.35, 0.25],
    mirrored: true,
  },
  {
    id: "parietal",
    displayName: "Parietal — Association",
    tagline: "Concepts and semantic structure",
    color: "#4fd8c4",
    position: [0, 0.62, -0.28],
    scale: [0.88, 0.62, 0.85],
    labelDirection: [0.1, 1, -0.35],
  },
  {
    id: "occipital",
    displayName: "Occipital — Perception",
    tagline: "What the twin has been exposed to",
    color: "#4f8dff",
    position: [0, 0.08, -1.0],
    scale: [0.72, 0.6, 0.55],
    labelDirection: [-0.3, 0.25, -1],
  },
  {
    id: "core",
    displayName: "Core — Identity",
    tagline: "Who the twin is",
    color: "#ffd66e",
    position: [0, -0.12, -0.05],
    scale: [0.16, 0.16, 0.16],
    labelDirection: [0.55, -1, -0.5],
  },
];
