// The multitudes of heaven that no man could number (7:9): tens of thousands of figures in white robes with
// palms in their hands, of all nations, kindreds, people and tongues (skin from deep to warm brown, most of
// them dark), as two instanced meshes of a few triangles each; and the hosts of angels beyond them as points
// of light.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { rng } from "../../engine/noise.js";
import { scaled } from "../../kit/budget.js";
import { glowTexture } from "../../kit/common.js";

// the peoples' skin: mostly deep and warm browns, some lighter
const SKIN = [0x2e1c12, 0x3b2418, 0x4a2e1e, 0x5a3826, 0x6b4430, 0x7a5038, 0x8a5c3e, 0x9c6c48, 0xb07e58, 0xc4946c];

const coloured = (geo, [r, g, b]) => {
  const n = geo.attributes.position.count;
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(n * 3).map((_, i) => [r, g, b][i % 3]), 3));
  return geo;
};

/** One far figure: a white robe and a palm frond held up (20 triangles with its head). */
function robeAndPalm() {
  const robe = new THREE.CylinderGeometry(0.11, 0.24, 1.45, 5, 1, true).toNonIndexed();
  robe.translate(0, 0.725, 0);
  const palm = new THREE.PlaneGeometry(0.16, 0.95).toNonIndexed();
  palm.rotateZ(-0.25);
  palm.translate(0.32, 1.75, 0.06);
  return mergeGeometries([coloured(robe, [0.95, 0.94, 0.9]), coloured(palm, [0.22, 0.42, 0.16])].map((g) => { g.deleteAttribute("uv"); return g; }));
}

/**
 * whiteMultitude({ count, place, face }) -> { group, material, count }.
 * place(random) -> [x, y, z] or null; everyone turns toward face [x, z].
 */
export function whiteMultitude({ count = 20000, place, face = [0, 0], seed = 77 }) {
  count = scaled(count, 2000);
  const random = rng(seed);
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x000000 });
  const bodies = new THREE.InstancedMesh(robeAndPalm(), material, count);
  const headGeo = new THREE.OctahedronGeometry(0.1, 0);
  headGeo.scale(0.9, 1.2, 0.9);
  headGeo.translate(0, 1.58, 0);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.6 }), count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const c = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < count && tries < count * 20; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, y, z] = at;
    const k = 0.9 + random() * 0.22;
    q.setFromAxisAngle(up, Math.atan2(face[0] - x, face[1] - z) + (random() - 0.5) * 0.4);
    m.compose(p.set(x, y, z), q, s.set(k, k, k));
    bodies.setMatrixAt(n, m);
    heads.setMatrixAt(n, m);
    heads.setColorAt(n, c.setHex(SKIN[Math.floor(random() ** 0.8 * SKIN.length)]));
    n++;
  }
  for (const mesh of [bodies, heads]) {
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
  }
  heads.instanceColor.needsUpdate = true;
  const group = new THREE.Group();
  group.add(bodies, heads);
  return { group, material, count: n };
}

/** A host of soft points of light: place(random) -> [x, y, z]. */
export function lights({ count = 20000, place, color = 0xfff6e6, size = 0.9, seed = 5 }) {
  const random = rng(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) pos.set(place(random), i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color, size, sizeAttenuation: true, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}
