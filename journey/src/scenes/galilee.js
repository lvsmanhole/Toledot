// The Sea of Galilee (Matthew 4–17, Mark 1–9, Luke 4–9). Boats at dawn and the call; a crowd on the
// hillside; the storm on the lake and the great calm; bread and twelve baskets; then a high mountain and
// one transfigured, his face as the sun.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { glowSprite, lerp, pulse, sramp } from "../kit/common.js";
import { lightShaft, smoke } from "../kit/effects.js";
import { crowd, figure } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { MATERIALS } from "../kit/structures.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, createTrees, placers } from "../kit/vegetation.js";

function boat() {
  // a lake fishing boat of the period (the hull found at Ginosar, ~8.2 m by 2.3 m): a rounded plank hull
  // lofted from its sections, the sheer rising to bow and stern, thwarts, a little stern deck, a mast
  // with the sail furled on its yard
  const L = 8.2;
  const B = 1.15;
  const nu = 40;
  const nv = 16;
  const pos = [];
  const idx = [];
  for (let i = 0; i <= nu; i++) {
    const u = i / nu;
    const x = (u - 0.5) * L;
    const beam = B * Math.pow(Math.sin(Math.PI * u), 0.55);
    const top = 0.85 + 0.45 * (2 * u - 1) ** 2;
    const bottom = -0.38 * Math.pow(Math.sin(Math.PI * u), 0.4) + 0.05;
    for (let j = 0; j <= nv; j++) {
      const th = (j / nv - 0.5) * Math.PI;
      const sv = Math.sin(th);
      // planking: a slight step at each strake
      const strake = Math.floor(Math.abs(sv) * 7) * 0.012;
      pos.push(x, bottom + (top - bottom) * Math.pow(Math.abs(sv), 1.6), (beam + strake) * sv);
    }
  }
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j;
      const b = a + nv + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const hull = new THREE.BufferGeometry();
  hull.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  hull.setIndex(idx);
  hull.computeVertexNormals();
  const g = new THREE.Group();
  const planks = MATERIALS.darkWood();
  planks.side = THREE.DoubleSide;
  const hullMesh = new THREE.Mesh(hull, planks);
  hullMesh.castShadow = true;
  g.add(hullMesh);
  const wood = MATERIALS.wood();
  const parts = [
    new THREE.BoxGeometry(5.6, 0.05, 1.5).translate(0, 0.02, 0), // floorboards
    new THREE.BoxGeometry(0.22, 0.06, 2.1).translate(-1.2, 0.6, 0), // thwarts
    new THREE.BoxGeometry(0.22, 0.06, 2.1).translate(1.0, 0.6, 0),
    new THREE.BoxGeometry(1.3, 0.06, 1.3).translate(-3.2, 0.85, 0), // stern deck, where one might sleep on a pillow (Mark 4:38)
    new THREE.BoxGeometry(4.2, 0.08, 0.08).rotateY(Math.PI / 2).translate(0.4, 5.2, 0), // the yard, athwart
  ];
  g.add(new THREE.Mesh(mergeGeometries(parts.map((q) => q.toNonIndexed())), wood));
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 6), wood);
  mast.position.set(0.4, 3, 0);
  g.add(mast);
  const sail = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 3.9, 10).rotateX(Math.PI / 2), MATERIALS.cloth(0xb8ab92));
  sail.position.set(0.4, 5.05, 0);
  g.add(sail);
  return g;
}

export function create(ctx) {
  // a lake basin ringed by hills; the mount of transfiguration to the north
  const basin = (x, z) => Math.max(0, Math.hypot(x, z * 1.4) - 140) * 0.18;
  const height = composeHeight([basin, heights.rolling(8, 0.01, 341), heights.mountain(40, -420, 120, 140, 342, 1.2), (x, z) => (Math.hypot(x, z * 1.4) < 140 ? -6 : 0)], 0);
  const py = height(40, -420);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "garden", size: 1400, wetLevel: 0.6 },
    water: { size: 600, wave: 0.15, chop: 1, flow: 0.2, deep: [0.04, 0.08, 0.1], level: 0 },
    sky: (rel) => {
      if (rel < 5) return [[1, "dawn"]];
      if (rel < 9) return "morning";
      if (rel < 13.6) return [[pulse(rel, 9, 10, 12.8, 13.6), "storm"], [1 - pulse(rel, 9, 10, 12.8, 13.6), "morning"]];
      if (rel < 20) return "golden";
      return [[1, "sacred"]];
    },
    lightning: (rel) => pulse(rel, 9.6, 10.2, 12.4, 12.9),
    wind: (rel) => 0.3 + 1.6 * pulse(rel, 9.3, 10, 12.6, 13),
    camera: [
      [0, [-80, 8, 120], [0, 1, 60], 44],
      [4.5, [-30, 4, 90], [-10, 1, 70], 44],
      [5, [150, 20, 40], [130, 14, 0], 44],
      [9, [100, 14, 40], [140, 16, 0], 44],
      [9.5, [20, 4, 30], [0, 1, 0], 46],
      [14, [12, 3, 18], [0, 1, 0], 44],
      [15, [-120, 22, -60], [-150, 16, -100], 44],
      [20, [-130, 20, -70], [-150, 18, -100], 42],
      [21, [70, py + 30, -330], [40, py + 4, -420], 46],
      [30, [62, py + 14, -380], [40, py + 3, -420], 40],
    ],
    grade: (rel) => ({ bloom: 0.3 + 0.6 * sramp(rel, 21, 23), threshold: rel > 20 ? 0.55 : 1 }),
    audio: (rel) => ({ water: 0.45, wind: 0.2 + 0.7 * pulse(rel, 9.3, 10, 12.6, 13), drone: 0.25, shimmer: 0.5 * sramp(rel, 21, 23) }),
  });
  const h = L.height;
  const grass = createBlades({ count: ctx.quality === "low" ? 25000 : 60000, place: placers.box(-260, -200, 260, 200, (x, z) => Math.hypot(x, z * 1.4) > 150), height: h, maxH: 60 });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  L.add(createTrees({ count: 200, place: placers.box(-400, -400, 400, 400, (x, z) => Math.hypot(x, z * 1.4) > 170), height: h, kind: "olive", size: [3, 5] }).group);
  // boats; the one in the storm carries the disciples
  const boats = [boat(), boat(), boat()];
  boats[0].position.set(-12, 0, 70);
  boats[1].position.set(4, 0, 62);
  boats[2].position.set(0, 0, 0);
  boats.forEach((b) => L.add(b));
  const fishers = [figure(1.75), figure(1.75)];
  fishers.forEach((f, i) => { f.position.set(-12 + i * 1.5, 0.4, 70); L.add(f); });
  const teacher = figure(1.8);
  teacher.position.set(-24, h(-24, 82), 82);
  L.add(teacher);
  const disciples = crowd({ count: 12, place: placers.box(-2.4, -0.55, 2.4, 0.55), height: () => 0.05, seed: 141 });
  boats[2].add(disciples.group);
  // the hillside crowd for the sermon, then the five thousand on the grass
  const hillside = crowd({ count: ctx.quality === "low" ? 500 : 1100, place: placers.box(110, -30, 170, 10), height: h, seed: 143, face: [140, 16] });
  L.add(hillside.group);
  const fed = crowd({ count: ctx.quality === "low" ? 700 : 1600, place: placers.box(-190, -140, -110, -60), height: h, seed: 145 });
  fed.group.scale.y = 0.65;
  L.add(fed.group);
  const baskets = [];
  for (let i = 0; i < 12; i++) {
    const b = glowSprite(0xffd08a, 1.6, 0);
    b.position.set(-150 + (i % 6) * 2, h(-150, -100) + 0.8, -100 + Math.floor(i / 6) * 2);
    L.add(b);
    baskets.push(b);
  }
  // the transfiguration
  const peak = new THREE.Vector3(40, h(40, -420), -420);
  const radiant = glowSprite(0xffffff, 8, 0);
  radiant.position.copy(peak).add(new THREE.Vector3(0, 2, 0));
  L.add(radiant);
  const three = [figure(1.7), figure(1.7), figure(1.7)];
  three.forEach((f, i) => { f.position.copy(peak).add(new THREE.Vector3((i - 1) * 3.5, 0, 6)); f.rotation.x = 0.4; L.add(f); });
  const brightCloud = smoke({ rise: 20, spread: 18, color: [1, 1, 0.97], opacity: 0.35, size: 120, count: 500, lit: true });
  brightCloud.position.copy(peak);
  L.add(brightCloud);
  const beam = lightShaft({ length: 200, top: 4, bottom: 10, color: [1, 0.97, 0.9], gain: 0.6 });
  beam.rotation.x = Math.PI;
  beam.position.copy(peak).add(new THREE.Vector3(0, 200, 0));
  L.add(beam);
  L.onUpdate(({ rel, time }) => {
    const storm = pulse(rel, 9.3, 10, 12.6, 13.4);
    L.water.material.uniforms.uWave.value = 0.15 + 1.6 * storm;
    const b = boats[2];
    b.position.y = Math.sin(time * 1.5) * (0.1 + 0.8 * storm);
    b.rotation.z = Math.sin(time * 1.1) * (0.02 + 0.2 * storm);
    b.rotation.x = Math.sin(time * 0.9) * (0.01 + 0.12 * storm);
    fishers.forEach((f, i) => { f.visible = rel < 5; f.position.y = 0.4 + Math.sin(time * 1.2 + i) * 0.05; });
    teacher.visible = rel < 5;
    hillside.group.visible = rel > 4.8 && rel < 9.2;
    fed.group.visible = baskets[0].visible = rel > 14.5 && rel < 20.5;
    baskets.forEach((bk, i) => { bk.visible = fed.group.visible; bk.material.opacity = sramp(rel, 16 + i * 0.15, 16.6 + i * 0.15) * 0.8; });
    const glory = sramp(rel, 21, 23.5);
    radiant.material.opacity = glory;
    radiant.scale.setScalar(lerp(4, 18, glory));
    beam.material.uniforms.uAmount.value = glory;
    beam.material.uniforms.uTime.value = time;
    brightCloud.material.uniforms.uAmount.value = sramp(rel, 24, 27);
    brightCloud.material.uniforms.uTime.value = time;
  });
  return L;
}
