// Landscape scene composer: terrain + atmosphere + water + vegetation + extras + keyframed camera.
// Act scenes build one of these and add their own set pieces through `onUpdate`.

import * as THREE from "three";

import { cameraRig, collectShaderMaterials, disposeScene } from "./common.js";
import { blendPresets, createAtmosphere } from "./sky.js";
import { createTerrain } from "./terrain.js";
import { createWater } from "./water.js";

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
  const atmosphere = createAtmosphere(scene, { stars: options.stars !== false, storm: options.storm !== false });
  const terrain = options.terrain ? createTerrain({ segments: ctx.quality === "low" ? 140 : 220, ...options.terrain }) : null;
  if (terrain) scene.add(terrain.mesh);
  const water = options.water ? createWater({ segments: options.water.wave ? (ctx.quality === "low" ? 120 : 220) : 1, ...options.water }) : null;
  if (water) scene.add(water.mesh);
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
      if (!shaderMats) shaderMats = collectShaderMaterials(scene);
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
