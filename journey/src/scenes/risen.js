// Matthew 28 — the first day of the week, very early. A garden before dawn; the stone rolled away;
// light from the empty tomb; women coming with spices stop at the entrance. The sun rises.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { lightShaft, weather } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { tomb } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

export function create(ctx) {
  const height = composeHeight([heights.rolling(8, 0.01, 361), heights.flatten(0, 0, 14, 30, 2)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 900 },
    sky: (rel) => [[1 - sramp(rel, 2, 9), "night"], [sramp(rel, 2, 9) * (1 - sramp(rel, 9, 13)), "dawn"], [sramp(rel, 9, 13), "morning"]],
    camera: [[0, [14, 3, 24], [0, 2.2, 0], 44], [6, [6, 2.4, 12], [0, 1.8, -2], 42], [14, [-10, 6, 26], [10, 8, -60], 46]],
    grade: (rel) => ({ bloom: 0.6, threshold: 0.6, exposure: 1 + 0.2 * pulse(rel, 3, 5, 9, 12) }),
    audio: (rel) => ({ drone: 0.2, shimmer: 0.25 + 0.5 * pulse(rel, 2.5, 4, 10, 13), wind: 0.15 }),
  });
  const h = L.height;
  const grave = tomb();
  grave.position.set(0, h(0, -4), -4);
  L.add(grave);
  const grass = createBlades({ count: 25000, place: placers.disc(0, 6, 50), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.8 }));
  L.add(createTrees({ count: 60, place: placers.disc(0, 0, 120, (x, z) => Math.hypot(x, z) > 16), height: h, kind: "olive", size: [3, 5] }).group);
  const within = glowSprite(0xfff8ea, 6, 0);
  within.position.set(0, h(0, -4) + 1.8, -2.2);
  L.add(within);
  const outpour = lightShaft({ length: 30, top: 1.8, bottom: 6, color: [1, 0.97, 0.9], gain: 0.5 });
  outpour.rotation.x = -Math.PI / 2;
  outpour.position.set(0, h(0, -4) + 1.8, -2.4);
  L.add(outpour);
  const women = [0, 1, 2].map((i) => {
    const f = figure(1.68, { veiled: true });
    L.add(f);
    return f;
  });
  const motes = weather("motes", { count: 1500, box: [30, 12, 30] });
  L.add(motes.points);
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const { stone } = grave.userData;
    const roll = sramp(rel, 0.5, 2.5);
    stone.position.x = roll * 4.6;
    stone.rotation.y = -roll * 2.2;
    const light = sramp(rel, 2, 4.5);
    within.material.opacity = light * 0.9;
    outpour.material.uniforms.uAmount.value = light;
    outpour.material.uniforms.uTime.value = time;
    const walk = sramp(rel, 3, 7);
    women.forEach((w, i) => {
      w.position.set(lerp(18, 2.5, walk) + i * 1.1, 0, lerp(14, 4.5, walk) + (i - 1) * 0.8);
      w.position.y = h(w.position.x, w.position.z) + (walk > 0 && walk < 1 ? Math.abs(Math.sin(time * 3 + i)) * 0.04 : 0);
      w.lookAt(0, w.position.y, -3);
      w.rotation.x = 0.25 * pulse(rel, 7, 8, 12, 13);
    });
    motes.update({ time, pixelRatio, amount: light * 0.7, center: camera.position });
  });
  return L;
}
