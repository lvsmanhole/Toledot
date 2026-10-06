// Act III — Cain, Abel and early humanity (Genesis 4–5). Two altars on a harsh plain: Abel's smoke
// rises, Cain's lies low. The field. The city of Enoch rising. Then the generations to Noah walk past as
// posts of light along the golden line, Enoch taken up into light.

import * as THREE from "three";

import { glowSprite, lerp, pulse, ramp, sramp, textSprite } from "../kit/common.js";
import { flame, lineageThread, smoke } from "../kit/effects.js";
import { crowd, figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { altar, city } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, placers } from "../kit/vegetation.js";

const GENERATIONS = ["Seth", "Enos", "Cainan", "Mahalaleel", "Jared", "Enoch", "Methuselah", "Lamech", "Noah"];

export function create(ctx) {
  const height = composeHeight([heights.rolling(5, 0.01, 31), heights.ring(340, 520, 70, 33), heights.flatten(0, 0, 30, 60, 1.2)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 1200 },
    sky: (rel) => {
      if (rel < 15) return [[1 - ramp(rel, 9, 14), "golden"], [ramp(rel, 9, 14), "dusk"]];
      // generations: days pass quickly
      const day = 0.5 + 0.5 * Math.sin(rel * 2.2);
      return [[day, "morning"], [1 - day, "night"]];
    },
    wind: (rel) => 0.35 + 0.4 * pulse(rel, 10, 11, 14, 15),
    camera: [
      [0, [-30, 9, 46], [0, 4, 0]],
      [6, [-14, 5, 22], [2, 4, -2]],
      [10.5, [18, 4, 18], [-4, 3, -6]],
      [14.5, [30, 3.5, -10], [44, 1.5, -24], 44],
      [18.5, [10, 22, 40], [-60, 14, -150], 46],
      [22, [-60, 9, 30], [-110, 6, -20]],
      [30, [-250, 10, 30], [-310, 7, 0]],
    ],
    audio: (rel) => ({ drone: 0.3 + 0.3 * pulse(rel, 10, 11, 14, 15), wind: 0.25 }),
  });
  const h = L.height;
  const at = (x, z, dy = 0) => new THREE.Vector3(x, h(x, z) + dy, z);

  // grass on the plain, a field of grain on Cain's side, Abel's flock on the other
  const grass = createBlades({ count: ctx.quality === "low" ? 25000 : 70000, place: placers.disc(0, 0, 150), height: h });
  const wheat = createBlades({ kind: "wheat", count: ctx.quality === "low" ? 6000 : 16000, place: placers.box(14, -30, 46, 4), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: lerp(1, 0.6, ramp(s.rel, 9, 14)) }));
  L.add(wheat.mesh, (s) => wheat.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  L.add(herd({ kind: "sheep", count: 36, place: placers.disc(-26, -14, 12), height: h, seed: 4 }));

  // the two altars, their fires and smoke
  const abelAltar = altar({ size: 1.6, seed: 2 });
  abelAltar.position.copy(at(-6, -4));
  const cainAltar = altar({ size: 1.6, seed: 9 });
  cainAltar.position.copy(at(8, -6));
  L.add(abelAltar);
  L.add(cainAltar);
  const abelFire = flame({ width: 1.8, height: 3.2, gain: 0.7, seed: 1 });
  abelFire.position.copy(at(-6, -4, 1.2));
  const cainFire = flame({ width: 1.4, height: 1.6, gain: 0.45, seed: 7 });
  cainFire.position.copy(at(8, -6, 1.2));
  const abelSmoke = smoke({ rise: 60, spread: 1.5, lean: [0.02, 0], color: [0.85, 0.8, 0.72], opacity: 0.22, lit: true, size: 30 });
  abelSmoke.position.copy(at(-6, -4, 2));
  const cainSmoke = smoke({ rise: 9, spread: 4, lean: [1.6, 0.6], color: [0.32, 0.3, 0.29], opacity: 0.35, seed: 8, size: 34 });
  cainSmoke.position.copy(at(8, -6, 2));
  for (const o of [abelFire, cainFire, abelSmoke, cainSmoke]) L.add(o);
  const brothers = [figure(1.75, { staff: true }), figure(1.8)];
  brothers[0].position.copy(at(-8.5, -1.5));
  brothers[1].position.copy(at(10.5, -3));
  brothers.forEach((b) => L.add(b));
  L.onUpdate(({ rel, time }) => {
    const offer = pulse(rel, 0.5, 2, 10, 11.5);
    for (const f of [abelFire, cainFire]) { f.material.uniforms.uTime.value = time; f.material.uniforms.uAmount.value = offer; f.visible = offer > 0.01; }
    abelSmoke.material.uniforms.uTime.value = time;
    cainSmoke.material.uniforms.uTime.value = time;
    abelSmoke.material.uniforms.uAmount.value = offer;
    cainSmoke.material.uniforms.uAmount.value = offer;
    brothers.forEach((b) => { b.visible = rel < 11; });
  });

  // the field: one standing, one fallen; a faint red where the ground received the blood (restrained)
  const standing = figure(1.8);
  standing.position.copy(at(42, -22));
  standing.rotation.y = -0.8;
  const fallen = figure(1.75);
  fallen.rotation.set(0, 0.4, Math.PI / 2);
  fallen.position.copy(at(44.5, -24.5, 0.22));
  const groundGlow = glowSprite(0x8a1a10, 5, 0);
  groundGlow.position.copy(at(44.5, -24.5, 0.3));
  L.add(standing);
  L.add(fallen);
  L.add(groundGlow);
  L.onUpdate(({ rel }) => {
    const field = pulse(rel, 10, 11, 14.5, 15.5);
    standing.visible = fallen.visible = field > 0.01;
    groundGlow.material.opacity = field * 0.55;
  });

  // the city of Enoch rising in the distance, with the people who built it
  const enoch = city({ count: 160, radius: 30, height: (x, z) => h(x - 60, z - 150), style: "mud", seed: 12 });
  enoch.position.set(-60, 0, -150);
  L.add(enoch);
  const builders = crowd({ count: 120, place: placers.disc(-60, -150, 36), height: h, seed: 5 });
  L.add(builders.group);
  L.onUpdate(({ rel }) => {
    const grow = sramp(rel, 14.5, 18.5);
    enoch.scale.set(1, Math.max(0.001, grow), 1);
    enoch.visible = rel > 14;
    builders.group.visible = rel > 14 && rel < 21;
  });

  // the generations from Seth to Noah: posts of light along the golden line (Genesis 5)
  const posts = GENERATIONS.map((name, i) => {
    const x = -120 - i * 22;
    const z = Math.sin(i * 0.9) * 8;
    const group = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 7, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 1.6, 0.7), transparent: true, opacity: 0 }));
    beam.position.y = 3.5;
    const label = textSprite(name, { size: 64, scale: 1.4, color: "#f2dca6" });
    label.position.y = 8.2;
    label.material.opacity = 0;
    const glow = glowSprite(0xffd38a, 6, 0);
    glow.position.y = 7;
    group.add(beam, label, glow);
    group.position.copy(at(x, z));
    L.add(group);
    return { group, beam, label, glow, x, name, rise: name === "Enoch" };
  });
  const thread = lineageThread(posts.map((p) => [p.group.position.x, p.group.position.y + 1.2, p.group.position.z]));
  L.add(thread);
  L.onUpdate(({ rel, time }) => {
    const draw = sramp(rel, 19, 29);
    thread.material.uniforms.uDraw.value = draw;
    thread.material.uniforms.uTime.value = time;
    posts.forEach((p, i) => {
      const on = sramp(draw, i / posts.length, i / posts.length + 0.06);
      p.beam.material.opacity = on;
      p.label.material.opacity = on;
      p.glow.material.opacity = on * 0.6;
      if (p.rise) {
        // "and he was not; for God took him"
        const up = sramp(rel, 24, 27.5);
        p.group.position.y = h(p.x, 0) + up * 40;
        p.glow.scale.setScalar(6 + up * 30);
        p.label.material.opacity = on * (1 - up * 0.6);
      }
    });
  });

  return L;
}
