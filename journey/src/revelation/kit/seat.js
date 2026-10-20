// A seat of the throne room (4:4), and the throne itself at a larger size: pale stone edged with gold. Built
// here, not generated: the 3D service could not bake the carving of a seat.

import * as THREE from "three";

import { MATERIALS } from "../../kit/structures.js";

const box = (w, h, d, mat, x, y, z) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  return m;
};

/** seat(height) -> Group standing on its origin, `height` tall, the back toward +z (free to move and scale). */
export function seat(height = 1.6) {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xdcd4c4, roughness: 0.55 });
  const gold = MATERIALS.gold();
  // plinth, seat, back and its rounded crest (1.95 tall before scaling)
  g.add(box(1.0, 0.12, 0.9, stone, 0, 0.06, 0));
  g.add(box(0.9, 0.4, 0.8, stone, 0, 0.32, 0));
  g.add(box(0.9, 1.0, 0.12, stone, 0, 1.0, 0.38));
  const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.12, 24, 1, false, -Math.PI / 2, Math.PI), stone);
  crest.rotation.x = Math.PI / 2;
  crest.position.set(0, 1.5, 0.38);
  g.add(crest);
  // arms
  for (const side of [-1, 1]) {
    g.add(box(0.1, 0.32, 0.7, stone, side * 0.45, 0.68, 0.02));
    g.add(box(0.13, 0.04, 0.74, gold, side * 0.45, 0.86, 0.02));
  }
  // gold edging: the seat's front lip, the plinth, and a band across the back
  g.add(box(0.94, 0.05, 0.84, gold, 0, 0.53, 0));
  g.add(box(1.02, 0.03, 0.92, gold, 0, 0.13, 0));
  g.add(box(0.92, 0.05, 0.14, gold, 0, 1.38, 0.38));
  g.scale.setScalar(height / 1.95);
  const holder = new THREE.Group();
  holder.add(g);
  return holder;
}
