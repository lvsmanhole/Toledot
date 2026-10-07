// People and animals: single figures, instanced crowds and armies, simple animals.
// A figure is dressed as people of the ancient Near East: a long tunic with folds, an outer mantle over
// the shoulders, sleeves and hands, a head covering framing the face, a sash, sandals. Faces are kept
// simple (no portrait likenesses); dyes, skin tones and heights vary per person, and walkers move.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { pbr } from "./library.js";
import { rng } from "../engine/noise.js";

// part ids baked into the geometry, coloured in the shader
const TUNIC = 0;
const SKIN = 1;
const MANTLE = 2;
const HEADCLOTH = 3;
const SASH = 4;
const DARKPART = 5; // hair, beard, sandals, staff

function tag(geometry, part) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  g.deleteAttribute("uv");
  g.setAttribute("part", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count).fill(part), 1));
  return g;
}

let SEG = 1; // geometry detail multiplier while building a figure
function lathe(profile, segments = 22, phiStart = 0, phiLength = Math.PI * 2, folds = 0) {
  segments = Math.max(6, Math.round(segments * SEG));
  if (SEG < 1) folds = 0;
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), segments, phiStart, phiLength);
  if (folds) {
    // vertical folds in the cloth, deepest at the hem
    const p = g.attributes.position;
    const ys = profile.map(([, y]) => y);
    const top = Math.max(...ys);
    const bottom = Math.min(...ys);
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const z = p.getZ(i);
      const y = p.getY(i);
      const a = Math.atan2(x, z);
      const depth = Math.min(1, Math.max(0, (top - y) / Math.max(1e-3, top - bottom)));
      const k = 1 + Math.sin(a * folds + Math.sin(a * 3) * 0.8) * 0.06 * depth ** 1.5;
      p.setX(i, x * k);
      p.setZ(i, z * k);
    }
  }
  g.computeVertexNormals();
  return g;
}

/** A clothed figure about `h` tall; origin at the feet, facing +z. */
export function robedGeometry(h = 1.75, { staff = false, veiled = false, beard = !veiled, detail = "high" } = {}) {
  SEG = detail === "low" ? 0.4 : 1;
  const low = detail === "low";
  const sph = (r, w, hh, ...rest) => new THREE.SphereGeometry(r, low ? Math.max(6, Math.round(w / 2.5)) : w, low ? Math.max(4, Math.round(hh / 2.5)) : hh, ...rest);
  const parts = [];
  // tunic: hem flaring at the ankle, drawn in at the waist, broad at the shoulders
  parts.push(tag(lathe([[0.0, 0.04], [0.27, 0.04], [0.25, 0.25], [0.22, 0.6], [0.2, 0.98], [0.21, 1.15], [0.22, 1.32], [0.19, 1.42], [0.07, 1.47]], 26, 0, Math.PI * 2, 7), TUNIC));
  // mantle over the shoulders and down the back, open at the front
  parts.push(tag(lathe([[0.235, 0.5], [0.245, 0.8], [0.25, 1.1], [0.245, 1.33], [0.2, 1.44], [0.1, 1.49]], 22, Math.PI * 0.32, Math.PI * 1.36, 5), MANTLE));
  // sash at the waist
  const sash = new THREE.TorusGeometry(0.205, 0.035, low ? 3 : 6, low ? 10 : 24);
  sash.rotateX(Math.PI / 2);
  sash.translate(0, 1.0, 0);
  parts.push(tag(sash, SASH));
  // arms in sleeves hanging a little forward, hands below
  for (const s of [-1, 1]) {
    const sleeve = new THREE.CylinderGeometry(0.06, 0.085, 0.58, low ? 5 : 10, 1, true);
    sleeve.rotateX(-0.12);
    sleeve.rotateZ(s * 0.1);
    sleeve.translate(s * 0.255, 1.12, 0.03);
    parts.push(tag(sleeve, s < 0 ? TUNIC : TUNIC));
    const hand = sph(0.048, 10, 8);
    hand.scale(0.8, 1.25, 0.7);
    hand.translate(s * 0.285, 0.8, 0.07);
    parts.push(tag(hand, SKIN));
  }
  // neck, head, face
  const neck = new THREE.CylinderGeometry(0.048, 0.055, 0.12, low ? 5 : 10);
  neck.translate(0, 1.5, 0);
  parts.push(tag(neck, SKIN));
  const head = sph(0.1, 18, 14);
  head.scale(0.88, 1.08, 0.98);
  head.translate(0, 1.625, 0.005);
  parts.push(tag(head, SKIN));
  const nose = new THREE.ConeGeometry(0.018, 0.05, 6);
  nose.rotateX(Math.PI / 2 + 0.25);
  nose.translate(0, 1.615, 0.1);
  if (!low) parts.push(tag(nose, SKIN));
  if (beard && !low) {
    const b = sph(0.075, 12, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.55);
    b.scale(1, 1.25, 0.9);
    b.translate(0, 1.6, 0.035);
    parts.push(tag(b, DARKPART));
  }
  // head covering: falls from the crown to the shoulders, open at the face
  parts.push(tag(lathe([[0.0, 1.76], [0.06, 1.755], [0.1, 1.73], [0.122, 1.67], [0.135, 1.58], [0.16, 1.5], [0.21, 1.43]], 20, Math.PI * 0.2, Math.PI * 1.6, 3), HEADCLOTH));
  const band = new THREE.TorusGeometry(0.108, 0.014, low ? 3 : 6, low ? 8 : 20);
  band.rotateX(Math.PI / 2 - 0.12);
  band.translate(0, 1.7, 0.0);
  if (!low) parts.push(tag(band, veiled ? HEADCLOTH : DARKPART));
  // sandalled feet showing under the hem
  for (const s of [-1, 1]) {
    const f = new THREE.BoxGeometry(0.09, 0.05, 0.24);
    f.translate(s * 0.09, 0.025, 0.08);
    parts.push(tag(f, DARKPART));
  }
  if (staff) {
    const st = new THREE.CylinderGeometry(0.016, 0.022, 1.95, 6);
    st.translate(0.31, 0.95, 0.12);
    parts.push(tag(st, DARKPART));
  }
  const g = mergeGeometries(parts);
  SEG = 1;
  // degenerate triangles at lathe poles give zero normals; point them up rather than NaN
  const nrm = g.attributes.normal;
  for (let i = 0; i < nrm.count; i++) {
    const x = nrm.getX(i), y = nrm.getY(i), z = nrm.getZ(i);
    if (!(x * x + y * y + z * z > 1e-8)) nrm.setXYZ(i, 0, 1, 0);
  }
  g.scale(h / 1.75, h / 1.75, h / 1.75);
  g.computeBoundingSphere();
  return g;
}

/** Time for every person material (set once per frame by the director). */
export const peopleClock = { value: 0 };

// natural dyes and undyed cloth of the period: linen, wool, madder red, indigo, ochre, saffron, brown
const DYES = [[0.78, 0.72, 0.6], [0.62, 0.55, 0.44], [0.48, 0.38, 0.28], [0.55, 0.22, 0.16], [0.24, 0.3, 0.45], [0.62, 0.48, 0.24], [0.36, 0.3, 0.22], [0.82, 0.78, 0.7], [0.42, 0.42, 0.36], [0.68, 0.58, 0.36]];

/**
 * The clothing material: linen weave (CC0 texture) in object space, colours chosen per part and per
 * person from a hash of the instance, optional walking motion (uWalk 0..1).
 */
export function personMaterial({ robe = null, walk = 0 } = {}) {
  const linen = pbr("linen");
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
  material.userData.uniforms = { uTime: peopleClock, uWalk: { value: walk } };
  const robeColor = robe ? new THREE.Color(robe) : null;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.tLinen = { value: linen.map };
    shader.uniforms.tLinenN = { value: linen.normalMap };
    shader.uniforms.uTime = material.userData.uniforms.uTime;
    shader.uniforms.uWalk = material.userData.uniforms.uWalk;
    shader.uniforms.uRobe = { value: robeColor ?? new THREE.Color(-1, -1, -1) };
    shader.uniforms.uDyes = { value: DYES.map((c) => new THREE.Vector3(...c)) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>
        attribute float part;
        varying float vPart;
        varying vec3 vLocal;
        varying float vSeed;
        uniform float uTime, uWalk;
        float h11(float n) { return fract(sin(n) * 43758.5453); }`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        vPart = part;
        vLocal = position;
        float seed = 0.0;
        #ifdef USE_INSTANCING
          seed = fract(sin(dot(instanceMatrix[3].xz, vec2(12.9898, 78.233))) * 43758.5453);
        #endif
        vSeed = seed;
        // walking: a stride sway in the hem, arms swinging, a slight bob
        float ph = uTime * 5.2 + seed * 6.283;
        float hem = clamp(1.0 - position.y / 0.9, 0.0, 1.0);
        transformed.z += sin(ph) * 0.07 * hem * uWalk * sign(position.x + 0.001) * (part == 0.0 ? 1.0 : 0.6);
        if (position.y > 0.7 && position.y < 1.42 && abs(position.x) > 0.2) {
          float swing = sin(ph) * sign(position.x) * (1.42 - position.y) * 0.35 * uWalk;
          transformed.z += swing;
        }
        transformed.y += abs(sin(ph)) * 0.03 * uWalk;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
        uniform sampler2D tLinen, tLinenN;
        uniform vec3 uRobe;
        uniform vec3 uDyes[10];
        varying float vPart;
        varying vec3 vLocal;
        varying float vSeed;
        vec3 dye(float k) { int i = int(floor(fract(k) * 10.0)); return uDyes[i]; }`)
      .replace("#include <map_fragment>", `
        float pid = floor(vPart + 0.5);
        vec3 robeC = uRobe.r >= 0.0 ? uRobe : dye(vSeed * 7.13);
        vec3 col = robeC;
        if (pid == 1.0) col = mix(vec3(0.42, 0.27, 0.18), vec3(0.68, 0.48, 0.34), fract(vSeed * 3.7)); // skin
        else if (pid == 2.0) col = dye(vSeed * 3.31 + 0.5) * 0.85;   // mantle
        else if (pid == 3.0) col = mix(vec3(0.85, 0.8, 0.7), dye(vSeed * 5.9), step(0.55, fract(vSeed * 9.1))); // head covering
        else if (pid == 4.0) col = dye(vSeed * 11.7 + 0.3) * 0.7;    // sash
        else if (pid == 5.0) col = vec3(0.07, 0.055, 0.045);          // hair, sandals, staff
        // linen weave on the cloth, triplanar in the figure's own space
        vec3 n = abs(normalize(vNormal));
        vec2 uv = (n.y > 0.6 ? vLocal.xz : (n.x > n.z ? vLocal.zy : vLocal.xy)) * 6.0;
        float cloth = pid == 1.0 ? 0.0 : 1.0;
        vec3 weave = texture2D(tLinen, uv).rgb;
        col *= mix(vec3(1.0), weave * 1.6, 0.55 * cloth);
        // cloth darker in the folds near the hem, lighter on the shoulders
        col *= 0.8 + 0.25 * smoothstep(0.0, 1.5, vLocal.y);
        diffuseColor.rgb = col;`)
      .replace("#include <roughnessmap_fragment>", "float roughnessFactor = pid == 1.0 ? 0.6 : roughness;");
  };
  material.customProgramCacheKey = () => `person-${robe ?? "x"}`;
  return material;
}

export function figure(h = 1.75, opts = {}) {
  const mesh = new THREE.Mesh(robedGeometry(h, opts), opts.material ?? personMaterial({ robe: opts.robe ?? null, walk: opts.walk ?? 0 }));
  mesh.castShadow = true;
  return mesh;
}

/**
 * A warrior's war-gear to set over a figure of the same height (1 Samuel 17:5-7): a bronze helmet, a coat
 * of scale mail, a bronze javelin slung between the shoulders and a long spear with an iron head.
 */
export function armour(h = 1.75, { spear = true } = {}) {
  const group = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({ color: 0x8f6534, roughness: 0.38, metalness: 1 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x4a4744, roughness: 0.5, metalness: 1 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x4d3722, roughness: 0.85 });
  // helmet: a bronze cap with a rim and cheek guards
  const helmet = new THREE.SphereGeometry(0.122, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.55);
  helmet.scale(0.95, 1.1, 1.02);
  helmet.translate(0, 1.64, 0);
  const rim = new THREE.TorusGeometry(0.118, 0.012, 6, 24).rotateX(Math.PI / 2).translate(0, 1.625, 0);
  const cheeks = [-1, 1].map((s) => new THREE.BoxGeometry(0.02, 0.1, 0.07).translate(s * 0.105, 1.57, 0.035));
  group.add(new THREE.Mesh(mergeGeometries([helmet, rim, ...cheeks].map((g) => g.index ? g.toNonIndexed() : g)), bronze));
  // coat of mail: rows of overlapping bronze scales from the shoulders to the thigh
  const rows = 14;
  const profile = [];
  for (let i = 0; i <= rows; i++) {
    const y = 0.72 + (i / rows) * 0.72;
    const r = THREE.MathUtils.lerp(0.235, 0.225, i / rows) + (y > 1.3 ? -(y - 1.3) * 0.35 : 0);
    profile.push(new THREE.Vector2(r + 0.012, y), new THREE.Vector2(r, y + 0.72 / rows - 0.004));
  }
  const coat = new THREE.LatheGeometry(profile, 48);
  const p = coat.attributes.position;
  for (let i = 0; i < p.count; i++) {
    // scalloped scale edges around each row
    const a = Math.atan2(p.getX(i), p.getZ(i));
    const k = 1 + Math.abs(Math.sin(a * 24 + Math.floor(p.getY(i) * rows / 0.72) * 1.57)) * 0.025;
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  coat.computeVertexNormals();
  group.add(new THREE.Mesh(coat, bronze));
  // the javelin (or scimitar) of bronze slung between the shoulders
  const javelin = new THREE.CylinderGeometry(0.012, 0.012, 1.1, 6).rotateZ(0.9).translate(0, 1.2, -0.25);
  group.add(new THREE.Mesh(javelin, bronze));
  if (spear) {
    // "the staff of his spear was like a weaver's beam; and his spear's head weighed six hundred shekels of iron"
    const shaft = new THREE.CylinderGeometry(0.03, 0.035, 3.2, 8).translate(0.32, 1.45, 0.12);
    const head = new THREE.ConeGeometry(0.05, 0.4, 8).translate(0.32, 3.25, 0.12);
    group.add(new THREE.Mesh(shaft, wood), new THREE.Mesh(head, iron));
  }
  group.scale.setScalar(h / 1.75);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}

/** A tall bronze-rimmed shield of wood and hide, carried before the body; origin at the bearer's feet. */
export function shield(h = 1.75) {
  const g = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 28, 1);
  g.rotateX(Math.PI / 2);
  g.scale(1, 1.9, 1);
  g.translate(0, 0.98, 0.36);
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 0.7, metalness: 0.2 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 6, 32).scale(1, 1.9, 1).translate(0, 0.98, 0.39), new THREE.MeshStandardMaterial({ color: 0x8f6534, roughness: 0.38, metalness: 1 }));
  const group = new THREE.Group();
  group.add(mesh, rim);
  group.scale.setScalar(h / 1.75);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return group;
}

/** Advance the walking/time uniform of any person materials under root. */
export function tickPeople(root, time) {
  root.traverse((o) => {
    const u = o.material?.userData?.uniforms;
    if (u?.uTime) u.uTime.value = time;
  });
}

/**
 * An instanced crowd. place(random) -> [x, z] | null; height(x, z) for ground.
 * Returns { group, positions } so callers can animate a few individuals.
 */
export function crowd({ count = 200, place, height = () => 0, seed = 3, scale = [0.9, 1.1], staffChance = 0.15, material = null, face = null, walk = 0, detail = count > 40 ? "low" : "high" }) {
  const random = rng(seed);
  const mat = material ?? personMaterial({ walk });
  const geos = [robedGeometry(1.75, { detail }), robedGeometry(1.7, { veiled: true, detail }), robedGeometry(1.75, { staff: true, detail })];
  const meshes = geos.map((g) => new THREE.InstancedMesh(g, mat, count));
  const counts = [0, 0, 0];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const positions = [];
  for (let tries = 0; counts[0] + counts[1] + counts[2] < count && tries < count * 10; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const k = scale[0] + random() * (scale[1] - scale[0]);
    const yaw = face ? Math.atan2(face[0] - x, face[1] - z) + (random() - 0.5) * 0.6 : random() * 6.28;
    q.setFromAxisAngle(up, yaw);
    m.compose(p.set(x, height(x, z) - 0.03, z), q, s.set(k, k, k));
    const r = random();
    const kind = r < staffChance ? 2 : r < staffChance + 0.4 ? 1 : 0;
    meshes[kind].setMatrixAt(counts[kind]++, m);
    positions.push([x, z]);
  }
  const group = new THREE.Group();
  meshes.forEach((mesh, i) => {
    mesh.count = counts[i];
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  group.userData.material = mat;
  return { group, positions, material: mat };
}

// ---------------------------------------------------------------- animals (blocky silhouettes read fine at distance)
const ell = (rx, ry, rz, x, y, z) => {
  const g = new THREE.SphereGeometry(1, 10, 8);
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  g.deleteAttribute("uv");
  return g;
};
const leg = (x, z, h, r = 0.05) => {
  const g = new THREE.CylinderGeometry(r, r * 0.8, h, 5);
  g.translate(x, h / 2, z);
  g.deleteAttribute("uv");
  return g;
};

const COATS = { sheep: 0xd8cfbc, camel: 0xb08a5a, ox: 0x6a4a32, donkey: 0x7a6e62, lion: 0xb88a4c, elephant: 0x7a746c, bird: 0x3a3430 };
const coatCache = new Map();
/** A coat-coloured, slightly fuzzy material per kind of animal. */
export function animalMaterial(kind) {
  if (!coatCache.has(kind)) coatCache.set(kind, new THREE.MeshStandardMaterial({ color: COATS[kind] ?? 0x5a4a3a, roughness: 0.95 }));
  return coatCache.get(kind);
}

export const ANIMALS = {
  sheep: () => mergeGeometries([ell(0.45, 0.3, 0.28, 0, 0.62, 0), ell(0.13, 0.12, 0.11, 0.48, 0.72, 0), leg(0.25, 0.12, 0.45), leg(0.25, -0.12, 0.45), leg(-0.25, 0.12, 0.45), leg(-0.25, -0.12, 0.45)]),
  camel: () => mergeGeometries([ell(0.9, 0.42, 0.38, 0, 1.75, 0), ell(0.32, 0.38, 0.28, 0.05, 2.15, 0), ell(0.12, 0.45, 0.12, 0.95, 2.1, 0), ell(0.22, 0.12, 0.12, 1.15, 2.45, 0), leg(0.55, 0.2, 1.4, 0.07), leg(0.55, -0.2, 1.4, 0.07), leg(-0.6, 0.2, 1.4, 0.07), leg(-0.6, -0.2, 1.4, 0.07)]),
  ox: () => mergeGeometries([ell(0.85, 0.48, 0.42, 0, 1.0, 0), ell(0.28, 0.25, 0.22, 0.95, 1.1, 0), leg(0.5, 0.22, 0.65, 0.09), leg(0.5, -0.22, 0.65, 0.09), leg(-0.5, 0.22, 0.65, 0.09), leg(-0.5, -0.22, 0.65, 0.09)]),
  donkey: () => mergeGeometries([ell(0.55, 0.3, 0.25, 0, 0.95, 0), ell(0.22, 0.14, 0.12, 0.62, 1.15, 0), ell(0.05, 0.16, 0.03, 0.62, 1.38, 0.06), ell(0.05, 0.16, 0.03, 0.62, 1.38, -0.06), leg(0.35, 0.12, 0.7), leg(0.35, -0.12, 0.7), leg(-0.35, 0.12, 0.7), leg(-0.35, -0.12, 0.7)]),
  lion: () => mergeGeometries([ell(0.8, 0.36, 0.34, 0, 0.85, 0), ell(0.42, 0.42, 0.4, 0.75, 1.05, 0), leg(0.45, 0.18, 0.65, 0.08), leg(0.45, -0.18, 0.65, 0.08), leg(-0.5, 0.18, 0.65, 0.08), leg(-0.5, -0.18, 0.65, 0.08)]),
  elephant: () => mergeGeometries([ell(1.6, 1.1, 0.95, 0, 2.6, 0), ell(0.7, 0.65, 0.6, 1.7, 3.0, 0), ell(0.18, 0.9, 0.18, 2.2, 2.0, 0), leg(0.9, 0.5, 1.9, 0.3), leg(0.9, -0.5, 1.9, 0.3), leg(-0.9, 0.5, 1.9, 0.3), leg(-0.9, -0.5, 1.9, 0.3)]),
  bird: () => mergeGeometries([ell(0.15, 0.08, 0.08, 0, 0, 0), ell(0.06, 0.02, 0.35, 0, 0.02, 0)]),
};

/** Instanced animals of one kind, placed like a crowd. */
export function herd({ kind = "sheep", count = 40, place, height = () => 0, seed = 8, scale = [0.9, 1.1], material = null }) {
  const random = rng(seed);
  const geo = ANIMALS[kind]();
  const mesh = new THREE.InstancedMesh(geo, material ?? animalMaterial(kind), count);
  mesh.castShadow = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 10; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const k = scale[0] + random() * (scale[1] - scale[0]);
    q.setFromAxisAngle(up, random() * 6.28);
    m.compose(p.set(x, height(x, z) - 0.02, z), q, s.set(k, k, k));
    mesh.setMatrixAt(n++, m);
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Pairs of animals walking in a line toward a target (the procession into the ark). */
export function procession({ kinds = ["ox", "camel", "sheep", "donkey", "lion", "elephant"], pairs = 18, from, to, height = () => 0, seed = 12 }) {
  const random = rng(seed);
  const group = new THREE.Group();
  const items = [];
  for (let i = 0; i < pairs; i++) {
    const kind = kinds[Math.floor(random() * kinds.length)];
    const geo = ANIMALS[kind]();
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(geo, animalMaterial(kind));
      mesh.castShadow = true;
      const k = kind === "elephant" ? 0.9 : kind === "bird" ? 3 : 1;
      mesh.scale.setScalar(k);
      group.add(mesh);
      items.push({ mesh, offset: i * 3.2 + random() * 0.8, side });
    }
  }
  const dir = new THREE.Vector3(to[0] - from[0], 0, to[1] - from[1]);
  const len = dir.length();
  dir.normalize();
  const perp = new THREE.Vector3(-dir.z, 0, dir.x);
  return {
    group,
    /** progress 0..1 along the path; animals beyond the target are hidden. */
    set(progress, time) {
      for (const it of items) {
        const d = progress * (len + pairs * 3.2) - it.offset;
        const visible = d > 0 && d < len;
        it.mesh.visible = visible;
        if (!visible) continue;
        const x = from[0] + dir.x * d + perp.x * it.side * 0.9;
        const z = from[1] + dir.z * d + perp.z * it.side * 0.9;
        it.mesh.position.set(x, height(x, z) + Math.abs(Math.sin(time * 5 + it.offset)) * 0.05, z);
        it.mesh.rotation.y = -Math.atan2(dir.z, dir.x);
      }
    },
  };
}
