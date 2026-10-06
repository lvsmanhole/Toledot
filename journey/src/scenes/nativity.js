// Luke 1–2, Matthew 2 — the Word made flesh. A small room and a shaft of light; a young woman kneeling.
// Night in the fields near Bethlehem: shepherds, a flock, a fire. A light stands over them; then the sky
// fills with a multitude of lights. A star over the town; a small warm light in a low house.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { flame, lightShaft, weather } from "../kit/effects.js";
import { figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { city } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const ROOM = new THREE.Vector3(400, 0, 400);

export function create(ctx) {
  const height = composeHeight([heights.rolling(12, 0.008, 321), heights.mountain(-60, -140, 70, 26, 322), heights.flatten(0, 0, 30, 60, 6)], 2);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "judea", size: 1300 },
    sky: () => "night",
    camera: [
      [0, [ROOM.x + 4, 6 + 1.6, ROOM.z + 5], [ROOM.x - 1, 6 + 1.1, ROOM.z], 50],
      [5, [ROOM.x + 3, 6 + 1.5, ROOM.z + 3.5], [ROOM.x - 1, 6 + 1.6, ROOM.z], 46],
      [5.6, [30, 8, 40], [0, 4, 0], 44],
      [9.5, [18, 5, 20], [0, 4, 0], 46],
      [13.5, [14, 4, 18], [0, 40, -30], 60],
      [18.5, [10, 5, 24], [-60, 30, -140], 54],
      [20, [-40, 34, -112], [-60, 27, -140], 44],
    ],
    grade: (rel) => ({ bloom: 0.8, threshold: 0.45, exposure: 1 + 0.2 * pulse(rel, 10, 11, 18, 19) }),
    audio: (rel) => ({ drone: 0.25, shimmer: 0.25 + 0.6 * pulse(rel, 10, 11.5, 18, 19.5), wind: 0.12, fire: 0.15 * pulse(rel, 5.5, 6, 13, 14) }),
  });
  const h = L.height;
  // the room in Nazareth (staged away from the fields)
  const roomGroup = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(8, 5, 8), new THREE.MeshStandardMaterial({ color: 0x8a7a64, roughness: 1, side: THREE.BackSide }));
  walls.position.y = 2.5;
  roomGroup.add(walls);
  const mary = figure(1.55, { veiled: true });
  mary.position.set(-1, 0, 0);
  mary.rotation.x = 0.3;
  roomGroup.add(mary);
  const beam = lightShaft({ length: 12, top: 0.5, bottom: 1.8, color: [1, 0.95, 0.82], gain: 0.9 });
  beam.rotation.z = Math.PI + 0.5;
  beam.position.set(-6, 9, 0);
  roomGroup.add(beam);
  const presence = glowSprite(0xfff4e0, 3.5, 0);
  presence.position.set(1.4, 2.2, 0);
  roomGroup.add(presence);
  roomGroup.position.copy(ROOM).setY(6);
  const roomLight = new THREE.PointLight(0xfff0d8, 30, 14, 1.4);
  roomLight.position.set(0.5, 3, 0);
  roomGroup.add(roomLight);
  L.add(roomGroup);
  // the fields
  const grass = createBlades({ count: 30000, place: placers.disc(0, 0, 70), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.6 }));
  L.add(herd({ kind: "sheep", count: 60, place: placers.disc(-6, -8, 14), height: h, seed: 13 }));
  const shepherds = [0, 1, 2, 3].map((i) => {
    const f = figure(1.75, { staff: i % 2 === 0 });
    f.position.set(Math.cos(i * 1.6) * 3.5, h(0, 0), Math.sin(i * 1.6) * 3.5);
    f.lookAt(0, f.position.y, 0);
    L.add(f);
    return f;
  });
  const fire = flame({ width: 1, height: 1.6, gain: 0.9 });
  fire.position.set(0, h(0, 0), 0);
  L.add(fire, ({ time }) => { fire.material.uniforms.uTime.value = time; });
  const fireLight = new THREE.PointLight(0xff9a50, 25, 20, 1.6);
  fireLight.position.set(0, h(0, 0) + 1, 0);
  L.add(fireLight);
  L.add(createTrees({ count: 90, place: placers.disc(0, 0, 260, (x, z) => Math.hypot(x, z) > 40), height: h, kind: "olive", size: [3, 5] }).group);
  // Bethlehem on its ridge, a star above, a warm light in one house
  const town = city({ count: 90, radius: 18, height: (x, z) => h(x - 60, z + 140), style: "stone", seed: 123 });
  town.position.set(-60, 0, -140);
  L.add(town);
  const star = glowSprite(0xfff8e8, 24, 0);
  star.position.set(-60, 120, -160);
  L.add(star);
  const manger = glowSprite(0xffc070, 4, 0);
  manger.position.set(-58, h(-58, -132) + 2, -132);
  L.add(manger);
  // the angel and the multitude of the heavenly host
  const angel = glowSprite(0xffffff, 30, 0);
  angel.position.set(0, 40, -30);
  L.add(angel);
  const host = weather("motes", { count: ctx.quality === "low" ? 3000 : 8000, box: [220, 120, 220] });
  host.material.uniforms.uSize.value = 2.2;
  L.add(host.points);
  L.onUpdate(({ rel, time, pixelRatio }) => {
    roomGroup.visible = rel < 5.6;
    beam.material.uniforms.uAmount.value = sramp(rel, 0.3, 2);
    beam.material.uniforms.uTime.value = time;
    presence.material.opacity = pulse(rel, 1, 2, 4.5, 5.5) * 0.8;
    angel.material.opacity = pulse(rel, 10, 11, 17.5, 19) * 0.9;
    host.update({ time, pixelRatio, amount: pulse(rel, 13.5, 15, 18, 19.5), center: new THREE.Vector3(0, 40, -40) });
    star.material.opacity = sramp(rel, 17, 19) * (0.85 + 0.1 * Math.sin(time * 2));
    manger.material.opacity = sramp(rel, 18.5, 19.5) * 0.9;
    shepherds.forEach((s, i) => { s.rotation.x = 0.35 * pulse(rel, 10.2 + i * 0.1, 11, 13, 14); });
  });
  return L;
}
