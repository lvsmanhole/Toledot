// Exodus 3 — Horeb. Dark desert under a mountain silhouette. A strange flame appears; the bush burns
// and is not consumed; the ground around it slowly fills with light. Moses at a distance, unshod.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

export function create(ctx) {
  const height = composeHeight([heights.rolling(6, 0.01, 161), heights.mountain(0, -320, 180, 160, 162, 1.3), heights.flatten(0, 0, 14, 40, 3)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "sinai", size: 1400 },
    sky: () => "night",
    camera: [[0, [8, 6, 60], [0, 4, 0], 40], [6, [5, 3.5, 22], [0, 2.4, 0], 44], [11, [2, 2.2, 9], [0, 2.4, 0], 50], [16, [-4, 3, 14], [0, 3, -30], 44]],
    grade: (rel) => ({ bloom: 0.55, threshold: 0.75, exposure: 0.95 + 0.12 * sramp(rel, 3, 12) }),
    audio: (rel) => ({ drone: 0.4, shimmer: 0.15 + 0.5 * sramp(rel, 3, 12), wind: 0.1, fire: 0.25 * sramp(rel, 1, 3) }),
  });
  const h = L.height;
  const ground = h(0, 0);
  const bush = createTrees({ count: 1, place: () => [0, 0], height: h, kind: "olive", size: [2.6, 2.6], tint: [0.1, 0.12, 0.06] });
  L.add(bush.group);
  const flames = [0, 1, 2, 3, 4].map((i) => {
    const f = flame({ width: 1.6 + (i % 2) * 0.6, height: 3.2 + i * 0.3, gain: 0.85, seed: i * 3.3 });
    const a = i * 1.26;
    f.position.set(Math.cos(a) * 0.6, ground + 0.6, Math.sin(a) * 0.6);
    L.add(f);
    return f;
  });
  const heart = glowSprite(0xffe2a0, 9, 0);
  heart.position.set(0, ground + 2.2, 0);
  L.add(heart);
  const light = new THREE.PointLight(0xffc070, 0, 60, 1.4);
  light.position.set(0, ground + 2, 0);
  L.add(light);
  const moses = figure(1.8, { staff: true });
  moses.position.set(1.2, h(1.2, 7.5), 7.5);
  moses.lookAt(0, moses.position.y, 0);
  L.add(moses);
  L.add(createTrees({ count: 40, place: placers.disc(0, 0, 120, (x, z) => Math.hypot(x, z) > 18), height: h, kind: "olive", size: [1.5, 3], tint: [0.12, 0.13, 0.08] }).group);
  L.onUpdate(({ rel, time }) => {
    const burn = sramp(rel, 0.8, 3);
    for (const f of flames) { f.material.uniforms.uTime.value = time; f.material.uniforms.uAmount.value = burn; }
    heart.material.opacity = burn * (0.35 + 0.08 * Math.sin(time * 3));
    // the place itself grows bright: holy ground
    light.intensity = burn * (25 + 55 * sramp(rel, 4, 12));
    heart.scale.setScalar(6 + 6 * sramp(rel, 9, 14));
    moses.rotation.x = 0.25 * pulse(rel, 7, 8.5, 15, 16);
  });
  return L;
}
