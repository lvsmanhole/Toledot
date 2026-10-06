// Creation days two to five at planetary scale: the deep, the expanse, dry land, growth, the lights,
// then the dive toward the surface. Story units 26–50.

import * as THREE from "three";

import { NOISE } from "../engine/noise.js";
import { createStars } from "../engine/stars.js";

const ramp = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const smooth = (x) => x * x * (3 - 2 * x);
const u2t = (u) => (u - 26) / 24; // story unit -> local time

const RADIUS = 10;

const planetVertex = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormalW;
  varying vec3 vWorld;
  void main() {
    vPos = normalize(position);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

function createPlanet() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uSun: { value: new THREE.Vector3(1, 0.3, 0.6).normalize() },
      uLand: { value: 0 },
      uLife: { value: 0 },
      uLight: { value: 0.2 },
      uTime: { value: 0 },
    },
    vertexShader: planetVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      uniform float uLand, uLife, uLight, uTime;
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        float h = fbm(vPos * 1.6) * 0.75 + fbm(vPos * 5.0) * 0.25;
        float sea = mix(0.75, 0.04, uLand);
        float land = smoothstep(sea, sea + 0.015, h);
        float coast = smoothstep(sea - 0.06, sea, h) * (1.0 - land);
        float lat = abs(vPos.y);

        vec3 deep = mix(vec3(0.004, 0.01, 0.02), vec3(0.008, 0.03, 0.07), uLand);
        vec3 shallow = vec3(0.02, 0.09, 0.12);
        vec3 water = mix(deep, shallow, coast * 0.8);

        vec3 rock = mix(vec3(0.1, 0.085, 0.07), vec3(0.17, 0.15, 0.13), smoothstep(sea, sea + 0.35, h));
        float moist = fbm(vPos * 3.3 + 7.0) * 0.5 + 0.5;
        vec3 green = mix(vec3(0.035, 0.09, 0.03), vec3(0.11, 0.16, 0.05), moist);
        vec3 desert = vec3(0.36, 0.28, 0.17);
        vec3 life = mix(green, desert, smoothstep(0.55, 0.8, 1.0 - moist) * smoothstep(0.1, 0.4, 0.5 - abs(lat - 0.3)));
        vec3 ground = mix(rock, life, uLife * smoothstep(sea + 0.5, sea + 0.05, h));
        ground = mix(ground, vec3(0.7, 0.72, 0.76), smoothstep(0.82, 0.95, lat + h * 0.25) * uLife);
        vec3 albedo = mix(water, ground, land);

        vec3 n = normalize(vNormalW);
        float ndl = dot(n, uSun);
        float day = smoothstep(-0.08, 0.25, ndl);
        vec3 col = albedo * (day * 1.25 * uLight + 0.01);
        vec3 v = normalize(cameraPosition - vWorld);
        vec3 r = reflect(-uSun, n);
        float spec = pow(max(dot(r, v), 0.0), 140.0) * (1.0 - land) * day;
        col += vec3(1.0, 0.92, 0.8) * spec * 0.6 * uLight;
        // twilight band
        col += vec3(0.5, 0.22, 0.08) * smoothstep(0.0, 0.12, ndl) * (1.0 - smoothstep(0.12, 0.3, ndl)) * 0.06 * uLight;
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(RADIUS, 128, 96), material);
}

function createClouds() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) }, uAmount: { value: 0 }, uTime: { value: 0 }, uLight: { value: 0.2 } },
    vertexShader: planetVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      uniform float uAmount, uTime, uLight;
      varying vec3 vPos;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      ${NOISE}
      void main() {
        vec3 p = vPos * 2.4 + vec3(uTime * 0.01, 0.0, uTime * 0.006);
        float n = fbm(p + fbm(p * 1.7) * 0.6);
        float a = smoothstep(0.05, 0.5, n) * uAmount;
        float day = smoothstep(-0.1, 0.3, dot(normalize(vNormalW), uSun));
        gl_FragColor = vec4(vec3(1.0, 0.98, 0.95) * (day * 1.0 * uLight + 0.008), a * 0.8);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.012, 96, 64), material);
}

function createAtmosphere() {
  const material = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: new THREE.Vector3(1, 0, 0) }, uAmount: { value: 0 } },
    vertexShader: planetVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun;
      uniform float uAmount;
      varying vec3 vNormalW;
      varying vec3 vWorld;
      void main() {
        vec3 v = normalize(cameraPosition - vWorld);
        vec3 n = normalize(vNormalW);
        float rim = pow(1.0 - abs(dot(v, n)), 3.0);
        float lit = smoothstep(-0.05, 0.5, dot(n, uSun));
        vec3 sky = mix(vec3(0.9, 0.45, 0.2), vec3(0.35, 0.6, 1.0), smoothstep(0.0, 0.5, dot(n, uSun)));
        gl_FragColor = vec4(sky * rim * lit * 2.2 * uAmount, rim * lit * uAmount);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(new THREE.SphereGeometry(RADIUS * 1.07, 96, 64), material);
}

export function createEarth(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 4000);
  const low = ctx.quality === "low";

  const stars = createStars({ count: low ? 8000 : 18000, seed: 29, size: 1.8 });
  const planet = createPlanet();
  const clouds = createClouds();
  const atmosphere = createAtmosphere();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(1.4, 48, 32), new THREE.MeshStandardMaterial({ color: 0x9a968f, roughness: 1 }));
  const sunLight = new THREE.DirectionalLight(0xfff1dc, 2.5);
  const sunGlow = new THREE.Mesh(new THREE.SphereGeometry(18, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(14, 11, 8) }));
  scene.add(stars, planet, clouds, atmosphere, moon, sunLight, sunGlow, new THREE.AmbientLight(0x101418, 0.4));

  const sunDir = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const target = new THREE.Vector3();

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ local: t, time, pixelRatio, reducedMotion }) {
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      stars.material.uniforms.uTime.value = time;

      const atmos = smooth(ramp(t, u2t(28), u2t(31)));
      const land = smooth(ramp(t, u2t(32.5), u2t(36)));
      const life = smooth(ramp(t, u2t(37), u2t(40)));
      const lights = smooth(ramp(t, u2t(41), u2t(43.5)));
      const cloud = 0.25 * atmos + 0.55 * smooth(ramp(t, u2t(44.5), u2t(47.5)));
      const dive = smooth(ramp(t, u2t(46.5), 1));

      // the sun swings round so the terminator sweeps across the world ("divide the day from the night")
      const orbit = -0.7 + t * 0.9;
      const sideways = 1.75 - 0.75 * lights + (reducedMotion ? 0 : Math.sin(time * 0.05) * 0.05);
      const sunAngle = Math.PI / 2 - orbit + sideways;
      sunDir.set(Math.cos(sunAngle), 0.22, Math.sin(sunAngle)).normalize();
      const light = 0.25 + 0.75 * lights + 0.15 * atmos;
      for (const m of [planet.material, clouds.material, atmosphere.material]) m.uniforms.uSun.value.copy(sunDir);
      planet.material.uniforms.uLand.value = land;
      planet.material.uniforms.uLife.value = life;
      planet.material.uniforms.uLight.value = light;
      clouds.material.uniforms.uAmount.value = cloud;
      clouds.material.uniforms.uLight.value = light;
      clouds.material.uniforms.uTime.value = time;
      atmosphere.material.uniforms.uAmount.value = atmos;
      planet.rotation.y = t * 1.2 + time * 0.01;
      clouds.rotation.y = planet.rotation.y * 1.05;
      sunLight.position.copy(sunDir).multiplyScalar(100);
      sunGlow.position.copy(sunDir).multiplyScalar(900);
      sunGlow.visible = lights > 0.02;
      sunGlow.scale.setScalar(0.2 + lights * 0.8);
      const ma = 2.2 + t * 0.8;
      moon.position.set(Math.cos(ma) * 34, 6, Math.sin(ma) * 34);
      moon.visible = lights > 0.05;
      moon.scale.setScalar(Math.max(0.001, lights));

      // camera: approach from afar, orbit, then dive toward the lit side
      const dist = THREE.MathUtils.lerp(48, 30, smooth(ramp(t, 0, 0.8))) - dive * (30 - RADIUS - 0.35);
      camPos.set(Math.sin(orbit) * dist, 3 + 4 * (1 - dive), Math.cos(orbit) * dist);
      camera.position.copy(camPos);
      target.set(0, 0, 0).lerp(camPos.clone().setLength(RADIUS).add(new THREE.Vector3(0, -3, 0)), dive * 0.9);
      camera.lookAt(target);
      camera.fov = 42 + dive * 18;
      camera.updateProjectionMatrix();

      return {
        grade: { saturation: 1, exposure: 1, bloom: 0.55 + lights * 0.35, tint: [1, 1, 1] },
        audio: { drone: 0.45, shimmer: 0.2 + 0.3 * lights, water: 0.25 * land * (1 - dive), wind: 0.15 + 0.5 * dive },
      };
    },
  };
}
