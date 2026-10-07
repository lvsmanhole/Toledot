// Architecture, built procedurally from simple solids. Everything returns a THREE.Group whose origin
// sits on the ground; callers position it with the terrain height.

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { rng } from "../engine/noise.js";
import { SURFACES, surfaceMaterial } from "./surface.js";

export const MATERIALS = {
  mud: () => SURFACES.mud(),
  mudDark: () => SURFACES.mudDark(),
  limestone: () => SURFACES.limestone(),
  sandstone: () => SURFACES.sandstone(),
  basalt: () => SURFACES.basalt(),
  fieldstone: () => surfaceMaterial("cliff", { tile: 1.6, tint: [0.22, 0.19, 0.15] }),
  wood: () => SURFACES.wood(),
  darkWood: () => SURFACES.darkWood(),
  gold: () => new THREE.MeshStandardMaterial({ color: 0xd8a640, roughness: 0.32, metalness: 1, emissive: 0x2a1a04, emissiveIntensity: 0.15 }),
  bronze: () => new THREE.MeshStandardMaterial({ color: 0x9a6a36, roughness: 0.4, metalness: 1 }),
  cloth: (c = 0xd8d0bc) => { const col = new THREE.Color(c); return SURFACES.linen([col.r * 1.4, col.g * 1.4, col.b * 1.4]); },
  glazedBlue: () => new THREE.MeshStandardMaterial({ color: 0x1d4f8c, roughness: 0.25, metalness: 0.05 }),
  silhouette: () => SURFACES.darkWood(),
};

const box = (w, h, d, x = 0, y = 0, z = 0) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y + h / 2, z);
  return g;
};

/**
 * A town of flat-roofed courtyard houses: plastered walls on a stone footing, a parapet round the roof,
 * dark doorways and small high windows, roof beams showing through the wall, and here and there an
 * upper room or a roof shelter. Houses face random directions inside the radius.
 */
export function city({ count = 120, radius = 30, inner = 0, height = (x, z) => 0, style = "mud", seed = 3, hill = 0 }) {
  const random = rng(seed);
  const walls = [];
  const plinths = [];
  const openings = [];
  const beams = [];
  const awnings = [];
  const put = (list, g, x, y, z, yaw) => { g.rotateY(yaw); g.translate(x, y, z); list.push(g); };
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2;
    const r = inner + Math.sqrt(random()) * (radius - inner);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const yaw = Math.floor(random() * 4) * (Math.PI / 2) + (random() - 0.5) * 0.25;
    const w = 3.2 + random() * 3.6;
    const d = 3.2 + random() * 3.6;
    const h = 2.6 + random() * (style === "stone" ? 2.6 : 1.4) + hill * (1 - r / Math.max(1, radius)) * 2;
    const y = height(x, z) - 0.25;
    put(walls, box(w, h, d), x, y, z, yaw);
    // parapet round the roof (Deuteronomy 22:8)
    for (const [pw, pd, px, pz] of [[w, 0.22, 0, d / 2 - 0.11], [w, 0.22, 0, -d / 2 + 0.11], [0.22, d, w / 2 - 0.11, 0], [0.22, d, -w / 2 + 0.11, 0]]) {
      put(walls, box(pw, 0.55, pd, px, h, pz), x, y, z, yaw);
    }
    put(plinths, box(w + 0.2, 0.6, d + 0.2), x, y - 0.1, z, yaw);
    // a doorway and a couple of small windows on the front, recessed and dark
    put(openings, box(0.9, 1.75, 0.12, (random() - 0.5) * (w - 1.6), 0.3, d / 2 + 0.01), x, y, z, yaw);
    for (let k = 0; k < 2; k++) if (random() < 0.7) put(openings, box(0.45, 0.4, 0.1, (random() - 0.5) * (w - 1), h - 0.9, d / 2 + 0.01), x, y, z, yaw);
    // roof beams through the wall below the parapet
    const nb = Math.floor(w / 0.7);
    for (let k = 0; k < nb; k++) put(beams, box(0.14, 0.14, 0.45, -w / 2 + 0.4 + k * 0.7, h - 0.25, d / 2 + 0.15), x, y, z, yaw);
    // an upper room, or a booth of branches on the roof
    const roll = random();
    if (roll < 0.22) put(walls, box(w * 0.45, 2.2, d * 0.45, w * 0.22, h, -d * 0.2), x, y, z, yaw);
    else if (roll < 0.35) put(awnings, box(w * 0.5, 0.08, d * 0.4, -w * 0.2, h + 1.6, 0), x, y, z, yaw);
  }
  const group = new THREE.Group();
  const wallMat = style === "stone" ? MATERIALS.limestone() : style === "white" ? surfaceMaterial("plaster", { tile: 3, tint: [0.9, 0.86, 0.78] }) : surfaceMaterial("plaster", { tile: 3, tint: [0.86, 0.76, 0.64] });
  group.add(new THREE.Mesh(mergeGeometries(walls), wallMat));
  group.add(new THREE.Mesh(mergeGeometries(plinths), MATERIALS.basalt()));
  group.add(new THREE.Mesh(mergeGeometries(openings), new THREE.MeshStandardMaterial({ color: 0x0d0a08, roughness: 1 })));
  group.add(new THREE.Mesh(mergeGeometries(beams), MATERIALS.darkWood()));
  if (awnings.length) group.add(new THREE.Mesh(mergeGeometries(awnings), MATERIALS.cloth(0x6a5638)));
  return group;
}

/** A wall along a closed or open polyline of [x, z] points with towers at the corners. */
export function wall({ points, height = (x, z) => 0, h = 6, thickness = 2, towerEvery = 1, closed = true, material = "mud", footing = "fieldstone" }) {
  const geos = [];
  const stones = [];
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
      if (footing) {
        // a battered stone revetment at the foot of the brick, sloping out (the glacis)
        const fh = h * 0.42;
        const f = new THREE.BoxGeometry(len / segs + 0.25, fh, thickness * 2.4, 1, 1, 1);
        const fp = f.attributes.position;
        for (let k = 0; k < fp.count; k++) if (fp.getY(k) > 0) fp.setZ(k, fp.getZ(k) * 0.45);
        f.computeVertexNormals();
        f.translate(0, fh / 2 - 1.2, 0);
        f.rotateY(-Math.atan2(z1 - z0, x1 - x0));
        f.translate(cx, height(cx, cz), cz);
        stones.push(f);
      }
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
      const tw = thickness * 2.2;
      const base = height(x0, z0) - 1;
      const t = new THREE.BoxGeometry(tw, h * 1.35, tw);
      t.translate(x0, base + h * 0.675, z0);
      geos.push(t);
      // the tower's parapet: merlons round the top, a dark window slit on each face
      for (let c = 0; c < 4; c++) {
        for (const s of [-1, 1]) {
          const m = new THREE.BoxGeometry(tw * 0.22, 0.9, tw * 0.22);
          const along = (c - 1.5) * tw * 0.27;
          m.translate(...(s > 0 ? [along, 0, tw * 0.39] : [tw * 0.39, 0, along]));
          m.translate(x0, base + h * 1.35 + 0.45, z0);
          geos.push(m);
          const m2 = new THREE.BoxGeometry(tw * 0.22, 0.9, tw * 0.22);
          m2.translate(...(s > 0 ? [along, 0, -tw * 0.39] : [-tw * 0.39, 0, along]));
          m2.translate(x0, base + h * 1.35 + 0.45, z0);
          geos.push(m2);
        }
      }
      if (footing) {
        const f = new THREE.CylinderGeometry(tw * 0.62, tw * 0.95, h * 0.42, 4, 1);
        f.rotateY(Math.PI / 4);
        f.translate(x0, height(x0, z0) - 1.2 + h * 0.21, z0);
        stones.push(f);
      }
    }
  }
  const group = new THREE.Group().add(new THREE.Mesh(mergeGeometries(geos), typeof material === "string" ? MATERIALS[material]() : material));
  if (stones.length) group.add(new THREE.Mesh(mergeGeometries(stones.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { g.deleteAttribute("uv"); return g; })), MATERIALS[footing]()));
  return group;
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
  // burnt brick laid in slime (Genesis 11:3): each storey a battered drum of brick with buttresses and
  // dark niches, a course of bitumen at its foot, a terrace walk with a parapet, and at the top the walls
  // still rising, ragged, in scaffolding
  const random = rng(seed);
  const brick = MATERIALS.mud();
  const dark = MATERIALS.mudDark();
  const pitch = new THREE.MeshStandardMaterial({ color: 0x17120e, roughness: 0.6, side: THREE.DoubleSide });
  brick.side = THREE.DoubleSide; // the broken walls at the top are open shells
  const group = new THREE.Group();
  const solid = [];
  const shadow = [];
  const bitumen = [];
  const timber = [];
  const step = 0.085;
  const around = (geo, a, r) => geo.applyMatrix4(new THREE.Matrix4().makeRotationY(-a + Math.PI / 2).setPosition(Math.cos(a) * r, 0, Math.sin(a) * r));
  for (let i = 0; i < levels; i++) {
    const r0 = radius * (1 - i * step);
    const r1 = radius * (1 - (i + 1) * step) + 3.2; // wall top, inside the terrace walk of the storey above
    const y0 = i * levelH;
    const open = i >= levels - unfinished;
    const segs = Math.max(48, Math.round(r0 * 2.2));
    if (!open) {
      solid.push(new THREE.CylinderGeometry(r1, r0, levelH, segs, 1, false).translate(0, y0 + levelH / 2, 0));
      // buttresses and recessed niches, the Mesopotamian wall face
      const n = Math.round(r0 * 0.9);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + i * 0.13;
        const rr = (r0 + r1) / 2;
        solid.push(around(new THREE.BoxGeometry(1.6, levelH * 0.92, 1.4).translate(0, y0 + levelH * 0.46, 0).rotateX(0), a, rr + 0.25));
        shadow.push(around(new THREE.BoxGeometry(0.9, levelH * 0.55, 0.5).translate(0, y0 + levelH * 0.38, 0), a + Math.PI / n, rr + 0.05));
      }
      // terrace walk on top with a parapet at its edge
      const walk = new THREE.LatheGeometry([new THREE.Vector2(r1 - 3.6, y0 + levelH), new THREE.Vector2(r1 + 0.2, y0 + levelH), new THREE.Vector2(r1 + 0.2, y0 + levelH + 1.1), new THREE.Vector2(r1 - 0.4, y0 + levelH + 1.1), new THREE.Vector2(r1 - 0.4, y0 + levelH + 0.1), new THREE.Vector2(r1 - 3.6, y0 + levelH + 0.1)].reverse(), segs);
      solid.push(walk);
    } else {
      // walls still going up: a thick broken ring, higher in some bays than others
      const bays = 18;
      for (let k = 0; k < bays; k++) {
        if (random() < 0.18) continue;
        const a0 = (k / bays) * Math.PI * 2;
        const hh = levelH * (0.25 + random() * 0.75) * (i === levels - 1 ? 0.7 : 1);
        const outer = new THREE.CylinderGeometry(r0 - 0.4, r0, hh, 6, 1, false, a0, (Math.PI * 2) / bays + 0.01).translate(0, y0 + hh / 2, 0);
        solid.push(outer);
        // courses of brick stepped back where the work stops
        const top = new THREE.CylinderGeometry(r0 - 0.9, r0 - 0.5, levelH * 0.12, 6, 1, false, a0 + 0.02, (Math.PI * 2) / bays * 0.7).translate(0, y0 + hh + levelH * 0.06, 0);
        solid.push(top);
      }
      // rough fill of the core, lower than the walls
      solid.push(new THREE.CylinderGeometry(r0 - 2.5, r0 - 2, levelH * 0.3, 32).translate(0, y0 + levelH * 0.15, 0));
    }
    // the bitumen course at the foot of the storey
    bitumen.push(new THREE.CylinderGeometry(r0 + 0.06, r0 + 0.1, 0.35, segs, 1, true).translate(0, y0 + 0.4, 0));
  }
  // scaffolding about the unfinished storeys: standards, ledgers and braces lashed together
  const topR = radius * (1 - (levels - unfinished) * step);
  const yTop = (levels - unfinished) * levelH;
  for (let k = 0; k < 26; k++) {
    const a = (k / 26) * Math.PI * 2 + random() * 0.05;
    const r = topR + 1.6;
    const hh = unfinished * levelH * (0.6 + random() * 0.5);
    timber.push(around(new THREE.CylinderGeometry(0.09, 0.11, hh, 5).translate(0, yTop + hh / 2, 0), a, r));
    timber.push(around(new THREE.CylinderGeometry(0.09, 0.11, hh * 0.9, 5).translate(0, yTop + hh * 0.45, 0), a, r + 1.4));
    for (let y = 2.5; y < hh; y += 2.5) {
      const ledger = new THREE.CylinderGeometry(0.07, 0.07, 1.6, 4).rotateX(Math.PI / 2).translate(0, yTop + y, 0.7);
      timber.push(around(ledger, a, r));
      const plank = new THREE.BoxGeometry(2.2, 0.08, 1.5).translate(0, yTop + y + 0.1, 0.7);
      if (random() < 0.5) timber.push(around(plank, a, r));
    }
  }
  const merge = (list) => mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)).map((g) => { for (const k of Object.keys(g.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k); return g; }));
  group.add(new THREE.Mesh(merge(solid), brick), new THREE.Mesh(merge(shadow), dark), new THREE.Mesh(merge(bitumen), pitch), new THREE.Mesh(merge(timber), MATERIALS.wood()));
  return group;
}

export function pyramid({ base = 60, height = 40, material = "limestone" }) {
  const g = new THREE.ConeGeometry(base / Math.SQRT2, height, 4, 1);
  g.rotateY(Math.PI / 4);
  g.translate(0, height / 2, 0);
  return new THREE.Group().add(new THREE.Mesh(g, MATERIALS[material]()));
}

/** Row(s) of columns with an architrave. */
export function colonnade({ count = 8, spacing = 4, height = 12, radius = 0.9, rows = 2, rowGap = 8, material = "sandstone", roof = true, style = "classic" }) {
  // one column, lathed from a profile in units of the radius (y from 0 at the foot to 1 at the top), then
  // shaped around: an Egyptian column is a bundle of papyrus stems bound under an open papyrus capital; the
  // others stand on a moulded base, taper slightly, and carry a capital and a square abacus
  const egypt = style === "egypt";
  const profile = egypt
    ? [[0, 0], [1.25, 0], [1.25, 0.03], [1.0, 0.04], [1.12, 0.09], [1.05, 0.2], [0.92, 0.72], [0.9, 0.76], [0.98, 0.765], [0.98, 0.79], [0.88, 0.8], [0.95, 0.85], [1.35, 0.95], [1.55, 0.97], [0, 0.97]]
    : [[0, 0], [1.35, 0], [1.35, 0.025], [1.2, 0.035], [1.22, 0.05], [1.05, 0.06], [1.0, 0.08], [0.88, 0.9], [0.95, 0.91], [1.25, 0.95], [1.25, 0.97], [0, 0.97]];
  const lobes = egypt ? 8 : 20;
  const column = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r * radius, y * height)), egypt ? 48 : 40);
  const cp = column.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const y = cp.getY(i) / height;
    const a = Math.atan2(cp.getZ(i), cp.getX(i));
    const shaft = y > 0.08 && y < 0.9;
    // papyrus stems bulge as rounded lobes; classical shafts are cut with shallow flutes
    const k = shaft ? (egypt ? 1 + 0.07 * Math.abs(Math.cos(a * lobes / 2)) : 1 - 0.025 * Math.pow(Math.abs(Math.sin(a * lobes / 2)), 0.5)) : 1;
    cp.setX(i, cp.getX(i) * k);
    cp.setZ(i, cp.getZ(i) * k);
  }
  column.computeVertexNormals();
  const abacus = new THREE.BoxGeometry(radius * (egypt ? 2.4 : 2.7), height * 0.03, radius * (egypt ? 2.4 : 2.7)).translate(0, height * 0.985, 0);
  const one = mergeGeometries([column.toNonIndexed(), abacus.toNonIndexed()].map((g) => { g.deleteAttribute("uv"); return g; }));
  const geos = [];
  for (let r = 0; r < rows; r++) {
    for (let i = 0; i < count; i++) geos.push(one.clone().translate((i - (count - 1) / 2) * spacing, 0, (r - (rows - 1) / 2) * rowGap));
    if (roof) {
      // the architrave, and over it a cornice (Egyptian: the cavetto gorge)
      const arch = box(count * spacing, 1.4, radius * 3, 0, height + 0.0, (r - (rows - 1) / 2) * rowGap);
      const corn = box(count * spacing + 0.6, 0.6, radius * 3.6, 0, height + 1.4, (r - (rows - 1) / 2) * rowGap);
      for (const g of [arch, corn]) { g.deleteAttribute("uv"); geos.push(g.toNonIndexed()); }
    }
  }
  // a stepped platform under the colonnade, so no column foot is lost in the ground
  const W = count * spacing + spacing;
  const D = (rows - 1) * rowGap + spacing * 1.6;
  for (let k = 0; k < 3; k++) {
    const g = box(W + (2 - k) * 1.6, 0.5, D + (2 - k) * 1.6, 0, -1.5 + k * 0.5, 0);
    g.deleteAttribute("uv");
    geos.push(g.toNonIndexed());
  }
  const mesh = new THREE.Mesh(mergeGeometries(geos), MATERIALS[material]());
  mesh.castShadow = mesh.receiveShadow = true;
  return new THREE.Group().add(mesh);
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
export function tents({ count = 60, radius = 40, inner = 0, height = (x, z) => 0, seed = 6, colors = [0x3a3029, 0x4a3d32, 0x2e2722] }) {
  // tents of black goats' hair: a long low roof stretched over a row of poles, sagging between them,
  // the back and sides pegged down to the ground and the front left open in the shade
  const random = rng(seed);
  const byColor = colors.map(() => []);
  for (let i = 0; i < count; i++) {
    const a = random() * Math.PI * 2;
    const r = inner + Math.sqrt(random()) * (radius - inner);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const s = 0.9 + random() * 0.6;
    const W = (5 + random() * 4) * s; // along the ridge
    const D = 3.6 * s;
    const poles = 3;
    const roof = new THREE.PlaneGeometry(W, D, 18, 8);
    const p = roof.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const u = THREE.MathUtils.clamp(p.getX(k) / W + 0.5, 0, 1);
      const v = THREE.MathUtils.clamp(p.getY(k) / D + 0.5, 0, 1); // 0 at the back, 1 at the open front
      const ridge = 1.9 * s;
      const prof = v < 0.55 ? THREE.MathUtils.lerp(0.15, ridge, Math.pow(v / 0.55, 0.7)) : THREE.MathUtils.lerp(ridge, 1.5 * s, (v - 0.55) / 0.45);
      const sag = Math.abs(Math.sin(u * Math.PI * (poles - 1))) * 0.28 * s * Math.sin(v * Math.PI);
      p.setXYZ(k, p.getX(k), prof - sag, (v - 0.5) * D);
    }
    roof.computeVertexNormals();
    const parts = [roof];
    // the end walls, pegged at the foot
    for (const e of [-1, 1]) {
      const end = new THREE.PlaneGeometry(D * 0.9, 1.7 * s, 4, 2);
      end.rotateY(Math.PI / 2);
      end.translate(e * W / 2, 0.85 * s, -D * 0.05);
      parts.push(end);
    }
    const g = mergeGeometries(parts.map((q) => (q.index ? q.toNonIndexed() : q)));
    g.rotateY(random() * Math.PI * 2);
    g.translate(x, height(x, z) - 0.05, z);
    byColor[Math.floor(random() * colors.length)].push(g);
  }
  const group = new THREE.Group();
  byColor.forEach((geos, i) => {
    if (!geos.length) return;
    const mat = MATERIALS.cloth(colors[i]);
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(mergeGeometries(geos), mat);
    mesh.castShadow = true;
    group.add(mesh);
  });
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
  roof.translate(0, H + 0.32 + 0.7, 0);
  const group = new THREE.Group();
  // the hull carries its detail: wales along the planking, three decks marked on the sides, the door "in
  // the side thereof", and the window finished a cubit below the roof (Genesis 6:14-16)
  const wales = [];
  for (const y of [0.35, 1.05, 1.95, 2.85]) for (const s of [-1, 1]) wales.push(box(L - (y < 0.5 ? 4 : 0.2), 0.1, 0.08, 0, y, s * (W / 2 + 0.03)));
  for (let i = 0; i <= 14; i++) for (const s of [-1, 1]) wales.push(box(0.12, H - 0.5, 0.06, -L / 2 + 1 + (i / 14) * (L - 2), 0.5, s * (W / 2 + 0.05)));
  const door = box(1.5, 1.6, 0.06, -1, 0.8, W / 2 + 0.06);
  const eave = box(L - 0.3, 0.32, W - 0.3, 0, H, 0); // the shadowed window course
  const hullMesh = new THREE.Mesh(hull, MATERIALS.darkWood());
  const roofMesh = new THREE.Mesh(roof, MATERIALS.wood());
  const trim = new THREE.Mesh(mergeGeometries([...wales, door]), MATERIALS.darkWood());
  const gap = new THREE.Mesh(eave, new THREE.MeshStandardMaterial({ color: 0x0b0806, roughness: 1 }));
  hullMesh.add(trim, gap);
  group.add(hullMesh, roofMesh);
  // ribs for the "being built" look
  // the frames: a keel, and pairs of ribs standing up from it with a beam across the top of each
  const ribs = [box(L, 0.3, 0.4, 0, -0.1, 0)];
  for (let i = 0; i <= 24; i++) {
    const x = -L / 2 + (i / 24) * L;
    ribs.push(box(0.18, 0.25, W, x, -0.1, 0));
    for (const s of [-1, 1]) ribs.push(box(0.18, H + 0.6, 0.18, x, -0.1, s * (W / 2 - 0.05)));
    ribs.push(box(0.16, 0.16, W, x, H + 0.4, 0));
  }
  const ribMesh = new THREE.Mesh(mergeGeometries(ribs), MATERIALS.wood());
  group.add(ribMesh);
  group.userData = { hullMesh, roofMesh, ribMesh };
  return group;
}

/** The tabernacle: a linen court (100 × 50 cubits), the tent, the altar, the laver. */
export function tabernacle() {
  // the court of fine twined linen on pillars of brass with silver hooks and fillets (Exodus 27:9-19); the
  // tent of the congregation within, under its coverings of goats' hair and skins (Exodus 26)
  const group = new THREE.Group();
  const L = 30;
  const W = 15;
  const posts = [];
  const sockets = [];
  const silver = [];
  const linen = [];
  const post = (x, z) => {
    posts.push(new THREE.CylinderGeometry(0.09, 0.11, 2.5, 10).translate(x, 1.25, z));
    sockets.push(new THREE.CylinderGeometry(0.2, 0.24, 0.22, 10).translate(x, 0.11, z));
    silver.push(new THREE.CylinderGeometry(0.13, 0.1, 0.14, 10).translate(x, 2.5, z));
  };
  for (let i = 0; i <= 20; i++) for (const z of [-W / 2, W / 2]) post(-L / 2 + (i / 20) * L, z);
  for (let i = 1; i < 10; i++) for (const x of [-L / 2, L / 2]) post(x, -W / 2 + (i / 10) * W);
  // fillets of silver joining the pillar heads
  const fillet = (len, x, z, rot) => silver.push(new THREE.BoxGeometry(len, 0.05, 0.05).rotateY(rot).translate(x, 2.42, z));
  fillet(L, 0, -W / 2, 0);
  fillet(L, 0, W / 2, 0);
  fillet(W, -L / 2, 0, Math.PI / 2);
  fillet(W, L / 2, 0, Math.PI / 2);
  // hangings: hung in soft pleats from the fillets, a hand's breadth above the ground
  const side = (w, x, z, rot) => {
    const g = new THREE.PlaneGeometry(w, 2.3, Math.max(8, Math.round(w * 6)), 3);
    const gp = g.attributes.position;
    for (let k = 0; k < gp.count; k++) gp.setZ(k, Math.sin(gp.getX(k) * 9) * 0.05 + Math.sin(gp.getX(k) * 2.3) * 0.03);
    g.computeVertexNormals();
    g.rotateY(rot);
    g.translate(x, 1.3, z);
    linen.push(g);
  };
  side(L, 0, -W / 2, 0);
  side(L, 0, W / 2, 0);
  side(W, -L / 2, 0, Math.PI / 2);
  side(W * 0.3, L / 2, -W * 0.35, Math.PI / 2);
  side(W * 0.3, L / 2, W * 0.35, Math.PI / 2);
  // the gate: a hanging of blue, purple and scarlet (Exodus 27:16)
  const gate = new THREE.PlaneGeometry(W * 0.4, 2.3, 24, 2).rotateY(Math.PI / 2).translate(L / 2 + 0.05, 1.3, 0);
  const bronze = MATERIALS.bronze();
  group.add(new THREE.Mesh(mergeGeometries(posts), MATERIALS.wood()));
  group.add(new THREE.Mesh(mergeGeometries(sockets), bronze));
  group.add(new THREE.Mesh(mergeGeometries(silver.map((g) => (g.index ? g.toNonIndexed() : g))), new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 1 })));
  group.add(new THREE.Mesh(mergeGeometries(linen), MATERIALS.cloth(0xe8e2d2)));
  // [2]: the tent with its coverings, sagging between the boards and draped to the ground at the sides
  const tentG = new THREE.BoxGeometry(9.4, 3.3, 3.6, 24, 6, 8);
  const tp = tentG.attributes.position;
  for (let k = 0; k < tp.count; k++) {
    const x = tp.getX(k);
    const y = tp.getY(k);
    const z = tp.getZ(k);
    if (y > 1.6) tp.setY(k, y - Math.abs(Math.sin(x * 0.7)) * 0.08 - (Math.abs(z) < 1.7 ? 0.05 * Math.sin(z * 2) ** 2 : 0));
    if (Math.abs(z) > 1.7) tp.setZ(k, z + Math.sign(z) * ((1.65 - y) / 3.3) * 0.25 + Math.sin(x * 5) * 0.03);
  }
  tentG.computeVertexNormals();
  tentG.translate(-L / 4, 1.65, 0);
  // one material per face, so a scene can open the near wall and look in (face order +x -x +y -y +z -z)
  const hair = MATERIALS.cloth(0x2c1f1a);
  const nearWall = MATERIALS.cloth(0x2c1f1a);
  const floorFace = new THREE.MeshBasicMaterial({ visible: false });
  const tent = new THREE.Mesh(tentG, [hair, hair, hair, floorFace, nearWall, hair]);
  tent.castShadow = true;
  tent.userData.nearWall = nearWall;
  group.add(tent);
  group.add(new THREE.Mesh(gate, MATERIALS.cloth(0x3a2a6a)));
  const altarB = new THREE.Mesh(box(1.6, 1, 1.6, L / 6, 0, 0), bronze);
  const laver = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.7, 16).translate(L / 12, 0.35, 0), bronze);
  group.add(altarB, laver);
  group.userData = { tentCenter: new THREE.Vector3(-L / 4, 3, 0), altar: new THREE.Vector3(L / 6, 1, 0) };
  // keep the tent addressable as children[2] for scenes that open it
  group.children.splice(group.children.indexOf(tent), 1);
  group.children.splice(2, 0, tent);
  return group;
}

/** The veil's weave: bands of blue, purple and scarlet in fine linen, with cherubim wrought in gold thread. */
function veilTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const g = c.getContext("2d");
  const bands = ["#203a7a", "#4a2363", "#8c1a22", "#8c1a22", "#4a2363", "#203a7a"];
  bands.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, (i * c.height) / bands.length, c.width, c.height / bands.length + 1); });
  // the threads
  for (let y = 0; y < c.height; y += 2) { g.fillStyle = `rgba(0,0,0,${0.05 + 0.05 * Math.random()})`; g.fillRect(0, y, c.width, 1); }
  for (let x = 0; x < c.width; x += 3) { g.fillStyle = `rgba(255,255,255,${0.02 + 0.03 * Math.random()})`; g.fillRect(x, 0, 1, c.height); }
  // cherubim with outstretched wings, in rows
  g.strokeStyle = "rgba(210,172,96,0.6)";
  g.fillStyle = "rgba(210,172,96,0.16)";
  g.lineWidth = 2;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const cx = 128 + col * 256;
      const cy = 140 + row * 250;
      g.beginPath();
      g.arc(cx, cy - 46, 14, 0, Math.PI * 2); // head
      g.moveTo(cx - 16, cy - 28);
      g.lineTo(cx + 16, cy - 28);
      g.lineTo(cx + 12, cy + 50);
      g.lineTo(cx - 12, cy + 50);
      g.closePath(); // body
      for (const s of [-1, 1]) {
        // wings rising and reaching outward
        g.moveTo(cx + s * 14, cy - 24);
        g.quadraticCurveTo(cx + s * 70, cy - 90, cx + s * 110, cy - 60);
        g.quadraticCurveTo(cx + s * 70, cy - 30, cx + s * 14, cy + 6);
      }
      g.fill();
      g.stroke();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Carved cherubim, palm trees and open flowers, for the gilded cedar walls. */
function carvingTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const g = c.getContext("2d");
  g.fillStyle = "#b8b8b8";
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = "#ffffff";
  g.strokeStyle = "#ffffff";
  g.lineWidth = 6;
  const palm = (x) => {
    g.fillRect(x - 6, 200, 12, 260);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.36;
      g.beginPath();
      g.moveTo(x, 200);
      g.quadraticCurveTo(x + Math.cos(a) * 60, 200 + Math.sin(a) * 90, x + Math.cos(a) * 110, 210 + Math.sin(a) * 60 + 50);
      g.stroke();
    }
  };
  const cherub = (x) => {
    g.beginPath();
    g.arc(x, 170, 22, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - 24, 195, 48, 230);
    for (const s of [-1, 1]) {
      g.beginPath();
      g.moveTo(x + s * 20, 210);
      g.quadraticCurveTo(x + s * 90, 120, x + s * 120, 160);
      g.quadraticCurveTo(x + s * 90, 220, x + s * 24, 300);
      g.fill();
    }
  };
  const flower = (x, y) => {
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.ellipse(x + Math.cos((i * Math.PI) / 4) * 16, y + Math.sin((i * Math.PI) / 4) * 16, 12, 6, (i * Math.PI) / 4, 0, Math.PI * 2);
      g.fill();
    }
  };
  for (let i = 0; i < 4; i++) {
    palm(128 + i * 256);
    cherub(256 + i * 256 - 128 + 128);
  }
  for (let x = 32; x < c.width; x += 64) { flower(x, 40); flower(x, 482); }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = 8;
  return tex;
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
  // "the vail of blue, and purple, and crimson, and fine linen, and wrought cherubims thereon"
  // (2 Chronicles 3:14), hanging in folds
  const veilGeo = new THREE.PlaneGeometry(11.5, 14, 96, 8);
  const vp = veilGeo.attributes.position;
  for (let k = 0; k < vp.count; k++) vp.setZ(k, Math.sin(vp.getX(k) * 3.1) * 0.12 + Math.sin(vp.getX(k) * 7.3) * 0.04);
  veilGeo.computeVertexNormals();
  const veil = new THREE.Mesh(veilGeo, new THREE.MeshStandardMaterial({ map: veilTexture(), roughness: 0.85, side: THREE.DoubleSide }));
  veil.rotation.y = Math.PI / 2;
  veil.position.set(-4.15, 7, 0);
  interior.add(veil);
  // the walls of the house lined with cedar overlaid with gold, carved with cherubim, palm trees and
  // open flowers (1 Kings 6:15-22, 29); the floor of fir overlaid with gold (6:30)
  const relief = carvingTexture();
  const lining = new THREE.MeshStandardMaterial({ color: 0xb08430, metalness: 0.7, roughness: 0.62, bumpMap: relief, bumpScale: 1.2, map: relief, envMapIntensity: 0.25 });
  const liningGeos = [];
  for (const z of [-4.98, 4.98]) liningGeos.push(new THREE.PlaneGeometry(29, 14.5).rotateY(z < 0 ? 0 : Math.PI).translate(0, 7.25, z));
  const lin = mergeGeometries(liningGeos);
  interior.add(new THREE.Mesh(lin, lining));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(29, 9.9).rotateX(-Math.PI / 2).translate(0, 0.02, 0), MATERIALS.gold());
  floor.material.roughness = 0.5;
  interior.add(floor);
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
  // a tomb "hewn out in the rock" (Mark 15:46): a limestone outcrop with a dressed face, a low square
  // doorway, and a great round stone standing in a cut groove before it, ready to roll
  const group = new THREE.Group();
  const outcrop = new THREE.BoxGeometry(24, 9, 14, 48, 18, 28);
  const op = outcrop.attributes.position;
  for (let i = 0; i < op.count; i++) {
    const x = op.getX(i);
    const y = op.getY(i);
    const z = op.getZ(i);
    const n = Math.sin(x * 0.6 + z * 0.3) * 0.5 + Math.sin(x * 1.7 - y * 1.3) * 0.22 + Math.sin(z * 2.3 + y * 0.9) * 0.15;
    const top = (y + 4.5) / 9; // 0 at the foot, 1 at the top
    // the top rounds over like a hill; the sides slope away into the ground
    const round = Math.max(0, top - 0.55) * 2.6 * (Math.abs(x) / 12) ** 2;
    const dressed = z > 6.5 && Math.abs(x) < 4.5 && y < 2; // the cut face round the door stays flat
    op.setXYZ(i, x + (dressed ? 0 : n * 0.6), y - round + (dressed ? 0 : n * 0.3), z + (dressed ? 0 : n) - top * top * 2.5 * (z > 0 ? 1 : 0));
  }
  outcrop.computeVertexNormals();
  outcrop.translate(0, 4.5 - 0.6, -5);
  const rockMat = surfaceMaterial("cliff", { tile: 3, tint: [0.86, 0.8, 0.72] });
  const rock = new THREE.Mesh(outcrop, rockMat);
  rock.castShadow = rock.receiveShadow = true;
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.35), new THREE.MeshBasicMaterial({ color: 0x050403 }));
  opening.position.set(0, 0.68, 2.02);
  // the groove the stone runs in
  const groove = new THREE.Mesh(new THREE.BoxGeometry(7, 0.18, 0.7), new THREE.MeshStandardMaterial({ color: 0x2a241e, roughness: 1 }));
  groove.position.set(2, 0.02, 2.4);
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 0.42, 40), surfaceMaterial("cliff", { tile: 1.2, tint: [0.9, 0.85, 0.78] }));
  stone.rotation.x = Math.PI / 2;
  stone.position.set(0, 1.12, 2.4);
  stone.castShadow = true;
  group.add(rock, opening, groove, stone);
  group.userData = { stone, opening };
  return group;
}
