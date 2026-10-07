// Acts 1–2. On the mount of Olives a figure is taken up and a cloud receives him. Then a house in
// Jerusalem: a sound from heaven as of a rushing mighty wind, and cloven tongues like as of fire upon
// each of them.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { smoke, tongues, weather } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { placers } from "../kit/vegetation.js";
import { createTrees } from "../kit/vegetation.js";
import { jerusalemHeight } from "./david.js";
import { MATERIALS } from "../kit/structures.js";
import { SURFACES, facingIn } from "../kit/surface.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const HOUSE = new THREE.Vector3(-400, 0, 400);
const OLIVET = new THREE.Vector3(160, 0, -40);

export function create(ctx) {
  const height = jerusalemHeight(371);
  const HY = height(HOUSE.x, HOUSE.z); // the house stands on the ground there
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1300 },
    sky: (rel) => (rel < 5.6 ? [[1, "golden"]] : "morning"),
    camera: [
      [0, [OLIVET.x + 30, 12, OLIVET.z + 40], [OLIVET.x, 6, OLIVET.z], 44],
      [5.5, [OLIVET.x + 20, 8, OLIVET.z + 26], [OLIVET.x, 60, OLIVET.z], 56],
      [5.8, [HOUSE.x + 9, HY + 3.4, HOUSE.z + 7], [HOUSE.x, HY + 1.6, HOUSE.z], 52],
      [16, [HOUSE.x + 6, HY + 2.8, HOUSE.z + 4], [HOUSE.x, HY + 2, HOUSE.z], 46],
    ],
    indoor: (rel) => sramp(rel, 5.6, 5.8),
    grade: (rel) => ({ bloom: 0.2 + 0.15 * pulse(rel, 10.5, 12, 15, 16), threshold: 0.9, exposure: 1 }),
    audio: (rel) => ({ wind: 0.2 + 0.8 * pulse(rel, 6, 7, 11, 13), drone: 0.25, shimmer: 0.3 + 0.4 * pulse(rel, 10.5, 12, 15, 16), fire: 0.3 * pulse(rel, 10.5, 11.5, 15, 16) }),
  });
  const h = L.height;
  L.add(createTrees({ count: 80, place: placers.disc(OLIVET.x, OLIVET.z, 60, (x, z) => Math.hypot(x - OLIVET.x, z - OLIVET.z) > 14), height: h, kind: "olive", size: [3, 5] }).group);
  const disciples = crowd({ count: 11, place: placers.disc(OLIVET.x, OLIVET.z + 6, 5), height: h, seed: 161, face: [OLIVET.x, OLIVET.z] });
  L.add(disciples.group);
  const risen = figure(1.8);
  L.add(risen);
  const halo = glowSprite(0xffffff, 6, 0);
  L.add(halo);
  const cloud = smoke({ rise: 10, spread: 12, color: [0.92, 0.92, 0.9], opacity: 0.2, size: 55, count: 500, lit: true });
  cloud.position.set(OLIVET.x, h(OLIVET.x, OLIVET.z) + 40, OLIVET.z);
  L.add(cloud);
  // the house: a room full of people (about a hundred and twenty, Acts 1:15)
  const plaster = SURFACES.mudDark();
  const room = new THREE.Mesh(facingIn(new THREE.BoxGeometry(22, 6, 18)), plaster);
  room.position.copy(HOUSE).setY(HY + 3);
  L.add(room);
  const beams = [];
  for (let i = -10; i <= 10; i += 2) beams.push(new THREE.BoxGeometry(0.3, 0.32, 18).translate(HOUSE.x + i, HY + 5.8, HOUSE.z));
  for (const z of [-4.5, 4.5]) beams.push(new THREE.CylinderGeometry(0.22, 0.26, 6, 10).translate(HOUSE.x, HY + 3, HOUSE.z + z)); // posts
  L.add(new THREE.Mesh(mergeGeometries(beams.map((g) => g.index ? g.toNonIndexed() : g).map((g) => { g.deleteAttribute("uv"); return g; })), MATERIALS.darkWood()));
  const gathered = crowd({ count: 120, place: placers.disc(HOUSE.x, HOUSE.z, 8, (x, z) => Math.hypot(x - HOUSE.x, z - HOUSE.z - 4.5) > 0.6 && Math.hypot(x - HOUSE.x, z - HOUSE.z + 4.5) > 0.6), height: () => HY, seed: 163 });
  L.add(gathered.group);
  const roomLight = new THREE.PointLight(0xffd8a0, 12, 30, 1.4);
  roomLight.position.copy(HOUSE).setY(HY + 4.5);
  L.add(roomLight);
  const fireTongues = tongues({ positions: gathered.positions, height: () => HY, lift: 2.3 });
  L.add(fireTongues.group);
  const wind = weather("dust", { count: 3000, box: [30, 10, 30] });
  wind.material.uniforms.uColor.value.setRGB(0.45, 0.42, 0.36);
  L.add(wind.points);
  L.onUpdate(({ rel, time, pixelRatio }) => {
    const up = sramp(rel, 1.5, 5);
    const base = h(OLIVET.x, OLIVET.z);
    risen.position.set(OLIVET.x, base + up * 40, OLIVET.z);
    halo.position.copy(risen.position).add(new THREE.Vector3(0, 1.2, 0));
    halo.material.opacity = pulse(rel, 0.5, 1.5, 5, 5.6) * 0.9;
    risen.visible = rel < 5.6;
    cloud.material.uniforms.uAmount.value = pulse(rel, 3, 4.5, 5.4, 5.7);
    cloud.material.uniforms.uTime.value = time;
    disciples.group.visible = rel < 5.6;
    fireTongues.set(sramp(rel, 10.5, 12), time);
    roomLight.intensity = 6 + 14 * sramp(rel, 10.5, 12);
    wind.update({ time, pixelRatio, amount: pulse(rel, 6, 7, 11, 13), center: HOUSE.clone().setY(HY + 1), wind: [2.5, 0.8] });
  });
  return L;
}
