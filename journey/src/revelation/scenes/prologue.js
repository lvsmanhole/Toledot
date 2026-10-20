// Revelation 1:1–8, the title sequence: no one's eyes yet. The night sea, the island far off; one light, the
// angel who signified it to John, comes down toward it (1:1); seven lights stand over the water, the seven
// Spirits before the throne (1:4); clouds gather, "he cometh with clouds" (1:7). No figure is shown.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../../kit/common.js";
import { patmos } from "../kit/island.js";

export function create(ctx) {
  const L = patmos(ctx, {
    sky: (rel) => [[1 - 0.8 * sramp(rel, 19, 23), "night"], [0.8 * sramp(rel, 19, 23), "storm"]],
    camera: [[0, [0, 6, 760], [0, 14, 0], 42], [14, [0, 7, 640], [0, 20, 0], 42], [22, [0, 9, 560], [0, 40, 0], 46], [28, [0, 9, 520], [0, 30, 0], 44]],
    grade: (rel) => ({ bloom: 0.55, threshold: 0.7, exposure: 0.85 }),
    audio: (rel) => ({ water: 0.5, wind: 0.25 + 0.4 * sramp(rel, 19, 23), drone: 0.25, shimmer: 0.4 * pulse(rel, 6, 8, 18, 20) }),
  });
  // the angel of 1:1: one light descending from high over the sea to the island
  const angel = glowSprite(0xfff4dc, 110, 0);
  L.add(angel);
  const angelLight = new THREE.PointLight(0xfff0d0, 0, 400, 1.5);
  L.add(angelLight);
  // the seven Spirits which are before his throne (1:4): seven lights standing in the sky over the water
  const spirits = [];
  for (let i = 0; i < 7; i++) {
    const s = glowSprite(0xfff2c8, 70, 0);
    s.position.set(-180 + i * 60, 90 + Math.sin((i / 6) * Math.PI) * 30, 150);
    L.add(s);
    spirits.push(s);
  }
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(80, 520, -300), new THREE.Vector3(40, 200, 0), new THREE.Vector3(4, 40, 4)]);
  L.onUpdate(({ rel, time }) => {
    const k = sramp(rel, 6.5, 11);
    path.getPoint(k, angel.position);
    angelLight.position.copy(angel.position);
    const on = pulse(rel, 6.5, 7.5, 13, 15);
    angel.material.opacity = on * (0.85 + 0.1 * Math.sin(time * 3));
    angelLight.intensity = on * 900;
    spirits.forEach((s, i) => {
      s.material.opacity = pulse(rel, 15 + i * 0.25, 16 + i * 0.25, 19.5, 21) * (0.8 + 0.15 * Math.sin(time * 1.3 + i));
    });
  });
  return L;
}
