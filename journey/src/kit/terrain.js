// Terrain: a height function sampled into a mesh, with slope/height-driven colouring.
// Height builders compose: start from a base and add features (mountains, valleys, plateaus, flats).

import * as THREE from "three";

import { fbm2 } from "../engine/noise.js";
import { clamp, smooth } from "./common.js";
import { TERRAIN_LAYERS, splatMaterial } from "./surface.js";

const sat = (x) => clamp(x);

export const heights = {
  /** Rolling ground with given amplitude and frequency. */
  rolling: (amp = 6, freq = 0.012, seed = 3) => (x, z) => fbm2(x * freq, z * freq, 5, seed) * amp,
  /** Wind-shaped dunes running along a direction (radians). */
  dunes: (amp = 7, wavelength = 60, dir = 0.6, seed = 5) => {
    const c = Math.cos(dir);
    const s = Math.sin(dir);
    return (x, z) => {
      const u = x * c + z * s;
      const v = -x * s + z * c;
      const warp = fbm2(x * 0.01, z * 0.01, 3, seed) * 40;
      const ridge = 1 - Math.abs(Math.sin(((u + warp) / wavelength) * Math.PI));
      return (Math.pow(ridge, 1.6) * amp + fbm2(v * 0.02, u * 0.02, 3, seed + 1) * amp * 0.35);
    };
  },
  /** A single peak or massif at (cx, cz). */
  mountain: (cx, cz, radius, h, seed = 9, sharp = 1.4) => (x, z) => {
    const d = Math.hypot(x - cx, z - cz) / radius;
    if (d > 1.6) return 0;
    const ridged = 1 - Math.abs(fbm2(x * 0.02, z * 0.02, 5, seed));
    const falloff = Math.pow(sat(1 - d / 1.6), sharp);
    return h * falloff * (0.65 + 0.35 * ridged * ridged);
  },
  /** A ring of mountains beyond radius r0. */
  ring: (r0, r1, h, seed = 17) => (x, z) => {
    const r = Math.hypot(x, z);
    const ridge = 1 - Math.abs(fbm2(x * 0.008, z * 0.008, 5, seed));
    return smooth(sat((r - r0) / (r1 - r0))) * h * (0.5 + 0.5 * ridge * ridge);
  },
  /** Flatten toward level within radius of (cx, cz). */
  flatten: (cx, cz, r0, r1, level) => ({ flatten: true, cx, cz, r0, r1, level }),
  /** Cut a channel along x = f(z). */
  channel: (f, halfWidth, depth, bank = 5) => ({ channel: true, f, halfWidth, depth, bank }),
};

/** Combine additive height functions and shaping operations into one height(x, z). */
export function composeHeight(parts, base = 0) {
  const add = parts.filter((p) => typeof p === "function");
  const ops = parts.filter((p) => typeof p === "object");
  return (x, z) => {
    let h = base;
    for (const f of add) h += f(x, z);
    for (const op of ops) {
      if (op.flatten) {
        const d = Math.hypot(x - op.cx, z - op.cz);
        const k = 1 - smooth(sat((d - op.r0) / (op.r1 - op.r0)));
        h = h * (1 - k) + op.level * k;
      } else if (op.channel) {
        const d = Math.abs(x - op.f(z));
        const k = 1 - smooth(sat((d - op.halfWidth) / op.bank));
        h = h * (1 - k) + op.depth * k;
      }
    }
    return h;
  };
}

export const PALETTES = {
  garden: { low: [0.13, 0.22, 0.07], high: [0.25, 0.26, 0.15], rock: [0.2, 0.19, 0.18], snow: [0.86, 0.87, 0.9], wet: [0.17, 0.14, 0.1], snowLine: 150 },
  steppe: { low: [0.27, 0.26, 0.15], high: [0.33, 0.28, 0.2], rock: [0.24, 0.21, 0.18], snow: [0.85, 0.86, 0.88], wet: [0.2, 0.17, 0.12], snowLine: 160 },
  desert: { low: [0.62, 0.48, 0.32], high: [0.7, 0.55, 0.36], rock: [0.42, 0.3, 0.22], snow: [0.7, 0.55, 0.36], wet: [0.35, 0.28, 0.2], snowLine: 999 },
  sinai: { low: [0.45, 0.32, 0.24], high: [0.38, 0.24, 0.18], rock: [0.3, 0.19, 0.15], snow: [0.38, 0.24, 0.18], wet: [0.3, 0.22, 0.16], snowLine: 999 },
  judea: { low: [0.42, 0.38, 0.28], high: [0.55, 0.5, 0.4], rock: [0.62, 0.58, 0.5], snow: [0.62, 0.58, 0.5], wet: [0.24, 0.24, 0.13], snowLine: 999 },
  fields: { low: [0.55, 0.45, 0.2], high: [0.36, 0.34, 0.18], rock: [0.42, 0.38, 0.3], snow: [0.42, 0.38, 0.3], wet: [0.25, 0.24, 0.12], snowLine: 999 },
  ashen: { low: [0.16, 0.14, 0.13], high: [0.2, 0.18, 0.17], rock: [0.12, 0.11, 0.1], snow: [0.3, 0.28, 0.27], wet: [0.1, 0.09, 0.08], snowLine: 999 },
  bone: { low: [0.6, 0.55, 0.46], high: [0.68, 0.62, 0.52], rock: [0.45, 0.4, 0.34], snow: [0.68, 0.62, 0.52], wet: [0.5, 0.45, 0.38], snowLine: 999 },
  mesopotamia: { low: [0.5, 0.42, 0.3], high: [0.56, 0.47, 0.34], rock: [0.42, 0.36, 0.28], snow: [0.56, 0.47, 0.34], wet: [0.2, 0.24, 0.12], snowLine: 999 },
};

/**
 * Build a terrain mesh. options: { size, segments, height, palette, center:[x,z], wetLevel, quality }
 * The surface blends photographed ground layers (see surface.js TERRAIN_LAYERS) by height, slope and
 * wetness. The returned object exposes height(x, z) for placing things on the ground.
 */
export function createTerrain({ size = 700, segments = 220, height, palette = "steppe", center = [0, 0], wetLevel = 0.6, quality = "high", highFrom = 12, highSpan = 40 }) {
  const pal = typeof palette === "string" ? PALETTES[palette] : palette;
  const set = TERRAIN_LAYERS[typeof palette === "string" ? palette : "steppe"] ?? TERRAIN_LAYERS.steppe;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(center[0], 0, center[1]);
  const pos = geometry.attributes.position;
  const splat = new Float32Array(pos.count * 4);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const h = height(x, z);
    pos.setY(i, h);
    const e = 0.8;
    const slope = Math.hypot(height(x + e, z) - h, height(x, z + e) - h) / e;
    const hi = sat((h - highFrom) / highSpan + fbm2(x * 0.02, z * 0.02, 3, 41) * 0.35);
    const rock = sat((slope - 0.42) * 2.4 + fbm2(x * 0.05, z * 0.05, 3, 23) * 0.5) + sat((h - pal.snowLine) / 40);
    const wet = sat((wetLevel - h) / 1.6);
    const rest = Math.max(0, 1 - rock - wet);
    splat.set([rest * (1 - hi), rest * hi, wet, rock], i * 4);
  }
  geometry.setAttribute("splat", new THREE.BufferAttribute(splat, 4));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, splatMaterial({ layers: set.layers, tints: set.tints, quality }));
  mesh.receiveShadow = true;
  return { mesh, height };
}
