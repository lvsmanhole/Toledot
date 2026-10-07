// Genesis 37 — Dothan. The coat of many colours on the grass; then the view from the bottom of the dry
// pit, a circle of sky and the brothers' shapes at its rim; then the caravan crossing the dunes at sunset.

import * as THREE from "three";

import { pulse, sramp } from "../kit/common.js";
import { figure, herd } from "../kit/figures.js";
import { createLandscape } from "../kit/landscape.js";
import { composeHeight, heights } from "../kit/terrain.js";
import { createBlades, placers } from "../kit/vegetation.js";
import { facingIn, surfaceMaterial } from "../kit/surface.js";

const PIT = [0, 0];
const CARAVAN_Z = -220;

function coat() {
  const geo = new THREE.PlaneGeometry(1.6, 2.2, 24, 32);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 4) * 0.04 + Math.sin(p.getY(i) * 6) * 0.05);
  geo.computeVertexNormals();
  const material = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vN; void main() { vUv = uv; vN = normalMatrix * normal; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN;
      vec3 band(float x) {
        float i = floor(x * 9.0);
        vec3 c = vec3(0.55, 0.12, 0.08);
        if (mod(i, 6.0) == 1.0) c = vec3(0.75, 0.55, 0.15);
        if (mod(i, 6.0) == 2.0) c = vec3(0.12, 0.25, 0.45);
        if (mod(i, 6.0) == 3.0) c = vec3(0.35, 0.45, 0.2);
        if (mod(i, 6.0) == 4.0) c = vec3(0.45, 0.2, 0.4);
        if (mod(i, 6.0) == 5.0) c = vec3(0.8, 0.72, 0.55);
        return c;
      }
      void main() {
        float shade = 0.55 + 0.45 * clamp(normalize(vN).z, 0.0, 1.0);
        gl_FragColor = vec4(band(vUv.y + vUv.x * 0.15) * shade, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, material);
  mesh.rotation.x = -Math.PI / 2 + 0.05;
  return mesh;
}

export function create(ctx) {
  const height = composeHeight([heights.rolling(6, 0.01, 131), heights.dunes(6, 50, 0.3, 132), heights.flatten(0, 0, 40, 90, 2)], 1);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "desert", size: 1000 },
    sky: (rel) => (rel < 9 ? "desert" : [[1 - sramp(rel, 9, 11), "desert"], [sramp(rel, 9, 11), "golden"]]),
    camera: [
      [0, [5, 3, 6], [1.5, 0.4, 2], 44],
      [4.4, [3, 2, 3], [0, 1, 0], 50],
      [4.8, [0, -5.5, 0.01], [0, 10, 0], 70],
      [8.6, [0.2, -5.2, 0.2], [0, 10, 0], 64],
      [9, [40, 18, CARAVAN_Z + 60], [0, 4, CARAVAN_Z], 40],
      [14, [-20, 10, CARAVAN_Z + 40], [-60, 4, CARAVAN_Z], 40],
    ],
    keepAboveGround: false,
    audio: (rel) => ({ wind: 0.3 + 0.2 * pulse(rel, 4.5, 5, 8.5, 9), drone: 0.3 }),
  });
  const h = L.height;
  const ground = h(...PIT);
  const grass = createBlades({ count: 20000, place: placers.disc(0, 0, 60, (x, z) => Math.hypot(x, z) > 3), height: h });
  L.add(grass.mesh, (s) => grass.update({ time: s.time, wind: s.wind, fog: s.fog, light: 0.9 }));
  L.add(herd({ kind: "sheep", count: 40, place: placers.disc(22, -18, 14), height: h }));
  const garment = coat();
  garment.position.set(2.4, ground + 0.08, 2.2);
  L.add(garment);

  // the pit: a stone shaft with a cap of rock around its mouth, so from inside only a disc of sky shows
  const pit = new THREE.Group();
  // a cistern cut in the rock: rough, uneven walls, a floor of dry silt (Genesis 37:24)
  const shaft = new THREE.CylinderGeometry(1.8, 1.6, 7, 40, 14, true);
  const sp = shaft.attributes.position;
  for (let i = 0; i < sp.count; i++) {
    const a = Math.atan2(sp.getZ(i), sp.getX(i));
    const y = sp.getY(i);
    const k = 1 + Math.sin(a * 3 + y * 0.8) * 0.06 + Math.sin(a * 7 - y * 2.1) * 0.035 + Math.sin(a * 17 + y * 5) * 0.015;
    sp.setX(i, sp.getX(i) * k);
    sp.setZ(i, sp.getZ(i) * k);
  }
  shaft.computeVertexNormals();
  const rockMat = surfaceMaterial("cliff", { tile: 1.6, tint: [0.62, 0.55, 0.48] });
  const wall = new THREE.Mesh(facingIn(shaft), rockMat);
  wall.position.y = -3.5;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.75, 32), surfaceMaterial("cracked", { tile: 1.2, tint: [0.6, 0.52, 0.44] }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -7;
  const cap = new THREE.Mesh(new THREE.RingGeometry(1.8, 60, 48), surfaceMaterial("dryGround", { tile: 2, tint: [0.75, 0.66, 0.55], side: THREE.DoubleSide }));
  cap.rotation.x = -Math.PI / 2;
  cap.position.y = -0.05;
  pit.add(wall, floor, cap);
  pit.position.set(PIT[0], ground, PIT[1]);
  L.add(pit);
  const brothers = [0, 1, 2, 3, 4].map((i) => {
    const f = figure(1.8 + (i % 2) * 0.1);
    const a = i * 1.1 + 0.3;
    f.position.set(Math.cos(a) * 2.05, ground, Math.sin(a) * 2.05);
    f.lookAt(0, ground, 0);
    f.rotateX(0.32); // leaning over the mouth to look down at him
    L.add(f);
    return f;
  });
  const lightIn = new THREE.PointLight(0xffe2b0, 6, 12, 1.5);
  lightIn.position.set(0, ground - 1.5, 0);
  L.add(lightIn);

  // the caravan of Ishmeelites with camels, going down to Egypt
  const camels = herd({ kind: "camel", count: 14, place: (r) => [-r() * 120, CARAVAN_Z + (r() - 0.5) * 4], height: h, seed: 7 });
  camels.rotation.y = 0;
  L.add(camels);
  L.onUpdate(({ rel, time }) => {
    const inPit = rel > 4.6 && rel < 8.8;
    pit.visible = rel < 9;
    cap.visible = inPit;
    brothers.forEach((b, i) => { b.visible = rel < 9; b.rotation.z = inPit ? Math.sin(time + i) * 0.02 : 0; });
    garment.visible = rel < 4.7;
    camels.position.x = sramp(rel, 9, 14) * 60;
    camels.visible = rel > 8.8;
  });
  return L;
}
