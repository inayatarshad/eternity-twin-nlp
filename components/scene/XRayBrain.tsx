"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { createXRayMaterial, CORTICAL_LOBES } from "@/components/scene/xrayMaterial";
import {
  bakeShimmerAttributes,
  createShimmerPointsMaterial,
} from "@/components/scene/shimmerPoints";
import { FLOOR_Y } from "@/components/scene/BrainShadow";
import { useSceneStore } from "@/lib/state/scene";
import type { LobeId } from "@/lib/lobes";
import type { Theme } from "@/lib/state/animation";

/**
 * The anatomical x-ray brain (look adapted from victors1681/3dbrain).
 * The lobes are ACTUAL brain regions: every vertex of the shell (and every
 * synapse point) is classified into a cognitive lobe by anatomical position,
 * so attention lights up real anatomy — and the shell itself is the raycast
 * target (hover a region, click to enter). Assets: public/models/*.obj
 * (source repo has no license file — Open Question #11).
 */

const TARGET_SIZE = 3.6; // world units, matches the lobe-proxy volume
const CENTER_OFFSET_Y = 0.05;
const SHELL_ROTATION_Y = Math.PI / 2; // mesh A–P axis is X; our layout runs on Z

const TAU_ATTACK = 0.03;
const TAU_DECAY = 0.09;
const PULSE_BOOST = 2.2;

// light mode pushes toward white (the reference's bright brain is bloom-white
// on the pale backdrop; additive blending needs brighter-than-background)
const GLOW: Record<Theme, string> = { dark: "#84ccff", light: "#e8f2ff" };
const POINTS: Record<Theme, string> = { dark: "#cfe9ff", light: "#ffffff" };
const POINTS_OPACITY: Record<Theme, number> = { dark: 0.42, light: 0.8 };
const POINTS_SIZE: Record<Theme, number> = { dark: 0.022, light: 0.03 };

// the repo's floor shadow is the particle cloud itself cast onto the plane
// (systemPoints.castShadow) — we get the identical stippled brain footprint
// by projecting the cloud flat onto the floor as a second points pass
const SHADOW_POINTS: Record<Theme, { color: string; opacity: number }> = {
  light: { color: "#5d6d94", opacity: 0.45 },
  dark: { color: "#202b4f", opacity: 0.6 },
};

interface NormalizeResult {
  group: THREE.Group;
  /** local → world transform pieces, for classification math */
  scale: number;
  center: THREE.Vector3;
  rotationY: number;
}

function normalizeInto(object: THREE.Object3D, rotationY = 0): NormalizeResult {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z);
  const group = new THREE.Group();
  group.add(object);
  object.position.copy(center).multiplyScalar(-1);
  group.scale.setScalar(scale);
  group.position.y = CENTER_OFFSET_Y;
  group.rotation.y = rotationY;
  return { group, scale, center, rotationY };
}

/** Local vertex → world position under the normalize transform. */
function toWorld(
  v: THREE.Vector3,
  { scale, center, rotationY }: Omit<NormalizeResult, "group">,
): THREE.Vector3 {
  const p = v.clone().sub(center).multiplyScalar(scale);
  p.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
  p.y += CENTER_OFFSET_Y;
  return p;
}

/** Classify a world-space point into a cortical lobe (0–4) by normalized
 * ellipsoid distance — mirrored lobes match both hemispheres via |x|. */
function classify(p: THREE.Vector3): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < CORTICAL_LOBES.length; i++) {
    const lobe = CORTICAL_LOBES[i]!;
    const px = lobe.mirrored ? Math.abs(p.x) : p.x;
    const cx = lobe.mirrored ? Math.abs(lobe.position[0]) : lobe.position[0];
    const dx = (px - cx) / lobe.scale[0];
    const dy = (p.y - lobe.position[1]) / lobe.scale[1];
    const dz = (p.z - lobe.position[2]) / lobe.scale[2];
    const d = dx * dx + dy * dy + dz * dz;
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function bakeLobeAttribute(
  geometry: THREE.BufferGeometry,
  transform: Omit<NormalizeResult, "group">,
): void {
  const positions = geometry.attributes.position as THREE.BufferAttribute;
  const lobeAttr = new Float32Array(positions.count);
  const v = new THREE.Vector3();
  for (let i = 0; i < positions.count; i++) {
    v.fromBufferAttribute(positions, i);
    lobeAttr[i] = classify(toWorld(v, transform));
  }
  geometry.setAttribute("aLobe", new THREE.BufferAttribute(lobeAttr, 1));
}

function makeSoftCircleTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

interface XRayBrainProps {
  reducedMotion: boolean;
  theme: Theme;
  onActivate: (id: LobeId) => void;
}

export function XRayBrain({ reducedMotion, theme, onActivate }: XRayBrainProps) {
  const gl = useThree((s) => s.gl);
  const meshObj = useLoader(OBJLoader, "/models/brain_mesh.obj");
  const cloudObj = useLoader(OBJLoader, "/models/brain_vertex_low.obj");

  const setAttended = useSceneStore((s) => s.setAttended);

  const material = useMemo(() => createXRayMaterial(), []);

  const shell = useMemo(() => {
    const clone = meshObj.clone(true);
    const meshes: THREE.Mesh[] = [];
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = material;
        meshes.push(child);
      }
    });
    const result = normalizeInto(clone, SHELL_ROTATION_Y);
    for (const mesh of meshes) bakeLobeAttribute(mesh.geometry, result);
    return result.group;
  }, [meshObj, material]);

  const shimmer = useMemo(() => {
    let geometry: THREE.BufferGeometry | null = null;
    cloudObj.traverse((child) => {
      const geo = (child as THREE.Mesh).geometry as
        | THREE.BufferGeometry
        | undefined;
      if (geo?.attributes.position && !geometry) geometry = geo;
    });
    if (!geometry) return null;
    const cloudGeometry: THREE.BufferGeometry = geometry;
    bakeShimmerAttributes(cloudGeometry, 0x51a2);
    const map = makeSoftCircleTexture();
    const handle = createShimmerPointsMaterial(map);
    const points = new THREE.Points(cloudGeometry, handle.material);
    points.raycast = () => {}; // shell owns picking
    const normalized = normalizeInto(points);

    // stippled floor shadow: every cloud point projected straight down onto
    // the floor plane, exactly like the repo's per-point cast shadow
    const src = cloudGeometry.attributes.position as THREE.BufferAttribute;
    const flat = new Float32Array(src.count * 3);
    const { scale, center } = normalized;
    for (let i = 0; i < src.count; i++) {
      flat[i * 3] = (src.getX(i) - center.x) * scale * 1.04;
      flat[i * 3 + 1] = FLOOR_Y;
      flat[i * 3 + 2] = (src.getZ(i) - center.z) * scale * 1.04 + 0.15;
    }
    const shadowGeometry = new THREE.BufferGeometry();
    shadowGeometry.setAttribute("position", new THREE.BufferAttribute(flat, 3));
    const shadowMaterial = new THREE.PointsMaterial({
      color: SHADOW_POINTS.dark.color,
      size: 0.014,
      map: makeSoftCircleTexture(),
      transparent: true,
      opacity: SHADOW_POINTS.dark.opacity,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const shadowPoints = new THREE.Points(shadowGeometry, shadowMaterial);
    shadowPoints.raycast = () => {};

    return { group: normalized.group, handle, shadowPoints, shadowMaterial };
  }, [cloudObj]);

  // ---- attention: lerp per-lobe boosts; flash on activation pulse ----
  const boosts = useRef(new Float32Array(CORTICAL_LOBES.length));
  const lastPulseCount = useRef(0);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    const { attended, pulse } = useSceneStore.getState();
    const uBoost = material.uniforms.uLobeBoost!.value as Float32Array;

    if (pulse && pulse.count !== lastPulseCount.current) {
      lastPulseCount.current = pulse.count;
      const idx = CORTICAL_LOBES.findIndex((l) => l.id === pulse.id);
      if (idx >= 0) boosts.current[idx] = PULSE_BOOST;
    }

    for (let i = 0; i < CORTICAL_LOBES.length; i++) {
      const target = attended === CORTICAL_LOBES[i]!.id ? 1 : 0;
      const rising = target > boosts.current[i]!;
      const k = reducedMotion
        ? 1
        : 1 - Math.exp(-delta / (rising ? TAU_ATTACK : TAU_DECAY));
      boosts.current[i]! += (target - boosts.current[i]!) * k;
      uBoost[i] = boosts.current[i]!;
    }

    // theme colors (cheap set-per-frame keeps it robust to toggling)
    (material.uniforms.uGlowColor!.value as THREE.Color).set(GLOW[theme]);
    material.uniforms.uThemeLight!.value = theme === "light" ? 1 : 0;
    if (shimmer) {
      shimmer.handle.material.color.set(POINTS[theme]);
      shimmer.handle.material.opacity = POINTS_OPACITY[theme];
      shimmer.handle.material.size = POINTS_SIZE[theme];
      shimmer.shadowMaterial.color.set(SHADOW_POINTS[theme].color);
      shimmer.shadowMaterial.opacity = SHADOW_POINTS[theme].opacity;
    }

    if (reducedMotion) {
      material.uniforms.uScanEnabled!.value = 0;
      shimmer?.handle.setTime(0);
      return;
    }
    material.uniforms.uScanEnabled!.value = 1;
    timeRef.current += delta;
    material.uniforms.uTime!.value = timeRef.current;
    shimmer?.handle.setTime(timeRef.current);
  });

  // ---- the shell IS the interactive surface: face → vertex → lobe ----
  const lobeFromIntersection = (
    e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,
  ): LobeId | null => {
    const face = e.face;
    const obj = e.object as THREE.Mesh;
    const attr = obj.geometry?.getAttribute("aLobe");
    if (!face || !attr) return null;
    const idx = Math.round(attr.getX(face.a));
    return CORTICAL_LOBES[idx]?.id ?? null;
  };
  const atBrainView = () => useSceneStore.getState().view === "brain";

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!atBrainView()) return;
    const id = lobeFromIntersection(e);
    if (id && useSceneStore.getState().attended !== id) {
      setAttended(id);
      gl.domElement.style.cursor = "pointer";
    }
  };
  const onOut = () => {
    gl.domElement.style.cursor = "";
    setAttended(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!atBrainView()) return;
    const id = lobeFromIntersection(e);
    if (id) onActivate(id);
  };

  return (
    <group name="xray-brain">
      <primitive
        object={shell}
        onPointerMove={onMove}
        onPointerOut={onOut}
        onClick={onClick}
      />
      {shimmer ? <primitive object={shimmer.group} /> : null}
      {shimmer ? <primitive object={shimmer.shadowPoints} /> : null}
    </group>
  );
}
