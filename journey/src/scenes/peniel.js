// Genesis 32 — the ford of Jabbok. Night by the stream; two figures locked together until the breaking
// of the day. Dawn comes; one walks on alone, limping. Only shapes and light.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const stream = (z) => Math.sin(z * 0.02) * 10;

export function create(ctx) {
  const height = composeHeight([heights.rolling(10, 0.01, 111), heights.channel(stream, 4, -1.2, 6)], 3);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 900, wetLevel: 1.2 },
    water: { size: 900, flow: 0.8, flowDir: [0, -1], level: -0.3 },
    sky: (rel) => [[1 - sramp(rel, 5, 9.5), "night"], [sramp(rel, 5, 9.5), "dawn"]],
    camera: [[0, [16, 4, 14], [8, 1.8, 0], 40], [6, [14, 3, 8], [8, 1.8, 0], 36], [12, [-6, 6, 30], [20, 2, -10], 44]],
    grade: () => ({ saturation: 0.75 }),
    audio: (rel) => ({ water: 0.5, wind: 0.2, drone: 0.25 + 0.2 * pulse(rel, 0, 1, 6, 8) }),
  });
  const h = L.height;
  L.add(createBlades({ count: 20000, place: placers.disc(8, 0, 60, (x, z) => Math.abs(x - stream(z)) > 6), height: h }).mesh);
  L.add(createTrees({ count: 50, place: placers.disc(0, 0, 120, (x, z) => Math.abs(x - stream(z)) > 10), height: h, kind: "willow", size: [3, 6] }).group);
  const a = figure(1.8);
  const b = figure(1.85);
  L.add(a);
  L.add(b);
  L.onUpdate(({ rel, time }) => {
    const struggle = 1 - sramp(rel, 7.5, 9);
    const sway = Math.sin(time * 1.3) * 0.25 * struggle;
    a.position.set(8 + sway, h(8, 0), 0.25);
    b.position.set(8 - sway * 0.8, h(8, 0), -0.25);
    a.rotation.set(0.25 * struggle, Math.PI, Math.sin(time * 1.3) * 0.08 * struggle);
    b.rotation.set(0.25 * struggle, 0, -Math.sin(time * 1.3) * 0.08 * struggle);
    // the other is gone at daybreak; Israel walks on, halting on his thigh
    b.visible = struggle > 0.05;
    const walk = sramp(rel, 9, 12);
    if (walk > 0) {
      a.position.set(8 + walk * 14, h(8 + walk * 14, -walk * 6) + Math.abs(Math.sin(time * 3)) * 0.08, -walk * 6);
      a.rotation.set(0, -1.2, Math.sin(time * 3) * 0.06);
    }
  });
  return L;
}
