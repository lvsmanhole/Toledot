// 1 Samuel 17 — the valley of Elah. Two armies on opposite ridges; the camera descends into the valley
// between them. The tension is scale: the champion of Gath and a shepherd boy with a sling. One stone.
// He falls on his face. No violence beyond that.

import * as THREE from "three";

import { lerp, pulse, sramp } from "../kit/common.js";
import { armour, crowd, figure, shield } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers, scatterPlants } from "../kit/vegetation.js";

export function create(ctx) {
  // a valley running along z with ridges at x = ±80
  const valley = (x) => 34 * Math.pow(Math.min(1, Math.abs(x) / 90), 1.6);
  const height = composeHeight([valley, heights.rolling(5, 0.012, 241)], 0);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 1200 },
    sky: () => "morning",
    wind: () => 0.4,
    camera: [
      [0, [0, 70, 160], [0, 20, 0], 46],
      [6, [-30, 30, 60], [10, 8, 0], 44],
      [11, [-14, 3, 10], [6, 4, -2], 40],
      [14, [-7, 1.4, 6], [12, 4, -6], 36],
      [17, [-9, 2, 12], [12, 1, -6], 38],
      [20, [0, 40, 90], [0, 10, -20], 44],
    ],
    grade: () => ({ saturation: 1.1, tint: [1.02, 1, 0.92], exposure: 0.72 }),
    audio: (rel) => ({ drone: 0.25 + 0.5 * pulse(rel, 8, 12, 15, 16), wind: 0.4 }),
  });
  const h = L.height;
  const grass = createBlades({ count: ctx.quality === "low" ? 25000 : 60000, place: placers.box(-60, -120, 60, 120), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  // scrub, thistle and tussock over the valley sides (the Shephelah in spring)
  L.add(scatterPlants({ count: ctx.quality === "low" ? 140 : 320, place: placers.box(-120, -160, 120, 160, (x) => Math.abs(x) > 6), height: h }));
  L.add(createTrees({ count: 120, place: placers.box(-150, -300, 150, 300, (x) => Math.abs(x) > 20), height: h, kind: "olive", size: [3, 5] }).group);
  const israel = crowd({ count: ctx.quality === "low" ? 600 : 1500, place: placers.box(-95, -80, -70, 80), height: h, seed: 81, face: [80, 0] });
  const philistines = crowd({ count: ctx.quality === "low" ? 600 : 1500, place: placers.box(70, -80, 95, 80), height: h, seed: 83, face: [-80, 0] });
  L.add(israel.group);
  L.add(philistines.group);
  const goliath = figure(1.75);
  goliath.scale.setScalar(1.75); // six cubits and a span (1 Samuel 17:4)
  goliath.add(armour(1.75)); // helmet of brass, coat of mail, the spear like a weaver's beam (17:5-7)
  L.add(goliath);
  // "and one bearing a shield went before him" (17:7)
  const bearer = figure(1.7);
  bearer.add(shield(1.7));
  L.add(bearer);
  const david = figure(1.55, { staff: true });
  L.add(david);
  const stone = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  L.add(stone);
  L.onUpdate(({ rel, time }) => {
    const gx = lerp(40, 14, sramp(rel, 6, 12));
    const fall = sramp(rel, 14.6, 15.6);
    goliath.position.set(gx, h(gx, -6), -6);
    goliath.rotation.set(0, -Math.PI / 2, 0);
    goliath.rotateX(-fall * Math.PI / 2 * 0.98);
    const back = sramp(rel, 15, 17);
    bearer.position.set(gx - 3 + back * 6, 0, -4.4);
    bearer.position.y = h(bearer.position.x, bearer.position.z);
    bearer.rotation.y = -Math.PI / 2 + back * Math.PI;
    const dx = lerp(-40, -2, sramp(rel, 6, 12));
    david.position.set(dx, h(dx, -6), -6);
    david.rotation.y = Math.PI / 2;
    const flight = sramp(rel, 13.6, 14.6);
    stone.visible = flight > 0 && flight < 1;
    stone.position.set(lerp(dx, gx, flight), h(gx, -6) + lerp(1.6, 2.9, flight) + Math.sin(flight * Math.PI) * 0.6, -6);
    israel.group.position.y = Math.sin(time * 2) * 0.03;
  });
  return L;
}
