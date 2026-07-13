"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  resolveReducedMotion,
  resolveTheme,
  useAnimationStore,
  type Theme,
} from "@/lib/state/animation";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

function makeMediaQueryHook(query: string, serverValue: boolean) {
  const subscribe = (onChange: () => void) => {
    const mq = window.matchMedia(query);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  };
  const getSnapshot = () => window.matchMedia(query).matches;
  const getServerSnapshot = () => serverValue;
  return () => useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** OS-level media preferences as live external-store subscriptions. */
const useSystemReducedMotion = makeMediaQueryHook(REDUCED_MOTION_QUERY, false);
const useSystemPrefersDark = makeMediaQueryHook(DARK_SCHEME_QUERY, true);

/**
 * Stamps user preferences onto <html> as data attributes so CSS (and later the
 * 3D scene) can key off them:
 *   data-reduced-motion="true|false"  — effective motion state (override ∘ OS)
 *   data-legibility="high"            — raised dimming floor etc. (docs/ui/09)
 *   data-perf-tier                    — consumed by SceneRoot from Phase 2 on
 */
export function ClientPreferences() {
  const motionPreference = useAnimationStore((s) => s.motionPreference);
  const perfTier = useAnimationStore((s) => s.perfTier);
  const highLegibility = useAnimationStore((s) => s.highLegibility);
  const themePreference = useAnimationStore((s) => s.themePreference);
  const systemReduced = useSystemReducedMotion();
  const systemDark = useSystemPrefersDark();

  useEffect(() => {
    const el = document.documentElement;
    el.dataset.reducedMotion = String(
      resolveReducedMotion(motionPreference, systemReduced),
    );
    el.dataset.perfTier = perfTier;
    el.dataset.theme = resolveTheme(themePreference, systemDark);
    if (highLegibility) {
      el.dataset.legibility = "high";
    } else {
      delete el.dataset.legibility;
    }
  }, [
    motionPreference,
    perfTier,
    highLegibility,
    themePreference,
    systemReduced,
    systemDark,
  ]);

  return null;
}

/** Effective light/dark theme for components that adapt beyond CSS. */
export function useEffectiveTheme(): Theme {
  const themePreference = useAnimationStore((s) => s.themePreference);
  const systemDark = useSystemPrefersDark();
  return resolveTheme(themePreference, systemDark);
}

/** Hook for components that adapt behavior (not just CSS) to motion state. */
export function useEffectiveReducedMotion(): boolean {
  const motionPreference = useAnimationStore((s) => s.motionPreference);
  const systemReduced = useSystemReducedMotion();
  return resolveReducedMotion(motionPreference, systemReduced);
}
