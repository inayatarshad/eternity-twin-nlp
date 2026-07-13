"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { detectDeviceCaps, resolveTier, type ResolvedTier } from "@/lib/scene/perf";
import { useAnimationStore, type Theme } from "@/lib/state/animation";
import {
  useEffectiveReducedMotion,
  useEffectiveTheme,
} from "@/components/ClientPreferences";

interface SceneRootProps {
  children: (ctx: {
    tier: ResolvedTier;
    reducedMotion: boolean;
    theme: Theme;
  }) => React.ReactNode;
  /** Called once the first frame has been produced (drives LoadingExperience). */
  onFirstFrame?: () => void;
  /** Rendered instead of the canvas when WebGL is unusable. */
  fallback: React.ReactNode;
  /** Live text announced to screen readers for scene state (docs/ui/09). */
  ariaLabel: string;
}

/**
 * Owns the single R3F Canvas: renderer config, perf tier, context-loss
 * recovery (docs/ui/06). Children render inside the Canvas and receive the
 * resolved tier + effective reduced-motion flag.
 */
export function SceneRoot({ children, onFirstFrame, fallback, ariaLabel }: SceneRootProps) {
  const override = useAnimationStore((s) => s.perfTier);
  const reducedMotion = useEffectiveReducedMotion();
  const theme = useEffectiveTheme();
  // client-only component (dynamic ssr:false) — one-shot lazy detection is safe here
  const [caps] = useState(detectDeviceCaps);
  const tier = useMemo(() => resolveTier(override, caps), [override, caps]);
  const [contextLost, setContextLost] = useState(false);

  // Context-loss handling attaches to the canvas DOM node directly (not via
  // R3F onCreated) so it works even if the render loop hasn't started yet.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const canvas = node.querySelector("canvas");
    if (!canvas) return;
    canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      setContextLost(true);
    });
    canvas.addEventListener("webglcontextrestored", () => {
      setContextLost(false);
    });
  }, []);

  const showFallback = tier === "fallback2d" || contextLost;

  // The fallback presents immediately — report readiness so the loading veil
  // lifts without a WebGL first frame.
  useEffect(() => {
    if (showFallback) onFirstFrame?.();
  }, [showFallback, onFirstFrame]);

  if (showFallback) {
    return (
      <>
        {fallback}
        {contextLost ? (
          <div className="fixed bottom-6 left-1/2 z-(--z-toast) -translate-x-1/2">
            <p role="status" className="glass px-4 py-2 text-sm text-text-primary">
              3D rendering was interrupted.{" "}
              <button
                type="button"
                className="font-medium text-neural-cyan hover:underline"
                onClick={() => setContextLost(false)}
              >
                Try 3D again
              </button>
            </p>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      className="absolute inset-0 z-(--z-scene)"
    >
      <Canvas
        dpr={tier === "high" ? [1, 2] : 1}
        camera={{ position: [0, 0.6, 5], fov: 42 }}
        gl={{ antialias: tier !== "low", powerPreference: "high-performance" }}
        onCreated={() => onFirstFrame?.()}
      >
        {children({ tier, reducedMotion, theme })}
        {tier === "high" ? (
          <EffectComposer>
            {/* light mode leans harder on bloom — the reference's white
                sparkle halos are what make the pale look feel alive */}
            <Bloom
              intensity={theme === "light" ? 1.2 : 0.75}
              luminanceThreshold={theme === "light" ? 0.8 : 0.85}
              luminanceSmoothing={0.2}
              mipmapBlur
            />
            <Vignette
              eskil={false}
              offset={0.18}
              darkness={theme === "light" ? 0.55 : 0.85}
            />
          </EffectComposer>
        ) : null}
      </Canvas>
    </div>
  );
}
