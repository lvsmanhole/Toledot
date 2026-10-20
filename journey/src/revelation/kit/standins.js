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

/** One great wing full of eyes (4:8), root at the origin, spreading along +x. */
export function wingEyes() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.9, 2.2, 1.1, 3.2, 0.5);
  s.bezierCurveTo(2.4, 0.2, 1.4, -0.3, 0, -0.25);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(s, 24), std(0xf6f1e6, { side: THREE.DoubleSide, emissive: 0x2a241a })));
  const e = eyesOver({ count: 26, radii: [1.2, 0.25, 0.04], center: [1.5, 0.35, 0], size: 0.06, seed: 3 });
  g.add(e);
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

export const STANDINS = { john, sonOfMan, elder, elderB: elder, elderC: elder, crown, beastLion: () => beast("lion"), beastCalf: () => beast("calf"), beastMan: () => beast("man"), beastEagle: () => beast("eagle"), wingEyes, lamb, angel, sealedBook, harp, goldenVial, keys };
