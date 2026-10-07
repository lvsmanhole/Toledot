// Revelation 18–22 — the end, which answers the beginning. Babylon falls in smoke. Then the first heaven
// and earth pass away: the darkness and stars of the prologue return, and a new earth forms in light.
// The holy city comes down out of heaven, a cube of gold and light with twelve gates. A river clear as
// crystal, and on either side the tree of life — the tree last seen behind the cherubim in Eden.
// Behold, I make all things new. Even so, come, Lord Jesus.

import * as THREE from "three";

import { cameraRig, glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { smoke } from "../kit/effects.js";
import { city } from "../kit/structures.js";
import { createStars } from "../engine/stars.js";
import { NOISE, rng } from "../engine/noise.js";
import { hdri } from "../kit/library.js";
import { surfaceMaterial } from "../kit/surface.js";
import { createTrees } from "../kit/vegetation.js";
import { createWater } from "../kit/water.js";

function holyCity() {
  // "the length and the breadth and the height of it are equal" (Revelation 21:16)
  const g = new THREE.Group();
  const size = 120;
  const body = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uShow: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vP; varying vec3 vN; void main() { vP = position; vN = normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uShow;
      varying vec3 vP; varying vec3 vN;
      ${NOISE}
      void main() {
        vec3 p = vP / 60.0;
        float grid = max(step(0.94, fract(p.x * 6.0)), max(step(0.94, fract(p.y * 6.0)), step(0.94, fract(p.z * 6.0))));
        float shimmer = 0.6 + 0.4 * snoise(vec3(p * 3.0 + uTime * 0.1));
        vec3 gold = vec3(1.0, 0.8, 0.45);
        vec3 glass = vec3(0.85, 0.95, 1.0);
        vec3 col = mix(gold * 0.8, glass, 0.35 + 0.25 * shimmer) + grid * vec3(1.0, 0.9, 0.7);
        float a = uShow * (0.35 + 0.35 * grid);
        gl_FragColor = vec4(col * a * 0.9, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  g.add(body);
  const gates = [];
  for (let side = 0; side < 4; side++) {
    for (let k = 0; k < 3; k++) {
      const gate = glowSprite(0xfff8ea, 22, 0);
      const t = (k - 1) * 36;
      const pos = [[t, -size * 0.3, size / 2 + 1], [t, -size * 0.3, -size / 2 - 1], [size / 2 + 1, -size * 0.3, t], [-size / 2 - 1, -size * 0.3, t]][side];
      gate.position.set(...pos);
      g.add(gate);
      gates.push(gate);
    }
  }
  return { group: g, body, gates };
}

/** The fruit of the tree of life, "twelve manner of fruits" (Revelation 22:2): points of gold light in a crown. */
function fruit(seed) {
  const r = rng(seed);
  const pts = new Float32Array(900 * 3);
  for (let i = 0; i < 900; i++) {
    const u = r() * 2 - 1;
    const th = r() * 6.283;
    const d = 5.5 * Math.cbrt(r());
    const s = Math.sqrt(1 - u * u);
    pts.set([Math.cos(th) * s * d, 9 + u * d * 0.55, Math.sin(th) * s * d], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.22, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false }));
}

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020203);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 8000);
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1a1408, 0.4));
  const stars = createStars({ count: ctx.quality === "low" ? 10000 : 26000, radius: 3000, seed: 401, size: 2.4 });
  scene.add(stars);
  // Babylon the great, falling, far below (1.5–5)
  const babylon = city({ count: 500, radius: 90, style: "mud", seed: 181 });
  babylon.position.set(0, -300, -800);
  scene.add(babylon);
  const ruin = smoke({ rise: 300, spread: 90, color: [0.2, 0.17, 0.15], opacity: 0.45, size: 300, count: 1500 });
  ruin.position.copy(babylon.position);
  scene.add(ruin);
  const ruinFire = glowSprite(0xff6a2a, 300, 0);
  ruinFire.position.copy(babylon.position).add(new THREE.Vector3(0, 30, 0));
  scene.add(ruinFire);
  // the new earth: a sphere of light forming far below, as in the beginning
  const earth = glowSprite(0xbfdcff, 900, 0);
  earth.position.set(0, -1600, -1400);
  scene.add(earth);
  // the holy city coming down
  const holy = holyCity();
  scene.add(holy.group);
  // the river and the tree of life on either side
  // "a pure river of water of life, clear as crystal" (Revelation 22:1)
  const water = createWater({ deep: [0.05, 0.16, 0.16], flow: 0.5, flowDir: [0, 1] });
  water.material.transparent = true;
  water.material.opacity = 0;
  const river = new THREE.Mesh(new THREE.PlaneGeometry(14, 900, 1, 1).rotateX(-Math.PI / 2), water.material);
  river.position.set(0, 0.05, -300);
  scene.add(river);
  // the tree of life on either side of the river: real trees, golden with fruit
  const spots = [-1, 1].flatMap((s) => [0, 1, 2, 3].map((k) => [s * (18 + (k % 2) * 4), -120 - k * 70]));
  let spot = 0;
  const grove = createTrees({ count: spots.length, place: () => spots[spot++ % spots.length], height: () => 0, kind: "broadleaf", size: [11, 13], tint: [1.05, 1.08, 0.72], random: rng(404) });
  const trees = new THREE.Group();
  trees.add(grove.group);
  spots.forEach(([x, z], i) => { const f = fruit(33 + i); f.position.set(x, 0, z); trees.add(f); });
  trees.visible = false;
  scene.add(trees);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), surfaceMaterial("grass", { tile: 3, tint: [0.8, 0.95, 0.7], emissive: 0x2a2410, emissiveIntensity: 0.6 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);
  let sky = null;
  hdri("sacred").then((h) => { sky = h; }).catch(() => {});
  const radiance = new THREE.PointLight(0xfff4e0, 0, 3000, 0.5);
  radiance.position.set(0, 300, -500);
  scene.add(radiance);

  const rig = cameraRig([
    [0, [0, 200, 200], [0, -200, -800], 50],
    [5.2, [0, 120, 0], [0, -300, -800], 50],
    [5.6, [0, 60, 300], [0, 0, -1000], 55],
    [10, [0, 40, 200], [0, 260, -600], 58],
    [14.3, [0, 30, 120], [0, 120, -600], 54],
    [18.5, [0, 12, 60], [0, 14, -300], 50],
    [23, [0, 8, 10], [0, 12, -260], 46],
    [27, [0, 30, 120], [0, 160, -600], 52],
    [34, [0, 60, 220], [0, 300, -800], 58],
  ]);
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      rig.apply(camera, rel, time, reducedMotion ? 0 : 0.5);
      stars.position.copy(camera.position);
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      stars.material.uniforms.uReveal.value = 0.3 + 0.7 * sramp(rel, 5, 9);
      stars.material.uniforms.uOpacity.value = 1 - 0.8 * sramp(rel, 13, 17);
      const fall = sramp(rel, 1.5, 5);
      babylon.scale.y = Math.max(0.05, 1 - fall);
      babylon.visible = rel < 5.6;
      ruin.material.uniforms.uTime.value = time;
      ruin.material.uniforms.uAmount.value = pulse(rel, 1.5, 2.5, 5, 5.6);
      ruinFire.material.opacity = pulse(rel, 1.5, 2.5, 4.5, 5.6) * 0.7;
      earth.material.opacity = pulse(rel, 5.5, 8, 10, 13) * 0.6;
      // the city descends
      const down = sramp(rel, 9.5, 15);
      holy.group.position.set(0, lerp(900, 62, down), -600);
      holy.body.material.uniforms.uShow.value = sramp(rel, 9.5, 12);
      holy.body.material.uniforms.uTime.value = time;
      holy.gates.forEach((g) => { g.material.opacity = sramp(rel, 12, 14) * 0.9; });
      // the new earth lit with no need of the sun (Revelation 21:23)
      const day = sramp(rel, 13, 17);
      ground.visible = rel > 12;
      ground.material.emissiveIntensity = 0.15 + 0.2 * day;
      radiance.intensity = day * 160;
      scene.background.setRGB(lerp(0.008, 0.36, day), lerp(0.008, 0.33, day), lerp(0.012, 0.27, day));
      water.material.opacity = 0.9 * sramp(rel, 18.5, 20.5);
      water.update({ time, sunDir: new THREE.Vector3(0, 0.6, -1).normalize() });
      trees.visible = rel > 18.5;
      grove.update({ time, wind: 0.25 });
      trees.children.forEach((c) => { if (c.isPoints) c.material.opacity = 0.95 * sramp(rel, 19, 21.5); });
      // the light of the city is the light everything is seen by
      scene.environment = sky && day > 0.05 ? sky.env : null;
      scene.environmentIntensity = 0.9 * day;
      const finale = sramp(rel, 30.5, 34);
      return {
        grade: { bloom: 0.4, threshold: 0.82, saturation: 1.05, exposure: 0.95 + 0.15 * finale, tint: [1.03, 1, 0.95] },
        audio: { drone: 0.4 * (1 - day), shimmer: 0.3 + 0.6 * day, wind: 0.1, water: 0.4 * sramp(rel, 18.5, 20.5) },
      };
    },
  };
}
