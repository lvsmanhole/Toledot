// Photographic surfaces. Both materials are MeshStandardMaterial underneath (so lights, shadows,
// image-based lighting and fog all work) with texturing done in world space in the shader:
//   splatMaterial: terrain blending four PBR layers by a per-vertex weight (vec4 attribute "splat");
//                  three layers projected from above, the fourth (rock) triplanar for cliffs, each layer
//                  sampled at two scales to hide tiling.
//   surfaceMaterial: a single PBR set projected triplanar, for buildings, rocks, trunks and cloth, so
//                  simple boxes and cylinders get correctly scaled stone, brick and wood with no UVs.

import * as THREE from "three";

import { pbr } from "./library.js";

const COMMON = /* glsl */ `
  varying vec3 vWPos;
  varying vec3 vWNormal;
  vec3 tpWeights(vec3 n) { vec3 w = pow(abs(n), vec3(4.0)); return w / (w.x + w.y + w.z + 1e-5); }
  // perturb a world normal by a tangent-space normal-map sample for a planar projection along an axis
  vec3 perturb(vec3 n, vec3 tn, int axis, float k) {
    tn = tn * 2.0 - 1.0;
    vec3 off = axis == 0 ? vec3(0.0, tn.y, tn.x) : axis == 1 ? vec3(tn.x, 0.0, tn.y) : vec3(tn.x, tn.y, 0.0);
    return normalize(n + off * k);
  }
  float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
  }
`;

const VERT_COMMON = (extraAttr = "", extraAssign = "") => [
  "#include <common>",
  `#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNormal;\n${extraAttr}`,
  "#include <worldpos_vertex>",
  `#include <worldpos_vertex>
   vec4 wp4 = vec4(transformed, 1.0);
   #ifdef USE_INSTANCING
     wp4 = instanceMatrix * wp4;
   #endif
   wp4 = modelMatrix * wp4;
   vWPos = wp4.xyz;
   vec3 wn = objectNormal;
   #ifdef USE_INSTANCING
     wn = mat3(instanceMatrix) * wn;
   #endif
   vWNormal = normalize(mat3(modelMatrix) * wn);
   ${extraAssign}`,
];

function patchVertex(shader, extraAttr, extraAssign) {
  const [a, b, c, d] = VERT_COMMON(extraAttr, extraAssign);
  shader.vertexShader = shader.vertexShader.replace(a, b).replace(c, d);
}

/**
 * layers: [low, high, wet, rock] texture keys; tiles: world size of one tile per layer;
 * tints: optional [r,g,b] multipliers per layer.
 */
export function splatMaterial({ layers, tiles = [5, 5, 4, 9], tints = null, quality = "high" }) {
  const sets = layers.map((k) => pbr(k));
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 });
  const tint = (i) => new THREE.Color(...(tints?.[i] ?? [1, 1, 1]));
  material.onBeforeCompile = (shader) => {
    sets.forEach((s, i) => {
      shader.uniforms[`tD${i}`] = { value: s.map };
      shader.uniforms[`tN${i}`] = { value: s.normalMap };
      shader.uniforms[`tA${i}`] = { value: s.armMap };
      shader.uniforms[`uTint${i}`] = { value: tint(i) };
    });
    shader.uniforms.uTiles = { value: new THREE.Vector4(...tiles) };
    patchVertex(shader, "attribute vec4 splat;\nvarying vec4 vSplat;", "vSplat = splat;");
    const two = quality === "low" ? "0.0" : "1.0";
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        ${COMMON}
        varying vec4 vSplat;
        uniform sampler2D tD0, tD1, tD2, tD3, tN0, tN1, tN2, tN3, tA0, tA1, tA2, tA3;
        uniform vec3 uTint0, uTint1, uTint2, uTint3;
        uniform vec4 uTiles;
        vec3 twoScale(sampler2D t, vec2 uv) {
          vec3 a = texture2D(t, uv).rgb;
          vec3 b = texture2D(t, uv * 0.19 + 0.37).rgb;
          return mix(a, b, 0.35 * ${two});
        }`)
      .replace("#include <map_fragment>", `
        vec3 nG = normalize(vWNormal);
        vec4 sw = vSplat / max(1e-4, vSplat.x + vSplat.y + vSplat.z + vSplat.w);
        // break up layer borders with noise so they read as natural transitions
        float jitter = vnoise(vWPos.xz * 0.35) * 0.5 + vnoise(vWPos.xz * 1.7) * 0.25;
        sw.xyz *= 0.75 + jitter;
        sw /= max(1e-4, sw.x + sw.y + sw.z + sw.w);
        vec2 uv0 = vWPos.xz / uTiles.x;
        vec2 uv1 = vWPos.xz / uTiles.y;
        vec2 uv2 = vWPos.xz / uTiles.z;
        vec3 tw = tpWeights(nG);
        vec3 rx = texture2D(tD3, vWPos.zy / uTiles.w).rgb;
        vec3 ry = texture2D(tD3, vWPos.xz / uTiles.w).rgb;
        vec3 rz = texture2D(tD3, vWPos.xy / uTiles.w).rgb;
        vec3 rockC = (rx * tw.x + ry * tw.y + rz * tw.z) * uTint3;
        vec3 albedo = twoScale(tD0, uv0) * uTint0 * sw.x + twoScale(tD1, uv1) * uTint1 * sw.y + twoScale(tD2, uv2) * uTint2 * sw.z + rockC * sw.w;
        // large-scale brightness variation: no two hillsides alike
        albedo *= (0.82 + 0.36 * vnoise(vWPos.xz * 0.012)) * 0.78;
        vec3 arm = texture2D(tA0, uv0).rgb * sw.x + texture2D(tA1, uv1).rgb * sw.y + texture2D(tA2, uv2).rgb * sw.z
          + (texture2D(tA3, vWPos.zy / uTiles.w).rgb * tw.x + texture2D(tA3, vWPos.xz / uTiles.w).rgb * tw.y + texture2D(tA3, vWPos.xy / uTiles.w).rgb * tw.z) * sw.w;
        diffuseColor.rgb *= albedo * mix(1.0, arm.r, 0.7);
        vec3 nP = perturb(nG, texture2D(tN0, uv0).rgb, 1, 0.9) * sw.x + perturb(nG, texture2D(tN1, uv1).rgb, 1, 0.9) * sw.y + perturb(nG, texture2D(tN2, uv2).rgb, 1, 0.9) * sw.z
          + (perturb(nG, texture2D(tN3, vWPos.zy / uTiles.w).rgb, 0, 1.2) * tw.x + perturb(nG, texture2D(tN3, vWPos.xz / uTiles.w).rgb, 1, 1.2) * tw.y + perturb(nG, texture2D(tN3, vWPos.xy / uTiles.w).rgb, 2, 1.2) * tw.z) * sw.w;
        vec3 splatNormal = normalize(nP);
        float splatRough = arm.g;`)
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness * clamp(splatRough, 0.35, 1.0);")
      .replace("#include <normal_fragment_maps>", "normal = normalize((viewMatrix * vec4(splatNormal, 0.0)).xyz);");
  };
  material.customProgramCacheKey = () => `splat-${layers.join("-")}-${quality}`;
  return material;
}

/** One PBR set projected triplanar in world space. tile: world size of one repeat. */
export function surfaceMaterial(key, { tile = 3, tint = [1, 1, 1], roughness = 1, metalness = 0, normalScale = 1, emissive = 0x000000, emissiveIntensity = 0, side = THREE.FrontSide, local = false } = {}) {
  const s = pbr(key);
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(...tint), roughness, metalness, emissive, emissiveIntensity, side });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.tD = { value: s.map };
    shader.uniforms.tN = { value: s.normalMap };
    shader.uniforms.tA = { value: s.armMap };
    shader.uniforms.uTile = { value: tile };
    shader.uniforms.uNScale = { value: normalScale };
    patchVertex(shader, "", local ? "vWPos = position;" : "");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${COMMON}\nuniform sampler2D tD, tN, tA;\nuniform float uTile, uNScale;`)
      .replace("#include <map_fragment>", `
        vec3 nG = normalize(vWNormal);
        vec3 tw = tpWeights(nG);
        vec3 P = vWPos / uTile;
        vec3 alb = texture2D(tD, P.zy).rgb * tw.x + texture2D(tD, P.xz).rgb * tw.y + texture2D(tD, P.xy).rgb * tw.z;
        vec3 arm = texture2D(tA, P.zy).rgb * tw.x + texture2D(tA, P.xz).rgb * tw.y + texture2D(tA, P.xy).rgb * tw.z;
        alb *= 0.88 + 0.24 * vnoise(vWPos.xz * 0.07 + vWPos.y * 0.05);
        diffuseColor.rgb *= alb * mix(1.0, arm.r, 0.8);
        vec3 surfNormal = normalize(perturb(nG, texture2D(tN, P.zy).rgb, 0, uNScale) * tw.x + perturb(nG, texture2D(tN, P.xz).rgb, 1, uNScale) * tw.y + perturb(nG, texture2D(tN, P.xy).rgb, 2, uNScale) * tw.z);
        float surfRough = arm.g;`)
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = roughness * clamp(surfRough, 0.2, 1.0);")
      .replace("#include <metalnessmap_fragment>", "float metalnessFactor = metalness * max(arm.b, 0.5);")
      .replace("#include <normal_fragment_maps>", "normal = normalize((viewMatrix * vec4(surfNormal, 0.0)).xyz);");
  };
  material.customProgramCacheKey = () => `surface-${key}-${local}`;
  return material;
}

// terrain layer sets per palette: [low, high, wet, rock] and tints
export const TERRAIN_LAYERS = {
  garden: { layers: ["grass", "dryGrass", "mud", "rock"], tints: [[0.95, 1.05, 0.85], [1, 1, 0.95], [0.9, 0.88, 0.85], [1, 1, 1]] },
  steppe: { layers: ["dryGrass", "dryGround", "mud", "rock"], tints: [[0.95, 0.92, 0.8], [0.85, 0.78, 0.68], [1, 1, 1], [1, 1, 1]] },
  desert: { layers: ["sand", "dryGround", "mud", "cliff"], tints: [[1.08, 0.98, 0.86], [1.05, 0.95, 0.85], [1, 1, 1], [1.05, 0.95, 0.85]] },
  sinai: { layers: ["dryGround", "cliff", "mud", "cliff"], tints: [[1.05, 0.88, 0.78], [1.0, 0.85, 0.75], [1, 1, 1], [0.95, 0.8, 0.72]] },
  judea: { layers: ["dryGround", "dryGrass", "grass", "cliff"], tints: [[0.72, 0.64, 0.52], [0.78, 0.72, 0.56], [0.9, 1, 0.85], [0.9, 0.85, 0.78]] },
  fields: { layers: ["dryGrass", "dryGround", "mud", "rock"], tints: [[1.15, 1.0, 0.7], [1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  ashen: { layers: ["burned", "burned", "mud", "darkRock"], tints: [[0.7, 0.68, 0.66], [0.8, 0.78, 0.76], [0.7, 0.7, 0.7], [0.8, 0.8, 0.8]] },
  bone: { layers: ["cracked", "sand", "cracked", "cliff"], tints: [[1.1, 1.06, 0.98], [1.05, 1.0, 0.92], [1, 1, 1], [1, 1, 1]] },
  mesopotamia: { layers: ["cracked", "dryGround", "mud", "rock"], tints: [[1.05, 0.98, 0.88], [1, 1, 1], [0.9, 0.95, 0.85], [1, 1, 1]] },
};

// building and object surfaces
export const SURFACES = {
  mud: () => surfaceMaterial("mudBrick", { tile: 2.4, tint: [0.92, 0.84, 0.74] }),
  mudDark: () => surfaceMaterial("plaster", { tile: 3, tint: [0.78, 0.66, 0.52] }),
  limestone: () => surfaceMaterial("limestone", { tile: 3.2, tint: [0.78, 0.72, 0.62] }),
  sandstone: () => surfaceMaterial("sandstone", { tile: 3.2, tint: [0.9, 0.82, 0.7] }),
  basalt: () => surfaceMaterial("cliff", { tile: 2, tint: [0.25, 0.23, 0.21] }),
  wood: () => surfaceMaterial("planks", { tile: 2.5, tint: [0.9, 0.8, 0.7] }),
  darkWood: () => surfaceMaterial("planks", { tile: 2.5, tint: [0.5, 0.42, 0.35] }),
  bark: () => surfaceMaterial("bark", { tile: 1.6 }),
  rock: () => surfaceMaterial("cliff", { tile: 4 }),
  linen: (tint = [0.85, 0.8, 0.7]) => surfaceMaterial("linen", { tile: 0.8, tint, side: THREE.DoubleSide, local: true }),
};
