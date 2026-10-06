// Ezekiel 37 — the valley of dry bones. History dissolves into vision: a pale, wind-scoured valley full
// of bones. A noise, a shaking; bone comes to its bone and they rise; breath comes from the four winds
// and they stand up upon their feet, an exceeding great army. Then the vision fades.

import * as THREE from "three";

import { lerp, pulse, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { robedGeometry } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { rng } from "../engine/noise.js";

const COUNT_LOW = 400;
const COUNT_HIGH = 1000;

export function create(ctx) {
  const height = composeHeight([heights.dunes(3, 60, 1.1, 301), (x) => Math.pow(Math.max(0, Math.abs(x) - 90) / 160, 2) * 50], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "bone", size: 1200 },
    sky: () => [[1, "ash"]],
    storm: false,
    wind: (rel) => 0.5 + 1.2 * pulse(rel, 6.5, 8, 11, 13),
    camera: [
      [0, [0, 30, 120], [0, 0, 0], 46],
      [6, [10, 6, 40], [0, 1, 0], 50],
      [10, [-8, 3, 22], [0, 2, -10], 54],
      [16, [0, 22, 70], [0, 4, -30], 48],
    ],
    grade: (rel) => ({ saturation: 0.35 + 0.25 * sramp(rel, 10, 14), tint: [1.04, 1, 0.92], exposure: 0.95 }),
    audio: (rel) => ({ drone: 0.45, wind: 0.5 + 0.4 * pulse(rel, 6, 8, 11, 13), shimmer: 0.3 * pulse(rel, 10, 11, 14, 16) }),
  });
  const h = L.height;
  const n = ctx.quality === "low" ? COUNT_LOW : COUNT_HIGH;
  const r = rng(37);
  // each soldier is three bones (spine, two limbs) that lie scattered, then stand and become a figure
  const boneGeo = new THREE.CapsuleGeometry(0.07, 0.75, 3, 6);
  const bones = new THREE.InstancedMesh(boneGeo, new THREE.MeshStandardMaterial({ color: 0xd8cfbf, roughness: 0.9 }), n * 3);
  const soldiers = new THREE.InstancedMesh(robedGeometry(1.8), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 }), n);
  const spots = [];
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * 140;
    const z = -r() * 160 + 30;
    spots.push({ x, z, y: h(x, z), lie: Array.from({ length: 3 }, () => [r() - 0.5, r() - 0.5, r() * 6.28]), delay: r() * 0.6 });
  }
  L.add(bones);
  L.add(soldiers);
  const dust = weather("dust", { count: 6000, box: [100, 40, 100] });
  L.add(dust.points);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3(1, 1, 1);
  const p = new THREE.Vector3();
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const gather = sramp(rel, 7, 10.5);
    const flesh = sramp(rel, 10.5, 12.5);
    for (let i = 0; i < n; i++) {
      const sp = spots[i];
      const k = sramp(gather, sp.delay * 0.6, sp.delay * 0.6 + 0.4);
      for (let b = 0; b < 3; b++) {
        const [dx, dz, rot] = sp.lie[b];
        const lieP = p.set(sp.x + dx * 1.6, sp.y + 0.08, sp.z + dz * 1.6);
        const standY = sp.y + 0.45 + b * 0.5;
        p.set(lerp(lieP.x, sp.x + (b - 1) * 0.12, k), lerp(lieP.y, standY, k), lerp(lieP.z, sp.z, k));
        e.set(lerp(Math.PI / 2, 0, k), rot * (1 - k), 0);
        q.setFromEuler(e);
        m.compose(p, q, s);
        bones.setMatrixAt(i * 3 + b, m);
      }
      m.compose(p.set(sp.x, sp.y - 0.05, sp.z), q.identity(), s.set(1, Math.max(0.001, flesh), 1));
      soldiers.setMatrixAt(i, m);
      s.set(1, 1, 1);
    }
    bones.instanceMatrix.needsUpdate = true;
    soldiers.instanceMatrix.needsUpdate = true;
    bones.visible = flesh < 0.98;
    soldiers.visible = flesh > 0.01;
    dust.update({ time, pixelRatio, amount: 0.3 + 0.6 * pulse(rel, 6.5, 8, 11, 13), center: camera.position, wind: [1, 0.2] });
  });
  return L;
}
