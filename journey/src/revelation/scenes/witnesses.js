// Revelation 11:1–14, through John's eyes. A reed like unto a rod is put in his hands, and the angel: "Rise, and
// measure the temple of God, and the altar, and them that worship therein"; marks of light step along the wall,
// round the altar, over the worshippers. The court without is left out: the Gentiles tread it under foot, the
// days and nights of forty and two months running over it. In the street of the great city, the two witnesses
// in sackcloth, the two olive trees and the two candlesticks behind them. Fire out of their mouth drives back
// those who come to hurt them; heaven is shut, a pool turns to blood, plagues fall. The beast out of the
// bottomless pit rises, a shape in shadow with eyes of fire, and they fall. They lie in the street three days
// and a half while the peoples look on and make merry and send gifts; the Spirit of life enters them, they
// stand, and fear falls on all who see. "Come up hither": they go up in a cloud. The same hour a great
// earthquake: the tenth part of the city falls in dust, and the remnant give glory to the God of heaven.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../../kit/common.js";
import { flameCurtain, pillar, setFx, smoke, weather } from "../../kit/effects.js";
import { crowd, personMaterial } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { MATERIALS, altar, city, solomonTemple, wall } from "../../kit/structures.js";
import { composeHeight, heights } from "../../kit/terrain.js";
import { createTrees } from "../../kit/vegetation.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { hands } from "../kit/hands.js";
import { candlestick } from "./sonofman.js";

const P = [205, 0]; // the street of the great city, where the witnesses stand
const ground = composeHeight([heights.rolling(2.5, 0.012, 111), heights.flatten(110, 0, 210, 320, 0)], 0);

// the light over the scene, in the order of the text; day and night run fast over the forty and two months
// (6.5–11) and the three days and a half (40.5–46)
const SKY = [[0, "morning"], [24.5, "morning"], [25.5, "desert"], [30, "desert"], [31.5, "ash"], [35, "ash"], [36.5, "dusk"], [40, "dusk"], [46.5, "night"], [50.5, "night"], [52.5, "dawn"], [55, "sacred"], [60.5, "sacred"], [61.5, "ash"], [66, "ash"], [67.5, "storm"]];
function sky(rel) {
  let i = SKY.findIndex(([at]) => at > rel);
  if (i < 0) return SKY.at(-1)[1];
  if (i === 0) return SKY[0][1];
  const [a, na] = SKY[i - 1];
  const [b, nb] = SKY[i];
  const k = sramp(rel, a, b);
  const spec = [[1 - k, na], [k, nb]];
  const days = (from, to, n) => (rel > from && rel < to ? (0.5 - 0.5 * Math.cos(((rel - from) / (to - from)) * n * Math.PI * 2)) * pulse(rel, from, from + 0.4, to - 0.4, to) : 0);
  const night = days(6.8, 11, 6) + days(40.5, 46, 3.5);
  return night > 0.001 ? [...spec.map(([w, n]) => [w * (1 - night), n]), [night, "night"]] : spec;
}

/** A plane of dry cracked earth (heaven shut, 11:6), drawn once on a canvas. */
function cracks() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  let s = 17;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.strokeStyle = "rgba(40,26,14,0.9)";
  for (let i = 0; i < 90; i++) {
    let x = r() * 512;
    let y = r() * 512;
    g.lineWidth = 1 + r() * 2.5;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) g.lineTo((x += (r() - 0.5) * 70), (y += (r() - 0.5) * 70));
    g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 3);
  return new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false }));
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const L = createLandscape(ctx, {
    terrain: { height: ground, palette: "judea", size: 900, center: [110, 0] },
    keepClear: [[10, 0, 70], [P[0], P[1], 40]],
    rocks: 60,
    sky,
    camera: [[0, [60, EYE, 10], [0, 6, 0], 50], [72, [60, EYE, 10], [0, 6, 0], 50]],
    audio: () => ({}),
  });
  const { scene, camera } = L;
  scene.add(camera);
  const H = L.height;
  const at = (x, z, dy = 0) => [x, H(x, z) + dy, z];

  // ---- the temple of God, the altar, and them that worship therein (11:1); the court without (11:2)
  const temple = solomonTemple();
  temple.position.set(0, H(0, 0), 0);
  L.add(temple);
  const altarStone = altar({ size: 3, material: "limestone" });
  altarStone.position.set(...at(32, 0));
  L.add(altarStone);
  L.add(wall({ points: [[-25, -24], [66, -24], [66, 24], [-25, 24]], height: H, h: 3, thickness: 1.2, material: "limestone" }));
  L.add(wall({ points: [[-50, -60], [95, -60], [95, 60], [-50, 60]], height: H, h: 4, thickness: 1.5, material: "limestone" }));
  const worshippers = crowd({ count: 36, place: (r) => [38 + r() * 10, -16 + r() * 22], height: H, face: [0, 0], bow: 0.45, seed: 4 });
  L.add(worshippers.group);
  const gentiles = crowd({ count: low ? 160 : 320, place: (r) => {
    const x = -45 + r() * 135;
    const z = -55 + r() * 110;
    return x > -27 && x < 68 && Math.abs(z) < 26 ? null : [x, z];
  }, height: H, walk: 1, seed: 9 });
  L.add(gentiles.group);
  // the measure, stepping along the wall of the house, round the altar, over the worshippers
  const marks = Array.from({ length: 13 }, (_, i) => {
    const m = glowSprite(0xfff0c8, 0.9, 0);
    m.position.set(-15 + i * 2.5, H(0, 0) + 1.2, 6.2);
    L.add(m);
    return m;
  });
  const altarRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.06, 6, 48), new THREE.MeshBasicMaterial({ color: 0xfff0c8, transparent: true, opacity: 0 }));
  altarRing.rotation.x = Math.PI / 2;
  altarRing.position.set(...at(32, 0, 0.3));
  L.add(altarRing);
  const overWorshippers = glowSprite(0xfff0c8, 14, 0);
  overWorshippers.position.set(...at(43, -5, 3));
  L.add(overWorshippers);
  // the angel who gave the reed (11:1)
  const angel = cast("angel", 3.2);
  angel.position.set(...at(50, -7));
  angel.lookAt(60, angel.position.y, 10);
  L.add(angel);
  const angelFace = glowSprite(0xfff4e0, 0.9, 0.8);
  angelFace.position.set(50, angel.position.y + 2.95, -6.8);
  L.add(angelFace);
  // the reed like unto a rod, in John's hands
  const john = hands(camera);
  const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x8a7448, roughness: 0.9 }));
  reed.rotation.x = Math.PI / 2 - 0.25;
  reed.position.set(0.16, 0.03, -0.75);
  john.group.add(reed);

  // ---- the great city, and its street (11:8)
  const cityAt = (cx, cz, opts) => {
    const c = city({ height: (x, z) => H(x + cx, z + cz), style: "mud", ...opts });
    c.position.set(cx, 0, cz);
    L.add(c);
    return c;
  };
  cityAt(285, 0, { count: 120, radius: 65, seed: 11 });
  cityAt(205, -62, { count: 36, radius: 32, seed: 12 });
  const tenth = cityAt(290, 95, { count: 17, radius: 22, seed: 13 }); // the tenth part, which falls (11:13)
  const dust = smoke({ count: low ? 400 : 900, rise: 40, spread: 22, color: [0.62, 0.55, 0.45], opacity: 0.5, size: 26, seed: 6 });
  dust.position.set(290, 0, 95);
  L.add(dust);

  // ---- the two witnesses, the two olive trees and the two candlesticks before the God of the earth (11:3–4)
  const witnesses = [["witness", -2.2], ["witnessB", 2.2]].map(([key, dz]) => {
    const pivot = new THREE.Group(); // they fall, lie, and stand again about their feet
    pivot.position.set(...at(P[0], P[1] + dz));
    const body = cast(key, 1.75);
    body.rotation.y = -Math.PI / 2; // toward John (-x)
    pivot.add(body);
    L.add(pivot);
    return { pivot, body };
  });
  let olive = 0;
  const olives = createTrees({ count: 2, place: () => [P[0] + 9, P[1] + (olive++ ? 6 : -6)], height: H, kind: "olive", size: [5, 5.5] });
  L.add(olives.group);
  const lamps = [-4.2, 4.2].map((dz, i) => {
    const c = candlestick(i * 5);
    c.group.position.set(...at(P[0] + 5, P[1] + dz));
    c.group.scale.setScalar(1.3);
    L.add(c.group);
    return c;
  });
  const lampGlow = glowSprite(0xffd890, 9, 0.35);
  lampGlow.position.set(...at(P[0] + 6, P[1], 2.5));
  L.add(lampGlow);
  // fire out of their mouth, toward any that would hurt them (11:5)
  const fires = witnesses.map(({ pivot }) => {
    const holder = new THREE.Group();
    holder.position.set(pivot.position.x, pivot.position.y + 1.6, pivot.position.z);
    holder.rotation.x = Math.PI / 2; // the flame's height runs along +z, its face toward John
    const f = flameCurtain({ width: 2.2, height: 30, gain: 0.9, seed: pivot.position.z });
    f.rotation.y = Math.PI / 2;
    holder.add(f);
    L.add(holder);
    return f;
  });
  const enemies = crowd({ count: 40, place: (r) => [P[0] - 9 + r() * 18, 30 + r() * 12], height: H, face: P, material: personMaterial({ robe: 0x3c3630, walk: 1 }), seed: 21 });
  L.add(enemies.group);
  const scorch = flameCurtain({ width: 22, height: 5, gain: 0.6, seed: 4 });
  scorch.position.set(P[0], H(P[0], 30) + 2.5, 30);
  L.add(scorch);
  // heaven shut, the waters turned to blood, the plagues (11:6)
  const dry = cracks();
  dry.position.set(P[0] - 8, H(P[0], 0) + 0.06, 0);
  L.add(dry);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(6, 40).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x2c4c5c, roughness: 0.08, metalness: 0.4 }));
  pool.position.set(...at(188, -14, 0.12));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(6.1, 0.35, 6, 40).rotateX(Math.PI / 2), MATERIALS.limestone());
  rim.position.copy(pool.position);
  L.add(pool);
  L.add(rim);
  const water = new THREE.Color(0x2c4c5c);
  const blood = new THREE.Color(0x4e0a08);
  const plague = weather("gnats", { count: low ? 1500 : 3500, box: [60, 18, 60], seed: 5 });
  const hail = weather("hail", { count: low ? 1500 : 3000, box: [60, 40, 60], seed: 7 });
  L.add(plague.points);
  L.add(hail.points);

  // ---- the beast that ascendeth out of the bottomless pit (11:7): kept in shadow, only its eyes burn
  const pit = new THREE.PointLight(0xff6a20, 0, 120, 1.4);
  pit.position.set(...at(250, -30, 2));
  L.add(pit);
  const pitSmoke = smoke({ count: low ? 300 : 700, rise: 60, spread: 10, color: [0.08, 0.07, 0.07], opacity: 0.7, size: 30, seed: 9 });
  pitSmoke.position.set(...at(250, -30));
  L.add(pitSmoke);
  const shadow = new THREE.MeshBasicMaterial({ color: 0x050405, fog: false });
  const beast = new THREE.Group();
  const part = (geo, x, y, z, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, shadow); m.position.set(x, y, z); m.scale.set(sx, sy, sz); beast.add(m); };
  const ball = new THREE.SphereGeometry(1, 16, 12);
  part(ball, 0, 14, 0, 9, 11, 7);
  part(ball, -6, 27, 0, 4, 6, 4);
  part(ball, -10, 33, 0, 4.5, 3.6, 3.6);
  for (const z of [-5, 5]) part(new THREE.ConeGeometry(2.2, 14, 8), 4, 5, z, 1, 1, 1);
  const beastEyes = [-1.4, 1.4].map((z) => {
    const e = glowSprite(0xff4a10, 2.2, 0);
    e.position.set(-13.5, 34, z);
    beast.add(e);
    return e;
  });
  beast.position.set(...at(252, -30));
  beast.rotation.y = 0.5;
  L.add(beast);

  // ---- the peoples who look on, make merry and send gifts (11:9–10); fear (11:11); the remnant (11:13)
  const ring = (r) => {
    const a = r() * Math.PI * 2;
    const d = 9 + r() * 15;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    return x < -6 && Math.abs(z) < 12 ? null : [x, z]; // keep the side toward John open
  };
  const onlookers = crowd({ count: low ? 140 : 260, place: ring, face: [0, 0], seed: 31 });
  onlookers.group.position.set(P[0], H(P[0], P[1]), P[1]);
  L.add(onlookers.group);
  const glory = crowd({ count: low ? 140 : 260, place: ring, face: [0, 0], bow: -0.3, seed: 31 });
  glory.group.position.copy(onlookers.group.position);
  L.add(glory.group);
  const lights = Array.from({ length: 30 }, (_, i) => {
    const [x, z] = onlookers.positions[(i * 7) % onlookers.positions.length];
    const s = glowSprite(0xffc070, 0.7, 0);
    s.position.set(P[0] + x, 2, P[1] + z);
    L.add(s);
    return s;
  });
  const gifts = Array.from({ length: 8 }, (_, i) => {
    const g = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.35), i % 2 ? MATERIALS.gold() : MATERIALS.cloth(0x8a3a2a));
    const n = onlookers.positions.length;
    g.userData = { a: onlookers.positions[(i * 11) % n], b: onlookers.positions[(i * 11 + 37) % n], phase: i / 8 };
    L.add(g);
    return g;
  });
  // the Spirit of life from God (11:11), and the cloud they go up in (11:12)
  const breath = pillar({ radius: 3, height: 140, color: [1, 0.95, 0.82], gain: 0.6 });
  breath.position.set(...at(P[0], P[1]));
  L.add(breath);
  const cloud = smoke({ count: 500, rise: 7, spread: 6, color: [1, 0.98, 0.94], opacity: 0.55, size: 22, seed: 12, lit: true });
  L.add(cloud);

  // John's eyes: the temple, the court without, the street, the pit, the bodies, the tenth part, heaven
  const W = at(P[0], P[1], 1.2);
  const E1 = [60, H(60, 10) + EYE, 10];
  const E2 = [191, H(191, 9) + EYE, 9];
  const eyes = johnEyes([
    [0, E1, [50, 3.2, -7], 46],
    [1.5, E1, [50, 3.0, -7], 42],
    [3, [40, EYE, 17], [0, 2.5, 6], 50],
    [5, [38, EYE, 16], [32, 1, 0], 50],
    [6.3, [50, EYE, 14], [43, 0.5, -5], 52],
    [8, [62, 5, 28], [75, 0, 52], 60],
    [10.8, [62, 5, 28], [60, 0, 55], 62],
    [12.3, [120, 34, 26], [P[0], 2, 0], 56],
    [14, E2, W, 40],
    [17, E2, [P[0] + 7, 3, 0], 46],
    [20.5, E2, [P[0], 1.5, 18], 54],
    [24.5, E2, [P[0], 1.5, 22], 54],
    [25.5, E2, [P[0] - 8, 0, 2], 56],
    [27, E2, [188, 0, -14], 50],
    [28.5, E2, [P[0], 6, 0], 60],
    [30.5, E2, [245, 18, -28], 62],
    [33, E2, [245, 26, -26], 64],
    [35, [199, EYE + 1.2, 5], [P[0], 0.3, 0], 40],
    [40.5, [199, EYE + 1.2, 5], [P[0], 0.3, 0], 42],
    [43, E2, [P[0] + 4, 1, 0], 62],
    [50.5, E2, [P[0] + 4, 1.5, 0], 62],
    [53, E2, W, 44],
    [56, E2, [P[0], 6, 0], 50],
    [60.5, E2, [P[0], 60, 0], 58],
    [62, E2, [290, 6, 95], 60],
    [65.5, E2, [270, 4, 60], 64],
    [67.5, E2, [P[0] + 40, 70, 0], 64],
    [72, E2, [P[0] + 40, 80, 0], 64],
  ]);

  const tmp = new THREE.Vector3();
  L.onUpdate(({ rel, time, reducedMotion, pixelRatio }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the earthquake (11:13)
    const quake = pulse(rel, 60.8, 61.3, 64, 65.5);
    if (!reducedMotion && quake > 0) camera.position.add(tmp.set(Math.sin(time * 41) * 0.12, Math.sin(time * 37) * 0.08, Math.cos(time * 33) * 0.1).multiplyScalar(quake));

    // the measuring (11:1)
    john.pose("reach", pulse(rel, 0.8, 2, 5.6, 6.6));
    angel.visible = rel < 11.5;
    angelFace.visible = angel.visible;
    marks.forEach((m, i) => { m.material.opacity = sramp(rel, 2.4 + i * 0.16, 2.6 + i * 0.16) * (1 - sramp(rel, 6, 7)); });
    altarRing.material.opacity = pulse(rel, 4.3, 4.8, 6, 7) * 0.9;
    overWorshippers.material.opacity = pulse(rel, 5.2, 5.8, 6.5, 7.5) * 0.25;
    // trodden under foot
    gentiles.group.position.x = Math.sin(rel * 1.3) * 1.5 * sramp(rel, 6.5, 7.5);

    // the witnesses, the olive trees and the candlesticks
    olives.update({ time, wind: 0.2 });
    for (const [i, c] of lamps.entries()) c.flame.material.uniforms.uTime.value = time + i;
    lampGlow.material.opacity = sramp(rel, 15.5, 17.5) * (1 - sramp(rel, 31, 33)) * 0.4 + pulse(rel, 51, 52.5, 58, 60) * 0.3;
    // fire out of their mouth (11:5): they turn to those who come, the fire goes out, they are driven back
    const turn = pulse(rel, 20.5, 21.3, 24, 25);
    const burn = pulse(rel, 21.8, 22.3, 23.8, 24.6);
    witnesses.forEach(({ body }) => { body.rotation.y = -Math.PI / 2 + turn * Math.PI / 2; });
    fires.forEach((f) => setFx(f, { time, amount: burn }));
    setFx(scorch, { time, amount: pulse(rel, 22.2, 22.6, 24, 25) });
    enemies.group.visible = rel > 20 && rel < 25.5;
    enemies.group.position.z = 12 * (1 - sramp(rel, 20.3, 21.8)) + 22 * sramp(rel, 22.4, 25);
    // heaven shut, the waters to blood, all plagues (11:6)
    dry.material.opacity = pulse(rel, 25, 26, 34, 36) * 0.85;
    pool.material.color.lerpColors(water, blood, sramp(rel, 26.8, 28));
    plague.update({ time, pixelRatio, amount: pulse(rel, 28.3, 28.8, 29.6, 30.4), center: tmp.set(P[0], 4, 0) });
    hail.update({ time, pixelRatio, amount: pulse(rel, 28.8, 29.2, 30, 30.6) + 0.9 * pulse(rel, 61, 62, 65, 66.5), center: tmp.set(P[0] + 20, 8, 10) });

    // the beast out of the pit makes war, overcomes them, kills them (11:7): its shadow passes, they fall
    const rise = sramp(rel, 30.5, 33.5) * (1 - sramp(rel, 35, 37));
    beast.visible = rise > 0.01;
    beast.position.y = H(252, -30) - 46 + rise * 46;
    beastEyes.forEach((e) => { e.material.opacity = rise; });
    pit.intensity = 3000 * pulse(rel, 30.2, 31, 35, 37);
    pitSmoke.material.uniforms.uTime.value = time;
    pitSmoke.material.uniforms.uAmount.value = pulse(rel, 30.4, 31.5, 36, 38);
    pitSmoke.visible = rel > 30 && rel < 38.5;
    // they lie in the street three days and a half, then stand upon their feet (11:11), then go up (11:12)
    const dead = sramp(rel, 33.6, 34.6) * (1 - sramp(rel, 52.5, 54));
    const up = sramp(rel, 57, 60.5);
    witnesses.forEach(({ pivot }, i) => {
      pivot.rotation.z = dead * (Math.PI / 2) * 0.97;
      pivot.position.y = H(P[0], P[1]) + up * 70 + (i ? 0.3 : 0) * up;
      pivot.visible = up < 0.98;
    });
    breath.material.uniforms.uTime.value = time;
    setFx(breath, { time, amount: pulse(rel, 50.8, 52, 54.5, 56) });
    cloud.position.set(P[0], H(P[0], P[1]) - 1 + up * 70, P[1]);
    cloud.material.uniforms.uTime.value = time;
    cloud.material.uniforms.uAmount.value = pulse(rel, 56, 57, 60.5, 62);
    cloud.visible = rel > 55.8 && rel < 62;

    // the peoples look on, rejoice and send gifts; fear falls on them; the remnant give glory
    onlookers.group.visible = rel > 39.8 && rel < 64;
    glory.group.visible = rel >= 64 && rel < 72;
    const fear = sramp(rel, 52.6, 54.5);
    onlookers.group.scale.set(1 + 0.35 * fear, 1, 1 + 0.35 * fear);
    lights.forEach((s, i) => { s.material.opacity = pulse(rel, 44 + (i % 5) * 0.3, 45.5, 51, 52.5) * (0.7 + 0.3 * Math.sin(time * 3 + i)); });
    for (const g of gifts) {
      const { a, b, phase } = g.userData;
      const k = (rel * 0.5 + phase) % 1;
      g.visible = rel > 46 && rel < 51;
      g.position.set(P[0] + a[0] + (b[0] - a[0]) * k, 1.4 + Math.sin(k * Math.PI) * 2.5, P[1] + a[1] + (b[1] - a[1]) * k);
    }
    // the tenth part of the city falls (11:13)
    const fall = sramp(rel, 61.6, 64.5);
    tenth.position.y = -14 * fall;
    tenth.rotation.z = 0.08 * fall;
    dust.material.uniforms.uTime.value = time;
    dust.material.uniforms.uAmount.value = pulse(rel, 61.4, 62.5, 67, 70);
    dust.visible = rel > 61 && rel < 70.5;

    return {
      grade: {
        bloom: 0.3 + 0.4 * pulse(rel, 50.8, 52, 60, 61.5), threshold: 0.9,
        saturation: 1 - 0.35 * pulse(rel, 25, 26, 30, 31) - 0.4 * pulse(rel, 31, 33, 36, 38),
        tint: [1 + 0.06 * pulse(rel, 25, 26, 30, 31), 1, 1 - 0.1 * pulse(rel, 25, 26, 30, 31)],
        exposure: 1 - 0.35 * pulse(rel, 32.5, 33.6, 35, 37),
      },
      audio: {
        drone: 0.3 + 0.2 * pulse(rel, 30.5, 32, 36, 38),
        wind: 0.2 + 0.4 * pulse(rel, 25, 26, 30, 31),
        fire: 0.8 * burn + 0.4 * pulse(rel, 30.5, 31.5, 35, 37),
        water: 0.3 * pulse(rel, 26.5, 27, 28.5, 29),
        shimmer: 0.5 * pulse(rel, 50.8, 52, 60, 61.5),
        trumpet: 0.8 * pulse(rel, 56, 56.6, 58.5, 59.5),
        thunder: Math.max(0.7 * pulse(rel, 28.8, 29.2, 30, 30.6), quake),
      },
    };
  });
  return L;
}
