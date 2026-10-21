// The heavens shaken (6:12–14, and again at the trumpets and vials): the sun black as sackcloth of hair, the
// moon as blood, the stars falling as a fig tree casteth her untimely figs, and the heaven departing as a
// scroll when it is rolled together. Each is a group or mesh with a set(k) / update(...) the scene drives.

import * as THREE from "three";

import { glowSprite } from "../../kit/common.js";
import { rng } from "../../engine/noise.js";

const flat = (color) => new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false, transparent: true, depthWrite: false });

/** blackSun(radius) -> { group, set(k) }: the sun, k 0 shining .. 1 black as sackcloth of hair (6:12). Face it with group.lookAt(eye). */
export function blackSun(radius = 30) {
  const group = new THREE.Group();
  const halo = glowSprite(0xffe2b0, radius * 9, 0.9);
  const ember = glowSprite(0x7a3412, radius * 5, 0); // a dull rim behind the hair, so the black shows against it
  halo.position.z = ember.position.z = -2;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), flat(0xffffff));
  // the hair: coarse dark strands standing out all round the disc, as goat's hair cloth
  const random = rng(61);
  const pos = [];
  for (let i = 0; i < 700; i++) {
    const a = random() * Math.PI * 2;
    const w = 0.012 + random() * 0.02;
    const r0 = radius * (0.92 + random() * 0.08);
    const r1 = radius * (1.12 + random() ** 2 * 0.95);
    const b = a + (random() - 0.5) * 0.18;
    pos.push(Math.cos(a - w) * r0, Math.sin(a - w) * r0, 0.5, Math.cos(a + w) * r0, Math.sin(a + w) * r0, 0.5, Math.cos(b) * r1, Math.sin(b) * r1, 0.5);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  const hair = new THREE.Mesh(geo, flat(0x0a0705));
  hair.material.side = THREE.DoubleSide;
  group.add(halo, ember, disc, hair);
  const bright = new THREE.Color(5, 4.3, 3.3);
  const black = new THREE.Color(0.014, 0.01, 0.008);
  return {
    group,
    set(k) {
      disc.material.color.copy(bright).lerp(black, Math.min(1, k * 1.15));
      halo.material.opacity = 0.9 * (1 - k);
      ember.material.opacity = 0.6 * k;
      hair.material.opacity = k;
      hair.scale.setScalar(0.85 + 0.15 * k);
    },
  };
}

/** bloodMoon(radius) -> { group, set(k) }: the moon, k 0 pale .. 1 become as blood (6:12). */
export function bloodMoon(radius = 18) {
  const group = new THREE.Group();
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 128, 128);
  const random = rng(19);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(90,90,100,${0.15 + random() * 0.25})`;
    g.beginPath();
    g.arc(20 + random() * 88, 20 + random() * 88, 6 + random() * 18, 0, Math.PI * 2);
    g.fill();
  }
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), flat(0xffffff));
  disc.material.map = map;
  const glow = glowSprite(0xdde4ff, radius * 6, 0.45);
  glow.position.z = -2;
  group.add(glow, disc);
  const pale = new THREE.Color(1.5, 1.48, 1.4);
  const blood = new THREE.Color(0.75, 0.05, 0.03);
  const paleGlow = new THREE.Color(0xdde4ff);
  const bloodGlow = new THREE.Color(0x8a0a04);
  return {
    group,
    set(k) {
      disc.material.color.copy(pale).lerp(blood, k);
      glow.material.color.copy(paleGlow).lerp(bloodGlow, k);
      glow.material.opacity = 0.45 + 0.25 * k;
    },
  };
}

const FALL_VERT = /* glsl */ `
  attribute vec3 aStart, aLand;
  attribute vec3 aSeed; // delay, random, tail (0 head, 1 tail)
  uniform float uK, uTime;
  uniform vec3 uWind;
  varying float vAlpha;
  vec3 at(float t) {
    vec3 p = mix(aStart, aLand, t * t);
    // shaken of a mighty wind: thrown sideways as they let go, then dropping
    return p + uWind * (sin(min(t, 1.0) * 3.14159) * (0.6 + aSeed.y));
  }
  void main() {
    float t = clamp((uK - aSeed.x) / (0.16 + aSeed.y * 0.08), 0.0, 1.0);
    vec3 p = at(max(0.0, t - aSeed.z * 0.07 * step(0.001, t) * step(t, 0.999)));
    float rest = 1.0 - step(0.001, t);
    float landed = step(0.999, t);
    vAlpha = (rest * (0.55 + 0.45 * sin(uTime * 3.0 + aSeed.y * 40.0)) + (1.0 - rest - landed) + landed * 0.7) * (1.0 - aSeed.z * 0.85);
    vec4 mv = viewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp((1.6 + 2.6 * (1.0 - rest) * (1.0 - landed)) * (700.0 / max(60.0, -mv.z)), 1.5, 9.0);
  }
`;

/**
 * fallingStars({ starts, lands, wind }) -> { group, update(k, time) }: stars thrown down from the sky as figs
 * from a shaken tree (6:13). starts/lands are flat [x, y, z, ...] arrays; k 0 none fallen .. 1 all fallen.
 * They let go in gusts.
 */
export function fallingStars({ starts, lands, wind = [60, 0, 10], seed = 13 }) {
  const n = starts.length / 3;
  const random = rng(seed);
  const s = new Float32Array(n * 6);
  const l = new Float32Array(n * 6);
  const d = new Float32Array(n * 6);
  for (let i = 0; i < n; i++) {
    const delay = (Math.floor(random() * 6) / 6) * 0.72 + random() * 0.06;
    const r = random();
    for (let tail = 0; tail < 2; tail++) {
      const j = (i * 2 + tail) * 3;
      s.set(starts.slice(i * 3, i * 3 + 3), j);
      l.set(lands.slice(i * 3, i * 3 + 3), j);
      d.set([delay, r, tail], j);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
  geo.setAttribute("aStart", new THREE.BufferAttribute(s, 3));
  geo.setAttribute("aLand", new THREE.BufferAttribute(l, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(d, 3));
  const uniforms = { uK: { value: 0 }, uTime: { value: 0 }, uWind: { value: new THREE.Vector3(...wind) } };
  const common = { uniforms, vertexShader: FALL_VERT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const lines = new THREE.LineSegments(geo, new THREE.ShaderMaterial({ ...common, fragmentShader: "varying float vAlpha; void main(){ gl_FragColor = vec4(vec3(1.0, 0.92, 0.78) * 1.6, vAlpha); }" }));
  const points = new THREE.Points(geo, new THREE.ShaderMaterial({ ...common, fragmentShader: "varying float vAlpha; void main(){ float r = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.95, 0.85) * 2.0, vAlpha * smoothstep(0.5, 0.0, r)); }" }));
  lines.frustumCulled = points.frustumCulled = false;
  const group = new THREE.Group();
  group.add(lines, points);
  return { group, update(k, time) { uniforms.uK.value = k; uniforms.uTime.value = time; } };
}

const SCROLL_VERT = /* glsl */ `
  uniform float uEdge, uRadius, uArc, uBottom, uTop, uCurl;
  varying vec2 vUv;
  varying float vDepth;
  void main() {
    vUv = uv;
    float w = uRadius * uArc;
    float s = (uv.x - 0.5) * w;
    float depth = 0.0;
    if (s > uEdge) {
      // past the edge the sheet winds round a roll, toward the viewer
      float th = (s - uEdge) / uCurl;
      float r = uCurl * (1.0 + th * 0.02);
      s = uEdge + r * sin(th);
      depth = r * (1.0 - cos(th));
    }
    vDepth = depth;
    float phi = s / uRadius;
    float R = uRadius - depth;
    vec3 p = vec3(sin(phi) * R, mix(uBottom, uTop, uv.y), -cos(phi) * R);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const SCROLL_FRAG = /* glsl */ `
  uniform float uDay, uStars, uOpacity;
  varying vec2 vUv;
  varying float vDepth;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    if (!gl_FrontFacing) {
      // the back of the heaven, as the roll turns it over: dark, like old vellum
      gl_FragColor = vec4(vec3(0.11, 0.09, 0.075) * (0.6 + 0.4 * vUv.y), uOpacity);
      return;
    }
    vec3 night = mix(vec3(0.02, 0.025, 0.045), vec3(0.004, 0.005, 0.012), vUv.y);
    vec3 day = mix(vec3(0.55, 0.52, 0.48), vec3(0.24, 0.3, 0.4), vUv.y);
    vec3 col = mix(night, day, uDay);
    vec2 g = vUv * vec2(900.0, 240.0);
    vec2 cell = floor(g);
    float h = hash(cell);
    vec2 c = vec2(hash(cell + 3.1), hash(cell + 7.7));
    float star = step(0.975, h) * smoothstep(0.35, 0.0, length(fract(g) - c)) * (0.4 + 2.0 * (h - 0.975) * 40.0);
    col += vec3(1.0, 0.95, 0.88) * star * uStars;
    // the edge of the roll catches a little light
    col += vec3(0.08, 0.07, 0.06) * smoothstep(0.0, 4.0, vDepth) * step(vDepth, 6.0);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/**
 * heavensScroll({ radius, arc, bottom, top }) -> { mesh, set(k, { day, stars }), unrolled(phi) }: the sky as one
 * sheet round the viewer (place the mesh at the eye; it faces -z, spanning `arc` radians). k rolls it up from
 * the right edge until it is gone (6:14). unrolled(phi) says whether the sky at bearing phi (radians from -z,
 * positive to the right) is still spread out, for the sun, the moon and the stars set on it.
 */
export function heavensScroll({ radius = 700, arc = Math.PI * 1.1, bottom = -80, top = 1500, curl = 30 } = {}) {
  const uniforms = {
    uEdge: { value: 0 }, uRadius: { value: radius }, uArc: { value: arc }, uBottom: { value: bottom }, uTop: { value: top },
    uCurl: { value: curl }, uDay: { value: 0 }, uStars: { value: 1 }, uOpacity: { value: 1 },
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 220, 24), new THREE.ShaderMaterial({ uniforms, vertexShader: SCROLL_VERT, fragmentShader: SCROLL_FRAG, side: THREE.DoubleSide, transparent: true, fog: false }));
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  const half = (radius * arc) / 2;
  // the roll's own girth, so the last of it is carried off past the left edge
  const end = -half - curl * 30;
  return {
    mesh,
    set(k, { day = 0, stars = 1 } = {}) {
      uniforms.uEdge.value = THREE.MathUtils.lerp(half, end, k);
      uniforms.uDay.value = day;
      uniforms.uStars.value = stars;
      uniforms.uOpacity.value = 1 - THREE.MathUtils.smoothstep(k, 0.88, 1);
    },
    unrolled: (phi) => phi * radius < uniforms.uEdge.value,
  };
}
