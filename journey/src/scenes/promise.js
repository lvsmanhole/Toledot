// "Look now toward heaven, and tell the stars" (Genesis 15:5). A night camp; Abram stands outside his
// tent; the camera tilts up into a sky that fills with stars, and the stars become his descendants — the
// genealogy from the Toledot data drawn across the heavens, generation by generation, the line of
// promise in gold.

import * as THREE from "three";

import { glowSprite, pulse, sramp, textSprite } from "../kit/common.js";
import { flame } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { tents } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createStars } from "../engine/stars.js";

const NAMED = new Set(["isaac", "jacob", "judah", "levi", "joseph", "moses", "aaron", "boaz", "jesse", "david", "solomon", "hezekiah-2ki16", "josiah", "zerubbabel", "joseph-mat1", "jesus", "ishmael", "esau", "benjamin", "reuben", "samuel"]);

function genealogySky(core, root = "abram", radius = 640) {
  const ids = core.people.map((p) => p[0]);
  const names = core.people.map((p) => p[1]);
  const children = new Map();
  for (const [parent, child] of core.parents) {
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(child);
  }
  const start = ids.indexOf(root);
  if (start < 0) return null;
  // breadth-first, each person placed once at their shallowest depth
  const depth = new Map([[start, 0]]);
  const parentOf = new Map();
  const order = [start];
  for (let i = 0; i < order.length && order.length < 3000; i++) {
    const p = order[i];
    for (const c of children.get(p) ?? []) {
      if (depth.has(c)) continue;
      depth.set(c, depth.get(p) + 1);
      parentOf.set(c, p);
      order.push(c);
    }
  }
  const maxDepth = Math.max(...depth.values());
  // leaf counts for proportional fans
  const kids = new Map();
  for (const [c, p] of parentOf) {
    if (!kids.has(p)) kids.set(p, []);
    kids.get(p).push(c);
  }
  const leaves = new Map();
  for (let i = order.length - 1; i >= 0; i--) {
    const p = order[i];
    leaves.set(p, (kids.get(p) ?? []).reduce((s, c) => s + leaves.get(c), 0) || 1);
  }
  const az = new Map([[start, [-1.9, 1.9]]]);
  const pos = new Map();
  const v = (a, e) => new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).multiplyScalar(radius);
  for (const p of order) {
    const [a0, a1] = az.get(p);
    const e = THREE.MathUtils.degToRad(12 + (depth.get(p) / Math.max(1, maxDepth)) * 70);
    pos.set(p, v((a0 + a1) / 2, e));
    let cursor = a0;
    for (const c of kids.get(p) ?? []) {
      const share = ((a1 - a0) * leaves.get(c)) / leaves.get(p);
      az.set(c, [cursor, cursor + share]);
      cursor += share;
    }
  }
  const n = order.length;
  const pts = new Float32Array(n * 3);
  const reveal = new Float32Array(n);
  const sizes = new Float32Array(n);
  order.forEach((p, i) => {
    pts.set(pos.get(p).toArray(), i * 3);
    reveal[i] = depth.get(p) / Math.max(1, maxDepth);
    sizes[i] = NAMED.has(ids[p]) ? 3.2 : 1.4;
  });
  const lines = [];
  const lineReveal = [];
  for (const [c, p] of parentOf) {
    lines.push(...pos.get(p).toArray(), ...pos.get(c).toArray());
    const r = depth.get(c) / Math.max(1, maxDepth);
    lineReveal.push(r, r);
  }
  const labels = order.filter((p) => NAMED.has(ids[p]) || p === start).map((p) => ({ name: names[p], at: pos.get(p), reveal: depth.get(p) / Math.max(1, maxDepth) }));
  return { pts, reveal, sizes, lines: new Float32Array(lines), lineReveal: new Float32Array(lineReveal), labels, count: n };
}

function revealMaterial(points) {
  return new THREE.ShaderMaterial({
    uniforms: { uReveal: { value: 0 }, uPixelRatio: { value: 1 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float reveal;
      ${points ? "attribute float size;" : ""}
      uniform float uReveal, uPixelRatio, uTime;
      varying float vOn;
      void main() {
        vOn = smoothstep(reveal, reveal + 0.04, uReveal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        ${points ? "gl_PointSize = uPixelRatio * size * 3.0 * (0.85 + 0.15 * sin(uTime * 2.0 + position.x)) * vOn;" : ""}
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vOn;
      void main() {
        ${points ? "float d = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, d) * vOn;" : "float a = vOn * 0.22;"}
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * a * 1.6, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
}

export function create(ctx) {
  const height = composeHeight([heights.dunes(4, 70, 0.4, 71), heights.flatten(0, 0, 20, 50, 1)], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1200 },
    sky: () => "night",
    stars: false,
    storm: false,
    camera: [
      [0, [10, 3.2, 18], [0, 2.4, 0], 50],
      [4, [6, 2.6, 9], [-4, 5, -14], 56],
      [8, [3, 2.2, 5], [-6, 40, -60], 70],
      [18, [2, 2.2, 4], [10, 60, -50], 75],
    ],
    grade: () => ({ bloom: 0.8, threshold: 0.4, exposure: 1.1 }),
    audio: () => ({ drone: 0.35, shimmer: 0.35, wind: 0.12 }),
  });
  const h = L.height;
  const camp = tents({ count: 10, radius: 16, inner: 6, height: h, seed: 3 });
  L.add(camp);
  const fire = flame({ width: 1.2, height: 1.8, gain: 0.9, seed: 3 });
  fire.position.set(-3, h(-3, 2), 2);
  L.add(fire, ({ time }) => { fire.material.uniforms.uTime.value = time; });
  const warm = new THREE.PointLight(0xff9a50, 30, 25, 1.6);
  warm.position.set(-3, h(-3, 2) + 1.2, 2);
  L.add(warm);
  const abram = figure(1.8, { staff: true });
  abram.position.set(0, h(0, 0), 0);
  abram.rotation.y = Math.PI;
  L.add(abram);

  // the night sky: stars emerging, then becoming the generations
  const stars = createStars({ count: ctx.quality === "low" ? 8000 : 20000, radius: 800, seed: 15, size: 2 });
  L.add(stars, ({ rel, time, pixelRatio, camera }) => {
    stars.position.copy(camera.position);
    stars.material.uniforms.uReveal.value = 0.05 + 0.95 * sramp(rel, 1, 7) - 0.6 * sramp(rel, 9, 13);
    stars.material.uniforms.uTime.value = time;
    stars.material.uniforms.uPixelRatio.value = pixelRatio;
  });

  const sky = new THREE.Group();
  L.add(sky);
  let built = null;
  fetch("data/core.json").then((r) => r.json()).then((core) => {
    const g = genealogySky(core);
    if (!g) return;
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(g.pts, 3));
    pg.setAttribute("reveal", new THREE.BufferAttribute(g.reveal, 1));
    pg.setAttribute("size", new THREE.BufferAttribute(g.sizes, 1));
    const points = new THREE.Points(pg, revealMaterial(true));
    points.frustumCulled = false;
    const lg = new THREE.BufferGeometry();
    lg.setAttribute("position", new THREE.BufferAttribute(g.lines, 3));
    lg.setAttribute("reveal", new THREE.BufferAttribute(g.lineReveal, 1));
    const lines = new THREE.LineSegments(lg, revealMaterial(false));
    lines.frustumCulled = false;
    const labels = g.labels.map((l) => {
      const s = textSprite(l.name, { size: 56, scale: 16, color: "#f2dca6" });
      s.position.copy(l.at).multiplyScalar(0.985);
      s.material.opacity = 0;
      sky.add(s);
      return { s, reveal: l.reveal };
    });
    const glow = glowSprite(0xffe0a0, 60, 0);
    glow.position.copy(new THREE.Vector3(0, Math.sin(0.21), -Math.cos(0.21)).multiplyScalar(640));
    sky.add(points, lines, glow);
    built = { points, lines, labels, glow };
  }).catch(() => { /* the stars alone still carry the promise */ });

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    sky.position.copy(camera.position).setY(camera.position.y - 2);
    if (!built) return;
    const r = sramp(rel, 8.5, 16.5);
    for (const m of [built.points.material, built.lines.material]) {
      m.uniforms.uReveal.value = r * 1.05;
      m.uniforms.uTime.value = time;
      m.uniforms.uPixelRatio.value = pixelRatio;
    }
    built.glow.material.opacity = pulse(rel, 8, 9, 15, 17) * 0.5;
    for (const l of built.labels) l.s.material.opacity = sramp(r * 1.05, l.reveal, l.reveal + 0.06) * 0.95;
  });
  return L;
}
