// 2 Kings 25 — Jerusalem burns. The most somber passage of the journey: the city at night in flames,
// the house of the LORD burning; ash drifting; almost no sound. The camera moves low through the ruin,
// then follows the line of captives walking out toward the east.

import * as THREE from "three";

import { lerp, pulse, sramp } from "../kit/common.js";
import { flame, smoke, weather } from "../kit/effects.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, solomonTemple, wall } from "../kit/structures.js";
import { placers } from "../kit/vegetation.js";
import { rng } from "../engine/noise.js";
import { jerusalemHeight } from "./david.js";

export function create(ctx) {
  const height = jerusalemHeight(281);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "ashen", size: 1300 },
    sky: (rel) => [[1 - sramp(rel, 11.5, 15), "night"], [sramp(rel, 11.5, 15), "ash"]], // the grey morning after
    camera: [
      [0, [-150, 60, 150], [0, 28, 0], 44],
      [7, [60, 31, 40], [0, 34, 0], 46],
      [11, [38, 30, 20], [-20, 30, -10], 44],
      [15, [140, 20, 0], [400, 10, 0], 44],
      [22, [120, 40, 40], [500, 10, -40], 44],
    ],
    grade: (rel) => ({ saturation: 0.55 - 0.15 * sramp(rel, 8, 14), bloom: 0.4, threshold: 0.75, tint: [1.08, 0.92, 0.82] }),
    audio: (rel) => ({ drone: 0.25, fire: 0.5 * (1 - sramp(rel, 8, 14)), wind: 0.15 }),
  });
  const h = L.height;
  const top = h(0, 0);
  const temple = solomonTemple();
  temple.position.set(0, top - 0.2, 0);
  temple.rotation.z = 0.02;
  L.add(temple);
  const town = city({ count: 380, radius: 110, inner: 60, height: h, style: "stone", seed: 103 });
  town.scale.y = 0.6; // broken-down houses
  L.add(town);
  L.add(wall({ points: Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * 6.283) * 128, Math.sin(i / 24 * 6.283) * 118]), height: h, h: 4, thickness: 3, towerEvery: 5, material: "basalt" }));
  const fires = [];
  const r = rng(29);
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.283;
    const d = i < 6 ? r() * 15 : 50 + r() * 70;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const f = flame({ width: 4 + r() * 4, height: 8 + r() * 8, gain: 0.7, seed: i });
    f.position.set(x, h(x, z) + (i < 6 ? 6 : 0), z);
    L.add(f);
    fires.push(f);
  }
  const plume = smoke({ rise: 220, spread: 50, lean: [0.4, 0.1], color: [0.15, 0.12, 0.11], opacity: 0.4, size: 160, count: 1500 });
  plume.position.set(0, top, 0);
  L.add(plume);
  const glow = new THREE.PointLight(0xff7030, 400, 260, 1.2);
  glow.position.set(0, top + 20, 0);
  L.add(glow);
  const ash = weather("ash", { count: ctx.quality === "low" ? 5000 : 12000, box: [80, 40, 80] });
  L.add(ash.points);
  const captives = crowd({ count: ctx.quality === "low" ? 400 : 900, place: placers.box(140, -6, 420, 6), height: h, seed: 107, face: [900, 0] });
  L.add(captives.group);
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const burning = 1 - sramp(rel, 12, 18);
    fires.forEach((f) => { f.material.uniforms.uTime.value = time; f.material.uniforms.uAmount.value = burning; f.visible = burning > 0.01; });
    plume.material.uniforms.uTime.value = time;
    plume.material.uniforms.uAmount.value = 0.4 + 0.6 * burning;
    glow.intensity = 400 * burning;
    temple.scale.y = lerp(1, 0.25, sramp(rel, 4, 11));
    ash.update({ time, pixelRatio, amount: 0.8, center: camera.position, wind: [0.4, 0.1] });
    captives.group.visible = rel > 11.5;
    captives.group.position.x = sramp(rel, 14, 22) * 160;
    captives.group.position.y = Math.abs(Math.sin(time * 2)) * 0.03;
  });
  return L;
}
