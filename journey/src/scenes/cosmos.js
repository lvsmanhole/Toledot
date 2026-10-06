// Prologue: darkness, emerging stars, the Spirit over the deep, and the first light. Story units 0–26.

import * as THREE from "three";

import { NOISE, rng } from "../engine/noise.js";
import { createStars } from "../engine/stars.js";

const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (x) => x * x * (3 - 2 * x);

function createNebula() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 }, uWarm: { value: 0 } },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime, uIntensity, uWarm;
      varying vec3 vDir;
      ${NOISE}
      void main() {
        vec3 p = vDir * 2.2;
        float n = fbm(p + vec3(0.0, 0.0, uTime * 0.01));
        float m = fbm(p * 2.1 - vec3(uTime * 0.006, 0.0, 0.0) + n);
        float dust = smoothstep(-0.2, 0.7, m) * smoothstep(-0.4, 0.4, n);
        float lane = 1.0 - smoothstep(0.0, 0.35, abs(vDir.y * 0.9 + vDir.z * 0.45 + n * 0.25));
        vec3 cold = vec3(0.10, 0.14, 0.22);
        vec3 warm = vec3(0.42, 0.26, 0.12);
        vec3 col = mix(cold, warm, smoothstep(0.1, 0.8, m) * uWarm) * dust * (0.25 + lane);
        gl_FragColor = vec4(col * uIntensity, 1.0);
      }
    `,
    side: THREE.BackSide,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(1200, 48, 32), material);
}

function createGalaxy({ count, radius, arms, seed, tint }) {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  const core = new THREE.Color(1.0, 0.86, 0.62);
  const edge = new THREE.Color(...tint);
  for (let i = 0; i < count; i++) {
    const r = Math.pow(random(), 1.6) * radius;
    const arm = (Math.floor(random() * arms) / arms) * Math.PI * 2;
    const spin = r * 0.045;
    const scatter = (1 - r / radius) * 0.4 + 0.15;
    const jitter = () => Math.pow(random(), 2.6) * (random() < 0.5 ? 1 : -1) * radius * scatter * 0.35;
    positions.set([Math.cos(arm + spin) * r + jitter(), jitter() * 0.25, Math.sin(arm + spin) * r + jitter()], i * 3);
    const c = core.clone().lerp(edge, r / radius);
    const b = 0.5 + random() * 0.8;
    colors.set([c.r * b, c.g * b, c.b * b], i * 3);
    delay[i] = r / radius * 0.7 + random() * 0.3;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("delay", new THREE.BufferAttribute(delay, 1));
  const material = new THREE.ShaderMaterial({
    uniforms: { uIgnite: { value: 0 }, uPixelRatio: { value: 1 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float delay;
      uniform float uIgnite, uPixelRatio, uTime;
      varying vec3 vColor;
      varying float vA;
      void main() {
        float on = smoothstep(delay, delay + 0.15, uIgnite);
        vColor = color;
        vA = on;
        float a = uTime * 0.02 * (1.2 - delay);
        vec3 p = vec3(position.x * cos(a) - position.z * sin(a), position.y, position.x * sin(a) + position.z * cos(a));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uPixelRatio * (1.0 + 2.0 * (1.0 - delay)) * on * (300.0 / -mv.z);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vA;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vA * 0.7;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * a, a);
      }
    `,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  return points;
}

function glowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.08, "rgba(255,246,225,0.95)");
  grad.addColorStop(0.3, "rgba(255,214,160,0.28)");
  grad.addColorStop(1, "rgba(255,200,140,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createDust(count, seed) {
  const random = rng(seed);
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) positions.set([(random() - 0.5) * 120, (random() - 0.5) * 80, -random() * 400], i * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    size: 0.35, color: 0xb8a98c, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  return new THREE.Points(geometry, material);
}

export function createCosmos(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  const low = ctx.quality === "low";

  const stars = createStars({ count: low ? 9000 : 24000, seed: 11 });
  const nebula = createNebula();
  const galaxies = [
    createGalaxy({ count: low ? 6000 : 16000, radius: 60, arms: 4, seed: 5, tint: [0.55, 0.68, 1.0] }),
    createGalaxy({ count: low ? 3000 : 8000, radius: 34, arms: 2, seed: 9, tint: [1.0, 0.75, 0.6] }),
    createGalaxy({ count: low ? 2500 : 7000, radius: 28, arms: 3, seed: 13, tint: [0.7, 0.8, 1.0] }),
  ];
  galaxies[0].position.set(-70, 25, -420);
  galaxies[0].rotation.set(1.1, 0.2, 0.4);
  galaxies[1].position.set(110, -40, -520);
  galaxies[1].rotation.set(0.5, 0.0, -0.9);
  galaxies[2].position.set(30, 70, -650);
  galaxies[2].rotation.set(1.4, 0.6, 0.1);

  const light = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  light.position.set(0, 0, -300);
  const dust = createDust(low ? 600 : 1800, 21);

  scene.add(nebula, stars, ...galaxies, light, dust);

  const state = { drift: 0 };

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ local: t, time, dt, pixelRatio, reducedMotion }) {
      for (const m of [stars.material, ...galaxies.map((g) => g.material)]) {
        m.uniforms.uPixelRatio.value = pixelRatio;
        m.uniforms.uTime.value = time;
      }
      // star emergence: a handful in the dark, then the heavens fill
      const reveal = 0.004 + 0.5 * smooth(ramp(t, 0.08, 0.5)) + 0.5 * smooth(ramp(t, 0.74, 0.92));
      stars.material.uniforms.uReveal.value = reveal;
      // the deep: a faint moving mist (the Spirit hovering) between 0.55 and 0.78
      const deep = smooth(ramp(t, 0.5, 0.62)) * (1 - smooth(ramp(t, 0.76, 0.86)));
      nebula.material.uniforms.uTime.value = time;
      nebula.material.uniforms.uIntensity.value = 0.25 * smooth(ramp(t, 0.2, 0.5)) + 1.3 * deep + 0.9 * smooth(ramp(t, 0.8, 0.95));
      nebula.material.uniforms.uWarm.value = smooth(ramp(t, 0.76, 0.95));
      // light: a point far ahead, then overwhelming
      const lightT = smooth(ramp(t, 0.74, 1.0));
      light.material.opacity = smooth(ramp(t, 0.72, 0.78));
      const s = 6 + lightT * lightT * 900;
      light.scale.set(s, s, 1);
      galaxies.forEach((g, i) => { g.material.uniforms.uIgnite.value = smooth(ramp(t, 0.77 + i * 0.04, 0.95 + i * 0.02)) * 1.3; });

      state.drift += dt * (reducedMotion ? 0.2 : 1);
      const z = -t * 120;
      camera.position.set(Math.sin(state.drift * 0.05) * 3, Math.cos(state.drift * 0.04) * 2, z);
      camera.lookAt(Math.sin(state.drift * 0.03) * 6, Math.sin(state.drift * 0.02) * 4, z - 100);
      camera.rotateZ(Math.sin(state.drift * 0.017) * 0.04);
      dust.position.z = z * 0.0;

      return {
        grade: { saturation: 0.9, exposure: 1 + lightT * 0.4, bloom: 0.8 + lightT * 1.4, tint: [1, 0.98, 0.95] },
        audio: { drone: 0.5 + 0.3 * deep, shimmer: smooth(ramp(t, 0.72, 0.98)), wind: 0.15 * deep },
      };
    },
  };
}
