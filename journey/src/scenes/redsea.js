// Exodus 13–15 — the Red Sea. The camp at the shore at night, the pillar of fire between Israel and the
// torches of Egypt. A strong east wind; the sea divides; the camera enters between walls of water (with
// shapes of fish inside them) and travels the sea floor; at dawn the walls fall back.

import * as THREE from "three";

import { glowSprite, lerp, pulse, ramp, sramp } from "../kit/common.js";
import { pillar, weather } from "../kit/effects.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { NOISE, rng } from "../engine/noise.js";
import { tents } from "../kit/structures.js";
import { placers } from "../kit/vegetation.js";

const HALF = 14; // half-width of the dry corridor
const LEN = 700;

function waterWall(side) {
  const geometry = new THREE.BoxGeometry(60, 1, LEN, 1, 1, 1);
  geometry.translate(side * (HALF + 30), 0.5, -LEN / 2 + 40);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLight: { value: 0.4 }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vWorld;
      varying vec3 vNormalW;
      #include <fog_pars_vertex>
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uLight;
      varying vec3 vWorld;
      varying vec3 vNormalW;
      #include <fog_pars_fragment>
      ${NOISE}
      void main() {
        vec3 p = vWorld * 0.06;
        float caust = pow(abs(snoise(vec3(p.y * 2.0, p.z * 2.0 + uTime * 0.2, uTime * 0.15))), 0.6);
        float depth = clamp(vWorld.y / 40.0, 0.0, 1.0);
        vec3 col = mix(vec3(0.01, 0.04, 0.05), vec3(0.06, 0.22, 0.24), depth) * (0.6 + 0.8 * caust) * uLight;
        float foam = smoothstep(0.92, 1.0, depth) * (0.5 + 0.5 * snoise(vec3(p.z * 4.0, uTime, 1.0)));
        col += vec3(0.6, 0.7, 0.72) * foam * uLight;
        gl_FragColor = vec4(col, 0.92);
        #include <fog_fragment>
      }
    `,
    transparent: true,
    fog: true,
  });
  return new THREE.Mesh(geometry, material);
}

export function create(ctx) {
  const shore = (x, z) => (z > 40 ? 1.5 + Math.min(4, (z - 40) * 0.08) : lerp(-26, -24, Math.abs(x) / 400) + Math.max(0, Math.abs(x) - HALF) * -0.02);
  const L = createLandscape(ctx, {
    terrain: { height: shore, palette: "sinai", size: 1600, center: [0, -300] },
    water: { size: 2000, wave: 0.5, chop: 1, flow: 0.4, level: 0 },
    sky: (rel) => [[1 - sramp(rel, 17, 22), "night"], [sramp(rel, 17, 22), "dawn"]],
    wind: (rel) => 0.4 + 1.6 * pulse(rel, 9, 11, 19, 21),
    camera: [
      [0, [120, 40, 240], [0, 5, 60], 44],
      [6, [30, 10, 110], [0, 5, 40], 46],
      [10.5, [0, 30, 120], [0, 0, -60], 50],
      [15, [0, -18, 30], [0, -18, -60], 54],
      [20, [0, -19, -260], [0, -16, -360], 52],
      [23.5, [0, 10, -470], [0, 0, -300], 50],
      [30, [-60, 20, -560], [0, 2, -360], 46],
    ],
    keepAboveGround: false,
    grade: () => ({ bloom: 0.5, threshold: 0.6 }),
    audio: (rel) => ({ water: 0.4 + 0.5 * pulse(rel, 10, 12, 20, 25), wind: 0.25 + 0.7 * pulse(rel, 9, 11, 19, 21), drone: 0.35, shimmer: 0.3 * sramp(rel, 25, 27) }),
  });
  const h = L.height;
  // the camp on the western shore and Egypt's torches behind it
  const camp = tents({ count: 160, radius: 70, inner: 4, height: h, seed: 23 });
  camp.position.set(0, 0, 90);
  L.add(camp);
  const people = crowd({ count: ctx.quality === "low" ? 400 : 900, place: placers.box(-60, 40, 60, 110), height: h, seed: 21, face: [0, -200] });
  L.add(people.group);
  const torches = [];
  const rt = rng(4);
  for (let i = 0; i < 60; i++) {
    const t = glowSprite(0xff8a3a, 2.5, 0);
    t.position.set((rt() - 0.5) * 160, 3 + rt() * 2, 230 + rt() * 60);
    L.add(t);
    torches.push(t);
  }
  const fire = pillar({ radius: 5, height: 160, color: [1, 0.55, 0.2], gain: 1.4 });
  fire.position.set(0, 1, 165);
  L.add(fire);

  // the walls of water and the two halves of the sea outside the corridor
  const walls = [waterWall(-1), waterWall(1)];
  walls.forEach((w) => L.add(w));
  const fish = new THREE.InstancedMesh(new THREE.SphereGeometry(0.6, 8, 6).scale(2.2, 0.6, 0.6), new THREE.MeshBasicMaterial({ color: 0x0a1416 }), 160);
  const fm = new THREE.Matrix4();
  const rf = rng(12);
  for (let i = 0; i < 160; i++) {
    const side = rf() < 0.5 ? -1 : 1;
    fm.makeTranslation(side * (HALF + 0.5 + rf() * 1.5), -22 + rf() * 30, -rf() * 600 + 30);
    fish.setMatrixAt(i, fm);
  }
  L.add(fish);
  const people2 = crowd({ count: 300, place: placers.box(-10, -400, 10, 0), height: h, seed: 27, face: [0, -800] });
  L.add(people2.group);
  const spray = weather("rain", { count: 3000, box: [60, 40, 60] });
  L.add(spray.points);

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    torches.forEach((t, i) => { t.material.opacity = (1 - sramp(rel, 20, 21)) * (0.6 + 0.3 * Math.sin(time * 5 + i)); });
    fire.material.uniforms.uAmount.value = 1 - sramp(rel, 16, 19);
    fire.material.uniforms.uTime.value = time;
    // the sea divides (10.5–14.5), stands as walls, and returns at dawn (21–24)
    const part = sramp(rel, 10.5, 14.5) * (1 - sramp(rel, 21, 23.5));
    const wallH = Math.max(0.01, part * 50);
    for (const w of walls) {
      w.scale.y = wallH;
      w.position.y = -26;
      w.material.uniforms.uTime.value = time;
      w.material.uniforms.uLight.value = lerp(0.35, 1.1, sramp(rel, 17, 22));
      w.visible = part > 0.01;
    }
    fish.visible = part > 0.6;
    L.water.mesh.visible = part < 0.98 || camera.position.y > 5;
    L.water.mesh.position.y = part > 0.5 ? -40 : 0;
    L.water.material.uniforms.uWave.value = 0.5 + 1.5 * pulse(rel, 9, 11, 13, 15) + 2 * pulse(rel, 21, 22, 24, 26);
    people2.group.visible = part > 0.5;
    people2.group.position.z = -sramp(rel, 14, 22) * 380;
    people2.group.position.y = -24;
    spray.update({ time, pixelRatio, amount: 0.6 * pulse(rel, 9.5, 11, 14, 15) + 0.8 * pulse(rel, 21, 21.5, 23.5, 24.5), center: camera.position, wind: [0.2, -1] });
  });
  return L;
}
