// Revelation 7:1–8, through John's eyes from a high mountain over a square land between hills and the sea.
// Four angels stand on the four corners of the earth, each holding a wind gathered in his hands, and the world
// goes still: the grass, the trees and the sea stop, and the wind is not heard. Another angel ascends from the
// east, out of the sunrise, with the seal of the living God (a glowing seal whose mark cannot be read), and
// cries to the four: "Hurt not the earth". The number is heard: 144,000, twelve companies of twelve thousand;
// the angel passes over them in the text's order, and each company's foreheads take the seal as its tribe is
// named, the name standing over it: Juda, Reuben, Gad, Aser, Nepthalim, Manasses, Simeon, Levi, Issachar,
// Zabulon, Joseph, Benjamin.

import * as THREE from "three";

import { glowSprite, glowTexture, pulse, sramp, textSprite } from "../../kit/common.js";
import { crowd, personMaterial } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { composeHeight, heights } from "../../kit/terrain.js";
import { createBlades, createTrees, placers } from "../../kit/vegetation.js";
import { rng } from "../../engine/noise.js";
import { scaled } from "../../kit/budget.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";

/** The twelve tribes of 7:5–8, in the text's order, and when each is named (units from the scene's start). */
const TRIBES = ["Juda", "Reuben", "Gad", "Aser", "Nepthalim", "Manasses", "Simeon", "Levi", "Issachar", "Zabulon", "Joseph", "Benjamin"];
const named = (i) => [22, 27.5, 33, 38.5][Math.floor(i / 3)] + 0.4 + (i % 3) * 1.5;

const height = composeHeight([
  heights.rolling(4, 0.01, 77),
  heights.mountain(-330, 0, 120, 95, 11, 1.1), // where John stands
  heights.ring(420, 560, 40, 21), // hills round about
  (x) => -Math.max(0, x - 560) * 0.2, // the sea beyond, eastward
  heights.flatten(150, 0, 200, 260, 4),
], 3);
// the four corners of the land, and its middle
const CORNERS = [[460, -260], [460, 260], [-60, 260], [-60, -260]];
const MID = new THREE.Vector3(200, 0, 0);

/** A wind held in an angel's hands: a coil of streaks turning in one place. */
function heldWind(seed) {
  const random = rng(seed);
  const n = 700;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = random() * Math.PI * 2;
    const r = 3 + random() * 9;
    pos.set([Math.cos(a) * r, (random() - 0.5) * 6 + Math.sin(a * 3) * 1.5, Math.sin(a) * r], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xd8dde4, size: 0.9, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false }));
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const J = [-330, 0];
  const G = height(...J);
  const E = [J[0], G + EYE, J[1]];
  const hostAt = (i) => {
    // the twelve companies in an arc across the plain, left to right as John sees them (toward +z)
    const a = (i / 11 - 0.5) * 1.5;
    return new THREE.Vector3(-110 + Math.cos(a) * 30, 0, Math.sin(a) * 170);
  };
  const tribeView = (i) => { const p = hostAt(i); return [p.x, height(p.x, p.z) + 10, p.z]; };
  const corner = (i) => [CORNERS[i][0], height(...CORNERS[i]) + 40, CORNERS[i][1]];
  const keys = [
    [0, E, [100, 10, 40], 52],
    [1.5, E, [100, 10, -30], 52],
    [3, E, corner(3), 48],
    [4.5, E, corner(0), 48],
    [5.5, E, corner(1), 48],
    [6.5, E, corner(2), 48],
    [8, E, [800, 40, 0], 44],
    [11, E, [520, 150, 0], 42],
    [13, E, [480, 170, 0], 36],
    [15, E, corner(0), 50],
    [17.5, E, [MID.x, 10, 0], 60],
    [21, E, [MID.x, 10, 0], 62],
  ];
  for (let i = 0; i < 12; i++) keys.push([named(i) - 0.2, E, tribeView(i), i % 3 === 0 ? 30 : 28]);
  keys.push([44.5, E, [MID.x, 12, 0], 58]);

  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1500, highFrom: 20, highSpan: 50 },
    water: { size: 4000, wave: 0.7, chop: 1.1, level: 0 },
    keepClear: [[J[0], J[1], 12], [MID.x, 0, 260]],
    camera: keys,
    rocks: 120,
    sky: (rel) => [[1 - sramp(rel, 6, 12), "dawn"], [sramp(rel, 6, 12), "morning"]],
    // the four winds held: nothing blows on the earth, the sea or any tree
    wind: (rel) => 0.7 * (1 - sramp(rel, 1.5, 4.5)),
    grade: (rel) => ({ bloom: 0.45, threshold: 0.82, saturation: 1 - 0.12 * sramp(rel, 2, 5) }),
    audio: (rel) => {
      const still = sramp(rel, 1.5, 4.5);
      return { wind: 0.6 * (1 - still), water: 0.35 * (1 - still), birds: 0.2 * (1 - still), drone: 0.25 + 0.1 * still, shimmer: 0.2 + 0.3 * sramp(rel, 7, 10), trumpet: 0.7 * pulse(rel, 12, 12.6, 15.5, 16.5) };
    },
  });
  const { scene } = L;
  const h = L.height;
  const grass = createBlades({ count: low ? 6000 : 16000, place: placers.disc(J[0] + 40, J[1], 60), height: h, minH: 5 });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.85 }));
  const trees = createTrees({ count: low ? 90 : 180, place: placers.box(-120, -380, 520, 380, (x, z) => Math.abs(z) > 250 || x > 330), height: h, kind: "olive", size: [4, 7] });
  L.add(trees.group, (s) => trees.update({ time: s.time, wind: s.wind }));

  // the four angels on the four corners of the earth, each holding a wind
  const winds = CORNERS.map(([x, z], i) => {
    const angel = cast("angel", 70);
    angel.position.set(x, h(x, z), z);
    angel.lookAt(MID.x, angel.position.y, MID.z);
    scene.add(angel);
    const w = heldWind(7 + i);
    w.position.set(x + (MID.x - x) * 0.04, h(x, z) + 46, z + (MID.z - z) * 0.04);
    scene.add(w);
    return w;
  });

  // the angel ascending from the east, with the seal of the living God
  const herald = cast("angel", 44);
  scene.add(herald);
  const dawn = glowSprite(0xffe0b0, 120, 0);
  const seal = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.35, 10, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.9, 1.1), toneMapped: false }));
  seal.add(ring, glowSprite(0xffd890, 12, 0.85));
  scene.add(dawn, seal);
  const rise = (rel) => {
    const k = sramp(rel, 7, 12);
    const over = sramp(rel, 17, 21);
    return new THREE.Vector3(
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(900, 470, k), MID.x + 60, over),
      THREE.MathUtils.lerp(THREE.MathUtils.lerp(-50, 140, k), 70, over),
      0);
  };

  // the hundred and forty and four thousand: twelve companies, each with its tribe's name over it
  const random = rng(144);
  const per = scaled(160, 30);
  const robes = [0xe8e0cc, 0xc8b89a, 0xd6cbb2, 0xb8a888];
  const hosts = TRIBES.map((name, i) => {
    const c = hostAt(i);
    const people = crowd({ count: per, seed: 200 + i, place: (r) => [c.x + (r() - 0.5) * 34, c.z + (r() - 0.5) * 26], height: h, material: personMaterial({ robe: robes[i % robes.length] }), face: [J[0], J[1]] });
    scene.add(people.group);
    // a point of light on each forehead, when the seal is set
    const marks = new Float32Array(people.positions.length * 3);
    people.positions.forEach(([x, z], k) => marks.set([x, h(x, z) + 1.62 + random() * 0.1, z], k * 3));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(marks, 3));
    const lit = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe2a0, size: 1.1, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(lit);
    const label = textSprite(name, { size: 72, scale: 11, color: "#f3e3bc" });
    label.position.set(c.x, h(c.x, c.z) + (i % 2 ? 10 : 17), c.z); // staggered, so neighbouring names never overlap
    label.material.opacity = 0;
    scene.add(label);
    return { lit, label, at: c };
  });

  const eyes = johnEyes(keys);
  let still = null;
  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the sea stops where it is
    if (rel > 4.5) still ??= time;
    else still = null;
    if (still !== null && L.water) L.water.mesh.material.uniforms.uTime.value = still;
    const hold = sramp(rel, 1.2, 4);
    for (const [i, w] of winds.entries()) {
      w.material.opacity = 0.55 * hold;
      w.rotation.y = time * (0.6 + 0.4 * pulse(rel, 12, 13, 15.5, 16.5)) * (i % 2 ? 1 : -1);
      w.scale.setScalar(1.6 - 0.6 * hold);
    }
    const p = rise(rel);
    herald.position.copy(p).add(new THREE.Vector3(0, -22, 0));
    herald.lookAt(J[0], herald.position.y, J[1]);
    herald.visible = rel > 6.5;
    dawn.position.set(p.x + 40, p.y + 10, p.z);
    dawn.material.opacity = 0.7 * pulse(rel, 6.5, 9, 12, 16);
    // the seal: in his hand, then over each company as it is sealed
    let at = p.clone().add(new THREE.Vector3(-6, 6, 4));
    for (let i = 0; i < 12; i++) {
      const k = sramp(rel, named(i) - 0.6, named(i) + 0.4);
      if (k > 0) at = at.lerp(hosts[i].at.clone().setY(h(hosts[i].at.x, hosts[i].at.z) + 14), k);
    }
    seal.position.copy(at);
    seal.visible = rel > 7;
    ring.rotation.y = time * 0.8;
    for (const [i, host] of hosts.entries()) {
      const k = sramp(rel, named(i), named(i) + 1);
      host.lit.material.opacity = k * (0.85 + 0.15 * Math.sin(time * 2 + i));
      host.label.material.opacity = k;
    }
  });
  return L;
}
