// Matthew 28 — the first day of the week, very early. A garden before dawn; the stone rolled away;
// light from the empty tomb; women coming with spices stop at the entrance. The sun rises.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { lightShaft, weather } from "../kit/effects.js";
import { figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city, tomb, wall } from "../kit/structures.js";
import { robedGeometry } from "../kit/figures.js";
import { rng } from "../engine/noise.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const SAINTS = new THREE.Vector3(260, 0, 220);

export function create(ctx) {
  const height = composeHeight([heights.rolling(8, 0.01, 361), heights.flatten(0, 0, 14, 30, 2)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 900 },
    sky: (rel) => [[1 - sramp(rel, 2, 9), "night"], [sramp(rel, 2, 9) * (1 - sramp(rel, 9, 13)), "dawn"], [sramp(rel, 9, 13) * (1 - sramp(rel, 13, 15)), "morning"], [sramp(rel, 13, 15), "golden"]],
    camera: [
      [0, [14, 3, 24], [0, 2.2, 0], 44], [6, [6, 2.4, 12], [0, 1.8, -2], 42], [12.6, [-10, 6, 26], [10, 8, -60], 46],
      [12.9, [SAINTS.x + 26, 6, SAINTS.z + 30], [SAINTS.x, 2, SAINTS.z], 46],
      [18, [SAINTS.x + 10, 4, SAINTS.z + 40], [SAINTS.x + 10, 3, SAINTS.z - 40], 48],
      [24, [SAINTS.x + 30, 30, SAINTS.z + 90], [SAINTS.x + 20, 10, SAINTS.z - 160], 46],
    ],
    grade: (rel) => ({ bloom: 0.6, threshold: 0.6, exposure: 1 + 0.2 * pulse(rel, 3, 5, 9, 12) }),
    audio: (rel) => ({ drone: 0.2, shimmer: 0.25 + 0.5 * pulse(rel, 2.5, 4, 10, 13), wind: 0.15 }),
  });
  const h = L.height;
  const grave = tomb();
  grave.position.set(0, h(0, -4), -4);
  L.add(grave);
  const grass = createBlades({ count: 25000, place: placers.disc(0, 6, 50), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.8 }));
  L.add(createTrees({ count: 60, place: placers.disc(0, 0, 120, (x, z) => Math.hypot(x, z) > 16), height: h, kind: "olive", size: [3, 5] }).group);
  const within = glowSprite(0xfff8ea, 6, 0);
  within.position.set(0, h(0, -4) + 1.8, -2.2);
  L.add(within);
  const outpour = lightShaft({ length: 30, top: 1.8, bottom: 6, color: [1, 0.97, 0.9], gain: 0.5 });
  outpour.rotation.x = -Math.PI / 2;
  outpour.position.set(0, h(0, -4) + 1.8, -2.4);
  L.add(outpour);
  const women = [0, 1, 2].map((i) => {
    const f = figure(1.68, { veiled: true });
    L.add(f);
    return f;
  });
  const motes = weather("motes", { count: 1500, box: [30, 12, 30] });
  L.add(motes.points);
  // the graves of the saints stand open; those who slept come out and walk to the holy city
  const saintsGraves = [];
  for (let i = 0; i < 10; i++) {
    const g = tomb();
    const x = SAINTS.x + (i % 5) * 14 - 28;
    const z = SAINTS.z - Math.floor(i / 5) * 18;
    g.scale.setScalar(0.5);
    g.position.set(x, h(x, z) - 0.3, z);
    g.userData.stone.position.x = 4.6;
    g.userData.stone.rotation.y = -2.2;
    L.add(g);
    saintsGraves.push([x, z + 1.4]);
  }
  const CX = SAINTS.x + 20;
  const CZ = SAINTS.z - 220;
  const holy = city({ count: 160, radius: 40, height: (x, z) => h(x + CX, z + CZ), style: "stone", seed: 433 });
  holy.position.set(CX, 0, CZ);
  L.add(holy);
  L.add(wall({ points: Array.from({ length: 16 }, (_, i) => [CX + Math.cos((i / 16) * 6.283) * 46, CZ + Math.sin((i / 16) * 6.283) * 42]), height: h, h: 7, thickness: 2.5, towerEvery: 4, material: "limestone" }));
  const rs = rng(53);
  const saintCount = 60;
  const saintMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9, emissive: 0xfff2d8, emissiveIntensity: 0.35, transparent: true });
  const saints = new THREE.InstancedMesh(robedGeometry(1.75), saintMat, saintCount);
  const paths = Array.from({ length: saintCount }, (_, i) => {
    const [gx, gz] = saintsGraves[i % saintsGraves.length];
    return { from: new THREE.Vector3(gx + (rs() - 0.5) * 1.2, 0, gz + rs() * 1.5), to: new THREE.Vector3(CX + (rs() - 0.5) * 16, 0, CZ + 48 + rs() * 6), delay: rs() * 0.4 };
  });
  L.add(saints);
  const sm = new THREE.Matrix4();
  const sp = new THREE.Vector3();
  const sq = new THREE.Quaternion();
  const sScale = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  L.onUpdate(({ rel, time }) => {
    const out = sramp(rel, 13, 16);
    const walk = sramp(rel, 15.5, 23.5);
    saintMat.opacity = sramp(rel, 12.8, 14);
    saints.visible = rel > 12.8;
    paths.forEach((p, i) => {
      const k = sramp(walk, p.delay, p.delay + 0.6);
      const emerge = sramp(out, p.delay * 0.5, p.delay * 0.5 + 0.5);
      sp.copy(p.from).lerp(p.to, k);
      sp.y = h(sp.x, sp.z) + (k > 0 && k < 1 ? Math.abs(Math.sin(time * 3 + i)) * 0.04 : 0);
      sq.setFromAxisAngle(yAxis, Math.atan2(p.to.x - p.from.x, p.to.z - p.from.z));
      sm.compose(sp, sq, sScale.set(1, Math.max(0.001, emerge), 1));
      saints.setMatrixAt(i, sm);
    });
    saints.instanceMatrix.needsUpdate = true;
  });
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    const { stone } = grave.userData;
    const roll = sramp(rel, 0.5, 2.5);
    stone.position.x = roll * 4.6;
    stone.rotation.y = -roll * 2.2;
    const light = sramp(rel, 2, 4.5);
    within.material.opacity = light * 0.9;
    outpour.material.uniforms.uAmount.value = light;
    outpour.material.uniforms.uTime.value = time;
    const walk = sramp(rel, 3, 7);
    women.forEach((w, i) => {
      w.position.set(lerp(18, 2.5, walk) + i * 1.1, 0, lerp(14, 4.5, walk) + (i - 1) * 0.8);
      w.position.y = h(w.position.x, w.position.z) + (walk > 0 && walk < 1 ? Math.abs(Math.sin(time * 3 + i)) * 0.04 : 0);
      w.lookAt(0, w.position.y, -3);
      w.rotation.x = 0.25 * pulse(rel, 7, 8, 12, 13);
    });
    motes.update({ time, pixelRatio, amount: light * 0.7, center: camera.position });
  });
  return L;
}
