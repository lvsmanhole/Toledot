// John's own forearms and hands, seen from his eyes, carried by the camera. They come into view only when
// he acts: reaching for the book (10:9), writing (1:11), shielding his face, measuring (11:1). They are built
// here, not generated: the 3D service could not model them as seen from his own eyes.

import * as THREE from "three";

import { lerp, sramp } from "../../kit/common.js";

// where the hands sit in front of the eyes for each pose (camera space, metres; x right, y up, -z ahead)
const POSES = {
  // (the view is about 25 degrees half-height: a hand at depth z shows when y is above -0.45 z)
  rest: { y: -0.75, z: -0.35, tilt: 0.2 },
  reach: { y: -0.12, z: -0.5, tilt: -0.1 },
  write: { y: -0.17, z: -0.42, tilt: 0.55 },
  shield: { y: -0.02, z: -0.3, tilt: -1.2 },
  touched: { y: -0.16, z: -0.38, tilt: 0.35 },
};

function built() {
  const g = new THREE.Group();
  // an old man of the east: dark olive-brown skin, sleeves of undyed wool
  const skin = new THREE.MeshStandardMaterial({ color: 0x5e4030, roughness: 0.75 });
  const sleeve = new THREE.MeshStandardMaterial({ color: 0x9a8f7e, roughness: 1 });
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.32, 4, 10), sleeve);
    arm.rotation.x = Math.PI / 2;
    arm.position.set(side * 0.16, 0, 0.12);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.03, 0.12), skin);
    hand.position.set(side * 0.16, 0, -0.12);
    g.add(arm, hand);
  }
  return g;
}

/** hands(camera): parented to the camera (add the camera to the scene). pose(name, k) eases from rest. */
export function hands(camera) {
  const group = new THREE.Group();
  group.add(built());
  group.visible = false;
  camera.add(group);
  return {
    group,
    /** Show the hands k (0..1) of the way from out of sight to the named pose. */
    pose(name, k) {
      const p = POSES[name] ?? POSES.rest;
      const s = sramp(k, 0, 1);
      group.visible = s > 0.001;
      group.position.set(0, lerp(-1.1, p.y, s), p.z);
      group.rotation.x = p.tilt * s;
    },
  };
}
