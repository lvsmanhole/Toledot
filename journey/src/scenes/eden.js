// Eden and the Fall: a river valley ringed by mountains, the two trees in the middle of the garden,
// the darkening, the flaming sword at the east gate, and the first strand of the lineage of promise.
// Story units 50–100.

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { NOISE, fbm2, rng } from "../engine/noise.js";
import { createStars } from "../engine/stars.js";
import { TERRAIN_LAYERS, splatMaterial } from "../kit/surface.js";
import { createTrees as kitTrees, scatterRocks } from "../kit/vegetation.js";
import { personMaterial, robedGeometry } from "../kit/figures.js";
import { livingCreature } from "../kit/cherub.js";

const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (x) => x * x * (3 - 2 * x);
const U0 = 50;
const SPAN = 50;
const at = (u) => (u - U0) / SPAN; // story unit -> local time

const LIFE = new THREE.Vector3(-9, 0, -12);
const KNOWLEDGE = new THREE.Vector3(10, 0, -15);
const CLEARING = new THREE.Vector2(0, -12);

// ------------------------------------------------------------------ terrain
const riverX = (z) => 22 * Math.sin(z * 0.015) - 4 * Math.sin(z * 0.041);

export function height(x, z) {
  const d = Math.abs(x - riverX(z));
  const n = fbm2(x * 0.011, z * 0.011, 5, 3);
  let h = 1.6 + n * 9;
  h += smooth(Math.min(1, Math.max(0, (d - 18) / 130))) * (22 + 14 * fbm2(x * 0.02, z * 0.02, 4, 9));
  const r = Math.hypot(x, z);
  const ridge = 1 - Math.abs(fbm2(x * 0.008, z * 0.008, 5, 17));
  const gorge = smooth(Math.min(1, Math.max(0, (d - 10) / 70)));
  h += smooth(Math.min(1, Math.max(0, (r - 170) / 140))) * (80 + 120 * ridge * ridge) * gorge;
  const c = 1 - smooth(Math.min(1, Math.max(0, (Math.hypot(x - CLEARING.x, z - CLEARING.y) - 24) / 34)));
  h = h * (1 - c) + (1.5 + n * 0.8) * c;
  const channel = 1 - smooth(Math.min(1, Math.max(0, (d - 3.5) / 5)));
  return h * (1 - channel) + -1.8 * channel;
}

function createTerrain(segments, quality) {
  const size = 760;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const splat = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    const e = 0.6;
    const slope = Math.hypot(height(x + e, z) - h, height(x, z + e) - h) / e;
    const dry = Math.min(1, Math.max(0, (h - 18) / 30 + fbm2(x * 0.02, z * 0.02, 3, 41) * 0.3));
    const rock = Math.min(1, Math.max(0, (slope - 0.35) * 2.2 + fbm2(x * 0.05, z * 0.05, 3, 23) * 0.6)) + Math.min(1, Math.max(0, (h - 150) / 40));
    const wet = Math.min(1, Math.max(0, (0.6 - h) / 1.6));
    const rest = Math.max(0, 1 - rock - wet);
    splat.set([rest * (1 - dry), rest * dry, wet, rock], i * 4);
  }
  geometry.setAttribute("splat", new THREE.BufferAttribute(splat, 4));
  geometry.computeVertexNormals();
  const set = TERRAIN_LAYERS.garden;
  const mesh = new THREE.Mesh(geometry, splatMaterial({ layers: set.layers, tints: set.tints, quality }));
  mesh.receiveShadow = true;
  return mesh;
}

function createWater() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSky: { value: new THREE.Color(0.6, 0.7, 0.8) },
      uDeep: { value: new THREE.Color(0.03, 0.08, 0.09) },
      uSun: { value: new THREE.Vector3(0, 0.2, -1) },
      fogColor: { value: new THREE.Color() },
      fogDensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSky, uDeep, uSun;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      ${NOISE}
      void main() {
        vec2 p = vWorld.xz * 0.18;
        float flow = uTime * 0.6;
        float nx = snoise(vec3(p.x, p.y + flow, uTime * 0.2)) + 0.5 * snoise(vec3(p * 2.7, uTime * 0.35));
        float nz = snoise(vec3(p.x + 7.0, p.y + flow, uTime * 0.2));
        vec3 n = normalize(vec3(nx * 0.12, 1.0, nz * 0.12));
        vec3 v = normalize(cameraPosition - vWorld);
        float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
        vec3 col = mix(uDeep, uSky, 0.25 + 0.75 * fres);
        float spec = pow(max(dot(reflect(-uSun, n), v), 0.0), 120.0);
        col += vec3(1.0, 0.9, 0.7) * spec * 2.5;
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
    fog: true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(760, 760, 1, 1), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  return mesh;
}

// ------------------------------------------------------------------ grass
function createGrass(count, random) {
  const blade = new THREE.BufferGeometry();
  // a tapered blade: 3 segments, 7 vertices
  const w = 0.055;
  const verts = [-w, 0, 0, w, 0, 0, -w * 0.8, 0.35, 0, w * 0.8, 0.35, 0, -w * 0.5, 0.7, 0, w * 0.5, 0.7, 0, 0, 1, 0];
  blade.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  blade.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 4, 5, 6]);
  const geometry = new THREE.InstancedBufferGeometry().copy(blade);
  const offsets = new Float32Array(count * 4); // x, y, z, rotation
  const shape = new Float32Array(count * 3); // height, lean, shade
  let n = 0;
  for (let tries = 0; n < count && tries < count * 6; tries++) {
    const r = Math.sqrt(random()) * (random() < 0.7 ? 70 : 170);
    const a = random() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * 1.35 + 10;
    const h = height(x, z);
    if (h < 0.5 || h > 30) continue;
    const slope = Math.hypot(height(x + 0.8, z) - h, height(x, z + 0.8) - h) / 0.8;
    if (slope > 0.7) continue;
    offsets.set([x, h - 0.05, z, random() * Math.PI], n * 4);
    shape.set([0.35 + random() * 0.65, (random() - 0.5) * 0.35, random()], n * 3);
    n++;
  }
  geometry.setAttribute("offset", new THREE.InstancedBufferAttribute(offsets.subarray(0, n * 4), 4));
  geometry.setAttribute("shape", new THREE.InstancedBufferAttribute(shape.subarray(0, n * 3), 3));
  geometry.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uWind: { value: 0.3 },
      uFall: { value: 0 },
      uLightCol: { value: new THREE.Color(1, 0.9, 0.75) },
      uSun: { value: new THREE.Vector3(0, 0.3, -1) },
      fogColor: { value: new THREE.Color() },
      fogDensity: { value: 0 },
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
      uniform vec3 uLightCol;
      uniform float uFall;
      varying float vTip;
      varying float vShade;
      #include <fog_pars_fragment>
      void main() {
        vec3 base = mix(vec3(0.02, 0.045, 0.012), vec3(0.04, 0.07, 0.016), vShade);
        vec3 tip = mix(vec3(0.17, 0.27, 0.06), vec3(0.3, 0.33, 0.1), vShade);
        vec3 col = mix(base, tip, vTip) * uLightCol;
        col = mix(col, col * vec3(0.8, 0.7, 0.55), uFall);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
    side: THREE.DoubleSide,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ forest
function canopyGeometry(seed, radius = 1) {
  // a cluster of lumps with smooth normals and baked light: lit crowns, darker hollows, leafy speckle
  const random = rng(seed);
  const lumps = [];
  const count = 5 + Math.floor(random() * 3);
  for (let i = 0; i < count; i++) {
    const r = 0.5 + random() * 0.3;
    const g = new THREE.IcosahedronGeometry(r, 3);
    const a = random() * Math.PI * 2;
    const d = i === 0 ? 0 : 0.35 + random() * 0.3;
    g.translate(Math.cos(a) * d, (random() - 0.3) * 0.4, Math.sin(a) * d);
    g.deleteAttribute("uv");
    g.deleteAttribute("normal");
    lumps.push(g);
  }
  const g = mergeVertices(mergeGeometries(lumps));
  const p = g.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm2(v.x * 3.1 + seed, v.z * 3.1 + v.y * 2.3, 3, seed);
    v.multiplyScalar((1 + n * 0.22) * radius);
    v.y *= 0.82;
    p.setXYZ(i, v.x, v.y, v.z);
    const shade = THREE.MathUtils.clamp(0.42 + 0.55 * (v.y / radius + 0.6), 0.35, 1.15) * (0.85 + 0.3 * fbm2(v.x * 9, v.z * 9 + v.y * 7, 2, seed + 3));
    colors.set([shade, shade, shade], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
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
        float k = max(position.y, 0.0);
        transformed.x += sin(uTime * 1.1 + ip.x * 0.3 + ip.z * 0.2) * uWind * 0.12 * k;
        transformed.z += cos(uTime * 0.9 + ip.z * 0.3) * uWind * 0.08 * k;`);
  };
}

function createForest(count, random, avoid, uniforms) {
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.35, 1, 6, 1);
  trunkGeo.translate(0, 0.5, 0);
  const variants = [canopyGeometry(3), canopyGeometry(8), canopyGeometry(15)];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x2a1f16, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true });
  swayPatch(leafMat, uniforms);
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count);
  const canopies = variants.map((g) => new THREE.InstancedMesh(g, leafMat, count));
  const counts = [0, 0, 0];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 20; tries++) {
    const x = (random() - 0.5) * 520;
    const z = (random() - 0.5) * 520;
    const h = height(x, z);
    if (h < 0.8 || h > 70) continue;
    if (Math.abs(x - riverX(z)) < 9) continue;
    if (Math.hypot(x - CLEARING.x, z - CLEARING.y) < 38) continue;
    if (avoid(x, z, h)) continue;
    const size = 3 + random() * 5 + (h > 30 ? -1 : 0);
    const trunkH = size * 0.9;
    m.compose(p.set(x, h - 0.3, z), q.identity(), s.set(size * 0.25, trunkH, size * 0.25));
    trunks.setMatrixAt(n, m);
    const v = Math.floor(random() * 3);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * 6.28);
    m.compose(p.set(x, h + trunkH * 0.95, z), q, s.set(size * 0.75, size * (0.75 + random() * 0.3), size * 0.75));
    canopies[v].setMatrixAt(counts[v], m);
    col.setHSL(0.22 + random() * 0.09, 0.45 + random() * 0.2, 0.12 + random() * 0.1);
    canopies[v].setColorAt(counts[v], col);
    counts[v]++;
    n++;
  }
  trunks.count = n;
  canopies.forEach((c, i) => { c.count = counts[i]; c.instanceMatrix.needsUpdate = true; if (c.instanceColor) c.instanceColor.needsUpdate = true; });
  const group = new THREE.Group();
  group.add(trunks, ...canopies);
  return group;
}

// ------------------------------------------------------------------ the two trees
function trunk(heightM, radius, colour, twist, seed) {
  const random = rng(seed);
  const points = [];
  for (let i = 0; i <= 12; i++) {
    const y = (i / 12) * heightM;
    points.push(new THREE.Vector3(Math.sin(i * 0.5 + twist) * 0.35 * (i / 12), y, Math.cos(i * 0.4) * 0.3 * (i / 12)));
  }
  const curve = new THREE.CatmullRomCurve3(points);
  const geo = new THREE.TubeGeometry(curve, 48, radius, 18, false);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const k = 1 + (1 - y / heightM) * 0.9 + (random() - 0.5) * 0.06;
    const c = curve.getPointAt(Math.min(1, Math.max(0, y / heightM)));
    p.setX(i, c.x + (p.getX(i) - c.x) * k);
    p.setZ(i, c.z + (p.getZ(i) - c.z) * k);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: colour, roughness: 0.95 }));
}

function lightCanopy(count, seed, radius, colorA, colorB) {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const a = new THREE.Color(colorA);
  const b = new THREE.Color(colorB);
  const c = new THREE.Color();
  for (let i = 0; i < count; i++) {
    const u = random() * 2 - 1;
    const th = random() * 6.283;
    const r = radius * Math.cbrt(random()) * (0.75 + 0.25 * fbm2(u * 3, th, 2, seed));
    const sr = Math.sqrt(1 - u * u);
    positions.set([Math.cos(th) * sr * r, u * r * 0.6, Math.sin(th) * sr * r], i * 3);
    c.copy(a).lerp(b, random());
    colors.set([c.r, c.g, c.b], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uGlow: { value: 1 }, uPixelRatio: { value: 1 }, uWind: { value: 0.3 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uPixelRatio, uWind;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec3 p = position;
        p.x += sin(uTime * 1.2 + position.y * 0.8 + position.z) * 0.12 * (1.0 + uWind * 3.0);
        p.y += sin(uTime * 0.7 + position.x) * 0.08;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * 60.0 / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uGlow;
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, d);
        if (a < 0.02) discard;
        gl_FragColor = vec4(vColor * uGlow * a, a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

function createTrees(uniforms) {
  const life = new THREE.Group();
  const lifeTrunk = trunk(9, 0.55, 0x3b2c1f, 0.4, 4);
  const lifeLeaves = new THREE.Mesh(canopyGeometry(21, 5.5), new THREE.MeshStandardMaterial({ color: 0x2f4a17, roughness: 0.8, emissive: 0x4a3510, emissiveIntensity: 1.1, vertexColors: true }));
  lifeLeaves.position.y = 9.5;
  const lifeGlow = lightCanopy(7000, 31, 7.2, 0xffd27a, 0xfff1c8);
  lifeGlow.position.y = 9.5;
  const lifeLight = new THREE.PointLight(0xffd88a, 40, 40, 1.6);
  lifeLight.position.y = 8;
  life.add(lifeTrunk, lifeLeaves, lifeGlow, lifeLight);
  life.position.copy(LIFE).setY(height(LIFE.x, LIFE.z) - 0.2);
  life.scale.setScalar(1.7);

  const knowledge = new THREE.Group();
  const kTrunk = trunk(7.5, 0.5, 0x23180f, 2.1, 6);
  const kLeaves = new THREE.Mesh(canopyGeometry(44, 5), new THREE.MeshStandardMaterial({ color: 0x1d3112, roughness: 0.85, vertexColors: true }));
  swayPatch(kLeaves.material, uniforms);
  kLeaves.position.y = 8;
  const random = rng(77);
  const surface = kLeaves.geometry.attributes.position;
  const fruitMat = new THREE.MeshStandardMaterial({ color: 0x7a1d10, roughness: 0.4, emissive: 0x5a1406, emissiveIntensity: 0.25 });
  const fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 12, 8), fruitMat, 70);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 70; i++) {
    let vi = 0;
    for (let k = 0; k < 20; k++) {
      vi = Math.floor(random() * surface.count);
      if (surface.getY(vi) > -1.5) break;
    }
    // hung inside the scanned crown that replaces the old canopy (about 10 m tall)
    m.makeTranslation(surface.getX(vi) * 0.6, 4.4 + surface.getY(vi) * 0.5, surface.getZ(vi) * 0.6);
    fruit.setMatrixAt(i, m);
  }
  knowledge.add(kTrunk, kLeaves, fruit);
  knowledge.position.copy(KNOWLEDGE).setY(height(KNOWLEDGE.x, KNOWLEDGE.z) - 0.2);
  knowledge.scale.setScalar(1.5);

  const serpent = createSerpent(uniforms);
  knowledge.add(serpent.group);

  return { life, lifeLeaves, lifeGlow, lifeLight, knowledge, fruitMat, serpent, kLeaves };
}

// The serpent (Genesis 3:1): coiled up the trunk of the tree of knowledge, its forepart reaching out of
// the branches toward where the woman stands. Built in the tree's local frame (the tree is scaled 1.5).
const EVE_SPOT = new THREE.Vector3(5.2, 0, -10.2);
const ADAM_SPOT = new THREE.Vector3(3.9, 0, -9.3);

function createSerpent(uniforms) {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const k = i / 60;
    const a = k * 14 + 0.6;
    const r = 0.78 - k * 0.16;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.25 + k * 2.6, Math.sin(a) * r));
  }
  // leave the trunk along a low bough and lean out toward the woman (local coordinates)
  const toEve = EVE_SPOT.clone().sub(KNOWLEDGE).divideScalar(1.5);
  const out = new THREE.Vector3(toEve.x, 0, toEve.z).normalize();
  const last = pts[pts.length - 1];
  for (let i = 1; i <= 6; i++) {
    const k = i / 6;
    const reach = 0.7 + k * 2.2;
    pts.push(new THREE.Vector3(
      out.x * reach + Math.sin(k * 5) * 0.18 * (1 - k),
      last.y + 0.3 * Math.sin(k * 3.1) - k * 1.15,
      out.z * reach + Math.cos(k * 5) * 0.18 * (1 - k),
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tube = new THREE.TubeGeometry(curve, 420, 0.16, 12, false);
  // taper: thin tail, full body, narrowing neck; bake a diamond scale pattern into vertex colours
  const pos = tube.attributes.position;
  const uv = tube.attributes.uv;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    const s = uv.getX(i);
    const around = uv.getY(i);
    curve.getPointAt(Math.min(1, s), c);
    v.fromBufferAttribute(pos, i).sub(c);
    const taper = Math.min(1, s * 6) * (1 - 0.45 * Math.max(0, (s - 0.9) / 0.1)) * 0.95 + 0.05;
    v.multiplyScalar(taper);
    pos.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
    const diamond = Math.abs(((s * 160) % 1) - 0.5) + Math.abs(((around * 6) % 1) - 0.5) < 0.42 ? 1 : 0;
    const belly = Math.abs(around - 0.5) < 0.12 ? 1 : 0;
    const base = belly ? [0.55, 0.48, 0.28] : diamond ? [0.42, 0.36, 0.12] : [0.1, 0.13, 0.05];
    colors.set(base, i * 3);
  }
  tube.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  tube.computeVertexNormals();
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.35, emissive: 0x2a2208, emissiveIntensity: 0.9, transparent: true, opacity: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float s = uv.x;
        float lift = smoothstep(0.8, 1.0, s);
        transformed.y += sin(uTime * 1.3 + s * 18.0) * 0.06 * lift;
        transformed.x += sin(uTime * 0.9 + s * 9.0) * 0.08 * lift;`);
  };
  const body = new THREE.Mesh(tube, material);
  // head: flattened wedge at the end of the curve, with two faint amber eyes
  const headGeo = new THREE.SphereGeometry(0.22, 16, 12);
  headGeo.scale(1.0, 0.62, 1.55);
  const head = new THREE.Mesh(headGeo, material);
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.4, 0.3), transparent: true, opacity: 0 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(0.09, 0.06, 0.12);
  eyeR.position.set(-0.09, 0.06, 0.12);
  head.add(eyeL, eyeR);
  const end = curve.getPointAt(1);
  const tangent = curve.getTangentAt(1);
  head.position.copy(end).addScaledVector(tangent, 0.12);
  head.lookAt(end.clone().addScaledVector(tangent, 2));
  const group = new THREE.Group();
  group.add(body, head);
  return {
    group,
    set(show, time) {
      material.opacity = show;
      eyeMat.opacity = show;
      group.visible = show > 0.01;
      head.rotation.z = Math.sin(time * 1.1) * 0.15;
      head.position.copy(end).addScaledVector(tangent, 0.12);
      head.position.y += Math.sin(time * 1.3 + 18.0) * 0.06;
    },
  };
}

// two silhouettes: figures are never detailed, only shapes in the light
function createFigures() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x0d0b09, roughness: 1 });
  const skins = personMaterial({ robe: 0x6a4a30, walk: 1 });
  // a human outline (legs, hips, chest, arms, neck, head), seen only as a shape against the light
  const limb = (r0, r1, len, x, y, z, rz = 0, rx = 0) => {
    const g = new THREE.CylinderGeometry(r1, r0, len, 10, 1);
    g.translate(0, len / 2, 0);
    g.rotateX(rx);
    g.rotateZ(rz);
    g.translate(x, y, z);
    return g;
  };
  const make = (h, woman) => {
    const g = new THREE.Group();
    const s = h * 1.7;
    const sh = woman ? 0.17 : 0.2; // half shoulder width
    const parts = [
      limb(0.055, 0.075, 0.47, -0.15, 0.03, 0.04, 0.1), // shins, a stride apart
      limb(0.055, 0.075, 0.47, 0.13, 0.03, -0.04, -0.08),
      limb(0.075, 0.1, 0.44, -0.11, 0.48, 0.02, 0.08), // thighs
      limb(0.075, 0.1, 0.44, 0.1, 0.48, -0.02, -0.06),
      limb(woman ? 0.17 : 0.15, woman ? 0.13 : 0.15, 0.2, 0, 0.9, 0), // hips and waist
      limb(woman ? 0.13 : 0.15, sh * 0.95, 0.36, 0, 1.08, 0), // chest
      limb(0.045, 0.05, 0.1, 0, 1.43, 0), // neck
      limb(0.055, 0.04, 0.3, -sh - 0.01, 1.41, 0, Math.PI - 0.3), // upper arms hanging from the shoulders
      limb(0.055, 0.04, 0.3, sh + 0.01, 1.41, 0, Math.PI + 0.3),
      limb(0.04, 0.032, 0.28, -sh - 0.1, 1.13, 0, Math.PI - 0.12), // forearms
      limb(0.04, 0.032, 0.28, sh + 0.1, 1.13, 0, Math.PI + 0.12),
    ];
    const head = new THREE.SphereGeometry(0.105, 14, 12);
    head.scale(0.9, 1.1, 1);
    head.translate(0, 1.6, 0.01);
    parts.push(head);
    if (woman) {
      // long hair down the back
      const hair = new THREE.CylinderGeometry(0.1, 0.13, 0.5, 12, 1, true);
      hair.translate(0, 1.38, -0.04);
      parts.push(hair);
    }
    const body = new THREE.Mesh(mergeGeometries(parts.map((p) => p.index ? p.toNonIndexed() : p)), mat);
    body.scale.setScalar(s / 1.72);
    g.add(body);
    return g;
  };
  const adam = make(1.05);
  const eve = make(0.98, true);
  // coats of skins for the walk out of the garden
  for (const [f, veiled] of [[adam, false], [eve, true]]) {
    const coat = new THREE.Mesh(robedGeometry(f === adam ? 1.82 : 1.7, { veiled, detail: "high" }), skins);
    coat.visible = false;
    f.add(coat);
    f.userData.coat = coat;
  }
  return { adam, eve };
}

// ------------------------------------------------------------------ particles: mist, motes, fire, birds
function createMist(count, random) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const x = (random() - 0.5) * 260;
    const z = (random() - 0.5) * 300 + 20;
    positions.set([x, Math.max(0.5, height(x, z)) + 1 + random() * 6, z], i * 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(1, 0.96, 0.88) }, uOpacity: { value: 0.18 }, uPixelRatio: { value: 1 }, uWind: { value: 0.3 } },
    vertexShader: /* glsl */ `
      uniform float uTime, uPixelRatio, uWind;
      void main() {
        vec3 p = position;
        p.x += mod(uTime * (0.6 + uWind * 6.0) + position.z * 3.0, 60.0) - 30.0;
        p.y += sin(uTime * 0.3 + position.x) * 0.5;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * 900.0 / -mv.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * a * uOpacity;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createMotes(count, random) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(random()) * 40;
    const a = random() * 6.283;
    positions.set([Math.cos(a) * r, 1 + random() * 12, Math.sin(a) * r - 12], i * 3);
    seeds[i] = random() * 100;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uColor: { value: new THREE.Color(1, 0.85, 0.5) }, uOpacity: { value: 1 }, uWind: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime, uPixelRatio, uWind;
      varying float vTw;
      void main() {
        vec3 p = position;
        p.x += sin(uTime * 0.4 + seed) * 1.5 + mod(uTime * uWind * 12.0 + seed * 7.0, 80.0) * uWind;
        p.y += sin(uTime * 0.5 + seed * 2.0) * 1.2 - uWind * mod(uTime * 2.0 + seed, 6.0);
        p.z += cos(uTime * 0.3 + seed) * 1.5;
        vTw = 0.5 + 0.5 * sin(uTime * 3.0 + seed * 5.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * 7.0 / -mv.z * 10.0;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vTw * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createFire(count, random) {
  // a wall of flame across the east way, at x = GATE_X
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions.set([(random() - 0.5) * 3, 0, (random() - 0.5) * 70], i * 3);
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("seed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 }, uAmount: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float seed;
      uniform float uTime, uPixelRatio, uAmount;
      varying float vLife;
      varying float vSeed;
      void main() {
        float life = fract(uTime * (0.35 + seed * 0.4) + seed * 13.0);
        vLife = life;
        vSeed = seed;
        vec3 p = position;
        float edge = 1.0 - smoothstep(25.0, 35.0, abs(p.z));
        p.y = life * (14.0 + 16.0 * seed) * uAmount * (0.4 + 0.6 * edge);
        p.x += sin(uTime * 3.0 + seed * 40.0 + life * 6.0) * 0.6 * life;
        p.z += sin(uTime * 2.0 + seed * 20.0) * 0.4;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * (0.5 + (1.0 - life)) * 70.0 / -mv.z * uAmount;
      }
    `,
    fragmentShader: /* glsl */ `
      varying float vLife;
      varying float vSeed;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a = a * (1.0 - vLife * 0.7) * 0.9;
        vec3 col = mix(vec3(1.0, 0.62, 0.22), vec3(0.65, 0.12, 0.02), smoothstep(0.05, 0.6, vLife));
        if (a < 0.008) discard;
        gl_FragColor = vec4(col * a * 1.2, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function createFlameCurtain(width, heightM) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uSeed: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAmount, uSeed;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        float h = vUv.y;
        vec2 p = vec2(vUv.x * ${(width / 2.2).toFixed(1)}, h * 1.4);
        float n = fbm(vec3(p.x + uSeed, p.y - uTime * 1.7, uTime * 0.25));
        float n2 = fbm(vec3(p.x * 2.4 - uSeed, p.y * 2.2 - uTime * 2.6, 3.0));
        float shape = (1.0 - h) * 1.5 + n * 1.1 + n2 * 0.45 - 0.75 - h * h * 0.6 - (1.0 - uAmount) * 1.8;
        float sides = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x);
        float f = smoothstep(0.0, 0.32, shape) * sides;
        vec3 col = mix(vec3(0.55, 0.07, 0.01), vec3(1.0, 0.5, 0.1), smoothstep(0.05, 0.55, f));
        col = mix(col, vec3(1.0, 0.86, 0.55), smoothstep(0.75, 1.0, f));
        if (f < 0.004) discard;
        gl_FragColor = vec4(col * f * 0.42, f * 0.6);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, heightM, 1, 1), material);
  mesh.rotation.y = Math.PI / 2; // spans z, faces east-west
  mesh.position.y = heightM / 2;
  return mesh;
}

function createBirds(count, random) {
  const wing = new THREE.BufferGeometry();
  wing.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.3, -1, 0, 0, 0, 0, -0.2, 0, 0, 0.3, 1, 0, 0, 0, 0, -0.2], 3));
  const geometry = new THREE.InstancedBufferGeometry().copy(wing);
  const data = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) data.set([random() * 6.28, 30 + random() * 50, 25 + random() * 25, random()], i * 4);
  geometry.setAttribute("bird", new THREE.InstancedBufferAttribute(data, 4));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLeave: { value: 0 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute vec4 bird;
      uniform float uTime, uLeave;
      #include <fog_pars_vertex>
      void main() {
        float a = bird.x + uTime * (0.08 + bird.w * 0.05);
        vec3 c = vec3(cos(a) * bird.y, bird.z + sin(uTime * 0.5 + bird.w * 6.0) * 2.0, sin(a) * bird.y - 20.0);
        c += vec3(1.0, 0.3, 0.0) * uLeave * 400.0;
        vec3 p = position * 0.9;
        p.y += abs(position.x) * sin(uTime * 9.0 + bird.w * 20.0) * 0.6;
        float h = -a;
        p = vec3(p.x * cos(h) - p.z * sin(h), p.y, p.x * sin(h) + p.z * cos(h));
        vec4 mvPosition = modelViewMatrix * vec4(p + c, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      #include <fog_pars_fragment>
      void main() { gl_FragColor = vec4(vec3(0.05, 0.045, 0.04), 1.0);
        #include <fog_fragment>
      }
    `,
    side: THREE.DoubleSide,
    fog: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}

function createThread() {
  // from where Adam stands outside the gate, eastward into the world (and the acts that follow)
  const pts = [[66, -1], [80, -4], [98, -8], [118, -10], [138, -8], [158, -12]].map(([x, z], i) =>
    new THREE.Vector3(x, Math.max(0, height(x, z)) + 1.4 + i * 0.5, z));
  const curve = new THREE.CatmullRomCurve3(pts);
  const material = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uTime;
      varying vec2 vUv;
      void main() {
        float on = 1.0 - smoothstep(uDraw - 0.04, uDraw, vUv.x);
        float pulse = 0.7 + 0.3 * sin(vUv.x * 60.0 - uTime * 3.0);
        float a = on * smoothstep(0.0, 0.05, vUv.x);
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(1.0, 0.62, 0.2) * 1.5 * pulse * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 400, 0.14, 8, false), material);
}

// ------------------------------------------------------------------ camera path
const KEYS = [
  [50, [0, 175, 300], [0, 60, 0]],
  [53, [0, 115, 240], [0, 25, 0]],
  [57, [-24, 58, 170], [0, 10, 30]],
  [62, [18, 24, 95], [0, 7, -10]],
  [67, [12, 9.5, 42], [0, 8, -13]],
  [72, [-20, 8, 30], [2, 9, -12]],
  [76.5, [-5, 4.6, 5], [8, 4.6, -13]],
  [80.5, [-1.5, 3.1, 1.5], [6.5, 3.2, -11.5]],
  [84, [-4, 3.6, 5], [5, 2.2, -10]],
  [89, [26, 6, 12], [0, 5, -10]],
  [94, [86, 12, 2], [0, 8, 0]],
  [97, [74, 16, 18], [110, 9, -6]],
  [100, [64, 26, 22], [200, 34, -14]],
];

function pathCurves() {
  const pos = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[1])), false, "centripetal");
  const look = new THREE.CatmullRomCurve3(KEYS.map((k) => new THREE.Vector3(...k[2])), false, "centripetal");
  return { pos, look };
}

function pathParam(u) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [a] = KEYS[i];
    const [b] = KEYS[i + 1];
    if (u <= b) {
      const k = (u - a) / (b - a);
      return (i + smooth(Math.max(0, Math.min(1, k))) * 0.6 + Math.max(0, Math.min(1, k)) * 0.4) / (KEYS.length - 1);
    }
  }
  return 1;
}

export function createEden(ctx) {
  const low = ctx.quality === "low";
  const random = rng(101);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);
  const fog = new THREE.FogExp2(0xa9a487, 0.0026);
  scene.fog = fog;

  const sky = new Sky();
  sky.scale.setScalar(2500);
  const skyU = sky.material.uniforms;
  skyU.turbidity.value = 3;
  skyU.rayleigh.value = 1.1;
  skyU.mieCoefficient.value = 0.0022;
  skyU.mieDirectionalG.value = 0.78;

  const curves = pathCurves();
  const pathPts = curves.pos.getSpacedPoints(120);
  const avoid = (x, z, h) => pathPts.some((p) => Math.hypot(p.x - x, p.z - z) < 16 && p.y - h < 22);

  const shared = { uTime: { value: 0 }, uWind: { value: 0.3 } };
  const terrain = createTerrain(low ? 160 : 260, ctx.quality);
  const water = createWater();
  const grass = createGrass(low ? 30000 : 120000, random);
  const forest = new THREE.Group();
  const near = (x, z) => { const h0 = height(x, z); return h0 > 0.8 && h0 < 40 && Math.abs(x - riverX(z)) > 9 && Math.hypot(x - CLEARING.x, z - CLEARING.y) > 34 && !avoid(x, z, h0); };
  const scanned = kitTrees({ count: low ? 30 : 70, place: (r) => { const x = (r() - 0.5) * 300; const z = (r() - 0.5) * 300; return near(x, z) ? [x, z] : null; }, height, kind: "broadleaf", random, size: [4, 8] });
  forest.add(scanned.group, createForest(low ? 140 : 320, random, (x, z, h0) => Math.hypot(x, z) < 160 || avoid(x, z, h0), shared));
  forest.add(scatterRocks({ count: low ? 40 : 90, place: (r) => { const x = (r() - 0.5) * 600; const z = (r() - 0.5) * 600; const h0 = height(x, z); return h0 > 3 && Math.hypot(x - CLEARING.x, z - CLEARING.y) > 40 && !avoid(x, z, h0) ? [x, z] : null; }, height, size: [0.8, 4] }));
  const trees = createTrees(shared);
  // the two trees as real trees: scanned trunks and leaf canopies in place of the sculpted blobs
  const lifeScan = kitTrees({ count: 1, place: () => [LIFE.x, LIFE.z], height, kind: "broadleaf", size: [11, 11], tint: [1.2, 1.12, 0.7], random: rng(3) });
  const knowledgeScan = kitTrees({ count: 1, place: () => [KNOWLEDGE.x, KNOWLEDGE.z], height, kind: "broadleaf", size: [10, 10], tint: [0.7, 0.82, 0.62], random: rng(11) });
  trees.lifeLeaves.visible = false;
  trees.life.children[0].visible = false;
  trees.kLeaves.visible = false;
  trees.knowledge.children[0].visible = false;
  scene.add(lifeScan.group, knowledgeScan.group);
  const { adam, eve } = createFigures();
  const mist = createMist(low ? 50 : 120, random);
  const motes = createMotes(low ? 300 : 900, random);
  const fire = createFire(low ? 500 : 1400, random);
  const curtains = [createFlameCurtain(72, 17), createFlameCurtain(64, 13)];
  curtains[1].material.uniforms.uSeed.value = 7.3;
  const GATE_X = 46;
  fire.position.set(GATE_X, height(GATE_X, 0) + 0.2, 0);
  const gate = new THREE.Group();
  gate.position.set(GATE_X, height(GATE_X, 0) - 0.4, 0);
  curtains[1].position.x = -2.5;
  gate.add(...curtains);
  const sword = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 11), new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        float core = exp(-pow((vUv.x - 0.5) * 16.0, 2.0));
        float halo = exp(-pow((vUv.x - 0.5) * 4.0, 2.0)) * 0.25;
        float taper = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.75, vUv.y);
        float a = (core + halo) * taper;
        gl_FragColor = vec4(vec3(1.0, 0.82, 0.5) * a * 2.2, a);
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  const swordPivot = new THREE.Group();
  swordPivot.position.set(GATE_X, height(GATE_X, 2) + 6, 2);
  swordPivot.add(sword);
  const fireLight = new THREE.PointLight(0xff8a3a, 0, 80, 1.4);
  fireLight.position.set(GATE_X, height(GATE_X, 0) + 5, 0);
  // the cherubims at the east of the garden, as Ezekiel saw them (Ezekiel 10:20)
  const cherubim = [livingCreature({ scale: 1.25, wheelSide: 1, seed: 3 }), livingCreature({ scale: 1.25, wheelSide: -1, seed: 7 })];
  cherubim.forEach((c, i) => {
    const z = i === 0 ? -12 : 15;
    c.group.position.set(GATE_X + 1.5, height(GATE_X, z) - 0.2, z);
    c.group.rotation.y = Math.PI / 2; // facing east, toward the way out
  });
  const birds = createBirds(low ? 20 : 45, random);
  const thread = createThread();
  const stars = createStars({ count: low ? 5000 : 12000, radius: 1600, seed: 41, size: 1.6 });

  const sunLight = new THREE.DirectionalLight(0xffe2b8, 2.6);
  const hemi = new THREE.HemisphereLight(0xbfd1e6, 0x3a3020, 1.0);
  sunLight.castShadow = !low;
  sunLight.shadow.mapSize.set(2048, 2048);
  Object.assign(sunLight.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 800 });
  sunLight.shadow.bias = -0.0004;
  sunLight.shadow.normalBias = 0.05;
  scene.add(sunLight.target);
  scene.add(sky, terrain, water, grass, forest, trees.life, trees.knowledge, adam, eve, mist, motes, fire, swordPivot, fireLight, gate, ...cherubim.map((c) => c.group), birds, thread, stars, sunLight, hemi);

  const sun = new THREE.Vector3();
  const warmFog = new THREE.Color(0xa9a487);
  const coldFog = new THREE.Color(0x2c323d);
  const p = new THREE.Vector3();
  const l = new THREE.Vector3();

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ local: t, time, pixelRatio, reducedMotion }) {
      const u = U0 + t * SPAN;
      const fall = smooth(ramp(t, at(74), at(90)));
      const exile = smooth(ramp(t, at(88), at(96)));
      const dusk = smooth(ramp(t, at(80), at(97)));

      // sky and light: golden morning in the garden, then a cold dusk after the fall
      const elevation = THREE.MathUtils.degToRad(THREE.MathUtils.lerp(19, 0.8, dusk));
      const azimuth = THREE.MathUtils.degToRad(245 + 25 * dusk);
      sun.setFromSphericalCoords(1, Math.PI / 2 - elevation, azimuth);
      skyU.sunPosition.value.copy(sun);
      skyU.turbidity.value = THREE.MathUtils.lerp(3, 10, fall);
      skyU.rayleigh.value = THREE.MathUtils.lerp(1.1, 3.0, fall);
      sunLight.target.position.copy(camera.position).add(camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize().multiplyScalar(40));
      sunLight.position.copy(sun).multiplyScalar(300).add(sunLight.target.position);
      sunLight.intensity = THREE.MathUtils.lerp(2.6, 0.35, dusk);
      sunLight.color.setHSL(0.09, 0.7, THREE.MathUtils.lerp(0.82, 0.55, dusk));
      hemi.intensity = THREE.MathUtils.lerp(1.0, 0.25, dusk) + 0.25 * smooth(ramp(t, at(95), 1));
      fog.color.copy(warmFog).lerp(coldFog, dusk);
      fog.density = THREE.MathUtils.lerp(0.0026, 0.0042, fall) - 0.0012 * smooth(ramp(t, at(95), 1));

      // wind rises with the fall
      const wind = 0.25 + 1.4 * fall;
      shared.uTime.value = time;
      lifeScan.update({ time, wind: shared.uWind.value });
      knowledgeScan.update({ time, wind: shared.uWind.value });
      shared.uWind.value = wind;
      const gm = grass.material.uniforms;
      gm.uTime.value = time;
      gm.uWind.value = wind;
      gm.uFall.value = fall;
      gm.uLightCol.value.setRGB(1, 0.9, 0.78).multiplyScalar(THREE.MathUtils.lerp(0.8, 0.3, dusk));
      for (const m of [grass.material, water.material, birds.material]) {
        m.uniforms.fogColor.value.copy(fog.color);
        m.uniforms.fogDensity.value = fog.density;
      }
      const wm = water.material.uniforms;
      wm.uTime.value = time;
      wm.uSun.value.copy(sun);
      wm.uSky.value.setRGB(0.62, 0.72, 0.8).lerp(new THREE.Color(0.08, 0.1, 0.13), dusk);

      for (const pts of [mist, motes, trees.lifeGlow, fire]) {
        pts.material.uniforms.uTime.value = time;
        pts.material.uniforms.uPixelRatio.value = pixelRatio;
      }
      mist.material.uniforms.uWind.value = wind * 0.3;
      mist.material.uniforms.uColor.value.copy(fog.color).lerp(new THREE.Color(1, 1, 1), 0.3);
      mist.material.uniforms.uOpacity.value = 0.16 + 0.08 * fall;
      // motes: golden pollen in the garden, then blown dust (Genesis 3:19)
      const mm = motes.material.uniforms;
      mm.uWind.value = 0.25 * smooth(ramp(t, at(83), at(88)));
      mm.uColor.value.setRGB(1, 0.85, 0.5).lerp(new THREE.Color(0.55, 0.48, 0.4), fall);
      mm.uOpacity.value = 1 - 0.95 * exile;
      trees.lifeGlow.material.uniforms.uGlow.value = THREE.MathUtils.lerp(1.1, 0.25, fall) * (1 - 0.6 * exile);
      trees.lifeGlow.material.uniforms.uWind.value = wind * 0.2;
      trees.lifeLight.intensity = THREE.MathUtils.lerp(40, 10, fall);
      trees.lifeLeaves.material.emissiveIntensity = THREE.MathUtils.lerp(1.1, 0.12, fall);
      // the serpent: first glimpsed in the boughs as the garden scene closes, present through the temptation
      trees.serpent.set(smooth(ramp(t, at(72.5), at(75))) * (1 - smooth(ramp(t, at(83.5), at(85.5)))), time);
      const fruitGlow = smooth(ramp(t, at(78.5), at(80.5))) * (1 - smooth(ramp(t, at(83), at(86))));
      trees.fruitMat.emissiveIntensity = 0.25 + 2.2 * fruitGlow;
      birds.material.uniforms.uTime.value = time;
      birds.material.uniforms.uLeave.value = smooth(ramp(t, at(75), at(85)));
      birds.visible = t < at(86);

      // the figures stand near the tree of life; after the fall they walk out eastward
      // ...walk to the tree of knowledge for the temptation, then out eastward
      const approach = smooth(ramp(t, at(73.5), at(76.5)));
      const walk = smooth(ramp(t, at(85.5), at(92.5)));
      const eveAt = new THREE.Vector3(-14.9, 0, -1.9).lerp(EVE_SPOT, approach);
      const adamAt = new THREE.Vector3(-14, 0, -3).lerp(ADAM_SPOT, approach);
      adam.position.set(THREE.MathUtils.lerp(adamAt.x, 66, walk), 0, THREE.MathUtils.lerp(adamAt.z, -1, walk));
      eve.position.set(THREE.MathUtils.lerp(eveAt.x, 65.4, walk), 0, THREE.MathUtils.lerp(eveAt.z, 0.1, walk));
      for (const f of [adam, eve]) f.position.y = Math.max(0, height(f.position.x, f.position.z)) - 0.05;
      adam.rotation.y = eve.rotation.y = walk > 0 ? -Math.PI / 2 : 0.3;
      for (const f of [adam, eve]) {
        const clothed = t > at(85);
        f.userData.coat.visible = clothed;
        f.children.forEach((c) => { if (c !== f.userData.coat) c.visible = !clothed; });
      }
      const walking = (approach > 0 && approach < 1) || (walk > 0 && walk < 1);
      const bob = walking ? Math.abs(Math.sin(time * 4)) * 0.06 : 0;
      adam.position.y += bob;
      eve.position.y += bob;

      // the flaming sword which turned every way
      const flame = smooth(ramp(t, at(90.5), at(93)));
      fire.material.uniforms.uAmount.value = flame;
      for (const c of curtains) {
        c.material.uniforms.uAmount.value = flame;
        c.material.uniforms.uTime.value = time;
      }
      gate.visible = flame > 0.005;
      fireLight.intensity = flame * 160;
      swordPivot.visible = flame > 0.01;
      swordPivot.rotation.y = time * (reducedMotion ? 0.4 : 1.6);
      swordPivot.rotation.z = Math.sin(time * 0.7) * 0.25;
      sword.scale.setScalar(Math.max(0.001, flame));
      const guard = smooth(ramp(t, at(89.6), at(92.5)));
      for (const c of cherubim) c.set(guard, time, reducedMotion, pixelRatio);

      // the lineage of promise begins
      thread.material.uniforms.uDraw.value = smooth(ramp(t, at(94), at(99.5)));
      stars.material.uniforms.uOpacity.value = smooth(ramp(t, at(90), at(98)));
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      stars.visible = t > at(89);
      thread.material.uniforms.uTime.value = time;

      // camera
      const k = pathParam(u);
      curves.pos.getPoint(k, p);
      curves.look.getPoint(k, l);
      if (!reducedMotion) {
        p.x += Math.sin(time * 0.21) * 0.6;
        p.y += Math.sin(time * 0.17) * 0.4;
      }
      p.y = Math.max(p.y, height(p.x, p.z) + 1.6);
      camera.position.copy(p);
      camera.lookAt(l);

      const fireNear = flame * (1 - smooth(ramp(t, at(97), 1)));
      return {
        grade: {
          saturation: THREE.MathUtils.lerp(1.05, 0.42, fall) + 0.38 * flame,
          exposure: THREE.MathUtils.lerp(0.95, 0.9, dusk) + 0.25 * smooth(ramp(t, at(95), 1)),
          bloom: 0.32 + 0.12 * flame,
          threshold: 0.9,
          tint: [THREE.MathUtils.lerp(1.04, 0.86, fall), THREE.MathUtils.lerp(1.0, 0.92, fall), THREE.MathUtils.lerp(0.92, 1.08, fall)],
        },
        audio: {
          drone: 0.3 + 0.4 * fall,
          shimmer: 0.35 * (1 - fall),
          water: 0.6 * (1 - exile) * smooth(ramp(t, at(54), at(58))),
          birds: (1 - smooth(ramp(t, at(74), at(78)))) * smooth(ramp(t, at(53), at(56))),
          wind: 0.2 + 0.8 * fall,
          fire: fireNear,
        },
      };
    },
  };
}
