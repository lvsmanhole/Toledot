// Genesis 19:27–28. Before dawn Abraham stands on the height above Mamre and looks toward the plain:
// far below, the cities are gone; smoke goes up as the smoke of a furnace. Seen only from afar.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { smoke, weather } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";

export function create(ctx) {
  // a ridge in the foreground falling away to a deep basin
  const basin = (x, z) => -60 * Math.exp(-((z + 260) ** 2) / 30000);
  const height = composeHeight([heights.rolling(10, 0.008, 81), basin, heights.mountain(0, 20, 60, 22, 82)], 4);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1400 },
    sky: (rel) => [[1 - sramp(rel, 2, 10), "night"], [sramp(rel, 2, 10), "dawn"]],
    camera: [[0, [6, 30, 30], [0, 22, -40], 40], [10, [3, 29, 26], [0, 4, -260], 34]],
    grade: () => ({ saturation: 0.8, bloom: 0.6, threshold: 0.6 }),
    audio: () => ({ drone: 0.45, wind: 0.3 }),
  });
  const h = L.height;
  const abraham = figure(1.8, { staff: true });
  abraham.position.set(0, h(0, 18), 18);
  abraham.rotation.y = Math.PI;
  L.add(abraham);
  const columns = [-60, -15, 40].map((x, i) => {
    const s = smoke({ rise: 180, spread: 26, lean: [0.25, 0.1], color: [0.26, 0.2, 0.18], opacity: 0.34, size: 120, seed: 90 + i, count: 1200 });
    s.position.set(x, h(x, -260), -260 - i * 30);
    L.add(s);
    const ember = glowSprite(0xff5a20, 60, 0);
    ember.position.set(x, h(x, -260) + 6, -260 - i * 30);
    L.add(ember);
    return { s, ember };
  });
  const ash = weather("ash", { count: 2500, box: [60, 30, 60] });
  L.add(ash.points);
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    for (const c of columns) {
      c.s.material.uniforms.uTime.value = time + 40;
      c.s.material.uniforms.uAmount.value = 1;
      c.ember.material.opacity = 0.45 + 0.15 * Math.sin(time * 1.7);
    }
    ash.update({ time, pixelRatio, amount: pulse(rel, 3, 6, 9, 10) * 0.5, center: camera.position, wind: [0.3, 0.6] });
  });
  return L;
}
