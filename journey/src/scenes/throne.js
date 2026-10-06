// Revelation 4–8 — a door opened in heaven. Through it: a sea of glass like crystal; a throne of light
// with an emerald rainbow round about; four living creatures as wings of light; twenty-four elders as a
// ring of crowned lights; a Lamb as it had been slain, worshipped. The sixth seal: the sun black, the
// moon as blood, the stars falling. The seventh: silence.

import * as THREE from "three";

import { cameraRig, glowSprite, pulse, sramp } from "../kit/common.js";
import { weather } from "../kit/effects.js";
import { createStars } from "../engine/stars.js";

function wingsOfLight(color) {
  const g = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uShow: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uShow, uTime;
      varying vec2 vUv;
      void main() {
        float shape = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.45 - 0.4 * vUv.x, vUv.y);
        float eyes = 0.6 + 0.4 * step(0.82, fract(vUv.x * 9.0 + vUv.y * 5.0 + uTime * 0.2));
        float a = shape * eyes * (1.0 - smoothstep(0.75, 1.0, vUv.x)) * uShow * 0.45;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vec3(${color.join(", ")}) * a * 1.8, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  for (let i = 0; i < 6; i++) {
    const geo = new THREE.PlaneGeometry(1, 1, 12, 2);
    geo.translate(0.5, 0.5, 0);
    const p = geo.attributes.position;
    for (let k = 0; k < p.count; k++) p.setXYZ(k, p.getX(k) * 10, (p.getY(k) - 0.5) * 3 * (1 - 0.5 * p.getX(k)), -(p.getX(k) ** 2) * 3);
    const w = new THREE.Mesh(geo, mat);
    w.rotation.set(0, i % 2 ? Math.PI : 0, (Math.floor(i / 2) - 1) * 0.8);
    g.add(w);
  }
  return { group: g, mat };
}

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020204);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 6000);
  const stars = createStars({ count: ctx.quality === "low" ? 9000 : 22000, radius: 2500, seed: 391, size: 2.4 });
  scene.add(stars);
  // the door opened in heaven
  const door = new THREE.Mesh(new THREE.PlaneGeometry(40, 70), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.4), transparent: true, opacity: 0 }));
  door.position.set(0, 35, -300);
  scene.add(door);
  // the sea of glass
  const sea = new THREE.Mesh(new THREE.CircleGeometry(600, 96), new THREE.MeshStandardMaterial({ color: 0x5a7080, metalness: 0.8, roughness: 0.12, transparent: true, opacity: 0.8 }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0, -900);
  scene.add(sea);
  scene.add(new THREE.HemisphereLight(0xd8e6ff, 0x101018, 1.2));
  // the throne: light, with an emerald rainbow round about
  const throne = glowSprite(0xfff8ea, 170, 0);
  throne.position.set(0, 120, -1100);
  scene.add(throne);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(150, 6, 16, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 2.2, 0.9), transparent: true, opacity: 0 }));
  bow.position.copy(throne.position);
  scene.add(bow);
  const light = new THREE.PointLight(0xfff0d8, 0, 2000, 0.6);
  light.position.copy(throne.position);
  scene.add(light);
  // four living creatures
  const creatures = [[-160, 80, -1000], [160, 80, -1000], [-120, 190, -1060], [120, 190, -1060]].map((p, i) => {
    const c = wingsOfLight(i % 2 ? [1, 0.85, 0.6] : [0.85, 0.9, 1]);
    c.group.position.set(...p);
    c.group.scale.setScalar(4);
    c.group.lookAt(0, 80, 0);
    scene.add(c.group);
    return c;
  });
  // twenty-four elders: a ring of crowned lights
  const elders = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const e = glowSprite(0xffd890, 18, 0);
    e.position.set(Math.cos(a) * 330, 30 + Math.sin(a * 2) * 6, -1100 + Math.sin(a) * 330);
    scene.add(e);
    elders.push(e);
  }
  const lamb = glowSprite(0xffffff, 40, 0);
  lamb.position.set(0, 40, -960);
  scene.add(lamb);
  // the sixth seal
  const sun = new THREE.Mesh(new THREE.CircleGeometry(80, 64), new THREE.MeshBasicMaterial({ color: 0x050403, transparent: true, opacity: 0 }));
  sun.position.set(-500, 600, -2400);
  scene.add(sun);
  const corona = glowSprite(0xffa040, 420, 0);
  corona.position.copy(sun.position).add(new THREE.Vector3(0, 0, -10));
  scene.add(corona);
  const moon = glowSprite(0xb01810, 160, 0);
  moon.position.set(600, 420, -2300);
  scene.add(moon);
  const falling = weather("snowstars", { count: 5000, box: [800, 600, 800] });
  scene.add(falling.points);

  const rig = cameraRig([
    [0, [0, 30, 200], [0, 35, -300], 50],
    [5, [0, 40, -280], [0, 60, -1100], 56],
    [10, [0, 60, -620], [0, 110, -1100], 60],
    [14, [0, 50, -760], [0, 60, -1000], 56],
    [18, [0, 120, -700], [0, 400, -2300], 64],
    [26, [0, 90, -760], [0, 120, -1100], 56],
  ]);
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      rig.apply(camera, rel, time, reducedMotion ? 0 : 0.6);
      stars.position.copy(camera.position);
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      door.material.opacity = pulse(rel, 0.5, 2, 5, 6);
      const glory = sramp(rel, 4, 8) * (1 - 0.85 * pulse(rel, 18, 19, 21.5, 22)) * (1 - 0.8 * sramp(rel, 22, 23.5));
      throne.material.opacity = glory * 0.7;
      light.intensity = glory * 120;
      bow.material.opacity = sramp(rel, 5.5, 8) * glory;
      bow.rotation.z = time * 0.03;
      creatures.forEach((c) => { c.mat.uniforms.uShow.value = sramp(rel, 9, 11) * glory; c.mat.uniforms.uTime.value = time; });
      elders.forEach((e, i) => { e.material.opacity = sramp(rel, 10 + i * 0.05, 11 + i * 0.05) * glory * 0.8; });
      lamb.material.opacity = pulse(rel, 13.5, 15, 17.5, 18.5);
      const seal = pulse(rel, 18, 19, 21.5, 22.2);
      sun.material.opacity = seal;
      corona.material.opacity = seal * 0.6;
      moon.material.opacity = seal * 0.8;
      falling.update({ time, pixelRatio, amount: seal, center: camera.position });
      const silence = sramp(rel, 22, 23.5);
      return {
        grade: { bloom: 0.55, threshold: 0.8, saturation: 1 - 0.6 * silence, exposure: 0.9 - 0.45 * silence },
        audio: { drone: 0.4 * (1 - silence), shimmer: 0.6 * glory * (1 - silence), wind: 0.1 * (1 - silence) },
      };
    },
  };
}
