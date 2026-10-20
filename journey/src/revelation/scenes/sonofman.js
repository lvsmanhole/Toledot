// Revelation 1:12–20, through John's eyes. He turns to see the voice: seven golden candlesticks, and in their
// midst one like unto the Son of man. His gaze goes over him as the text does (the garment and the golden
// girdle; the head and hair white as snow; eyes as a flame of fire; feet like fine brass burning; the voice as
// many waters; seven stars in the right hand; a sharp two-edged sword out of his mouth; the countenance as
// the sun). He falls as dead; the right hand is laid on him; "Fear not". The keys of hell and of death. The
// stars go to stand over the candlesticks: the angels of the seven churches.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../../kit/common.js";
import { flame } from "../../kit/effects.js";
import { MATERIALS } from "../../kit/structures.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { hands } from "../kit/hands.js";
import { JOHN, patmos } from "../kit/island.js";
import { keys as keysProp } from "../kit/standins.js";

/** A golden candlestick (lampstand): base, shaft, cup and flame. */
export function candlestick(seed = 0) {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.28, 0.16, 20), gold);
  base.position.y = 0.08;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.3, 12), gold);
  shaft.position.y = 0.8;
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.12, 16), gold);
  cup.position.y = 1.5;
  const f = flame({ width: 0.22, height: 0.5, gain: 1.3, seed });
  f.position.y = 1.55;
  g.add(base, shaft, cup, f);
  return { group: g, flame: f };
}

export function create(ctx) {
  const [jx, jz] = JOHN;
  const C = [jx - 16, jz]; // the midst of the candlesticks, behind John (west)
  const L = patmos(ctx, {
    sky: (rel) => [[1 - 0.7 * sramp(rel, 1, 6), "morning"], [0.7 * sramp(rel, 1, 6), "dusk"]],
    camera: [[0, [jx, 30, jz], [jx + 60, 20, jz], 50], [36, [jx, 30, jz], [jx + 60, 20, jz], 50]], // replaced by John's eyes
    keepAboveGround: false,
    grade: (rel) => ({
      bloom: 0.4 + 0.2 * pulse(rel, 17.5, 20, 21, 22.5), threshold: 0.92 - 0.12 * pulse(rel, 17.5, 20, 21, 22.5), exposure: 0.95 - 0.15 * sramp(rel, 1, 6) - 0.15 * pulse(rel, 18, 20, 21, 22.5),
      tint: [1.04, 1, 0.94],
    }),
    audio: (rel) => ({ water: 0.3, wind: 0.15, drone: 0.3, shimmer: 0.5 * sramp(rel, 2, 5), waters: pulse(rel, 14, 15, 29, 31) * 0.9, trumpet: pulse(rel, 0, 0.5, 1.5, 3) * 0.6 }),
  });
  const h = L.height;
  const G = h(jx, jz);
  const gc = h(C[0], C[1]);
  const E = [jx, G + EYE, jz];

  // the seven golden candlesticks, and one like unto the Son of man in their midst, facing John
  const ring = new THREE.Group();
  ring.position.set(C[0], gc, C[1]);
  L.add(ring);
  const stands = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + Math.PI / 7;
    const s = candlestick(i);
    s.group.position.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5);
    ring.add(s.group);
    stands.push(s);
  }
  const him = cast("sonOfMan", 2.4);
  him.rotation.y = Math.PI / 2; // facing east, toward John
  ring.add(him);
  // the light the text gives him
  const face = glowSprite(0xfff6e0, 1.2, 0);
  face.position.set(0.26, 2.2, 0);
  const eyesOfFire = [-0.055, 0.055].map((z) => { const e = glowSprite(0xff5a14, 0.38, 0); e.position.set(0.24, 2.23, z); e.material.depthTest = false; e.renderOrder = 2; return e; });
  const feet = glowSprite(0xff9a40, 1.4, 0);
  feet.position.set(0.1, 0.1, 0);
  const brass = new THREE.PointLight(0xff8a3a, 0, 6, 2);
  brass.position.set(0.4, 0.2, 0);
  const glory = new THREE.PointLight(0xfff0d8, 0, 60, 1.4);
  glory.position.set(3, 3.2, 0);
  ring.add(face, ...eyesOfFire, feet, brass, glory);
  // the sharp two-edged sword out of his mouth, toward John
  const sword = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.012, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.4), transparent: true, opacity: 0 }));
  sword.position.set(0.72, 2.13, 0);
  ring.add(sword);
  // seven stars in his right hand (turned to face +x, his right hand is on the +z side)
  const hand = new THREE.Vector3(0.4, 1.3, 0.42);
  const stars = [];
  for (let i = 0; i < 7; i++) {
    const s = glowSprite(0xfff8e8, 0.5, 0);
    ring.add(s);
    stars.push(s);
  }
  // the keys of hell and of death, in his hand
  const keys = keysProp();
  keys.position.set(0.5, 1.2, -0.42);
  keys.scale.setScalar(1.4);
  keys.visible = false;
  ring.add(keys);
  const keysGlow = glowSprite(0xffe0a0, 0.6, 0);
  keysGlow.position.copy(keys.position);
  ring.add(keysGlow);

  // John's eyes: the turn, the gaze down the figure, the fall, rising, looking at the stars. (Captions sit
  // across the middle of the screen, so each thing he looks at is framed above or below the middle.)
  const at = (dy) => [C[0], gc + dy, C[1]];
  const eyes = johnEyes([
    [0, E, [jx + 60, G - 3, jz], 50],
    [1.2, E, [jx + 10, G + 1, jz - 30], 50],
    [3, E, at(1.4), 46],
    [5.5, E, at(1.3), 40],
    [9.5, E, at(1.5), 30],
    [11, E, at(1.72), 7],
    [13.5, E, at(1.7), 8],
    [15, E, at(0.75), 9],
    [17, E, at(0.8), 10],
    [18.5, E, [C[0] + 0.4, gc + 1.85, C[1] + 0.42], 12],
    [20, E, at(1.6), 16],
    [22, E, at(1.6), 30],
    [25.5, E, at(1.4), 30],
    [27.5, E, [C[0] + 0.5, gc + 1.75, C[1] - 0.42], 11],
    [29.5, E, at(1.6), 40],
    [32.5, E, at(2.4), 52],
    [36, E, at(2.4), 54],
  ], { falls: [[21.5, 23, 25.5]] });
  L.scene.add(L.camera);
  const john = hands(L.camera);

  const starHome = new THREE.Vector3();
  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the hand laid upon him while he lies as dead: the view steadies and warms
    if (rel > 23.5 && rel < 25.5 && !reducedMotion) camera.rotateZ(Math.sin(time * 9) * 0.004 * (1 - sramp(rel, 24, 25.5)));
    const appear = sramp(rel, 2.5, 5);
    stands.forEach(({ group, flame: f }, i) => {
      const on = sramp(appear, (i / 7) * 0.5, (i / 7) * 0.5 + 0.5);
      group.scale.setScalar(Math.max(0.001, on));
      f.material.uniforms.uTime.value = time;
      f.material.uniforms.uAmount.value = on;
    });
    him.visible = rel > 4.5;
    const present = sramp(rel, 4.5, 6.5);
    glory.intensity = present * (6 + 22 * pulse(rel, 17.5, 20, 21, 22.5));
    // features, lit as the text names them
    face.material.opacity = present * (0.35 + 0.5 * sramp(rel, 17.5, 20.5));
    face.scale.setScalar(0.6 + 1.6 * sramp(rel, 18.5, 21));
    for (const e of eyesOfFire) e.material.opacity = sramp(rel, 10.5, 12) * (1 - sramp(rel, 18.5, 20)) * (0.85 + 0.15 * Math.sin(time * 11));
    feet.material.opacity = sramp(rel, 14, 15.5) * (0.7 + 0.2 * Math.sin(time * 6));
    brass.intensity = sramp(rel, 14, 15.5) * 6;
    sword.material.opacity = sramp(rel, 19, 20.5) * 0.95;
    // the stars: in his right hand, then each over its candlestick (1:20)
    const go = sramp(rel, 32.3, 34.8);
    stars.forEach((s, i) => {
      const a = (i / 7) * Math.PI * 2;
      starHome.set(hand.x + Math.cos(a + time * 0.4) * 0.16, hand.y + Math.sin(a + time * 0.4) * 0.16, hand.z);
      const stand = stands[i].group.position;
      s.position.set(lerp(starHome.x, stand.x, go), lerp(starHome.y, 2.9, go), lerp(starHome.z, stand.z, go));
      s.material.opacity = sramp(rel, 17.5, 18.5) * (0.9 + 0.1 * Math.sin(time * 2 + i));
      s.scale.setScalar(0.5 + 1.1 * go);
    });
    keys.visible = rel > 25.5 && rel < 30;
    keysGlow.material.opacity = pulse(rel, 25.5, 26.5, 29, 30) * 0.6;
    john.pose("write", pulse(rel, 29.5, 30.5, 32, 33));
  });
  return L;
}
