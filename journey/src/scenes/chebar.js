// Ezekiel 1 — by the river of Chebar among the captives the heavens open. A whirlwind out of the north,
// a great cloud and a fire infolding itself, amber at its heart. Out of it four living creatures, each
// with four faces and four wings, wings joined above; beside each a wheel in the middle of a wheel, full
// of eyes. Over their heads a firmament like crystal; above it a throne like sapphire, the likeness of a
// man upon it, and round about a brightness like the bow in the cloud. Ezekiel 10:20: they were the
// cherubims.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { flame, smoke } from "../kit/effects.js";
import { livingCreature } from "../kit/cherub.js";
import { crowd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";
import { NOISE } from "../engine/noise.js";

const river = (z) => 60 + Math.sin(z * 0.01) * 8;
const C = new THREE.Vector3(0, 0, -80); // centre of the four

export function create(ctx) {
  const height = composeHeight([heights.rolling(2, 0.006, 401), heights.channel(river, 10, -1.4, 8)], 1);
  const ground = height(C.x, C.z);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "mesopotamia", size: 1400, wetLevel: 0.9 },
    water: { size: 1400, flow: 0.3, flowDir: [0, 1], deep: [0.04, 0.07, 0.06], level: -0.2 },
    sky: (rel) => [[1 - sramp(rel, 4, 8), "dusk"], [sramp(rel, 4, 8), "storm"]],
    lightning: (rel) => 0.6 * pulse(rel, 5, 7, 18, 21),
    wind: (rel) => 0.3 + 1.2 * pulse(rel, 5, 7, 12, 14),
    camera: [
      [0, [river(40) - 18, 3, 50], [river(20), 1, 10], 46],
      [5.5, [river(40) - 22, 4, 46], [0, 40, -260], 52],
      [9.8, [24, 9, -40], [C.x, ground + 6, C.z], 50],
      [13.8, [-14, 8, -66], [C.x, ground + 6, C.z], 46],
      [17.5, [10, 2.2, -62], [C.x + 6, ground + 9, C.z - 4], 64],
      [22, [0, ground + 24, -30], [C.x, ground + 22, C.z - 4], 54],
    ],
    grade: (rel) => ({ bloom: 0.45 + 0.35 * sramp(rel, 18, 21), threshold: 0.75, saturation: 0.95 }),
    audio: (rel) => ({ drone: 0.4 + 0.3 * pulse(rel, 5, 8, 18, 22), wind: 0.25 + 0.6 * pulse(rel, 5, 7, 12, 14), fire: 0.35 * pulse(rel, 6, 8, 17, 20), shimmer: 0.5 * sramp(rel, 18, 21), water: 0.3 }),
  });
  const h = L.height;
  L.add(createTrees({ count: 120, place: placers.box(river(0) - 40, -300, river(0) + 40, 300, (x, z) => Math.abs(x - river(z)) > 14), height: h, kind: "willow", size: [4, 7] }).group);
  const captives = crowd({ count: 70, place: placers.box(river(0) - 26, 10, river(0) - 14, 80), height: h, seed: 403, face: [river(30), 30] });
  captives.group.scale.y = 0.62;
  L.add(captives.group);

  // the whirlwind out of the north: cloud, infolding fire, amber at its heart (Ezekiel 1:4)
  const storm = new THREE.Group();
  storm.position.set(0, 0, -260);
  L.add(storm);
  const cloud = smoke({ rise: 160, spread: 70, lean: [0, 0.3], color: [0.16, 0.15, 0.15], opacity: 0.5, size: 260, count: 1400, seed: 9 });
  storm.add(cloud);
  const infolding = [0, 1, 2, 3, 4, 5].map((i) => {
    const f = flame({ width: 26, height: 40, gain: 0.9, seed: i * 2.7 });
    f.position.set(Math.cos(i) * 18, 30 + i * 6, Math.sin(i) * 18);
    storm.add(f);
    return f;
  });
  const amber = glowSprite(0xffb648, 90, 0);
  amber.position.set(0, 60, 0);
  storm.add(amber);

  // the four, wings stretched upward and joined, a wheel beside each
  const creatures = [0, 1, 2, 3].map((i) => {
    const c = livingCreature({ scale: 1.6, wheelSide: 1, wingsJoin: 1.4, seed: 11 + i });
    const a = (i / 4) * Math.PI * 2;
    c.group.position.set(C.x + Math.sin(a) * 9, ground, C.z + Math.cos(a) * 9);
    c.group.rotation.y = a; // each faces outward, "they went every one straight forward" (Ezekiel 1:9)
    L.add(c.group);
    return c;
  });

  // the firmament like crystal, and above it the throne like a sapphire (Ezekiel 1:22, 1:26–28)
  const firmament = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 0.6, 64), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uShow: { value: 0 } },
    vertexShader: /* glsl */ `varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uShow;
      varying vec3 vP;
      ${NOISE}
      void main() {
        float n = snoise(vec3(vP.xz * 0.15, uTime * 0.1));
        float r = length(vP.xz) / 22.0;
        float a = uShow * (0.25 + 0.2 * n) * (1.0 - smoothstep(0.85, 1.0, r));
        gl_FragColor = vec4(vec3(0.82, 0.92, 1.0) * a * 1.4, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  firmament.position.set(C.x, ground + 17, C.z);
  L.add(firmament);
  const sapphire = new THREE.MeshStandardMaterial({ color: 0x2a5ad8, emissive: 0x1a3c9a, emissiveIntensity: 0.9, metalness: 0.3, roughness: 0.08, transparent: true, opacity: 0 });
  const throne = new THREE.Group();
  const part = (w, hh, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), sapphire); m.position.set(x, y, z); throne.add(m); };
  part(6, 0.6, 4, 0, 0.3, 0); // step
  part(4.6, 0.6, 3.2, 0, 0.9, -0.2); // step
  part(3.6, 1.6, 2.6, 0, 2, -0.4); // seat
  part(3.6, 5.2, 0.6, 0, 4.4, -1.6); // back
  part(0.5, 1.4, 2.4, -1.9, 3.4, -0.4); // arms
  part(0.5, 1.4, 2.4, 1.9, 3.4, -0.4);
  throne.position.set(C.x, ground + 17.4, C.z - 3);
  L.add(throne);
  const likeness = glowSprite(0xffe6b0, 16, 0);
  likeness.position.set(C.x, ground + 22.6, C.z - 3.4);
  L.add(likeness);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(15, 0.8, 12, 120), new THREE.ShaderMaterial({
    uniforms: { uShow: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uShow;
      varying vec2 vUv;
      void main() {
        float x = vUv.y;
        vec3 c = clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0);
        gl_FragColor = vec4(c * uShow * 1.2, uShow * 0.6);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  bow.position.set(C.x, ground + 23, C.z - 5);
  L.add(bow);

  L.onUpdate(({ rel, time, pixelRatio, reducedMotion }) => {
    const come = sramp(rel, 5, 10);
    storm.position.z = lerp(-260, C.z - 30, come);
    const stormOn = pulse(rel, 4.5, 6.5, 17, 20);
    cloud.material.uniforms.uTime.value = time;
    cloud.material.uniforms.uAmount.value = stormOn;
    infolding.forEach((f, i) => {
      f.material.uniforms.uTime.value = time;
      f.material.uniforms.uAmount.value = stormOn;
      const a = time * 0.6 + i;
      f.position.set(Math.cos(a) * 18, 30 + i * 6, Math.sin(a) * 18);
    });
    amber.material.opacity = stormOn * 0.7;
    const four = sramp(rel, 9, 11.5);
    creatures.forEach((c) => c.set(four, time, reducedMotion, pixelRatio));
    const glory = sramp(rel, 17.5, 20.5);
    firmament.material.uniforms.uShow.value = glory;
    firmament.material.uniforms.uTime.value = time;
    sapphire.opacity = glory * 0.85;
    throne.visible = glory > 0.01;
    likeness.material.opacity = glory * 0.9;
    bow.material.uniforms.uShow.value = glory;
    bow.rotation.z = time * 0.05;
  });
  return L;
}
