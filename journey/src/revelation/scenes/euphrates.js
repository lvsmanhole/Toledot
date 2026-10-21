// Revelation 9:13–21, the sixth trumpet, through John's eyes from a bluff over the great river Euphrates at
// dusk. The sixth angel sounds; a voice from the four horns of the golden altar before God; "Loose the four
// angels which are bound in the great river Euphrates". Four angels stand bound in the river with chains of
// light; the chains break, and they are loosed, prepared for an hour, a day, a month and a year. The army of
// the horsemen, two hundred thousand thousand, fills the plain to the horizon, and he hears the number of them.
// The horses close: lions' heads, fire and smoke and brimstone out of their mouths, riders in breastplates of
// fire, jacinth and brimstone, tails like serpents with heads. A third of a far city burns (distance only). The
// rest repented not: people bow to dark shrines and to idols of gold, silver, brass, stone and wood, which
// neither see, nor hear, nor walk.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { glowSprite, glowTexture, pulse, sramp } from "../../kit/common.js";
import { scaled } from "../../kit/budget.js";
import { flame, smoke } from "../../kit/effects.js";
import { crowd } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { MATERIALS, city } from "../../kit/structures.js";
import { composeHeight, heights } from "../../kit/terrain.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";

const river = (z) => Math.sin(z * 0.006) * 30;
const JOHN = [-150, 0]; // a bluff west of the river, looking east over it to the plain
const CITY = [700, 160];
const SHRINE = [-118, 34]; // the high place below the bluff, where the idols stand
const ALTAR = [140, 150, -260]; // the golden altar before God, high in the sky

/** One horseman of the army, for instancing: a horse with a lion's head, a serpent tail and a rider (head +x). */
function horsemanGeometry() {
  const part = (geo, x, y, z, color) => {
    geo.translate(x, y, z);
    const c = new THREE.Color(color);
    const n = geo.attributes.position.count;
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [c.r, c.g, c.b][i % 3]), 3));
    geo.deleteAttribute("uv");
    return geo;
  };
  const body = new THREE.CapsuleGeometry(0.42, 1.1, 3, 8).rotateZ(Math.PI / 2);
  return mergeGeometries([
    part(body, 0, 1.35, 0, 0x2a2420),
    ...[[-0.55, -0.2], [-0.55, 0.2], [0.55, -0.2], [0.55, 0.2]].map(([x, z]) => part(new THREE.CylinderGeometry(0.08, 0.06, 1.15, 5), x, 0.58, z, 0x231d18)),
    part(new THREE.SphereGeometry(0.42, 8, 6), 1.2, 2.05, 0, 0x6a4a24), // the lion's head and mane
    part(new THREE.CylinderGeometry(0.06, 0.03, 1.1, 5).rotateZ(1.1), -1.0, 1.0, 0, 0x2f3a22), // the serpent tail
    part(new THREE.CapsuleGeometry(0.2, 0.6, 3, 6), -0.05, 2.25, 0, 0x1e1a22), // the rider
    part(new THREE.BoxGeometry(0.34, 0.36, 0.42), 0.02, 2.3, 0, 0xc04a18), // his breastplate of fire, jacinth, brimstone
  ]);
}

/** The voice from the four horns of the golden altar (9:13): a golden altar in the sky, its four horns aglow. */
function goldenAltar() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  g.add(new THREE.Mesh(new THREE.BoxGeometry(12, 9, 12), gold));
  const horns = [];
  for (const [x, z] of [[-5.5, -5.5], [5.5, -5.5], [-5.5, 5.5], [5.5, 5.5]]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.9, 3, 10), gold);
    horn.position.set(x, 6, z);
    const glow = glowSprite(0xffe0a0, 9, 0);
    glow.position.set(x, 7.5, z);
    g.add(horn, glow);
    horns.push(glow);
  }
  return { group: g, horns };
}

/** Chains of light round a bound angel: three rings about the body and a tether down into the river. */
function chains(height) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.3, 0.8), transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
  const rings = [0.3, 0.5, 0.7].map((k) => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(height * 0.2, height * 0.012, 6, 40), mat);
    r.rotation.x = Math.PI / 2;
    r.position.y = height * k;
    g.add(r);
    return r;
  });
  const tether = new THREE.Mesh(new THREE.CylinderGeometry(height * 0.01, height * 0.01, height * 0.4, 6), mat);
  tether.position.y = -height * 0.1;
  g.add(tether);
  return { group: g, rings, mat };
}

/** Give a cast model one material (the idols: gold, silver, brass, stone, wood), keeping its own relief. */
function dress(group, material) {
  group.traverse((o) => {
    if (!o.isMesh || o.userData.dressed === material) return;
    const m = material.clone();
    if (o.material?.normalMap) m.normalMap = o.material.normalMap;
    o.material = m;
    o.userData.dressed = material;
  });
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const ground = [heights.rolling(2.5, 0.006, 913), heights.mountain(JOHN[0] - 10, JOHN[1], 70, 22, 41, 1.2), heights.channel(river, 26, -2.5, 14)];
  const height = composeHeight([...ground, heights.flatten(SHRINE[0], SHRINE[1], 12, 22, composeHeight(ground, 1.5)(...SHRINE))], 1.5);
  const g0 = height(...JOHN);
  const E = [JOHN[0], g0 + EYE, JOHN[1]];
  const at = (x, z, dy = 0) => [x, height(x, z) + dy, z];
  const L = createLandscape(ctx, {
    terrain: { height, palette: "mesopotamia", size: 2400, center: [500, 0], wetLevel: 0.9 },
    water: { size: 2400, flow: 0.5, flowDir: [0, 1], deep: [0.03, 0.05, 0.05], level: -0.5 },
    // dusk over the river; the light fails as the army comes, and the smoke of the burning city
    sky: (rel) => [[1 - sramp(rel, 14, 22), "dusk"], [sramp(rel, 14, 22) * (1 - sramp(rel, 34, 40)), "ash"], [sramp(rel, 34, 40), "night"]],
    camera: [[0, E, [0, 20, 0], 50], [49, E, [0, 20, 0], 50]], // replaced by John's eyes
    keepClear: [[JOHN[0], JOHN[1], 14], [SHRINE[0], SHRINE[1], 18]],
    keepAboveGround: false,
    grade: (rel) => ({ saturation: 0.85 - 0.2 * sramp(rel, 34, 40), bloom: 0.35, threshold: 0.9, tint: [1.04, 0.98, 0.92] }),
  });

  // the sixth angel, which had the trumpet, in the sky over the river
  const herald = cast("angel", 14);
  herald.position.set(60, 70, -90);
  herald.lookAt(...E);
  const trumpet = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.25, 0], [0.18, 3], [1.4, 5.2], [1.5, 5.3]].map(([x, y]) => new THREE.Vector2(x, y)), 16), MATERIALS.gold());
  trumpet.position.set(1.6, 11.5, 2);
  trumpet.rotation.set(-1.1, 0, -0.5);
  herald.add(trumpet);
  const heraldGlow = glowSprite(0xffe8c0, 26, 0);
  heraldGlow.position.set(60, 80, -90);
  L.add(herald);
  L.add(heraldGlow);
  const altar = goldenAltar();
  altar.group.position.set(...ALTAR);
  altar.group.rotation.y = 0.5;
  const altarGlow = glowSprite(0xfff0d0, 70, 0);
  altarGlow.position.set(...ALTAR);
  L.add(altar.group);
  L.add(altarGlow);

  // the four angels bound in the great river Euphrates
  const bound = [-70, -25, 25, 70].map((z, i) => {
    const x = river(z);
    const a = cast("angel", 7);
    a.position.set(x, -0.6, z);
    a.lookAt(E[0], 0, E[2]);
    const c = chains(7);
    c.group.position.set(x, -0.6, z);
    const glow = glowSprite(0xffd8a0, 14, 0);
    glow.position.set(x, 4.5, z);
    L.add(a);
    L.add(c.group);
    L.add(glow);
    return { angel: a, chains: c, glow, x, z, i };
  });

  // the army of the horsemen, two hundred thousand thousand, to the horizon (9:16)
  const count = scaled(low ? 900 : 6000, 600); // (the field of sparks carries the rest of the host on phones)
  const army = new THREE.InstancedMesh(horsemanGeometry(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), count);
  army.userData.noShadow = true;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let seed = 9;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < count; i++) {
    const x = 60 + Math.pow(r(), 0.7) * 1000;
    const z = (r() - 0.5) * (300 + x * 1.2);
    const k = 2.4 + r() * 0.8; // in the vision, greater than life, so the host reads from the bluff
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI + (r() - 0.5) * 0.3); // facing west, toward the river
    army.setMatrixAt(i, m4.compose(p.set(x, height(x, z), z), q, s.set(k, k, k)));
  }
  army.instanceMatrix.needsUpdate = true;
  L.add(army);
  // beyond them to the horizon: the fire of their mouths, a field of sparks
  const far = scaled(low ? 12000 : 50000, 4000);
  const sparks = new Float32Array(far * 3);
  for (let i = 0; i < far; i++) {
    const x = 300 + r() * 1400;
    const z = (r() - 0.5) * (600 + x * 1.6);
    sparks.set([x, height(x, z) + 2, z], i * 3);
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparks, 3));
  const fires = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xff8a30, size: 2.2, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  L.add(fires);

  // three horsemen close, passing below the bluff: fire and smoke and brimstone out of their mouths (9:17)
  const PASS = [[-95, 60], [-80, 40], [-104, 30]];
  const riders = PASS.map(([x, z], i) => {
    const h = cast("lionHorse", 5);
    const mouth = new THREE.Group();
    mouth.position.set(2.6, 3.3, 0);
    const f = flame({ width: 1.1, height: 2.2, gain: 1.4, seed: i * 5 });
    f.rotation.z = -1.2;
    const sm = smoke({ count: 200, rise: 7, spread: 1.2, lean: [0.4, 0], color: [0.35, 0.3, 0.26], opacity: 0.4, size: 30, seed: i + 2 });
    const brim = smoke({ count: 120, rise: 4, spread: 0.8, color: [1.0, 0.85, 0.2], opacity: 0.9, size: 6, seed: i + 7, lit: true });
    mouth.add(f, sm, brim);
    h.add(mouth);
    h.rotation.y = -Math.PI / 2; // head (+x) toward +z, riding north past John
    L.add(h);
    return { horse: h, fx: [f, sm, brim], x, z, i };
  });

  // a far city, a third of it in fire and smoke (9:18)
  const town = city({ count: low ? 120 : 220, radius: 80, height: (x, z) => height(x + CITY[0], z + CITY[1]), style: "mud", seed: 91 });
  town.position.set(CITY[0], 0, CITY[1]);
  L.add(town);
  const burning = [];
  for (let i = 0; i < 9; i++) {
    const a = -0.4 + (i / 8) * 2.1; // one third of the city, toward John
    const d = 15 + (i % 3) * 22;
    const x = CITY[0] + Math.cos(Math.PI + a) * d;
    const z = CITY[1] + Math.sin(Math.PI + a) * d;
    const f = flame({ width: 18, height: 26, gain: 1.1, seed: i * 2 });
    f.position.set(x, height(x, z), z);
    const sm = smoke({ count: 260, rise: 160, spread: 14, lean: [0.25, -0.1], color: [0.12, 0.1, 0.09], opacity: 0.55, size: 420, seed: i + 30 });
    sm.position.copy(f.position);
    L.add(f);
    L.add(sm);
    burning.push(f, sm);
  }

  // the rest repented not (9:20): a high place below the bluff, dark shrines to devils, and the idols
  const idols = [MATERIALS.gold(), new THREE.MeshStandardMaterial({ color: 0xdfe2e6, metalness: 1, roughness: 0.22 }), new THREE.MeshStandardMaterial({ color: 0xb5913e, metalness: 1, roughness: 0.35 }),
    new THREE.MeshStandardMaterial({ color: 0x8a8478, roughness: 0.95 }), new THREE.MeshStandardMaterial({ color: 0x6a4a2c, roughness: 0.85 })].map((mat, i) => {
    const o = cast("idol", 1.3);
    o.position.set(...at(SHRINE[0] - 4 + i * 2, SHRINE[1] + 6, 0.6));
    o.lookAt(SHRINE[0] - 4 + i * 2, o.position.y, JOHN[1]); // toward the people, and John above them
    L.add(o);
    return { group: o, mat };
  });
  const bench = new THREE.Mesh(new THREE.BoxGeometry(11, 0.6, 2), MATERIALS.basalt());
  bench.position.set(...at(SHRINE[0], SHRINE[1] + 6, 0.3));
  L.add(bench);
  const lamps = idols.map(({ group }) => {
    const f = flame({ width: 0.3, height: 0.6, gain: 1.2, seed: group.position.x });
    f.position.copy(group.position).add(new THREE.Vector3(0, 0, -1.3));
    L.add(f);
    return f;
  });
  const shrines = [];
  for (const [dx, dz] of [[-16, 14], [-6, 18], [-26, 10]]) { // beyond the idols, clear of John's view of the river
    const st = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 6, 6), new THREE.MeshStandardMaterial({ color: 0x0c0a0a, roughness: 0.9 }));
    st.position.set(...at(SHRINE[0] + dx, SHRINE[1] + dz, 2.8));
    const red = glowSprite(0xa01808, 9, 0); // the shadow they bow to: dim and formless
    red.position.copy(st.position).add(new THREE.Vector3(0, 2.5, 0));
    L.add(st);
    L.add(red);
    shrines.push(red);
  }
  const worshippers = crowd({ count: low ? 50 : 90, place: (rr) => {
    const x = SHRINE[0] - 26 + rr() * 52;
    const z = SHRINE[1] - 16 + rr() * 18;
    return Math.hypot(x - JOHN[0], z - JOHN[1]) > 22 ? [x, z] : null;
  }, height, face: [SHRINE[0], SHRINE[1] + 6], bow: 0.9, kneel: 0.7, seed: 77 });
  L.add(worshippers.group);

  const herald3 = [60, 85, -90];
  const eyes = johnEyes([
    [0, E, [40, 30, -40], 56],
    [1.5, E, herald3, 40],
    [4, E, herald3, 40],
    [5, E, ALTAR, 34],
    [6.5, E, ALTAR, 34],
    [8, E, [river(0), 2, 0], 46],
    [10, E, [river(0), 3, 0], 42],
    [14.5, E, [river(0) + 30, 6, 0], 46],
    [16.5, E, [400, 10, 0], 56],
    [19.5, E, [700, 10, 40], 60],
    [20.5, E, at(-95, 46, 6), 16],
    [25.5, E, at(-95, 55, 6), 16],
    [26.5, E, [CITY[0], 30, CITY[1]], 26],
    [30, E, [CITY[0], 40, CITY[1]], 24],
    [31, E, at(-95, 61, 1.2), 14],
    [34.5, E, at(-95, 67, 1.2), 14],
    [35.5, E, at(SHRINE[0], SHRINE[1], 1), 34],
    [38.5, E, at(SHRINE[0], SHRINE[1] + 6, 1.2), 18],
    [42, E, at(SHRINE[0], SHRINE[1] + 6, 1.2), 16],
    [43.5, E, at(SHRINE[0], SHRINE[1] + 5, 1), 44],
    [49, E, [CITY[0], 20, CITY[1]], 50],
  ]);

  L.onUpdate(({ rel, time, reducedMotion, camera, pixelRatio }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    // the sixth angel sounds; the voice from the four horns
    herald.visible = rel < 11;
    heraldGlow.material.opacity = pulse(rel, 0.5, 2, 9, 11) * 0.6;
    altarGlow.material.opacity = pulse(rel, 3.5, 5, 9, 11) * 0.35;
    altar.group.visible = rel > 3 && rel < 11.5;
    altar.horns.forEach((g, i) => { g.material.opacity = pulse(rel, 4 + i * 0.3, 4.6 + i * 0.3, 9, 10) * (0.7 + 0.3 * Math.sin(time * 6 + i)); });
    // bound, then loosed: the chains break, and each is prepared for an hour, a day, a month and a year
    const loose = sramp(rel, 10, 11.5);
    for (const b of bound) {
      b.chains.mat.opacity = 0.85 * (1 - loose);
      for (const ring of b.chains.rings) ring.scale.setScalar(1 + loose * 2.5);
      b.chains.group.visible = loose < 0.99;
      const rise = sramp(rel, 11, 15);
      b.angel.position.y = -0.6 + rise * 3;
      b.angel.visible = rel < 19;
      b.glow.position.y = 4.5 + rise * 3;
      b.glow.material.opacity = 0.1 + pulse(rel, 11.2 + b.i * 0.9, 11.6 + b.i * 0.9, 12.3 + b.i * 0.9, 13 + b.i * 0.9) * 0.9;
    }
    // the army rises out of the dusk, and comes on toward the river
    const host = sramp(rel, 15, 19);
    army.position.set(-host * 20 - sramp(rel, 19, 49) * 40, (host - 1) * 4, 0);
    army.visible = host > 0.01;
    fires.material.opacity = host * (0.75 + 0.15 * Math.sin(time * 3));
    // the close pass
    for (const { horse, fx, x, z, i } of riders) {
      const ride = (rel - 19.5) * 1.8;
      horse.position.set(...at(x, z + ride - 18 + i * 3));
      horse.position.y += Math.abs(Math.sin(time * 6 + i)) * 0.15;
      horse.visible = rel > 19 && rel < 35;
      for (const e of fx) {
        e.material.uniforms.uTime.value = time + i;
        if (e.material.uniforms.uAmount) e.material.uniforms.uAmount.value = 1;
      }
    }
    // a third part of men killed: the third of the city in flames
    const burn = sramp(rel, 25.5, 28);
    for (const b of burning) {
      b.material.uniforms.uTime.value = time;
      b.material.uniforms.uAmount.value = burn;
      b.visible = burn > 0.01;
    }
    // the idols, each in its own material; lamps before them, and the people bowing still
    for (const { group, mat } of idols) dress(group, mat);
    lamps.forEach((f) => { f.material.uniforms.uTime.value = time; });
    shrines.forEach((s, i) => { s.material.opacity = sramp(rel, 34, 37) * (0.35 + 0.1 * Math.sin(time * 1.3 + i)); });
    worshippers.group.visible = rel > 33;
    // "I heard the number of them": the rumble of the host
    const number = pulse(rel, 15.5, 17, 19.5, 22);
    return {
      grade: { exposure: 1 - 0.2 * sramp(rel, 15, 20) },
      audio: {
        drone: 0.35, water: 0.35 * (1 - host), wind: 0.25,
        trumpet: pulse(rel, 0.5, 1.2, 3, 4.5) * 0.8,
        waters: pulse(rel, 3.5, 4.5, 8.5, 10) * 0.6,
        thunder: Math.max(number * (0.55 + 0.25 * Math.sin(time * 9)), pulse(rel, 10, 10.2, 10.6, 11.5) * 0.8),
        fire: Math.max(pulse(rel, 19.5, 21, 34, 35) * 0.7, burn * 0.3),
      },
    };
  });
  return L;
}
