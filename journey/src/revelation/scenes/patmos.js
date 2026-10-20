// Revelation 1:9–11, Patmos. Seen from outside, once: an old man in exile on the rocks at first light, the
// Lord's day. "I was in the Spirit": the light changes. A great voice as of a trumpet sounds behind him, and the
// camera goes into his eyes, still facing the sea, and stays there to the end of the vision. He is told to
// write; his own hands hold a book and a reed.

import * as THREE from "three";

import { lerp, pulse, sramp } from "../../kit/common.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { hands } from "../kit/hands.js";
import { JOHN, groundAtJohn as G, patmos } from "../kit/island.js";

export function create(ctx) {
  const [jx, jz] = JOHN;
  const L = patmos(ctx, {
    sky: (rel) => [[1 - sramp(rel, 1, 7), "dawn"], [sramp(rel, 1, 7), "morning"]],
    // wide from the sea, in to the old man on the ledge, over his shoulder, into his eyes
    camera: [
      [0, [jx + 230, G + 30, jz + 120], [jx, G + 2, jz], 34],
      [6, [jx + 7, G + 2.2, jz + 4.5], [jx, G + 1.3, jz], 38],
      [10.5, [jx - 2.2, G + 2.0, jz + 1.2], [jx + 40, G - 1, jz], 46],
      [14, [jx, G + EYE, jz], [jx + 60, G - 3, jz], 50],
    ],
    // in the Spirit: the light warms and softens
    grade: (rel) => ({ bloom: 0.3 + 0.4 * sramp(rel, 7, 10), threshold: 0.95 - 0.2 * sramp(rel, 7, 10), tint: [1 + 0.04 * sramp(rel, 7, 10), 1, 1 - 0.1 * sramp(rel, 7, 10)], saturation: 1 - 0.15 * sramp(rel, 7, 10) }),
    audio: (rel) => ({ water: 0.45, wind: 0.35 * (1 - 0.6 * sramp(rel, 7, 10)), drone: 0.2 + 0.2 * sramp(rel, 7, 10), shimmer: 0.4 * sramp(rel, 7, 10), trumpet: pulse(rel, 10.5, 11.5, 19, 21.5) }),
  });
  const ground = L.height(jx, jz);
  const john = cast("john", 1.72);
  john.position.set(jx, ground, jz);
  john.rotation.y = Math.PI / 2; // facing east (+x), over the sea (figures face +z)
  L.add(john);

  // from 14 on: John's eyes, looking east; the voice is behind him
  const eyes = johnEyes([[14, [jx, ground + EYE, jz], [jx + 60, ground - 3, jz], 50], [24, [jx, ground + EYE, jz], [jx + 60, ground - 6, jz + 4], 50]]);
  L.scene.add(L.camera);
  const hand = hands(L.camera);
  // what thou seest, write in a book (1:11): a book and a reed in his hands
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.12), new THREE.MeshStandardMaterial({ color: 0x9c8a68, roughness: 1 }));
  book.position.set(0, 0.03, -0.05);
  const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0x6b5236 }));
  reed.position.set(0.12, 0.06, -0.05);
  reed.rotation.set(0.4, 0, -0.9);
  hand.group.add(book, reed);

  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    if (rel >= 14) eyes.apply(camera, rel, time, reducedMotion);
    john.visible = rel < 13.4;
    hand.pose("write", pulse(rel, 15, 16.5, 21.5, 23));
  });
  return L;
}
