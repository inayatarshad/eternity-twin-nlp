import * as THREE from "three";

/**
 * Fresnel "hologram" material for the placeholder brain lobes: additive,
 * no depth write — luminous glass edges without transparency-sorting
 * artifacts (docs/ui/04 refracted-light-edge language, budget-friendly).
 */
export interface HologramUniforms {
  color: string;
  /** Rim sharpness; higher = thinner rim. */
  fresnelPower?: number;
  /** Overall brightness multiplier (kept ≤ ~1.4; bloom threshold is above). */
  intensity?: number;
  /** Flat interior fill so the volume reads even face-on. */
  baseFill?: number;
}

export function createHologramMaterial({
  color,
  fresnelPower = 2.6,
  intensity = 1.0,
  baseFill = 0.06,
}: HologramUniforms): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uFresnelPower: { value: fresnelPower },
      uIntensity: { value: intensity },
      uBaseFill: { value: baseFill },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uFresnelPower;
      uniform float uIntensity;
      uniform float uBaseFill;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPosition);
        float facing = clamp(dot(normalize(vWorldNormal), viewDir), 0.0, 1.0);
        float fresnel = pow(1.0 - facing, uFresnelPower);
        float energy = (uBaseFill + fresnel) * uIntensity;
        gl_FragColor = vec4(uColor * energy, energy);
      }
    `,
  });
}
