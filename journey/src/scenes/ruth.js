// Act XIV — Ruth. The fields of Bethlehem at harvest, golden wheat under a low sun; two women walking
// the road together; the reapers. The golden line returns strongly: Ruth, Obed, Jesse, David.

import * as THREE from "three";

import { glowSprite, sramp, textSprite } from "../kit/common.js";
import { lineageThread } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const LINE = ["Boaz", "Ruth", "Obed", "Jesse", "David"];

export function create(ctx) {
  const height = composeHeight([heights.rolling(10, 0.008, 221), heights.mountain(-60, -220, 70, 30, 222)], 2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "fields", size: 1200 },
    sky: () => "golden",
    wind: () => 0.45,
    camera: [
      [0, [40, 4, 60], [0, 2, 20], 44],
      [7, [-10, 3, 20], [-30, 2, -10], 40],
      [11, [30, 18, 30], [-40, 8, -100], 44],
      [16, [10, 40, 80], [-60, 20, -200], 42],
    ],
    grade: () => ({ saturation: 1.05, tint: [1.06, 1, 0.88], bloom: 0.16, threshold: 0.96 }),
    audio: () => ({ wind: 0.35, drone: 0.2, shimmer: 0.2 }),
  });
  const h = L.height;
  // keep the standing grain a few metres off the camera's path so no stalk fills the frame
  const path = [[40, 60], [-10, 20], [30, 30], [10, 80]];
  const nearPath = (x, z) => path.slice(1).some(([bx, bz], i) => {
    const [ax, az] = path[i];
    const k = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / ((bx - ax) ** 2 + (bz - az) ** 2)));
    return Math.hypot(x - ax - k * (bx - ax), z - az - k * (bz - az)) < 7;
  });
  const wheat = createBlades({ kind: "wheat", count: ctx.quality === "low" ? 40000 : 110000, place: placers.disc(0, 0, 140, (x, z) => Math.abs(x - z * 0.3) > 3 && !nearPath(x, z)), height: h });
  L.add(wheat.mesh, (s) => wheat.update({ time: s.time, wind: s.wind, fog: s.fog, light: 1.1 }));
  L.add(createTrees({ count: 70, place: placers.disc(0, 0, 300, (x, z) => Math.hypot(x, z) > 150), height: h, kind: "olive", size: [3, 5] }).group);
  const town = city({ count: 120, radius: 26, height: (x, z) => h(x - 60, z + 220), style: "stone", seed: 71 });
  town.position.set(-60, 0, -220);
  L.add(town);
  const reapers = crowd({ count: 40, place: placers.disc(-20, 10, 40), height: h, seed: 73 });
  L.add(reapers.group);
  const ruth = figure(1.7, { veiled: true });
  const naomi = figure(1.68, { veiled: true });
  L.add(ruth);
  L.add(naomi);
  // the line, standing up out of the field like sheaves of light
  const posts = LINE.map((name, i) => {
    const x = -30 - i * 34;
    const z = -40 - i * 32;
    const label = textSprite(name, { size: 64, scale: 2.2, color: "#f4d48a" });
    label.position.set(x, h(x, z) + 9, z);
    label.material.opacity = 0;
    const glow = glowSprite(0xffcf7a, 8, 0);
    glow.position.set(x, h(x, z) + 5, z);
    L.add(label);
    L.add(glow);
    return { label, glow, at: [x, h(x, z) + 2, z] };
  });
  const thread = lineageThread(posts.map((p) => p.at), { width: 0.22, gain: 2 });
  L.add(thread);
  L.onUpdate(({ rel, time }) => {
    const walk = sramp(rel, 0, 7);
    ruth.position.set(10 - walk * 30, 0, 30 - walk * 30 * 0.3);
    naomi.position.set(ruth.position.x + 1.1, 0, ruth.position.z + 0.6);
    for (const f of [ruth, naomi]) {
      f.position.y = h(f.position.x, f.position.z) + Math.abs(Math.sin(time * 3)) * 0.04 * (walk < 1 ? 1 : 0);
      f.rotation.y = -1.9;
    }
    const draw = sramp(rel, 8, 14);
    thread.material.uniforms.uDraw.value = draw;
    thread.material.uniforms.uTime.value = time;
    posts.forEach((p, i) => {
      const on = sramp(draw, i / LINE.length, i / LINE.length + 0.1);
      p.label.material.opacity = on;
      p.glow.material.opacity = on * 0.6;
    });
  });
  return L;
}
