// Landscape scene composer: terrain + atmosphere + water + vegetation + extras + keyframed camera.
// Act scenes build one of these and add their own set pieces through `onUpdate`.

import * as THREE from "three";

import { cameraRig, collectShaderMaterials, disposeScene } from "./common.js";
import { blendPresets, createAtmosphere } from "./sky.js";
import { createTerrain } from "./terrain.js";
import { createWater } from "./water.js";
import { scatterPlants, scatterRocks } from "./vegetation.js";
import { rng } from "../engine/noise.js";

/**
 * options:
 *   terrain: { height, palette, size, segments, center, wetLevel } | null
 *   water: { level, size, wave, chop, flow, flowDir, deep, opacity } | null
 *   sky(rel) -> preset spec for blendPresets (string or [[w, name], ...])
 *   lightning(rel) -> 0..1, wind(rel) -> 0..1
 *   camera: keys for cameraRig on the scene's rel units
 *   grade(rel) -> partial grade; audio(rel) -> levels
 */
export function createLandscape(ctx, options) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 4000);
  const atmosphere = createAtmosphere(scene, { stars: options.stars !== false, storm: options.storm !== false, shadows: ctx.quality !== "low" });
  const terrain = options.terrain ? createTerrain({ segments: ctx.quality === "low" ? 140 : 220, quality: ctx.quality, ...options.terrain }) : null;
  if (terrain) scene.add(terrain.mesh);
  const water = options.water ? createWater({ segments: options.water.wave ? (ctx.quality === "low" ? 120 : 220) : 1, ...options.water }) : null;
  if (water) scene.add(water.mesh);
  if (terrain && options.rocks !== false) {
    const hgt = terrain.height;
    const keep = options.keepClear ?? [[0, 0, 30]];
    const span = (options.terrain.size ?? 700) * 0.45;
    const c = options.terrain.center ?? [0, 0];
    const place = (r) => {
      const x = c[0] + (r() - 0.5) * 2 * span;
      const z = c[1] + (r() - 0.5) * 2 * span;
      if (keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) return null;
      const h0 = hgt(x, z);
      const slope = Math.hypot(hgt(x + 1, z) - h0, hgt(x, z + 1) - h0);
      return slope > 0.12 || r() < 0.15 ? [x, z] : null;
    };
    scene.add(scatterRocks({ count: ctx.quality === "low" ? 50 : options.rocks ?? 110, place, height: hgt, random: rng(options.terrain.size ?? 7) }));
    // scrub and tussocks wherever anything grows (not on sand, ash or the bare rock of Sinai)
    const pal = options.terrain.palette;
    if (["judea", "steppe", "garden", "fields"].includes(pal) && options.plants !== false) {
      const near = span * 0.5; // concentrated where the camera works
      const placeNear = (r) => {
        const x = c[0] + (r() - 0.5) * 2 * near;
        const z = c[1] + (r() - 0.5) * 2 * near;
        if (keep.some(([kx, kz, kr]) => Math.hypot(x - kx, z - kz) < kr)) return null;
        const y = hgt(x, z);
        return y > 0.8 ? [x, z] : null;
      };
      scene.add(scatterPlants({ count: ctx.quality === "low" ? 90 : options.plantCount ?? 220, place: placeNear, height: hgt, random: rng((options.terrain.size ?? 7) + 3) }));
    }
  }
  const rig = cameraRig(options.camera);
  const updaters = [];
  const height = terrain ? terrain.height : () => 0;
  let shaderMats = null;

  const api = {
    scene,
    camera,
    atmosphere,
    terrain,
    water,
    height,
    rig,
    /** Add an object and optionally an updater (called each frame with the frame state). */
    add(object, updater) {
      if (object) scene.add(object);
      if (updater) updaters.push(updater);
      shaderMats = null;
      return object;
    },
    onUpdate(fn) { updaters.push(fn); },
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    dispose() { disposeScene(scene); },
    update(frame) {
      const { rel, time, pixelRatio, reducedMotion } = frame;
      const cam = rig.apply(camera, rel, time, reducedMotion ? 0 : 1);
      if (terrain && options.keepAboveGround !== false) {
        const ground = height(camera.position.x, camera.position.z) + 1.4;
        if (camera.position.y < ground) camera.position.y = ground;
      }
      const preset = blendPresets(options.sky ? options.sky(rel) : "morning");
      const lightning = options.lightning ? options.lightning(rel) : 0;
      const flash = atmosphere.set(preset, { time, pixelRatio, lightning, camera });
      const wind = options.wind ? options.wind(rel) : 0.3;
      if (water) water.update({ time, fog: atmosphere.fog, sunDir: atmosphere.sunDir });
      if (!shaderMats) {
        shaderMats = collectShaderMaterials(scene);
        // solid, lit things cast shadows; skies, water, particles and custom-shaded effects do not
        scene.traverse((o) => {
          if (!o.isMesh) return;
          const m = Array.isArray(o.material) ? o.material[0] : o.material;
          const solid = m && !m.isShaderMaterial && !m.transparent && m.side !== THREE.BackSide && m.blending === THREE.NormalBlending;
          o.castShadow = solid && o !== terrain?.mesh && o !== water?.mesh;
          o.receiveShadow = solid || o === terrain?.mesh;
        });
      }
      for (const m of shaderMats) {
        if (m.uniforms.fogColor && m.fog) {
          m.uniforms.fogColor.value.copy(atmosphere.fog.color);
          if (m.uniforms.fogDensity) m.uniforms.fogDensity.value = atmosphere.fog.density;
        }
        if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = pixelRatio;
      }
      const state = { ...frame, wind, flash, preset, atmosphere, camera, cam, height, fog: atmosphere.fog };
      let extra = {};
      for (const fn of updaters) {
        const r = fn(state);
        if (r) extra = { ...extra, ...r, grade: { ...(extra.grade ?? {}), ...(r.grade ?? {}) }, audio: { ...(extra.audio ?? {}), ...(r.audio ?? {}) } };
      }
      const grade = {
        saturation: 1, exposure: preset.exposure * (1 + flash * 0.6), bloom: 0.22, threshold: 1.05, tint: [1, 1, 1],
        ...(options.grade ? options.grade(rel) : {}),
        ...(extra.grade ?? {}),
      };
      const audio = { drone: 0.35, wind: 0.15 + wind * 0.5, ...(options.audio ? options.audio(rel) : {}), ...(extra.audio ?? {}) };
      return { grade, audio };
    },
  };
  return api;
}
