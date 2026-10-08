// Star field: points on a large shell with per-star temperature, twinkle, and a reveal threshold
// so stars can "emerge" one by one as uReveal rises.

import * as THREE from "three";

import { rng } from "./noise.js";

const TEMPERATURES = [
  [0.62, 0.72, 1.0], [0.8, 0.86, 1.0], [1.0, 1.0, 1.0], [1.0, 0.94, 0.82], [1.0, 0.82, 0.62],
];

export function createStars({ count = 20000, radius = 900, seed = 3, size = 2.2 } = {}) {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const data = new Float32Array(count * 2); // threshold, phase
  for (let i = 0; i < count; i++) {
    // more stars toward a tilted band (a milky way)
    const u = random() * 2 - 1;
    const band = random() < 0.45;
    const theta = random() * Math.PI * 2;
    let y = band ? (random() - 0.5) * 0.25 : u;
    const r = Math.sqrt(1 - y * y);
    let x = r * Math.cos(theta);
    let z = r * Math.sin(theta);
    // tilt the band
    const t = 0.5;
    const y2 = y * Math.cos(t) - z * Math.sin(t);
    z = y * Math.sin(t) + z * Math.cos(t);
    y = y2;
    const d = radius * (0.8 + random() * 0.2);
    positions.set([x * d, y * d, z * d], i * 3);
    const c = TEMPERATURES[Math.floor(random() ** 1.6 * TEMPERATURES.length)];
    const b = 0.35 + random() ** 3 * 1.8;
    colors.set([c[0] * b, c[1] * b, c[2] * b], i * 3);
    data.set([random(), random() * 6.283], i * 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("data", new THREE.BufferAttribute(data, 2));
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 1 },
      uSize: { value: size },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      attribute vec2 data;
      uniform float uTime, uReveal, uSize, uPixelRatio;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vBright;
      void main() {
        vColor = color;
        float on = smoothstep(data.x, data.x + 0.06, uReveal);
        float tw = 0.75 + 0.25 * sin(uTime * (0.6 + data.y * 0.3) + data.y * 7.0);
        vAlpha = on * tw;
        // brighter stars get a larger sprite, so there is room for their halo and spikes
        vBright = clamp((length(color) - 0.6) / 1.6, 0.0, 1.0);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixelRatio * (2.2 + vBright * 9.0) * on;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vAlpha;
      varying float vBright;
      void main() {
        // a star: a tight bright core, a soft halo, and on the brighter ones faint diffraction spikes
        vec2 p = gl_PointCoord - 0.5;
        float s = 1.0 + vBright * 4.1; // the sprite is larger for bright stars; keep the core the same size
        float d = length(p) * s;
        float core = exp(-d * d * 26.0) * 1.6;
        float halo = exp(-d * d * 7.0) * 0.18 * (0.3 + vBright);
        vec2 q = abs(p) * s;
        float spikes = (exp(-q.x * 70.0) * exp(-q.y * 5.0) + exp(-q.y * 70.0) * exp(-q.x * 5.0)) * 0.55 * vBright;
        float edge = smoothstep(0.5, 0.42, length(p)); // nothing reaches the square's corners
        float a = (core + halo + spikes) * edge * vAlpha * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}
