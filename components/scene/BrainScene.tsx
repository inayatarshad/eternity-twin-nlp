"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";
import { BrainModel } from "@/components/scene/BrainModel";
import { BrainShadow } from "@/components/scene/BrainShadow";
import { ParticleField } from "@/components/scene/ParticleField";
import { LobeLabel } from "@/components/scene/LobeLabel";
import { KnowledgeGraph } from "@/components/scene/KnowledgeGraph";
import { LOBES, type LobeId } from "@/lib/lobes";
import { useSceneStore } from "@/lib/state/scene";
import type { ResolvedTier } from "@/lib/scene/perf";
import type { Theme } from "@/lib/state/animation";

interface BrainSceneProps {
  tier: ResolvedTier;
  reducedMotion: boolean;
  theme: Theme;
  onActivate: (id: LobeId) => void;
  onSelectNode: (nodeId: string) => void;
}

const BREATHE_PERIOD_S = 6; // docs/ui/05 brain idle
const BREATHE_AMPLITUDE = 0.012;

/** Fog envelopes: open space at brain level, intimate inside a lobe. */
const FOG_BRAIN = { near: 8, far: 18 };
const FOG_INTERIOR = { near: 2.5, far: 9 };

/** Backdrop per theme — light matches the 3dbrain reference (#a7b6d2). */
const BACKGROUND: Record<Theme, string> = {
  dark: "#05060e",
  light: "#a7b6d2",
};

/** Composition of the persistent brain scene (docs/ui/06). */
export function BrainScene({
  tier,
  reducedMotion,
  theme,
  onActivate,
  onSelectNode,
}: BrainSceneProps) {
  const brainGroup = useRef<THREE.Group>(null);
  const fogRef = useRef<THREE.Fog>(null);
  const bgRef = useRef<THREE.Color>(null);

  const view = useSceneStore((s) => s.view);
  const attended = useSceneStore((s) => s.attended);
  const transition = useSceneStore((s) => s.transition);
  const graph = useSceneStore((s) => s.graph);
  const interior = view !== "brain";

  useFrame(({ clock }, delta) => {
    if (brainGroup.current && !reducedMotion) {
      const phase = (clock.elapsedTime % BREATHE_PERIOD_S) / BREATHE_PERIOD_S;
      brainGroup.current.scale.setScalar(
        1 + Math.sin(phase * Math.PI * 2) * BREATHE_AMPLITUDE,
      );
    }
    const bg = new THREE.Color(BACKGROUND[theme]);
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta / 0.25);
    if (bgRef.current) bgRef.current.lerp(bg, k);
    if (fogRef.current) {
      const goal = view === "brain" ? FOG_BRAIN : FOG_INTERIOR;
      fogRef.current.near += (goal.near - fogRef.current.near) * k;
      fogRef.current.far += (goal.far - fogRef.current.far) * k;
      fogRef.current.color.lerp(bg, k);
    }
  });

  return (
    <>
      <color ref={bgRef} attach="background" args={[BACKGROUND[theme]]} />
      <fog ref={fogRef} attach="fog" args={[BACKGROUND[theme], 8, 18]} />

      <group ref={brainGroup}>
        <BrainModel
          reducedMotion={reducedMotion}
          theme={theme}
          onActivate={onActivate}
        />
      </group>

      {tier !== "low" ? <BrainShadow theme={theme} /> : null}

      {interior && graph && graph.lobeId === view && transition === null ? (
        <KnowledgeGraph
          graph={graph}
          reducedMotion={reducedMotion}
          theme={theme}
          onSelectNode={onSelectNode}
        />
      ) : null}

      {view === "brain"
        ? LOBES.map((lobe) => (
            <LobeLabel
              key={lobe.id}
              lobe={lobe}
              state={
                attended === null
                  ? "idle"
                  : attended === lobe.id
                    ? "attended"
                    : "dimmed"
              }
            />
          ))
        : null}

      {/* depth-far backplate — space only exists in dark mode */}
      {theme === "dark" ? (
        <Stars
          radius={60}
          depth={30}
          count={tier === "high" ? 3500 : 1500}
          factor={3}
          saturation={0.15}
          fade
          speed={reducedMotion ? 0 : 0.6}
        />
      ) : null}
      {/* depth-near dust + airborne motes */}
      <ParticleField tier={tier} reducedMotion={reducedMotion} theme={theme} />

      {/* motion feel tuned to the 3dbrain reference: slow silky input
          (rotateSpeed .12), gentle inertia, slow idle spin. Hovering does NOT
          pause the spin — since the whole shell became the raycast target
          (I26), the cursor rests on the brain most of the time and the pause
          read as "rotation is broken"; the reference also spins while hovered. */}
      <OrbitControls
        enabled={transition === null}
        enablePan={interior}
        screenSpacePanning
        enableDamping
        dampingFactor={0.12}
        rotateSpeed={0.12}
        zoomSpeed={0.25}
        panSpeed={0.25}
        minDistance={interior ? 0.35 : 3.4}
        maxDistance={interior ? 4.5 : 7}
        minPolarAngle={interior ? 0.2 : 0.7}
        maxPolarAngle={interior ? 2.9 : 2.25}
        autoRotate={!reducedMotion && view === "brain" && transition === null}
        autoRotateSpeed={0.5}
        makeDefault
      />
    </>
  );
}
