// Act XVII — Solomon and the first temple. Jerusalem at its height in gold and stone. A slow flight in:
// the court and the altar, the porch between Jachin and Boaz, the holy place and its lamps, the veil,
// the most holy place and the ark beneath the cherubim — light growing more sacred and more minimal —
// until the cloud fills the house. Then out into heaven, which cannot contain him; the queen of Sheba's
// caravan; and a crack running through it all as the kingdom divides.

import * as THREE from "three";

import { glowSprite, lerp, pulse, ramp, sramp } from "../kit/common.js";
import { crowd, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, solomonTemple, wall } from "../kit/structures.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { jerusalemHeight } from "./david.js";

const T = new THREE.Vector3(0, 0, 0); // temple origin on the mount

export function create(ctx) {
  const height = jerusalemHeight(261);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1300 },
    sky: (rel) => (rel < 22 ? "golden" : rel < 27 ? [[1, "sacred"]] : rel < 32 ? "desert" : [[1 - sramp(rel, 32, 35), "golden"], [sramp(rel, 32, 35), "ash"]]),
    camera: [
      [0, [-160, 70, 160], [0, 30, 0], 44],
      [5, [80, 40, 40], [20, 32, 0], 44],
      [8, [52, 31, 6], [36, 32, 0], 50],
      [11, [30, 31.5, 0], [21.5, 34, 0], 56],
      [14, [17, 32, 0], [10, 33, 0], 58],
      [17, [6, 32.2, 0], [-4, 33, 0], 56],
      [20.5, [-6, 31.5, 0], [-11, 31.5, 0], 56],
      [22.5, [-8, 34, 0], [-10, 120, 0], 64],
      [27, [-40, 260, 80], [0, 600, -200], 60],
      [27.5, [140, 18, 160], [60, 6, 100], 44],
      [32, [70, 30, 90], [0, 30, 0], 44],
      [36, [-30, 120, 200], [0, 20, 0], 44],
    ],
    grade: (rel) => ({ bloom: 0.35 + 0.5 * pulse(rel, 17, 19, 22, 24), threshold: 0.6, saturation: rel > 32 ? 1 - 0.3 * sramp(rel, 32, 35) : 1 }),
    audio: (rel) => ({ drone: 0.3 + 0.2 * pulse(rel, 16, 18, 22, 24), shimmer: 0.2 + 0.5 * pulse(rel, 16, 18, 24, 27), wind: 0.15 }),
  });
  const h = L.height;
  const top = h(0, 0);
  const temple = solomonTemple();
  temple.position.set(T.x, top - 0.2, T.z);
  L.add(temple);
  const town = city({ count: 420, radius: 120, inner: 60, height: h, style: "stone", seed: 97 });
  L.add(town);
  L.add(wall({ points: Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * 6.283) * 128, Math.sin(i / 24 * 6.283) * 118]), height: h, h: 9, thickness: 3, towerEvery: 3, material: "limestone" }));
  L.add(createTrees({ count: 220, place: placers.disc(0, 0, 340, (x, z) => Math.hypot(x, z) > 140), height: h, kind: "olive", size: [3, 5] }).group);
  const worshippers = crowd({ count: 240, place: placers.box(30, -20, 60, 20), height: () => top - 0.1, seed: 99, face: [0, 0] });
  L.add(worshippers.group);
  // interior light: lamps of the holy place, then the glory filling the house
  const lamps = [];
  for (let i = 0; i < 10; i++) {
    const g = glowSprite(0xffc070, 1.1, 0.9);
    g.position.set(12 - (i % 5) * 3.2, top + 2.6, i < 5 ? -4 : 4);
    L.add(g);
    lamps.push(g);
  }
  const holyLight = new THREE.PointLight(0xffd090, 160, 40, 1.2);
  holyLight.position.set(8, top + 6, 0);
  L.add(holyLight);
  const shekinah = new THREE.PointLight(0xfff4e0, 0, 60, 1.2);
  shekinah.position.set(-10, top + 6, 0);
  L.add(shekinah);
  const glory = glowSprite(0xffffff, 40, 0);
  glory.position.set(-6, top + 8, 0);
  L.add(glory);
  // the queen of Sheba's train
  const caravan = herd({ kind: "camel", count: 30, place: (r) => [200 + r() * 160, 140 + (r() - 0.5) * 8], height: h, seed: 101 });
  L.add(caravan);
  // the crack: a seam of fire running through the land between north and south
  const crack = new THREE.Mesh(new THREE.PlaneGeometry(4, 900, 1, 120), new THREE.ShaderMaterial({
    uniforms: { uOpen: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; vec3 p = position; p.x += sin(p.y * 0.09) * 6.0 + sin(p.y * 0.31) * 2.0; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
    fragmentShader: /* glsl */ `uniform float uOpen; varying vec2 vUv; void main() { float on = step(1.0 - uOpen, vUv.y); float core = exp(-pow((vUv.x - 0.5) * 6.0, 2.0)); float a = core * on; if (a < 0.02) discard; gl_FragColor = vec4(vec3(1.0, 0.45, 0.15) * a * 2.5, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  crack.rotation.x = -Math.PI / 2;
  crack.rotation.z = Math.PI / 2;
  crack.position.set(0, top + 0.6, -36);
  L.add(crack);

  const { veil } = temple.userData;
  L.onUpdate(({ rel, time, camera, reducedMotion }) => {
    const inside = rel > 11 && rel < 23;
    lamps.forEach((l, i) => { l.material.opacity = (inside ? 0.9 : 0.3) * (0.8 + 0.2 * Math.sin(time * 5 + i)); });
    holyLight.intensity = inside ? 160 : 0;
    const cloud = pulse(rel, 17.5, 19.5, 22.5, 24);
    shekinah.intensity = cloud * 400;
    glory.material.opacity = cloud * 0.85;
    glory.scale.setScalar(20 + cloud * 60);
    veil.visible = rel < 19.5;
    worshippers.group.visible = rel < 11;
    caravan.position.x = -lerp(0, 160, sramp(rel, 27.5, 32));
    caravan.visible = rel > 27 && rel < 33;
    const open = sramp(rel, 32.5, 35.5);
    crack.material.uniforms.uOpen.value = open;
    crack.visible = open > 0.001;
    if (open > 0 && open < 1 && !reducedMotion) {
      camera.position.x += Math.sin(time * 40) * 0.5 * pulse(rel, 32.5, 33, 35, 35.8);
      camera.position.y += Math.sin(time * 47) * 0.4 * pulse(rel, 32.5, 33, 35, 35.8);
    }
    return { grade: { exposure: 1 + 0.3 * cloud } };
  });
  return L;
}
