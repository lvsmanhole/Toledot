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

function treeOfLife() {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.6, 14, 12), new THREE.MeshStandardMaterial({ color: 0x5a4632, roughness: 0.9, emissive: 0x2a1a08, emissiveIntensity: 0.5 }));
  trunk.position.y = 7;
  g.add(trunk);
  const r = rng(33);
  const pts = new Float32Array(5000 * 3);
  for (let i = 0; i < 5000; i++) {
    const u = r() * 2 - 1;
    const th = r() * 6.283;
    const d = 9 * Math.cbrt(r());
    const s = Math.sqrt(1 - u * u);
    pts.set([Math.cos(th) * s * d, 16 + u * d * 0.6, Math.sin(th) * s * d], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
  const leaves = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe2a0, size: 0.45, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(leaves);
  return g;
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
  const river = new THREE.Mesh(new THREE.PlaneGeometry(14, 900, 1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.8, 1.6, 1.9), transparent: true, opacity: 0 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set(0, 0, -300);
  scene.add(river);
  const trees = [-1, 1].flatMap((s) => [0, 1, 2, 3].map((k) => {
    const t = treeOfLife();
    t.position.set(s * 20, 0, -120 - k * 70);
    t.visible = false;
    scene.add(t);
    return t;
  }));
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshStandardMaterial({ color: 0x2a3a24, roughness: 1, emissive: 0x2a2410, emissiveIntensity: 0.6 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.2;
  scene.add(ground);
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
      ground.material.emissiveIntensity = 0.2 + 0.5 * day;
      radiance.intensity = day * 160;
      scene.background.setRGB(lerp(0.008, 0.42, day), lerp(0.008, 0.36, day), lerp(0.012, 0.26, day));
      river.material.opacity = sramp(rel, 18.5, 20.5);
      trees.forEach((t) => { t.visible = rel > 18.5; t.scale.setScalar(Math.max(0.001, sramp(rel, 18.5, 21))); });
      const finale = sramp(rel, 30.5, 34);
      return {
        grade: { bloom: 0.6, threshold: 0.75, saturation: 1.05, exposure: 0.95 + 0.15 * finale, tint: [1.03, 1, 0.95] },
        audio: { drone: 0.4 * (1 - day), shimmer: 0.3 + 0.6 * day, wind: 0.1, water: 0.4 * sramp(rel, 18.5, 20.5) },
      };
    },
  };
}
