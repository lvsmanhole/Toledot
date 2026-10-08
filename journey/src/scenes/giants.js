// Genesis 6:1-4 — the sons of God and the daughters of men, and the giants. At dusk shining figures come
// down out of the heavens to a city of the plain and take wives of the daughters of men. Then the giants
// stand in the land, the mighty men which were of old, towering over the walls and the fleeing crowds,
// and the city burns: "the earth was filled with violence" (6:11), the cause of the flood that follows.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { flame, smoke } from "../kit/effects.js";
import { armour, crowd, figure, personMaterial, robedGeometry } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { rng } from "../engine/noise.js";

const GIANT = 10; // a man of 1.75 m scaled tenfold: some 17 m, four or five houses high
const GIANTS = [
  { at: [0, -6], face: 2.6, spear: true },
  { at: [-26, -14], face: 0.6, spear: true },
  { at: [30, -26], face: -1.9, spear: false },
  { at: [-6, -46], face: 0.1, spear: true },
  { at: [44, 18], face: -2.4, spear: false },
];

/** The sons of God: robed figures of light, each on its own path down out of the sky. */
function hostOfHeaven(count, random, ground) {
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.5, 1.38, 1.1), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(robedGeometry(1.95, { detail: "low" }), mat, count);
  mesh.frustumCulled = false;
  const paths = Array.from({ length: count }, () => {
    const a = random() * Math.PI * 2;
    const d = 30 + random() * 60;
    const end = new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d);
    end.y = ground(end.x, end.z);
    const start = end.clone().add(new THREE.Vector3((random() - 0.5) * 140, 160 + random() * 120, -60 - random() * 100));
    return { start, end, delay: random() * 0.35 };
  });
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const p = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  // a glow about each one: lights coming down out of heaven, seen from far off
  const glowPos = new Float32Array(count * 3);
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute("position", new THREE.BufferAttribute(glowPos, 3));
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uOpacity: { value: 0 }, uPixelRatio: { value: 1 } },
    vertexShader: /* glsl */ `uniform float uPixelRatio; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(uPixelRatio * 2400.0 / -mv.z, 220.0 * uPixelRatio); }`,
    fragmentShader: /* glsl */ `uniform float uOpacity; void main() { float d = length(gl_PointCoord - 0.5) * 2.0; float a = (exp(-d * d * 18.0) * 0.9 + exp(-d * d * 4.0) * 0.25) * uOpacity; if (a < 0.004) discard; gl_FragColor = vec4(vec3(1.0, 0.94, 0.8) * a, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const glows = new THREE.Points(glowGeo, glowMat);
  glows.frustumCulled = false;
  mesh.add(glows);
  return {
    mesh,
    glowMat,
    /** k: 0 in the heavens .. 1 on the earth; show: opacity. */
    set(k, show) {
      mat.opacity = show;
      mesh.visible = show > 0.01;
      paths.forEach((path, i) => {
        const f = THREE.MathUtils.smoothstep(k, path.delay, path.delay + 0.65);
        p.lerpVectors(path.start, path.end, f);
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-path.end.x, -path.end.z));
        mesh.setMatrixAt(i, m.compose(p, q, one));
        glowPos.set([p.x, p.y + 1.2, p.z], i * 3);
      });
      glowGeo.attributes.position.needsUpdate = true;
      glowMat.uniforms.uOpacity.value = show * (1 - 0.6 * THREE.MathUtils.smoothstep(k, 0.8, 1));
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}

/** A giant: a man of the age eightfold, broad, in bronze war-gear. */
function giant(spec, height, seed) {
  const body = figure(1.75, { material: personMaterial({ robe: [0x4a2a1c, 0x3a3226, 0x5a3a22][seed % 3] }) });
  body.add(armour(1.75, { spear: spec.spear }));
  const g = new THREE.Group();
  g.add(body);
  g.scale.set(GIANT * 1.18, GIANT, GIANT * 1.18);
  g.position.set(spec.at[0], height(spec.at[0], spec.at[1]) - 0.3, spec.at[1]);
  g.rotation.y = spec.face;
  g.userData = { base: g.position.clone(), face: spec.face, seed };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export function create(ctx) {
  const low = ctx.quality === "low";
  const height = composeHeight([heights.rolling(8, 0.008, 611), heights.mountain(-80, -380, 160, 120, 612, 1.3), heights.flatten(0, 0, 60, 110, 2)], 1.5);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 1400 },
    sky: (rel) => [[1 - sramp(rel, 9, 16), "golden"], [sramp(rel, 9, 16), "dusk"]],
    camera: [
      [0, [150, 60, 200], [-10, 90, -60], 52],
      [5.5, [90, 30, 120], [0, 20, 0], 46],
      [8.5, [46, 16, 50], [0, 6, 0], 48],
      [10.5, [22, 2.2, 22], [6, 13, 4], 56],
      [15.5, [-16, 2.0, 16], [-20, 12, -12], 60],
      [20, [-110, 46, 140], [0, 12, -10], 46],
      [24, [-170, 80, 210], [0, 18, -20], 44],
    ],
    keepClear: [[0, 0, 70]],
    grade: (rel) => ({ saturation: 0.9 - 0.15 * sramp(rel, 12, 20), bloom: 0.3 + 0.2 * pulse(rel, 1, 3, 7, 10), threshold: 0.85, tint: [1.05, 0.98, 0.9] }),
    audio: (rel) => ({ drone: 0.3 + 0.35 * sramp(rel, 11, 16), shimmer: 0.45 * pulse(rel, 0.5, 2, 7, 10), fire: 0.55 * sramp(rel, 13, 17), wind: 0.25 }),
  });
  const h = L.height;
  const random = rng(613);

  // a city of the plain before the flood
  // (an open square in the middle, where the first of the giants stands)
  const town = city({ count: low ? 160 : 260, radius: 80, inner: 30, height: h, style: "mud", seed: 614 });
  L.add(town);
  L.add(createTrees({ count: low ? 25 : 60, place: placers.disc(0, 0, 260, (x, z) => Math.hypot(x, z) > 90), height: h, kind: "olive", size: [3, 5] }).group);

  // the daughters of men, and the people of the city
  const people = crowd({ count: low ? 260 : 600, place: placers.disc(0, 0, 66, (x, z) => Math.hypot(x, z) > 6), height: h, seed: 615, walk: 1 });
  L.add(people.group);
  const daughters = crowd({ count: 40, place: placers.disc(0, 0, 95, (x, z) => Math.hypot(x, z) > 30), height: h, seed: 616, staffChance: 0 });
  L.add(daughters.group);

  // the sons of God come down
  const host = hostOfHeaven(low ? 24 : 40, random, h);
  L.add(host.mesh);

  // the giants
  const giants = GIANTS.map((g, i) => giant(g, h, i));
  giants.forEach((g) => L.add(g));

  // fire and smoke in the city
  const fires = [];
  for (let i = 0; i < 10; i++) {
    const a = random() * Math.PI * 2;
    const d = 12 + random() * 55;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    const f = flame({ width: 4 + random() * 4, height: 7 + random() * 7, gain: 0.6, seed: i });
    f.position.set(x, h(x, z) + 2.5, z);
    L.add(f);
    fires.push(f);
  }
  const plume = smoke({ rise: 160, spread: 45, lean: [0.35, 0.1], color: [0.16, 0.13, 0.12], opacity: 0.38, size: 120, count: low ? 600 : 1200 });
  plume.position.set(0, h(0, 0) + 4, 0);
  L.add(plume);
  const glow = new THREE.PointLight(0xff7a30, 0, 220, 1.5);
  glow.position.set(30, h(30, 40) + 6, 40);
  L.add(glow);

  L.onUpdate(({ rel, time, pixelRatio }) => {
    host.glowMat.uniforms.uPixelRatio.value = pixelRatio;
    // the host descends (0.5–8), stays among the daughters of men (8–11), and is gone as the giants stand
    host.set(sramp(rel, 0.5, 8), pulse(rel, 0.3, 1.5, 10.5, 12) * 0.95);
    daughters.group.visible = rel < 12;
    const stand = sramp(rel, 10, 12.5);
    giants.forEach((g, i) => {
      const { base, face, seed } = g.userData;
      g.visible = stand > 0.01;
      // rising out of the land's haze, then a slow, heavy stride
      g.position.copy(base);
      g.position.y = base.y - (1 - stand) * GIANT * 2;
      const stride = sramp(rel, 12.5, 24) * 10;
      g.position.x += Math.sin(face) * stride;
      g.position.z += Math.cos(face) * stride;
      g.position.y += Math.abs(Math.sin(time * 1.1 + seed)) * 0.25;
      g.rotation.y = face + Math.sin(time * 0.35 + seed) * 0.12;
      g.rotation.z = Math.sin(time * 1.1 + seed) * 0.025;
    });
    const burn = sramp(rel, 13, 17);
    fires.forEach((f) => { f.material.uniforms.uTime.value = time; f.material.uniforms.uAmount.value = burn; f.visible = burn > 0.01; });
    plume.material.uniforms.uTime.value = time;
    plume.material.uniforms.uAmount.value = burn;
    glow.intensity = burn * 260;
  });
  return L;
}
