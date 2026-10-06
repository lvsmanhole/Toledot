// Genesis 28 — Bethel. Night in the hills; Jacob asleep with a stone for a pillow. A column of light
// stands up from the earth; lights ascend and descend in it. The camera rises with them into the stars,
// then comes back down to the stone at dawn.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { pillar } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { altar } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createStars } from "../engine/stars.js";

function angels(count, radius, height) {
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) data.set([Math.random(), Math.random(), Math.random() < 0.5 ? 1 : -1], i * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("data", new THREE.BufferAttribute(data, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 data;
      uniform float uTime, uAmount, uPixelRatio;
      varying float vA;
      void main() {
        float y = fract(data.x + uTime * 0.02 * data.z) * ${height.toFixed(1)};
        float a = data.y * 6.2831 + uTime * 0.2;
        vec3 p = vec3(cos(a), 0.0, sin(a)) * ${radius.toFixed(1)} * (0.3 + data.y * 0.7);
        p.y = y;
        vA = uAmount * smoothstep(0.0, 20.0, y);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * 300.0 / -mv.z * vA;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0, 0.92, 0.75) * a * 1.4, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function create(ctx) {
  const height = composeHeight([heights.rolling(14, 0.008, 101), heights.flatten(0, 0, 10, 30, 6)], 2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1200 },
    sky: (rel) => [[1 - sramp(rel, 15, 19.5), "night"], [sramp(rel, 15, 19.5), "dawn"]],
    stars: false,
    camera: [
      [0, [12, 9, 18], [0, 6.5, 0], 46],
      [5, [6, 9, 10], [0, 30, -4], 56],
      [8, [4, 40, 8], [0, 120, 0], 64],
      [11, [3, 260, 6], [0, 600, 0], 70],
      [13, [2, 380, 4], [0, 900, 0], 74],
      [15.5, [10, 30, 16], [0, 7, 0], 50],
      [20, [14, 9, 14], [0, 6.5, 0], 46],
    ],
    keepAboveGround: true,
    grade: (rel) => ({ bloom: 0.6 + 0.4 * pulse(rel, 6, 9, 12, 15), threshold: 0.6 }),
    audio: (rel) => ({ drone: 0.3, shimmer: 0.2 + 0.6 * pulse(rel, 3, 7, 13, 15.5), wind: 0.1 }),
  });
  const h = L.height;
  const ground = h(0, 0);
  const jacob = figure(1.8);
  jacob.rotation.set(0, 0.5, Math.PI / 2);
  jacob.position.set(0, ground + 0.22, 0);
  const pillow = altar({ size: 0.6, seed: 31 });
  pillow.position.set(-1.0, ground, -0.5);
  L.add(jacob);
  L.add(pillow);
  const stars = createStars({ count: ctx.quality === "low" ? 9000 : 20000, radius: 1500, seed: 101, size: 2.2 });
  L.add(stars, ({ time, pixelRatio, camera }) => {
    stars.position.copy(camera.position);
    stars.material.uniforms.uTime.value = time;
    stars.material.uniforms.uPixelRatio.value = pixelRatio;
  });
  const ladder = pillar({ radius: 5, height: 1400, color: [1, 0.88, 0.62], gain: 1.4 });
  ladder.position.set(2.5, ground, -2);
  L.add(ladder);
  const host = angels(ctx.quality === "low" ? 400 : 900, 5, 1400);
  host.position.set(2.5, ground, -2);
  L.add(host);
  L.onUpdate(({ rel, time, pixelRatio }) => {
    const on = pulse(rel, 2, 5, 14, 16);
    ladder.material.uniforms.uAmount.value = on;
    ladder.material.uniforms.uTime.value = time;
    ladder.visible = on > 0.01;
    host.material.uniforms.uAmount.value = on;
    host.material.uniforms.uTime.value = time;
    host.material.uniforms.uPixelRatio.value = pixelRatio;
    // Jacob wakes and stands at dawn
    const up = sramp(rel, 15.5, 17);
    jacob.rotation.z = (Math.PI / 2) * (1 - up);
    jacob.position.y = ground + 0.22 * (1 - up);
  });
  return L;
}
