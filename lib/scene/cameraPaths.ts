import type { LobeDefinition } from "@/lib/lobes";
import type { CameraPose } from "@/lib/state/scene";

/**
 * Pure camera-path math for the lobe entry/exit transitions (docs/ui/05).
 * Kept renderer-free so the timing/geometry contract is unit-testable.
 */

export const ENTER_MS = 850; // acceptance ceiling: 900
export const EXIT_MS = 700; // acceptance ceiling: 700
export const BASE_FOV = 42;
export const ENTER_FOV_BUMP = 14;
export const EXIT_FOV_BUMP = 6;

export const BRAIN_POSE: CameraPose = {
  position: [0, 0.6, 5],
  target: [0, 0, 0],
};

export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

type V3 = [number, number, number];

export function quadBezier(a: V3, c: V3, b: V3, t: number): V3 {
  const u = 1 - t;
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
    u * u * a[2] + 2 * u * t * c[2] + t * t * b[2],
  ];
}

export function lerp3(a: V3, b: V3, t: number): V3 {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function length3(v: V3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

/** Distance from the parked camera to the constellation center. */
export const INTERIOR_DEPTH = 2.2;

/** Camera pose when parked inside a lobe, looking at the constellation
 * center (which is also where the KnowledgeGraph group renders). */
export function interiorPose(lobe: LobeDefinition): CameraPose {
  const p = lobe.position;
  const len = length3(p);
  // core sits at the origin — look "forward" instead of inward
  const inward: V3 =
    len < 0.4
      ? [0, 0, -1]
      : [-p[0] / len, -p[1] / len, -p[2] / len];
  return {
    position: [...p],
    target: [
      p[0] + inward[0] * INTERIOR_DEPTH,
      p[1] + inward[1] * INTERIOR_DEPTH,
      p[2] + inward[2] * INTERIOR_DEPTH,
    ],
  };
}

/** Bezier control point just outside the lobe surface — the "through the
 * cortex" waypoint of the dive. */
export function enterControlPoint(lobe: LobeDefinition): V3 {
  const p = lobe.position;
  if (length3(p) < 0.4) return [p[0], p[1] + 0.25, p[2] + 1.1];
  return [p[0] * 1.45, p[1] * 1.45, p[2] * 1.45];
}
