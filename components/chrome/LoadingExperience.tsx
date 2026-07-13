"use client";

import { useEffect, useState } from "react";
import { useEffectiveReducedMotion } from "@/components/ClientPreferences";

interface LoadingExperienceProps {
  /** True once the scene has produced its first frame. */
  ready: boolean;
}

/**
 * Phase-2 loading veil (docs/ui/03 Flow 1, v1): a breathing point of light
 * over the void while the scene compiles; driven by real readiness, always
 * skippable. The full particle-assembly awakening replaces this in a later
 * phase alongside the final home experience.
 */
export function LoadingExperience({ ready }: LoadingExperienceProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [skipped, setSkipped] = useState(false);
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShowSkip(true), 1500);
    return () => window.clearTimeout(t);
  }, []);

  const hidden = ready || skipped;

  return (
    <div
      aria-hidden={hidden}
      className="absolute inset-0 z-(--z-overlay) flex flex-col items-center justify-center gap-6 bg-space-950 transition-opacity duration-(--dur-move)"
      style={{
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
      }}
    >
      <div
        aria-hidden="true"
        className="h-3 w-3 rounded-full bg-consciousness-gold"
        style={{
          boxShadow: "0 0 32px 6px rgba(255, 214, 110, 0.45)",
          animation: reducedMotion
            ? "none"
            : "loading-breathe 2.4s var(--ease-breathe) infinite",
        }}
      />
      <p role="status" className="text-xs tracking-[0.2em] text-text-muted uppercase">
        {hidden ? "The mind is awake" : "The mind is assembling"}
      </p>
      {showSkip && !hidden ? (
        <button
          type="button"
          onClick={() => setSkipped(true)}
          className="rounded-md border border-space-700 px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          Skip
        </button>
      ) : null}
      <style>{`
        @keyframes loading-breathe {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.6); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
