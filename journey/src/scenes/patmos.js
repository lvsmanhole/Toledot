// Revelation 1 — Patmos. A rocky island in a dark sea; an old man on the rocks. A great voice as of a
// trumpet; he turns, and seven golden lampstands stand in a ring of light with one in their midst.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";

export function create(ctx) {
  const island = (x, z) => 28 * Math.exp(-(x * x + z * z) / 9000) - 6;
  const height = composeHeight([island, heights.rolling(6, 0.03, 381)], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 900 },
    water: { size: 3000, wave: 0.6, chop: 1.2, deep: [0.01, 0.03, 0.05], level: 0 },
    sky: () => [[1, "night"]],
    camera: [[0, [140, 30, 160], [0, 14, 0], 42], [5.5, [30, 26, 30], [0, 22, 0], 44], [9.5, [10, 24, 12], [-20, 24, -20], 50], [14, [16, 28, 18], [-20, 26, -20], 54]],
    grade: () => ({ bloom: 0.7, threshold: 0.5 }),
    audio: (rel) => ({ water: 0.55, wind: 0.3, drone: 0.3, shimmer: 0.5 * sramp(rel, 6, 9) }),
  });
  const h = L.height;
  const john = figure(1.75, { staff: true });
  john.position.set(2, h(2, 2), 2);
  john.rotation.y = 0.8;
  L.add(john);
  const center = new THREE.Vector3(-18, h(-18, -18) + 0.2, -18);
  const ring = new THREE.Group();
  ring.position.copy(center);
  L.add(ring);
  const stands = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const stand = new THREE.Group();
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 2.6, 8), MATERIALS.gold());
    stem.position.y = 1.3;
    const f = flame({ width: 0.4, height: 0.8, gain: 1.4, seed: i });
    f.position.y = 2.65;
    stand.add(stem, f);
    stand.position.set(Math.cos(a) * 6, 0, Math.sin(a) * 6);
    ring.add(stand);
    stands.push({ stand, f });
  }
  const midst = glowSprite(0xffffff, 10, 0);
  midst.position.set(0, 3, 0);
  ring.add(midst);
  const light = new THREE.PointLight(0xffe0a0, 0, 50, 1.3);
  light.position.set(0, 4, 0);
  ring.add(light);
  L.onUpdate(({ rel, time }) => {
    const appear = sramp(rel, 6, 9);
    stands.forEach(({ stand, f }, i) => {
      const on = sramp(appear, i / 7 * 0.6, i / 7 * 0.6 + 0.4);
      stand.scale.setScalar(Math.max(0.001, on));
      f.material.uniforms.uTime.value = time;
      f.material.uniforms.uAmount.value = on;
    });
    midst.material.opacity = sramp(rel, 8.5, 10.5) * (0.85 + 0.1 * Math.sin(time * 2));
    light.intensity = appear * 120;
    john.rotation.y = 0.8 - sramp(rel, 5.5, 7) * 2.4;
    john.rotation.x = 0.6 * sramp(rel, 10, 11.5);
  });
  return L;
}
