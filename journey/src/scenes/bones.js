// Ezekiel 37:1–10 — the valley of dry bones. A pale valley, very many bones, very dry: skulls, ribs,
// thighbones scattered over the ground. A noise, and a shaking, and the bones come together, bone to his
// bone, until whole skeletons lie in the valley. Sinews and flesh come up upon them and skin covers them,
// but there is no breath in them. The breath comes from the four winds, and they live, and stand up upon
// their feet, an exceeding great army.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { lerp, pulse, ramp, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { robedGeometry } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { rng } from "../engine/noise.js";

const strip = (g) => { g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; };
const cyl = (r, len) => strip(new THREE.CylinderGeometry(r * 1.7, r * 1.45, len, 7));

// Each bone: geometry centred on its own origin, and where it sits in a standing skeleton 1.75 tall.
function bonePieces() {
  const skull = (() => {
    const cranium = new THREE.SphereGeometry(0.11, 14, 10);
    cranium.scale(0.9, 1, 1.1);
    const jaw = new THREE.BoxGeometry(0.11, 0.05, 0.1);
    jaw.translate(0, -0.1, 0.04);
    const sockets = [-1, 1].map((s) => { const e = new THREE.SphereGeometry(0.03, 6, 5); e.translate(s * 0.04, 0, 0.1); return e; });
    return mergeGeometries([cranium, jaw, ...sockets].map(strip));
  })();
  const ribs = (() => {
    const parts = [];
    for (let i = 0; i < 6; i++) {
      const t = new THREE.TorusGeometry(0.14 - i * 0.008, 0.011, 4, 18, Math.PI * 1.7);
      t.rotateX(Math.PI / 2);
      t.rotateY(-Math.PI * 0.35 + Math.PI);
      t.scale(1, 1, 0.75);
      t.translate(0, 0.13 - i * 0.05, 0.02);
      parts.push(t);
    }
    return mergeGeometries(parts.map(strip));
  })();
  const pelvis = (() => {
    const t = new THREE.TorusGeometry(0.11, 0.025, 5, 16, Math.PI * 1.4);
    t.rotateX(Math.PI / 2);
    t.scale(1, 1, 0.6);
    return strip(t);
  })();
  return [
    { geo: skull, at: [0, 1.62, 0] },
    { geo: cyl(0.022, 0.6), at: [0, 1.22, -0.03] }, // spine
    { geo: ribs, at: [0, 1.28, 0] },
    { geo: pelvis, at: [0, 0.95, 0] },
    { geo: cyl(0.024, 0.45), at: [-0.09, 0.71, 0] }, // femurs
    { geo: cyl(0.024, 0.45), at: [0.09, 0.71, 0] },
    { geo: cyl(0.02, 0.44), at: [-0.09, 0.26, 0] }, // shins
    { geo: cyl(0.02, 0.44), at: [0.09, 0.26, 0] },
    { geo: cyl(0.02, 0.3), at: [-0.2, 1.3, 0] }, // upper arms
    { geo: cyl(0.02, 0.3), at: [0.2, 1.3, 0] },
    { geo: cyl(0.016, 0.28), at: [-0.22, 1.0, 0.02] }, // forearms
    { geo: cyl(0.016, 0.28), at: [0.22, 1.0, 0.02] },
  ];
}

export function create(ctx) {
  const height = composeHeight([heights.dunes(2.5, 60, 1.1, 301), (x) => Math.pow(Math.max(0, Math.abs(x) - 90) / 160, 2) * 50], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "bone", size: 1200 },
    sky: (rel) => [[1 - sramp(rel, 19, 23), "golden"], [sramp(rel, 19, 23), "morning"]],
    storm: false,
    wind: (rel) => 0.4 + 1.6 * pulse(rel, 16, 17.5, 20, 21.5),
    camera: [
      [0, [0, 40, 140], [0, 0, -20], 46],
      [4, [3, 1.5, 22], [0, 0.2, 16], 50],
      [8.5, [-4, 2.2, 24], [0, 0.3, 17], 48],
      [12.5, [5, 1.8, 23], [0, 0.4, 17], 46],
      [16.5, [-3, 2.4, 25], [2, 0.8, 15], 50],
      [20, [0, 7, 40], [0, 4, -20], 50],
      [24, [0, 30, 90], [0, 3, -40], 46],
    ],
    grade: (rel) => ({ saturation: 0.45 + 0.4 * sramp(rel, 19.5, 23), tint: [1.04, 1, 0.92], exposure: 1.05 }),
    audio: (rel) => ({ drone: 0.45, wind: 0.35 + 0.6 * pulse(rel, 16, 17.5, 20, 21.5), shimmer: 0.45 * sramp(rel, 19.5, 22) }),
  });
  const h = L.height;
  const low = ctx.quality === "low";
  const count = low ? 260 : 620;
  const r = rng(37);
  const pieces = bonePieces();
  const boneMat = new THREE.MeshStandardMaterial({ color: 0xe0d6c2, roughness: 0.85, transparent: true });
  const meshes = pieces.map((p) => new THREE.InstancedMesh(p.geo, boneMat, count));
  meshes.forEach((m) => L.add(m));
  const fleshMat = new THREE.MeshStandardMaterial({ color: 0x241c16, roughness: 1, transparent: true, opacity: 0 });
  const flesh = new THREE.InstancedMesh(robedGeometry(1.75), fleshMat, count);
  L.add(flesh);

  // skeletons laid out across the valley floor; each bone has its own scattered resting place
  const men = [];
  for (let i = 0; i < count; i++) {
    // a dense field near the viewer, thinning out across the whole valley
    const near = i < (low ? 70 : 140);
    const x = near ? (r() - 0.5) * 16 : (r() - 0.5) * 150;
    const z = near ? 20 - r() * 14 : 30 - r() * 190;
    const yaw = r() * Math.PI * 2;
    const scattered = pieces.map(() => {
      const a = r() * Math.PI * 2;
      const d = 0.4 + r() * 2.4;
      const px = x + Math.cos(a) * d;
      const pz = z + Math.sin(a) * d;
      return {
        pos: new THREE.Vector3(px, h(px, pz) + 0.03, pz),
        rot: new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2 + (r() - 0.5) * 0.4, r() * 6.28, (r() - 0.5) * 0.6)),
      };
    });
    men.push({ x, z, y: h(x, z), yaw, scattered, delay: r() * 0.55, rise: r() * 0.35, phase: r() * 6.28 });
  }

  // the breath from the four winds (Ezekiel 37:9)
  const breathCount = low ? 2000 : 5000;
  const bg = new THREE.BufferGeometry();
  bg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(breathCount * 3), 3));
  const bseed = new Float32Array(breathCount * 3);
  for (let i = 0; i < breathCount; i++) bseed.set([Math.floor(r() * 4), r(), r()], i * 3);
  bg.setAttribute("seed", new THREE.BufferAttribute(bseed, 3));
  const breath = new THREE.Points(bg, new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 seed;
      uniform float uTime, uAmount, uPixelRatio;
      varying float vA;
      void main() {
        float k = fract(uTime * 0.18 + seed.y);
        float q = seed.x;
        vec2 dir = q < 0.5 ? vec2(1.0, 0.0) : q < 1.5 ? vec2(-1.0, 0.0) : q < 2.5 ? vec2(0.0, 1.0) : vec2(0.0, -1.0);
        vec2 start = dir * 260.0 + vec2(-dir.y, dir.x) * (seed.z - 0.5) * 260.0 + vec2(0.0, -60.0);
        vec2 target = vec2((seed.z - 0.5) * 150.0, 30.0 - seed.y * 190.0);
        vec2 xz = mix(start, target, k);
        float y = 2.0 + sin(k * 3.14159) * 30.0 * (1.0 - seed.z * 0.5);
        vA = uAmount * sin(k * 3.14159);
        vec4 mv = modelViewMatrix * vec4(xz.x, y, xz.y, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * 26.0 / -mv.z * 10.0 * vA;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * 0.7;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0, 0.96, 0.85) * a, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  breath.frustumCulled = false;
  L.add(breath);
  const dust = weather("dust", { count: 5000, box: [100, 40, 100] });
  L.add(dust.points);

  const S = new THREE.Matrix4();
  const P = new THREE.Matrix4();
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const qs = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const eLie = new THREE.Euler();
  let lastKey = "";
  L.onUpdate(({ rel, time, pixelRatio, camera, reducedMotion }) => {
    const shaking = pulse(rel, 8.8, 9.3, 12, 12.6);
    const gather = sramp(rel, 9.2, 12.6); // bone to his bone (37:7)
    const fleshOn = sramp(rel, 13, 15.8); // sinews, flesh, skin (37:8)
    const stand = sramp(rel, 20, 22.5); // they lived and stood up (37:10)
    const key = `${gather.toFixed(3)}|${stand.toFixed(3)}|${shaking > 0 ? time.toFixed(2) : 0}`;
    if (key !== lastKey) {
      lastKey = key;
      for (let i = 0; i < count; i++) {
        const m = men[i];
        const k = sramp(gather, m.delay, m.delay + 0.45);
        const up = sramp(stand, m.rise, m.rise + 0.65);
        // the assembled skeleton: lying on its back, then raised to its feet
        eLie.set(-(Math.PI / 2) * (1 - up), m.yaw, 0, "YXZ");
        S.compose(pos.set(m.x, m.y + 0.13 * (1 - up), m.z), q.setFromEuler(eLie), one);
        const jitter = reducedMotion ? 0 : shaking * (1 - k) * 0.06;
        pieces.forEach((p, b) => {
          P.makeTranslation(p.at[0], p.at[1], p.at[2]);
          M.multiplyMatrices(S, P);
          M.decompose(pos, q, sc);
          const s = m.scattered[b];
          pos.lerpVectors(s.pos, pos, k);
          pos.x += Math.sin(time * 41 + i + b) * jitter;
          pos.y += Math.abs(Math.sin(time * 37 + b * 3 + i)) * jitter;
          qs.copy(s.rot).slerp(q, k);
          M.compose(pos, qs, one);
          meshes[b].setMatrixAt(i, M);
        });
        flesh.setMatrixAt(i, S);
      }
      meshes.forEach((mm) => { mm.instanceMatrix.needsUpdate = true; });
      flesh.instanceMatrix.needsUpdate = true;
    }
    boneMat.opacity = 1 - sramp(rel, 14.5, 16.2);
    meshes.forEach((mm) => { mm.visible = boneMat.opacity > 0.01; });
    fleshMat.opacity = fleshOn;
    flesh.visible = fleshOn > 0.01;
    breath.material.uniforms.uAmount.value = pulse(rel, 16.3, 17.5, 21, 22.5);
    breath.material.uniforms.uTime.value = time;
    breath.material.uniforms.uPixelRatio.value = pixelRatio;
    dust.update({ time, pixelRatio, amount: 0.25 + 0.5 * shaking + 0.4 * pulse(rel, 16, 17.5, 20, 21.5), center: camera.position, wind: [1, 0.2] });
    if (!reducedMotion && shaking > 0) {
      camera.position.x += Math.sin(time * 33) * 0.08 * shaking;
      camera.position.y += Math.sin(time * 29) * 0.06 * shaking;
    }
    return { audio: { drone: 0.45 + 0.3 * shaking } };
  });
  return L;
}
