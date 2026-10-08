// Atmosphere for landscape scenes, driven from named presets that blend over story time. The sky is a
// photographed panorama per preset (CC0, Poly Haven), crossfaded between the two strongest presets and
// rotated so its sun stands where the scene wants it; the same photograph lights the scene (image-based
// lighting) and a shadow-casting sun is aligned with it. Stars, a storm dome and fog sit on top.

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";

import { NOISE } from "../engine/noise.js";
import { createStars } from "../engine/stars.js";
import { lerp } from "./common.js";
import { currentOwner, hdri } from "./library.js";

// elevation/azimuth in degrees; fog colour; light colour/intensity; stars 0..1; storm 0..1
export const PRESETS = {
  dawn: { skyLum: 0.4, elevation: 3, azimuth: 95, turbidity: 6, rayleigh: 2.4, mie: 0.004, fog: 0x8a7f78, fogDensity: 0.0035, sun: 0xffc9a0, sunI: 1.2, hemi: 0.55, stars: 0.25, storm: 0, exposure: 0.95 },
  morning: { skyLum: 0.26, elevation: 22, azimuth: 120, turbidity: 3.5, rayleigh: 1.2, mie: 0.0025, fog: 0xa8a28e, fogDensity: 0.0015, sun: 0xffe6c4, sunI: 2.4, hemi: 0.95, stars: 0, storm: 0, exposure: 1 },
  noon: { skyLum: 0.2, elevation: 60, azimuth: 160, turbidity: 4, rayleigh: 0.9, mie: 0.003, fog: 0xb3ab94, fogDensity: 0.0012, sun: 0xfff3dc, sunI: 3, hemi: 1.1, stars: 0, storm: 0, exposure: 0.95 },
  desert: { skyLum: 0.36, elevation: 38, azimuth: 200, turbidity: 9, rayleigh: 0.7, mie: 0.006, fog: 0xb49e78, fogDensity: 0.0011, sun: 0xffe2b0, sunI: 3.0, hemi: 0.9, stars: 0, storm: 0, exposure: 0.85 },
  golden: { skyLum: 0.36, elevation: 8, azimuth: 250, turbidity: 5, rayleigh: 1.6, mie: 0.004, fog: 0xa38c68, fogDensity: 0.0016, sun: 0xffc27a, sunI: 2.2, hemi: 0.7, stars: 0, storm: 0, exposure: 1 },
  dusk: { skyLum: 0.32, elevation: 0.8, azimuth: 265, turbidity: 9, rayleigh: 3, mie: 0.005, fog: 0x3a3840, fogDensity: 0.0035, sun: 0xff9a60, sunI: 0.6, hemi: 0.35, stars: 0.4, storm: 0, exposure: 0.9 },
  night: { skyLum: 0.012, elevation: -8, azimuth: 265, turbidity: 2, rayleigh: 0.5, mie: 0.002, fog: 0x0d1118, fogDensity: 0.003, sun: 0x8fa6d6, sunI: 0.25, hemi: 0.18, stars: 1, storm: 0, exposure: 1.05 },
  storm: { skyLum: 0.3, elevation: 12, azimuth: 220, turbidity: 12, rayleigh: 2, mie: 0.006, fog: 0x30343a, fogDensity: 0.0055, sun: 0x9aa4b0, sunI: 0.5, hemi: 0.45, stars: 0, storm: 1, exposure: 0.75 },
  ash: { skyLum: 0.25, elevation: 10, azimuth: 230, turbidity: 14, rayleigh: 3.5, mie: 0.008, fog: 0x4a3c34, fogDensity: 0.006, sun: 0xff8a50, sunI: 0.7, hemi: 0.35, stars: 0, storm: 0.6, exposure: 0.85 },
  sacred: { skyLum: 0.55, elevation: 30, azimuth: 180, turbidity: 2, rayleigh: 0.6, mie: 0.002, fog: 0xc9c2b2, fogDensity: 0.0012, sun: 0xfff4e0, sunI: 2.8, hemi: 1.3, stars: 0, storm: 0, exposure: 1.05 },
};

const KEYS = Object.keys(PRESETS.dawn);

/** Blend presets: list of [weight, presetName] or a single name. The result carries `weights`. */
export function blendPresets(spec) {
  if (typeof spec === "string") return { ...PRESETS[spec], weights: [[1, spec]] };
  const out = { weights: spec.filter(([w]) => w > 0.001) };
  const total = spec.reduce((s, [w]) => s + w, 0) || 1;
  for (const key of KEYS) {
    if (["fog", "sun"].includes(key)) {
      const c = new THREE.Color(0, 0, 0);
      for (const [w, name] of spec) c.add(new THREE.Color(PRESETS[name][key]).multiplyScalar(w / total));
      out[key] = c;
    } else {
      out[key] = spec.reduce((s, [w, name]) => s + PRESETS[name][key] * w, 0) / total;
    }
  }
  return out;
}

/** Mix two preset names by k in 0..1. */
export const mixPresets = (a, b, k) => blendPresets([[1 - k, a], [k, b]]);

function createStormDome() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmount: { value: 0 }, uFlash: { value: 0 }, uTint: { value: new THREE.Color(0.14, 0.15, 0.17) } },
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAmount, uFlash;
      uniform vec3 uTint;
      varying vec3 vDir;
      ${NOISE}
      void main() {
        if (vDir.y < -0.05) discard;
        vec2 p = vDir.xz / (vDir.y + 0.25) * 1.4;
        float n = fbm(vec3(p * 0.9 + vec2(uTime * 0.02, uTime * 0.01), uTime * 0.03));
        float m = fbm(vec3(p * 2.3 - uTime * 0.03, 2.0));
        float cover = smoothstep(-0.35, 0.25, n + (uAmount - 0.5) * 1.6);
        vec3 col = uTint * mix(0.35, 0.55 + 0.6 * m, cover) + uFlash * vec3(0.7, 0.75, 0.9) * (0.4 + 0.6 * m);
        // an overcast layer under the cloud masses, so no clear sky shows through a full storm
        float a = mix(smoothstep(0.4, 1.0, uAmount) * 0.92, 1.0, cover) * uAmount * smoothstep(-0.05, 0.12, vDir.y);
        gl_FragColor = vec4(col, a);
      }
    `,
    transparent: true, depthWrite: false, side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1800, 48, 24), material);
  mesh.renderOrder = -1;
  return mesh;
}

function createPhotoDome() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: null }, tB: { value: null }, uMix: { value: 0 }, uYawA: { value: 0 }, uYawB: { value: 0 },
      uHas: { value: new THREE.Vector2(0, 0) }, uGain: { value: 1 }, uGainA: { value: 1 }, uGainB: { value: 1 }, uFog: { value: new THREE.Color() }, uHaze: { value: 0.5 },
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tA, tB;
      uniform float uMix, uYawA, uYawB, uGain, uGainA, uGainB, uHaze;
      uniform vec2 uHas;
      uniform vec3 uFog;
      varying vec3 vDir;
      vec3 sampleSky(sampler2D t, vec3 d, float yaw) {
        // undo the rotation that places this photograph's sun where the scene wants it
        float c = cos(-yaw), s = sin(-yaw);
        vec3 r = vec3(d.x * c + d.z * s, d.y, -d.x * s + d.z * c);
        vec2 uv = vec2(atan(r.z, r.x) * 0.15915494 + 0.5, asin(clamp(r.y, -1.0, 1.0)) * 0.31830989 + 0.5);
        // the sky is stored tone-encoded (v = sqrt(L / (1 + L))) to fit its range in 8 bits
        // (dithered by half a step so the 8-bit levels can't show as bands when the sky is magnified)
        vec3 v = texture2D(t, uv).rgb + (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) / 255.0;
        vec3 x = min(v * v, vec3(0.9995));
        return x / (1.0 - x);
      }
      void main() {
        vec3 d = normalize(vDir);
        vec3 sky = vec3(0.0);
        float w = 0.0;
        if (uHas.x > 0.5) { sky += sampleSky(tA, d, uYawA) * uGainA * (1.0 - uMix); w += 1.0 - uMix; }
        if (uHas.y > 0.5) { sky += sampleSky(tB, d, uYawB) * uGainB * uMix; w += uMix; }
        sky = w > 0.0 ? sky / w : uFog;
        // the sun disc in a photograph is thousands of times brighter than the sky: compress it
        float peak = max(max(sky.r, sky.g), sky.b);
        sky = sky / (1.0 + max(peak - 0.9, 0.0) * 1.6);
        // haze toward the horizon so the sky meets the fogged land
        float h = smoothstep(-0.02, 0.22, d.y);
        sky = mix(uFog, sky * uGain, mix(1.0 - uHaze, 1.0, h));
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(2000, 64, 32), material);
  mesh.renderOrder = -2;
  mesh.frustumCulled = false;
  return mesh;
}

export function createAtmosphere(scene, { stars = true, storm = true, starCount = 9000, shadows = true } = {}) {
  const sky = new Sky();
  sky.scale.setScalar(2500);
  // compress the sky's HDR highlights (the sun disc is ~760x) so bloom gives a glow, not a white-out
  sky.material.uniforms.uSkyGain = { value: 0.9 };
  sky.material.fragmentShader = sky.material.fragmentShader
    .replace("void main() {", "uniform float uSkyGain;\nvoid main() {")
    .replace("gl_FragColor = vec4( texColor, 1.0 );", "float peak = max(max(texColor.r, texColor.g), texColor.b);\n\t\t\tgl_FragColor = vec4( texColor * uSkyGain / (1.0 + max(peak - 0.6, 0.0) * 0.9), 1.0 );");
  sky.material.needsUpdate = true;
  const fog = new THREE.FogExp2(0x999999, 0.003);
  scene.fog = fog;
  const sun = new THREE.DirectionalLight(0xffffff, 2);
  if (shadows) {
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const c = sun.shadow.camera;
    c.left = c.bottom = -70;
    c.right = c.top = 70;
    c.near = 1;
    c.far = 700;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.04;
    sun.shadow.radius = 3;
  }
  const hemi = new THREE.HemisphereLight(0xbfd1e6, 0x3a3020, 1);
  const photo = createPhotoDome();
  scene.add(sky, photo, sun, sun.target, hemi);
  // panoramas: loaded on first use, then held; each scene uses a few
  const loaded = new Map();
  const sceneOwner = currentOwner(); // skies loaded later still belong to the scene that made this sky
  const want = (key) => {
    if (!loaded.has(key)) {
      loaded.set(key, null);
      hdri(key, sceneOwner).then((h) => loaded.set(key, h)).catch(() => {});
    }
    return loaded.get(key);
  };
  const photoSun = new THREE.Vector3();
  const yawFor = (h, azimuthDeg) => THREE.MathUtils.degToRad(azimuthDeg) - Math.atan2(h.sun.x, h.sun.z);
  const starField = stars ? createStars({ count: starCount, radius: 1600, seed: 77, size: 1.7 }) : null;
  if (starField) scene.add(starField);
  const dome = storm ? createStormDome() : null;
  if (dome) scene.add(dome);
  const sunDir = new THREE.Vector3();
  let flash = 0;
  let nextFlash = 0;
  const state = { exposure: 1 };

  return {
    sky, fog, sun, hemi, sunDir, state,
    /** Apply a preset (object from blendPresets) plus extra storm/lightning control. */
    set(p, { time = 0, pixelRatio = 1, lightning = 0, camera = null } = {}) {
      const u = sky.material.uniforms;
      sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - p.elevation), THREE.MathUtils.degToRad(p.azimuth));
      // the photographed sky: the two strongest presets, crossfaded
      const ranked = [...(p.weights ?? [])].sort((a, b) => b[0] - a[0]);
      const [wa = 1, ka] = ranked[0] ?? [];
      const [wb = 0, kb] = ranked[1] ?? [];
      const ha = ka ? want(ka) : null;
      const hb = kb ? want(kb) : null;
      const pu = photo.material.uniforms;
      if (ha) {
        pu.tA.value = ha.texture;
        pu.uYawA.value = yawFor(ha, PRESETS[ka].azimuth);
        // light from the photograph itself; the sun follows the photograph's sun when it is up
        scene.environment = ha.env;
        scene.environmentRotation.set(0, pu.uYawA.value, 0);
        // each photograph is exposed differently (the night sky is stored brighter than noon): scale it to
        // the brightness this time of day should have, for the visible sky and for the light it casts
        // (a soft correction: three quarters of the way, in log terms)
        const gain = (key, h) => THREE.MathUtils.clamp((PRESETS[key].skyLum / Math.max(1e-4, h.mean)) ** 0.75, 0.02, 1.6);
        pu.uGainA.value = gain(ka, ha);
        pu.uGainB.value = hb ? gain(kb, hb) : pu.uGainA.value;
        const lit = THREE.MathUtils.lerp(pu.uGainA.value, pu.uGainB.value, hb ? wb / Math.max(1e-6, wa + wb) : 0);
        scene.environmentIntensity = (0.55 + 0.35 * p.hemi) * Math.min(1.3, Math.max(0.16, lit)); // a floor: moonlight still shows the land
        photoSun.copy(ha.sun).applyAxisAngle(THREE.Object3D.DEFAULT_UP, pu.uYawA.value);
        if (photoSun.y > 0.05 && PRESETS[ka].elevation > 0) sunDir.copy(photoSun);
      }
      if (hb) {
        pu.tB.value = hb.texture;
        pu.uYawB.value = yawFor(hb, PRESETS[kb].azimuth);
      }
      pu.uHas.value.set(ha ? 1 : 0, hb ? 1 : 0);
      pu.uMix.value = hb ? wb / Math.max(1e-6, wa + wb) : 0;
      pu.uGain.value = 0.85;
      pu.uFog.value.copy(p.fog instanceof THREE.Color ? p.fog : new THREE.Color(p.fog));
      pu.uHaze.value = THREE.MathUtils.clamp(p.fogDensity * 260, 0.25, 0.95);
      photo.visible = Boolean(ha);
      sky.visible = !ha;
      if (camera) photo.position.copy(camera.position);
      u.sunPosition.value.copy(sunDir);
      u.turbidity.value = p.turbidity;
      u.rayleigh.value = p.rayleigh;
      u.mieCoefficient.value = p.mie;
      u.mieDirectionalG.value = 0.8;
      fog.color.copy(p.fog instanceof THREE.Color ? p.fog : new THREE.Color(p.fog));
      fog.density = p.fogDensity * 0.72;
      sun.color.copy(p.sun instanceof THREE.Color ? p.sun : new THREE.Color(p.sun));
      sun.intensity = p.sunI;
      sun.position.copy(sunDir).multiplyScalar(300);
      if (camera) {
        // the shadow box sits a little ahead of the camera, where the viewer is looking
        const ahead = camera.getWorldDirection(new THREE.Vector3()).setY(0).normalize().multiplyScalar(35);
        sun.target.position.copy(camera.position).add(ahead);
        sun.position.add(sun.target.position);
      }
      sun.castShadow = shadows && sunDir.y > 0.03;
      hemi.intensity = p.hemi * (photo.visible ? 0.35 : 1);
      // lightning: random flashes while `lightning` > 0
      if (lightning > 0 && time > nextFlash) {
        flash = 1;
        nextFlash = time + 1.2 + Math.random() * (6 / lightning);
      }
      flash = Math.max(0, flash - 0.08);
      const f = flash * (0.6 + 0.4 * Math.sin(time * 60)) * lightning;
      if (starField) {
        starField.material.uniforms.uOpacity.value = p.stars;
        starField.material.uniforms.uTime.value = time;
        starField.material.uniforms.uPixelRatio.value = pixelRatio;
        starField.visible = p.stars > 0.01;
        if (camera) starField.position.copy(camera.position);
      }
      if (dome) {
        dome.material.uniforms.uAmount.value = p.storm;
        dome.material.uniforms.uTime.value = time;
        dome.material.uniforms.uFlash.value = f;
        dome.visible = p.storm > 0.01;
        if (camera) dome.position.copy(camera.position);
      }
      hemi.intensity += f * 2.5;
      state.exposure = p.exposure;
      state.flash = f;
      return f;
    },
  };
}

export { lerp };
