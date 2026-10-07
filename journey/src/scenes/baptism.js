// Matthew 3:16–17 — the Jordan. Figures in the river; one rising from the water. The heavens open: a
// break in the cloud, light falling, a dove of light descending; then the voice, as light.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { lightShaft } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const river = (z) => Math.sin(z * 0.012) * 14;

export function create(ctx) {
  const height = composeHeight([heights.rolling(6, 0.01, 331), heights.channel(river, 12, -1.6, 8)], 1.5);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1000, wetLevel: 0.6 },
    water: { size: 1000, flow: 0.8, flowDir: [0, 1], deep: [0.04, 0.08, 0.07], level: -0.1 },
    sky: (rel) => [[1 - sramp(rel, 1.5, 5), "storm"], [sramp(rel, 1.5, 5), "sacred"]],
    camera: [[0, [30, 6, 26], [river(0), 1.5, 0], 44], [6, [18, 3, 14], [river(0), 3, 0], 40], [12, [24, 10, 30], [river(0), 20, -20], 48]],
    grade: (rel) => ({ bloom: 0.3 + 0.2 * pulse(rel, 2, 4, 10, 12), threshold: 0.8 }),
    audio: (rel) => ({ water: 0.5, wind: 0.2, shimmer: 0.6 * pulse(rel, 2, 4, 10, 12), drone: 0.2 }),
  });
  const h = L.height;
  const reeds = createBlades({ kind: "reeds", count: 12000, place: placers.box(-150, -200, 150, 200, (x, z) => { const d = Math.abs(x - river(z)); return d > 13 && d < 22; }), height: h, minH: -1 });
  L.add(reeds.mesh, (s) => reeds.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  L.add(createTrees({ count: 120, place: placers.box(-200, -200, 200, 200, (x, z) => Math.abs(x - river(z)) > 24), height: h, kind: "willow", size: [3, 6] }).group);
  const crowdOnBank = crowd({ count: 120, place: placers.box(river(0) + 14, -20, river(0) + 26, 20), height: h, seed: 131, face: [river(0), 0] });
  L.add(crowdOnBank.group);
  const john = figure(1.8);
  john.position.set(river(0) + 1.2, -0.9, 0.6);
  L.add(john);
  const jesus = figure(1.8);
  L.add(jesus);
  const opening = lightShaft({ length: 300, top: 10, bottom: 4, color: [1, 0.96, 0.86], gain: 0.7 });
  opening.rotation.x = Math.PI;
  opening.position.set(river(0), 300, 0);
  L.add(opening);
  const dove = glowSprite(0xffffff, 2.2, 0);
  L.add(dove);
  L.onUpdate(({ rel, time }) => {
    const rise = sramp(rel, 1, 2.5);
    jesus.position.set(river(0) - 0.4, lerp(-1.6, -0.8, rise), 0);
    const open = sramp(rel, 1.8, 4.5);
    opening.material.uniforms.uAmount.value = open;
    opening.material.uniforms.uTime.value = time;
    const descend = sramp(rel, 3, 6.5);
    dove.position.set(river(0) - 0.4 + Math.sin(time * 2) * 0.2 * (1 - descend), lerp(60, 3.2, descend), 0);
    dove.material.opacity = pulse(rel, 3, 3.5, 10.5, 12);
    dove.scale.setScalar(2.2 + Math.sin(time * 8) * 0.2);
  });
  return L;
}
