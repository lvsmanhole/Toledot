// Vegetation: instanced grass/wheat/reeds with wind, and instanced trees (broadleaf, olive, palm, cypress).

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { fbm2, rng } from "../engine/noise.js";
import { scaled } from "./budget.js";
import { modelParts } from "./library.js";
import { SURFACES } from "./surface.js";

/** Phones and tablets load the half-size leaf atlas. */
let mobileLeaves = false;
const leafSuffix = () => (mobileLeaves ? "_m" : "");
export function useMobileLeaves(on) {
  mobileLeaves = on;
}

/** Overall daylight 0..1 for unlit vegetation; set each frame by the landscape from the sky preset. */
export const skyLight = { value: 1 };

/**
 * Blades placed by `place(random) -> [x, z] | null` on `height(x, z)`.
 * kind: grass | wheat | reeds — changes blade shape and colour.
 */
export function createBlades({ count, place, height, kind = "grass", random = rng(5), minH = 0.4, maxH = 40 }) {
  count = scaled(count, 2000);
  const shapes = {
    grass: { w: 0.04, h: [0.25, 0.7], base: [[0.05, 0.06, 0.025], [0.08, 0.08, 0.035]], tip: [[0.26, 0.27, 0.12], [0.36, 0.33, 0.17]], head: 0 },
    wheat: { w: 0.04, h: [0.9, 1.4], base: [[0.25, 0.2, 0.06], [0.3, 0.24, 0.08]], tip: [[0.85, 0.66, 0.3], [0.95, 0.78, 0.4]], head: 1 },
    reeds: { w: 0.05, h: [1.6, 2.8], base: [[0.08, 0.1, 0.04], [0.12, 0.13, 0.05]], tip: [[0.42, 0.42, 0.22], [0.55, 0.5, 0.28]], head: 0 },
  };
  const s = shapes[kind];
  const blade = new THREE.BufferGeometry();
  const w = s.w;
  blade.setAttribute("position", new THREE.Float32BufferAttribute([-w, 0, 0, w, 0, 0, -w * 0.8, 0.35, 0, w * 0.8, 0.35, 0, -w * 0.5, 0.7, 0, w * 0.5, 0.7, 0, 0, 1, 0], 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
  const geometry = new THREE.InstancedBufferGeometry().copy(blade);
  const offsets = new Float32Array(count * 4);
  const shape = new Float32Array(count * 3);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 8; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const h = height(x, z);
    if (h < minH || h > maxH) continue;
    offsets.set([x, h - 0.05, z, random() * Math.PI], n * 4);
    shape.set([s.h[0] + random() * (s.h[1] - s.h[0]), (random() - 0.5) * 0.35, random()], n * 3);
    n++;
  }
  geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(offsets.subarray(0, n * 4), 4));
  geometry.setAttribute("shape", new THREE.InstancedBufferAttribute(shape.subarray(0, n * 3), 3));
  geometry.instanceCount = n;
  const v3 = (a) => `vec3(${a.map((x) => x.toFixed(3)).join(", ")})`;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uWind: { value: 0.3 }, uLight: { value: new THREE.Color(1, 0.92, 0.8) }, uSky: skyLight,
      fogColor: { value: new THREE.Color() }, fogNear: { value: 0 }, fogFar: { value: 0 }, fogDensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec4 offset;
      attribute vec3 shape;
      uniform float uTime, uWind;
      varying float vTip;
      varying float vShade;
      #include <fog_pars_vertex>
      void main() {
        vec3 p = position;
        p.y *= shape.x;
        // blades right at the lens fold away, so no single stalk ever fills the frame
        float dist = distance((modelMatrix * vec4(offset.xyz, 1.0)).xyz, cameraPosition);
        float near = smoothstep(2.0, 7.0, dist);
        // thinning with distance: past ~35 m a growing share of blades (chosen by their own random seed)
        // collapse to nothing, so the GPU rasterises far less where they are lost in the haze anyway
        float keep = 1.0 - 0.85 * smoothstep(35.0, 140.0, dist);
        p *= near * step(shape.z, keep) * mix(1.0, 1.6, smoothstep(35.0, 140.0, dist));
        float c = cos(offset.w), s = sin(offset.w);
        p = vec3(p.x * c, p.y, p.x * s);
        float tip = position.y;
        float gust = sin(uTime * 1.3 + offset.x * 0.08 + offset.z * 0.05) * 0.5 + 0.5;
        float sway = (sin(uTime * 2.1 + offset.x * 0.7 + offset.z * 0.4) * 0.35 + gust) * uWind;
        p.x += (sway + shape.y) * tip * tip * shape.x;
        p.z += sway * 0.4 * tip * tip * shape.x;
        vec4 mvPosition = modelViewMatrix * vec4(p + offset.xyz, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        vTip = tip;
        vShade = shape.z;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uLight;
      uniform float uSky;
      varying float vTip;
      varying float vShade;
      #include <fog_pars_fragment>
      void main() {
        vec3 base = mix(${v3(s.base[0])}, ${v3(s.base[1])}, vShade);
        vec3 tip = mix(${v3(s.tip[0])}, ${v3(s.tip[1])}, vShade);
        float headBand = ${s.head.toFixed(1)} * smoothstep(0.72, 0.8, vTip);
        vec3 col = mix(base, tip, vTip) * (1.0 + headBand * 0.4) * uLight * uSky;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
    side: THREE.DoubleSide,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return {
    mesh,
    update({ time, wind, fog, light }) {
      const u = material.uniforms;
      u.uTime.value = time;
      u.uWind.value = wind;
      u.fogColor.value.copy(fog.color);
      u.fogDensity.value = fog.density;
      // the blades are unlit cards: scale them by how much light the sky gives (night is dark)
      if (light !== undefined) u.uLight.value.setRGB(1, 0.92, 0.8).multiplyScalar(light);
    },
  };
}

// ---------------------------------------------------------------- tree geometry
function lumpCluster(seed, radius, lumps = 6, squash = 0.82) {
  const random = rng(seed);
  const parts = [];
  for (let i = 0; i < lumps; i++) {
    const r = 0.5 + random() * 0.3;
    const g = new THREE.IcosahedronGeometry(r, 2);
    const a = random() * Math.PI * 2;
    const d = i === 0 ? 0 : 0.35 + random() * 0.3;
    g.translate(Math.cos(a) * d, (random() - 0.3) * 0.4, Math.sin(a) * d);
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    parts.push(g);
  }
  const g = mergeVertices(mergeGeometries(parts));
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm2(v.x * 3.1 + seed, v.z * 3.1 + v.y * 2.3, 3, seed);
    v.multiplyScalar((1 + n * 0.22) * radius);
    v.y *= squash;
    p.setXYZ(i, v.x, v.y, v.z);
    const shade = THREE.MathUtils.clamp(0.42 + 0.55 * (v.y / radius + 0.6), 0.35, 1.15) * (0.85 + 0.3 * fbm2(v.x * 9, v.z * 9 + v.y * 7, 2, seed + 3));
    colors.set([shade, shade, shade], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

let frondTex = null;
/** A date-palm frond drawn once: a midrib with ranks of narrow leaflets, transparent between them. */
function palmFrondTexture() {
  if (frondTex) return frondTex;
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const g = c.getContext("2d");
  g.clearRect(0, 0, 512, 128);
  g.strokeStyle = "#6b6a3a";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 64);
  g.lineTo(512, 64);
  g.stroke();
  for (let i = 0; i < 70; i++) {
    const x = 14 + i * 7;
    const len = 52 * Math.sin(Math.min(1, (x / 512) * 1.15) * Math.PI) + 6;
    for (const s of [-1, 1]) {
      const shade = 70 + Math.floor(Math.random() * 40);
      g.strokeStyle = `rgb(${shade + 10},${shade + 30},${Math.floor(shade * 0.55)})`;
      g.lineWidth = 3.2 * (1 - x / 700);
      g.beginPath();
      g.moveTo(x, 64);
      g.quadraticCurveTo(x + 10, 64 + s * len * 0.5, x + 22, 64 + s * len);
      g.stroke();
    }
  }
  frondTex = new THREE.CanvasTexture(c);
  frondTex.colorSpace = THREE.SRGBColorSpace;
  frondTex.anisotropy = 4;
  return frondTex;
}

function palmCrown() {
  // arching fronds radiating from the crown, the lower ones drooping
  const fronds = [];
  for (let i = 0; i < 16; i++) {
    const g = new THREE.PlaneGeometry(1, 1, 10, 1);
    g.translate(0.5, 0, 0);
    const p = g.attributes.position;
    const droop = 0.9 + (i % 3) * 0.5;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      p.setXYZ(k, x * 3.4, -x * x * droop + x * 0.9, y * 1.1 * (1 - x * 0.35));
    }
    g.rotateX(((i % 2) * 2 - 1) * 0.25);
    g.rotateZ(i < 6 ? 0.35 : i < 11 ? 0 : -0.3);
    g.rotateY((i / 16) * Math.PI * 2 + (i % 3) * 0.3);
    fronds.push(g);
  }
  return mergeGeometries(fronds);
}

function palmTrunk() {
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(Math.sin(i * 0.25) * 0.35, i / 8, 0));
  const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.06, 6, false);
  return g;
}

function swayPatch(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uWind = uniforms.uWind;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime; uniform float uWind;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 ip = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 ip = vec3(0.0);
        #endif
        float k = max(position.y + 0.5, 0.0);
        transformed.x += sin(uTime * 1.1 + ip.x * 0.3 + ip.z * 0.2) * uWind * 0.1 * k;
        transformed.z += cos(uTime * 0.9 + ip.z * 0.3) * uWind * 0.07 * k;`);
  };
}

/**
 * Instanced trees. kind: broadleaf | olive | palm | cypress | willow.
 * place(random) -> [x, z] | null; height(x, z) for ground; size range.
 */
let TREE_BUDGET = 60;
/** Cap scanned trees per stand (set lower on low quality). */
export function setTreeBudget(n) { TREE_BUDGET = n; }

const SCANNED = { broadleaf: { keys: ["tree1", "tree2"], tint: [1, 1, 1] }, olive: { keys: ["tree2", "tree1"], tint: [0.78, 0.88, 0.72], squat: 0.7 }, willow: { keys: ["tree1"], tint: [0.9, 1.0, 0.8] } };

// ---------------------------------------------------------------- foliage cards from the scans' leaf atlases
// leaf rectangles in the 1024px atlas (five on the top row, three below)
const LEAF_RECTS = [[10, 15, 150, 510], [165, 20, 185, 390], [365, 30, 135, 345], [525, 45, 145, 330], [705, 15, 135, 410], [10, 640, 185, 385], [215, 590, 155, 434], [425, 615, 155, 409]];
const foliageCache = new Map();

/** A transparent card covered with a cluster of real leaves cut from the atlas. Resolves to a texture. */
function foliageTexture(key) {
  if (foliageCache.has(key)) return foliageCache.get(key);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // cut the leaves out: the atlas background is black
      const src = document.createElement("canvas");
      src.width = img.width;
      src.height = img.height;
      const sg = src.getContext("2d");
      sg.drawImage(img, 0, 0);
      const data = sg.getImageData(0, 0, src.width, src.height);
      for (let i = 0; i < data.data.length; i += 4) {
        const l = data.data[i] + data.data[i + 1] + data.data[i + 2];
        data.data[i + 3] = l < 40 ? 0 : l < 90 ? ((l - 40) / 50) * 255 : 255;
      }
      sg.putImageData(data, 0, 0);
      const s = img.width / 1024;
      const c = document.createElement("canvas");
      c.width = c.height = 512;
      const g = c.getContext("2d");
      const r = rng(key.length * 31);
      // a dense spray of leaves from twigs radiating out of the card's lower centre
      for (let i = 0; i < 70; i++) {
        const [x, y, w, h] = LEAF_RECTS[Math.floor(r() * LEAF_RECTS.length)];
        const ang = (r() - 0.5) * Math.PI * 1.6;
        const dist = 40 + r() * 190;
        const cx = 256 + Math.sin(ang) * dist;
        const cy = 470 - Math.cos(ang) * dist * 0.95;
        const k = (0.16 + r() * 0.1) * (1 - dist / 700);
        g.save();
        g.translate(cx, cy);
        g.rotate(ang + (r() - 0.5) * 1.2);
        g.globalAlpha = 1;
        g.filter = `brightness(${0.75 + r() * 0.45})`;
        g.drawImage(src, x * s, y * s, w * s, h * s, (-w * k) / 2, -h * k, w * k, h * k);
        g.restore();
      }
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      resolve(tex);
    };
    img.onerror = () => resolve(null);
    img.src = new URL(`lib/tex/${key}_leaves${leafSuffix()}.webp`, document.baseURI).href;
  });
  foliageCache.set(key, p);
  return p;
}

/** Crossed foliage cards set at the branch tips of a scanned tree, in the model's space. */
function foliageCards(branchParts, random, cards = 150) {
  const tips = [];
  const v = new THREE.Vector3();
  let top = 0;
  for (const part of branchParts) {
    const pos = part.geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 3) {
      v.fromBufferAttribute(pos, i).applyMatrix4(part.matrix);
      top = Math.max(top, v.y);
      tips.push(v.clone());
    }
  }
  const high = tips.filter((p) => p.y > top * 0.38);
  const center = high.reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / Math.max(1, high.length));
  const geos = [];
  for (let i = 0; i < cards && high.length; i++) {
    const at = high[Math.floor(random() * high.length)];
    const size = 1.1 + random() * 0.9;
    for (const yaw of [0, Math.PI / 2]) {
      const g = new THREE.PlaneGeometry(size, size);
      g.translate(0, size * 0.42, 0);
      g.rotateX((random() - 0.5) * 0.9);
      g.rotateY(yaw + random() * Math.PI);
      g.translate(at.x, at.y - size * 0.25, at.z);
      // normals point out of the crown so the canopy shades as a mass, lit on top and dark inside
      const n = g.attributes.normal;
      const pp = g.attributes.position;
      for (let k = 0; k < n.count; k++) {
        const d = new THREE.Vector3(pp.getX(k), pp.getY(k), pp.getZ(k)).sub(center).normalize();
        n.setXYZ(k, d.x, d.y + 0.3, d.z);
      }
      geos.push(g);
    }
  }
  return geos.length ? mergeGeometries(geos) : null;
}

/** Instanced scanned trees (CC0 Poly Haven scans), filled in when the models arrive. */
function scannedTrees({ count, place, height, kind, random, size, tint, uniforms }) {
  const spec = SCANNED[kind];
  const group = new THREE.Group();
  const placements = spec.keys.map(() => []);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 20; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const sz = size[0] + random() * (size[1] - size[0]);
    // the scans stand about 5 m (tree1) and 3.4 m (tree2) tall
    const v = Math.floor(random() * spec.keys.length);
    const k = (sz / (spec.keys[v] === "tree1" ? 3.2 : 2.6)) * (0.85 + random() * 0.3);
    q.setFromAxisAngle(up, random() * 6.28);
    m.compose(new THREE.Vector3(x, height(x, z) - 0.15, z), q, new THREE.Vector3(k, k * (spec.squat ?? 1), k));
    placements[v].push(m.clone());
    n++;
  }
  const leafTint = new THREE.Color(...(tint ?? spec.tint));
  spec.keys.forEach((key, v) => {
    if (!placements[v].length) return;
    Promise.all([modelParts(key), foliageTexture(key)]).then(([parts, leafTex]) => {
      const wood = parts.filter((part) => !/leaves/i.test(part.material.name));
      const cards = leafTex ? foliageCards(wood.filter((part) => /branch/i.test(part.material.name)).concat(wood).slice(0, 2), rng(7 + v)) : null;
      if (cards) {
        const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.75, color: leafTint });
        swayPatch(leafMat, uniforms);
        wood.push({ geometry: cards, material: leafMat, matrix: new THREE.Matrix4() });
      }
      for (const part of wood) {
        const mat = part.material;
        const mesh = new THREE.InstancedMesh(part.geometry, mat, placements[v].length);
        placements[v].forEach((mm, i) => mesh.setMatrixAt(i, mm.clone().multiply(part.matrix)));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        group.add(mesh);
      }
    }).catch((err) => console.warn("vegetation:", err));
  });
  return group;
}

export function createTrees({ count, place, height, kind = "broadleaf", random = rng(9), size = [3, 7], tint = null }) {
  const uniforms = { uTime: { value: 0 }, uWind: { value: 0.3 } };
  if (SCANNED[kind]) {
    const group = scannedTrees({ count: Math.min(count, TREE_BUDGET), place, height, kind, random, size, tint, uniforms });
    return { group, update({ time, wind }) { uniforms.uTime.value = time; uniforms.uWind.value = wind; } };
  }
  const group = new THREE.Group();
  const trunkMat = SURFACES.bark();
  const leafMat = kind === "palm"
    ? new THREE.MeshStandardMaterial({ map: palmFrondTexture(), alphaTest: 0.4, roughness: 0.85, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true });
  swayPatch(leafMat, uniforms);
  let trunkGeo;
  let crowns;
  if (kind === "palm") {
    trunkGeo = palmTrunk();
    crowns = [palmCrown()];
  } else if (kind === "cypress") {
    trunkGeo = new THREE.CylinderGeometry(0.12, 0.2, 1, 6);
    trunkGeo.translate(0, 0.5, 0);
    const c = lumpCluster(41, 1, 4, 3.2);
    crowns = [c];
  } else {
    trunkGeo = new THREE.CylinderGeometry(kind === "olive" ? 0.22 : 0.18, kind === "olive" ? 0.42 : 0.35, 1, 7, 1);
    trunkGeo.translate(0, 0.5, 0);
    crowns = kind === "olive" ? [lumpCluster(3, 1, 7, 0.6), lumpCluster(8, 1, 6, 0.55)] : [lumpCluster(3, 1), lumpCluster(8, 1), lumpCluster(15, 1)];
  }
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const crownMeshes = crowns.map((g) => new THREE.InstancedMesh(g, leafMat, count));
  const counts = crowns.map(() => 0);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  const up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 20; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const h = height(x, z);
    const sz = size[0] + random() * (size[1] - size[0]);
    const v = Math.floor(random() * crowns.length);
    if (kind === "palm") {
      const trunkH = sz * 1.6;
      q.setFromAxisAngle(up, random() * 6.28);
      m.compose(p.set(x, h - 0.2, z), q, s.set(trunkH, trunkH, trunkH));
      trunks.setMatrixAt(n, m);
      const top = new THREE.Vector3(Math.sin(0.25 * 8) * 0.35, 1, 0).applyQuaternion(q).multiplyScalar(trunkH);
      m.compose(p.set(x + top.x, h - 0.2 + top.y, z + top.z), q, s.set(sz * 0.55, sz * 0.55, sz * 0.55));
      crownMeshes[0].setMatrixAt(counts[0], m);
      col.setHSL(0.16 + random() * 0.06, 0.25, 0.62 + random() * 0.2);
      crownMeshes[0].setColorAt(counts[0], col);
      counts[0]++;
    } else {
      const trunkH = kind === "cypress" ? sz * 0.3 : kind === "olive" ? sz * 0.45 : sz * 0.9;
      m.compose(p.set(x, h - 0.3, z), q.identity(), s.set(sz * 0.25, trunkH, sz * 0.25));
      trunks.setMatrixAt(n, m);
      q.setFromAxisAngle(up, random() * 6.28);
      const cs = kind === "cypress" ? [sz * 0.32, sz * 0.5, sz * 0.32] : kind === "olive" ? [sz * 0.8, sz * 0.7, sz * 0.8] : [sz * 0.75, sz * (0.75 + random() * 0.3), sz * 0.75];
      const cy = kind === "cypress" ? h + trunkH + sz * 0.9 : h + trunkH * 0.95;
      m.compose(p.set(x, cy, z), q, s.set(...cs));
      crownMeshes[v].setMatrixAt(counts[v], m);
      if (tint) col.setRGB(...tint).multiplyScalar(0.8 + random() * 0.4);
      else if (kind === "olive") col.setHSL(0.2 + random() * 0.04, 0.18 + random() * 0.1, 0.2 + random() * 0.06);
      else if (kind === "cypress") col.setHSL(0.3, 0.35, 0.08 + random() * 0.04);
      else col.setHSL(0.22 + random() * 0.09, 0.45 + random() * 0.2, 0.12 + random() * 0.1);
      crownMeshes[v].setColorAt(counts[v], col);
      counts[v]++;
    }
    n++;
  }
  trunks.count = n;
  trunks.castShadow = true;
  trunks.instanceMatrix.needsUpdate = true;
  crownMeshes.forEach((c, i) => {
    c.count = counts[i];
    c.instanceMatrix.needsUpdate = true;
    if (c.instanceColor) c.instanceColor.needsUpdate = true;
  });
  group.add(trunks, ...crownMeshes);
  return {
    group,
    update({ time, wind }) {
      uniforms.uTime.value = time;
      uniforms.uWind.value = wind;
    },
  };
}

/** Uniform random placement helpers. */
export const placers = {
  disc: (cx, cz, r, filter = null) => (random) => {
    const a = random() * Math.PI * 2;
    const d = Math.sqrt(random()) * r;
    const x = cx + Math.cos(a) * d;
    const z = cz + Math.sin(a) * d;
    return filter && !filter(x, z) ? null : [x, z];
  },
  box: (x0, z0, x1, z1, filter = null) => (random) => {
    const x = x0 + random() * (x1 - x0);
    const z = z0 + random() * (z1 - z0);
    return filter && !filter(x, z) ? null : [x, z];
  },
};


const ROCK_KEYS = ["boulder1", "boulder2", "boulder3", "rocks"];

/**
 * Scanned boulders scattered by place(random) -> [x, z] | null. size: [min, max] metres across.
 * Filled in when the models arrive.
 */
export function scatterRocks({ count, place, height, random = rng(17), size = [0.6, 3.5], keys = ROCK_KEYS, sink = 0.25, upright = false, bases = null, shadows = size[1] > 1.5 }) {
  count = scaled(count, 20);
  const group = new THREE.Group();
  const placements = keys.map(() => []);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let n = 0, tries = 0; n < count && tries < count * 20; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const v = Math.floor(random() * keys.length);
    // boulder scans are 1–1.5 m across; the small-rocks scan is 15 cm
    const base = bases?.[keys[v]] ?? (keys[v] === "rocks" ? 0.15 : 1.2);
    const k = (size[0] + random() ** 2 * (size[1] - size[0])) / base;
    e.set(upright ? 0 : (random() - 0.5) * 0.4, random() * 6.28, upright ? 0 : (random() - 0.5) * 0.4);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3(x, height(x, z) - sink * k * base, z), q, new THREE.Vector3(k, k * (upright ? 0.85 + random() * 0.3 : 0.7 + random() * 0.5), k));
    placements[v].push(m.clone());
    n++;
  }
  keys.forEach((key, v) => {
    if (!placements[v].length) return;
    modelParts(key).then((parts) => {
      for (const part of parts) {
        const mesh = new THREE.InstancedMesh(part.geometry, part.material, placements[v].length);
        placements[v].forEach((mm, i) => mesh.setMatrixAt(i, mm.clone().multiply(part.matrix)));
        mesh.instanceMatrix.needsUpdate = true;
        mesh.castShadow = shadows;
        mesh.userData.noShadow = !shadows;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        group.add(mesh);
      }
    }).catch((err) => console.warn("vegetation:", err));
  });
  return group;
}

/**
 * Scanned scrub and grass tussocks (CC0 scans; each instance is a small cluster of plants), upright on the
 * ground. size: [min, max] metres across a cluster.
 */
export function scatterPlants({ count, place, height, random = rng(23), size = [2, 5], keys = ["shrub", "grassClump"] }) {
  return scatterRocks({ count, place, height, random, size, keys, sink: 0.02, upright: true, bases: { shrub: 4, grassClump: 5.6 }, shadows: false });
}
