// Architecture, built procedurally from simple solids. Everything returns a THREE.Group whose origin
// sits on the ground; callers position it with the terrain height.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { rng } from "../engine/noise.js";

export const MATERIALS = {
  mud: () => new THREE.MeshStandardMaterial({ color: 0x9a7a55, roughness: 1 }),
  mudDark: () => new THREE.MeshStandardMaterial({ color: 0x6e5438, roughness: 1 }),
  limestone: () => new THREE.MeshStandardMaterial({ color: 0xcbbd9e, roughness: 0.95 }),
  sandstone: () => new THREE.MeshStandardMaterial({ color: 0xc89a66, roughness: 0.95 }),
  basalt: () => new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 1 }),
  wood: () => new THREE.MeshStandardMaterial({ color: 0x5a4028, roughness: 0.9 }),
  darkWood: () => new THREE.MeshStandardMaterial({ color: 0x2e2216, roughness: 0.95 }),
  gold: () => new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.28, metalness: 0.95, emissive: 0x2a1a04, emissiveIntensity: 0.4 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0x8a5a2c, roughness: 0.35, metalness: 0.85 }),
  cloth: (c = 0xd8d0bc) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, side: THREE.DoubleSide }),
  glazedBlue: () => new THREE.MeshStandardMaterial({ color: 0x1d4f8c, roughness: 0.4, metalness: 0.1 }),
  silhouette: () => new THREE.MeshStandardMaterial({ color: 0x0c0a08, roughness: 1 }),
};

const box = (w, h, d, x = 0, y = 0, z = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return g;
};

/** A low city of flat-roofed houses packed inside radius around the origin. */
export function city({ count = 120, radius = 30, inner = 0, height = (x, z) => 0, style = "mud", seed = 3, hill = 0 }) {
  const random = rng(seed);
  const geos = [];
  const darkGeos = [];
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2;
    const r = inner + Math.sqrt(random()) * (radius - inner);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const w = 1.6 + random() * 2.6;
    const d = 1.6 + random() * 2.6;
    const h = 1.4 + random() * (style === "stone" ? 3.2 : 2.0) + hill * (1 - r / radius) * 2;
    const y = height(x, z) - 0.3;
    const g = box(w, h, d, x, y, z);
    g.rotateY(0);
    (random() < 0.25 ? darkGeos : geos).push(g);
    if (random() < 0.3) geos.push(box(w * 0.4, 0.5, d * 0.4, x + w * 0.2, y + h, z)); // roof room
  }
  const group = new THREE.Group();
  const mat = style === "stone" ? MATERIALS.limestone() : style === "white" ? new THREE.MeshStandardMaterial({ color: 0xe0d6c2, roughness: 0.95 }) : MATERIALS.mud();
  group.add(new THREE.Mesh(mergeGeometries(geos), mat));
  if (darkGeos.length) group.add(new THREE.Mesh(mergeGeometries(darkGeos), style === "mud" ? MATERIALS.mudDark() : MATERIALS.sandstone()));
  return group;
}

/** A wall along a closed or open polyline of [x, z] points with towers at the corners. */
export function wall({ points, height = (x, z) => 0, h = 6, thickness = 2, towerEvery = 1, closed = true, material = "mud" }) {
  const geos = [];
  const n = closed ? points.length : points.length - 1;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = points[i];
    const [x1, z1] = points[(i + 1) % points.length];
    const len = Math.hypot(x1 - x0, z1 - z0);
    const segs = Math.max(1, Math.round(len / 6));
    for (let s = 0; s < segs; s++) {
      const t0 = s / segs;
      const t1 = (s + 1) / segs;
      const cx = x0 + (x1 - x0) * (t0 + t1) / 2;
      const cz = z0 + (z1 - z0) * (t0 + t1) / 2;
      const g = new THREE.BoxGeometry(len / segs + 0.2, h, thickness);
      g.translate(0, h / 2, 0);
      g.rotateY(-Math.atan2(z1 - z0, x1 - x0));
      g.translate(cx, height(cx, cz) - 1, cz);
      geos.push(g);
      // crenellations
      for (let c = 0; c < 3; c++) {
        const k = t0 + (t1 - t0) * (c + 0.5) / 3;
        const px = x0 + (x1 - x0) * k;
        const pz = z0 + (z1 - z0) * k;
        const m = new THREE.BoxGeometry(0.8, 0.8, thickness * 1.02);
        m.rotateY(-Math.atan2(z1 - z0, x1 - x0));
        m.translate(px, height(cx, cz) - 1 + h + 0.4, pz);
        geos.push(m);
      }
    }
    if (i % towerEvery === 0) {
      const t = new THREE.BoxGeometry(thickness * 2.2, h * 1.35, thickness * 2.2);
      t.translate(x0, height(x0, z0) - 1 + h * 0.675, z0);
      geos.push(t);
    }
  }
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), typeof material === "string" ? MATERIALS[material]() : material));
}

/** Stepped temple-tower (ziggurat) with a stair on the front face. */
export function ziggurat({ base = 40, tiers = 5, tierH = 5, material = "mud" }) {
  const geos = [];
  for (let i = 0; i < tiers; i++) {
    const w = base * (1 - i / (tiers + 0.6));
    geos.push(box(w, tierH, w * 0.85, 0, i * tierH, 0));
  }
  const stair = box(base * 0.12, tiers * tierH, base * 0.5, 0, 0, base * 0.5);
  stair.rotateX(0);
  geos.push(stair);
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), MATERIALS[material]()));
}

/** The tower of Babel: a vast round tower of stacked, receding rings; the top unfinished. */
export function babelTower({ radius = 40, levels = 9, levelH = 9, unfinished = 2, seed = 4 }) {
  const random = rng(seed);
  const brick = MATERIALS.mud();
  const dark = MATERIALS.mudDark();
  const group = new THREE.Group();
  const solid = [];
  const shadow = [];
  for (let i = 0; i < levels; i++) {
    const r0 = radius * (1 - i * 0.085);
    const r1 = radius * (1 - (i + 1) * 0.085);
    const g = new THREE.CylinderGeometry(r1 * 0.97, r0, levelH, 48, 1, false);
    g.translate(0, i * levelH + levelH / 2, 0);
    if (i >= levels - unfinished) {
      // ragged, open top
      const ring = new THREE.CylinderGeometry(r1, r0, levelH * (0.4 + random() * 0.5), 48, 1, true, random() * 2, Math.PI * (1.1 + random() * 0.7));
      ring.translate(0, i * levelH + levelH / 2, 0);
      solid.push(ring);
    } else {
      solid.push(g);
      // arcade: a ring of dark recesses
      for (let k = 0; k < 28; k++) {
        const a = (k / 28) * Math.PI * 2 + i * 0.3;
        const arch = new THREE.BoxGeometry(2.2, levelH * 0.45, 1.2);
        arch.translate(0, i * levelH + levelH * 0.4, 0);
        arch.translate(0, 0, 0);
        const rr = (r0 + r1) / 2;
        const m = new THREE.Matrix4().makeRotationY(-a).setPosition(Math.cos(a) * rr * 0.995, 0, Math.sin(a) * rr * 0.995);
        arch.applyMatrix4(m);
        shadow.push(arch);
      }
    }
    // the spiral ramp ledge
    const ledge = new THREE.TorusGeometry((r0 + 1.5), 0.9, 4, 64);
    ledge.rotateX(Math.PI / 2);
    ledge.translate(0, i * levelH + 0.4, 0);
    solid.push(ledge);
  }
  // scaffolding at the top
  for (let k = 0; k < 40; k++) {
    const a = random() * Math.PI * 2;
    const r = radius * (1 - levels * 0.085) * (0.8 + random() * 0.3);
    const pole = new THREE.BoxGeometry(0.3, 6 + random() * 8, 0.3);
    pole.translate(Math.cos(a) * r, (levels - 0.5) * levelH + 3, Math.sin(a) * r);
    shadow.push(pole);
  }
  group.add(new THREE.Mesh(mergeGeometries(solid), brick), new THREE.Mesh(mergeGeometries(shadow), dark));
  return group;
}

export function pyramid({ base = 60, height = 40, material = "limestone" }) {
  const g = new THREE.ConeGeometry(base / Math.SQRT2, height, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(0, height / 2, 0);
  return new THREE.Group().add(new THREE.Mesh(g, MATERIALS[material]()));
}

/** Row(s) of columns with an architrave. */
export function colonnade({ count = 8, spacing = 4, height = 12, radius = 0.9, rows = 2, rowGap = 8, material = "sandstone", roof = true }) {
  const geos = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < count; i++) {
      const c = new THREE.CylinderGeometry(radius * 0.92, radius, height, 16);
      c.translate((i - (count - 1) / 2) * spacing, height / 2, (r - (rows - 1) / 2) * rowGap);
      geos.push(c);
      const cap = new THREE.CylinderGeometry(radius * 1.5, radius * 1.0, 1, 16);
      cap.translate((i - (count - 1) / 2) * spacing, height + 0.5, (r - (rows - 1) / 2) * rowGap);
      geos.push(cap);
    }
    if (roof) geos.push(box(count * spacing, 1.4, radius * 3, 0, height + 1, (r - (rows - 1) / 2) * rowGap));
  }
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), MATERIALS[material]()));
}

/** Egyptian pylon gateway. */
export function pylon({ width = 50, height = 24, depth = 8 }) {
  const towers = [];
  for (const s of [-1, 1]) {
    const g = new THREE.CylinderGeometry(1, 1, 1, 4, 1);
    // tapered block via scaled box
    const b = new THREE.BoxGeometry(width * 0.4, height, depth);
    const p = b.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const k = 1 - 0.12 * (y / height + 0.5);
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
    }
    b.translate(s * width * 0.29, height / 2, 0);
    towers.push(b);
    g.dispose();
  }
  towers.push(box(width * 0.2, height * 0.62, depth * 0.7, 0, 0, 0));
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(towers), MATERIALS.sandstone()));
}

/** Rows of domed granaries (Joseph's stores). */
export function granaries({ rows = 4, cols = 8, spacing = 6, radius = 2.3 }) {
  const geos = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * spacing;
    const z = (r - (rows - 1) / 2) * spacing;
    const cyl = new THREE.CylinderGeometry(radius, radius, 2.5, 16);
    cyl.translate(x, 1.25, z);
    const dome = new THREE.SphereGeometry(radius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    dome.translate(x, 2.5, z);
    geos.push(cyl, dome);
  }
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), MATERIALS.mud()));
}

/** Tents of an encampment, scattered inside radius (or rings around a centre). */
export function tents({ count = 60, radius = 40, inner = 0, height = (x, z) => 0, seed = 6, colors = [0x3a2f26, 0x4a3b2e, 0x2b241e] }) {
  const random = rng(seed);
  const byColor = colors.map(() => []);
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2;
    const r = inner + Math.sqrt(random()) * (radius - inner);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = 1.2 + random() * 1.2;
    const g = new THREE.CylinderGeometry(0.15, 1.6 * s, 1.6 * s, random() < 0.5 ? 4 : 6, 1);
    g.scale(1.4, 1, 1);
    g.rotateY(random() * Math.PI);
    g.translate(x, height(x, z) + 0.8 * s - 0.1, z);
    byColor[Math.floor(random() * colors.length)].push(g);
  }
  const group = new THREE.Group();
  byColor.forEach((geos, i) => { if (geos.length) group.add(new THREE.Mesh(mergeGeometries(geos), MATERIALS.cloth(colors[i]))); });
  return group;
}

/** An altar of unhewn stones. */
export function altar({ size = 2, seed = 2, material = "basalt" }) {
  const random = rng(seed);
  const geos = [];
  for (let i = 0; i < 26; i++) {
    const layer = Math.floor(i / 7);
    const g = new THREE.DodecahedronGeometry(size * (0.28 + random() * 0.12), 0);
    const a = random() * Math.PI * 2;
    const r = size * (0.55 - layer * 0.1) * Math.sqrt(random());
    g.translate(Math.cos(a) * r, size * (0.2 + layer * 0.32), Math.sin(a) * r);
    geos.push(g);
  }
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), MATERIALS[material]()));
}

/** Noah's ark: 300 × 50 × 30 cubits (Genesis 6:15), at 1 unit ≈ 10 cubits. */
export function ark({ framesOnly = 0 } = {}) {
  const L = 30;
  const W = 5;
  const H = 3;
  const shape = new THREE.Shape();
  shape.moveTo(-L / 2, 0.6);
  shape.quadraticCurveTo(-L / 2 + 1.2, 0, -L / 2 + 3, 0);
  shape.lineTo(L / 2 - 3, 0);
  shape.quadraticCurveTo(L / 2 - 1.2, 0, L / 2, 0.6);
  shape.lineTo(L / 2, H);
  shape.lineTo(-L / 2, H);
  shape.closePath();
  const hull = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false });
  hull.translate(0, 0, -W / 2);
  const roof = new THREE.CylinderGeometry(0.1, W * 0.62, 1.4, 4, 1);
  roof.rotateY(Math.PI / 4);
  roof.scale(L / (W * 0.88), 1, 1);
  roof.translate(0, H + 0.7, 0);
  const group = new THREE.Group();
  const hullMesh = new THREE.Mesh(hull, MATERIALS.darkWood());
  const roofMesh = new THREE.Mesh(roof, MATERIALS.wood());
  group.add(hullMesh, roofMesh);
  // ribs for the "being built" look
  const ribs = [];
  for (let i = 0; i <= 24; i++) {
    const x = -L / 2 + (i / 24) * L;
    ribs.push(box(0.18, H + 1.2, W + 0.5, x, -0.1, 0));
  }
  const ribMesh = new THREE.Mesh(mergeGeometries(ribs), MATERIALS.wood());
  group.add(ribMesh);
  group.userData = { hullMesh, roofMesh, ribMesh };
  return group;
}

/** The tabernacle: a linen court (100 × 50 cubits), the tent, the altar, the laver. */
export function tabernacle() {
  const group = new THREE.Group();
  const L = 30;
  const W = 15;
  const posts = [];
  const linen = [];
  for (let i = 0; i <= 20; i++) {
    for (const z of [-W / 2, W / 2]) posts.push(box(0.15, 2.4, 0.15, -L / 2 + (i / 20) * L, 0, z));
  }
  for (let i = 0; i <= 10; i++) for (const x of [-L / 2, L / 2]) posts.push(box(0.15, 2.4, 0.15, x, 0, -W / 2 + (i / 10) * W));
  const side = (w, x, z, rot) => {
    const g = new THREE.PlaneGeometry(w, 2.2);
    g.rotateY(rot);
    g.translate(x, 1.2, z);
    linen.push(g);
  };
  side(L, 0, -W / 2, 0);
  side(L, 0, W / 2, 0);
  side(W, -L / 2, 0, Math.PI / 2);
  side(W * 0.3, L / 2, -W * 0.35, Math.PI / 2);
  side(W * 0.3, L / 2, W * 0.35, Math.PI / 2);
  group.add(new THREE.Mesh(mergeGeometries(posts), MATERIALS.bronze()));
  group.add(new THREE.Mesh(mergeGeometries(linen), MATERIALS.cloth(0xe8e2d2)));
  const tent = new THREE.Mesh(box(9, 3.2, 3.2, -L / 4, 0, 0), MATERIALS.cloth(0x2c1f1a));
  const altarB = new THREE.Mesh(box(1.6, 1, 1.6, L / 6, 0, 0), MATERIALS.bronze());
  const laver = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.7, 16).translate(L / 12, 0.35, 0), MATERIALS.bronze());
  group.add(tent, altarB, laver);
  group.userData = { tentCenter: new THREE.Vector3(-L / 4, 3, 0), altar: new THREE.Vector3(L / 6, 1, 0) };
  return group;
}

/** Solomon's temple: porch with Jachin and Boaz, holy place, holy of holies; courts and altar. */
export function solomonTemple() {
  const group = new THREE.Group();
  const stone = MATERIALS.limestone();
  const gold = MATERIALS.gold();
  const bronze = MATERIALS.bronze();
  // 60 × 20 × 30 cubits house (1 Kings 6:2) at 1 unit ≈ 2 cubits; porch 20 deep 10
  const house = [];
  house.push(box(30, 15, 1, 0, 0, -5.5)); // side walls
  house.push(box(30, 15, 1, 0, 0, 5.5));
  house.push(box(1, 15, 12, -15, 0, 0)); // rear
  house.push(box(1, 15, 3.5, 15, 0, -4.25)); // front with door
  house.push(box(1, 15, 3.5, 15, 0, 4.25));
  house.push(box(1, 6, 5, 15, 9, 0));
  house.push(box(32, 1, 13, 0, 15, 0)); // roof
  // partition before the most holy place (20 cubits = 10 units deep), with a doorway the veil covers
  house.push(box(1, 15, 4.5, -5, 0, -3.75), box(1, 15, 4.5, -5, 0, 3.75), box(1, 7, 3, -5, 8, 0));
  // porch: side walls and a roof, open to the front (1 Kings 6:3)
  house.push(box(5, 18, 1, 17.5, 0, -6), box(5, 18, 1, 17.5, 0, 6), box(5, 2, 13, 17.5, 16, 0));
  const shell = new THREE.Mesh(mergeGeometries(house), stone);
  // Jachin and Boaz (1 Kings 7:15-21)
  const pillars = [];
  for (const z of [-3.5, 3.5]) {
    const c = new THREE.CylinderGeometry(0.95, 0.95, 9, 20);
    c.translate(21.5, 4.5, z);
    const cap = new THREE.SphereGeometry(1.3, 16, 12);
    cap.scale(1, 0.9, 1);
    cap.translate(21.5, 9.9, z);
    pillars.push(c, cap);
  }
  const pillarMesh = new THREE.Mesh(mergeGeometries(pillars), bronze);
  // bronze altar and the sea on twelve oxen (simplified)
  const altarMesh = new THREE.Mesh(box(10, 5, 10, 38, 0, 0), bronze);
  const sea = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 3.5, 2.5, 32).translate(30, 2.5, 10), bronze);
  // court wall
  const court = wall({ points: [[-22, -22], [55, -22], [55, 22], [-22, 22]], h: 3, thickness: 1.2, towerEvery: 99, material: stone });
  group.add(shell, pillarMesh, altarMesh, sea, court);
  // interior: lampstands, table, incense altar, veil, ark with cherubim
  const interior = new THREE.Group();
  const lampGeos = [];
  for (let i = 0; i < 10; i++) {
    const z = i < 5 ? -4 : 4;
    const x = 12 - (i % 5) * 3.2;
    lampGeos.push(new THREE.CylinderGeometry(0.08, 0.15, 2.4, 8).translate(x, 1.2, z));
    for (let a = -3; a <= 3; a++) lampGeos.push(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 6).translate(x + a * 0.15, 2.3 + Math.abs(a) * -0.05, z));
  }
  interior.add(new THREE.Mesh(mergeGeometries(lampGeos), gold));
  interior.add(new THREE.Mesh(box(2, 1, 1, 6, 0, 0), gold)); // table / incense altar region
  const veil = new THREE.Mesh(new THREE.PlaneGeometry(11.5, 14), new THREE.MeshStandardMaterial({ color: 0x4a1220, roughness: 0.9, side: THREE.DoubleSide, emissive: 0x12030a, emissiveIntensity: 0.5 }));
  veil.rotation.y = Math.PI / 2;
  veil.position.set(-4.4, 7, 0);
  interior.add(veil);
  const ark = new THREE.Group();
  ark.add(new THREE.Mesh(box(1.25, 0.75, 0.75), gold));
  for (const s of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.6, 0.9), gold);
    wing.position.set(s * 0.45, 1.05, 0);
    wing.rotation.z = s * 0.9;
    ark.add(wing);
  }
  ark.position.set(-10, 0, 0);
  ark.scale.setScalar(1.6);
  // the great cherubim of olive wood overlaid with gold (1 Kings 6:23-28)
  for (const z of [-2.5, 2.5]) {
    const cw = new THREE.Mesh(box(0.6, 5, 5, 0, 0, 0), gold);
    cw.position.set(-10, 0, z);
    interior.add(cw);
  }
  interior.add(ark);
  group.add(interior);
  group.userData = { veil, interior, ark, porch: new THREE.Vector3(24, 5, 0), holyPlace: new THREE.Vector3(8, 5, 0), mostHoly: new THREE.Vector3(-10, 3, 0) };
  return group;
}

/** Three crosses on a rise (silhouettes). */
export function crosses({ spacing = 6 } = {}) {
  const geos = [];
  for (const [x, s] of [[-spacing, 0.85], [0, 1], [spacing, 0.85]]) {
    geos.push(box(0.45 * s, 7 * s, 0.45 * s, x, 0, 0));
    geos.push(box(3.6 * s, 0.4 * s, 0.4 * s, x, 5.2 * s, 0));
  }
  return new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), MATERIALS.silhouette()));
}

/** A rock-cut tomb with a rolling stone; userData.stone rolls along +x. */
export function tomb() {
  const group = new THREE.Group();
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(9, 1), new THREE.MeshStandardMaterial({ color: 0x8c8172, roughness: 1, flatShading: true }));
  rock.scale.set(1.4, 0.9, 1);
  rock.position.set(0, 3, -6);
  const opening = new THREE.Mesh(new THREE.CircleGeometry(1.7, 24), new THREE.MeshBasicMaterial({ color: 0x050403 }));
  opening.position.set(0, 1.8, 1.9);
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.7, 32), new THREE.MeshStandardMaterial({ color: 0x9a8e7c, roughness: 1 }));
  stone.rotation.x = Math.PI / 2;
  stone.position.set(0, 2.1, 2.3);
  group.add(rock, opening, stone);
  group.userData = { stone, opening };
  return group;
}
