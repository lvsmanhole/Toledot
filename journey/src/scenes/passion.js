// The Passion (Matthew 21–27 and parallels). The road into Jerusalem lined with a crowd and branches.
// An upper room at night: a table, thirteen at it, a lamp. The olive grove: one kneeling. The hill
// outside the city: three crosses under a sky gone dark at noon; the earth shakes. In the temple, the
// veil is torn from the top to the bottom.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { ANIMALS, crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS, city, crosses, tomb, wall } from "../kit/structures.js";
import { SURFACES } from "../kit/surface.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { lightShaft } from "../kit/effects.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { jerusalemHeight } from "./david.js";

const ROOM = new THREE.Vector3(-500, 0, 500);
const GROVE = new THREE.Vector3(220, 0, 40);
const GOLGOTHA = new THREE.Vector3(-150, 0, -160);
const VEIL = new THREE.Vector3(600, 0, -600);
const GRAVES = new THREE.Vector3(-420, 0, 260);

export function create(ctx) {
  const height = jerusalemHeight(351);
  const RY = height(ROOM.x, ROOM.z); // the room stands on the ground there
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1700 },
    sky: (rel) => {
      if (rel < 5.6) return "morning";
      if (rel < 14.6) return [[1, "night"]];
      if (rel < 26.3) return [[1 - pulse(rel, 18.5, 19.8, 25, 26), "noon"], [pulse(rel, 18.5, 19.8, 25, 26), "storm"]];
      if (rel < 31.3) return [[1, "dusk"]];
      return [[1, "storm"]];
    },
    lightning: (rel) => 0.6 * pulse(rel, 22, 23, 25, 26) + 0.7 * pulse(rel, 31.5, 32.5, 37, 39),
    indoor: (rel) => pulse(rel, 5.6, 5.7, 9.7, 9.8),
    camera: [
      [0, [180, 14, 30], [100, 10, 0], 44],
      [5.5, [60, 8, 12], [30, 6, 0], 44],
      [5.7, [ROOM.x + 5.5, RY + 2.6, ROOM.z + 3.6], [ROOM.x, RY + 0.6, ROOM.z], 50],
      [9.7, [ROOM.x + 3.6, RY + 1.9, ROOM.z + 2.6], [ROOM.x - 0.5, RY + 0.5, ROOM.z], 44],
      [9.9, [GROVE.x + 14, 4, GROVE.z + 12], [GROVE.x, 1.5, GROVE.z], 44],
      [14.5, [GROVE.x + 7, 2.2, GROVE.z + 6], [GROVE.x, 1, GROVE.z], 40],
      [14.7, [GOLGOTHA.x + 60, 14, GOLGOTHA.z + 70], [GOLGOTHA.x, 8, GOLGOTHA.z], 44],
      [22.5, [GOLGOTHA.x + 24, 6, GOLGOTHA.z + 30], [GOLGOTHA.x, 10, GOLGOTHA.z], 42],
      [26.3, [GOLGOTHA.x + 16, 5, GOLGOTHA.z + 22], [GOLGOTHA.x, 12, GOLGOTHA.z], 40],
      [26.5, [VEIL.x + 14, 7, VEIL.z], [VEIL.x, 7, VEIL.z], 46],
      [31, [VEIL.x + 9, 7, VEIL.z], [VEIL.x - 10, 7, VEIL.z], 50],
      [31.2, [VEIL.x + 6, 7, VEIL.z], [VEIL.x - 30, 7, VEIL.z], 54],
      [31.4, [GRAVES.x + 70, 18, GRAVES.z + 60], [GRAVES.x, 6, GRAVES.z], 46],
      [36, [GRAVES.x + 10, 6, GRAVES.z + 30], [GRAVES.x - 4, 2, GRAVES.z], 44],
      [40, [GRAVES.x + 22, 5, GRAVES.z + 18], [GRAVES.x - 6, 4, GRAVES.z - 4], 42],
    ],
    grade: (rel) => ({ saturation: 1 - 0.45 * sramp(rel, 14.6, 20), exposure: 1 - 0.35 * pulse(rel, 19, 20, 25, 26), bloom: 0.4, threshold: 0.7 }),
    audio: (rel) => ({ drone: 0.3 + 0.3 * sramp(rel, 14.6, 20), wind: 0.2 + 0.5 * pulse(rel, 19, 20, 26, 27), shimmer: 0.4 * sramp(rel, 29, 33) }),
  });
  const h = L.height;
  L.add(city({ count: 400, radius: 110, inner: 40, height: h, style: "stone", seed: 151 }));
  L.add(wall({ points: Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * 6.283) * 128, Math.sin(i / 24 * 6.283) * 118]), height: h, h: 9, thickness: 3, towerEvery: 3, material: "limestone" }));
  // the road in: a crowd lining both sides; branches (small palms) laid down
  const lineA = crowd({ count: 220, place: placers.box(20, 5, 190, 9), height: h, seed: 153, face: [100, 0] });
  const lineB = crowd({ count: 220, place: placers.box(20, -9, 190, -5), height: h, seed: 155, face: [100, 0] });
  L.add(lineA.group);
  L.add(lineB.group);
  L.add(createTrees({ count: 60, place: placers.box(30, -16, 190, 16, (x, z) => Math.abs(z) > 11), height: h, kind: "palm", size: [3, 4.5] }).group);
  const donkey = new THREE.Mesh(ANIMALS.donkey(), new THREE.MeshStandardMaterial({ color: 0x0b0908, roughness: 1 }));
  const rider = figure(1.6);
  L.add(donkey);
  L.add(rider);
  // the upper room
  const room = new THREE.Group();
  room.position.copy(ROOM).setY(RY);
  // "a large upper room furnished" (Mark 14:15): plastered walls, a floor of beaten plaster, roof beams
  const plaster = SURFACES.mudDark();
  plaster.side = THREE.BackSide;
  const walls = new THREE.Mesh(new THREE.BoxGeometry(14, 4.2, 10), plaster);
  walls.position.y = 2.1;
  room.add(walls);
  const beams = [];
  for (let i = -6; i <= 6; i += 1.5) beams.push(new THREE.BoxGeometry(0.22, 0.25, 10).translate(i, 4.05, 0));
  room.add(new THREE.Mesh(mergeGeometries(beams), MATERIALS.darkWood()));
  // a low table, and the thirteen reclining about it on cushions, leaning on the left arm with their heads
  // toward the table, as at a feast (John 13:23)
  const wood = MATERIALS.wood();
  const table = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.42, 1.4).translate(0, 0.21, 0), wood);
  room.add(table);
  const cushions = [];
  const diners = [];
  for (let i = 0; i < 13; i++) {
    const s = i < 6 ? -1 : i < 12 ? 1 : 0;
    const f = figure(1.72);
    if (s === 0) {
      // at the head of the table
      f.position.set(-4.2, -0.62, 0);
      f.rotation.set(0, Math.PI / 2, 0.18, "YXZ");
      cushions.push(new THREE.BoxGeometry(1.9, 0.26, 0.85).translate(-4.3, 0.13, 0));
    } else {
      const x = -2.6 + (i % 6) * 1.05;
      // seated low on the cushions about the table, leaning in toward it (the legs folded beneath, below
      // the floor line)
      f.position.set(x, -0.62, s * 1.45);
      f.rotation.set(-s * 0.18, s > 0 ? Math.PI : 0, 0, "YXZ");
      cushions.push(new THREE.BoxGeometry(0.85, 0.26, 1.9).translate(x, 0.13, s * 1.75));
    }
    room.add(f);
    diners.push(f);
  }
  room.add(new THREE.Mesh(mergeGeometries(cushions), MATERIALS.cloth(0x6a3a2a)));
  // bread and cup on the table; oil lamps
  const bread = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0xa8763e, roughness: 0.9 }));
  bread.position.set(-1.8, 0.45, 0.1);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x7a5236, roughness: 0.5 }));
  cup.position.set(-1.5, 0.48, -0.1);
  room.add(bread, cup);
  for (const x of [-2.2, 0, 2.2]) {
    const lamp = glowSprite(0xffb060, 0.5, 0.9);
    lamp.position.set(x, 0.55, 0);
    room.add(lamp);
  }
  const lampLight = new THREE.PointLight(0xffa050, 14, 12, 1.6);
  lampLight.position.set(0, 1.2, 0);
  room.add(lampLight);
  L.add(room);
  // Gethsemane
  const grove = createTrees({ count: 40, place: placers.disc(GROVE.x, GROVE.z, 26), height: h, kind: "olive", size: [3, 5] });
  L.add(grove.group);
  const kneeling = figure(1.8);
  kneeling.position.set(GROVE.x, h(GROVE.x, GROVE.z) - 0.6, GROVE.z);
  kneeling.rotation.x = 0.5;
  L.add(kneeling);
  const moon = glowSprite(0xcfd8ff, 30, 0.8);
  moon.position.set(GROVE.x - 200, 160, GROVE.z - 300);
  L.add(moon);
  // Golgotha
  const hill = crosses({ spacing: 6 });
  hill.position.set(GOLGOTHA.x, h(GOLGOTHA.x, GOLGOTHA.z), GOLGOTHA.z);
  L.add(hill);
  const watchers = crowd({ count: 120, place: placers.disc(GOLGOTHA.x - 26, GOLGOTHA.z + 14, 10), height: h, seed: 157, face: [GOLGOTHA.x, GOLGOTHA.z] });
  L.add(watchers.group);
  const dust = weather("dust", { count: 3000, box: [80, 40, 80] });
  L.add(dust.points);
  // the veil of the temple, torn from the top to the bottom (Matthew 27:51)
  const veilGroup = new THREE.Group();
  veilGroup.position.copy(VEIL).setY(h(VEIL.x, VEIL.z));
  const halves = [-1, 1].map((s) => {
    const geo = new THREE.PlaneGeometry(6, 14, 8, 20);
    geo.translate(s * 3, 7, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a1220, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x12030a, emissiveIntensity: 0.6 });
    const m = new THREE.Mesh(geo, mat);
    m.rotation.y = Math.PI / 2;
    veilGroup.add(m);
    return { m, s };
  });
  const beyond = glowSprite(0xfff6e0, 26, 0);
  beyond.position.set(-12, 7, 0);
  veilGroup.add(beyond);
  const sanctuary = new THREE.Mesh(new THREE.BoxGeometry(30, 16, 14), new THREE.MeshStandardMaterial({ color: 0x8a7a60, roughness: 1, side: THREE.BackSide }));
  sanctuary.position.set(0, 8, 0);
  veilGroup.add(sanctuary);
  const sanctLight = new THREE.PointLight(0xffd8a0, 60, 40, 1.4);
  sanctLight.position.set(8, 10, 0);
  veilGroup.add(sanctLight);
  L.add(veilGroup);
  // the graves on the hillside outside the city: rock-cut tombs with their stones
  const graves = [];
  for (let i = 0; i < 12; i++) {
    const g = tomb();
    const x = GRAVES.x + (i % 6) * 16 - 40 + (i > 5 ? 8 : 0);
    const z = GRAVES.z - Math.floor(i / 6) * 22 - (i % 2) * 4;
    g.scale.setScalar(0.55);
    g.position.set(x, h(x, z) - 0.3, z);
    g.rotation.y = 0.15 * ((i % 3) - 1);
    L.add(g);
    const shine = lightShaft({ length: 14, top: 0.9, bottom: 2.6, color: [1, 0.95, 0.85], gain: 0.9 });
    const inner = glowSprite(0xfff2d8, 4, 0);
    inner.position.set(x, h(x, z) + 1.0, z + 1.2);
    L.add(inner);
    const lamp = new THREE.PointLight(0xffe8c0, 0, 18, 1.4);
    lamp.position.set(x, h(x, z) + 1.5, z + 3);
    L.add(lamp);
    shine.rotation.x = -Math.PI / 2;
    shine.position.set(x, h(x, z) + 1.0, z + 1.4);
    L.add(shine);
    graves.push({ g, shine, inner, lamp, delay: (i * 0.37) % 1 });
  }
  L.onUpdate(({ rel, time, pixelRatio, camera, reducedMotion }) => {
    // "the earth did quake, and the rocks rent; and the graves were opened" (Matthew 27:51-52)
    const open = sramp(rel, 32, 36.5);
    for (const { g, shine, inner, lamp, delay } of graves) {
      const k = sramp(open, delay * 0.5, delay * 0.5 + 0.5);
      g.userData.stone.position.x = k * 4.6;
      g.userData.stone.rotation.y = -k * 2.2;
      shine.material.uniforms.uAmount.value = k;
      shine.material.uniforms.uTime.value = time;
      shine.visible = k > 0.01;
      inner.material.opacity = k * 0.9;
      lamp.intensity = k * 40;
    }
    const ride = sramp(rel, 0, 5.5);
    const dx = lerp(190, 40, ride);
    donkey.position.set(dx, h(dx, 0), 0);
    donkey.rotation.y = Math.PI;
    rider.position.set(dx, h(dx, 0) + 0.9, 0);
    const quake = pulse(rel, 25.5, 26, 26.3, 26.5) + pulse(rel, 26.6, 27, 28, 29) + pulse(rel, 31.6, 32.2, 35.5, 37);
    if (!reducedMotion && quake > 0) {
      camera.position.x += Math.sin(time * 43) * 0.3 * quake;
      camera.position.y += Math.sin(time * 37) * 0.3 * quake;
    }
    dust.update({ time, pixelRatio, amount: pulse(rel, 19, 21, 25, 27) * 0.4, center: camera.position });
    // the tear runs from the top down, and the halves fall apart
    const tear = sramp(rel, 27, 30.5);
    for (const { m, s } of halves) {
      m.rotation.z = 0;
      m.position.z = s * tear * 4;
      m.rotation.x = s * tear * 0.25;
    }
    beyond.material.opacity = tear * 0.9;
    beyond.scale.setScalar(16 + tear * 30);
  });
  return L;
}
