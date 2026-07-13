import type { PerfTier } from "@/lib/state/animation";

/** Resolved tier never includes "auto". */
export type ResolvedTier = Exclude<PerfTier, "auto">;

export interface DeviceCaps {
  webgl2: boolean;
  /** navigator.deviceMemory in GB, when exposed. */
  deviceMemoryGb?: number;
  /** GPU renderer string when exposed (WEBGL_debug_renderer_info). */
  rendererString?: string;
  coarsePointer: boolean;
  viewportWidth: number;
}

/**
 * Pure tier resolution (docs/ui/09): user override wins; otherwise a coarse
 * heuristic. Deliberately conservative — auto-downshift at runtime (Phase 9)
 * corrects optimistic picks.
 */
export function resolveTier(
  override: PerfTier,
  caps: DeviceCaps,
): ResolvedTier {
  if (override !== "auto") return override;
  if (!caps.webgl2) return "fallback2d";

  const renderer = (caps.rendererString ?? "").toLowerCase();
  if (renderer.includes("swiftshader") || renderer.includes("software")) {
    return "low";
  }
  // Phones default to the 2D experience (decision P5, docs/ui/11).
  if (caps.coarsePointer && caps.viewportWidth < 768) return "fallback2d";
  if (caps.coarsePointer) return "medium"; // tablets
  if (caps.deviceMemoryGb !== undefined && caps.deviceMemoryGb <= 4) {
    return "medium";
  }
  return "high";
}

/** Gather capabilities in the browser. Safe to call only client-side. */
export function detectDeviceCaps(): DeviceCaps {
  let webgl2 = false;
  let rendererString: string | undefined;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (gl) {
      webgl2 = true;
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      if (info) {
        rendererString = String(
          gl.getParameter(info.UNMASKED_RENDERER_WEBGL),
        );
      }
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    webgl2 = false;
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    webgl2,
    deviceMemoryGb: nav.deviceMemory,
    rendererString,
    coarsePointer: window.matchMedia("(pointer: coarse)").matches,
    viewportWidth: window.innerWidth,
  };
}

export const PARTICLE_COUNT: Record<ResolvedTier, number> = {
  high: 2000,
  medium: 800,
  low: 0,
  fallback2d: 0,
};
