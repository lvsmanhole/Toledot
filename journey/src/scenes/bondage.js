// Act IX — Israel in bondage (Exodus 1–2). Time accelerates: suns rise and set in seconds as the store
// cities climb out of the brick fields and the crowds of labourers grow. Harsh light. Then quiet: a
// basket of bulrushes among the reeds at the river's brink.

import * as THREE from "three";

import { glowSprite, lerp, pulse, ramp, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { pylon, wall } from "../kit/structures.js";
import { createBlades, placers } from "../kit/vegetation.js";
import { egyptHeight, egyptSet, nile } from "./egypt.js";

export function create(ctx) {
  const height = egyptHeight(151);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1600, wetLevel: 1.2 },
    water: { size: 1600, flow: 0.25, flowDir: [0, -1], deep: [0.03, 0.08, 0.07], level: -0.3 },
    sky: (rel) => {
      if (rel > 14.5) return [[1 - sramp(rel, 14.5, 16), "noon"], [sramp(rel, 14.5, 16), "dawn"]];
      // the days blur past
      const d = 0.5 + 0.5 * Math.sin(rel * 4.2);
      return [[d, "noon"], [1 - d, "dusk"]];
    },
    camera: [
      [0, [-140, 60, 200], [-100, 10, 0], 44],
      [8, [-170, 40, 80], [-110, 18, -20], 48],
      [14, [-60, 90, 60], [-120, 20, -40], 46],
      [16, [nile(40) - 30, 3, 50], [nile(40) - 20, 0.5, 38], 40],
      [22, [nile(40) - 28, 2.2, 44], [nile(40) - 21, 0.3, 37], 36],
    ],
    grade: (rel) => ({ saturation: rel < 15 ? 0.85 : 1, tint: rel < 15 ? [1.08, 0.98, 0.86] : [1, 0.98, 0.95], exposure: rel < 15 ? 1.05 : 1 }),
    audio: (rel) => ({ drone: 0.45 * (1 - ramp(rel, 14, 16)), wind: 0.3, water: 0.45 * ramp(rel, 15, 16) }),
  });
  const h = L.height;
  egyptSet(ctx, L, h);
  // the store cities Pithom and Raamses rising from the brick fields (Exodus 1:11)
  const cityWalls = wall({ points: [[-180, -80], [-60, -80], [-60, 20], [-180, 20]], height: h, h: 12, thickness: 4, towerEvery: 1, material: "mud" });
  L.add(cityWalls);
  const gate = pylon({ width: 40, height: 22, depth: 8 });
  gate.position.set(-120, h(-120, 20), 22);
  L.add(gate);
  const bricks = new THREE.InstancedMesh(new THREE.BoxGeometry(1.2, 0.5, 0.6), new THREE.MeshStandardMaterial({ color: 0x7a5d40, roughness: 1 }), 1600);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 1600; i++) {
    const x = -200 + (i % 40) * 3.2;
    const z = 40 + Math.floor(i / 40) * 2.2;
    m.makeTranslation(x, h(x, z) + 0.25 + Math.floor((i * 7) % 3) * 0.5, z);
    bricks.setMatrixAt(i, m);
  }
  L.add(bricks);
  const labourers = crowd({ count: ctx.quality === "low" ? 500 : 1100, place: placers.box(-210, -100, -40, 130), height: h, seed: 17, staffChance: 0.02 });
  L.add(labourers.group);
  const dust = weather("dust", { count: 4000, box: [140, 50, 140] });
  L.add(dust.points);
  // the basket in the reeds
  const basket = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.6, 4, 12), new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 0.9 }));
  basket.rotation.z = Math.PI / 2;
  const bx = nile(38) - 21.5;
  basket.position.set(bx, 0.05, 38);
  L.add(basket);
  const glow = glowSprite(0xffe2b0, 2.2, 0);
  glow.position.set(bx, 0.6, 38);
  L.add(glow);
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const rise = sramp(rel, 1, 13);
    cityWalls.scale.y = Math.max(0.01, rise);
    gate.scale.y = Math.max(0.01, lerp(0, 1, sramp(rel, 4, 13)));
    labourers.group.visible = rel < 15;
    labourers.group.scale.setScalar(1);
    dust.update({ time, pixelRatio, amount: 0.5 * (1 - ramp(rel, 13, 15)), center: camera.position, wind: [0.8, 0.2] });
    basket.position.y = 0.05 + Math.sin(time * 1.4) * 0.04;
    basket.rotation.y = Math.sin(time * 0.5) * 0.15;
    glow.material.opacity = pulse(rel, 15.5, 17, 21, 22) * 0.6;
  });
  return L;
}
