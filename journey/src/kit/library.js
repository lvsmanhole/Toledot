// Asset library: cached loading of the photographic assets in site/lib/ (fetched by
// scripts/fetch-assets.mjs). Everything returns immediately and fills in when the file arrives, and each
// load is tracked so a scene can wait for its assets before it is shown.

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const BASE = new URL("lib/", document.baseURI);
const texLoader = new THREE.TextureLoader();
const hdrLoader = new HDRLoader();
const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

let renderer = null;
let pmrem = null;
let mobile = false; // phones and tablets: half-size textures, skies and model textures
const M = () => (mobile ? "_m" : "");
// which scenes asked for each asset, so a scene's assets can be freed when it unloads
let owner = null;
const owners = new Map(); // asset id -> Set of scene owners
function own(id) {
  if (owner === null) return;
  if (!owners.has(id)) owners.set(id, new Set());
  owners.get(id).add(owner);
}

/** The scene being built (assets requested now belong to it), or null. */
export function setOwner(id) {
  owner = id;
}

/** The scene currently being built, for code that loads assets later on its behalf. */
export function currentOwner() {
  return owner;
}

/**
 * Free the graphics memory of assets only the given scene used (textures and models). They stay in
 * the cache and are uploaded again if a later scene asks for them.
 */
export function release(id) {
  for (const [key, set] of owners) {
    set.delete(id);
    if (set.size) continue;
    owners.delete(key);
    if (textures.has(key)) textures.get(key).dispose();
    if (key.startsWith("hdri:")) {
      const name = key.slice(5);
      const p = hdris.get(name);
      hdris.delete(name);
      p?.then((h) => { h.texture?.dispose(); h.target?.dispose(); }).catch(() => {});
    }
    if (key.startsWith("model:")) {
      const name = key.slice(6);
      const p = models.get(name);
      models.delete(name);
      p?.then((root) => root.traverse((o) => {
        if (!o.isMesh) return;
        o.geometry.dispose();
        for (const v of Object.values(o.material)) if (v && v.isTexture) v.dispose();
        o.material.dispose();
      })).catch(() => {});
    }
  }
}

/** Phones and tablets get the half-size variants of every image. */
export function useMobileAssets(on) {
  mobile = on;
}
const textures = new Map();
const hdris = new Map();
const models = new Map();
const pending = new Set();

function track(promise) {
  pending.add(promise);
  promise.finally(() => pending.delete(promise)).catch(() => {});
  return promise;
}

/** Give the library the renderer (for environment maps and anisotropy). */
export function initLibrary(r) {
  renderer = r;
  pmrem = new THREE.PMREMGenerator(r);
}

/** Resolves when every asset requested so far has loaded (or failed), or after `timeout` ms. */
export function settled(timeout = 15000) {
  return Promise.race([Promise.allSettled([...pending]), new Promise((r) => setTimeout(r, timeout))]);
}

/** One map of a texture set: key from the manifest, map in diff | nor | arm. */
export function texture(key, map) {
  const id = `${key}_${map}`;
  own(id);
  if (textures.has(id)) return textures.get(id);
  const t = new THREE.Texture();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = map === "diff" ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = renderer ? Math.min(8, renderer.capabilities.getMaxAnisotropy()) : 4;
  textures.set(id, t);
  track(new Promise((resolve) => {
    texLoader.load(new URL(`tex/${id}${M()}.webp`, BASE).href, (img) => {
      t.image = img.image;
      t.needsUpdate = true;
      resolve(t);
    }, undefined, () => resolve(t));
  }));
  return t;
}

/** The three maps of a PBR set. */
export function pbr(key) {
  return { map: texture(key, "diff"), normalMap: texture(key, "nor"), armMap: texture(key, "arm") };
}

/**
 * A sky panorama: { texture (the visible sky: 2k WebP, each channel stored as sqrt(L / (1 + L)), decoded by
 * the dome), env (PMREM for lighting, from a 512px HDR), sun (unit vector toward the brightest point of the
 * photograph, in the panorama's own frame), peak, mean (sky luminance) }. Returns a promise.
 */
export function hdri(key, forOwner = owner) {
  if (forOwner !== null) {
    const id = `hdri:${key}`;
    if (!owners.has(id)) owners.set(id, new Set());
    owners.get(id).add(forOwner);
  }
  if (hdris.has(key)) return hdris.get(key);
  const p = track(new Promise((resolve, reject) => {
    hdrLoader.setDataType(THREE.HalfFloatType);
    const sky = new Promise((ok) => texLoader.load(new URL(`hdri/${key}_sky${M()}.webp`, BASE).href, (t) => { t.colorSpace = THREE.NoColorSpace; t.mapping = THREE.EquirectangularReflectionMapping; t.anisotropy = 4; ok(t); }, undefined, () => ok(null)));
    hdrLoader.load(new URL(`hdri/${key}_env.hdr`, BASE).href, (tex) => {
      tex.mapping = THREE.EquirectangularReflectionMapping;
      tex.colorSpace = THREE.LinearSRGBColorSpace;
      // locate the sun: the brightest pixel in the upper hemisphere
      const { data, width, height } = tex.image;
      let best = -1;
      let bx = 0;
      let by = 0;
      let sum = 0;
      let n = 0;
      const f = THREE.DataUtils.fromHalfFloat;
      for (let y = 0; y < height / 2; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const l = f(data[i]) + f(data[i + 1]) + f(data[i + 2]);
          if (l > best) { best = l; bx = x; by = y; }
          // the sky's overall brightness (the sun clipped out), so photographs exposed differently can be
          // brought to the brightness each time of day should have
          if (y > height * 0.1 && y < height * 0.45) { sum += Math.min(4, (0.2126 * f(data[i]) + 0.7152 * f(data[i + 1]) + 0.0722 * f(data[i + 2]))); n++; }
        }
      }
      const phi = (bx / width) * Math.PI * 2; // around
      const theta = (by / height) * Math.PI; // from the zenith
      // three's equirect mapping: u = atan(dir.z, dir.x) / 2pi + 0.5, v = asin(dir.y) / pi + 0.5
      const azim = phi - Math.PI;
      const elev = Math.PI / 2 - theta;
      const sun = new THREE.Vector3(Math.cos(azim) * Math.cos(elev), Math.sin(elev), Math.sin(azim) * Math.cos(elev)).normalize();
      const target = pmrem ? pmrem.fromEquirectangular(tex) : null;
      const env = target ? target.texture : null;
      tex.dispose(); // the lighting cube is made; the half-float source is no longer needed
      sky.then((skyTex) => resolve({ texture: skyTex, env, target, sun, peak: best, mean: n ? sum / n : 1 }));
    }, undefined, reject);
  }));
  hdris.set(key, p);
  return p;
}

/** A scanned model: resolves to the loaded glTF scene (clone it, or use its geometries directly). */
export function model(key) {
  own(`model:${key}`);
  if (models.has(key)) return models.get(key);
  const p = track(new Promise((resolve, reject) => {
    gltfLoader.load(new URL(`${mobile ? "models-m" : "models"}/${key}.glb`, BASE).href, (gltf) => {
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        const m = o.material;
        // foliage: hard-edged cut-outs sort and shadow correctly, blended cards do not
        if (m.transparent || m.alphaTest > 0) {
          m.transparent = false;
          m.alphaTest = 0.45;
          m.side = THREE.DoubleSide;
        }
      });
      resolve(gltf.scene);
    }, undefined, reject);
  }));
  models.set(key, p);
  return p;
}

/** The meshes of a model with their node transforms (apply as placement.multiply(part.matrix)). */
export async function modelParts(key) {
  const root = await model(key);
  root.updateMatrixWorld(true);
  const parts = [];
  root.traverse((o) => {
    if (o.isMesh) parts.push({ geometry: o.geometry, material: o.material, matrix: o.matrixWorld.clone() });
  });
  return parts;
}
