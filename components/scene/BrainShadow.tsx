"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Theme } from "@/lib/state/animation";

/**
 * Soft pooled base under the brain's dotted floor shadow. The stippled
 * brain-footprint itself (the repo's signature look — their particle system
 * literally casts per-point shadows onto a floor plane) is rendered by
 * XRayBrain, which owns the vertex-cloud geometry; this disc supplies the
 * soft darkening beneath it, like the repo's faint receiving plane.
 *
 * Sits just below the shell's lowest point and safely inside the default
 * camera frustum (planes below ~-2 ride the frustum edge and clip).
 */

export const FLOOR_Y = -1.6;

function makeRadialTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.55, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

const SHADOW_COLOR: Record<Theme, string> = {
  light: "#48587f",
  dark: "#1c274a",
};
const SHADOW_OPACITY: Record<Theme, number> = { light: 0.3, dark: 0.55 };

export function BrainShadow({ theme }: { theme: Theme }) {
  const map = useMemo(() => makeRadialTexture(), []);
  return (
    <mesh
      name="brain-shadow-base"
      rotation-x={-Math.PI / 2}
      position={[0, FLOOR_Y - 0.02, 0.15]}
    >
      <planeGeometry args={[5, 3.4]} />
      <meshBasicMaterial
        map={map}
        color={SHADOW_COLOR[theme]}
        transparent
        opacity={SHADOW_OPACITY[theme]}
        depthWrite={false}
      />
    </mesh>
  );
}
