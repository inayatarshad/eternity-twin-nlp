import * as THREE from "three";
import { LOBES } from "@/lib/lobes";

/**
 * X-ray brain material — adapted from victors1681/3dbrain (xRay.vert/frag):
 * screen-space fresnel `pow(c - |dot(n, z)|, p)` with the repo's constants.
 *
 * Region highlighting: every vertex carries an `aLobe` attribute (0–4 for
 * the five cortical lobes, 5 = unassigned) baked by XRayBrain from the
 * anatomical geometry itself, so an attended lobe lights up as an ACTUAL
 * brain area, not an overlay shape. `uLobeBoost[i]` drives a FLAT regional
 * fill (independent of fresnel) so the whole region reads as highlighted,
 * not just its silhouette edge — plus `uThemeLight` pushes the fill harder
 * on the pale backdrop, where additive blending needs more headroom to read.
 */

export const CORTICAL_LOBES = LOBES.filter((l) => l.id !== "core");

export function createXRayMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uC: { value: 0.9 },
      uP: { value: 6.7 },
      uGlowColor: { value: new THREE.Color("#84ccff") },
      uTime: { value: 0 },
      uScanEnabled: { value: 1 },
      uThemeLight: { value: 0 },
      uLobeColor: {
        value: CORTICAL_LOBES.map((l) => new THREE.Color(l.color)),
      },
      uLobeBoost: { value: new Float32Array(CORTICAL_LOBES.length) },
    },
    vertexShader: /* glsl */ `
      attribute float aLobe;
      varying float vIntensity;
      varying vec3 vWorldPosition;
      varying float vLobe;
      uniform float uC;
      uniform float uP;
      void main() {
        vLobe = aLobe;
        vec3 n = normalize(normalMatrix * normal);
        vIntensity = pow(max(uC - abs(dot(n, vec3(0.0, 0.0, 1.0))), 0.0), uP);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uGlowColor;
      uniform float uTime;
      uniform float uScanEnabled;
      uniform float uThemeLight;
      uniform vec3 uLobeColor[5];
      uniform float uLobeBoost[5];
      varying float vIntensity;
      varying vec3 vWorldPosition;
      varying float vLobe;
      void main() {
        // this fragment's lobe + how attended it is (0 idle .. 1 hovered ..
        // >1 mid activation-flash)
        int lobe = int(vLobe + 0.5);
        float boost = 0.0;
        vec3 lobeColor = uGlowColor;
        if (lobe >= 0 && lobe < 5) {
          boost = uLobeBoost[lobe];
          lobeColor = uLobeColor[lobe];
        }

        // DARK: hover recolors the fresnel outline itself — the x-ray rims,
        // folds, and silhouette turn vividly lobe-colored while the interior
        // stays airy (user feedback: vivid outlines, not a solid dark fill).
        // LIGHT: rim tint barely reads against the pale backdrop, so light
        // keeps a gentle flat regional fill instead (validated earlier;
        // stronger pushes blow out under bloom's 0.85 threshold).
        float boostFrac = clamp(boost, 0.0, 1.4);
        float tintAmt = clamp(boostFrac, 0.0, 1.0) * mix(0.9, 0.3, uThemeLight);
        vec3 rimColor = mix(uGlowColor, lobeColor, tintAmt);
        vec3 edgeGlow = rimColor * vIntensity
          * (1.0 + boostFrac * mix(1.5, 0.35, uThemeLight));

        float fillBase = boostFrac * (0.5 + 0.5 * vIntensity);
        float fillMult = mix(0.0, 0.55, uThemeLight);
        vec3 flatFill = lobeColor * fillBase * fillMult;

        vec3 glow = edgeGlow + flatFill;

        // slow upward scan band over world height (repo: scrolling uv band)
        float band = fract(vWorldPosition.y * 0.35 - uTime * 0.08);
        float scan = smoothstep(0.0, 0.06, band) * (1.0 - smoothstep(0.06, 0.16, band));
        glow += uGlowColor * scan * 0.10 * uScanEnabled;

        // softened version of the repo's clamp(cos(t*3), .5, 1.) breath
        float pulse = mix(1.0, clamp(cos(uTime * 1.5) * 0.5 + 0.75, 0.7, 1.0), uScanEnabled);

        float alpha = vIntensity * (1.0 + boostFrac * mix(0.5, 0.2, uThemeLight))
          + boostFrac * mix(0.0, 0.22, uThemeLight);
        gl_FragColor = vec4(glow * pulse, clamp(alpha, 0.0, 1.0) * pulse);
      }
    `,
  });
}
