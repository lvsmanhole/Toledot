// Act XVI — King David. Jerusalem on its ridge, growing. The ark brought up with dancing. Night: the
// city fades and the heavens he sang of fill the sky. A shepherd's field under the stars. A single
// figure weeping in the chamber over the gate. Dawn on the city of the covenant.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { crowd, figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS, city, wall } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { createStars } from "../engine/stars.js";

export function jerusalemHeight(seed = 251) {
  return composeHeight([heights.rolling(14, 0.007, seed), heights.mountain(0, 0, 80, 30, seed + 1, 1.6), heights.flatten(0, 0, 30, 46, 28)], 0);
}

export function create(ctx) {
  const height = jerusalemHeight();
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1200 },
    sky: (rel) => {
      if (rel < 5.5) return "morning";
      if (rel < 15) return [[1, "night"]];
      if (rel < 19.2) return [[1, "dusk"]];
      return [[1 - sramp(rel, 19.2, 22), "night"], [sramp(rel, 19.2, 22), "dawn"]];
    },
    stars: false,
    camera: [
      [0, [-80, 40, 120], [0, 30, 0], 44],
      [5, [-20, 31, 30], [0, 31, 0], 46],
      [6.5, [-10, 34, 40], [0, 80, -60], 54],
      [10.5, [-6, 33, 30], [0, 120, -40], 60],
      [11, [90, 8, 120], [60, 30, 0], 50],
      [14.5, [80, 7, 100], [40, 40, -60], 54],
      [15, [12, 38, 30], [0, 37, 18], 40],
      [19, [14, 39, 34], [0, 37, 18], 38],
      [24, [-60, 60, 120], [0, 30, 0], 42],
    ],
    grade: (rel) => ({ bloom: 0.35 + 0.3 * pulse(rel, 6, 7, 14, 15), threshold: 0.7 }),
    audio: (rel) => ({ drone: 0.3, shimmer: 0.35 * pulse(rel, 6, 7, 14, 15), wind: 0.2 }),
  });
  const h = L.height;
  const town = city({ count: 260, radius: 36, height: h, style: "stone", seed: 91, hill: 1 });
  L.add(town);
  const walls = wall({ points: Array.from({ length: 18 }, (_, i) => [Math.cos(i / 18 * 6.283) * 40, Math.sin(i / 18 * 6.283) * 34]), height: h, h: 7, thickness: 2.5, towerEvery: 3, material: "limestone" });
  L.add(walls);
  L.add(createTrees({ count: 200, place: placers.disc(0, 0, 300, (x, z) => Math.hypot(x, z) > 60), height: h, kind: "olive", size: [3, 5] }).group);
  // the ark comes up with dancing (2 Samuel 6)
  const procession = crowd({ count: 160, place: placers.box(-60, -3, -20, 3), height: h, seed: 93, face: [0, 0] });
  L.add(procession.group);
  const ark = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.75, 0.75), MATERIALS.gold());
  L.add(ark);
  const dancer = figure(1.8);
  L.add(dancer);
  // psalms in the stars
  const stars = createStars({ count: ctx.quality === "low" ? 9000 : 22000, radius: 1500, seed: 251, size: 2.2 });
  L.add(stars, ({ rel, time, pixelRatio, camera }) => {
    stars.position.copy(camera.position);
    stars.material.uniforms.uOpacity.value = pulse(rel, 5.5, 7, 19, 22);
    stars.material.uniforms.uTime.value = time;
    stars.material.uniforms.uPixelRatio.value = pixelRatio;
  });
  // the shepherd's field
  const flock = herd({ kind: "sheep", count: 50, place: placers.disc(60, 20, 18), height: h, seed: 95 });
  L.add(flock);
  const shepherd = figure(1.7, { staff: true });
  shepherd.position.set(66, h(66, 26), 26);
  L.add(shepherd);
  // the chamber over the gate; a lamp; one figure
  const mourner = figure(1.8);
  mourner.position.set(0, h(0, 34) + 7, 34);
  L.add(mourner);
  const lamp = glowSprite(0xffb060, 2, 0);
  lamp.position.set(1.2, h(0, 34) + 8, 34);
  L.add(lamp);
  L.onUpdate(({ rel, time }) => {
    const k = sramp(rel, 0, 5.5);
    const ax = lerp(-50, -4, k);
    ark.position.set(ax, h(ax, 0) + 1.6, 0);
    dancer.position.set(ax + 3, h(ax + 3, 0) + Math.abs(Math.sin(time * 5)) * 0.3, 0);
    dancer.rotation.y = time * 2;
    procession.group.position.x = k * 40;
    procession.group.position.y = 0;
    ark.visible = dancer.visible = procession.group.visible = rel < 6;
    town.scale.y = lerp(0.6, 1, sramp(rel, 0, 6));
    mourner.visible = rel > 14.5 && rel < 19.5;
    mourner.rotation.x = 0.35;
    lamp.material.opacity = pulse(rel, 14.8, 15.5, 18.8, 19.5) * 0.7;
  });
  return L;
}
