// The ancient map: a dark relief of the biblical world with gold coastlines, rivers, animated routes,
// pulsing places, regions and crisp DOM labels. A "program" scripts what appears over the scene's units.

import * as THREE from "three";

import { EXTENT, ISLANDS, MOUNTAINS, PLACES, REGIONS, RIVERS, SEAS } from "../data/geo.js";
import { NOISE } from "../engine/noise.js";
import { cameraRig, glowSprite, pulse, sramp } from "./common.js";

const K = 10; // world units per degree of latitude
const LON0 = (EXTENT.lon[0] + EXTENT.lon[1]) / 2;
const LAT0 = (EXTENT.lat[0] + EXTENT.lat[1]) / 2;
const COS = Math.cos((LAT0 * Math.PI) / 180);
const WIDTH = (EXTENT.lon[1] - EXTENT.lon[0]) * COS * K;
const DEPTH = (EXTENT.lat[1] - EXTENT.lat[0]) * K;

export const project = ([lon, lat], y = 0) => new THREE.Vector3((lon - LON0) * COS * K, y, -(lat - LAT0) * K);
const resolve = (p) => (typeof p === "string" ? PLACES[p] : p);

// ---------------------------------------------------------------- the map texture (land, mountains, rivers)
let mapTexture = null;
let sampler = null;

/** Approximate relief height at a lon/lat (mirrors the vertex shader without its fine noise). */
function reliefAt([lon, lat]) {
  if (!sampler) buildTexture();
  const { W, H, data } = sampler;
  const x = Math.round(((lon - EXTENT.lon[0]) / (EXTENT.lon[1] - EXTENT.lon[0])) * (W - 1));
  const y = Math.round(((lat - EXTENT.lat[0]) / (EXTENT.lat[1] - EXTENT.lat[0])) * (H - 1));
  if (x < 0 || y < 0 || x >= W || y >= H) return 0;
  const i = (y * W + x) * 4;
  const land = data[i] / 255;
  const m = data[i + 1] / 255;
  return land > 0.5 ? 0.35 + 0.45 + m * 4.5 * 0.9 : -0.4;
}
function buildTexture() {
  if (mapTexture) return mapTexture;
  const W = 2048;
  const H = Math.round((W * DEPTH) / WIDTH);
  const toPx = ([lon, lat]) => [((lon - EXTENT.lon[0]) / (EXTENT.lon[1] - EXTENT.lon[0])) * W, ((EXTENT.lat[1] - lat) / (EXTENT.lat[1] - EXTENT.lat[0])) * H];
  const layer = (draw) => {
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const g = c.getContext("2d");
    draw(g);
    return g.getImageData(0, 0, W, H).data;
  };
  const poly = (g, pts) => {
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = toPx(p); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath();
    g.fill();
  };
  const line = (g, pts) => {
    g.beginPath();
    pts.forEach((p, i) => { const [x, y] = toPx(p); if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.stroke();
  };
  const land = layer((g) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, W, H);
    g.fillStyle = "#000";
    for (const s of Object.values(SEAS)) poly(g, s);
    g.fillStyle = "#fff";
    for (const s of Object.values(ISLANDS)) poly(g, s);
  });
  const mountains = layer((g) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#fff";
    g.lineCap = "round";
    g.lineJoin = "round";
    g.filter = "blur(18px)";
    g.lineWidth = 46;
    for (const m of MOUNTAINS) line(g, m);
    g.filter = "blur(6px)";
    g.lineWidth = 14;
    for (const m of MOUNTAINS) line(g, m);
  });
  const rivers = layer((g) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "#fff";
    g.lineWidth = 3;
    g.lineCap = "round";
    g.lineJoin = "round";
    for (const r of Object.values(RIVERS)) line(g, r);
    g.fillStyle = "#fff";
    for (const s of [SEAS.dead, SEAS.galilee]) poly(g, s);
  });
  // rows are flipped by hand (texture row 0 = south) because WebGL2 ignores flipY for data textures
  const data = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const src = ((H - 1 - y) * W + x) * 4;
      const dst = (y * W + x) * 4;
      data[dst] = land[src];
      data[dst + 1] = mountains[src];
      data[dst + 2] = rivers[src];
      data[dst + 3] = 255;
    }
  }
  sampler = { W, H, data };
  mapTexture = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  mapTexture.magFilter = THREE.LinearFilter;
  mapTexture.minFilter = THREE.LinearMipmapLinearFilter;
  mapTexture.generateMipmaps = true;
  mapTexture.needsUpdate = true;
  return mapTexture;
}

function createRelief(quality) {
  const tex = buildTexture();
  // (about 0.3M triangles at high: the relief is seen from far above and at a slant, finer is wasted)
  const seg = quality === "low" ? [270, 180] : [450, 300];
  const geometry = new THREE.PlaneGeometry(WIDTH, DEPTH, seg[0], seg[1]);
  geometry.rotateX(-Math.PI / 2);
  const material = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uTime: { value: 0 }, uGlow: { value: 1 }, uTint: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vH;
      ${NOISE}
      void main() {
        vUv = uv;
        vec4 m = texture2D(uMap, uv);
        vec3 p = position;
        float land = smoothstep(0.35, 0.65, m.r);
        float rough = fbm(vec3(p.x * 0.05, p.z * 0.05, 1.0)) * 0.5 + 0.5;
        float h = land * (0.35 + rough * 0.9 + m.g * 4.5 * (0.6 + 0.6 * rough)) - (1.0 - land) * 0.4;
        p.y = h;
        vH = h;
        vec4 w = modelMatrix * vec4(p, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uTime, uGlow;
      uniform vec3 uTint;
      varying vec2 vUv;
      varying vec3 vWorld;
      varying float vH;
      ${NOISE}
      void main() {
        vec4 m = texture2D(uMap, vUv);
        float land = smoothstep(0.4, 0.6, m.r);
        vec3 n = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
        vec3 l = normalize(vec3(-0.6, 0.8, 0.4));
        float shade = clamp(dot(n, l), 0.0, 1.0);
        float grain = fbm(vec3(vWorld.xz * 0.3, 2.0)) * 0.5 + 0.5;
        vec3 landCol = mix(vec3(0.05, 0.04, 0.03), vec3(0.13, 0.1, 0.065), grain) * (0.3 + 0.95 * shade);
        landCol += vec3(0.12, 0.09, 0.05) * m.g * shade;
        float shimmer = snoise(vec3(vWorld.xz * 0.08, uTime * 0.05)) * 0.5 + 0.5;
        vec3 seaCol = mix(vec3(0.008, 0.016, 0.022), vec3(0.02, 0.04, 0.055), shimmer);
        vec3 col = mix(seaCol, landCol, land);
        // coastline: a thin gold line where land meets water
        float coast = 1.0 - smoothstep(0.0, 0.18, abs(m.r - 0.5));
        col += vec3(0.85, 0.62, 0.3) * coast * 0.55 * uGlow;
        // rivers
        col = mix(col, vec3(0.32, 0.42, 0.48) * 0.9, smoothstep(0.25, 0.8, m.b) * land);
        // graticule, faint
        vec2 g = abs(fract(vec2(vWorld.x / ${(K * COS * 5).toFixed(2)}, vWorld.z / ${(K * 5).toFixed(1)})) - 0.5);
        col += vec3(0.25, 0.2, 0.12) * (1.0 - smoothstep(0.0, 0.006, min(g.x, g.y))) * 0.12;
        gl_FragColor = vec4(col * uTint, 1.0);
      }
    `,
    extensions: { derivatives: true },
  });
  return new THREE.Mesh(geometry, material);
}

// relief height for placing overlays (approximation of the vertex shader; overlays sit above it)
const LIFT = 1.2;

function routeMesh(points, { width = 0.2, color = [1, 0.72, 0.32], arc = 0 } = {}) {
  // subdivide each leg and follow the relief, arcing sea voyages slightly if asked
  const pts = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = resolve(points[i]);
    const b = resolve(points[i + 1]);
    const steps = 10;
    for (let s = 0; s < steps; s++) {
      const k = s / steps;
      const ll = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
      const lift = Math.max(0, reliefAt(ll)) + 0.9 + (arc ? Math.sin(k * Math.PI) * arc * 6 : 0);
      pts.push(project(ll, lift));
    }
  }
  const lastP = resolve(points[points.length - 1]);
  pts.push(project(lastP, Math.max(0, reliefAt(lastP)) + 0.9));
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.2);
  const material = new THREE.ShaderMaterial({
    uniforms: { uDraw: { value: 0 }, uTime: { value: 0 }, uFade: { value: 1 }, uColor: { value: new THREE.Color(...color) } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uTime, uFade;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float on = 1.0 - smoothstep(uDraw - 0.01, uDraw, vUv.x);
        float head = smoothstep(uDraw - 0.06, uDraw, vUv.x) * on;
        float dash = 0.65 + 0.35 * step(0.5, fract(vUv.x * 80.0 - uTime * 0.6));
        float a = on * uFade * (dash + head * 2.0);
        if (a < 0.01) discard;
        gl_FragColor = vec4(uColor * a * 0.85, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(64, points.length * 40), width, 6, false), material);
  mesh.renderOrder = 3;
  return mesh;
}

function regionMesh(center, radiusDeg, color) {
  const material = new THREE.ShaderMaterial({
    uniforms: { uAmount: { value: 0 }, uColor: { value: new THREE.Color(...color) }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uAmount, uTime;
      uniform vec3 uColor;
      varying vec2 vUv;
      ${NOISE}
      void main() {
        vec2 c = vUv - 0.5;
        float wob = snoise(vec3(c * 3.0, uTime * 0.05)) * 0.06;
        float d = length(c) * 2.0 + wob;
        float a = (1.0 - smoothstep(0.55, 1.0, d)) * uAmount * 0.32;
        float rim = (smoothstep(0.82, 0.94, d) - smoothstep(0.94, 1.0, d)) * uAmount * 0.5;
        gl_FragColor = vec4(uColor * (a + rim), a + rim);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const size = radiusDeg * K * 2;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(project(resolve(center), 5.2));
  mesh.renderOrder = 2;
  return mesh;
}

/**
 * program: {
 *   camera: [[u, [lon, lat, height], [lonLook, latLook], fov?], ...],
 *   routes: [{ points, from, to, fadeOut?, color?, arc? }],
 *   places: [{ place, from, to, label?, big? }],
 *   regions: [{ center, radius, color, from, to, label? }],
 *   labels: [{ text, at, from, to, size? }],
 *   showRegions: true
 * }
 */
export function createMapScene(program, ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 3000);
  const relief = createRelief(ctx.quality);
  scene.add(relief);
  const rig = cameraRig(program.camera.map(([u, [lon, lat, h], [lx, ly], fov]) => {
    const p = project([lon, lat], h);
    const l = project([lx, ly], 0);
    return [u, [p.x, p.y, p.z], [l.x, l.y, l.z], fov ?? 42];
  }));

  const routes = (program.routes ?? []).map((r) => {
    const mesh = routeMesh(r.points, r);
    scene.add(mesh);
    return { ...r, mesh };
  });
  const regions = (program.regions ?? []).map((r) => {
    const mesh = regionMesh(r.center, r.radius, r.color ?? [0.9, 0.6, 0.3]);
    scene.add(mesh);
    return { ...r, mesh };
  });
  const places = (program.places ?? []).map((p) => {
    const s = glowSprite(p.color ?? 0xffd38a, p.big ? 9 : 5, 0);
    s.position.copy(project(resolve(p.place), Math.max(0, reliefAt(resolve(p.place))) + 1.4));
    scene.add(s);
    return { ...p, sprite: s };
  });

  // DOM labels
  const layer = document.createElement("div");
  layer.className = "map-labels";
  layer.hidden = true;
  document.body.append(layer);
  const labels = [];
  const addLabel = (text, at, from, to, cls, size = 1) => {
    const el = document.createElement("span");
    el.className = `map-label ${cls}`;
    el.textContent = text;
    el.style.setProperty("--size", size);
    layer.append(el);
    labels.push({ el, pos: project(resolve(at), Math.max(0, reliefAt(resolve(at))) + 1.6), from, to });
  };
  if (program.showRegions !== false) for (const [name, lon, lat, size] of REGIONS) addLabel(name, [lon, lat], -1e9, 1e9, "region", size);
  for (const p of places) if (p.label) addLabel(p.label, p.place, p.from, p.to, "place", p.big ? 1.15 : 1);
  for (const r of regions) if (r.label) addLabel(r.label, r.center, r.from, r.to, "area", 1);
  for (const l of program.labels ?? []) addLabel(l.text, l.at, l.from, l.to, "note", l.size ?? 1);

  const v = new THREE.Vector3();
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    activate(on) { layer.hidden = !on; },
    dispose() { layer.remove(); },
    update({ rel, time, reducedMotion }) {
      relief.material.uniforms.uTime.value = time;
      rig.apply(camera, rel, time, reducedMotion ? 0 : 0.4);
      for (const r of routes) {
        const u = r.mesh.material.uniforms;
        u.uDraw.value = sramp(rel, r.from, r.to) * 1.02;
        u.uTime.value = time;
        u.uFade.value = r.fadeOut ? 1 - sramp(rel, r.fadeOut[0], r.fadeOut[1]) : 1;
        r.mesh.visible = rel > r.from - 0.01 && u.uFade.value > 0.01;
      }
      for (const r of regions) {
        r.mesh.material.uniforms.uAmount.value = pulse(rel, r.from, r.from + 1.2, r.to - 1.2, r.to);
        r.mesh.material.uniforms.uTime.value = time;
      }
      for (const p of places) {
        const on = pulse(rel, p.from, p.from + 0.8, p.to - 0.8, p.to);
        p.sprite.material.opacity = on * (0.75 + 0.25 * Math.sin(time * 2.5));
        p.sprite.visible = on > 0.01;
      }
      // labels: project to the screen
      camera.updateMatrixWorld();
      const w = window.innerWidth;
      const h = window.innerHeight;
      for (const l of labels) {
        const on = l.from < -1e8 ? 1 : pulse(rel, l.from, l.from + 0.8, l.to - 0.8, l.to);
        v.copy(l.pos).project(camera);
        const visible = on > 0.01 && v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2;
        l.el.style.opacity = visible ? on.toFixed(3) : "0";
        if (visible) l.el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * h).toFixed(1)}px, 0) translate(-50%, -50%)`;
      }
      return {
        grade: { saturation: 1, exposure: 0.95, bloom: 0.35, threshold: 0.95, tint: [1, 0.98, 0.94] },
        audio: { drone: 0.45, wind: 0.12, shimmer: 0.12 },
      };
    },
  };
}
