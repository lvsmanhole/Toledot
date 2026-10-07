// Joshua 3 — the Jordan at flood. The priests bearing the ark step into the river; upstream the water
// stands up in a heap; the bed dries; all Israel passes over.

import * as THREE from "three";

import { lerp, sramp } from "../kit/common.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const river = (z) => Math.sin(z * 0.01) * 20;

export function create(ctx) {
  const height = composeHeight([heights.rolling(5, 0.01, 191), heights.channel(river, 18, -3, 12)], 1.5);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1200, wetLevel: 0.5 },
    water: { size: 1200, flow: 1.6, flowDir: [0, 1], deep: [0.06, 0.08, 0.06], level: 0.2 },
    sky: () => "morning",
    camera: [[0, [-90, 20, 60], [0, 0, 0], 44], [6, [-40, 8, 20], [0, 0, -10], 46], [12, [60, 30, 70], [0, 0, -40], 44]],
    audio: (rel) => ({ water: 0.6 * (1 - sramp(rel, 3, 7)), wind: 0.2, drone: 0.25 }),
  });
  const h = L.height;
  L.add(createTrees({ count: 160, place: placers.box(-200, -300, 200, 300, (x, z) => Math.abs(x - river(z)) > 30), height: h, kind: "willow", size: [3, 6] }).group);
  const reeds = createBlades({ kind: "reeds", count: 12000, place: placers.box(-200, -300, 200, 300, (x, z) => { const d = Math.abs(x - river(z)); return d > 20 && d < 30; }), height: h, minH: -1 });
  L.add(reeds.mesh, (s) => reeds.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  // the ark on its staves, borne by four priests
  const ark = new THREE.Group();
  // on the march the ark goes covered: the veil, badgers' skins, and over all "a cloth wholly of blue"
  // (Numbers 4:5-6). The cloth hangs a little over the sides.
  const cloth = new THREE.BoxGeometry(1.4, 0.82, 0.86, 8, 4, 6);
  const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const y = cp.getY(i);
    const sag = y < 0.3 ? Math.sin(cp.getX(i) * 9 + cp.getZ(i) * 7) * 0.02 : 0;
    cp.setX(i, cp.getX(i) * (y < -0.3 ? 1.03 : 1) + sag);
    cp.setZ(i, cp.getZ(i) * (y < -0.3 ? 1.04 : 1) + sag);
  }
  cloth.computeVertexNormals();
  const box = new THREE.Mesh(cloth, new THREE.MeshStandardMaterial({ color: 0x23386e, roughness: 0.9 }));
  box.position.y = 1.5;
  box.castShadow = true;
  ark.add(box);
  for (const s of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6), MATERIALS.gold());
    pole.rotation.z = Math.PI / 2;
    pole.position.set(0, 1.35, s * 0.45);
    ark.add(pole);
    for (const e of [-1, 1]) {
      const p = figure(1.75);
      p.position.set(e * 1.6, 0, s * 0.45);
      ark.add(p);
    }
  }
  L.add(ark);
  // the heap of waters upstream
  // a standing face of water, rippled, falling away at its foot, white where it breaks at the crest
  const wall = new THREE.PlaneGeometry(64, 16, 96, 32);
  const wp = wall.attributes.position;
  const foam = new Float32Array(wp.count * 3);
  for (let i = 0; i < wp.count; i++) {
    const x = wp.getX(i);
    const y = wp.getY(i) + 8; // 0 at the foot, 16 at the crest
    const curl = Math.pow(Math.max(0, y - 12) / 4, 2) * 2.2; // crest leaning downstream
    const ripple = Math.sin(x * 0.7 + y * 0.9) * 0.18 + Math.sin(x * 1.9 - y * 1.7) * 0.07 + Math.sin(y * 3.1 + x * 0.3) * 0.05;
    wp.setXYZ(i, x * (1 - 0.06 * (x / 32) ** 2), y, ripple + curl - Math.max(0, 3 - y) * 0.9);
    const f = Math.min(1, Math.max(0, (y - 14.2) / 1.2)) + Math.max(0, (1.5 - y) / 1.5) * 0.7;
    foam.set([0.12 + f * 0.8, 0.2 + f * 0.75, 0.2 + f * 0.72], i * 3);
  }
  wall.setAttribute("color", new THREE.BufferAttribute(foam, 3));
  wall.computeVertexNormals();
  const heap = new THREE.Mesh(wall, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.25, side: THREE.DoubleSide, envMapIntensity: 1.4 }));
  heap.position.set(river(-120), -3, -120);
  L.add(heap);
  const people = crowd({ count: 600, place: placers.box(-60, -20, 60, 20), height: (x, z) => Math.max(h(x, z), -2.8), seed: 41, face: [80, 0] });
  L.add(people.group);
  L.onUpdate(({ rel }) => {
    const dry = sramp(rel, 2.5, 6.5);
    L.water.mesh.position.y = lerp(0.2, -9, dry);
    L.water.mesh.visible = dry < 0.9; // the bed lies dry: "all the Israelites passed over on dry ground"
    heap.scale.y = Math.max(0.01, dry);
    heap.visible = dry > 0.02;
    const bed = h(river(0), 0);
    ark.position.set(river(0) + lerp(-26, 0, sramp(rel, 1, 4)), lerp(h(river(0) - 26, 0), bed, sramp(rel, 1, 4)), 0);
    people.group.visible = rel > 5;
    people.group.position.x = lerp(-110, 40, sramp(rel, 5, 12));
  });
  return L;
}
