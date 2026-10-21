// Stand-ins built in code for the generated creatures (src/revelation/creatures.js): each keeps the shape,
// size and every feature the text gives, so a scene reads true before its model is approved. Bodies only;
// the light the text gives them (a face as the sun, eyes of fire, stars in the hand) is added by the scene.

import * as THREE from "three";

import { MATERIALS } from "../../kit/structures.js";
import { figure } from "../../kit/figures.js";

const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...opts });
const mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };

/** Many open eyes over an ellipsoid (the living creatures are "full of eyes before and behind"). */
export function eyesOver({ count = 60, radii = [0.5, 0.5, 0.5], center = [0, 0, 0], size = 0.05, seed = 1 }) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const white = new THREE.InstancedMesh(new THREE.SphereGeometry(size, 10, 8), std(0xf4efe4, { roughness: 0.3 }), count);
  const iris = new THREE.InstancedMesh(new THREE.SphereGeometry(size * 0.55, 8, 6), std(0x2a1c10, { roughness: 0.2 }), count);
  const m = new THREE.Matrix4();
  const n = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const u = r() * 2 - 1;
    const a = r() * Math.PI * 2;
    n.set(Math.sqrt(1 - u * u) * Math.cos(a), u, Math.sqrt(1 - u * u) * Math.sin(a));
    const p = new THREE.Vector3(n.x * radii[0] + center[0], n.y * radii[1] + center[1], n.z * radii[2] + center[2]);
    white.setMatrixAt(i, m.makeTranslation(p.x, p.y, p.z));
    const q = p.clone().addScaledVector(n, size * 0.6);
    iris.setMatrixAt(i, m.makeTranslation(q.x, q.y, q.z));
  }
  const g = new THREE.Group();
  g.add(white, iris);
  return g;
}

export function john() {
  return figure(1.72, { staff: true, robe: 0x857862 });
}

export function sonOfMan() {
  const g = new THREE.Group();
  g.add(figure(2.1, { robe: 0xf1ede4, beard: false }));
  const girdle = mesh(new THREE.TorusGeometry(0.2, 0.035, 8, 32), MATERIALS.gold(), 0, 1.5, 0);
  girdle.rotation.x = Math.PI / 2;
  girdle.scale.set(1, 0.7, 1);
  g.add(girdle);
  g.add(mesh(new THREE.SphereGeometry(0.15, 16, 12), std(0xffffff, { roughness: 1 }), 0, 1.98, -0.02)); // hair white as snow
  return g;
}

export function elder() {
  const g = new THREE.Group();
  const body = figure(1.6, { robe: 0xf3f0e8 });
  body.scale.y = 0.82; // seated (bareheaded: his crown is its own creature, which he casts down, 4:10)
  g.add(body);
  return g;
}

export function crown() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const band = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.12, 24, 1, true), gold, 0, 0.06, 0);
  band.material.side = THREE.DoubleSide;
  g.add(band);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 6), gold, Math.cos(a) * 0.2, 0.18, Math.sin(a) * 0.2));
  }
  return g;
}

/** The four living creatures (4:7): "lion" | "calf" | "man" | "eagle", bodies full of eyes. */
export function beast(kind) {
  const g = new THREE.Group();
  const coat = { lion: 0xb08a4e, calf: 0x8c6a4a, man: 0xd9cfc0, eagle: 0x6b5641 }[kind];
  const mat = std(coat, { roughness: 0.9 });
  if (kind === "lion" || kind === "calf") {
    const body = mesh(new THREE.CapsuleGeometry(0.55, 1.4, 6, 16), mat, 0, 1.2, 0);
    body.rotation.z = Math.PI / 2;
    g.add(body);
    for (const [x, z] of [[-0.6, -0.3], [-0.6, 0.3], [0.6, -0.3], [0.6, 0.3]]) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.9, 10), mat, x, 0.45, z));
    const head = mesh(new THREE.SphereGeometry(0.42, 20, 16), mat, 1.25, 1.55, 0);
    g.add(head);
    if (kind === "lion") {
      const mane = mesh(new THREE.TorusGeometry(0.45, 0.22, 10, 24), std(0x7a5528, { roughness: 1 }), 1.15, 1.55, 0);
      mane.rotation.y = Math.PI / 2;
      g.add(mane);
    } else {
      for (const z of [-0.25, 0.25]) g.add(mesh(new THREE.ConeGeometry(0.05, 0.2, 8), std(0xd8ccb0), 1.3, 1.95, z));
    }
    g.add(eyesOver({ count: 90, radii: [1.2, 0.6, 0.6], center: [0, 1.2, 0], seed: kind.length }));
  } else if (kind === "man") {
    g.add(figure(2.0, { robe: 0xd9cfc0, beard: true }));
    g.add(eyesOver({ count: 80, radii: [0.32, 0.9, 0.3], center: [0, 1.0, 0], seed: 7 }));
  } else {
    const body = mesh(new THREE.SphereGeometry(0.6, 20, 16), mat, 0, 1.4, 0);
    body.scale.set(1.5, 0.9, 0.9);
    g.add(body);
    g.add(mesh(new THREE.SphereGeometry(0.32, 16, 12), std(0xe8e2d2), 1.0, 1.75, 0));
    const beak = mesh(new THREE.ConeGeometry(0.1, 0.3, 10), std(0xd8a640, { metalness: 0.3 }), 1.35, 1.7, 0);
    beak.rotation.z = -Math.PI / 2;
    g.add(beak);
    g.add(eyesOver({ count: 70, radii: [0.9, 0.55, 0.55], center: [0, 1.4, 0], seed: 11 }));
  }
  return g;
}

export function lamb() {
  const g = new THREE.Group();
  const fleece = std(0xf2eee6, { roughness: 1 });
  const body = mesh(new THREE.CapsuleGeometry(0.22, 0.5, 6, 14), fleece, 0, 0.55, 0);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  for (const [x, z] of [[-0.25, -0.1], [-0.25, 0.1], [0.25, -0.1], [0.25, 0.1]]) g.add(mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.42, 8), std(0x2a2420), x, 0.21, z));
  const head = mesh(new THREE.SphereGeometry(0.15, 16, 12), fleece, 0.48, 0.78, 0);
  head.scale.set(1.3, 1, 0.9);
  g.add(head);
  // seven horns (the seven eyes and the healed mark are light the scene adds, over the model too)
  for (let i = 0; i < 7; i++) {
    const a = -1 + (i / 6) * 2;
    const horn = mesh(new THREE.ConeGeometry(0.018, 0.12, 6), std(0xe9dcc0), 0.48 + Math.cos(a) * 0.02, 0.92, a * 0.1);
    horn.rotation.x = a * 0.4;
    g.add(horn);
  }
  return g;
}

export function angel() {
  const g = new THREE.Group();
  g.add(figure(2.3, { robe: 0xf4f1ea, beard: false }));
  const wing = wingShape();
  for (const side of [-1, 1]) {
    const w = new THREE.Mesh(wing, std(0xf7f3ea, { side: THREE.DoubleSide, roughness: 0.9 }));
    w.name = side < 0 ? "wingL" : "wingR";
    w.position.set(side * 0.15, 1.75, -0.18);
    w.scale.set(side * 1.1, 1.1, 1);
    w.rotation.y = side * 0.5;
    g.add(w);
  }
  return g;
}

function wingShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.6, 0.9, 1.4, 1.2, 1.9, 0.6);
  s.bezierCurveTo(1.5, -0.4, 1.1, -1.4, 0.7, -1.8);
  s.bezierCurveTo(0.4, -1.0, 0.2, -0.5, 0, -0.3);
  return new THREE.ShapeGeometry(s, 24);
}

/** A book written within and on the backside, sealed with seven seals (5:1): a rolled scroll, along x. */
export function sealedBook() {
  const g = new THREE.Group();
  const roll = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.42, 20), std(0xe6d6b2, { roughness: 1 }), 0, 0, 0);
  roll.rotation.z = Math.PI / 2;
  g.add(roll);
  for (let i = 0; i < 7; i++) {
    const seal = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.012, 14), std(0x8a1e18, { roughness: 0.5 }), -0.18 + i * 0.06, 0.072, 0);
    seal.name = `seal${i}`;
    g.add(seal);
  }
  return g;
}

export function harp() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const frame = mesh(new THREE.TorusGeometry(0.16, 0.015, 8, 24, Math.PI), gold, 0, 0.16, 0);
  frame.rotation.z = Math.PI;
  g.add(frame, mesh(new THREE.BoxGeometry(0.36, 0.03, 0.03), gold, 0, 0.32, 0));
  for (let i = 0; i < 7; i++) g.add(mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.3, 4), std(0xeeeeee), -0.12 + i * 0.04, 0.17, 0));
  return g;
}

export function goldenVial() {
  const pts = [[0, 0], [0.12, 0.01], [0.18, 0.05], [0.2, 0.09], [0.19, 0.095]].map(([x, y]) => new THREE.Vector2(x, y));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), MATERIALS.gold());
  m.material.side = THREE.DoubleSide;
  return m;
}

/** The keys of hell and of death (1:18). */
export function keys() {
  const g = new THREE.Group();
  const iron = std(0x4a4440, { metalness: 0.8, roughness: 0.5 });
  for (const [x, tilt] of [[-0.05, 0.25], [0.05, -0.2]]) {
    const k = new THREE.Group();
    k.add(mesh(new THREE.TorusGeometry(0.05, 0.012, 8, 18), iron, 0, 0.28, 0));
    k.add(mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 8), iron, 0, 0.12, 0));
    k.add(mesh(new THREE.BoxGeometry(0.05, 0.035, 0.012), iron, 0.025, 0.02, 0));
    k.position.x = x;
    k.rotation.z = tilt;
    g.add(k);
  }
  return g;
}

/** A horse (head toward +x), about 1.7 at the withers, in one coat. */
function horse(coat, { lionHead = false } = {}) {
  const g = new THREE.Group();
  const mat = std(coat, { roughness: 0.8 });
  const body = mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 16), mat, 0, 1.35, 0);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  for (const [x, z] of [[-0.55, -0.2], [-0.55, 0.2], [0.55, -0.2], [0.55, 0.2]]) g.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 1.15, 8), mat, x, 0.58, z));
  const neck = mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.9, 10), mat, 0.85, 1.85, 0);
  neck.rotation.z = -0.6;
  g.add(neck);
  if (lionHead) {
    g.add(mesh(new THREE.SphereGeometry(0.34, 16, 12), std(0xb88a4c), 1.25, 2.2, 0));
    const mane = mesh(new THREE.TorusGeometry(0.34, 0.16, 8, 20), std(0x7a5528, { roughness: 1 }), 1.15, 2.2, 0);
    mane.rotation.y = Math.PI / 2;
    g.add(mane);
  } else {
    const head = mesh(new THREE.CapsuleGeometry(0.13, 0.45, 4, 10), mat, 1.3, 2.05, 0);
    head.rotation.z = -1.1;
    g.add(head);
  }
  return g;
}

/** A rider seated on a horse, with what the text puts in his hand. */
function horseman(coat, robe, hand) {
  const g = horse(coat);
  const rider = figure(1.5, { robe });
  rider.position.set(-0.05, 1.45, 0);
  g.add(rider);
  if (hand) { hand.position.add(new THREE.Vector3(0.25, 2.4, 0.3)); g.add(hand); }
  return g;
}

export const horseWhite = () => {
  const bow = mesh(new THREE.TorusGeometry(0.45, 0.025, 6, 24, Math.PI), std(0x5a3a22));
  bow.rotation.z = Math.PI / 2;
  const g = horseman(0xf0ece2, 0x9a2a22, bow);
  const c = crown();
  c.position.set(-0.05, 2.9, 0);
  c.scale.setScalar(0.6);
  g.add(c);
  return g;
};
export const horseRed = () => {
  const sword = mesh(new THREE.BoxGeometry(0.06, 1.2, 0.02), std(0xc8c8cc, { metalness: 0.9, roughness: 0.3 }));
  sword.position.y = 0.4;
  return horseman(0x8a1e14, 0x5a4636, sword);
};
export const horseBlack = () => {
  const balances = new THREE.Group();
  const bronze = std(0x9a7a3a, { metalness: 0.8, roughness: 0.4 });
  balances.add(mesh(new THREE.BoxGeometry(0.5, 0.02, 0.02), bronze));
  for (const x of [-0.24, 0.24]) balances.add(mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.03, 12), bronze, x, -0.25, 0));
  return horseman(0x16130f, 0x2a241e, balances);
};
export const horsePale = () => {
  const g = horse(0xa8b0a0);
  const rider = figure(1.5, { robe: 0x6e6c66, veiled: true });
  rider.position.set(-0.05, 1.45, 0);
  g.add(rider);
  return g;
};

/** A locust of the pit (9:7–10): a horse's shape for battle, a crown of gold, an iron breastplate, wings and a scorpion's tail. */
export function locust() {
  const g = horse(0x4a4030);
  const iron = std(0x3a3a3c, { metalness: 0.8, roughness: 0.45 });
  const plate = mesh(new THREE.SphereGeometry(0.46, 16, 12), iron, 0.4, 1.4, 0);
  plate.scale.set(0.8, 1, 1.05);
  g.add(plate);
  const c = crown();
  c.position.set(1.3, 2.25, 0);
  c.scale.setScalar(0.8);
  g.add(c);
  for (const side of [-1, 1]) {
    const w = mesh(new THREE.PlaneGeometry(1.6, 0.5), std(0xc8c0a0, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }), -0.1, 1.9, side * 0.5);
    w.rotation.set(Math.PI / 2, side * 0.3, 0);
    g.add(w);
  }
  for (let i = 0; i < 6; i++) g.add(mesh(new THREE.SphereGeometry(0.12 - i * 0.012, 8, 6), std(0x4a4030), -0.85 - i * 0.14, 1.4 + i * i * 0.04, 0));
  g.add(mesh(new THREE.ConeGeometry(0.05, 0.25, 6), std(0x1a1610), -1.6, 2.6, 0));
  return g;
}

/** A horse of the army of 9:17–19: a lion's head, a serpent for a tail, its rider's breastplate of fire, jacinth and brimstone. */
export function lionHorse() {
  const g = horse(0x5a4a3a, { lionHead: true });
  const rider = figure(1.5, { robe: 0x2a2440 });
  rider.position.set(-0.05, 1.45, 0);
  g.add(rider);
  ["#d8401a", "#3a3a9a", "#d8c030"].forEach((c, i) => g.add(mesh(new THREE.BoxGeometry(0.3, 0.12, 0.34), std(c, { emissive: c, emissiveIntensity: 0.4 }), -0.05, 2.4 - i * 0.12, 0)));
  const tail = mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 16, Math.PI * 1.3), std(0x3a4a2a), -0.95, 1.15, 0);
  g.add(tail, mesh(new THREE.SphereGeometry(0.09, 8, 6), std(0x3a4a2a), -1.3, 0.85, 0));
  return g;
}

/** The angel of the bottomless pit (9:11): the angel's shape, blackened bronze, crowned. */
export function abaddon() {
  const g = angel();
  g.traverse((m) => { if (m.isMesh) m.material = std(0x2a221c, { metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }); });
  const c = crown();
  c.position.y = 2.25;
  g.add(c);
  return g;
}

/** One of the two witnesses (11:3): a prophet clothed in sackcloth. */
export const witness = () => figure(1.75, { robe: 0x3e3226, staff: false });

/** An idol (9:20): a stiff seated image on a block (the scene gives it in gold, silver, brass, stone and wood). */
export function idol() {
  const g = new THREE.Group();
  const stone = std(0x8a8478);
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.35, 0.45), stone, 0, 0.175, 0));
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.45, 0.25), stone, 0, 0.58, 0));
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), stone, 0, 0.91, 0));
  return g;
}

export const STANDINS = { john, sonOfMan, elder, elderB: elder, elderC: elder, crown, beastLion: () => beast("lion"), beastCalf: () => beast("calf"), beastMan: () => beast("man"), beastEagle: () => beast("eagle"), lamb, angel, sealedBook, harp, goldenVial, keys,
  horseWhite, horseRed, horseBlack, horsePale, locust, lionHorse, abaddon, witness, witnessB: witness, idol };
