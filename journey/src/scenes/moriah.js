// Genesis 22 — Moriah. The most restrained scene of the journey: morning light, wind, the mountain,
// two figures climbing with the wood, the stones of an altar, a ram in a thicket. Minimal words.

import * as THREE from "three";

import { lerp, pulse, ramp, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { ANIMALS, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { altar } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const PEAK = [0, -40];

export function create(ctx) {
  const height = composeHeight([heights.rolling(6, 0.01, 91), heights.mountain(PEAK[0], PEAK[1], 120, 70, 92, 1.1), heights.flatten(PEAK[0], PEAK[1], 6, 14, 70)], 0);
  // the path: a switchback up the southern face
  const path = [];
  for (let i = 0; i <= 60; i++) {
    const k = i / 60;
    const z = lerp(110, PEAK[1] + 5, k);
    const x = Math.sin(k * Math.PI * 3.5) * 22 * (1 - k);
    path.push(new THREE.Vector3(x, 0, z));
  }
  const curve = new THREE.CatmullRomCurve3(path);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1100 },
    sky: (rel) => [[1 - sramp(rel, 0, 8), "dawn"], [sramp(rel, 0, 8), "morning"]],
    wind: () => 0.6,
    camera: [
      [0, [-160, 40, 220], [0, 40, -20], 38],
      [6, [-40, 24, 120], [0, 20, 70], 40],
      [11, [30, 55, 40], [0, 50, 10], 44],
      [15, [-12, 75, -22], [0, 71, -42], 42],
      [20, [-60, 110, 60], [0, 70, -40], 40],
    ],
    grade: () => ({ saturation: 0.85, bloom: 0.35, tint: [1.02, 1, 0.97] }),
    audio: () => ({ drone: 0.2, wind: 0.55, shimmer: 0.08 }),
  });
  const h = L.height;
  const scrub = createBlades({ count: ctx.quality === "low" ? 12000 : 30000, place: placers.disc(0, 30, 160), height: h, maxH: 80 });
  L.add(scrub.mesh, (s) => scrub.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.85 }));
  L.add(createTrees({ count: 70, place: placers.disc(0, 20, 170, (x, z) => Math.hypot(x - PEAK[0], z - PEAK[1]) > 25), height: h, kind: "olive", size: [2.5, 4.5] }).group);

  const top = new THREE.Vector3(PEAK[0], h(PEAK[0], PEAK[1]), PEAK[1]);
  const stones = altar({ size: 1.8, seed: 22 });
  stones.position.copy(top);
  L.add(stones);
  const wood = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.9), new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 1 }));
  wood.position.copy(top).add(new THREE.Vector3(0, 1.4, 0));
  L.add(wood);
  const father = figure(1.8, { staff: true });
  const son = figure(1.6);
  L.add(father);
  L.add(son);
  // the ram caught in the thicket behind him
  const thicket = createTrees({ count: 3, place: placers.disc(top.x - 4, top.z - 5, 1.5), height: h, kind: "olive", size: [1.6, 2.2] });
  L.add(thicket.group);
  const ram = new THREE.Mesh(ANIMALS.sheep(), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 }));
  ram.scale.setScalar(1.3);
  ram.position.set(top.x - 4, h(top.x - 4, top.z - 5), top.z - 4);
  L.add(ram);
  const motes = weather("dust", { count: 1200, box: [40, 20, 40] });
  L.add(motes.points);

  const p = new THREE.Vector3();
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    // they climb together (Genesis 22:8 "so they went both of them together")
    const k = sramp(rel, 3, 13);
    curve.getPointAt(Math.min(0.999, k), p);
    father.position.set(p.x, h(p.x, p.z), p.z);
    curve.getPointAt(Math.max(0, Math.min(0.999, k - 0.012)), p);
    son.position.set(p.x + 0.8, h(p.x + 0.8, p.z), p.z);
    const ahead = curve.getPointAt(Math.min(1, k + 0.01));
    father.lookAt(ahead.x, father.position.y, ahead.z);
    son.lookAt(ahead.x, son.position.y, ahead.z);
    const bob = k > 0 && k < 1 ? Math.abs(Math.sin(time * 3)) * 0.05 : 0;
    father.position.y += bob;
    son.position.y += bob;
    ram.visible = rel > 12;
    ram.rotation.y = 1.2 + Math.sin(time * 0.8) * 0.15 * pulse(rel, 12, 13, 15, 16);
    motes.update({ time, pixelRatio, amount: 0.35 * ramp(rel, 0, 3), center: camera.position, wind: [0.8, 0.2] });
  });
  return L;
}
