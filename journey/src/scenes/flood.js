// Act IV — the Flood (Genesis 6–9). A city of violence burning on the plain; Noah and the ark rising
// from its ribs; the animals going in; the storm; water climbing past every hill while the camera rises
// with it; silence; the dove; the ark on the mountains of Ararat; the bow in the cloud.

import * as THREE from "three";

import { glowSprite, lerp, pulse, ramp, sramp } from "../kit/common.js";
import { flame, rainbow, smoke, weather } from "../kit/effects.js";
import { figure, procession } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { ark, city } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

const ARARAT = [0, -260];

export function create(ctx) {
  const height = composeHeight([
    heights.rolling(9, 0.008, 51), heights.mountain(ARARAT[0], ARARAT[1], 110, 98, 52, 1.2), heights.mountain(-170, -200, 80, 60, 53),
    heights.mountain(170, -220, 70, 52, 54), heights.flatten(0, 0, 25, 60, 1.5), heights.flatten(130, -60, 30, 60, 3),
  ], 0.5);
  // where the ark comes to rest: on Ararat's southern shoulder, at the height the receding water leaves it
  const REST_LEVEL = 58;
  let restZ = ARARAT[1] + 110;
  for (let z = ARARAT[1] + 140; z > ARARAT[1]; z -= 0.5) if (height(0, z) >= REST_LEVEL) { restZ = z; break; }
  const REST = new THREE.Vector3(0, REST_LEVEL, restZ + 16); // the full-length hull lies along the shoulder, not into it

  const level = (rel) => {
    if (rel < 19) return -3;
    if (rel < 33) return lerp(-3, 104, Math.pow(ramp(rel, 19, 33), 1.3));
    if (rel < 34) return 104;
    return lerp(104, REST_LEVEL - 0.6, sramp(rel, 34, 45));
  };

  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 1100 },
    water: { size: 2400, wave: 0.15, chop: 1.2, flow: 0.25, deep: [0.02, 0.05, 0.06] },
    sky: (rel) => {
      const storm = pulse(rel, 15, 21, 33, 36);
      const grey = pulse(rel, 33, 35, 42, 46);
      const clear = sramp(rel, 44, 48);
      return [[Math.max(0, 1 - storm - grey - clear) * (rel < 8 ? 0.6 : 1), "golden"], [rel < 8 ? 0.4 : 0, "dusk"], [storm, "storm"], [grey, "dawn"], [clear, "morning"]];
    },
    lightning: (rel) => pulse(rel, 18, 21, 30, 33),
    wind: (rel) => 0.3 + 1.6 * pulse(rel, 17, 21, 31, 34) + 0.6 * pulse(rel, 34, 35, 38, 40),
    camera: [
      [0, [190, 34, 40], [130, 6, -60]],
      [5, [70, 16, 96], [0, 9, 0]],
      [10, [-46, 9, 74], [0, 10, 0]],
      [14, [-96, 10, 64], [-30, 5, 24]],
      [18.5, [-70, 24, 120], [0, 10, 0]],
      [24, [20, 34, 170], [0, 16, 0]],
      [30, [30, 70, 150], [0, 60, -40]],
      [33, [24, 112, 120], [0, 104, -80]],
      [38, [36, 114, 50], [0, 104, -140]],
      [42, [42, 88, -100], [0, 70, -210]],
      [46, [58, 78, -140], [0, REST_LEVEL + 3, restZ]],
      [52, [110, 88, -110], [0, REST_LEVEL + 10, restZ - 40]],
    ],
    grade: (rel) => ({ saturation: 1 - 0.45 * pulse(rel, 19, 23, 40, 46), bloom: 0.3 + 0.3 * sramp(rel, 46, 49) }),
    audio: (rel) => ({ drone: 0.35 + 0.35 * pulse(rel, 19, 24, 33, 35), water: pulse(rel, 22, 26, 44, 47), wind: 0.2 + 0.7 * pulse(rel, 17, 21, 33, 35), shimmer: 0.3 * sramp(rel, 46, 49) }),
  });
  const h = L.height;
  const at = (x, z, dy = 0) => new THREE.Vector3(x, h(x, z) + dy, z);

  L.add(createTrees({ count: 160, place: placers.disc(0, 0, 200, (x, z) => Math.hypot(x, z) > 80 && Math.hypot(x - 130, z + 60) > 45), height: h, kind: "olive", size: [3, 6] }).group);
  const grass = createBlades({ count: ctx.quality === "low" ? 20000 : 50000, place: placers.disc(-10, 10, 90), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.8 }));

  // the city whose violence filled the earth: fires on its roofs
  const town = city({ count: 220, radius: 32, height: (x, z) => h(x + 130, z - 60), style: "mud", seed: 21 });
  town.position.set(130, 0, -60);
  L.add(town);
  const fires = [];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const f = flame({ width: 3, height: 6, gain: 0.7, seed: i });
    f.position.copy(at(130 + Math.cos(a) * (6 + i * 2.6), -60 + Math.sin(a) * (6 + i * 2.6), 3));
    L.add(f);
    fires.push(f);
  }
  const citySmoke = smoke({ rise: 70, spread: 18, lean: [0.6, -0.2], color: [0.2, 0.18, 0.17], opacity: 0.32, size: 40 });
  citySmoke.position.copy(at(130, -60, 4));
  L.add(citySmoke);

  // Noah, the ark, and the procession of the animals
  // at full size: three hundred cubits by fifty by thirty (Genesis 6:15), about 137 by 23 by 14 metres
  const ARK = 4.5;
  const boat = ark();
  boat.scale.setScalar(ARK);
  boat.position.copy(at(0, 0, -0.2));
  boat.rotation.y = 0.35;
  L.add(boat);
  const noah = figure(1.8, { staff: true });
  noah.position.copy(at(-34, 26));
  L.add(noah);
  const lamp = glowSprite(0xffd8a0, 4, 0);
  lamp.position.copy(at(-34, 26, 1.6));
  L.add(lamp);
  const animals = procession({ pairs: 20, from: [-150, 110], to: [-6, 14], height: h });
  L.add(animals.group);
  const door = glowSprite(0xffd8a0, 14, 0);
  L.add(door);

  // storm: rain, then the calm; the dove; the bow
  const rain = weather("rain", { count: ctx.quality === "low" ? 6000 : 14000, box: [90, 60, 90] });
  L.add(rain.points);
  const dove = glowSprite(0xffffff, 1.4, 0);
  L.add(dove);
  const bow = rainbow({ radius: 170, width: 14 });
  bow.position.set(REST.x - 40, REST_LEVEL - 40, REST.z - 220);
  bow.rotation.y = -0.25;
  L.add(bow);

  const tmp = new THREE.Vector3();
  L.onUpdate(({ rel, time, pixelRatio, camera, reducedMotion }) => {
    const wl = level(rel);
    L.water.mesh.position.y = wl;
    L.water.material.uniforms.uWave.value = 0.15 + 1.4 * pulse(rel, 20, 24, 32, 35) + 0.25 * pulse(rel, 34, 35, 40, 44);
    L.water.mesh.visible = wl > -2.5;
    if (camera.position.y < wl + 3) camera.position.y = wl + 3;

    // the city burns until the water takes it
    const burning = 1 - sramp(rel, 22, 26);
    fires.forEach((f) => { f.material.uniforms.uTime.value = time; f.material.uniforms.uAmount.value = burning; f.visible = burning > 0.01; });
    citySmoke.material.uniforms.uTime.value = time;
    citySmoke.material.uniforms.uAmount.value = burning;

    // building the ark: ribs first, then the hull and roof close over them
    const built = sramp(rel, 9, 15);
    const { hullMesh, roofMesh, ribMesh } = boat.userData;
    hullMesh.scale.y = Math.max(0.02, built);
    roofMesh.visible = built > 0.85;
    ribMesh.visible = built < 0.98;
    noah.visible = rel < 18;
    lamp.material.opacity = pulse(rel, 6, 7, 17, 18) * 0.7;

    // the animals go in; "and the LORD shut him in"
    animals.set(ramp(rel, 14, 18.5), time);
    animals.group.visible = rel > 13.5 && rel < 19;
    door.position.copy(boat.position).add(tmp.set(-1, 1.6, 2.6).multiplyScalar(ARK).applyAxisAngle(new THREE.Vector3(0, 1, 0), boat.rotation.y));
    door.material.opacity = pulse(rel, 14, 15, 17.5, 18.4) * 0.9;

    // afloat: the ark rides the water, drifts north, and comes to rest on Ararat
    const floatK = sramp(rel, 24, 44);
    const base = at(0, 0, -0.2);
    const drift = base.clone().lerp(REST, floatK);
    const floating = wl > base.y - 0.5;
    boat.position.x = drift.x;
    boat.position.z = drift.z;
    boat.position.y = floating ? Math.max(wl - 5, rel > 45 ? REST.y - 0.6 : -Infinity) + (rel < 45 && !reducedMotion ? Math.sin(time * 0.9) * 0.25 : 0) : base.y;
    boat.rotation.z = floating && rel < 44 ? Math.sin(time * 0.7) * 0.03 * (1 + 2 * pulse(rel, 22, 24, 31, 33)) : 0;

    rain.update({ time, pixelRatio, amount: pulse(rel, 19, 22, 32, 34.5), center: camera.position, wind: [0.6, 0.15] });

    // the dove returns at evening with an olive leaf
    const flight = ramp(rel, 38.5, 42);
    dove.material.opacity = pulse(rel, 38.5, 39.2, 41.5, 42.2);
    dove.position.copy(boat.position).add(tmp.set(lerp(-160, 0, flight), lerp(40, 16, flight) + Math.sin(time * 6) * 0.3, lerp(-80, 0, flight)));

    bow.material.uniforms.uAmount.value = sramp(rel, 46.5, 49.5);
    bow.visible = rel > 46;
    return {};
  });

  return L;
}
