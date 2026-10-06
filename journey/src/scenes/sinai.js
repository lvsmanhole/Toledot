// Act XI — Sinai and the wilderness (Exodus 16–40, Numbers 14). The mountain fills the view: thunder,
// lightning, fire and smoke as of a furnace. Two tables of light. A glint of gold in the camp below. The
// tabernacle under the cloud. Manna on the ground at dawn. Then forty years pass overhead.

import * as THREE from "three";

import { glowSprite, pulse, ramp, sramp } from "../kit/common.js";
import { flameCurtain, pillar, smoke, weather } from "../kit/effects.js";
import { ANIMALS, crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { tabernacle, tents } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { placers } from "../kit/vegetation.js";

const PEAK = [0, -240];

export function create(ctx) {
  const height = composeHeight([heights.rolling(6, 0.01, 181), heights.mountain(PEAK[0], PEAK[1], 170, 190, 182, 1.25), heights.mountain(-200, -260, 110, 110, 183), heights.mountain(210, -280, 120, 120, 184), heights.flatten(0, 60, 60, 120, 2)], 1);
  const top = new THREE.Vector3(PEAK[0], height(PEAK[0], PEAK[1]), PEAK[1]);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "sinai", size: 1400 },
    sky: (rel) => {
      const storm = 1 - sramp(rel, 20, 23);
      if (rel < 24.5) return [[storm, "storm"], [1 - storm, "golden"]];
      if (rel < 28.5) return [[1, "dawn"]];
      const d = 0.5 + 0.5 * Math.sin(rel * 3.5);
      return [[d, "desert"], [1 - d, "night"]];
    },
    lightning: (rel) => pulse(rel, 1, 3, 15, 17),
    wind: (rel) => 0.4 + pulse(rel, 1, 3, 15, 17),
    camera: [
      [0, [40, 18, 180], [0, 90, -200], 50],
      [7, [20, 14, 120], [0, 150, -230], 56],
      [12.5, [10, 80, 40], [0, top.y + 6, PEAK[1]], 40],
      [16.5, [16, 40, 120], [0, 10, 60], 46],
      [20.5, [-36, 14, 104], [0, 4, 62], 44],
      [24.5, [-60, 30, 140], [0, 60, -100], 46],
      [28.5, [10, 3, 90], [0, 1, 70], 44],
      [34, [0, 120, 320], [0, 60, -200], 44],
    ],
    grade: (rel) => ({ bloom: 0.35 + 0.4 * pulse(rel, 12, 13, 16, 17), threshold: 0.75 }),
    audio: (rel) => ({ drone: 0.55 * (1 - sramp(rel, 17, 20)) + 0.2, wind: 0.3 + 0.5 * pulse(rel, 1, 3, 15, 17), fire: 0.4 * pulse(rel, 6, 8, 15, 17), shimmer: 0.3 * pulse(rel, 12, 13, 16, 17) }),
  });
  const h = L.height;
  // the camp below the mountain
  const camp = tents({ count: ctx.quality === "low" ? 300 : 700, radius: 110, inner: 24, height: h, seed: 31 });
  camp.position.set(0, 0, 70);
  L.add(camp);
  const people = crowd({ count: ctx.quality === "low" ? 300 : 700, place: placers.box(-80, 20, 80, 50), height: h, seed: 33, face: [0, -240] });
  L.add(people.group);
  // fire and smoke on the summit (Exodus 19:18)
  const fire = flameCurtain({ width: 70, height: 30, gain: 0.5 });
  fire.position.set(top.x, top.y - 20, top.z + 20);
  L.add(fire);
  const plume = smoke({ rise: 260, spread: 40, lean: [0.1, 0.05], color: [0.16, 0.15, 0.15], opacity: 0.45, size: 180, count: 1400, seed: 5 });
  plume.position.copy(top).add(new THREE.Vector3(0, -6, 0));
  L.add(plume);
  // two tables of stone, written with the finger of God (Exodus 31:18)
  const tables = new THREE.Group();
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.6, 0.4), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.6, 2), transparent: true, opacity: 0 }));
    t.position.x = s * 1.5;
    tables.add(t);
  }
  tables.position.copy(top).add(new THREE.Vector3(0, 10, 18));
  L.add(tables);
  // the molten calf in the camp
  const calf = new THREE.Mesh(ANIMALS.ox(), new THREE.MeshStandardMaterial({ color: 0xd8a640, metalness: 1, roughness: 0.25, emissive: 0x4a3008, emissiveIntensity: 0.6 }));
  calf.scale.setScalar(1.6);
  calf.position.set(0, h(0, 64) + 1.2, 64);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 2), new THREE.MeshStandardMaterial({ color: 0x5a4a38 }));
  plinth.position.set(0, h(0, 64) + 0.6, 64);
  const calfGlow = glowSprite(0xffc060, 6, 0);
  calfGlow.position.copy(calf.position).add(new THREE.Vector3(0, 1, 0));
  L.add(calf);
  L.add(plinth);
  L.add(calfGlow);
  // the tabernacle, the cloud over it by day (Exodus 40:34)
  const tent = tabernacle();
  tent.position.set(0, h(0, 70), 70);
  L.add(tent);
  const cloud = pillar({ radius: 7, height: 160, color: [0.95, 0.95, 0.92], gain: 0.9 });
  cloud.position.set(-7.5, h(0, 70), 70);
  L.add(cloud);
  const manna = weather("manna", { count: 6000, box: [60, 20, 60] });
  L.add(manna.points);

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const descent = pulse(rel, 1, 3, 15, 17.5);
    fire.material.uniforms.uAmount.value = descent;
    fire.material.uniforms.uTime.value = time;
    fire.visible = descent > 0.01;
    plume.material.uniforms.uAmount.value = descent;
    plume.material.uniforms.uTime.value = time;
    const law = pulse(rel, 12.3, 13.5, 16, 17);
    tables.children.forEach((t) => { t.material.opacity = law; });
    tables.visible = law > 0.01;
    const calfOn = pulse(rel, 16.8, 17.6, 20.4, 21);
    calf.visible = plinth.visible = calfOn > 0.01;
    calfGlow.material.opacity = calfOn * 0.8;
    const glory = pulse(rel, 20.8, 22, 24.5, 26);
    cloud.material.uniforms.uAmount.value = glory;
    cloud.material.uniforms.uTime.value = time;
    tent.visible = rel > 20;
    manna.update({ time, pixelRatio, amount: pulse(rel, 24.5, 25.5, 28, 29), center: camera.position });
    people.group.visible = rel < 21;
    camp.visible = rel < 29 || ramp(rel, 29, 34) < 0.7;
  });
  return L;
}
