// Revelation 6:12–17, the sixth seal, through John's eyes over the earth: a land of mountains running down to
// a sea with an island in it. A great earthquake (the ground shakes, rocks fall from the mountain); the sun
// becomes black as sackcloth of hair, and the moon as blood; the stars fall to the earth as a fig tree casts
// her untimely figs, shaken of a mighty wind; the heaven departs as a scroll rolled together, from one side to
// the other, leaving darkness, and every mountain and island is moved out of its place. Kings, great men, rich
// men, chief captains, mighty men, bondmen and free run to the dens and rocks of the mountain and crouch there,
// faces turned away from the light that comes on them: "Fall on us, and hide us". Then stillness: "who shall
// be able to stand?"

import * as THREE from "three";

import { pulse, sramp } from "../../kit/common.js";
import { armour, crowd, figure, personMaterial } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { composeHeight, createTerrain, heights } from "../../kit/terrain.js";
import { scatterRocks } from "../../kit/vegetation.js";
import { rng } from "../../engine/noise.js";
import { scaled } from "../../kit/budget.js";
import { blackSun, bloodMoon, fallingStars, heavensScroll } from "../kit/cosmic.js";
import { EYE, johnEyes } from "../kit/eyes.js";

const height = composeHeight([
  heights.rolling(5, 0.01, 61),
  heights.mountain(-70, -150, 110, 75, 13, 1.25), // the mountain with the dens at its foot
  heights.mountain(70, -240, 120, 60, 29),
  heights.mountain(0, 95, 55, 16, 7, 1), // the height John stands on
  (x) => -Math.max(0, x - 110) * 0.12, // the land falls away to the sea on the right
], 4);
const MOUNT = [-70, -150];
const J = [0, 70];

/** A point on the sky at bearing phi (radians right of -z) and elevation el, d from the eye. */
const onSky = (eye, phi, el, d) => new THREE.Vector3(eye.x + Math.sin(phi) * Math.cos(el) * d, eye.y + Math.sin(el) * d, eye.z - Math.cos(phi) * Math.cos(el) * d);

export function create(ctx) {
  const low = ctx.quality === "low";
  const G = height(...J);
  const eye = new THREE.Vector3(J[0], G + EYE, J[1]);
  const E = eye.toArray();
  const SUN = { phi: -0.45, el: 0.38 };
  const MOON = { phi: 0.55, el: 0.3 };
  const sunAt = onSky(eye, SUN.phi, SUN.el, 640);
  const moonAt = onSky(eye, MOON.phi, MOON.el, 640);
  const ISLAND = new THREE.Vector3(260, 0, -160);
  const PEAK = new THREE.Vector3(-260, 0, -280);

  const keys = [
    [0, E, [0, G + 2, -80], 55],
    [2, E, [-60, 30, -115], 50],
    [6, E, [-55, 25, -110], 50],
    [7.5, E, sunAt.toArray(), 36],
    [9.5, E, sunAt.toArray(), 30],
    [11, E, moonAt.toArray(), 34],
    [12.5, E, [0, G + 300, -560], 64],
    [16, E, [60, G + 280, -560], 64],
    [17, E, [360, G + 200, -420], 72],
    [18.5, E, ISLAND.toArray(), 62],
    [20, E, [PEAK.x, 40, PEAK.z], 62],
    [21.5, E, [-120, G + 120, -500], 70],
    [23, E, [-24, 8, -20], 46],
    [27.5, E, [-38, 14, -62], 40],
    [29, E, [-42, 16, -78], 32],
    [34.5, E, [-44, 16, -80], 30],
    [37.5, E, [0, G + 30, -300], 58],
    [44, E, [0, G + 50, -300], 60],
  ];
  const L = createLandscape(ctx, {
    terrain: { height, palette: "ashen", size: 900, highFrom: 10, highSpan: 40 },
    water: { size: 3000, wave: 0.5, chop: 1, deep: [0.01, 0.02, 0.03], level: 0 },
    stars: false,
    storm: false,
    keepClear: [[J[0], J[1], 10]],
    rocks: 90,
    camera: keys,
    sky: (rel) => [[1 - sramp(rel, 6.5, 10.5), "ash"], [sramp(rel, 6.5, 10.5), "night"]],
    wind: (rel) => 0.2 + 0.8 * pulse(rel, 11.5, 12.5, 15.5, 17.5),
    grade: (rel) => ({ bloom: 0.5, threshold: 0.8, exposure: 1.1, saturation: 0.85 - 0.25 * sramp(rel, 21, 23), tint: [1 + 0.12 * pulse(rel, 8, 10, 16.5, 20), 1, 1] }),
    audio: (rel) => {
      const quake = pulse(rel, 1.5, 2, 6, 8) + 0.7 * pulse(rel, 16.5, 17.2, 20.5, 22);
      const still = sramp(rel, 35.5, 38);
      return { drone: 0.3 - 0.1 * still, thunder: Math.min(1, quake), wind: (0.15 + 0.85 * pulse(rel, 11.5, 12.5, 15.5, 17.5)) * (1 - 0.8 * still), water: 0.2 * (1 - still) };
    },
  });
  const { scene } = L;

  // darkness: what is left where the heaven was
  const voidDome = new THREE.Mesh(new THREE.SphereGeometry(1300, 32, 16), new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.BackSide, fog: false }));
  voidDome.position.copy(eye);
  scene.add(voidDome);
  // the heaven, as a scroll spread out over the land, and the sun and moon and stars set on it
  const heaven = heavensScroll({ radius: 700, arc: Math.PI * 1.15 });
  heaven.mesh.position.copy(eye);
  scene.add(heaven.mesh);
  const sun = blackSun(26);
  sun.group.position.copy(sunAt);
  sun.group.lookAt(eye);
  const moon = bloodMoon(16);
  moon.group.position.copy(moonAt);
  moon.group.lookAt(eye);
  scene.add(sun.group, moon.group);
  const moonLight = new THREE.HemisphereLight(0xff3020, 0x100404, 0);
  scene.add(moonLight);

  // the stars of heaven, thrown to the earth
  const random = rng(66);
  const n = scaled(1200, 300);
  const starts = [];
  const lands = [];
  for (let i = 0; i < n; i++) {
    const phi = (random() - 0.5) * 2.8;
    starts.push(...onSky(eye, phi, 0.12 + random() * 0.8, 640).toArray());
    const d = 120 + random() * 320;
    const x = eye.x + Math.sin(phi + (random() - 0.5) * 0.2) * d;
    const z = eye.z - Math.cos(phi) * d;
    lands.push(x, Math.max(0, height(x, z)) + 0.6, z);
  }
  const stars = fallingStars({ starts, lands, wind: [90, -10, 20] });
  scene.add(stars.group);

  // every mountain and island moved out of their places: an island in the sea, a far peak
  const island = createTerrain({ size: 170, segments: low ? 40 : 60, height: (x, z) => heights.mountain(0, 0, 60, 30, 41)(x, z) - 4, palette: "ashen", quality: ctx.quality });
  island.mesh.position.copy(ISLAND);
  const peak = createTerrain({ size: 260, segments: low ? 40 : 70, height: (x, z) => heights.mountain(0, 0, 100, 85, 43, 1.3)(x, z) - 2, palette: "ashen", quality: ctx.quality });
  peak.mesh.position.copy(PEAK);
  scene.add(island.mesh, peak.mesh);

  // the dens and the rocks at the foot of the mountain
  const dens = [];
  const toJohn = Math.atan2(J[1] - MOUNT[1], J[0] - MOUNT[0]);
  const black = new THREE.MeshBasicMaterial({ color: 0x030202 });
  for (let i = 0; i < 6; i++) {
    const a = toJohn + (i - 2.5) * 0.16;
    const x = MOUNT[0] + Math.cos(a) * 98;
    const z = MOUNT[1] + Math.sin(a) * 98;
    const mouth = new THREE.Mesh(new THREE.CircleGeometry(3.5 + (i % 3), 20, 0, Math.PI), black);
    mouth.position.set(x, height(x, z) - 0.4, z);
    mouth.lookAt(x + Math.cos(a), mouth.position.y, z + Math.sin(a));
    scene.add(mouth);
    dens.push(new THREE.Vector3(x + Math.cos(a) * 7, 0, z + Math.sin(a) * 7));
  }
  scene.add(scatterRocks({ count: low ? 30 : 60, size: [3, 9], height, random: rng(5), place: (r) => {
    const d = dens[Math.floor(r() * dens.length)];
    return [d.x + (r() - 0.5) * 26, d.z + (r() - 0.5) * 14];
  } }));
  // rocks loosed by the earthquake, tumbling down the mountain
  const falling = Array.from({ length: low ? 5 : 9 }, (_, i) => {
    const a = toJohn + (random() - 0.5) * 1.1;
    const r0 = 40 + random() * 20;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5 + random() * 2, 0), new THREE.MeshStandardMaterial({ color: 0x3a3430, roughness: 1, flatShading: true }));
    scene.add(rock);
    return { rock, a, r0, r1: 105 + random() * 15, t0: 1.8 + i * 0.4 + random() * 0.6, spin: random() * 3 };
  });

  // the kings of the earth, the great men, the rich men, the chief captains, the mighty men, every bondman,
  // and every free man: first running to the rocks, then crouched there, faces to the mountain
  const den = dens[2];
  const start = new THREE.Vector3(-8, 0, -16);
  const run = new THREE.Vector3().subVectors(den, start);
  const PEOPLE = [[0x4a1e6a, 10], [0x7a1e1e, 16], [0x9a7a2a, 16], [0x7d7262, 50], [null, 50]];
  const runners = new THREE.Group();
  const crouched = new THREE.Group();
  PEOPLE.forEach(([robe, count], k) => {
    const near = (cx, cz, spread) => (r) => [cx + (r() - 0.5) * spread, cz + (r() - 0.5) * spread * 0.6];
    runners.add(crowd({ count, seed: 30 + k, place: near(start.x + (k - 2) * 7, start.z + k * 2, 18), height, material: personMaterial({ robe, walk: 1 }), face: [den.x, den.z] }).group);
    const at = dens[k % dens.length];
    crouched.add(crowd({ count, seed: 50 + k, place: near(at.x, at.z, 16), height, material: personMaterial({ robe }), face: [MOUNT[0], MOUNT[1]], bow: 0.6, kneel: 0.55 }).group);
  });
  // the chief captains and the mighty men, in their war-gear
  const captains = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.add(figure(1.8, { robe: 0x5a2a1a, walk: 1 }), armour(1.8, { spear: i % 2 === 0 }));
    const x0 = start.x + (random() - 0.5) * 20;
    const z0 = start.z + (random() - 0.5) * 10;
    g.userData.home = new THREE.Vector3(x0, 0, z0);
    g.userData.hide = dens[i % dens.length].clone().add(new THREE.Vector3((random() - 0.5) * 8, 0, (random() - 0.5) * 4));
    scene.add(g);
    captains.push(g);
  }
  scene.add(runners, crouched);
  // the light of the face of him that sitteth on the throne, which they hide from
  const face = new THREE.DirectionalLight(0xfff4e0, 0);
  face.position.set(eye.x + 40, eye.y + 300, eye.z + 200);
  face.target.position.set(den.x, 0, den.z);
  scene.add(face, face.target);

  const eyes = johnEyes(keys);
  const tmp = new THREE.Vector3();
  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the great earthquake, and the earth shaking again as the mountains are moved
    const quake = reducedMotion ? 0 : pulse(rel, 1.5, 2, 6, 8) + 0.6 * pulse(rel, 16.5, 17.5, 20.5, 22);
    if (quake > 0) {
      camera.position.x += Math.sin(time * 37) * 0.08 * quake;
      camera.position.y += Math.sin(time * 41 + 1) * 0.06 * quake;
      camera.rotateZ(Math.sin(time * 23) * 0.012 * quake);
      camera.rotateX(Math.sin(time * 29) * 0.01 * quake);
    }
    for (const f of falling) {
      const k = THREE.MathUtils.clamp((rel - f.t0) / 3, 0, 1);
      const r = THREE.MathUtils.lerp(f.r0, f.r1, k * k);
      const x = MOUNT[0] + Math.cos(f.a) * r;
      const z = MOUNT[1] + Math.sin(f.a) * r;
      f.rock.position.set(x, height(x, z) + 1.5 + Math.abs(Math.sin(k * 14)) * 3 * (1 - k), z);
      f.rock.rotation.set(rel * f.spin * 4, rel * 2, 0);
    }
    // the sun black as sackcloth of hair, the moon as blood
    const dark = sramp(rel, 6.5, 9.5);
    const blood = sramp(rel, 8.5, 11);
    sun.set(dark);
    moon.set(blood);
    // the stars fall; the heaven departs as a scroll, and what was set on it goes with it
    const fell = sramp(rel, 11.5, 16.5);
    stars.update(fell, time);
    const roll = sramp(rel, 16.5, 21.5);
    heaven.set(roll, { day: 1 - sramp(rel, 6.5, 10), stars: (1 - 0.7 * fell) * sramp(rel, 7, 10) });
    sun.group.visible = heaven.unrolled(SUN.phi);
    moon.group.visible = heaven.unrolled(MOON.phi);
    stars.group.visible = rel < 24;
    moonLight.intensity = blood * (moon.group.visible ? 0.5 : 0);
    // every mountain and island moved out of their places
    const moved = sramp(rel, 17, 21.5);
    island.mesh.position.set(ISLAND.x + 70 * moved, ISLAND.y - 8 * moved, ISLAND.z + 30 * moved);
    island.mesh.rotation.z = -0.12 * moved;
    peak.mesh.position.set(PEAK.x - 90 * moved, PEAK.y - 30 * moved, PEAK.z - 20 * moved);
    peak.mesh.rotation.x = 0.1 * moved;
    // they run to the dens, and hide
    const go = sramp(rel, 21.5, 28.5);
    runners.visible = rel > 21 && rel < 28.6;
    runners.position.set(run.x * go, height(start.x + run.x * go, start.z + run.z * go) - height(start.x, start.z), run.z * go);
    crouched.visible = rel >= 28.6;
    for (const c of captains) {
      c.visible = rel > 21;
      tmp.lerpVectors(c.userData.home, c.userData.hide, go);
      c.position.set(tmp.x, height(tmp.x, tmp.z), tmp.z);
      c.lookAt(rel < 28.6 ? den.x : MOUNT[0], c.position.y, rel < 28.6 ? den.z : MOUNT[1]);
      c.scale.y = rel < 28.6 ? 1 : 0.6;
    }
    face.intensity = 2.2 * sramp(rel, 28.5, 32) * (1 - 0.5 * sramp(rel, 38, 44));
  });
  return L;
}
