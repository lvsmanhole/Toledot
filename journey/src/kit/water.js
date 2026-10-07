// Water surfaces: rivers/lakes (flat, flowing) and seas (vertex waves). Fog-aware shaders.

import * as THREE from "three";

import { NOISE } from "../engine/noise.js";

export function createWater({ size = 800, segments = 1, wave = 0, chop = 1, flow = 0.6, flowDir = [0, 1], deep = [0.03, 0.07, 0.08], level = 0, opacity = 1 } = {}) {
  // a lit surface: the photographed sky of the scene is what it reflects (through the environment map),
  // with the Fresnel rise toward the horizon, the sun's glitter from the real sun light, ripples in the
  // normals and swell in the vertices
  const uniforms = {
    uTime: { value: 0 },
    uWave: { value: wave },
    uChop: { value: chop },
    uFlow: { value: flow },
    uFlowDir: { value: new THREE.Vector2(...flowDir) },
    uOpacity: { value: opacity },
    uSky: { value: new THREE.Color(0.6, 0.68, 0.76) }, // kept for callers; the sky now comes from the scene
    uDeep: { value: new THREE.Color(...deep) },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uSun: { value: new THREE.Vector3(0, 0.3, -1) },
  };
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0, transparent: opacity < 1, opacity });
  material.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
        uniform float uTime, uWave, uChop;
        varying vec3 vWaterW;
        float waveH(vec2 p) {
          float h = 0.0;
          h += sin(dot(p, vec2(0.08, 0.03)) + uTime * 0.9) * 1.0;
          h += sin(dot(p, vec2(-0.05, 0.11)) + uTime * 1.3) * 0.6;
          h += sin(dot(p, vec2(0.17, -0.07)) + uTime * 1.9) * 0.3 * uChop;
          h += sin(dot(p, vec2(0.31, 0.22)) + uTime * 2.6) * 0.15 * uChop;
          return h * uWave;
        }`)
      .replace("#include <beginnormal_vertex>", `
        vec3 wBase = (modelMatrix * vec4(position, 1.0)).xyz;
        float wh = waveH(wBase.xz);
        float we = 0.6;
        vec3 objectNormal = normalize(vec3(wh - waveH(wBase.xz + vec2(we, 0.0)), we, wh - waveH(wBase.xz + vec2(0.0, we))));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3(tangent.xyz);
        #endif`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        transformed.y += wh;
        vWaterW = wBase + vec3(0.0, wh, 0.0);`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform float uTime, uFlow;
        uniform vec2 uFlowDir;
        uniform vec3 uDeep, uTint;
        varying vec3 vWaterW;
        ${NOISE}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        diffuseColor.rgb = uDeep * uTint;`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>
        vec2 wp = vWaterW.xz * 0.16;
        vec2 wf = uFlowDir * uTime * uFlow;
        float rx = snoise(vec3(wp + wf, uTime * 0.2)) + 0.5 * snoise(vec3(wp * 2.7 + wf * 1.5, uTime * 0.35));
        float rz = snoise(vec3(wp + 7.0 + wf, uTime * 0.2)) + 0.5 * snoise(vec3(wp * 3.1 - wf, uTime * 0.3 + 4.0));
        normal = normalize(normal + (viewMatrix * vec4(rx * 0.07, 0.0, rz * 0.07, 0.0)).xyz);`);
  };
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = level;
  mesh.receiveShadow = true;
  return {
    mesh,
    material,
    /** Sync with the atmosphere each frame. */
    update({ time, sunDir }) {
      uniforms.uTime.value = time;
      uniforms.uSun.value.copy(sunDir);
    },
  };
}
