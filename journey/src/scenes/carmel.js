// 1 Kings 18 — Mount Carmel. A cloudless sky after the years of drought. Two altars on the ridge; the
// prophets of Baal circling theirs through the day; the people silent. Elijah's altar of twelve stones,
// the trench full of water. Silence. Then fire falls.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { flame, pillar, smoke, weather } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { altar } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createTrees, placers } from "../kit/vegetation.js";

export function create(ctx) {
  const height = composeHeight([heights.rolling(10, 0.008, 271), heights.mountain(0, 0, 120, 60, 272, 1.1), heights.flatten(0, 0, 26, 40, 58)], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1200 },
    water: { size: 3000, wave: 0.2, level: -2, deep: [0.02, 0.06, 0.08] },
    sky: (rel) => [[1 - sramp(rel, 6, 9), "morning"], [sramp(rel, 6, 9) * (1 - sramp(rel, 13, 17)), "golden"], [sramp(rel, 13, 17), "dusk"]],
    storm: false,
    camera: [
      [0, [-120, 90, 160], [0, 58, 0], 44],
      [5.5, [24, 62, 36], [-10, 59, 0], 44],
      [8.5, [16, 60.5, 14], [6, 60, 0], 40],
      [11, [30, 66, 40], [6, 66, 0], 44],
      [18, [-30, 80, 90], [6, 60, 0], 42],
    ],
    grade: (rel) => ({ bloom: 0.25 + 0.45 * pulse(rel, 9, 9.6, 12, 14), threshold: 0.9, exposure: 1 + 0.12 * pulse(rel, 9, 9.4, 10.5, 12) }),
    audio: (rel) => ({ drone: 0.25 + 0.3 * pulse(rel, 6, 8, 9, 9.3), wind: 0.25 * (1 - pulse(rel, 6.5, 8, 8.8, 9)), fire: 0.8 * pulse(rel, 9, 9.3, 12, 14), shimmer: 0.3 * pulse(rel, 12, 13, 17, 18) }),
  });
  const h = L.height;
  const top = h(0, 0);
  L.add(createTrees({ count: 120, place: placers.disc(0, 0, 220, (x, z) => Math.hypot(x, z) > 45), height: h, kind: "olive", size: [3, 5] }).group);
  const baalAltar = altar({ size: 2, seed: 41, material: "basalt" });
  baalAltar.position.set(-10, top, 0);
  L.add(baalAltar);
  const elijahAltar = altar({ size: 2, seed: 12, material: "limestone" });
  elijahAltar.position.set(6, top, 0);
  L.add(elijahAltar);
  // the trench dug about the altar and filled with water (1 Kings 18:32-35): dark still water sunk a little
  // below a rim of turned earth
  const trench = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.3, 48), new THREE.MeshStandardMaterial({ color: 0x14201f, roughness: 0.06, metalness: 0, envMapIntensity: 0.6 }));
  trench.rotation.x = -Math.PI / 2;
  trench.position.set(6, top + 0.03, 0);
  L.add(trench);
  const spoil = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.22, 6, 48).rotateX(Math.PI / 2).scale(1, 0.45, 1), new THREE.MeshStandardMaterial({ color: 0x5a4a38, roughness: 1 }));
  spoil.position.set(6, top, 0);
  L.add(spoil);
  const elijah = figure(1.8, { staff: true });
  elijah.position.set(9, top, 3);
  elijah.lookAt(6, top, 0);
  L.add(elijah);
  // the prophets of Baal circling their altar; the people standing back
  const baalProphets = crowd({ count: 120, place: (r) => { const a = r() * 6.283; const d = 4 + r() * 3; return [Math.cos(a) * d, Math.sin(a) * d]; }, height: () => 0, seed: 43 });
  baalProphets.group.position.set(-10, top, 0);
  L.add(baalProphets.group);
  const people = crowd({ count: ctx.quality === "low" ? 500 : 1100, place: placers.box(-30, 14, 26, 34), height: h, seed: 45, face: [0, 0] });
  L.add(people.group);
  // the fire of the LORD
  const shaft = pillar({ radius: 3.5, height: 600, color: [1, 0.75, 0.4], gain: 1.2 });
  shaft.position.set(6, top, 0);
  L.add(shaft);
  const blaze = [0, 1, 2].map((i) => {
    const f = flame({ width: 6 + i, height: 12 + i * 2, gain: 1, seed: i * 2.1 });
    f.position.set(6 + (i - 1) * 1.2, top + 0.5, 0);
    L.add(f);
    return f;
  });
  const burst = glowSprite(0xffd080, 30, 0);
  burst.position.set(6, top + 4, 0);
  L.add(burst);
  const after = smoke({ rise: 80, spread: 6, color: [0.5, 0.45, 0.4], opacity: 0.3, size: 50, count: 700 });
  after.position.set(6, top + 2, 0);
  L.add(after);
  const sparks = weather("embers", { count: 2000, box: [40, 30, 40] });
  L.add(sparks.points);
  L.onUpdate(({ rel, time, pixelRatio, camera }) => {
    baalProphets.group.rotation.y = time * 0.4 * (1 - sramp(rel, 6, 8));
    baalProphets.group.position.y = top + Math.abs(Math.sin(time * 4)) * 0.15 * (1 - sramp(rel, 6, 8));
    const strike = pulse(rel, 9, 9.25, 10.2, 11.5);
    shaft.material.uniforms.uAmount.value = strike;
    shaft.material.uniforms.uTime.value = time;
    shaft.visible = strike > 0.01;
    const burn = pulse(rel, 9.1, 9.4, 12, 14);
    blaze.forEach((f) => { f.material.uniforms.uAmount.value = burn; f.material.uniforms.uTime.value = time; f.visible = burn > 0.01; });
    burst.material.opacity = pulse(rel, 9, 9.2, 9.8, 11) * 0.5;
    trench.visible = rel < 10;
    spoil.visible = true;
    after.material.uniforms.uAmount.value = sramp(rel, 10, 12);
    after.material.uniforms.uTime.value = time;
    sparks.update({ time, pixelRatio, amount: pulse(rel, 9.1, 9.6, 11.5, 13) * 0.8, center: camera.position });
    // the people fall on their faces (1 Kings 18:39)
    people.group.scale.y = lerp(1, 0.45, sramp(rel, 12.5, 13.5));
  });
  return L;
}
