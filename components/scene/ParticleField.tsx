"use client";

import { Sparkles } from "@react-three/drei";
import { PARTICLE_COUNT, type ResolvedTier } from "@/lib/scene/perf";
import type { Theme } from "@/lib/state/animation";

interface ParticleFieldProps {
  tier: ResolvedTier;
  reducedMotion: boolean;
  theme: Theme;
}

const DUST_COLOR: Record<Theme, string> = {
  dark: "#a9b1d6",
  light: "#ffffff",
};
const FLOATER_COLOR: Record<Theme, string> = {
  dark: "#cfe9ff",
  light: "#ffffff",
};

/**
 * Ambient particles (docs/ui/04 particle rules), two layers:
 * - fine dust filling the space around the brain;
 * - a sparse band of large, soft motes drifting in the air above it —
 *   the reference repo's floating "memory bubble" look.
 * Counts are tier-capped; reduced motion freezes drift. Light mode goes
 * pure white (with bloom halos) — tinted dust washes out on the pale bg.
 */
export function ParticleField({ tier, reducedMotion, theme }: ParticleFieldProps) {
  const count = PARTICLE_COUNT[tier];
  if (count === 0) return null;
  return (
    <>
      <Sparkles
        count={count}
        scale={[10, 7, 10]}
        size={1.6}
        speed={reducedMotion ? 0 : 0.18}
        opacity={theme === "light" ? 0.55 : 0.35}
        color={DUST_COLOR[theme]}
      />
      {/* large slow motes above the brain (reference: victors1681/3dbrain) */}
      <Sparkles
        count={Math.max(40, Math.floor(count / 16))}
        position={[0, 2, 0]}
        scale={[7, 3.5, 7]}
        size={theme === "light" ? 9 : 7}
        speed={reducedMotion ? 0 : 0.32}
        opacity={theme === "light" ? 0.85 : 0.6}
        noise={1}
        color={FLOATER_COLOR[theme]}
      />
    </>
  );
}
