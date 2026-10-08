// Eden and the Fall. The garden is on a mountain: "Eden the garden of God ... the holy mountain of God"
// (Ezekiel 28:13-14), above a sea of mist (Genesis 2:6). A river rises in the garden and at the edge of
// the mountain parts into four heads, Pison, Gihon, Hiddekel and Euphrates, that fall away to the lands
// below (Genesis 2:10-14). Gold, bdellium and onyx lie in the land (2:11-12); every precious stone and the
// stones of fire are on the mountain (Ezekiel 28:13-14). The serpent is the shining nachash, a seraph-like
// fiery serpent of bronze, until it is cursed to go upon its belly (Genesis 3:14). Then the darkening, the
// flaming sword at the east gate, and the first strand of the lineage of promise. Story units 50–100.

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

// ------------------------------------------------------------------ terrain: the mountain of God
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const riverX = (z) => 22 * Math.sin(z * 0.015) - 4 * Math.sin(z * 0.041);
const RIM = 175; // the edge of the mountain-top garden
const SPRING = new THREE.Vector2(riverX(-150), -150); // where the river rises
const PART = new THREE.Vector2(riverX(132), 132); // where it parts into four heads
const DROP = 430; // how far the mountain falls to the lands below
// the four heads, fanning out from the parting point and down the mountain (Genesis 2:11-14)
const HEADS = [
  { name: "Pison", angle: 0.55, seed: 1 },
  { name: "Gihon", angle: 1.2, seed: 2 },
  { name: "Hiddekel", angle: 1.85, seed: 3 },
  { name: "Euphrates", angle: 2.5, seed: 4 },
].map((r) => ({ ...r, dir: new THREE.Vector2(Math.cos(r.angle), Math.sin(r.angle)) }));
const HEAD_LEN = 1300;
const headWiggle = (head, s) => 26 * Math.sin(s * 0.009 + head.seed * 1.7) * smooth(clamp01(s / 90));
const headWidth = (s) => 4.5 + s * 0.016;
/** Distance from (x, z) to a head's centreline, and how far along it the nearest point lies. */
function headNear(head, x, z) {
  const dx = x - PART.x;
  const dz = z - PART.y;
  const s = dx * head.dir.x + dz * head.dir.y;
  if (s < 0 || s > HEAD_LEN) return null;
  const side = -dx * head.dir.y + dz * head.dir.x;
  return { s, d: Math.abs(side - headWiggle(head, s)) };
}
function headPoint(head, s, out = new THREE.Vector2()) {
  const w = headWiggle(head, s);
  return out.set(PART.x + head.dir.x * s - head.dir.y * w, PART.y + head.dir.y * s + head.dir.x * w);
}
// the mountain falls away beyond the rim
const fallAt = (r) => smooth(clamp01((r - RIM) / 320));
// how far along each head its carved bed reaches: through the rim hills to the brink
for (const head of HEADS) {
  const v = new THREE.Vector2();
  head.brink = 0;
  for (let s = 0; s < 400; s += 1) if (headPoint(head, s, v).length() > RIM + 18) { head.brink = s; break; }
}

function baseHeight(x, z) {
  const n = fbm2(x * 0.011, z * 0.011, 5, 3);
  let h = 1.6 + n * 9;
  const d = Math.abs(x - riverX(z));
  h += smooth(clamp01((d - 18) / 130)) * (10 + 8 * fbm2(x * 0.02, z * 0.02, 4, 9));
  const r = Math.hypot(x, z);
  // low hills along the rim of the garden, then the long fall to the lowlands
  h += smooth(clamp01((r - 110) / 60)) * (1 - smooth(clamp01((r - RIM) / 30))) * (8 + 10 * fbm2(x * 0.03, z * 0.03, 3, 5));
  const f = fallAt(r);
  h -= f * DROP;
  h += f * 70 * fbm2(x * 0.004, z * 0.004, 5, 17);
  const c = 1 - smooth(clamp01((Math.hypot(x - CLEARING.x, z - CLEARING.y) - 24) / 34));
  return h * (1 - c) + (1.5 + n * 0.8) * c;
}

export function height(x, z) {
  let h = baseHeight(x, z);
  // the river of the garden, from its spring to the parting
  const along = smooth(clamp01((z - SPRING.y + 4) / 10)) * (1 - smooth(clamp01((z - PART.y - 2) / 8)));
  if (along > 0) {
    const d = Math.abs(x - riverX(z));
    const channel = (1 - smooth(clamp01((d - 3.5) / 5))) * along;
    h = h * (1 - channel) + -1.8 * channel;
  }
  // the spring's pool
  const sp = 1 - smooth(clamp01((Math.hypot(x - SPRING.x, z - SPRING.y) - 6) / 6));
  h = h * (1 - sp) + -1.8 * sp;
  // the pool where the river parts
  const pp = 1 - smooth(clamp01((Math.hypot(x - PART.x, z - PART.y) - 16) / 14));
  h = h * (1 - pp) + Math.min(h, -1.2) * pp;
  // the four heads, carved while they cross the garden (beyond the rim they run on the surface)
  for (const head of HEADS) {
    const k = headNear(head, x, z);
    if (!k || k.s > head.brink + 12) continue;
    const w = headWidth(k.s);
    const channel = (1 - smooth(clamp01((k.d - w * 0.5) / 11))) * (1 - smooth(clamp01((k.s - head.brink) / 14)));
    h = h * (1 - channel) + Math.min(h, -1.2) * channel;
  }
  return h;
}

function createTerrain(segments, quality) {
  // a wide plane whose grid is fine in the garden and coarse over the lands far below
  const HALF = 1100;
  const geometry = new THREE.PlaneGeometry(2, 2, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;
  const warp = (g) => HALF * (0.3 * g + 0.7 * g * g * g);
  for (let i = 0; i < pos.count; i++) pos.setXYZ(i, warp(pos.getX(i)), 0, warp(pos.getZ(i)));
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
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(RIM - 3, 96), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0;
  return mesh;
}

// ------------------------------------------------------------------ the four heads falling from the mountain
function createHeads(low) {
  const geos = [];
  const step = low ? 8 : 4;
  const a = new THREE.Vector2();
  const b = new THREE.Vector2();
  for (const head of HEADS) {
    const pos = [];
    const uv = [];
    const steep = [];
    const idx = [];
    let n = 0;
    let lastY = null;
    for (let s = 30; s <= HEAD_LEN; s += step) {
      headPoint(head, s, a);
      headPoint(head, s + 1, b);
      const tx = b.x - a.x;
      const tz = b.y - a.y;
      const len = Math.hypot(tx, tz);
      const nx = -tz / len;
      const nz = tx / len;
      const w = headWidth(s) * 0.55 + (s <= head.brink ? 2 : 0);
      // the water sits in its carved bed in the garden and runs on the surface down the mountain
      const y = s <= head.brink
        ? 0.06
        : Math.max(height(a.x + nx * w * 0.7, a.y + nz * w * 0.7), height(a.x, a.y), height(a.x - nx * w * 0.7, a.y - nz * w * 0.7)) + 0.45;
      const slope = lastY === null ? 0 : Math.max(0, (lastY - y) / step);
      lastY = y;
      pos.push(a.x + nx * w, y, a.y + nz * w, a.x - nx * w, y, a.y - nz * w);
      uv.push(0, s / 8, 1, s / 8);
      steep.push(slope, slope);
      if (n) idx.push(2 * n - 2, 2 * n - 1, 2 * n, 2 * n - 1, 2 * n + 1, 2 * n);
      n++;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setAttribute("steep", new THREE.Float32BufferAttribute(steep, 1));
    g.setIndex(idx);
    geos.push(g);
  }
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSky: { value: new THREE.Color(0.6, 0.7, 0.8) },
      uDeep: { value: new THREE.Color(0.04, 0.12, 0.13) },
      fogColor: { value: new THREE.Color() },
      fogDensity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float steep;
      varying vec2 vUv;
      varying float vSteep;
      #include <fog_pars_vertex>
      void main() {
        vUv = uv;
        vSteep = steep;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSky, uDeep;
      varying vec2 vUv;
      varying float vSteep;
      #include <fog_pars_fragment>
      ${NOISE}
      void main() {
        float fall = smoothstep(0.12, 0.6, vSteep);
        float speed = 0.6 + fall * 6.0;
        float n = snoise(vec3(vUv.x * 4.0, vUv.y * 0.6 - uTime * speed, uTime * 0.2));
        float streak = snoise(vec3(vUv.x * 14.0, vUv.y * 0.12 - uTime * speed * 0.3, 1.0));
        vec3 col = mix(uDeep, uSky * 0.85, 0.25 + 0.25 * n);
        // white water where it falls, and along the banks
        float foam = max(fall * (0.65 + 0.35 * streak), smoothstep(0.38, 0.5, abs(vUv.x - 0.5)) * 0.35);
        col = mix(col, vec3(0.9, 0.93, 0.95), clamp(foam, 0.0, 1.0));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }
    `,
    fog: true,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(mergeGeometries(geos), material);
  mesh.frustumCulled = false;
  return mesh;
}

// ------------------------------------------------------------------ the mist below the mountain (Genesis 2:6)
function createMistSea() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(0.86, 0.85, 0.8) }, uOpacity: { value: 0.85 } },
    vertexShader: /* glsl */ `varying vec3 vWorld; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uOpacity;
      uniform vec3 uColor;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        vec2 p = vWorld.xz * 0.0024;
        float n = fbm(vec3(p + vec2(uTime * 0.004, uTime * 0.002), uTime * 0.01)) * 0.5 + 0.5;
        float m = fbm(vec3(p * 3.1 - uTime * 0.006, 4.0)) * 0.5 + 0.5;
        float a = smoothstep(0.32, 0.7, n * 0.75 + m * 0.35);
        // thin near the foot of the mountain, a sea of cloud farther out
        a *= smoothstep(260.0, 520.0, length(vWorld.xz));
        gl_FragColor = vec4(uColor * (0.85 + 0.25 * m), a * uOpacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(3200, 64).rotateX(-Math.PI / 2), material);
  mesh.position.y = -DROP + 120;
  mesh.renderOrder = 1;
  return mesh;
}

// ------------------------------------------------------------------ gold, bdellium, onyx, every precious stone
// Genesis 2:11-12; Ezekiel 28:13: sardius, topaz, diamond, beryl, onyx, jasper, sapphire, emerald, carbuncle
const STONES = [
  [0.75, 0.08, 0.06], [0.95, 0.72, 0.18], [0.95, 0.97, 1.0], [0.42, 0.85, 0.75], [0.1, 0.09, 0.1],
  [0.62, 0.24, 0.14], [0.1, 0.24, 0.92], [0.04, 0.66, 0.26], [0.62, 0.02, 0.1],
];
function createJewels(low, random) {
  const group = new THREE.Group();
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const col = new THREE.Color();
  const v3 = new THREE.Vector3();
  const sc = new THREE.Vector3();
  // precious stones on the banks of the river and in its shallows; each catches the light a little
  const n = low ? 260 : 700;
  const gemMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.06, metalness: 0.2, envMapIntensity: 2 });
  gemMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      "#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\ntotalEmissiveRadiance += vColor * 0.45;\n#endif",
    );
  };
  const gems = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.11, 0), gemMat, n);
  let k = 0;
  for (let tries = 0; k < n && tries < n * 30; tries++) {
    const z = SPRING.y + random() * (PART.y - SPRING.y);
    const side = random() < 0.5 ? -1 : 1;
    const x = riverX(z) + side * (2.5 + random() * 6);
    const y = height(x, z);
    if (y < -1.4) continue;
    const s = 0.6 + random() * 1.4;
    m.compose(v3.set(x, Math.max(y, -0.15) + 0.04 * s, z), q.setFromEuler(e.set(random() * 6, random() * 6, random() * 6)), sc.set(s, s * (0.8 + random() * 0.6), s));
    gems.setMatrixAt(k, m);
    gems.setColorAt(k, col.setRGB(...STONES[Math.floor(random() * STONES.length)]));
    k++;
  }
  gems.count = k;
  group.add(gems);
  // the gold of Havilah in the bed of the Pison where it leaves the garden, and bdellium, pale as resin
  const gold = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.13, 0), new THREE.MeshStandardMaterial({ color: 0xe0a83a, metalness: 1, roughness: 0.22 }), low ? 150 : 400);
  const bdellium = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe8d9a8, roughness: 0.15 }), low ? 60 : 160);
  const pison = HEADS[0];
  const v = new THREE.Vector2();
  for (const mesh of [gold, bdellium]) {
    for (let i = 0; i < mesh.count; i++) {
      const s = random() * 80;
      headPoint(pison, s, v);
      const w = headWidth(s) * 0.5;
      const x = v.x + (random() - 0.5) * 2 * w;
      const z = v.y + (random() - 0.5) * 2 * w;
      const k2 = 0.5 + random() * 1.3;
      m.compose(v3.set(x, Math.max(height(x, z), -1.7) + 0.05, z), q.setFromEuler(e.set(random() * 6, random() * 6, random() * 6)), sc.set(k2, k2 * 0.7, k2));
      mesh.setMatrixAt(i, m);
    }
  }
  group.add(gold, bdellium);
  return group;
}

// the stones of fire about the spring where the river goes out of Eden (Ezekiel 28:14, 16)
function createStonesOfFire() {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x3a1a0a, roughness: 0.5, emissive: 0xff7a2a, emissiveIntensity: 2.2 });
  const geos = [];
  const r = rng(28);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const g = new THREE.DodecahedronGeometry(0.9 + r() * 0.5, 0);
    g.scale(1, 0.8 + r() * 0.5, 1);
    const x = SPRING.x + Math.cos(a) * 15;
    const z = SPRING.y + Math.sin(a) * 15;
    g.translate(x, height(x, z) + 0.5, z);
    geos.push(g);
  }
  const stones = new THREE.Mesh(mergeGeometries(geos), mat);
  const light = new THREE.PointLight(0xff9a50, 60, 70, 1.4);
  light.position.set(SPRING.x, height(SPRING.x, SPRING.y + 15) + 6, SPRING.y);
  group.add(stones, light);
  group.userData = { mat, light };
  return group;
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

// The serpent: the nachash, "the shining one", drawn as Scripture's fiery serpents are, a seraph-serpent of
// bright brass (Numbers 21:6-9; Isaiah 14:29, 30:6, "fiery flying serpent"), upright, with six wings as the
// seraphims have (Isaiah 6:2). It is coiled in the tree of knowledge and leans out toward the woman. At the
// curse it loses its wings and its light and goes down upon its belly in the dust (Genesis 3:14).
function featherWing(length, feathers = 11) {
  const geos = [];
  for (let i = 0; i < feathers; i++) {
    const k = i / (feathers - 1);
    const len = length * (0.45 + 0.55 * Math.sin(Math.PI * (0.15 + k * 0.75)));
    const w = 0.07 + 0.05 * (1 - k);
    const shape = new THREE.Shape();
    shape.moveTo(0, -w * 0.4);
    shape.quadraticCurveTo(len * 0.5, -w, len, 0);
    shape.quadraticCurveTo(len * 0.5, w, 0, w * 0.4);
    shape.closePath();
    const g = new THREE.ShapeGeometry(shape, 6);
    // fan the feathers from the root, sweeping up and back; each a little curved
    g.rotateZ(THREE.MathUtils.degToRad(-35 + k * 115));
    g.translate(0, 0, -k * 0.04);
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) p.setZ(v, p.getZ(v) + Math.pow(Math.hypot(p.getX(v), p.getY(v)) / length, 2) * 0.18);
    geos.push(g);
  }
  const wing = mergeGeometries(geos);
  wing.computeVertexNormals();
  return wing;
}

function createSerpent(uniforms) {
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const k = i / 60;
    const a = k * 14 + 0.6;
    const r = 0.82 - k * 0.16;
    pts.push(new THREE.Vector3(Math.cos(a) * r, 0.25 + k * 2.6, Math.sin(a) * r));
  }
  // leave the trunk along a low bough and rise, upright, toward the woman (local coordinates)
  const toEve = EVE_SPOT.clone().sub(KNOWLEDGE).divideScalar(1.5);
  const out = new THREE.Vector3(toEve.x, 0, toEve.z).normalize();
  const last = pts[pts.length - 1];
  for (let i = 1; i <= 7; i++) {
    const k = i / 7;
    const reach = 0.7 + k * 2.0;
    pts.push(new THREE.Vector3(
      out.x * reach + Math.sin(k * 5) * 0.15 * (1 - k),
      last.y + 0.55 * Math.sin(k * 2.2) - k * 0.45,
      out.z * reach + Math.cos(k * 5) * 0.15 * (1 - k),
    ));
  }
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
  const tube = new THREE.TubeGeometry(curve, 420, 0.21, 14, false);
  // taper, and bake the brass scales into vertex colours: bright plates, darker seams, a pale belly
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
    const taper = Math.min(1, s * 6) * (1 - 0.4 * Math.max(0, (s - 0.92) / 0.08)) * 0.95 + 0.05;
    v.multiplyScalar(taper);
    pos.setXYZ(i, c.x + v.x, c.y + v.y, c.z + v.z);
    const plate = Math.abs(((s * 150) % 1) - 0.5) + Math.abs(((around * 7) % 1) - 0.5) < 0.42;
    const belly = Math.abs(around - 0.5) < 0.12;
    colors.set(belly ? [1.0, 0.88, 0.62] : plate ? [1.0, 0.78, 0.45] : [0.55, 0.36, 0.18], i * 3);
  }
  tube.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  tube.computeVertexNormals();
  const brass = new THREE.MeshStandardMaterial({ color: 0xd49a52, vertexColors: true, metalness: 1, roughness: 0.24, emissive: 0x8a4a14, emissiveIntensity: 0.9, transparent: true, opacity: 0 });
  brass.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>
        float s = uv.x;
        float lift = smoothstep(0.8, 1.0, s);
        transformed.y += sin(uTime * 1.3 + s * 18.0) * 0.05 * lift;
        transformed.x += sin(uTime * 0.9 + s * 9.0) * 0.06 * lift;`);
  };
  const body = new THREE.Mesh(tube, brass);
  // head: a broad wedge with a low crest, and burning eyes
  const headGeo = new THREE.SphereGeometry(0.27, 18, 12);
  headGeo.scale(1.0, 0.62, 1.6);
  const head = new THREE.Mesh(headGeo, brass);
  const crest = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.42, 6).rotateX(-1.2).translate(0, 0.16, -0.14), brass);
  head.add(crest);
  const eyeMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 1.6, 0.4), transparent: true, opacity: 0 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), eyeMat);
  const eyeR = eyeL.clone();
  eyeL.position.set(0.12, 0.07, 0.17);
  eyeR.position.set(-0.12, 0.07, 0.17);
  head.add(eyeL, eyeR);
  const end = curve.getPointAt(1);
  const tangent = curve.getTangentAt(1);
  head.position.copy(end).addScaledVector(tangent, 0.14);
  head.lookAt(end.clone().addScaledVector(tangent, 2));
  // six wings along the upper body: with twain he covered his face, with twain his feet, with twain he did fly
  const wingMat = new THREE.MeshStandardMaterial({ color: 0xe8b867, metalness: 0.9, roughness: 0.28, emissive: 0xffa040, emissiveIntensity: 0.35, side: THREE.DoubleSide, transparent: true, opacity: 0 });
  const wings = [];
  const up = new THREE.Vector3(0, 1, 0);
  [[0.74, 1.5], [0.84, 2.0], [0.93, 1.6]].forEach(([s, len], pair) => {
    const p = curve.getPointAt(s);
    const t = curve.getTangentAt(s);
    const side = new THREE.Vector3().crossVectors(t, up).normalize();
    const lift = new THREE.Vector3().crossVectors(side, t).normalize();
    const geo = featherWing(len);
    for (const dir of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.copy(p);
      const basis = new THREE.Matrix4().makeBasis(side.clone().multiplyScalar(dir), lift, t.clone().multiplyScalar(dir));
      pivot.quaternion.setFromRotationMatrix(basis);
      const wing = new THREE.Mesh(geo, wingMat);
      pivot.add(wing);
      pivot.userData = { pair, dir };
      wings.push(pivot);
    }
  });
  const glow = new THREE.PointLight(0xffb060, 0, 9, 1.6);
  glow.position.copy(curve.getPointAt(0.88)).add(new THREE.Vector3(0, 0.4, 0));
  const group = new THREE.Group();
  group.add(body, head, glow, ...wings);
  const SIZE = 1.3; // a great serpent, not a garden snake
  const dull = new THREE.Color(0.32, 0.27, 0.2);
  const bright = new THREE.Color(0xd49a52);
  return {
    group,
    set(show, time, cursed = 0) {
      brass.opacity = show;
      eyeMat.opacity = show * (1 - cursed * 0.7);
      wingMat.opacity = show * (1 - cursed);
      group.visible = show > 0.01;
      // the shining fades and the brass dulls under the curse
      brass.emissiveIntensity = 0.9 * (1 - cursed);
      brass.color.copy(bright).lerp(dull, cursed);
      glow.intensity = show * 14 * (1 - cursed);
      for (const w of wings) {
        const { pair, dir } = w.userData;
        const beat = Math.sin(time * 2.2 + pair * 0.9) * 0.22 * (pair === 1 ? 1 : 0.5);
        w.rotation.z = 0;
        w.children[0].rotation.set(0, 0, (beat - cursed * 1.2) * 1);
        w.scale.setScalar(Math.max(0.001, 1 - cursed));
        void dir;
      }
      // down from the tree and upon its belly in the dust
      group.position.y = -cursed * 2.3 * SIZE;
      group.scale.set(SIZE, SIZE * (1 - 0.55 * cursed), SIZE);
      head.rotation.z = Math.sin(time * 1.1) * 0.15;
      head.position.copy(end).addScaledVector(tangent, 0.14);
      head.position.y += Math.sin(time * 1.3 + 18.0) * 0.05;
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
  [50, [-360, 170, 600], [0, -40, 60]],
  [53, [-170, 95, 380], [20, -10, 140]],
  [57, [75, 36, 225], [23, -4, 132]],
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
  // compress the sky's highlights (the sun disc is ~760x) so bloom gives a glow, not a white veil
  sky.material.uniforms.uSkyGain = { value: 0.85 };
  sky.material.fragmentShader = sky.material.fragmentShader
    .replace("void main() {", "uniform float uSkyGain;\nvoid main() {")
    .replace("gl_FragColor = vec4( texColor, 1.0 );", "float peak = max(max(texColor.r, texColor.g), texColor.b);\n\t\t\tgl_FragColor = vec4( texColor * uSkyGain / (1.0 + max(peak - 0.6, 0.0) * 0.9), 1.0 );");

  const curves = pathCurves();
  const pathPts = curves.pos.getSpacedPoints(120);
  const avoid = (x, z, h) => pathPts.some((p) => Math.hypot(p.x - x, p.z - z) < 16 && p.y - h < 22);

  const shared = { uTime: { value: 0 }, uWind: { value: 0.3 } };
  const terrain = createTerrain(low ? 180 : 300, ctx.quality);
  const heads = createHeads(low);
  const mistSea = createMistSea();
  const jewels = createJewels(low, rng(55));
  const stonesOfFire = createStonesOfFire();
  const water = createWater();
  const grass = createGrass(low ? 30000 : 120000, random);
  const forest = new THREE.Group();
  // "every tree that is pleasant to the sight, and good for food" (Genesis 2:9): the scanned trees in
  // several kinds and tints over the whole mountain top
  const near = (x, z) => {
    const h0 = height(x, z);
    if (h0 < 0.8 || h0 > 40 || Math.hypot(x, z) > RIM - 8) return false;
    if (Math.abs(x - riverX(z)) < 9 || Math.hypot(x - CLEARING.x, z - CLEARING.y) < 34 || avoid(x, z, h0)) return false;
    return !HEADS.some((hd) => { const k = headNear(hd, x, z); return k && k.s < 100 && k.d < headWidth(k.s) + 4; });
  };
  const placeOnMountain = (r) => { const a = r() * Math.PI * 2; const d = Math.sqrt(r()) * (RIM - 8); const x = Math.cos(a) * d; const z = Math.sin(a) * d; return near(x, z) ? [x, z] : null; };
  const groves = [
    kitTrees({ count: low ? 30 : 60, place: placeOnMountain, height, kind: "broadleaf", random, size: [5, 9] }),
    kitTrees({ count: low ? 25 : 50, place: placeOnMountain, height, kind: "olive", random: rng(202), size: [4, 7] }),
    kitTrees({ count: low ? 20 : 45, place: placeOnMountain, height, kind: "broadleaf", random: rng(203), size: [7, 12], tint: [0.85, 1.05, 0.75] }),
  ];
  forest.add(...groves.map((g) => g.group));
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
  scene.add(heads, mistSea, jewels, stonesOfFire);
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
      const afar = 1 - smooth(ramp(t, at(55), at(59.5)));
      fog.density = (THREE.MathUtils.lerp(0.0026, 0.0042, fall) - 0.0012 * smooth(ramp(t, at(95), 1))) * (1 - 0.62 * afar);

      // wind rises with the fall
      const wind = 0.25 + 1.4 * fall;
      shared.uTime.value = time;
      lifeScan.update({ time, wind: shared.uWind.value });
      for (const g of groves) g.update({ time, wind: shared.uWind.value });
      const hm = heads.material.uniforms;
      hm.uTime.value = time;
      hm.fogColor.value.copy(fog.color);
      hm.fogDensity.value = fog.density;
      hm.uSky.value.setRGB(0.62, 0.72, 0.8).lerp(new THREE.Color(0.08, 0.1, 0.13), dusk);
      mistSea.material.uniforms.uTime.value = time;
      mistSea.material.uniforms.uColor.value.setRGB(0.88, 0.86, 0.8).lerp(new THREE.Color(0.2, 0.22, 0.27), dusk);
      const fireGlow = 0.85 + 0.15 * Math.sin(time * 1.7) * Math.sin(time * 1.1);
      stonesOfFire.userData.mat.emissiveIntensity = 2.2 * fireGlow * (1 - 0.5 * fall);
      stonesOfFire.userData.light.intensity = 60 * fireGlow;
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
      mist.material.uniforms.uOpacity.value = (0.07 + 0.08 * fall) * (1 - afar);
      mist.visible = afar < 0.98;
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
      const cursed = smooth(ramp(t, at(83.5), at(85.5)));
      trees.serpent.set(smooth(ramp(t, at(72.5), at(75))) * (1 - smooth(ramp(t, at(87.5), at(89)))), time, cursed);
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
          threshold: 1.0,
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
