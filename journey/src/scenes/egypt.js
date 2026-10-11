// Genesis 39–50 — Egypt. The Nile through the desert: palms, reed banks, pyramids in the haze, a pylon
// temple, rows of granaries, the palace colonnade. Joseph raised over the land; caravans of every nation
// coming for grain in the famine; the brothers before him.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { crowd, figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { colonnade, granaries, pylon, pyramid } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

export const nile = (z) => 40 + Math.sin(z * 0.004) * 30;
// Pharaoh's palace: a hall of columns on a levelled terrace (its floor is PALACE.floor)
export const PALACE = { x: -20, z: 140, level: 1.5, floor: 1.85 };
const onTerrace = (x, z) => x > -54 && x < 14 && z > 120 && z < 160;

export function egyptHeight(seed = 141) {
  return composeHeight([heights.dunes(8, 80, 0.2, seed), (x, z) => Math.max(0, Math.abs(x - nile(z)) - 90) * 0.04, heights.flatten(PALACE.x, PALACE.z, 34, 60, PALACE.level), heights.channel(nile, 22, -1.6, 14)], 0.8);
}

/** The Egyptian set: river, palms, pyramids, temple, granaries, palace. Shared with the plagues. */
export function egyptSet(ctx, L, h) {
  const palms = createTrees({ count: 260, place: placers.box(-200, -600, 260, 600, (x, z) => { const d = Math.abs(x - nile(z)); return d > 26 && d < 80 && !onTerrace(x, z); }), height: h, kind: "palm", size: [3.5, 6] });
  L.add(palms.group, (s) => palms.update({ time: s.time, wind: s.wind }));
  const reeds = createBlades({ kind: "reeds", count: ctx.quality === "low" ? 8000 : 20000, place: placers.box(-200, -500, 260, 500, (x, z) => { const d = Math.abs(x - nile(z)); return d > 20 && d < 30; }), height: h, minH: -0.5 });
  L.add(reeds.mesh, (s) => reeds.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  for (const [x, z, b, ht] of [[-260, -380, 120, 82], [-150, -460, 95, 64], [-340, -300, 70, 46]]) {
    const p = pyramid({ base: b, height: ht });
    p.position.set(x, h(x, z) - 1, z);
    L.add(p);
  }
  const temple = pylon({ width: 60, height: 26, depth: 10 });
  temple.position.set(-30, h(-30, -40), -40);
  temple.rotation.y = Math.PI / 2;
  L.add(temple);
  const stores = granaries({ rows: 4, cols: 9 });
  stores.position.set(-60, h(-60, 60), 60);
  L.add(stores);
  const palace = colonnade({ count: 10, spacing: 5, height: 14, radius: 1.1, rows: 2, rowGap: 14, style: "egypt" });
  palace.position.set(PALACE.x, PALACE.floor + 0.25, PALACE.z);
  L.add(palace);
  return { palace, stores, temple };
}

export function create(ctx) {
  const height = egyptHeight();
  const F = PALACE.floor;
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1600, wetLevel: 1.2 },
    water: { size: 1600, flow: 0.25, flowDir: [0, -1], deep: [0.03, 0.08, 0.07], level: -0.3 },
    sky: (rel) => [[1 - pulse(rel, 6, 8, 11, 12), "desert"], [pulse(rel, 6, 8, 11, 12), "golden"]],
    camera: [
      [0, [180, 70, 260], [0, 10, 0], 42],
      [5, [40, 14, 160], [-20, 8, 140], 46],
      [9, [10, 30, 110], [-60, 2, 60], 50],
      // into the palace down its central aisle, at standing height on the floor, toward the throne
      [12, [10, F + 4.5, 140], [-45, F + 2.6, 140], 44],
      [18, [-24, F + 2.3, 140.6], [-45, F + 2.2, 140], 40],
      [21.5, [4, F + 4, 140], [-45, F + 2.6, 140], 42],
      [30, [120, 50, 120], [-200, 30, -300], 40],
    ],
    grade: () => ({ saturation: 1.05, tint: [1.04, 1, 0.94] }),
    audio: () => ({ drone: 0.3, water: 0.3, wind: 0.2 }),
  });
  const h = L.height;
  egyptSet(ctx, L, h);
  // Joseph on a dais at the head of the hall, facing down the aisle, a gold glint on his chain (Genesis 41:42)
  const joseph = figure(1.85, { robe: 0xe8e0cc });
  joseph.position.set(-45, F + 1.6, 140);
  joseph.rotation.y = Math.PI / 2;
  const dais = new THREE.Mesh(new THREE.BoxGeometry(4, 1.6, 7), new THREE.MeshStandardMaterial({ color: 0xcbbd9e, roughness: 0.9 }));
  dais.position.set(-45, F + 0.8, 140);
  const chain = glowSprite(0xffd27a, 1.2, 0);
  chain.position.copy(joseph.position).add(new THREE.Vector3(0.25, 1.3, 0));
  L.add(dais);
  L.add(joseph);
  L.add(chain);
  // the nations coming for grain; then the eleven brothers before him
  const caravans = herd({ kind: "camel", count: 50, place: placers.box(60, 20, 200, 120), height: h, seed: 9 });
  const buyers = crowd({ count: 260, place: placers.box(-50, 30, 30, 120), height: h, seed: 11, face: [-60, 60] });
  L.add(caravans);
  L.add(buyers.group);
  const brothers = crowd({ count: 11, place: placers.box(-38, 136.5, -31, 143.5), height: () => F, seed: 13, face: [-45, 140] });
  L.add(brothers.group);
  L.onUpdate(({ rel }) => {
    chain.material.opacity = sramp(rel, 1, 3) * 0.9;
    const famine = pulse(rel, 6, 7, 11.5, 12.5);
    caravans.visible = buyers.group.visible = famine > 0.02;
    caravans.position.x = -60 * (1 - famine);
    brothers.group.visible = rel > 11.5 && rel < 18;
  });
  return L;
}
