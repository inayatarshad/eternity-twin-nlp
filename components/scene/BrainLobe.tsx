"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import type { LobeDefinition, LobeId } from "@/lib/lobes";
import { fbm3 } from "@/lib/scene/noise";
import { createHologramMaterial } from "@/components/scene/hologramMaterial";
import { useSceneStore } from "@/lib/state/scene";

export type LobeVisualState = "idle" | "attended" | "dimmed";

interface BrainLobeProps {
  lobe: LobeDefinition;
  seed: number;
  state: LobeVisualState;
  /** Increment to fire one activation flash. */
  pulseCount: number;
  reducedMotion: boolean;
  mode: "solid" | "highlight";
  onActivate: (id: LobeId) => void;
}

/** Attention multipliers over the lobe's base intensity (docs/ui/05 timings).
 * `solid` = the lobes ARE the brain (original placeholder look);
 * `highlight` = lobes are near-invisible region overlays above the x-ray
 * brain, igniting on attention (victors1681/3dbrain restyle). */
const STATE_MULTIPLIER: Record<
  "solid" | "highlight",
  Record<LobeVisualState, number>
> = {
  solid: { idle: 1, attended: 1.35, dimmed: 0.85 },
  highlight: { idle: 0.1, attended: 1.7, dimmed: 0.02 },
};
const PULSE_BOOST = 2.4;
const TAU_ATTACK = 0.03; // reaches target well inside 100 ms
const TAU_DECAY = 0.09; // settles inside ~250 ms

function buildLobeGeometry(
  lobe: LobeDefinition,
  seed: number,
): THREE.BufferGeometry {
  const geometry = new THREE.IcosahedronGeometry(1, 24);
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const scale = new THREE.Vector3(...lobe.scale);
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    const n = v.clone().normalize();
    const lump = fbm3(n.x * 1.8 + seed, n.y * 1.8 + seed, n.z * 1.8 + seed, 3);
    const wrinkle = fbm3(n.x * 6 + seed, n.y * 6 + seed, n.z * 6 + seed, 2);
    v.copy(n).multiplyScalar(1 + lump * 0.12 + wrinkle * 0.035);
    v.multiply(scale);
    positions.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * Interactive lobe (docs/ui/06 BrainLobe): raycast target + attention-driven
 * emissive state. Cortical lobes render hologram shells; the core renders its
 * nucleus. All intensity changes go through one asymmetric lerp so hover
 * attack ≤100 ms and decay ≈250 ms — snapped under reduced motion.
 */
export function BrainLobe({
  lobe,
  seed,
  state,
  pulseCount,
  reducedMotion,
  mode,
  onActivate,
}: BrainLobeProps) {
  const gl = useThree((s) => s.gl);
  const setAttended = useSceneStore((s) => s.setAttended);
  const isCore = lobe.id === "core";
  const baseIntensity =
    mode === "highlight" && !isCore
      ? 0.55
      : isCore
        ? 0.9
        : lobe.id === "limbic"
          ? 0.85
          : 0.7;

  const geometry = useMemo(
    () => (isCore ? undefined : buildLobeGeometry(lobe, seed)),
    [isCore, lobe, seed],
  );
  const material = useMemo(
    () =>
      createHologramMaterial({
        color: lobe.color,
        intensity: baseIntensity,
        fresnelPower: isCore ? 1.8 : 2.6,
        baseFill: isCore ? 0.1 : 0.06,
      }),
    [lobe, baseIntensity, isCore],
  );
  const wireMaterial = useMemo(
    () =>
      isCore || mode === "highlight"
        ? null
        : new THREE.MeshBasicMaterial({
            color: lobe.color,
            wireframe: true,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
    [isCore, mode, lobe],
  );

  const current = useRef(baseIntensity);
  const lastPulse = useRef(pulseCount);

  useEffect(() => {
    if (pulseCount !== lastPulse.current) {
      lastPulse.current = pulseCount;
      current.current = baseIntensity * PULSE_BOOST; // flash, then decay lerp
    }
  }, [pulseCount, baseIntensity]);

  useFrame((_, delta) => {
    const target = baseIntensity * STATE_MULTIPLIER[mode][state];
    const rising = target > current.current;
    const tau = rising ? TAU_ATTACK : TAU_DECAY;
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta / tau);
    current.current += (target - current.current) * k;
    material.uniforms.uIntensity!.value = current.current;
  });

  // interactions only apply at brain level — inside a lobe the (foggy,
  // behind-camera) brain meshes must not steal pointer events
  const atBrainView = () => useSceneStore.getState().view === "brain";

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!atBrainView()) return;
    gl.domElement.style.cursor = "pointer";
    setAttended(lobe.id);
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    gl.domElement.style.cursor = "";
    setAttended(null);
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!atBrainView()) return;
    onActivate(lobe.id);
  };

  if (isCore) {
    return (
      <group
        name="lobe-core"
        position={lobe.position}
        onPointerOver={over}
        onPointerOut={out}
        onClick={click}
      >
        <mesh>
          <icosahedronGeometry args={[lobe.scale[0], 4]} />
          <meshBasicMaterial
            color={new THREE.Color(lobe.color).multiplyScalar(1.6)}
            toneMapped={false}
          />
        </mesh>
        <mesh scale={1.9} material={material}>
          <icosahedronGeometry args={[lobe.scale[0], 3]} />
        </mesh>
      </group>
    );
  }

  const positions: Array<[number, number, number]> = lobe.mirrored
    ? [lobe.position, [-lobe.position[0], lobe.position[1], lobe.position[2]]]
    : [lobe.position];

  return (
    <group
      name={`lobe-${lobe.id}`}
      onPointerOver={over}
      onPointerOut={out}
      onClick={click}
    >
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh geometry={geometry} material={material} />
          {wireMaterial ? (
            <mesh geometry={geometry} material={wireMaterial} scale={1.002} />
          ) : null}
        </group>
      ))}
    </group>
  );
}
