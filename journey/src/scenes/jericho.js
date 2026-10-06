// Joshua 6 — Jericho. The camera circles the walled city with the procession: six days once around,
// the seventh day seven times; the sound builds; the shout; the wall falls down flat; dust fills the
// screen and becomes the passage into the days of the Judges.

import * as THREE from "three";

import { lerp, pulse, ramp, sramp } from "../kit/common.js";
import { smoke, weather } from "../kit/effects.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, wall } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

const R = 34;

export function create(ctx) {
  const height = composeHeight([heights.rolling(4, 0.01, 201), heights.mountain(0, 0, 40, 8, 202, 2), heights.flatten(0, 0, 28, 34, 9)], 0);
  const laps = (rel) => {
    // days 1–6: one lap each across 0–8; day 7: seven laps across 8–15.5
    if (rel < 8) return (rel / 8) * 6;
    return 6 + ramp(rel, 8, 15.5) * 7;
  };
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1200 },
    sky: (rel) => [[1, rel < 16 ? "golden" : "desert"]],
    camera: [[0, [0, 30, 120], [0, 8, 0], 44], [22, [0, 30, 120], [0, 8, 0], 44]],
    grade: (rel) => ({ saturation: 1 - 0.35 * sramp(rel, 16, 20), exposure: 1 - 0.2 * sramp(rel, 17, 22) }),
    audio: (rel) => ({ drone: 0.2 + 0.7 * sramp(rel, 8, 15.7) * (1 - sramp(rel, 16.5, 19)), wind: 0.2 + 0.6 * pulse(rel, 15.6, 16.2, 20, 22) }),
  });
  const h = L.height;
  L.add(createTrees({ count: 120, place: placers.disc(0, 0, 260, (x, z) => Math.hypot(x, z) > 70), height: h, kind: "palm", size: [3.5, 6] }).group);
  const town = city({ count: 160, radius: R - 4, height: h, style: "mud", seed: 61 });
  L.add(town);
  const pts = Array.from({ length: 28 }, (_, i) => [Math.cos((i / 28) * 6.283) * R, Math.sin((i / 28) * 6.283) * R]);
  const walls = wall({ points: pts, height: h, h: 10, thickness: 3, towerEvery: 4, material: "mud" });
  L.add(walls);
  // the procession: priests with the ark and trumpets, armed men before and behind
  const marchers = crowd({ count: 260, place: (r) => { const a = r() * 6.283; const d = R + 10 + r() * 6; return [Math.cos(a) * d, Math.sin(a) * d]; }, height: h, seed: 63 });
  L.add(marchers.group);
  const dust = weather("dust", { count: 9000, box: [120, 60, 120] });
  L.add(dust.points);
  const collapse = smoke({ rise: 70, spread: 60, color: [0.62, 0.52, 0.4], opacity: 0.55, size: 160, count: 1600, seed: 9 });
  collapse.position.set(0, h(0, 0), 0);
  L.add(collapse);
  const cam = new THREE.Vector3();
  L.onUpdate(({ rel, time, pixelRatio, camera, reducedMotion }) => {
    // circle with the procession
    const a = laps(rel) * Math.PI * 2;
    const r = lerp(110, 80, sramp(rel, 8, 15));
    cam.set(Math.cos(a) * r, lerp(26, 18, sramp(rel, 8, 15)), Math.sin(a) * r);
    if (rel > 15.6) cam.set(Math.cos(a) * 90, 22, Math.sin(a) * 90);
    camera.position.copy(cam);
    const shake = reducedMotion ? 0 : pulse(rel, 15.6, 16, 17.5, 19) * 0.9;
    camera.position.x += Math.sin(time * 37) * shake;
    camera.position.y += Math.sin(time * 41) * shake;
    camera.lookAt(0, 8, 0);
    marchers.group.rotation.y = -a + Math.PI;
    // the wall fell down flat
    const fall = sramp(rel, 15.7, 17.2);
    walls.scale.y = Math.max(0.03, 1 - fall);
    walls.position.y = -fall * 1.5;
    collapse.material.uniforms.uAmount.value = pulse(rel, 15.6, 16.2, 21, 22);
    collapse.material.uniforms.uTime.value = time;
    dust.update({ time, pixelRatio, amount: pulse(rel, 15.8, 17, 21.5, 22), center: camera.position, wind: [0.4, 0.2] });
    return { grade: { saturation: 1 - 0.5 * fall } };
  });
  return L;
}
