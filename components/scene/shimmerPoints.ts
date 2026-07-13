import * as THREE from "three";
import { mulberry32 } from "@/lib/rand";

/**
 * Per-particle twinkle for the synapse point cloud (docs/ui/05 particle
 * rules) — replicates the sparkle look of the victors1681/3dbrain reference
 * (a BAS-driven per-point animation there) by grafting a size+alpha twinkle
 * onto the stock PointsMaterial via onBeforeCompile, so we keep its built-in
 * size-attenuation/map pipeline and only add the animated part.
 */

export interface ShimmerHandle {
  material: THREE.PointsMaterial;
  /** Call every frame with elapsed seconds (pass a constant to freeze). */
  setTime: (t: number) => void;
}

export function bakeShimmerAttributes(
  geometry: THREE.BufferGeometry,
  seed: number,
): void {
  const count = geometry.attributes.position!.count;
  const rand = mulberry32(seed);
  const phase = new Float32Array(count);
  const speed = new Float32Array(count);
  const sizeMul = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    phase[i] = rand() * Math.PI * 2;
    speed[i] = 0.6 + rand() * 2.2;
    // biased toward small, with occasional bright sparkle outliers —
    // matches the reference's mix of dim dust and a few standout points
    sizeMul[i] = 0.35 + Math.pow(rand(), 3) * 2.6;
  }
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
  geometry.setAttribute("aSizeMul", new THREE.BufferAttribute(sizeMul, 1));
}

export function createShimmerPointsMaterial(map: THREE.Texture): ShimmerHandle {
  const material = new THREE.PointsMaterial({
    size: 0.022,
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  let compiledUniforms: { uTime: { value: number } } | null = null;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };

    shader.vertexShader =
      "attribute float aPhase;\nattribute float aSpeed;\nattribute float aSizeMul;\nuniform float uTime;\nvarying float vTwinkle;\n" +
      shader.vertexShader
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\n\tvTwinkle = 0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));",
        )
        .replace(
          "gl_PointSize = size;",
          // deep size pulse: points visibly swell and shrink — this reads as
          // glitter even where additive color saturates (pale light-mode bg)
          "gl_PointSize = size * aSizeMul * (0.3 + 1.0 * vTwinkle);",
        );

    shader.fragmentShader =
      "varying float vTwinkle;\n" +
      shader.fragmentShader.replace(
        "#include <alphatest_fragment>",
        "diffuseColor.a *= (0.18 + 0.82 * vTwinkle);\n\t#include <alphatest_fragment>",
      );

    compiledUniforms = shader.uniforms as unknown as { uTime: { value: number } };
  };

  return {
    material,
    setTime: (t) => {
      if (compiledUniforms) compiledUniforms.uTime.value = t;
    },
  };
}
