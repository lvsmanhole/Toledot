// 1 Samuel 3 — Shiloh at night. The tent of the LORD; inside, before dawn, the lamp of God not yet gone
// out; the boy Samuel lying down. A call in the dark: the lamp brightens with each word.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { tabernacle } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

export function create(ctx) {
  const height = composeHeight([heights.rolling(12, 0.008, 231), heights.flatten(0, 0, 30, 50, 4)], 2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 900 },
    sky: () => "night",
    indoor: (rel) => sramp(rel, 3.5, 5),
    camera: [[0, [40, 14, 50], [0, 2, 0], 42], [5, [-2, 2.6, 6], [-7.5, 2, 0], 52], [10, [-4, 2.2, 3], [-7.5, 1.5, 0], 56]],
    grade: () => ({ bloom: 0.35, threshold: 0.75 }),
    audio: (rel) => ({ drone: 0.3, shimmer: 0.4 * pulse(rel, 5, 6, 8.5, 9.5), wind: 0.12 }),
  });
  const h = L.height;
  const tent = tabernacle();
  tent.position.set(0, h(0, 0), 0);
  L.add(tent);
  L.add(createTrees({ count: 90, place: placers.disc(0, 0, 200, (x, z) => Math.hypot(x, z) > 30), height: h, kind: "olive", size: [3, 5] }).group);
  const ground = h(0, 0);
  // inside the holy place: the lamp, and the boy asleep beside it
  const lamp = flame({ width: 0.25, height: 0.5, gain: 1.4, seed: 2 });
  lamp.position.set(-6, ground + 1.3, 0.6);
  L.add(lamp);
  const lampGlow = glowSprite(0xffc070, 1.1, 0.6);
  lampGlow.position.set(-6, ground + 1.5, 0.6);
  L.add(lampGlow);
  const light = new THREE.PointLight(0xffb060, 6, 14, 1.6);
  light.position.set(-6, ground + 1.6, 0.6);
  L.add(light);
  // the tent cloth hides the interior from outside; inside the camera sees past it
  const samuel = figure(1.4);
  samuel.rotation.set(0, 0.2, Math.PI / 2);
  samuel.position.set(-8.5, ground + 0.2, -0.6);
  L.add(samuel);
  L.onUpdate(({ rel, time }) => {
    lamp.material.uniforms.uTime.value = time;
    const call = pulse(rel, 5.2, 5.8, 8, 9);
    lampGlow.material.opacity = 0.55 + 0.35 * call;
    light.intensity = 6 + 20 * call;
    const rise = sramp(rel, 6, 7);
    samuel.rotation.z = (Math.PI / 2) * (1 - rise);
    samuel.position.y = ground + 0.2 * (1 - rise);
    tent.children[2].userData.nearWall.visible = rel < 3.5; // the near curtain opens as we go in
  });
  return L;
}
