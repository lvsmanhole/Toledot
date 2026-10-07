// Ezra, Esther, Nehemiah — the return. Morning on the ruins of Jerusalem; the foundation of the house
// laid among the rubble while some shout and some weep. Night in Susa: a queen alone among the columns.
// Then the walls rising, course by course, in fifty-two days.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS, city, colonnade, wall } from "../kit/structures.js";
import { createBlades, createTrees, placers, scatterRocks } from "../kit/vegetation.js";
import { rng } from "../engine/noise.js";
import { jerusalemHeight } from "./david.js";

const SUSA = new THREE.Vector3(600, 0, 600); // the palace is staged away from the city

export function create(ctx) {
  const height = jerusalemHeight(311);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1600 },
    sky: (rel) => (rel < 11.5 ? "morning" : rel < 17 ? [[1, "night"]] : "golden"),
    camera: [
      [0, [-100, 50, 120], [0, 28, 0], 44],
      [6, [30, 32, 30], [0, 29, 0], 46],
      [11, [16, 30, 14], [0, 29, -4], 44],
      [11.5, [SUSA.x + 30, 4, SUSA.z + 6], [SUSA.x, 3, SUSA.z], 44],
      [16.5, [SUSA.x + 14, 3, SUSA.z + 4], [SUSA.x, 2.5, SUSA.z], 40],
      [17, [-200, 50, 40], [0, 28, 0], 44],
      [24, [-150, 90, 160], [0, 20, 0], 42],
    ],
    audio: (rel) => ({ drone: 0.25, wind: 0.2, shimmer: 0.2 * pulse(rel, 6, 7, 10, 11) }),
  });
  const h = L.height;
  const top = h(0, 0);
  const ruins = city({ count: 300, radius: 110, inner: 30, height: h, style: "stone", seed: 117 });
  ruins.scale.y = 0.5;
  L.add(ruins);
  L.add(createTrees({ count: 200, place: placers.disc(0, 0, 320, (x, z) => Math.hypot(x, z) > 140), height: h, kind: "olive", size: [3, 5] }).group);
  // the foundation (Ezra 3): courses of hewn stone laid out on the old lines, block by block
  const blocks = [];
  const br = rng(123);
  for (let course = 0; course < 2; course++) {
    const y = top + 0.45 + course * 0.9;
    const edge = (x0, z0, x1, z1) => {
      const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.75);
      for (let i = 0; i < n; i++) {
        if (course === 1 && br() < 0.35) continue; // the upper course still going down
        const k = (i + 0.5) / n;
        blocks.push([x0 + (x1 - x0) * k + (br() - 0.5) * 0.08, y, z0 + (z1 - z0) * k + (br() - 0.5) * 0.08, Math.atan2(z1 - z0, x1 - x0)]);
      }
    };
    edge(-20, -7, 20, -7);
    edge(20, 7, -20, 7);
    edge(-20, 7, -20, -7);
    edge(20, -7, 20, 7);
    edge(-6, -7, -6, 7); // the cross wall before the most holy place
  }
  blocks.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const foundation = new THREE.InstancedMesh(new THREE.BoxGeometry(1.7, 0.88, 1.1), MATERIALS.limestone(), blocks.length);
  const bm = new THREE.Matrix4();
  const bq = new THREE.Quaternion();
  blocks.forEach(([x, y, z, a], i) => foundation.setMatrixAt(i, bm.compose(new THREE.Vector3(x, y, z), bq.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a + (br() - 0.5) * 0.03), new THREE.Vector3(1, 1, 1))));
  foundation.castShadow = foundation.receiveShadow = true;
  L.add(foundation);
  // the ruin of the old city: rubble heaps among the broken houses, weeds on the slopes
  L.add(scatterRocks({ count: ctx.quality === "low" ? 120 : 260, place: (r) => { const a = r() * 6.283; const d = 24 + r() * 90; return [Math.cos(a) * d, Math.sin(a) * d]; }, height: h, size: [0.5, 2.2], sink: 0.35 }));
  const weeds = createBlades({ count: ctx.quality === "low" ? 25000 : 60000, place: placers.disc(0, 0, 120, (x, z) => Math.hypot(x, z) > 22), height: h, maxH: 200 });
  L.add(weeds.mesh, (s) => weeds.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.8 }));
  const builders = crowd({ count: 260, place: placers.box(-26, -16, 26, 16), height: () => top, seed: 119, face: [0, 0] });
  L.add(builders.group);
  // Susa: the palace at night, a queen alone (Esther 4)
  const palace = colonnade({ count: 6, spacing: 6, height: 14, radius: 0.9, rows: 3, rowGap: 8, material: "limestone" });
  palace.position.copy(SUSA).setY(h(SUSA.x, SUSA.z));
  L.add(palace);
  const esther = figure(1.72, { veiled: true });
  esther.position.copy(SUSA).setY(h(SUSA.x, SUSA.z));
  L.add(esther);
  const lamp = glowSprite(0xffb060, 3, 0);
  lamp.position.copy(SUSA).add(new THREE.Vector3(1.6, h(SUSA.x, SUSA.z) + 1.8, 0.4));
  L.add(lamp);
  const lampLight = new THREE.PointLight(0xffa050, 0, 20, 1.6);
  lampLight.position.copy(lamp.position);
  L.add(lampLight);
  // the walls of Jerusalem rising (Nehemiah 6:15)
  const walls = wall({ points: Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * 6.283) * 128, Math.sin(i / 24 * 6.283) * 118]), height: h, h: 9, thickness: 3, towerEvery: 3, material: "limestone" });
  L.add(walls);
  const masons = crowd({ count: 400, place: (r) => { const a = r() * 6.283; return [Math.cos(a) * 132, Math.sin(a) * 122]; }, height: h, seed: 121 });
  L.add(masons.group);
  L.onUpdate(({ rel }) => {
    foundation.count = Math.max(1, Math.round(blocks.length * lerp(0.15, 1, sramp(rel, 3, 9))));
    builders.group.visible = rel < 11.5;
    const night = pulse(rel, 11.5, 12, 16.5, 17);
    lamp.material.opacity = night * 0.8;
    lampLight.intensity = night * 30;
    const rise = sramp(rel, 17, 22);
    walls.scale.y = Math.max(0.05, rise);
    masons.group.visible = rel > 16.8;
  });
  return L;
}
