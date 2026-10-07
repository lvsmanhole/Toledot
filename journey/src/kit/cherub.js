// The cherubim as Ezekiel describes them (Ezekiel 1:5–18; 10:9–22, where he says "I knew that they
// were the cherubims"):
//   - "they had the likeness of a man" (1:5)
//   - "every one had four faces": a man, a lion on the right side, an ox on the left side, an eagle
//     (1:10; Ezekiel 10:14 names the ox-face "the face of a cherub")
//   - "four wings": two "stretched upward ... joined one to another", two "covered their bodies" (1:11)
//   - "straight feet ... the sole of a calf's foot ... like the colour of burnished brass" (1:7)
//   - "the hands of a man under their wings on their four sides" (1:8)
//   - "like burning coals of fire ... out of the fire went forth lightning" (1:13)
//   - a "wheel in the middle of a wheel", "like unto the colour of a beryl", rings "so high that they
//     were dreadful" and "full of eyes" (1:16, 1:18); body, wings and wheels "full of eyes" (10:12)
// Built procedurally as burnished-bronze sculpture; one creature is about 6 units tall at scale 1.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { flame } from "./effects.js";
import { rng } from "../engine/noise.js";

function bronze() {
  return new THREE.MeshStandardMaterial({ color: 0xb8823e, metalness: 0.92, roughness: 0.28, emissive: 0x7a2c08, emissiveIntensity: 0.6, transparent: true });
}

const strip = (g) => { g.deleteAttribute("uv"); return g.index ? g.toNonIndexed() : g; };

// ---------------------------------------------------------------- the four faces (each built facing +z)
function manHead() {
  const skull = new THREE.SphereGeometry(0.32, 20, 16);
  skull.scale(0.9, 1.1, 0.95);
  const nose = new THREE.ConeGeometry(0.06, 0.16, 8);
  nose.rotateX(Math.PI / 2);
  nose.translate(0, -0.02, 0.33);
  const brow = new THREE.BoxGeometry(0.42, 0.05, 0.08);
  brow.translate(0, 0.1, 0.27);
  const beard = new THREE.ConeGeometry(0.2, 0.36, 12);
  beard.rotateX(Math.PI);
  beard.translate(0, -0.36, 0.14);
  return mergeGeometries([skull, nose, brow, beard].map(strip));
}

function lionHead() {
  const head = new THREE.SphereGeometry(0.3, 18, 14);
  head.scale(1, 0.95, 1.05);
  const muzzle = new THREE.BoxGeometry(0.26, 0.2, 0.22);
  muzzle.translate(0, -0.08, 0.3);
  const parts = [head, muzzle];
  // the mane: a ring of tufts radiating around the face
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2;
    const tuft = new THREE.ConeGeometry(0.1, 0.36, 6);
    tuft.rotateZ(-a);
    tuft.translate(Math.sin(a) * 0.38, Math.cos(a) * 0.38, -0.04);
    parts.push(tuft);
  }
  for (const s of [-1, 1]) {
    const ear = new THREE.SphereGeometry(0.07, 8, 6);
    ear.translate(s * 0.2, 0.28, 0.02);
    parts.push(ear);
  }
  return mergeGeometries(parts.map(strip));
}

function oxHead() {
  const head = new THREE.SphereGeometry(0.28, 18, 14);
  head.scale(0.95, 1, 1.35);
  head.translate(0, 0, 0.08);
  const muzzle = new THREE.CylinderGeometry(0.17, 0.2, 0.2, 14);
  muzzle.rotateX(Math.PI / 2);
  muzzle.translate(0, -0.1, 0.42);
  const parts = [head, muzzle];
  for (const s of [-1, 1]) {
    // horns sweeping out and up
    const horn = new THREE.TorusGeometry(0.22, 0.045, 6, 12, Math.PI * 0.6);
    horn.rotateZ(s > 0 ? -0.2 : Math.PI + 0.2);
    horn.translate(s * 0.42, 0.18, 0);
    parts.push(horn);
    const ear = new THREE.ConeGeometry(0.06, 0.18, 6);
    ear.rotateZ(s * Math.PI / 2);
    ear.translate(s * 0.32, 0.06, -0.02);
    parts.push(ear);
  }
  return mergeGeometries(parts.map(strip));
}

function eagleHead() {
  const head = new THREE.SphereGeometry(0.27, 18, 14);
  head.scale(0.9, 1, 1.1);
  const beak = new THREE.ConeGeometry(0.09, 0.32, 8);
  beak.rotateX(Math.PI / 2);
  beak.translate(0, 0, 0.36);
  const hook = new THREE.ConeGeometry(0.05, 0.16, 6);
  hook.rotateX(Math.PI);
  hook.translate(0, -0.08, 0.5);
  const crest = new THREE.ConeGeometry(0.16, 0.34, 8);
  crest.rotateX(-Math.PI / 2 - 0.5);
  crest.translate(0, 0.16, -0.22);
  return mergeGeometries([head, beak, hook, crest].map(strip));
}

// ---------------------------------------------------------------- wings, built from overlapping feathers
function wingGeometry(length) {
  const feathers = [];
  const n = 11;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1);
    const len = length * (0.45 + 0.55 * Math.sin(k * Math.PI * 0.5 + 0.35));
    const f = new THREE.PlaneGeometry(len, 0.32, 1, 1);
    f.translate(len / 2, 0, 0);
    f.rotateZ(-0.55 + k * 0.62); // fan of feathers
    f.translate(k * length * 0.12, -k * 0.5, k * 0.01);
    feathers.push(strip(f));
  }
  const bone = new THREE.CylinderGeometry(0.05, 0.08, length * 0.75, 6);
  bone.rotateZ(Math.PI / 2);
  bone.translate(length * 0.37, 0.05, 0);
  feathers.push(strip(bone));
  return mergeGeometries(feathers);
}

// ---------------------------------------------------------------- the wheel within a wheel, full of eyes
function eyePoints(positions, size = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  const seeds = new Float32Array(positions.length / 3).map((_, i) => (i * 0.6180339) % 1);
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uShow: { value: 0 }, uPixelRatio: { value: 1 }, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime, uShow, uPixelRatio, uSize;
      varying float vA;
      void main() {
        // eyes open and close at their own pace
        float blink = smoothstep(0.0, 0.15, abs(sin(uTime * (0.4 + seed * 0.6) + seed * 40.0)));
        vA = uShow * blink;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * uSize * 90.0 / -mv.z * vA;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vA;
      void main() {
        vec2 p = gl_PointCoord - 0.5;
        float d = length(p * vec2(1.0, 1.7));
        float white = smoothstep(0.5, 0.35, d);
        float iris = smoothstep(0.22, 0.12, length(p));
        vec3 col = mix(vec3(1.0, 0.92, 0.75), vec3(0.15, 0.35, 0.3), iris) * white;
        float a = white * vA;
        if (a < 0.02) discard;
        gl_FragColor = vec4(col * 1.6, a);
      }
    `,
    transparent: true, depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

export function wheel(radius) {
  const group = new THREE.Group();
  const beryl = new THREE.MeshStandardMaterial({ color: 0x9fd2b4, metalness: 0.7, roughness: 0.25, emissive: 0x2a5a40, emissiveIntensity: 0.5, transparent: true });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.045, 10, 96), beryl);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.97, radius * 0.04, 10, 96), beryl);
  inner.rotation.y = Math.PI / 2; // the wheel in the middle of the wheel, crosswise
  const hubs = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.08, 12, 10), beryl);
  const spokes = [];
  for (let i = 0; i < 8; i++) {
    const s = new THREE.CylinderGeometry(radius * 0.012, radius * 0.012, radius * 1.94, 5);
    s.rotateZ((i / 8) * Math.PI);
    spokes.push(strip(s));
  }
  const spokeMesh = new THREE.Mesh(mergeGeometries(spokes), beryl);
  group.add(outer, inner, hubs, spokeMesh);
  const eyes = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    eyes.push(Math.cos(a) * radius, Math.sin(a) * radius, radius * 0.05);
    eyes.push(0, Math.sin(a) * radius * 0.97, Math.cos(a) * radius * 0.97 + 0.0);
  }
  const eyeMesh = eyePoints(eyes, radius * 0.06);
  group.add(eyeMesh);
  return { group, materials: [beryl], eyes: eyeMesh };
}

// ---------------------------------------------------------------- the living creature
/**
 * options: scale, wheelSide (+1 / -1: which side its wheel stands), wingsJoin (how far the raised wings
 * reach sideways, so neighbours' tips can meet), seed.
 * returns { group, set(show, time, reducedMotion, pixelRatio) }
 */
export function livingCreature({ scale = 1, wheelSide = 1, wingsJoin = 1, seed = 1 } = {}) {
  const random = rng(seed);
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const metal = bronze();
  const dark = bronze();
  dark.color.set(0x5a3a1c);
  const materials = [metal, dark];

  // straight legs with the sole of a calf's foot
  const legY = 1.5;
  for (const s of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, legY, 10), metal);
    leg.position.set(s * 0.28, legY / 2 + 0.18, 0);
    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 12), dark);
    hoof.position.set(s * 0.28, 0.1, 0.04);
    const cleft = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.22, 0.3), new THREE.MeshBasicMaterial({ color: 0x120a04, transparent: true }));
    cleft.position.set(s * 0.28, 0.1, 0.1);
    materials.push(cleft.material);
    body.add(leg, hoof, cleft);
  }
  // the likeness of a man: a robed torso
  const torsoPts = [[0.42, 0], [0.5, 0.4], [0.46, 1.2], [0.52, 1.9], [0.62, 2.35], [0.34, 2.6], [0.2, 2.72], [0, 2.75]];
  const torso = new THREE.Mesh(new THREE.LatheGeometry(torsoPts.map(([r, y]) => new THREE.Vector2(r, y)), 24), metal);
  torso.position.y = legY + 0.1;
  body.add(torso);
  const neckY = legY + 0.1 + 2.75;

  // four faces: man before, lion on the right, ox on the left, eagle behind (Ezekiel 1:10)
  const heads = new THREE.Group();
  heads.position.y = neckY + 0.36;
  for (const [geo, yaw] of [[manHead(), 0], [lionHead(), -Math.PI / 2], [oxHead(), Math.PI / 2], [eagleHead(), Math.PI]]) {
    const head = new THREE.Mesh(geo, metal);
    const holder = new THREE.Group();
    holder.rotation.y = yaw;
    head.position.z = 0.24;
    holder.add(head);
    heads.add(holder);
  }
  body.add(heads);

  // hands of a man under the wings, on the four sides (Ezekiel 1:8)
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const holder = new THREE.Group();
    holder.rotation.y = yaw;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.9, 8), metal);
    arm.position.set(0, legY + 2.0, 0.55);
    arm.rotation.x = 0.5;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), metal);
    hand.scale.set(1, 1.3, 0.6);
    hand.position.set(0, legY + 1.6, 0.76);
    holder.add(arm, hand);
    body.add(holder);
  }

  // four wings: two stretched upward (to join their neighbours'), two covering the body (Ezekiel 1:11)
  const wingLen = 3.6;
  const wings = [];
  const shoulderY = legY + 2.45;
  for (const s of [-1, 1]) {
    const up = new THREE.Mesh(wingGeometry(wingLen * (0.9 + 0.25 * wingsJoin)), metal);
    const upHolder = new THREE.Group();
    upHolder.position.set(s * 0.4, shoulderY, -0.25);
    up.rotation.set(0, 0, s > 0 ? Math.PI / 2 - 0.45 : Math.PI / 2 + 0.45);
    upHolder.add(up);
    body.add(upHolder);
    wings.push({ holder: upHolder, wing: up, side: s, kind: "up" });
    const cover = new THREE.Mesh(wingGeometry(wingLen * 0.85), metal);
    const coverHolder = new THREE.Group();
    coverHolder.position.set(s * 0.45, shoulderY - 0.1, 0.1);
    cover.rotation.set(0, s > 0 ? -0.9 : Math.PI + 0.9, -Math.PI / 2 + 0.25 * s);
    coverHolder.add(cover);
    body.add(coverHolder);
    wings.push({ holder: coverHolder, wing: cover, side: s, kind: "cover" });
  }

  // eyes over body and wings (Ezekiel 10:12)
  const eyePositions = [];
  body.updateMatrixWorld(true);
  const v = new THREE.Vector3();
  for (const { wing } of wings) {
    const p = wing.geometry.attributes.position;
    for (let i = 0; i < 26; i++) {
      v.fromBufferAttribute(p, Math.floor(random() * p.count)).applyMatrix4(wing.matrixWorld);
      eyePositions.push(v.x, v.y, v.z + 0.02);
    }
  }
  for (let i = 0; i < 40; i++) {
    const a = random() * Math.PI * 2;
    const y = legY + 0.3 + random() * 2.3;
    eyePositions.push(Math.cos(a) * 0.52, y, Math.sin(a) * 0.52);
  }
  const bodyEyes = eyePoints(eyePositions, 0.22);
  body.add(bodyEyes);

  // the wheel beside it, upon the earth (Ezekiel 1:15), so high that it is dreadful
  const R = 3.3;
  const w = wheel(R);
  w.group.position.set(wheelSide * 3.8, R, 0.4);
  group.add(w.group);
  materials.push(...w.materials);

  // fire going up and down among them, and lightning out of the fire (Ezekiel 1:13)
  const coals = [0, 1, 2].map((i) => {
    const f = flame({ width: 0.9, height: 1.6, gain: 1.1, seed: seed * 3 + i });
    group.add(f);
    return f;
  });
  const boltGeo = new THREE.BufferGeometry();
  boltGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(30 * 3), 3));
  const boltMat = new THREE.LineBasicMaterial({ color: new THREE.Color(3, 2.6, 2), transparent: true });
  const bolt = new THREE.Line(boltGeo, boltMat);
  bolt.frustumCulled = false;
  group.add(bolt);
  const glow = new THREE.PointLight(0xff9040, 0, 30 * scale, 1.4);
  glow.position.y = legY + 1.5;
  group.add(glow);

  group.scale.setScalar(scale);
  let nextBolt = 0;
  let boltOn = 0;
  return {
    group,
    set(show, time, reducedMotion = false, pixelRatio = 1) {
      group.visible = show > 0.005;
      if (!group.visible) return;
      for (const m of materials) m.opacity = show;
      const coal = 0.45 + 0.35 * Math.sin(time * 2.3 + seed) + 0.2 * Math.sin(time * 7.1 + seed * 3);
      metal.emissiveIntensity = coal * 0.9;
      dark.emissiveIntensity = coal * 0.5;
      glow.intensity = show * (20 + 40 * coal);
      for (const pts of [bodyEyes, w.eyes]) {
        pts.material.uniforms.uTime.value = time;
        pts.material.uniforms.uShow.value = show;
        pts.material.uniforms.uPixelRatio.value = pixelRatio;
      }
      // the wheel turns slowly; the wings breathe
      w.group.rotation.z = reducedMotion ? 0 : time * 0.25 * -wheelSide;
      const beat = reducedMotion ? 0 : Math.sin(time * 0.9 + seed) * 0.06;
      for (const wg of wings) wg.holder.rotation.z = wg.kind === "up" ? wg.side * beat : 0;
      coals.forEach((f, i) => {
        f.material.uniforms.uTime.value = time;
        f.material.uniforms.uAmount.value = show;
        f.position.set(Math.sin(time * 0.7 + i * 2.1) * 1.2, legY + 1.2 + ((time * 0.6 + i / 3) % 1) * 3.2, 0.9 + Math.cos(time * 0.5 + i) * 0.4);
      });
      // lightning: a jagged stroke from the fire to the wheel, now and then
      if (time > nextBolt) {
        nextBolt = time + 0.6 + Math.random() * 2.2;
        boltOn = 1;
        const p = boltGeo.attributes.position;
        const a = new THREE.Vector3(0, legY + 2 + Math.random(), 0.8);
        const b = new THREE.Vector3(wheelSide * (2.4 + Math.random() * 2), 1 + Math.random() * 4, (Math.random() - 0.5) * 2);
        for (let i = 0; i < 30; i++) {
          const k = i / 29;
          const j = i === 0 || i === 29 ? 0 : 0.35;
          p.setXYZ(i, a.x + (b.x - a.x) * k + (Math.random() - 0.5) * j, a.y + (b.y - a.y) * k + (Math.random() - 0.5) * j, a.z + (b.z - a.z) * k + (Math.random() - 0.5) * j);
        }
        p.needsUpdate = true;
      }
      boltOn = Math.max(0, boltOn - 0.12);
      boltMat.opacity = boltOn * show;
      bolt.visible = boltOn > 0.02;
      glow.intensity += boltOn * 200 * show;
    },
  };
}

