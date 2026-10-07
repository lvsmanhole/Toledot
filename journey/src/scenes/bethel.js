// Genesis 28 — Bethel. Night in the hills; Jacob asleep with a stone for a pillow. A column of light
// stands up from the earth; lights ascend and descend in it. The camera rises with them into the stars,
// then comes back down to the stone at dawn.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { pillar } from "../kit/effects.js";
import { figure, robedGeometry } from "../kit/figures.js";
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

// "a ladder set up on the earth, and the top of it reached to heaven": a stair of light turning up into the
// sky, and on it the angels as shining figures, some going up and some coming down (Genesis 28:12)
const STEP_RISE = 0.45;
const STEP_TURN = 0.11;
const STAIR_R = 3.4;
const stairAt = (s, out = new THREE.Vector3()) => out.set(Math.cos(s * STEP_TURN) * STAIR_R, s * STEP_RISE, Math.sin(s * STEP_TURN) * STAIR_R);

function stairway(steps) {
  const geo = new THREE.BoxGeometry(2.4, 0.1, 0.8);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.05, 0.9, 0.62), transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geo, mat, steps);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  for (let s = 0; s < steps; s++) {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -s * STEP_TURN);
    const k = 1 - s / steps;
    mesh.setMatrixAt(s, m.compose(stairAt(s, v), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.6 + 0.4 * k)));
  }
  mesh.frustumCulled = false;
  return mesh;
}

function host(count, steps) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.15, 1.05, 0.85), transparent: true, opacity: 0, depthWrite: false });
  const mesh = new THREE.InstancedMesh(robedGeometry(1.9, { detail: "low" }), mat, count);
  mesh.frustumCulled = false;
  const walkers = Array.from({ length: count }, (_, i) => ({ s: (i / count) * steps, dir: i % 2 ? 1 : -1, pace: 1.6 + (i % 5) * 0.25 }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  return {
    mesh,
    update(time) {
      walkers.forEach((w, i) => {
        const s = (((w.s + time * w.pace * w.dir) % steps) + steps) % steps;
        stairAt(s, v);
        v.y += 0.05;
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -s * STEP_TURN + (w.dir > 0 ? Math.PI : 0));
        mesh.setMatrixAt(i, m.compose(v, q, one));
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
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
    grade: (rel) => ({ bloom: 0.35 + 0.2 * pulse(rel, 6, 9, 12, 15), threshold: 0.8 }),
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
  const ladder = pillar({ radius: 5, height: 1400, color: [1, 0.88, 0.62], gain: 0.25 });
  ladder.position.set(2.5, ground, -2);
  L.add(ladder);
  const motes = angels(ctx.quality === "low" ? 200 : 400, 5, 1400);
  motes.position.set(2.5, ground, -2);
  L.add(motes);
  const STEPS = 2600;
  const stair = stairway(STEPS);
  stair.position.set(2.5, ground, -2);
  L.add(stair);
  const angelsOnStair = host(ctx.quality === "low" ? 90 : 220, STEPS);
  angelsOnStair.mesh.position.set(2.5, ground, -2);
  L.add(angelsOnStair.mesh);
  L.onUpdate(({ rel, time, pixelRatio }) => {
    const on = pulse(rel, 2, 5, 14, 16);
    ladder.material.uniforms.uAmount.value = on;
    ladder.material.uniforms.uTime.value = time;
    ladder.visible = on > 0.01;
    motes.material.uniforms.uAmount.value = on * 0.5;
    motes.material.uniforms.uTime.value = time;
    motes.material.uniforms.uPixelRatio.value = pixelRatio;
    stair.material.opacity = on * 0.32;
    stair.visible = on > 0.01;
    angelsOnStair.mesh.material.opacity = on * 0.7;
    angelsOnStair.mesh.visible = on > 0.01;
    if (on > 0.01) angelsOnStair.update(time);
    // Jacob wakes and stands at dawn
    const up = sramp(rel, 15.5, 17);
    jacob.rotation.z = (Math.PI / 2) * (1 - up);
    jacob.position.y = ground + 0.22 * (1 - up);
  });
  return L;
}
