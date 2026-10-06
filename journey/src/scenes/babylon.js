// Psalm 137 and Daniel 1–3 — Babylon. Massive walls of baked brick and a gate glazed in blue; terraced
// gardens; the river with willows where the exiles sit and their harps hang. Then the furnace mouth,
// and four walking in the fire.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS, city, wall, ziggurat } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

const river = (z) => -40 + Math.sin(z * 0.005) * 12;

function ishtarGate() {
  const g = new THREE.Group();
  const blue = MATERIALS.glazedBlue();
  const gold = MATERIALS.gold();
  for (const s of [-1, 1]) {
    const tower = new THREE.Mesh(new THREE.BoxGeometry(10, 26, 12), blue);
    tower.position.set(s * 10, 13, 0);
    g.add(tower);
    // rows of gold beasts in relief (simplified as bands of glints)
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 3; k++) {
        const beast = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.2), gold);
        beast.position.set(s * 10 + (k - 1) * 3, 5 + row * 5, 6.1);
        g.add(beast);
      }
    }
  }
  const arch = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 12), blue);
  arch.position.set(0, 22, 0);
  g.add(arch);
  return g;
}

export function create(ctx) {
  const height = composeHeight([heights.rolling(2, 0.006, 291), heights.channel(river, 14, -1.5, 10)], 1.2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "mesopotamia", size: 1400, wetLevel: 0.9 },
    water: { size: 1400, flow: 0.4, flowDir: [0, 1], deep: [0.04, 0.07, 0.06], level: -0.2 },
    sky: (rel) => (rel < 9 ? [[1, "dusk"]] : [[1, "night"]]),
    camera: [
      [0, [160, 40, 220], [40, 20, 0], 44],
      [4, [60, 14, 60], [40, 16, 0], 46],
      [7, [-20, 4, 30], [-40, 2, 10], 44],
      [10.5, [-10, 40, 40], [100, 8, -60], 46],
      [13, [100, 10, -20], [100, 4, -60], 44],
      [22, [96, 8, -26], [100, 3, -60], 40],
    ],
    grade: () => ({ saturation: 0.85, bloom: 0.5, threshold: 0.6 }),
    audio: (rel) => ({ drone: 0.3, water: 0.4 * (1 - sramp(rel, 9, 11)), fire: 0.6 * sramp(rel, 10, 12), wind: 0.15 }),
  });
  const h = L.height;
  L.add(wall({ points: [[0, -200], [200, -200], [200, 160], [0, 160]], height: h, h: 24, thickness: 8, towerEvery: 1, material: "mud" }));
  const gate = ishtarGate();
  gate.position.set(0, h(0, 30), 30);
  gate.rotation.y = Math.PI / 2;
  L.add(gate);
  const town = city({ count: 500, radius: 90, height: (x, z) => h(x + 100, z - 0), style: "mud", seed: 113 });
  town.position.set(100, 0, 0);
  L.add(town);
  const temple = ziggurat({ base: 50, tiers: 6, tierH: 8 });
  temple.position.set(110, h(110, -20), -20);
  L.add(temple);
  L.add(createTrees({ count: 200, place: placers.box(-120, -400, 20, 400, (x, z) => { const d = Math.abs(x - river(z)); return d > 16 && d < 40; }), height: h, kind: "willow", size: [4, 7] }).group);
  // the exiles sitting by the river (figures scaled down to sit)
  const exiles = crowd({ count: 60, place: placers.box(-28, -10, -20, 60), height: h, seed: 115, face: [-40, 20] });
  exiles.group.scale.y = 0.62;
  L.add(exiles.group);
  // the furnace (Daniel 3)
  const furnace = new THREE.Mesh(new THREE.CylinderGeometry(14, 18, 20, 24, 1), MATERIALS.mudDark());
  furnace.position.set(100, h(100, -60) + 10, -60);
  L.add(furnace);
  const mouth = new THREE.Group();
  mouth.position.set(100, h(100, -60) + 4, -46);
  L.add(mouth);
  const flames = [0, 1, 2, 3].map((i) => {
    const f = flame({ width: 7, height: 9, gain: 1.1, seed: i * 1.9 });
    f.position.set((i - 1.5) * 2.6, -3, 0);
    mouth.add(f);
    return f;
  });
  const four = [0, 1, 2, 3].map((i) => {
    const f = figure(1.8);
    f.position.set((i - 1.5) * 2.2, -3.6, -1.5);
    mouth.add(f);
    return f;
  });
  const fourth = glowSprite(0xffffff, 5, 0);
  fourth.position.set(1.5 * 2.2 * 0.5, -1.6, -1.2);
  mouth.add(fourth);
  L.onUpdate(({ rel, time }) => {
    const fire = sramp(rel, 9.5, 11);
    flames.forEach((f) => { f.material.uniforms.uAmount.value = fire; f.material.uniforms.uTime.value = time; });
    four.forEach((f, i) => {
      f.visible = rel > 11;
      f.position.x = (i - 1.5) * 2.2 + Math.sin(time * 0.6 + i) * 0.6;
    });
    fourth.material.opacity = pulse(rel, 11.5, 13, 18, 21) * 0.8;
    exiles.group.visible = rel < 10;
  });
  return L;
}
