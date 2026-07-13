"use client";

import { Suspense } from "react";
import { LOBES, type LobeId } from "@/lib/lobes";
import { BrainLobe } from "@/components/scene/BrainLobe";
import { XRayBrain } from "@/components/scene/XRayBrain";
import { useSceneStore } from "@/lib/state/scene";
import type { Theme } from "@/lib/state/animation";

interface BrainModelProps {
  reducedMotion: boolean;
  theme: Theme;
  onActivate: (id: LobeId) => void;
}

/**
 * The brain: anatomical x-ray shell whose vertices ARE the lobes (region
 * highlighting + picking live on the shell itself — see XRayBrain), plus the
 * golden core nucleus (its own mesh + target, brain view only: interior
 * cameras face the brain center and it reads as a giant sun from inside).
 */
export function BrainModel({ reducedMotion, theme, onActivate }: BrainModelProps) {
  const attended = useSceneStore((s) => s.attended);
  const pulse = useSceneStore((s) => s.pulse);
  const view = useSceneStore((s) => s.view);
  const core = LOBES.find((l) => l.id === "core")!;

  return (
    <group name="brain-model">
      <Suspense fallback={null}>
        <XRayBrain
          reducedMotion={reducedMotion}
          theme={theme}
          onActivate={onActivate}
        />
      </Suspense>
      {view === "brain" ? (
        <BrainLobe
          lobe={core}
          seed={12.9898}
          state={
            attended === null
              ? "idle"
              : attended === "core"
                ? "attended"
                : "dimmed"
          }
          pulseCount={pulse?.id === "core" ? pulse.count : 0}
          reducedMotion={reducedMotion}
          mode="solid"
          onActivate={onActivate}
        />
      ) : null}
    </group>
  );
}
