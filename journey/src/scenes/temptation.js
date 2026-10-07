// Matthew 4:1–11 — the temptation in the wilderness. Forty days and nights pass over a stony desert. The
// tempter comes: never a cartoon, only a tall darkness with a smouldering edge and smoke at its feet.
// Stones that could be bread. The pinnacle of the temple high over the courts of Jerusalem. An exceeding
// high mountain, and all the kingdoms of the world and the glory of them lit across the plain below.
// "Get thee hence, Satan": the darkness breaks apart; angels come and minister unto him.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { surfaceMaterial } from "../kit/surface.js";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { smoke, weather } from "../kit/effects.js";
import { figure, robedGeometry } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, solomonTemple, wall } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { placers } from "../kit/vegetation.js";
import { NOISE, rng } from "../engine/noise.js";

const CITY = [520, 60];
const PEAK = [-460, -260];

function tempter() {
  // a robed form taller than a man, black at the core with an ember rim that flickers like a coal
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uShow: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      void main() {
        vP = position;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uShow;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${NOISE}
      void main() {
        float rim = pow(1.0 - abs(dot(vN, vV)), 2.5);
        float flick = 0.6 + 0.4 * snoise(vec3(vP * 3.0 + vec3(0.0, uTime * 1.5, 0.0)));
        // the lower edge frays into smoke
        float fray = smoothstep(0.0, 0.6, vP.y + 0.25 * snoise(vec3(vP.xz * 4.0, uTime * 0.4)));
        vec3 col = vec3(0.01, 0.008, 0.008) + vec3(0.75, 0.16, 0.04) * rim * flick;
        float a = uShow * fray;
        if (a < 0.02) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true,
  });
  const body = new THREE.Mesh(robedGeometry(2.5), material);
  const group = new THREE.Group();
  group.add(body);
  const haze = smoke({ rise: 5, spread: 1.6, color: [0.04, 0.03, 0.03], opacity: 0.5, size: 24, count: 260, seed: 66 });
  group.add(haze);
  return {
    group,
    set(show, time) {
      material.uniforms.uShow.value = show;
      material.uniforms.uTime.value = time;
      haze.material.uniforms.uTime.value = time;
      haze.material.uniforms.uAmount.value = show;
      group.visible = show > 0.01;
    },
  };
}

export function create(ctx) {
  const height = composeHeight([
    heights.rolling(10, 0.01, 411), heights.dunes(3, 40, 0.8, 412),
    heights.mountain(CITY[0], CITY[1], 110, 46, 413, 1.4), heights.flatten(CITY[0], CITY[1], 70, 90, 46),
    heights.mountain(PEAK[0], PEAK[1], 220, 320, 414, 1.15),
  ], 0);
  const peakY = height(PEAK[0], PEAK[1]);
  const cityY = height(CITY[0], CITY[1]);
  // the pinnacle: a tall corner of the temple court
  const PIN = new THREE.Vector3(CITY[0] + 38, cityY + 34, CITY[1] + 22);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "sinai", size: 1800 },
    sky: (rel) => {
      if (rel < 5.5) return "desert";
      if (rel < 8.6) { const d = 0.5 + 0.5 * Math.sin(rel * 6.3); return [[d, "desert"], [1 - d, "night"]]; }
      if (rel < 15.8) return [[1, "dusk"]];
      if (rel < 22.3) return [[1, "dusk"]];
      if (rel < 29.2) return [[1, "golden"]];
      return [[1 - sramp(rel, 29.2, 31), "golden"], [sramp(rel, 29.2, 31), "sacred"]];
    },
    camera: [
      [0, [70, 30, 90], [0, 4, 0], 44],
      [5, [14, 4, 18], [0, 1.4, 0], 46],
      [8.6, [10, 3.4, 12], [-2, 1.8, -1], 44],
      [12, [6, 2.6, 8], [-2.5, 2, -2], 42],
      [15.6, [8, 3, 6], [-2, 1.5, 0], 44],
      [15.9, [PIN.x + 30, PIN.y + 14, PIN.z + 36], [PIN.x, PIN.y, PIN.z], 48],
      [19, [PIN.x + 3, PIN.y + 4, PIN.z + 5], [PIN.x - 2, PIN.y + 1.5, PIN.z], 50],
      [22, [PIN.x + 1.5, PIN.y + 3.5, PIN.z + 1.5], [PIN.x - 8, cityY, PIN.z - 6], 72],
      [22.4, [PEAK[0] + 10, peakY + 5, PEAK[1] + 14], [PEAK[0], peakY + 2, PEAK[1]], 46],
      [25.5, [PEAK[0] - 4, peakY + 6, PEAK[1] + 3], [PEAK[0] + 520, peakY - 200, PEAK[1] + 420], 60],
      [29, [PEAK[0] + 7, peakY + 3.5, PEAK[1] + 9], [PEAK[0], peakY + 2, PEAK[1]], 44],
      [34, [PEAK[0] + 26, peakY + 18, PEAK[1] + 34], [PEAK[0], peakY + 3, PEAK[1]], 48],
    ],
    keepAboveGround: true,
    grade: (rel) => ({ saturation: rel < 29 ? 0.85 : 1, bloom: 0.35 + 0.35 * sramp(rel, 29.5, 31.5), threshold: 0.8 }),
    audio: (rel) => ({ drone: 0.3 + 0.35 * pulse(rel, 8.8, 9.6, 28, 29.5), wind: 0.3, fire: 0.15 * pulse(rel, 8.8, 9.6, 28, 29.5), shimmer: 0.5 * sramp(rel, 29.5, 31.5) }),
  });
  const h = L.height;

  // the wilderness: stones like loaves
  const r = rng(9);
  const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.35, 1).scale(1.2, 0.6, 1), new THREE.MeshStandardMaterial({ color: 0x9a8a72, roughness: 1 }), 400);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 400; i++) {
    const a = r() * Math.PI * 2;
    const d = 1.5 + Math.sqrt(r()) * 40;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d;
    m.compose(new THREE.Vector3(x, h(x, z) + 0.1, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, r() * 6, 0)), new THREE.Vector3(1, 1, 1).multiplyScalar(0.6 + r() * 1.2));
    stones.setMatrixAt(i, m);
  }
  L.add(stones);
  const jesus = figure(1.8);
  L.add(jesus);
  const dark = tempter();
  L.add(dark.group);

  // Jerusalem and the temple on its hill, with the pinnacle
  const town = city({ count: 300, radius: 80, inner: 40, height: h, style: "stone", seed: 415 });
  L.add(town);
  const temple = solomonTemple();
  temple.position.set(CITY[0], cityY - 0.2, CITY[1]);
  L.add(temple);
  L.add(wall({ points: Array.from({ length: 20 }, (_, i) => [CITY[0] + Math.cos(i / 20 * 6.283) * 86, CITY[1] + Math.sin(i / 20 * 6.283) * 80]), height: h, h: 8, thickness: 3, towerEvery: 4, material: "limestone" }));
  // the pinnacle: the corner where the temple court's walls meet over the drop to the valley, built of
  // great Herodian ashlars, each course set back a little from the one below, a parapet at the top
  const ashlar = surfaceMaterial("limestone", { tile: 2.4, tint: [0.62, 0.56, 0.47] });
  const parts = [];
  const H = 34;
  const courses = 22;
  for (let c = 0; c < courses; c++) {
    const y = PIN.y - H + (c / courses) * H;
    const ch = H / courses - 0.06; // a dark joint between courses
    const inset = c * 0.035;
    // two wall arms running back from the corner, west and north
    parts.push(new THREE.BoxGeometry(26 - inset, ch, 5 - inset).translate(PIN.x - 13 + inset / 2, y + ch / 2, PIN.z - inset / 2));
    parts.push(new THREE.BoxGeometry(5 - inset, ch, 26 - inset).translate(PIN.x - inset / 2, y + ch / 2, PIN.z - 13 + inset / 2));
  }
  // the parapet round the corner's top
  for (const [w, d, x, z] of [[26, 0.6, PIN.x - 13, PIN.z + 2.2], [0.6, 26, PIN.x + 2.2, PIN.z - 13]]) parts.push(new THREE.BoxGeometry(w, 1.1, d).translate(x, PIN.y + 0.55, z));
  const pinnacle = new THREE.Mesh(mergeGeometries(parts.map((g) => { g.deleteAttribute("uv"); return g.toNonIndexed(); })), ashlar);
  pinnacle.castShadow = pinnacle.receiveShadow = true;
  L.add(pinnacle);
  const pinLight = new THREE.PointLight(0xffc890, 0, 80, 1.3);
  pinLight.position.set(PIN.x + 10, PIN.y + 8, PIN.z + 10);
  L.add(pinLight);
  const cityLamps = [];
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d = 30 + r() * 50;
    const x = CITY[0] + Math.cos(a) * d;
    const z = CITY[1] + Math.sin(a) * d;
    const g = glowSprite(0xffb060, 2.4, 0);
    g.position.set(x, h(x, z) + 3, z);
    L.add(g);
    cityLamps.push(g);
  }

  // all the kingdoms of the world, and the glory of them, spread across the plain below the mountain
  const kingdoms = [];
  for (let i = 0; i < 16; i++) {
    const a = -0.2 + (i / 15) * 1.6;
    const d = 380 + r() * 380;
    const x = PEAK[0] + Math.cos(a) * d;
    const z = PEAK[1] + Math.sin(a) * d;
    const c = city({ count: 70, radius: 18, height: (xx, zz) => h(xx + x, zz + z), style: i % 3 ? "mud" : "white", seed: 420 + i });
    c.position.set(x, 0, z);
    L.add(c);
    const glory = glowSprite(0xffcf7a, 70 + r() * 50, 0);
    glory.position.set(x, h(x, z) + 14, z);
    L.add(glory);
    kingdoms.push(glory);
  }

  // angels came and ministered unto him
  const angels = [0, 1, 2, 3, 4, 5].map(() => {
    const a = glowSprite(0xfff4dc, 4, 0);
    L.add(a);
    return a;
  });
  const motes = weather("motes", { count: 1500, box: [30, 14, 30] });
  L.add(motes.points);

  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    // where the two stand
    let at;
    if (rel < 15.8) at = new THREE.Vector3(0, h(0, 0), 0);
    else if (rel < 22.3) at = PIN.clone();
    else at = new THREE.Vector3(PEAK[0], peakY, PEAK[1]);
    const fasting = sramp(rel, 5.5, 8.6);
    jesus.position.copy(at);
    jesus.rotation.x = rel < 15.8 ? 0.18 * fasting * (1 - sramp(rel, 12.5, 13.5)) : 0;
    jesus.rotation.y = rel < 15.8 ? -0.6 : rel < 22.3 ? -1.2 : 0.8;
    // the tempter, from his coming until "Get thee hence"
    const present = pulse(rel, 8.8, 10, 26.5, 28.5);
    dark.set(present, time);
    const off = rel < 15.8 ? new THREE.Vector3(-3.2, 0, -2.4) : rel < 22.3 ? new THREE.Vector3(1.8, 0, 0.6) : new THREE.Vector3(2.6, 0, -1.6);
    dark.group.position.copy(at).add(off);
    if (rel < 15.8) dark.group.position.y = h(dark.group.position.x, dark.group.position.z);
    else if (rel >= 22.3) dark.group.position.y = h(dark.group.position.x, dark.group.position.z);
    dark.group.lookAt(at.x, dark.group.position.y, at.z);
    // "Get thee hence": the darkness rises and is gone
    dark.group.position.y += sramp(rel, 26.5, 28.5) * 6;
    // the stones glint as if they could be bread
    stones.material.emissive.setRGB(0.12, 0.07, 0.02).multiplyScalar(pulse(rel, 9.5, 10.5, 12, 13));
    pinLight.intensity = rel > 15.6 && rel < 22.6 ? 300 : 0;
    cityLamps.forEach((g, i) => { g.material.opacity = (rel > 15.6 && rel < 22.6 ? 0.8 : 0) * (0.75 + 0.25 * Math.sin(time * 4 + i)); });
    const show = pulse(rel, 23, 24.5, 26.5, 28);
    kingdoms.forEach((g, i) => { g.material.opacity = sramp(show, i / 32, i / 32 + 0.4) * 0.55; });
    const minister = sramp(rel, 29.5, 32);
    angels.forEach((a, i) => {
      const ang = (i / 6) * Math.PI * 2 + time * 0.1;
      a.position.set(at.x + Math.cos(ang) * 4, at.y + lerp(40, 2.5, minister) + Math.sin(time + i) * 0.3, at.z + Math.sin(ang) * 4);
      a.material.opacity = minister * 0.9;
    });
    motes.update({ time, pixelRatio, amount: minister * 0.8, center: at });
    return {};
  });
  return L;
}
