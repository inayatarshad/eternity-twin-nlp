"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface WarpStreaksProps {
  /** Mutable 0–1 transition progress, driven by the TransitionDirector. */
  progressRef: React.MutableRefObject<number>;
  color: string;
  kind: "enter" | "exit";
}

const STREAK_COUNT = 240;
const SPREAD = 2.2;
const NEAR_Z = -0.6;
const FAR_Z = -7;
const LENGTH = 1.6;

/** Deterministic PRNG (mulberry32) — render-pure and stable across remounts. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Camera-locked streak burst — the "neural pathway" beat of the warp dive
 * (reference: hand_focuses into the brain.mp4). One LineSegments draw call,
 * pooled geometry, alive only while a transition is mounted (docs/ui/05).
 */
export function WarpStreaks({ progressRef, color, kind }: WarpStreaksProps) {
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const rand = mulberry32(0xe7e12);
    const positions = new Float32Array(STREAK_COUNT * 6);
    for (let i = 0; i < STREAK_COUNT; i++) {
      const angle = rand() * Math.PI * 2;
      const radius = 0.25 + rand() * SPREAD;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      const z = NEAR_Z + rand() * (FAR_Z - NEAR_Z);
      positions.set([x, y, z, x, y, z - LENGTH], i * 6);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, []);

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: false,
      }),
    [color],
  );

  useFrame(() => {
    if (!group.current) return;
    // lock to the camera
    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);
    // envelope: silent at the ends, peak mid-flight
    const p = progressRef.current;
    const window = Math.min(1, Math.max(0, (p - 0.3) / 0.55));
    const peak = kind === "enter" ? 0.8 : 0.35;
    material.opacity = Math.sin(window * Math.PI) * peak;
    // streaks rush past faster as the dive deepens
    group.current.scale.z = 1 + p * 1.5;
  });

  return (
    <group ref={group} renderOrder={20}>
      <lineSegments geometry={geometry} material={material} />
    </group>
  );
}
