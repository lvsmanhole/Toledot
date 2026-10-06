// Water surfaces: rivers/lakes (flat, flowing) and seas (vertex waves). Fog-aware shaders.

import * as THREE from "three";

import { NOISE } from "../engine/noise.js";

const VERTEX = /* glsl */ `
  uniform float uTime, uWave, uChop;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  #include <fog_pars_vertex>
  float waveH(vec2 p) {
    float h = 0.0;
    h += sin(dot(p, vec2(0.08, 0.03)) + uTime * 0.9) * 1.0;
    h += sin(dot(p, vec2(-0.05, 0.11)) + uTime * 1.3) * 0.6;
    h += sin(dot(p, vec2(0.17, -0.07)) + uTime * 1.9) * 0.3 * uChop;
    h += sin(dot(p, vec2(0.31, 0.22)) + uTime * 2.6) * 0.15 * uChop;
    return h * uWave;
  }
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float h = waveH(w.xz);
    float e = 0.6;
    vec3 n = normalize(vec3(h - waveH(w.xz + vec2(e, 0.0)), e, h - waveH(w.xz + vec2(0.0, e))));
    w.y += h;
    vWorld = w.xyz;
    vNormalW = n;
    vec4 mvPosition = viewMatrix * w;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uTime, uFlow, uOpacity;
  uniform vec3 uSky, uDeep, uSun, uTint;
  uniform vec2 uFlowDir;
  varying vec3 vWorld;
  varying vec3 vNormalW;
  #include <fog_pars_fragment>
  ${NOISE}
  void main() {
    vec2 p = vWorld.xz * 0.16;
    vec2 flow = uFlowDir * uTime * uFlow;
    float nx = snoise(vec3(p + flow, uTime * 0.2)) + 0.5 * snoise(vec3(p * 2.7 + flow * 1.5, uTime * 0.35));
    float nz = snoise(vec3(p + 7.0 + flow, uTime * 0.2));
    vec3 n = normalize(vNormalW + vec3(nx * 0.1, 0.0, nz * 0.1));
    vec3 v = normalize(cameraPosition - vWorld);
    float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
    vec3 col = mix(uDeep, uSky, 0.18 + 0.72 * fres) * uTint;
    float spec = pow(max(dot(reflect(-uSun, n), v), 0.0), 140.0);
    col += vec3(1.0, 0.9, 0.7) * spec * 2.0 * max(uSun.y, 0.0);
    gl_FragColor = vec4(col, uOpacity);
    #include <fog_fragment>
  }
`;

export function createWater({ size = 800, segments = 1, wave = 0, chop = 1, flow = 0.6, flowDir = [0, 1], deep = [0.03, 0.07, 0.08], level = 0, opacity = 1 } = {}) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWave: { value: wave },
      uChop: { value: chop },
      uFlow: { value: flow },
      uFlowDir: { value: new THREE.Vector2(...flowDir) },
      uOpacity: { value: opacity },
      uSky: { value: new THREE.Color(0.6, 0.68, 0.76) },
      uDeep: { value: new THREE.Color(...deep) },
      uTint: { value: new THREE.Color(1, 1, 1) },
      uSun: { value: new THREE.Vector3(0, 0.3, -1) },
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 0 },
      fogFar: { value: 0 },
      fogDensity: { value: 0 },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    fog: true,
    transparent: opacity < 1,
  });
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = level;
  return {
    mesh,
    material,
    /** Sync with the atmosphere each frame. */
    update({ time, fog, sunDir, sky = null }) {
      const u = material.uniforms;
      u.uTime.value = time;
      u.fogColor.value.copy(fog.color);
      u.fogDensity.value = fog.density;
      u.uSun.value.copy(sunDir);
      if (sky) u.uSky.value.copy(sky);
      else u.uSky.value.copy(fog.color).multiplyScalar(1.1);
    },
  };
}
