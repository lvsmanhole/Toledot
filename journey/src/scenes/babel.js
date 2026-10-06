// Act V — Babel (Genesis 11). The plain of Shinar at golden hour: a mud-brick city on the river and a
// tower rising past the haze. The camera climbs the ramp. The words break into tongues (in the captions)
// as dust rises; the builders scatter outward from the unfinished tower.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { babelTower, city, ziggurat } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

const river = (z) => 140 + Math.sin(z * 0.006) * 30;

export function create(ctx) {
  const height = composeHeight([heights.rolling(2.5, 0.006, 61), heights.channel(river, 14, -1.5, 10), heights.flatten(0, 0, 70, 140, 1.2)], 1.2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "mesopotamia", size: 1600, wetLevel: 0.9 },
    water: { size: 1600, flow: 0.4, flowDir: [0, 1], deep: [0.05, 0.08, 0.07], level: -0.2 },
    sky: (rel) => [[1 - sramp(rel, 11, 16), "golden"], [sramp(rel, 11, 16), "ash"]],
    wind: (rel) => 0.3 + 1.5 * pulse(rel, 11, 13, 19, 22),
    camera: [
      [0, [-260, 40, 260], [0, 50, 0], 42],
      [5, [-120, 18, 120], [0, 35, 0], 46],
      [9, [70, 60, 50], [0, 75, 0], 50],
      [12, [48, 92, -24], [0, 90, 0], 54],
      [16, [-40, 120, -90], [0, 40, 60], 52],
      [24, [-80, 220, -300], [0, 0, 200], 48],
    ],
    grade: (rel) => ({ saturation: 1 - 0.3 * pulse(rel, 11, 13, 20, 24) }),
    audio: (rel) => ({ drone: 0.3 + 0.4 * pulse(rel, 11, 13, 18, 22), wind: 0.25 + 0.6 * pulse(rel, 11, 13, 19, 22), shimmer: 0.1 }),
  });
  const h = L.height;

  const tower = babelTower({ radius: 46, levels: 10, levelH: 10, unfinished: 2 });
  tower.position.y = h(0, 0) - 0.5;
  L.add(tower);
  const town = city({ count: 650, radius: 120, inner: 60, height: h, style: "mud", seed: 7 });
  L.add(town);
  const temple = ziggurat({ base: 34, tiers: 4, tierH: 5 });
  temple.position.set(-95, h(-95, 70), 70);
  L.add(temple);
  L.add(createTrees({ count: 220, place: placers.box(100, -500, 190, 500, (x, z) => Math.abs(x - river(z)) > 18 && Math.abs(x - river(z)) < 45), height: h, kind: "palm", size: [3.5, 6] }).group);

  // four crowds of builders around the tower; at the confusion they walk away in four directions
  const crowds = [0, 1, 2, 3].map((q) => {
    const a = q * (Math.PI / 2) + 0.4;
    const c = crowd({ count: ctx.quality === "low" ? 120 : 260, place: placers.disc(Math.cos(a) * 53, Math.sin(a) * 53, 6), height: h, seed: 30 + q });
    L.add(c.group);
    return { group: c.group, dir: new THREE.Vector3(Math.cos(a), 0, Math.sin(a)) };
  });
  const dust = weather("dust", { count: ctx.quality === "low" ? 3000 : 7000, box: [160, 60, 160] });
  L.add(dust.points);

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const scatter = sramp(rel, 15.5, 23);
    for (const c of crowds) {
      c.group.position.copy(c.dir).multiplyScalar(scatter * 260);
      c.group.visible = scatter < 0.98;
    }
    dust.update({ time, pixelRatio, amount: pulse(rel, 11, 13.5, 20, 23), center: camera.position, wind: [1, 0.3] });
  });
  return L;
}
