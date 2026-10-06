// Exodus 7–12 — the ten plagues, each one changing the world rather than illustrating it: the Nile turns
// to blood; frogs cover the land; lice; swarms; the cattle fall; ash; hail with fire; locusts that blacken
// the sky; a darkness in which only Goshen has light (and the interface itself nearly vanishes); the
// Passover doors; midnight.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame, weather } from "../kit/effects.js";
import { ANIMALS, figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city } from "../kit/structures.js";
import { placers } from "../kit/vegetation.js";
import { rng } from "../engine/noise.js";
import { egyptHeight, egyptSet, nile } from "./egypt.js";

const GOSHEN = [150, 70];

export function create(ctx) {
  const height = egyptHeight(171);
  const low = ctx.quality === "low";
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1600, wetLevel: 1.2 },
    water: { size: 1600, flow: 0.2, flowDir: [0, -1], deep: [0.03, 0.08, 0.07], level: -0.3 },
    sky: (rel) => {
      const storm = pulse(rel, 19.8, 20.6, 22.6, 23.4);
      const swarm = pulse(rel, 22.8, 23.6, 25.8, 26.4);
      const dark = pulse(rel, 26, 26.8, 30.4, 31);
      const night = sramp(rel, 30.4, 31.2);
      const day = Math.max(0, 1 - storm - swarm - dark - night);
      return [[day, "desert"], [storm, "storm"], [swarm, "ash"], [dark * 1.0, "night"], [night, "night"]];
    },
    lightning: (rel) => pulse(rel, 20, 20.6, 22.6, 23.2),
    wind: (rel) => 0.3 + 1.2 * pulse(rel, 20, 21, 25.5, 26.4),
    camera: [
      [0, [nile(0) + 140, 60, 200], [nile(0) - 20, 4, 0], 42],
      [4, [nile(0) + 50, 14, 80], [nile(0), 0, 0], 46],
      [7, [nile(0) + 34, 4, 30], [nile(0) + 10, 1, 10], 50],
      [12, [nile(0) + 60, 10, 70], [nile(0) - 10, 6, 0], 48],
      [15, [80, 6, -20], [40, 2, -60], 46],
      [20, [nile(0) + 120, 40, 150], [nile(0), 10, 0], 46],
      [26.5, [GOSHEN[0] + 60, 30, GOSHEN[1] + 90], [GOSHEN[0], 2, GOSHEN[1]], 44],
      [31, [GOSHEN[0] + 22, 6, GOSHEN[1] + 26], [GOSHEN[0], 2, GOSHEN[1]], 46],
      [36, [GOSHEN[0] + 8, 3.5, GOSHEN[1] + 14], [GOSHEN[0] - 6, 2.5, GOSHEN[1] - 4], 44],
      [40, [GOSHEN[0] - 30, 30, GOSHEN[1] + 40], [GOSHEN[0] - 80, 4, GOSHEN[1] - 60], 44],
    ],
    grade: (rel) => {
      const dark = pulse(rel, 26, 26.8, 30.4, 31);
      return { exposure: 1 - 0.75 * dark - 0.3 * sramp(rel, 31, 34), saturation: 1 - 0.3 * pulse(rel, 17.5, 18.5, 26, 27), bloom: 0.3 + 0.6 * sramp(rel, 26, 28), threshold: 0.5 };
    },
    audio: (rel) => ({
      drone: 0.35 + 0.35 * sramp(rel, 26, 28), water: 0.35 * (1 - sramp(rel, 26, 27)), wind: 0.2 + 0.6 * pulse(rel, 20, 21, 26, 27),
      fire: 0.4 * pulse(rel, 20.2, 20.8, 22.6, 23.2),
    }),
  });
  const h = L.height;
  egyptSet(ctx, L, h);
  const town = city({ count: 300, radius: 70, height: (x, z) => h(x - 20, z + 10), style: "mud", seed: 41 });
  town.position.set(-20, 0, -10);
  L.add(town);

  // blood: the river darkens to red (Exodus 7:20)
  L.onUpdate(({ rel }) => {
    const blood = sramp(rel, 4.5, 6) * (1 - sramp(rel, 9, 12));
    L.water.material.uniforms.uTint.value.setRGB(1 - blood * 0.1, 1 - blood * 0.85, 1 - blood * 0.85);
    L.water.material.uniforms.uDeep.value.setRGB(0.03 + blood * 0.22, 0.08 - blood * 0.07, 0.07 - blood * 0.06);
  });

  // frogs: small dark shapes covering the banks and streets, hopping
  const frogCount = low ? 1200 : 3000;
  const frogGeo = new THREE.SphereGeometry(0.22, 8, 6);
  frogGeo.scale(1, 0.6, 1.2);
  const frogs = new THREE.InstancedMesh(frogGeo, new THREE.MeshStandardMaterial({ color: 0x1e2a14, roughness: 0.6 }), frogCount);
  const frogSpots = [];
  const r = rng(77);
  for (let i = 0; i < frogCount; i++) {
    const z = (r() - 0.5) * 200;
    const side = r() < 0.5 ? -1 : 1;
    const x = nile(z) + side * (22 + r() * 70);
    frogSpots.push([x, h(x, z), z, r() * 6.28]);
  }
  L.add(frogs);
  const fm = new THREE.Matrix4();
  L.onUpdate(({ rel, time }) => {
    const on = pulse(rel, 7, 7.6, 9.4, 10);
    frogs.visible = on > 0.01;
    if (!frogs.visible) return;
    const shown = Math.floor(frogCount * on);
    for (let i = 0; i < frogCount; i++) {
      const [x, y, z, ph] = frogSpots[i];
      const hop = Math.max(0, Math.sin(time * 3 + ph)) * 0.25;
      fm.makeTranslation(x + Math.sin(time * 0.5 + ph) * 0.6, y + hop + 0.1, z);
      frogs.setMatrixAt(i, fm);
    }
    frogs.count = shown;
    frogs.instanceMatrix.needsUpdate = true;
  });

  // lice, flies, ash, hail, locusts
  const lice = weather("gnats", { count: low ? 3000 : 8000, box: [60, 20, 60] });
  const flies = weather("gnats", { count: low ? 3000 : 7000, box: [60, 25, 60], seed: 9 });
  flies.material.uniforms.uSize.value = 1.4;
  const ash = weather("ash", { count: low ? 4000 : 9000, box: [80, 40, 80] });
  const hail = weather("hail", { count: low ? 4000 : 9000, box: [90, 60, 90] });
  const locusts = weather("locusts", { count: low ? 7000 : 18000, box: [100, 60, 100] });
  for (const w of [lice, flies, ash, hail, locusts]) L.add(w.points);
  const fires = [];
  const rf = rng(5);
  for (let i = 0; i < 14; i++) {
    const f = flame({ width: 2.2, height: 3.5, gain: 0.8, seed: i });
    const x = nile(0) + 30 + rf() * 120;
    const z = (rf() - 0.5) * 160;
    f.position.set(x, h(x, z), z);
    L.add(f);
    fires.push({ f, phase: rf() * 6 });
  }
  // the cattle of Egypt fallen in the fields (Exodus 9:6)
  const cattle = herd({ kind: "ox", count: 40, place: placers.box(nile(0) + 40, -100, nile(0) + 140, -20), height: h, seed: 3 });
  const fallen = new THREE.InstancedMesh(ANIMALS.ox(), new THREE.MeshStandardMaterial({ color: 0x0b0908, roughness: 1 }), 40);
  cattle.updateMatrixWorld();
  const tmpM = new THREE.Matrix4();
  const tilt = new THREE.Matrix4().makeRotationX(Math.PI / 2);
  for (let i = 0; i < cattle.count; i++) {
    cattle.getMatrixAt(i, tmpM);
    tmpM.multiply(tilt);
    tmpM.elements[13] += 0.35;
    fallen.setMatrixAt(i, tmpM);
  }
  fallen.count = cattle.count;
  L.add(cattle);
  L.add(fallen);

  // Goshen: Israel's houses, with light in their dwellings, then the blood on the doorposts
  const goshen = city({ count: 70, radius: 22, height: (x, z) => h(x + GOSHEN[0], z + GOSHEN[1]), style: "mud", seed: 51 });
  goshen.position.set(GOSHEN[0], 0, GOSHEN[1]);
  L.add(goshen);
  const lamps = [];
  const doors = [];
  const rg = rng(19);
  for (let i = 0; i < 40; i++) {
    const a = rg() * 6.28;
    const d = Math.sqrt(rg()) * 22;
    const x = GOSHEN[0] + Math.cos(a) * d;
    const z = GOSHEN[1] + Math.sin(a) * d;
    const lamp = glowSprite(0xffc070, 3.2, 0);
    lamp.position.set(x, h(x, z) + 1.2, z);
    L.add(lamp);
    lamps.push(lamp);
    const door = glowSprite(0xb01a10, 2.4, 0);
    door.position.set(x + 0.8, h(x, z) + 1.4, z);
    L.add(door);
    doors.push(door);
  }
  const family = figure(1.7);
  family.position.set(GOSHEN[0] - 4, h(GOSHEN[0] - 4, GOSHEN[1] + 3), GOSHEN[1] + 3);
  L.add(family);

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const c = camera.position;
    lice.update({ time, pixelRatio, amount: pulse(rel, 9.6, 10.2, 12, 12.6), center: c });
    flies.update({ time, pixelRatio, amount: pulse(rel, 12.2, 12.8, 14.6, 15.2), center: c });
    ash.update({ time, pixelRatio, amount: pulse(rel, 17.4, 18, 19.8, 20.4), center: c, wind: [0.4, 0.3] });
    hail.update({ time, pixelRatio, amount: pulse(rel, 20, 20.6, 22.6, 23.2), center: c, wind: [0.3, 0.1] });
    locusts.update({ time, pixelRatio, amount: pulse(rel, 23, 23.8, 25.8, 26.4), center: c, wind: [1.2, 0.4] });
    const hailFire = pulse(rel, 20.2, 20.8, 22.6, 23.2);
    for (const { f, phase } of fires) {
      const flick = Math.max(0, Math.sin(time * 1.7 + phase));
      f.material.uniforms.uAmount.value = hailFire * flick;
      f.material.uniforms.uTime.value = time;
      f.visible = hailFire * flick > 0.02;
    }
    const dead = sramp(rel, 15.2, 16);
    cattle.visible = dead < 0.5;
    fallen.visible = dead >= 0.5 && rel < 27;
    const lightInDwellings = pulse(rel, 26.4, 27.4, 30.4, 31.2);
    lamps.forEach((l, i) => { l.material.opacity = lightInDwellings * (0.7 + 0.3 * Math.sin(time * 4 + i)); });
    const blood = sramp(rel, 31, 32.5);
    doors.forEach((d, i) => { d.material.opacity = blood * (0.55 + 0.1 * Math.sin(time * 2 + i)); });
    family.visible = rel > 30.5;
  });
  return L;
}
