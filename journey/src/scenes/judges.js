// Act XIII — the Judges. A darker, broken land. Overhead turns the cycle of the book — rebellion,
// oppression, the cry, a judge raised up, deliverance, rest — lit again and again. Deborah under her palm;
// Gideon's three hundred lamps breaking out at once on the hillside; Samson's pillars falling into the
// dark; and at the end, no king.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp, textSprite } from "../kit/common.js";
import { smoke } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { colonnade } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { rng } from "../engine/noise.js";

const CYCLE = ["Rebellion", "Oppression", "The cry", "A judge raised up", "Deliverance", "Rest"];

export function create(ctx) {
  const height = composeHeight([heights.rolling(22, 0.007, 211), heights.flatten(0, 0, 20, 40, 8)], 4);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1300 },
    sky: (rel) => {
      if (rel < 9) return [[1, "dusk"]];
      if (rel < 14.5) return [[1, "night"]];
      if (rel < 20) return [[1, "ash"]];
      return [[1, "night"]];
    },
    camera: [
      [0, [0, 60, 160], [0, 20, 0], 46],
      [5.5, [-30, 8, 30], [-46, 6, 0], 42],
      [9.5, [80, 30, 80], [120, 10, 0], 46],
      [15, [10, 6, -60], [0, 8, -110], 50],
      [20.5, [20, 50, 60], [0, 10, -60], 46],
      [26, [0, 90, 200], [0, 10, -40], 44],
    ],
    grade: () => ({ saturation: 0.7, bloom: 0.45, threshold: 0.6 }),
    audio: (rel) => ({ drone: 0.45, wind: 0.3, fire: 0.3 * pulse(rel, 9.5, 11, 13, 14.5) }),
  });
  const h = L.height;
  L.add(createTrees({ count: 160, place: placers.disc(0, 0, 300), height: h, kind: "olive", size: [2.5, 5] }).group);
  // the turning cycle, hung in the sky
  const ring = new THREE.Group();
  const words = CYCLE.map((w, i) => {
    const s = textSprite(w, { size: 64, scale: 5.5, color: "#efe6d2" });
    const a = (i / CYCLE.length) * Math.PI * 2;
    s.position.set(Math.cos(a) * 34, Math.sin(a) * 34, 0);
    s.material.opacity = 0.15;
    ring.add(s);
    return s;
  });
  ring.position.set(0, 110, -120);
  L.add(ring);
  // Deborah under the palm tree (Judges 4:5)
  const palm = createTrees({ count: 1, place: () => [-46, 0], height: h, kind: "palm", size: [5, 5] });
  L.add(palm.group);
  const deborah = figure(1.75, { veiled: true });
  deborah.position.set(-44.5, h(-44.5, 1.5), 1.5);
  L.add(deborah);
  // Gideon's three hundred: pitchers broken, lamps revealed all at once (Judges 7:20)
  const lamps = [];
  const r = rng(7);
  for (let i = 0; i < 300; i++) {
    const a = r() * 6.283;
    const d = 30 + r() * 30;
    const x = 120 + Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const l = glowSprite(0xffa040, 2.2, 0);
    l.position.set(x, h(x, z) + 1.6, z);
    L.add(l);
    lamps.push({ l, delay: r() * 0.25 });
  }
  // Samson's two middle pillars and the house upon them (Judges 16:29–30)
  const house = colonnade({ count: 6, spacing: 5, height: 12, radius: 0.9, rows: 2, rowGap: 10, material: "limestone" });
  house.position.set(0, h(0, -110), -110);
  L.add(house);
  const rubble = smoke({ rise: 40, spread: 20, color: [0.3, 0.28, 0.26], opacity: 0.5, size: 90, count: 900 });
  rubble.position.set(0, h(0, -110), -110);
  L.add(rubble);
  // a land with scattered fires at the end (Judges 21:25)
  const fires = [-160, -60, 70, 180].map((x, i) => {
    const s = smoke({ rise: 70, spread: 8, lean: [0.4, 0.1], color: [0.25, 0.22, 0.2], opacity: 0.35, size: 60, seed: 40 + i });
    s.position.set(x, h(x, -200 + i * 30), -200 + i * 30);
    L.add(s);
    return s;
  });
  L.onUpdate(({ rel, time, camera }) => {
    ring.lookAt(camera.position);
    const step = Math.floor((rel * 1.6) % CYCLE.length);
    words.forEach((w, i) => { w.material.opacity = i === step ? 0.95 : 0.18; });
    ring.visible = rel < 24.5;
    const breakOut = sramp(rel, 10.5, 11.5);
    lamps.forEach(({ l, delay }) => { l.material.opacity = sramp(breakOut, delay, delay + 0.4) * pulse(rel, 10, 10.5, 14, 15) * (0.75 + 0.25 * Math.sin(time * 6 + delay * 40)); });
    const fall = sramp(rel, 16, 18.5);
    house.rotation.z = fall * 0.5;
    house.position.y = h(0, -110) - fall * 9;
    house.scale.y = 1 - fall * 0.5;
    rubble.material.uniforms.uAmount.value = pulse(rel, 16, 17, 20, 21.5);
    rubble.material.uniforms.uTime.value = time;
    for (const f of fires) { f.material.uniforms.uAmount.value = sramp(rel, 20, 22); f.material.uniforms.uTime.value = time; }
    deborah.visible = rel < 10;
    return { grade: { exposure: lerp(1, 0.8, sramp(rel, 20, 24)) } };
  });
  return L;
}
