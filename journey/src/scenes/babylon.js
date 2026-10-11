// Psalm 137 and Daniel 3 — Babylon. Massive walls of baked brick and a gate glazed in blue, beasts of
// gold in relief; the river with willows where the exiles sit and their harps hang. Then the plain of
// Dura: the image of gold, sixty cubits high, the multitude fallen down before it, and three young men
// of Judah standing. Then the furnace, its mouth white-hot, and four men walking loose in the fire,
// the fourth like the Son of God; and the three come forth.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame, smoke } from "../kit/effects.js";
import { crowd, figure, robedGeometry } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS, city, wall, ziggurat } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const river = (z) => -40 + Math.sin(z * 0.005) * 12;
const IMAGE = [330, 0]; // the image of gold on the plain of Dura
const STAND = [[272, -1.8], [272.6, 0], [272, 1.8]]; // Shadrach, Meshach and Abed-nego
const FURNACE = [330, 110]; // its mouth faces +z
const MOUTH_Z = 15.2; // where the furnace's vaulted mouth begins, in its own space
const WILLOWS = [[-26, 16], [-31, 27]]; // the two willows nearest the river bank shot, hung with harps

/** The gate of Ishtar: towers of blue-glazed brick, an arched passage, rows of beasts in gold relief. */
function ishtarGate() {
  const g = new THREE.Group();
  const blue = MATERIALS.glazedBlue();
  const gold = MATERIALS.gold();
  const front = new THREE.Shape();
  front.moveTo(-15, 0);
  front.lineTo(-3.5, 0);
  front.lineTo(-3.5, 9);
  front.absarc(0, 9, 3.5, Math.PI, 0, true);
  front.lineTo(3.5, 0);
  front.lineTo(15, 0);
  front.lineTo(15, 24);
  front.lineTo(-15, 24);
  front.lineTo(-15, 0);
  const body = new THREE.ExtrudeGeometry(front, { depth: 12, bevelEnabled: false, curveSegments: 16 }).translate(0, 0, -6);
  const blocks = [body.toNonIndexed()];
  // flanking towers, taller, crowned with stepped battlements
  for (const s of [-1, 1]) {
    blocks.push(new THREE.BoxGeometry(8, 30, 16).translate(s * 17, 15, 0).toNonIndexed());
    for (let k = -1; k <= 1; k++) blocks.push(new THREE.BoxGeometry(1.8, 1.8, 16).translate(s * 17 + k * 2.6, 30.9, 0).toNonIndexed());
  }
  for (let x = -12; x <= 12; x += 3) blocks.push(new THREE.BoxGeometry(1.6, 1.6, 12).translate(x, 24.8, 0).toNonIndexed());
  for (const b of blocks) b.deleteAttribute("uv");
  g.add(new THREE.Mesh(mergeGeometries(blocks), blue));
  // lions, bulls and dragons walking in rows across the face (simplified to one beast's profile)
  const beast = new THREE.Shape();
  const pts = [[-1.2, 0], [-1.0, 0], [-0.95, 0.55], [-0.6, 0.55], [-0.55, 0], [-0.35, 0], [-0.3, 0.55], [0.45, 0.55], [0.5, 0], [0.7, 0], [0.72, 0.55], [0.95, 0.6], [1.0, 0], [1.2, 0], [1.15, 0.75], [1.25, 1.0], [1.45, 1.15], [1.5, 1.4], [1.2, 1.45], [1.0, 1.2], [-0.9, 1.15], [-1.2, 1.1], [-1.5, 0.8], [-1.3, 0.85], [-1.15, 0.7]];
  beast.moveTo(...pts[0]);
  for (const p of pts.slice(1)) beast.lineTo(...p);
  const one = new THREE.ExtrudeGeometry(beast, { depth: 0.18, bevelEnabled: false });
  one.deleteAttribute("uv");
  const beasts = [];
  for (const row of [3, 7.5, 12, 16.5, 21]) {
    for (let x = -13; x <= 13; x += 3.4) {
      if (Math.abs(x) < 5.5 && row < 13) continue; // the passage
      beasts.push(one.clone().translate(x, row, 6));
    }
    for (const s of [-1, 1]) for (const x of [-2, 1.4]) beasts.push(one.clone().translate(s * 17 + x, row + 2, 8));
  }
  g.add(new THREE.Mesh(mergeGeometries(beasts), gold));
  return g;
}

/** The image of gold: sixty cubits in all, six broad (Daniel 3:1), a robed figure on a stepped base. */
function goldenImage() {
  const g = new THREE.Group();
  const base = mergeGeometries([[12, 2, 0], [9, 2, 2], [6, 3, 4]].map(([w, hh, y]) => {
    const b = new THREE.BoxGeometry(w, hh, w).translate(0, y + hh / 2, 0);
    b.deleteAttribute("uv");
    return b.toNonIndexed();
  }));
  g.add(new THREE.Mesh(base, MATERIALS.mud()));
  const statue = new THREE.Mesh(robedGeometry(1.75, { detail: "high", staff: true }), MATERIALS.gold());
  statue.scale.set(5.2, 11.4, 5.2); // some 20 m on a 7 m base: 27 m, sixty cubits; 2.7 m, six cubits, broad
  statue.position.y = 7;
  statue.castShadow = true;
  g.add(statue);
  return g;
}

/** A small lyre (kinnor) hung by a cord. */
function lyre() {
  const wood = MATERIALS.wood();
  const parts = [
    new THREE.BoxGeometry(0.46, 0.24, 0.1).translate(0, 0.12, 0),
    new THREE.CylinderGeometry(0.025, 0.03, 0.72).rotateZ(0.18).translate(-0.24, 0.55, 0),
    new THREE.CylinderGeometry(0.025, 0.03, 0.72).rotateZ(-0.18).translate(0.24, 0.55, 0),
    new THREE.CylinderGeometry(0.025, 0.025, 0.7).rotateZ(Math.PI / 2 - 0.08).translate(0, 0.9, 0),
  ];
  for (let i = 0; i < 5; i++) parts.push(new THREE.BoxGeometry(0.006, 0.66, 0.006).translate(-0.14 + i * 0.07, 0.56, 0.02));
  parts.push(new THREE.CylinderGeometry(0.005, 0.005, 0.9).translate(0, 1.35, 0)); // the cord
  for (const p of parts) p.deleteAttribute("uv");
  return new THREE.Mesh(mergeGeometries(parts.map((p) => p.toNonIndexed())), wood);
}

/**
 * The burning fiery furnace: a battered kiln of burnt brick, fire roaring from its open top, and before
 * it a vaulted mouth, white-hot within, where the four walk. Built facing +z.
 */
function furnace(low) {
  const g = new THREE.Group();
  const brick = MATERIALS.mudDark();
  const kiln = new THREE.Mesh(new THREE.CylinderGeometry(11, 15, 16, 40, 1, true).translate(0, 8, 0), brick);
  kiln.material.side = THREE.DoubleSide;
  g.add(kiln);
  // the vault of the mouth: a block of brick with an arched passage cut through it
  const outline = new THREE.Shape();
  outline.moveTo(-8, 0);
  outline.lineTo(-4.5, 0);
  outline.lineTo(-4.5, 6.5);
  outline.absarc(0, 6.5, 4.5, Math.PI, 0, true);
  outline.lineTo(4.5, 0);
  outline.lineTo(8, 0);
  outline.lineTo(8, 15);
  outline.lineTo(-8, 15);
  outline.lineTo(-8, 0);
  const depth = 5.8;
  const vault = new THREE.Mesh(new THREE.ExtrudeGeometry(outline, { depth, bevelEnabled: false, curveSegments: 20 }).translate(0, 0, MOUTH_Z), MATERIALS.mudDark());
  g.add(vault);
  // the fire within: a white-hot back wall and a bed of coals, coloured each frame
  const arch = new THREE.Shape();
  arch.moveTo(-4.5, 0);
  arch.lineTo(4.5, 0);
  arch.lineTo(4.5, 6.5);
  arch.absarc(0, 6.5, 4.5, 0, Math.PI, false);
  arch.lineTo(-4.5, 0);
  const hot = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const back = new THREE.Mesh(new THREE.ShapeGeometry(arch, 20), hot);
  back.position.z = MOUTH_Z + 0.05;
  const coalMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const coals = new THREE.Mesh(new THREE.PlaneGeometry(9, depth).rotateX(-Math.PI / 2), coalMat);
  coals.position.set(0, 0.04, MOUTH_Z + depth / 2);
  const top = new THREE.Mesh(new THREE.CircleGeometry(10.9, 40).rotateX(-Math.PI / 2), coalMat);
  top.position.y = 15.8;
  g.add(back, coals, top);
  const flames = [];
  for (let i = 0; i < 5; i++) {
    const f = flame({ width: 3.6, height: 8.5, gain: 0.7, seed: i * 1.7 });
    f.position.set((i - 2) * 1.9, 0, MOUTH_Z + 0.5);
    flames.push(f);
  }
  for (let i = 0; i < 4; i++) {
    const f = flame({ width: 2.4, height: 4.5, gain: 0.5, seed: 9 + i * 2.3 });
    f.position.set((i - 1.5) * 2.4, 0, MOUTH_Z + 2.4 + (i % 2) * 1.6);
    flames.push(f);
  }
  const crown = flame({ width: 18, height: 22, gain: 0.6, seed: 3.3 });
  crown.position.y = 15.6;
  flames.push(crown);
  for (const f of flames) g.add(f);
  const plume = smoke({ rise: 120, spread: 16, lean: [0.25, 0.05], color: [0.14, 0.11, 0.1], opacity: 0.34, size: 70, count: low ? 400 : 800, seed: 5 });
  plume.position.y = 22;
  g.add(plume);
  const heat = new THREE.PointLight(0xff8a3a, 0, 120, 1.4);
  heat.position.set(0, 5, MOUTH_Z + 4.5);
  g.add(heat);
  // the four: three men of Judah in their coats, and the fourth like the Son of God
  const robes = [0x2c4a7a, 0x7a2a22, 0xd8d0bc];
  const men = robes.map((robe) => {
    const f = figure(1.8, { robe });
    g.add(f);
    return f;
  });
  const shining = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.7, 1.6, 1.4), transparent: true });
  const fourth = figure(1.85, { material: shining });
  fourth.castShadow = false;
  g.add(fourth);
  const aura = glowSprite(0xfff2d8, 7, 0);
  g.add(aura);
  return { group: g, hot, coalMat, flames, plume, heat, men, fourth, shining, aura };
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const height = composeHeight([heights.rolling(2, 0.006, 291), heights.channel(river, 14, -1.5, 10), heights.flatten(IMAGE[0] - 30, IMAGE[1] + 40, 90, 150, 1.4)], 1.2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "mesopotamia", size: 1400, wetLevel: 0.9 },
    water: { size: 1400, flow: 0.4, flowDir: [0, 1], deep: [0.04, 0.07, 0.06], level: -0.2 },
    // evening by the rivers; the morning sun on the image of gold; night at the furnace
    sky: (rel) => (rel < 9.5 ? [[1, "dusk"]] : rel < 19 ? [[1 - sramp(rel, 9.5, 11), "dusk"], [sramp(rel, 9.5, 11), "golden"]] : [[1 - sramp(rel, 19, 21), "golden"], [sramp(rel, 19, 21), "night"]]),
    camera: [
      [0, [160, 40, 220], [40, 20, 0], 44],
      [3.5, [60, 14, 60], [10, 14, 30], 46],
      [6.5, [-14, 3.2, 34], [-40, 2, 12], 44],
      [9, [-20, 2.6, 23], [-30, 3, 20], 46],
      // the plain of Dura
      [11.5, [214, 30, 64], [IMAGE[0], 16, IMAGE[1]], 46],
      [15, [262, 2.1, 6.5], [IMAGE[0], 9, IMAGE[1] - 1], 44],
      // round in front of the three, their faces toward the image and away from us... then theirs to us
      [17.5, [280, 1.9, 6], [272.3, 1.9, 0], 40],
      [19.4, [279, 1.8, 3.5], [272.3, 1.9, 0], 38],
      [21.2, [312, 18, 64], [FURNACE[0], 8, FURNACE[1] + 10], 46],
      // the furnace mouth
      [23, [FURNACE[0] + 1.5, 4.5, FURNACE[1] + 40], [FURNACE[0], 3.4, FURNACE[1] + 17], 42],
      [26.2, [FURNACE[0] + 0.5, 2.8, FURNACE[1] + 30], [FURNACE[0], 2.8, FURNACE[1] + 17.5], 40],
      [30, [FURNACE[0] - 4, 3.4, FURNACE[1] + 40], [FURNACE[0], 2.6, FURNACE[1] + 20], 44],
    ],
    grade: (rel) => ({ saturation: 0.88, bloom: 0.3, threshold: rel > 20 ? 1.1 : 0.9, exposure: rel > 20 ? 0.85 : 1 }),
    audio: (rel) => ({ drone: 0.3, water: 0.4 * (1 - sramp(rel, 9, 11)), fire: 0.65 * sramp(rel, 19.5, 21.5), wind: 0.15 + 0.1 * pulse(rel, 10, 11, 19, 20) }),
  });
  const h = L.height;

  // the city: walls, the gate of Ishtar, houses, and the temple tower
  L.add(wall({ points: [[0, -200], [200, -200], [200, 160], [0, 160]], height: h, h: 24, thickness: 8, towerEvery: 1, material: "mud" }));
  const gate = ishtarGate();
  gate.position.set(0, h(0, 30), 30);
  gate.rotation.y = Math.PI / 2;
  L.add(gate);
  const town = city({ count: low ? 380 : 500, radius: 90, height: (x, z) => h(x + 100, z), style: "mud", seed: 113 });
  town.position.set(100, 0, 0);
  L.add(town);
  const temple = ziggurat({ base: 50, tiers: 6, tierH: 8 });
  temple.position.set(110, h(110, -20), -20);
  L.add(temple);

  // by the rivers of Babylon: willows, the exiles sitting, the harps hung up
  L.add(createTrees({ count: low ? 140 : 200, place: placers.box(-120, -400, 20, 400, (x, z) => { const d = Math.abs(x - river(z)); return d > 16 && d < 40 && Math.hypot(x + 28, z - 22) > 12; }), height: h, kind: "willow", size: [4, 7] }).group);
  let w = 0;
  L.add(createTrees({ count: WILLOWS.length, place: () => WILLOWS[w++ % WILLOWS.length], height: h, kind: "willow", size: [5.5, 5.5] }).group);
  const harps = new THREE.Group();
  for (const [i, [x, z]] of WILLOWS.entries()) {
    for (const k of [0, 1]) {
      const a = 2.2 + i * 0.9 + k * 1.4;
      const l = lyre();
      l.position.set(x + Math.cos(a) * 1.5, h(x, z) + 1.55 + k * 0.35, z + Math.sin(a) * 1.5);
      l.rotation.y = -a;
      l.rotation.z = (k - 0.5) * 0.12;
      harps.add(l);
    }
  }
  L.add(harps);
  const exiles = crowd({ count: 60, place: placers.box(-28, -10, -18, 60, (x, z) => Math.hypot(x + 28, z - 22) > 4), height: h, seed: 115, face: [-40, 20], kneel: 0.6 });
  L.add(exiles.group);

  // the plain of Dura: the image, the multitude fallen down before it, and three standing
  const image = goldenImage();
  image.position.set(IMAGE[0], h(...IMAGE) - 0.2, IMAGE[1]);
  L.add(image);
  const bowed = crowd({
    count: low ? 520 : 900,
    place: placers.box(222, -55, 306, 55, (x, z) => STAND.every(([sx, sz]) => Math.hypot(x - sx, z - sz) > 2.4) && Math.hypot(x - IMAGE[0], z - IMAGE[1]) > 22),
    height: h, seed: 117, face: IMAGE, bow: 1.15, kneel: 0.72,
  });
  L.add(bowed.group);
  const three = STAND.map(([x, z], i) => {
    const f = figure(1.8, { robe: [0x2c4a7a, 0x7a2a22, 0xd8d0bc][i] });
    f.position.set(x, h(x, z), z);
    f.rotation.y = Math.atan2(IMAGE[0] - x, IMAGE[1] - z) + (i - 1) * 0.12;
    L.add(f);
    return f;
  });

  // the furnace
  const fire = furnace(low);
  const ground = h(...FURNACE);
  fire.group.position.set(FURNACE[0], ground, FURNACE[1]);
  L.add(fire.group);

  L.onUpdate(({ rel, time }) => {
    exiles.group.visible = harps.visible = rel < 10.5;
    bowed.group.visible = rel > 9 && rel < 21;
    three.forEach((f) => { f.visible = rel > 9 && rel < 21; });
    // the furnace heated seven times more than it was wont (Daniel 3:19)
    const burn = sramp(rel, 18.5, 21);
    const flicker = 0.85 + 0.15 * Math.sin(time * 9) * Math.sin(time * 5.3);
    fire.hot.color.setRGB(1.5 * burn * flicker, 0.62 * burn * flicker, 0.16 * burn);
    fire.coalMat.color.setRGB(1.1 * burn * flicker, 0.32 * burn * flicker, 0.06 * burn);
    for (const f of fire.flames) { f.material.uniforms.uAmount.value = burn; f.material.uniforms.uTime.value = time; }
    fire.plume.material.uniforms.uAmount.value = burn;
    fire.plume.material.uniforms.uTime.value = time;
    fire.heat.intensity = burn * 420 * flicker;
    // four walking loose in the midst of the fire; at the end the three come forth, and the fourth is not seen
    const inFire = rel > 20.5;
    const forth = sramp(rel, 26.5, 29.5);
    const walkers = [...fire.men, fire.fourth];
    walkers.forEach((f, i) => {
      f.visible = inFire;
      const ph = time * 0.32 + i * 1.6;
      const x = (i - 1.5) * 2.1 + Math.sin(ph) * 1.1;
      const z = MOUTH_Z + 2.6 + Math.cos(ph * 0.9 + i) * 0.9 + (i < 3 ? forth * 9 : 0);
      f.rotation.y = i < 3 && forth > 0.05 ? 0 : Math.atan2(Math.cos(ph) * 1.1, -Math.sin(ph * 0.9 + i) * 0.8);
      f.position.set(x * (i < 3 ? 1 - forth * 0.5 : 1), 0, z);
    });
    const glory = pulse(rel, 21, 22.5, 26.5, 29);
    fire.shining.opacity = glory;
    fire.fourth.visible = inFire && glory > 0.02;
    fire.aura.position.copy(fire.fourth.position).add(new THREE.Vector3(0, 1.1, 0));
    fire.aura.material.opacity = glory * 0.7;
  });
  return L;
}
