// "Now the sons of Jacob were twelve" (Genesis 35:22). Twelve standing stones in a ring at dusk, in
// order of birth, each named; Judah's stone takes the gold of the line of promise (Genesis 49:10).

import * as THREE from "three";

import { glowSprite, sramp, textSprite } from "../kit/common.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, placers } from "../kit/vegetation.js";

const SONS = ["Reuben", "Simeon", "Levi", "Judah", "Dan", "Naphtali", "Gad", "Asher", "Issachar", "Zebulun", "Joseph", "Benjamin"];

export function create(ctx) {
  const height = composeHeight([heights.rolling(8, 0.008, 121), heights.flatten(0, 0, 26, 50, 3)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 900 },
    sky: (rel) => [[1 - sramp(rel, 4, 11), "golden"], [sramp(rel, 4, 11), "dusk"]],
    camera: [[0, [0, 30, 60], [0, 3, 0], 40], [5, [26, 8, 26], [0, 4, 0], 46], [12, [-8, 5, 14], [10, 4, -16], 40]],
    grade: () => ({ bloom: 0.4, threshold: 0.7 }),
    audio: () => ({ drone: 0.35, wind: 0.25, shimmer: 0.15 }),
  });
  const h = L.height;
  const grass = createBlades({ count: 30000, place: placers.disc(0, 0, 90), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.8 }));
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x8a8070, roughness: 1, flatShading: true });
  const goldMat = new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.4, metalness: 0.7, emissive: 0x3a2508, emissiveIntensity: 0.5, flatShading: true });
  const stones = SONS.map((name, i) => {
    const a = (i / 12) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * 16;
    const z = Math.sin(a) * 16;
    const g = new THREE.DodecahedronGeometry(1, 0);
    g.scale(1.1, 3.2 + (i % 3) * 0.3, 0.7);
    const stone = new THREE.Mesh(g, name === "Judah" ? goldMat : stoneMat);
    stone.position.set(x, h(x, z) + 2.6, z);
    stone.lookAt(0, stone.position.y, 0);
    const label = textSprite(name, { size: 64, scale: 1.3, color: name === "Judah" ? "#f2c66a" : "#efe6d2" });
    label.position.set(x * 1.0, h(x, z) + 7.2, z);
    label.material.opacity = 0;
    L.add(stone);
    L.add(label);
    return { label, i };
  });
  const crown = glowSprite(0xffd38a, 10, 0);
  const judah = stones[3];
  crown.position.copy(judah.label.position).add(new THREE.Vector3(0, -2.5, 0));
  L.add(crown);
  L.onUpdate(({ rel }) => {
    for (const s of stones) s.label.material.opacity = sramp(rel, 1 + s.i * 0.3, 1.8 + s.i * 0.3);
    crown.material.opacity = sramp(rel, 5.5, 8) * 0.7;
  });
  return L;
}
