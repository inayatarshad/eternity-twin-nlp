import { create } from "zustand";
import { persist } from "zustand/middleware";

/** AnimationState slice — contract from docs/ui/07-data-and-state-model.md. */

export type MotionPreference = "system" | "reduced" | "full";
export type PerfTier = "auto" | "high" | "medium" | "low" | "fallback2d";
export type ThemePreference = "system" | "light" | "dark";
export type Theme = "light" | "dark";

interface AnimationPreferences {
  motionPreference: MotionPreference;
  perfTier: PerfTier;
  highLegibility: boolean;
  themePreference: ThemePreference;
  setMotionPreference: (value: MotionPreference) => void;
  setPerfTier: (value: PerfTier) => void;
  setHighLegibility: (value: boolean) => void;
  setThemePreference: (value: ThemePreference) => void;
}

export const useAnimationStore = create<AnimationPreferences>()(
  persist(
    (set) => ({
      motionPreference: "system",
      perfTier: "auto",
      highLegibility: false,
      themePreference: "system",
      setMotionPreference: (motionPreference) => set({ motionPreference }),
      setPerfTier: (perfTier) => set({ perfTier }),
      setHighLegibility: (highLegibility) => set({ highLegibility }),
      setThemePreference: (themePreference) => set({ themePreference }),
    }),
    { name: "eternity-preferences" },
  ),
);

/** Effective theme: user override wins, otherwise OS preference. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): Theme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Effective reduced-motion flag: user override wins, otherwise OS preference.
 * Returns null while unknown (before hydration / on the server).
 */
export function resolveReducedMotion(
  preference: MotionPreference,
  systemPrefersReduced: boolean,
): boolean {
  if (preference === "reduced") return true;
  if (preference === "full") return false;
  return systemPrefersReduced;
}
