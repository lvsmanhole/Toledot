// Revelation 8:7–13, through John's eyes, looking down on the earth: land with trees and grass, rivers and
// springs, a sea with ships, and the sky. Four angels sound in turn, high above. The first: hail and fire
// mingled with blood, cast on the earth; a third of the trees burn (every third tree) and all the green grass.
// The second: as it were a great mountain burning with fire, cast into the sea; a third of the sea (the band
// nearest) becomes blood, and a third of its fish die and a third of its ships are lost. The third: a great
// star, burning as a lamp, falls on a third of the rivers and on the springs; its name, Wormwood, is read; those
// waters turn bitter, and many men die by them (seen far off, falling still). The fourth: a third of the sun,
// of the moon and of the stars darkened, and the day and the night each lose a third of their light. Then an
// angel flying through the midst of heaven cries "Woe, woe, woe".

import * as THREE from "three";

import { glowSprite, pulse, sramp, textSprite } from "../../kit/common.js";
import { scaled } from "../../kit/budget.js";
import { flame, smoke, weather } from "../../kit/effects.js";
import { crowd } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { createTrees } from "../../kit/vegetation.js";
import { createStars } from "../../engine/stars.js";
import { fbm2, rng } from "../../engine/noise.js";
import { cast } from "../kit/cast.js";
import { johnEyes } from "../kit/eyes.js";

const E = [120, 170, 380]; // John's eyes, high over the coast
const COAST = 50; // land to the west (x < COAST), the sea to the east
const RIVERS = [-200, -20, 160]; // the z of each river; the last (nearest) is the third made bitter
const BAND = [133, 400]; // the third of the sea (in z) that becomes blood: the nearest band
const height = (x, z) => 6 + fbm2(x * 0.006, z * 0.006, 4, 7) * 16 - 26 * THREE.MathUtils.smoothstep(x, COAST - 50, COAST + 40);
const riverZ = (z0, x) => z0 + Math.sin(x * 0.012 + z0) * 22;

/** A river as a ribbon laid on the land from inland to the coast. */
function river(z0, mat) {
  const pts = [];
  for (let x = -620; x <= COAST + 20; x += 8) pts.push([x, riverZ(z0, x)]);
  const pos = [];
  const idx = [];
  pts.forEach(([x, z], i) => {
    const w = 3 + (i / pts.length) * 7;
    const y = Math.max(height(x, z), 0) + 0.35;
    pos.push(x, y, z - w, x, y, z + w);
    if (i) idx.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

/** A disc in the sky with a third of it (a sector) that darkens. */
function smitten(radius, color) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CircleGeometry(radius, 48), new THREE.MeshBasicMaterial({ color, fog: false })));
  const shade = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.02, 48, Math.PI / 2, (Math.PI * 2) / 3), new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0, fog: false }));
  shade.position.z = 0.5;
  g.add(shade);
  g.lookAt(...E);
  return { group: g, shade };
}

/** An angel with a trumpet, high in the sky. */
function trumpeter(x, y, z) {
  const g = new THREE.Group();
  g.add(cast("angel", 14));
  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.9, 9, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xd8a84a, metalness: 1, roughness: 0.3, side: THREE.DoubleSide }));
  horn.position.set(2.5, 11.5, 3.5);
  horn.rotation.x = -Math.PI / 2.4;
  g.add(horn);
  const glow = glowSprite(0xfff0d0, 26, 0);
  glow.position.y = 8;
  g.add(glow);
  g.scale.setScalar(2.2);
  g.position.set(x, y, z);
  g.lookAt(E[0], y, E[2]);
  g.visible = false;
  return { group: g, glow };
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1600, center: [-150, 0], wetLevel: -2 },
    water: { size: 3000, wave: 0.4, chop: 0.8, deep: [0.02, 0.06, 0.08], level: 0 },
    stars: false,
    rocks: 60,
    sky: (rel) => {
      const night = pulse(rel, 43, 45, 50, 52);
      const dim = pulse(rel, 1, 3, 11, 13) * 0.6;
      return [[Math.max(0, 1 - night - dim), "morning"], [dim, "storm"], [night, "night"]];
    },
    camera: [[0, E, [-160, 0, -20], 50], [1, E, [-160, 0, -20], 50]],
    keepAboveGround: false,
    grade: (rel) => {
      const third = 0.33 * pulse(rel, 39, 40.5, 49.5, 51); // the day shone not for a third part of it
      return { exposure: 1 - third, bloom: 0.35, threshold: 0.85, saturation: 1 - 0.2 * sramp(rel, 2, 8) };
    },
    audio: (rel) => {
      const blast = [1, 13.5, 25.5, 38.5].reduce((a, t0) => Math.max(a, pulse(rel, t0 - 0.5, t0, t0 + 2.5, t0 + 3.5)), 0);
      const woe = [57.2, 58.4, 59.6].reduce((a, t0) => Math.max(a, pulse(rel, t0, t0 + 0.1, t0 + 0.4, t0 + 0.9)), 0);
      return {
        drone: 0.35, wind: 0.3, water: 0.25, trumpet: Math.max(blast * 0.9, woe * 0.8, 0.7 * pulse(rel, 51.5, 52.5, 56.5, 57)),
        fire: 0.6 * pulse(rel, 2, 3.5, 11, 13) + 0.5 * pulse(rel, 14, 15, 18, 20),
        thunder: Math.max(woe, pulse(rel, 15.2, 15.4, 15.8, 16.6), pulse(rel, 27.4, 27.6, 28, 28.8)),
      };
    },
  });
  const h = L.height;
  const grassTint = new THREE.Color();
  const greenTint = new THREE.Color(0.95, 1.15, 0.85);
  const ashTint = new THREE.Color(0.32, 0.29, 0.27);

  // the trees: every third one burns (8:7)
  const treeCount = scaled(low ? 420 : 900, 150);
  const trees = [];
  const r = rng(31);
  for (let tries = 0; trees.length < treeCount && tries < treeCount * 20; tries++) {
    const x = -560 + r() * 600;
    const z = -420 + r() * 840;
    if (height(x, z) < 2 || RIVERS.some((z0) => Math.abs(z - riverZ(z0, x)) < 14)) continue;
    trees.push([x, height(x, z) + 12, z]);
  }
  const from = (list) => { let i = 0; return () => { const [x, , z] = list[i++ % list.length]; return [x, z]; }; };
  const spared = trees.filter((_, i) => i % 3);
  const doomed = trees.filter((_, i) => i % 3 === 0);
  const grove = createTrees({ count: spared.length, place: from(spared), height, kind: "fig", size: [7, 12] }); // the procedural kind: the scanned trees are capped far below this count
  const third = createTrees({ count: doomed.length, place: from(doomed), height, kind: "fig", size: [7, 12] }); // the procedural kind: the scanned trees are capped far below this count
  L.add(grove.group, (st) => grove.update({ time: st.time, wind: st.wind }));
  L.add(third.group, (st) => third.update({ time: st.time, wind: st.wind }));
  const leaves = [];
  third.group.traverse((o) => { if (o.isMesh && o.material.vertexColors && !leaves.includes(o.material)) leaves.push(o.material); });
  const green = new THREE.Color(0xffffff);
  const char = new THREE.Color(0x1a1512);
  const burning = doomed;
  const m = new THREE.Matrix4();
  const fires = burning.slice(0, low ? 10 : 24).map(([x, y, z], i) => {
    const f = flame({ width: 9, height: 16, gain: 0.9, seed: i });
    f.position.set(x, y - 8, z);
    L.add(f);
    return f;
  });
  const smokes = burning.slice(0, 5).map(([x, y, z], i) => {
    const s = smoke({ count: low ? 200 : 500, rise: 90, spread: 12, lean: [0.3, 0.1], color: [0.2, 0.18, 0.17], opacity: 0.4, size: 30, seed: i });
    s.position.set(x, y, z);
    L.add(s);
    return s;
  });
  // hail and fire mingled with blood
  const hail = weather("hail", { count: low ? 3000 : 8000, box: [500, 260, 500] });
  hail.material.uniforms.uColor.value.setRGB(0.95, 0.5, 0.45);
  hail.material.uniforms.uSize.value = 5;
  const fire = weather("embers", { count: low ? 1500 : 4000, box: [500, 260, 500], seed: 8 });
  fire.material.uniforms.uFall.value = 45;
  fire.material.uniforms.uSize.value = 9;
  L.add(hail.points);
  L.add(fire.points);

  // the sea: ships, fish, and the band that becomes blood (8:8–9)
  const blood = new THREE.Mesh(new THREE.PlaneGeometry(900, BAND[1] - BAND[0]).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x4a0606, transparent: true, opacity: 0, depthWrite: false }));
  blood.position.set(COAST + 40 + 450, 1.6, (BAND[0] + BAND[1]) / 2);
  blood.renderOrder = 2;
  L.add(blood);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a3626, roughness: 0.9 });
  const sailMat = new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 1, side: THREE.DoubleSide });
  const ships = [];
  for (const sx of [200, 330, 470]) for (const sz of [-230, 20, 270]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.BoxGeometry(18, 3, 5).translate(0, 1, 0), wood));
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 14).translate(0, 8, 0), wood));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(9, 9).translate(0, 9, 0).rotateY(Math.PI / 2), sailMat));
    g.position.set(sx, 0, sz);
    g.rotation.y = 0.4 + sz * 0.002;
    const lost = sz > BAND[0];
    const f = lost ? flame({ width: 10, height: 14, gain: 1, seed: sx }) : null;
    if (f) { f.position.y = 1; g.add(f); }
    L.add(g);
    ships.push({ g, lost, f });
  }
  const fishCount = 90;
  const fish = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6).scale(3, 0.8, 1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.3 }), fishCount);
  const fishAt = Array.from({ length: fishCount }, (_, i) => {
    const dead = i % 3 === 0;
    const x = 150 + r() * 400;
    const z = dead ? BAND[0] + 10 + r() * 200 : -350 + r() * 470;
    return { x, z, ph: r() * 6.28, dead };
  });
  for (let i = 0; i < fishCount; i++) fish.setColorAt(i, new THREE.Color(0x5a6a78));
  L.add(fish);
  // the burning mountain
  const mountGeo = new THREE.IcosahedronGeometry(40, 3);
  const p = mountGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    v.multiplyScalar(1 + fbm2(v.x * 0.05, v.z * 0.05 + v.y * 0.03, 3, 5) * 0.5);
    p.setXYZ(i, v.x, v.y * 1.3, v.z);
  }
  mountGeo.computeVertexNormals();
  const mountain = new THREE.Mesh(mountGeo, new THREE.MeshStandardMaterial({ color: 0x2a1a12, emissive: 0xff4a10, emissiveIntensity: 0.6, roughness: 1 }));
  const mountFire = flame({ width: 140, height: 160, gain: 1.2, seed: 9 });
  const mountGlow = glowSprite(0xff6a20, 260, 0);
  const SPLASH = new THREE.Vector3(380, 0, 270);
  L.add(mountain);
  L.add(mountFire);
  L.add(mountGlow);
  const steam = smoke({ count: low ? 300 : 800, rise: 200, spread: 60, color: [0.7, 0.66, 0.64], opacity: 0.45, size: 60, seed: 12 });
  steam.position.copy(SPLASH);
  L.add(steam);

  // the rivers and the springs; the star Wormwood (8:10–11)
  const riverMats = RIVERS.map(() => new THREE.MeshStandardMaterial({ color: 0x2a4c60, roughness: 0.15, metalness: 0.5, emissive: 0x000000 }));
  RIVERS.forEach((z0, i) => L.add(river(z0, riverMats[i])));
  const springMat = new THREE.MeshStandardMaterial({ color: 0x3a6a80, roughness: 0.1, metalness: 0.5, emissive: 0x0a2030 });
  for (const [x, z] of [[-300, 60], [-220, -110], [-130, 250], [-60, -300]]) {
    const pool = new THREE.Mesh(new THREE.CircleGeometry(8, 24).rotateX(-Math.PI / 2), springMat);
    pool.position.set(x, Math.max(h(x, z), 0) + 0.4, z);
    L.add(pool);
  }
  const FALL = new THREE.Vector3(-200, Math.max(height(-200, riverZ(160, -200)), 0), riverZ(160, -200));
  const star = glowSprite(0xffe8b0, 90, 0);
  const starCore = glowSprite(0xffffff, 30, 0);
  L.add(star);
  L.add(starCore);
  const name = textSprite("Wormwood", { size: 72, scale: 22, color: "#f2e2b0" });
  name.position.copy(FALL).add(new THREE.Vector3(0, 70, 0));
  name.material.opacity = 0;
  L.add(name);
  // men at the bitter river, far off, who fall still
  const bx = -90;
  const bank = (rr) => [bx + (rr() - 0.5) * 70, riverZ(160, bx) + 16 + rr() * 20];
  const men = crowd({ count: low ? 30 : 60, place: bank, height: (x, z) => h(x, z), seed: 5, face: [bx, riverZ(160, bx)] });
  const fallen = crowd({ count: low ? 30 : 60, place: bank, height: (x, z) => h(x, z), seed: 5, bow: 1.4, kneel: 0.45 });
  L.add(men.group);
  L.add(fallen.group);

  // the sun, the moon and the stars, each a third darkened (8:12)
  const sun = smitten(34, new THREE.Color(3, 2.5, 1.9));
  sun.group.position.set(-260, 420, -420);
  sun.group.lookAt(...E);
  const moon = smitten(26, new THREE.Color(0.95, 0.93, 0.85));
  moon.group.position.set(330, 380, -360);
  moon.group.lookAt(...E);
  L.add(sun.group);
  L.add(moon.group);
  const starsKept = createStars({ count: low ? 4000 : 10000, radius: 2400, seed: 81, size: 2.4 });
  const starsLost = createStars({ count: low ? 2000 : 5000, radius: 2400, seed: 82, size: 2.4 });
  L.add(starsKept);
  L.add(starsLost);

  // the four angels, and the angel flying through the midst of heaven crying woe (8:13)
  const ANGELS = [[-20, 215, 250], [230, 215, 250], [0, 225, 200], [150, 230, 200]];
  const angels = ANGELS.map((at) => trumpeter(...at));
  for (const a of angels) L.add(a.group);
  const woe = cast("angel", 40);
  woe.visible = false;
  const woeGlow = glowSprite(0xfff0d0, 40, 0);
  L.add(woe);
  L.add(woeGlow);

  const eyes = johnEyes([
    [0, E, [-20, 230, 250], 50],
    [3, E, [-160, 20, -20], 56],
    [11, E, [-200, 10, 40], 52],
    [12.5, E, [230, 230, 250], 46],
    [15, E, [SPLASH.x, 40, SPLASH.z], 44],
    [19, E, [360, 0, 230], 30],
    [23.5, E, [330, 0, 150], 34],
    [25, E, [0, 240, 200], 46],
    [27, E, [-200, 120, 160], 46],
    [30, E, [FALL.x, 30, FALL.z], 36],
    [33.5, E, [bx, 10, riverZ(160, bx) + 20], 20],
    [36.5, E, [bx, 5, riverZ(160, bx) + 20], 22],
    [38, E, [150, 245, 200], 46],
    [41, E, [-260, 420, -420], 40],
    [45, E, [40, 400, -400], 70],
    [48, E, [330, 380, -360], 40],
    [50.5, E, [0, 300, -200], 60],
    [57, E, [60, 260, 150], 62],
    [66, E, [240, 260, 170], 62],
  ]);

  const tmp = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const eul = new THREE.Euler();
  const one = new THREE.Vector3(1, 1, 1);
  const pale = new THREE.Color(0xc8c0b0);
  L.onUpdate(({ rel, time, pixelRatio, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    for (const s of [starsKept, starsLost]) {
      s.position.copy(camera.position);
      s.material.uniforms.uTime.value = time;
      s.material.uniforms.uPixelRatio.value = pixelRatio;
    }
    // each angel sounds in turn
    [[0, 12], [12.5, 24.5], [24.5, 37], [37.5, 50]].forEach(([a, b], i) => {
      const on = pulse(rel, a, a + 1, b - 1, b);
      angels[i].group.visible = on > 0.01;
      angels[i].glow.material.opacity = 0.5 * on;
      angels[i].group.position.y = ANGELS[i][1] + Math.sin(time * 0.7 + i) * 2;
    });

    // 1st: hail and fire on the earth; a third of the trees and all the grass burnt
    const storm = pulse(rel, 1.5, 3, 9.5, 11.5);
    const c = new THREE.Vector3(-180, 120, 0);
    hail.update({ time, pixelRatio, amount: storm, center: c, wind: [0.4, 0.1] });
    fire.update({ time, pixelRatio, amount: storm * 0.8, center: c, wind: [0.4, 0.1] });
    const burnt = sramp(rel, 4, 10);
    for (const mat of leaves) mat.color.copy(green).lerp(char, burnt);
    grassTint.copy(greenTint).lerp(ashTint, sramp(rel, 5, 11));
    L.terrain.mesh.material.color.copy(grassTint);
    const blaze = pulse(rel, 4, 6, 14, 20);
    fires.forEach((f, i) => { f.material.uniforms.uTime.value = time + i; f.material.uniforms.uAmount.value = blaze; f.visible = blaze > 0.01; });
    smokes.forEach((s) => { s.material.uniforms.uTime.value = time; s.material.uniforms.uPixelRatio.value = pixelRatio; s.material.uniforms.uAmount.value = sramp(rel, 5, 8); });

    // 2nd: the mountain burning with fire cast into the sea; a third of the sea blood
    const fall = sramp(rel, 13.5, 16);
    mountain.position.lerpVectors(tmp.set(SPLASH.x - 120, 520, SPLASH.z - 200), SPLASH, fall);
    mountain.position.y -= sramp(rel, 16, 19) * 60;
    mountain.rotation.set(time * 0.1, time * 0.07, 0);
    mountain.visible = rel > 13 && rel < 21;
    mountFire.position.copy(mountain.position).add(tmp.set(0, -40, 0));
    mountFire.material.uniforms.uTime.value = time;
    mountFire.material.uniforms.uAmount.value = pulse(rel, 13.5, 14.5, 16.5, 19);
    mountFire.visible = mountain.visible;
    mountGlow.position.copy(mountain.position);
    mountGlow.material.opacity = 0.6 * pulse(rel, 13.5, 14.5, 17, 20);
    steam.material.uniforms.uTime.value = time;
    steam.material.uniforms.uPixelRatio.value = pixelRatio;
    steam.material.uniforms.uAmount.value = pulse(rel, 16, 17, 22, 26);
    blood.material.opacity = 0.88 * sramp(rel, 16, 19);
    for (const s of ships) {
      const sink = s.lost ? sramp(rel, 19, 24) : 0;
      s.g.position.y = Math.sin(time * 0.8 + s.g.position.x) * 0.3 - sink * 9;
      s.g.rotation.z = sink * 0.5;
      if (s.f) { s.f.material.uniforms.uTime.value = time; s.f.material.uniforms.uAmount.value = pulse(rel, 17.5, 18.5, 22.5, 24); s.f.visible = rel > 17 && rel < 24.5; }
    }
    const died = sramp(rel, 19, 21);
    fishAt.forEach((f, i) => {
      if (f.dead && died > 0.5) {
        m.compose(tmp.set(f.x, 0.3, f.z), q.setFromEuler(eul.set(Math.PI, f.ph, 0)), one);
        fish.setColorAt(i, pale);
      } else {
        const leap = Math.sin(time * 1.3 + f.ph);
        m.compose(tmp.set(f.x + ((Math.cos(f.ph) * time * 2) % 40), leap * 4 - 1.5, f.z), q.setFromEuler(eul.set(0, f.ph, Math.cos(time * 1.3 + f.ph) * 0.8)), one);
      }
      fish.setMatrixAt(i, m);
    });
    fish.instanceMatrix.needsUpdate = true;
    if (fish.instanceColor) fish.instanceColor.needsUpdate = true;
    fish.visible = rel > 12 && rel < 38;

    // 3rd: the star Wormwood falls on a third of the rivers and on the springs
    const drop = sramp(rel, 26, 29.5);
    star.position.lerpVectors(tmp.set(FALL.x + 260, 700, FALL.z - 300), FALL, drop);
    starCore.position.copy(star.position);
    star.material.opacity = 0.9 * pulse(rel, 25.5, 26.5, 30, 33);
    starCore.material.opacity = star.material.opacity;
    name.material.opacity = pulse(rel, 29.5, 31, 35.5, 37);
    const bitter = sramp(rel, 29.5, 32);
    riverMats[2].color.setRGB(0.16 + 0.34 * bitter, 0.3 + 0.18 * bitter, 0.38 - 0.28 * bitter);
    riverMats[2].emissive.setRGB(0.12 * bitter, 0.12 * bitter, 0);
    springMat.color.setRGB(0.23 + 0.27 * bitter, 0.42 + 0.06 * bitter, 0.5 - 0.4 * bitter);
    const still = sramp(rel, 33, 35);
    men.group.visible = still < 0.5;
    fallen.group.visible = still >= 0.5 && rel < 38;

    // 4th: a third of the sun, the moon and the stars darkened
    const smite = sramp(rel, 39.5, 41.5);
    sun.shade.material.opacity = smite;
    moon.shade.material.opacity = smite;
    sun.group.visible = rel > 37.5 && rel < 52;
    moon.group.visible = rel > 43 && rel < 52;
    const night = pulse(rel, 43, 45, 50, 52);
    starsKept.material.uniforms.uOpacity.value = night;
    starsLost.material.uniforms.uOpacity.value = night * (1 - sramp(rel, 46, 47.5));
    starsKept.visible = starsLost.visible = night > 0.01;

    // the angel crying woe, flying through the midst of heaven
    const fly = sramp(rel, 51, 65.5);
    woe.visible = rel > 50.5;
    woe.position.set(-200 + fly * 480, 250 + Math.sin(time * 0.9) * 3, 140 + fly * 30);
    woe.rotation.set(0, Math.PI / 2, -0.25);
    woeGlow.position.copy(woe.position).add(tmp.set(0, 22, 0));
    woeGlow.material.opacity = woe.visible ? 0.55 + 0.35 * pulse(rel, 57, 57.3, 60, 60.6) : 0;
  });
  return L;
}
