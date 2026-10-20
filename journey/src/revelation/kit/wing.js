// One of the six wings of a living creature, full of eyes within (4:8): bronze-gold and softly lit, so six of
// them frame a beast rather than hide it. Built here, not generated: six generated wings buried the beasts.

import * as THREE from "three";

import { eyesOver } from "./standins.js";

/** wing(height) -> Group with its root at the origin, spreading along +x (free to move and scale). */
export function wing(height = 0.9) {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(0.8, 0.9, 2.2, 1.1, 3.2, 0.5);
  s.bezierCurveTo(2.4, 0.2, 1.4, -0.3, 0, -0.25);
  const g = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({
    color: 0xc89a52, emissive: 0x5a3c14, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide,
  });
  g.add(new THREE.Mesh(new THREE.ShapeGeometry(s, 24), bronze));
  g.add(eyesOver({ count: 26, radii: [1.2, 0.25, 0.04], center: [1.5, 0.35, 0], size: 0.06, seed: 3 }));
  // 1.35 tall before scaling (from -0.25 to about 1.1), standing on its root
  g.scale.setScalar(height / 1.35);
  g.position.y = 0.25 * (height / 1.35);
  const holder = new THREE.Group();
  holder.add(g);
  return holder;
}
