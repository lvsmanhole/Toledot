// Vegetation: instanced grass/wheat/reeds with wind, and instanced trees (broadleaf, olive, palm, cypress).

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { fbm2, rng } from "../engine/noise.js";

/**
 * Blades placed by `place(random) -> [x, z] | null` on `height(x, z)`.
 * kind: grass | wheat | reeds — changes blade shape and colour.
 */
export function createBlades({ count, place, height, kind = "grass", random = rng(5), minH = 0.4, maxH = 40 }) {
  const shapes = {
    grass: { w: 0.055, h: [0.35, 1.0], base: [[0.02, 0.045, 0.012], [0.04, 0.07, 0.016]], tip: [[0.17, 0.27, 0.06], [0.3, 0.33, 0.1]], head: 0 },
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
      uTime: { value: 0 }, uWind: { value: 0.3 }, uLight: { value: new THREE.Color(1, 0.92, 0.8) },
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
      varying float vTip;
      varying float vShade;
      #include <fog_pars_fragment>
      void main() {
        vec3 base = mix(${v3(s.base[0])}, ${v3(s.base[1])}, vShade);
        vec3 tip = mix(${v3(s.tip[0])}, ${v3(s.tip[1])}, vShade);
        float headBand = ${s.head.toFixed(1)} * smoothstep(0.72, 0.8, vTip);
        vec3 col = mix(base, tip, vTip) * (1.0 + headBand * 0.4) * uLight;
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

function palmCrown() {
  // drooping fronds: thin tapered strips radiating from the top
  const fronds = [];
  for (let i = 0; i < 11; i++) {
    const g = new THREE.PlaneGeometry(1, 1, 8, 1);
    g.translate(0.5, 0, 0);
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      p.setXYZ(k, x * 3.2, -x * x * 1.6 + x * 0.6, y * 0.55 * (1 - x * 0.85));
    }
    g.rotateX(0.35 * ((i % 2) * 2 - 1));
    g.rotateY((i / 11) * Math.PI * 2 + (i % 3) * 0.2);
    g.deleteAttribute("uv");
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
export function createTrees({ count, place, height, kind = "broadleaf", random = rng(9), size = [3, 7], tint = null }) {
  const uniforms = { uTime: { value: 0 }, uWind: { value: 0.3 } };
  const group = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: kind === "olive" ? 0x4a4036 : kind === "palm" ? 0x5a4632 : 0x2a1f16, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: kind !== "palm", side: kind === "palm" ? THREE.DoubleSide : THREE.FrontSide });
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
      col.setHSL(0.2 + random() * 0.05, 0.4, 0.16 + random() * 0.06);
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
