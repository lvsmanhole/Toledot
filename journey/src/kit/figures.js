// People and animals as silhouettes: single figures, instanced crowds and armies, simple animals.
// Figures are never detailed; they are shapes in the light (per the visual brief).

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { rng } from "../engine/noise.js";

const DARK = () => new THREE.MeshStandardMaterial({ color: 0x0b0908, roughness: 1 });

/** A robed figure (lathe silhouette) about `h` tall; origin at the feet. */
export function robedGeometry(h = 1.75, { staff = false, veiled = false } = {}) {
  const pts = [
    [0.0, 0], [0.26, 0], [0.24, 0.3], [0.2, 0.75], [0.19, 1.05], [0.22, 1.25], [0.17, 1.4], [0.09, 1.46],
    [0.1, 1.5], [0.12, 1.6], [0.11, 1.7], [veiled ? 0.1 : 0.06, 1.76], [0.0, 1.78],
  ].map(([r, y]) => new THREE.Vector2(r * (h / 1.75), y * (h / 1.75)));
  const geos = [new THREE.LatheGeometry(pts, 12)];
  if (staff) {
    const s = new THREE.CylinderGeometry(0.02, 0.025, h * 1.05, 5);
    s.translate(0.28 * (h / 1.75), h * 0.52, 0.05);
    geos.push(s);
  }
  geos.forEach((g) => { g.deleteAttribute("uv"); });
  return mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)));
}

export function figure(h = 1.75, opts = {}) {
  return new THREE.Mesh(robedGeometry(h, opts), opts.material ?? DARK());
}

/**
 * An instanced crowd. place(random) -> [x, z] | null; height(x, z) for ground.
 * Returns { mesh, positions } so callers can animate a few individuals.
 */
export function crowd({ count = 200, place, height = () => 0, seed = 3, scale = [0.9, 1.1], staffChance = 0.15, material = null, face = null }) {
  const random = rng(seed);
  const plain = robedGeometry(1.75);
  const withStaff = robedGeometry(1.75, { staff: true });
  const mat = material ?? DARK();
  const a = new THREE.InstancedMesh(plain, mat, count);
  const b = new THREE.InstancedMesh(withStaff, mat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const positions = [];
  let na = 0;
  let nb = 0;
  for (let tries = 0; na + nb < count && tries < count * 10; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const k = scale[0] + random() * (scale[1] - scale[0]);
    const yaw = face ? Math.atan2(face[0] - x, face[1] - z) + (random() - 0.5) * 0.6 : random() * 6.28;
    q.setFromAxisAngle(up, yaw);
    m.compose(p.set(x, height(x, z) - 0.05, z), q, s.set(k, k, k));
    if (random() < staffChance) b.setMatrixAt(nb++, m); else a.setMatrixAt(na++, m);
    positions.push([x, z]);
  }
  a.count = na;
  b.count = nb;
  a.instanceMatrix.needsUpdate = true;
  b.instanceMatrix.needsUpdate = true;
  const group = new THREE.Group();
  group.add(a, b);
  return { group, positions };
}

// ---------------------------------------------------------------- animals (blocky silhouettes read fine at distance)
const ell = (rx, ry, rz, x, y, z) => {
  const g = new THREE.SphereGeometry(1, 10, 8);
  g.scale(rx, ry, rz);
  g.translate(x, y, z);
  g.deleteAttribute("uv");
  return g;
};
const leg = (x, z, h, r = 0.05) => {
  const g = new THREE.CylinderGeometry(r, r * 0.8, h, 5);
  g.translate(x, h / 2, z);
  g.deleteAttribute("uv");
  return g;
};

export const ANIMALS = {
  sheep: () => mergeGeometries([ell(0.45, 0.3, 0.28, 0, 0.62, 0), ell(0.13, 0.12, 0.11, 0.48, 0.72, 0), leg(0.25, 0.12, 0.45), leg(0.25, -0.12, 0.45), leg(-0.25, 0.12, 0.45), leg(-0.25, -0.12, 0.45)]),
  camel: () => mergeGeometries([ell(0.9, 0.42, 0.38, 0, 1.75, 0), ell(0.32, 0.38, 0.28, 0.05, 2.15, 0), ell(0.12, 0.45, 0.12, 0.95, 2.1, 0), ell(0.22, 0.12, 0.12, 1.15, 2.45, 0), leg(0.55, 0.2, 1.4, 0.07), leg(0.55, -0.2, 1.4, 0.07), leg(-0.6, 0.2, 1.4, 0.07), leg(-0.6, -0.2, 1.4, 0.07)]),
  ox: () => mergeGeometries([ell(0.85, 0.48, 0.42, 0, 1.0, 0), ell(0.28, 0.25, 0.22, 0.95, 1.1, 0), leg(0.5, 0.22, 0.65, 0.09), leg(0.5, -0.22, 0.65, 0.09), leg(-0.5, 0.22, 0.65, 0.09), leg(-0.5, -0.22, 0.65, 0.09)]),
  donkey: () => mergeGeometries([ell(0.55, 0.3, 0.25, 0, 0.95, 0), ell(0.22, 0.14, 0.12, 0.62, 1.15, 0), ell(0.05, 0.16, 0.03, 0.62, 1.38, 0.06), ell(0.05, 0.16, 0.03, 0.62, 1.38, -0.06), leg(0.35, 0.12, 0.7), leg(0.35, -0.12, 0.7), leg(-0.35, 0.12, 0.7), leg(-0.35, -0.12, 0.7)]),
  lion: () => mergeGeometries([ell(0.8, 0.36, 0.34, 0, 0.85, 0), ell(0.42, 0.42, 0.4, 0.75, 1.05, 0), leg(0.45, 0.18, 0.65, 0.08), leg(0.45, -0.18, 0.65, 0.08), leg(-0.5, 0.18, 0.65, 0.08), leg(-0.5, -0.18, 0.65, 0.08)]),
  elephant: () => mergeGeometries([ell(1.6, 1.1, 0.95, 0, 2.6, 0), ell(0.7, 0.65, 0.6, 1.7, 3.0, 0), ell(0.18, 0.9, 0.18, 2.2, 2.0, 0), leg(0.9, 0.5, 1.9, 0.3), leg(0.9, -0.5, 1.9, 0.3), leg(-0.9, 0.5, 1.9, 0.3), leg(-0.9, -0.5, 1.9, 0.3)]),
  bird: () => mergeGeometries([ell(0.15, 0.08, 0.08, 0, 0, 0), ell(0.06, 0.02, 0.35, 0, 0.02, 0)]),
};

/** Instanced animals of one kind, placed like a crowd. */
export function herd({ kind = "sheep", count = 40, place, height = () => 0, seed = 8, scale = [0.9, 1.1], material = null }) {
  const random = rng(seed);
  const geo = ANIMALS[kind]();
  const mesh = new THREE.InstancedMesh(geo, material ?? DARK(), count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  let n = 0;
  for (let tries = 0; n < count && tries < count * 10; tries++) {
    const at = place(random);
    if (!at) continue;
    const [x, z] = at;
    const k = scale[0] + random() * (scale[1] - scale[0]);
    q.setFromAxisAngle(up, random() * 6.28);
    m.compose(p.set(x, height(x, z) - 0.02, z), q, s.set(k, k, k));
    mesh.setMatrixAt(n++, m);
  }
  mesh.count = n;
  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

/** Pairs of animals walking in a line toward a target (the procession into the ark). */
export function procession({ kinds = ["ox", "camel", "sheep", "donkey", "lion", "elephant"], pairs = 18, from, to, height = () => 0, seed = 12 }) {
  const random = rng(seed);
  const group = new THREE.Group();
  const mat = DARK();
  const items = [];
  for (let i = 0; i < pairs; i++) {
    const kind = kinds[Math.floor(random() * kinds.length)];
    const geo = ANIMALS[kind]();
    for (const side of [-1, 1]) {
      const mesh = new THREE.Mesh(geo, mat);
      const k = kind === "elephant" ? 0.9 : kind === "bird" ? 3 : 1;
      mesh.scale.setScalar(k);
      group.add(mesh);
      items.push({ mesh, offset: i * 3.2 + random() * 0.8, side });
    }
  }
  const dir = new THREE.Vector3(to[0] - from[0], 0, to[1] - from[1]);
  const len = dir.length();
  dir.normalize();
  const perp = new THREE.Vector3(-dir.z, 0, dir.x);
  return {
    group,
    /** progress 0..1 along the path; animals beyond the target are hidden. */
    set(progress, time) {
      for (const it of items) {
        const d = progress * (len + pairs * 3.2) - it.offset;
        const visible = d > 0 && d < len;
        it.mesh.visible = visible;
        if (!visible) continue;
        const x = from[0] + dir.x * d + perp.x * it.side * 0.9;
        const z = from[1] + dir.z * d + perp.z * it.side * 0.9;
        it.mesh.position.set(x, height(x, z) + Math.abs(Math.sin(time * 5 + it.offset)) * 0.05, z);
        it.mesh.rotation.y = -Math.atan2(dir.z, dir.x);
      }
    },
  };
}
