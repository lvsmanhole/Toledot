// Ezra, Esther, Nehemiah — the return. Morning on the ruins of Jerusalem; the foundation of the house
// laid among the rubble while some shout and some weep. Night in Susa: a queen alone among the columns.
// Then the walls rising, course by course, in fifty-two days.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, colonnade, wall } from "../kit/structures.js";
import { createTrees, placers } from "../kit/vegetation.js";
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
  // the foundation (Ezra 3)
  const foundation = new THREE.Mesh(new THREE.BoxGeometry(40, 1.2, 14), new THREE.MeshStandardMaterial({ color: 0xcbbd9e, roughness: 0.95 }));
  foundation.position.set(0, top + 0.1, 0);
  L.add(foundation);
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
    foundation.scale.x = lerp(0.2, 1, sramp(rel, 3, 9));
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
