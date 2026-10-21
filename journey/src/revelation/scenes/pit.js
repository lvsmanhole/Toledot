// Revelation 9:1–12, the fifth trumpet, through John's eyes on a green rise above a plain. A star falls from
// heaven to the earth and stands as a being of light, given the key of the bottomless pit. He opens the pit:
// smoke rises as from a great furnace, and the sun and the air are darkened. Out of the smoke come locusts,
// a roaring swarm. They do not touch the grass, the green things or the trees, nor the men with the seal of
// God in their foreheads (a mark of light): the others cower and kneel in the dark, seeking death and not
// finding it. One locust settles close by, and John's eyes go along it feature by feature (9:7–10): a horse's
// shape for battle, a crown as of gold, a man's face, a woman's hair, a lion's teeth, a breastplate of iron,
// the wings, the scorpion's tail and sting. Over them their king, the angel of the bottomless pit, Abaddon,
// Apollyon. "One woe is past."

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { glowSprite, pulse, sramp } from "../../kit/common.js";
import { scaled } from "../../kit/budget.js";
import { pillar, smoke, weather } from "../../kit/effects.js";
import { crowd } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { composeHeight, heights } from "../../kit/terrain.js";
import { createTrees } from "../../kit/vegetation.js";
import { rng } from "../../engine/noise.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";

const P = [0, -90]; // the pit
const J = [0, 60]; // where John stands
const S = [4, 47]; // where one locust settles, close by
const height = composeHeight([heights.rolling(5, 0.01, 91), heights.mountain(J[0], J[1] + 20, 60, 8, 4), heights.flatten(P[0], P[1], 14, 30, 1)], 1);

/** A far locust: a body, a head and two wings, merged into one small mesh for instancing. */
function locustShape() {
  const body = new THREE.SphereGeometry(1, 8, 6).scale(1.2, 0.45, 0.45);
  const head = new THREE.SphereGeometry(0.35, 6, 5).translate(1.2, 0.2, 0);
  const tail = new THREE.ConeGeometry(0.18, 1.2, 5).rotateZ(-2).translate(-1.4, 0.5, 0);
  const wings = new THREE.PlaneGeometry(1.6, 0.5).rotateX(Math.PI / 2).translate(0, 0.35, 0).scale(1, 1, 3);
  return mergeGeometries([body, head, tail, wings].map((g) => { g.deleteAttribute("uv"); return g.toNonIndexed(); }));
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const G = (x, z) => height(x, z);
  const Pv = new THREE.Vector3(P[0], G(...P), P[1]);
  const Sv = new THREE.Vector3(S[0], G(...S), S[1]);
  const E = [J[0], G(...J) + EYE, J[1]];
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1200 },
    keepClear: [[P[0], P[1], 40], [J[0], J[1], 16], [S[0], S[1], 8]],
    sky: (rel) => {
      const dark = sramp(rel, 8, 13);
      return [[1 - dark, "noon"], [dark * 0.6, "ash"], [dark * 0.4, "night"]];
    },
    camera: [[0, E, [Pv.x, 200, Pv.z], 50], [1, E, [Pv.x, 200, Pv.z], 50]],
    keepAboveGround: false,
    grade: (rel) => {
      const dark = sramp(rel, 8, 13) * (1 - 0.3 * sramp(rel, 55, 59));
      return { exposure: 1 - 0.45 * dark, saturation: 1 - 0.45 * dark, bloom: 0.3 + 0.3 * dark, threshold: 0.8, tint: [1 + 0.08 * dark, 1, 1 - 0.1 * dark] };
    },
    audio: (rel) => {
      const swarm = pulse(rel, 12, 14, 48, 52);
      return {
        trumpet: pulse(rel, 0, 0.5, 2, 3) * 0.9, drone: 0.3 + 0.3 * sramp(rel, 8, 12), wind: 0.25 + 0.4 * swarm,
        fire: 0.5 * pulse(rel, 7, 9, 50, 55), thunder: 0.45 * swarm * (0.7 + 0.3 * Math.sin(rel * 3)) + 0.6 * pulse(rel, 40.5, 41.5, 44, 45),
        birds: 0.3 * (1 - sramp(rel, 6, 9)),
      };
    },
  });
  const h = L.height;

  // the green that is not hurt: trees round the plain
  const trees = createTrees({ count: low ? 50 : 110, place: (r) => {
    const a = r() * 6.28;
    const d = 60 + r() * 200;
    const x = Pv.x + Math.cos(a) * d;
    const z = Pv.z + Math.sin(a) * d;
    return Math.hypot(x - J[0], z - J[1]) < 30 ? null : [x, z];
  }, height: h, kind: "broadleaf", random: rng(12), size: [5, 9] });
  L.add(trees.group, ({ time, wind }) => trees.update({ time, wind }));

  // the men: the sealed, with the seal of God in their foreheads, and the rest
  const sealedAt = (r) => [-46 + r() * 30, -10 + r() * 30];
  const restAt = (r) => [16 + r() * 34, -10 + r() * 30];
  const sealed = crowd({ count: low ? 24 : 40, place: sealedAt, height: h, seed: 4, face: [Pv.x, Pv.z] });
  const rest = crowd({ count: low ? 24 : 40, place: restAt, height: h, seed: 6, face: [Pv.x, Pv.z] });
  const cowering = crowd({ count: low ? 24 : 40, place: restAt, height: h, seed: 6, bow: 1.2, kneel: 0.5 });
  L.add(sealed.group);
  L.add(rest.group);
  L.add(cowering.group);
  const marks = sealed.positions.map(([x, z]) => {
    const s = glowSprite(0xfff2c0, 0.35, 0);
    s.position.set(x, h(x, z) + 1.62, z);
    L.add(s);
    return s;
  });

  // the star fallen from heaven, as a being of light, and the key of the pit
  const star = glowSprite(0xfff4dc, 30, 0);
  L.add(star);
  const being = pillar({ radius: 1.4, height: 7, color: [1, 0.95, 0.8], gain: 1.4 });
  being.position.copy(Pv).add(new THREE.Vector3(9, 0, 6));
  L.add(being);
  const key = cast("keys", 0.9);
  key.position.copy(being.position).add(new THREE.Vector3(1.4, 3, 1));
  L.add(key);
  const keyGlow = glowSprite(0xffe2a0, 2.5, 0);
  keyGlow.position.copy(key.position).add(new THREE.Vector3(0, 0.45, 0));
  L.add(keyGlow);

  // the pit: a cover of stone drawn aside, the glow of a furnace below, and the smoke
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(9, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x050302 }));
  mouth.position.copy(Pv).add(new THREE.Vector3(0, 0.15, 0));
  L.add(mouth);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(9, 7, 40, 40, 1, true).translate(0, -20, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.5, 0.12), side: THREE.BackSide }));
  shaft.position.copy(Pv);
  L.add(shaft);
  const cover = new THREE.Mesh(new THREE.CylinderGeometry(10, 10, 1.4, 40), new THREE.MeshStandardMaterial({ color: 0x5a5248, roughness: 1 }));
  L.add(cover);
  const furnace = glowSprite(0xff7a28, 40, 0);
  furnace.position.copy(Pv).add(new THREE.Vector3(0, 6, 0));
  L.add(furnace);
  const smokeCol = smoke({ count: low ? 900 : 2200, rise: 320, spread: 34, lean: [0.15, 0.25], color: [0.11, 0.09, 0.08], opacity: 0.7, size: 90, seed: 9, lit: true });
  smokeCol.position.copy(Pv);
  L.add(smokeCol);
  const pall = weather("ash", { count: low ? 2000 : 5000, box: [160, 60, 160], seed: 4 });
  pall.material.uniforms.uColor.value.setRGB(0.12, 0.1, 0.09);
  L.add(pall.points);

  // the swarm: the far locusts instanced, the near ones cast
  const swarmCount = scaled(low ? 260 : 600, 80);
  const swarm = new THREE.InstancedMesh(locustShape(), new THREE.MeshStandardMaterial({ color: 0x3a2e1e, roughness: 0.7, metalness: 0.4, side: THREE.DoubleSide }), swarmCount);
  swarm.frustumCulled = false;
  const r = rng(77);
  const flight = Array.from({ length: swarmCount }, () => ({ rad: 20 + r() * 150, y: 8 + r() * 70, ph: r() * 6.28, sp: 0.2 + r() * 0.3, k: 0.8 + r() * 0.8 }));
  L.add(swarm);
  const specks = weather("locusts", { count: low ? 4000 : 12000, box: [260, 90, 260] });
  L.add(specks.points);
  const near = [0, 1, 2].map(() => cast("locust", 2.4));
  for (const l of near) L.add(l);
  const close = cast("locust", 2.4); // the one that settles; its head is toward +x
  L.add(close);

  // their king, the angel of the bottomless pit
  const king = cast("abaddon", 40);
  king.position.copy(Pv).add(new THREE.Vector3(0, 10, -8));
  king.lookAt(E[0], king.position.y, E[2]);
  L.add(king);
  // the furnace below lights him from beneath, and the locust that settles is lit from John's side
  const pitLight = new THREE.PointLight(0xff7a30, 0, 160, 1);
  const nearLight = new THREE.PointLight(0xffd8b0, 0, 30, 1.2);
  L.add(pitLight);
  L.add(nearLight);
  const embers = [-0.3, 0.3].map(() => glowSprite(0xff5a18, 1.2, 0));
  for (const e of embers) L.add(e);

  const at = (dx, dy, dz) => [Sv.x + dx, Sv.y + dy, Sv.z + dz];
  const eyes = johnEyes([
    [0, E, [Pv.x + 60, 260, Pv.z - 60], 54],
    [3.5, E, [Pv.x + 9, Pv.y + 4, Pv.z + 6], 34],
    [6.5, E, [Pv.x + 4, Pv.y + 2, Pv.z], 38],
    [9.5, E, [Pv.x, Pv.y + 60, Pv.z], 56],
    [12, E, [Pv.x, Pv.y + 30, Pv.z], 60],
    [16, E, [Pv.x, 20, Pv.z + 60], 62],
    [18.5, E, [-31, h(-31, 5) + 2, 5], 34],
    [22, E, [33, h(33, 5) + 1, 5], 34],
    [27, E, [30, h(30, 5) + 0.5, 5], 40],
    [30.5, E, at(0, 1.5, 0), 50],
    [32, at(2.5, 1.9, 3.4), at(1.1, 1.8, 0), 40],
    [36.5, at(2.1, 1.65, 2.6), at(1.2, 1.65, 0), 34],
    [40.5, at(0.3, 1.8, 3.6), at(0.2, 1.4, 0), 46],
    [45.5, at(-1.5, 2.1, 3.3), at(-1.4, 2.1, 0), 40],
    [49, E, [Pv.x, Pv.y + 14, Pv.z], 46],
    [54.5, E, [Pv.x, Pv.y + 18, Pv.z], 40],
    [60, E, [Pv.x, Pv.y + 40, Pv.z], 56],
  ]);

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const sc = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  L.onUpdate(({ rel, time, pixelRatio, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the star falls, and stands as a being of light with the key
    const fall = sramp(rel, 0.5, 3.2);
    star.position.lerpVectors(tmp.set(Pv.x + 120, 500, Pv.z - 160), being.position, fall);
    star.position.y += 3 * fall;
    star.material.opacity = pulse(rel, 0.3, 1, 3, 4.5);
    being.material.uniforms.uTime.value = time;
    being.material.uniforms.uAmount.value = pulse(rel, 2.8, 3.8, 11, 13);
    key.visible = rel > 3.5 && rel < 9;
    keyGlow.material.opacity = key.visible ? 0.8 : 0;
    // he opens the pit; the smoke of a great furnace
    const open = sramp(rel, 6.8, 8.5);
    cover.position.copy(Pv).add(tmp.set(open * 22, 0.7 + Math.sin(open * Math.PI) * 2, open * 4));
    furnace.material.opacity = 0.9 * open * (0.8 + 0.2 * Math.sin(time * 3));
    smokeCol.material.uniforms.uTime.value = time;
    smokeCol.material.uniforms.uPixelRatio.value = pixelRatio;
    smokeCol.material.uniforms.uAmount.value = sramp(rel, 7.5, 11);
    pall.update({ time, pixelRatio, amount: 0.6 * sramp(rel, 10, 14), center: camera.position, wind: [0.3, 0.2] });

    // the swarm, out of the smoke and over the plain, passing the sealed by
    const out = sramp(rel, 12, 15) * (1 - sramp(rel, 52, 56));
    for (let i = 0; i < swarmCount; i++) {
      const f = flight[i];
      const a = f.ph + time * f.sp;
      const reach = f.rad * out;
      // they veer from the sealed (to the west, -x)
      const x = Pv.x + Math.cos(a) * reach;
      const z = Pv.z + Math.sin(a) * reach * 0.8 + out * 60;
      const y = Pv.y + f.y * out + 3 + Math.sin(time * 3 + f.ph) * 0.6;
      m.compose(tmp.set(x < -15 && z > -20 ? x + 30 : x, y, z), q.setFromEuler(eul.set(Math.sin(time * 40 + i) * 0.15, -a - Math.PI / 2, 0)), sc.setScalar(f.k * out + 0.001));
      swarm.setMatrixAt(i, m);
    }
    swarm.instanceMatrix.needsUpdate = true;
    swarm.visible = out > 0.01;
    specks.update({ time, pixelRatio, amount: 0.8 * out, center: tmp.set(Pv.x + 20, Pv.y + 30, Pv.z + 70), wind: [0.6, 0.3] });
    near.forEach((l, i) => {
      const a = time * 0.5 + i * 2.1;
      l.visible = rel > 13 && rel < 52;
      l.position.set(10 + Math.cos(a) * (22 + i * 6), h(10, 20) + 5 + i * 2 + Math.sin(time * 2 + i), 10 + Math.sin(a) * (16 + i * 4));
      l.rotation.y = -a;
    });
    // the one that settles close by, then rises
    const land = sramp(rel, 27, 30.5);
    const rise = sramp(rel, 49, 51);
    close.visible = rel > 26 && rel < 52;
    close.position.set(Sv.x - 40 * (1 - land), Sv.y + 25 * (1 - land) + 30 * rise, Sv.z - 30 * (1 - land) - 30 * rise);
    close.rotation.z = Math.sin(time * 30) * 0.004 * (1 - land);

    // the sealed passed over; the rest cower and kneel, seeking death
    for (const s of marks) s.material.opacity = sramp(rel, 16.5, 18) * (0.75 + 0.25 * Math.sin(time * 2));
    const cower = sramp(rel, 21, 22.5);
    rest.group.visible = cower < 0.5;
    cowering.group.visible = cower >= 0.5;

    // Abaddon over the swarm
    const crown = sramp(rel, 49, 51.5);
    king.visible = crown > 0.01;
    pitLight.position.copy(king.position).add(tmp.set(0, 6, 18));
    pitLight.intensity = crown * 1400;
    nearLight.position.copy(close.position).add(tmp.set(3, 4, 6));
    nearLight.intensity = close.visible ? 60 : 0;
    king.position.y = Pv.y + 10 + 6 * crown + Math.sin(time * 0.6) * 0.4;
    embers.forEach((e, i) => {
      e.position.copy(king.position).add(tmp.set(i ? 2.2 : -2.2, 35, 2));
      e.material.opacity = crown * (0.6 + 0.3 * Math.sin(time * 5 + i));
    });
  });
  return L;
}
