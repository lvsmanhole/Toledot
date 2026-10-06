// Isaiah 6 — the throne vision. A towering space with no visible end; columns lost in smoke; light
// high and lifted up; the train filling the temple as a fall of light down the steps; seraphim suggested
// only as moving wings of light. Holy, holy, holy.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../kit/common.js";
import { lightShaft, smoke } from "../kit/effects.js";
import { colonnade } from "../kit/structures.js";
import { cameraRig } from "../kit/common.js";

function seraph(scale = 1) {
  // six wings (Isaiah 6:2): two covering the face, two the feet, two flying
  const group = new THREE.Group();
  const mat = new THREE.ShaderMaterial({
    uniforms: { uShow: { value: 0 }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uShow, uTime;
      varying vec2 vUv;
      void main() {
        float shape = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.5 - 0.45 * vUv.x, vUv.y);
        float feathers = 0.55 + 0.45 * pow(abs(sin(vUv.y * 20.0 + vUv.x * 3.0 + uTime)), 3.0);
        float a = shape * feathers * (1.0 - smoothstep(0.7, 1.0, vUv.x)) * uShow * 0.5;
        if (a < 0.004) discard;
        gl_FragColor = vec4(mix(vec3(1.0, 0.7, 0.35), vec3(1.0, 0.96, 0.88), vUv.x) * a * 1.8, a);
      }
    `,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const wings = [];
  for (const [side, tilt] of [[1, 0.6], [-1, 0.6], [1, -0.2], [-1, -0.2], [1, -1.2], [-1, -1.2]]) {
    const geo = new THREE.PlaneGeometry(1, 1, 16, 2);
    geo.translate(0.5, 0.5, 0);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      p.setXYZ(i, x * 9, (y - 0.5) * 3 * (1 - 0.5 * x), -x * x * 3);
    }
    const w = new THREE.Mesh(geo, mat);
    const pivot = new THREE.Group();
    pivot.add(w);
    pivot.userData = { side, tilt };
    group.add(pivot);
    wings.push(pivot);
  }
  const core = glowSpriteFor(0xfff0d0, 6);
  group.add(core);
  group.scale.setScalar(scale);
  return {
    group,
    set(show, time, phase) {
      mat.uniforms.uShow.value = show;
      mat.uniforms.uTime.value = time;
      core.material.opacity = show * 0.7;
      group.visible = show > 0.01;
      const beat = Math.sin(time * 1.6 + phase) * 0.18;
      for (const w of wings) {
        const { side, tilt } = w.userData;
        w.rotation.set(0, side > 0 ? 0 : Math.PI, tilt + (Math.abs(tilt) < 0.5 ? beat : 0));
      }
    },
  };
}

function glowSpriteFor(color, scale) {
  const s = glowSprite(color, scale, 0);
  return s;
}

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050403);
  scene.fog = new THREE.FogExp2(0x0d0a07, 0.008);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 3000);
  const rig = cameraRig([
    [0, [0, 6, 160], [0, 20, 0], 50],
    [6, [0, 8, 90], [0, 60, -40], 58],
    [11, [0, 14, 50], [0, 90, -60], 62],
    [16, [0, 30, 30], [0, 120, -80], 64],
  ]);
  scene.add(new THREE.HemisphereLight(0x8a7a60, 0x1a1208, 0.6));
  for (const x of [-30, 30]) {
    const c = colonnade({ count: 10, spacing: 22, height: 70, radius: 3.4, rows: 1, rowGap: 0, material: "limestone", roof: false });
    c.rotation.y = Math.PI / 2;
    c.position.set(x, 0, 30);
    scene.add(c);
  }
  // steps rising to the light
  const steps = new THREE.Group();
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(60 - i * 1.5, 1.2, 4), new THREE.MeshStandardMaterial({ color: 0xbfb294, roughness: 0.9 }));
    s.position.set(0, i * 1.2, -i * 4);
    steps.add(s);
  }
  scene.add(steps);
  const throne = glowSprite(0xfff6e0, 120, 0);
  throne.position.set(0, 110, -110);
  scene.add(throne);
  const train = lightShaft({ length: 140, top: 22, bottom: 44, color: [1, 0.92, 0.78], gain: 0.6 });
  train.rotation.x = Math.PI - 0.5;
  train.position.set(0, 110, -110);
  scene.add(train);
  const fill = smoke({ rise: 120, spread: 70, color: [0.5, 0.45, 0.38], opacity: 0.25, size: 220, count: 1400 });
  fill.position.set(0, 0, -30);
  scene.add(fill);
  const seraphim = [[-34, 92, -80, 0], [34, 92, -80, 1.4], [-60, 70, -50, 2.1], [60, 70, -50, 3.3]].map(([x, y, z, ph]) => {
    const s = seraph(1.2);
    s.group.position.set(x, y, z);
    s.group.lookAt(0, 90, 120);
    scene.add(s.group);
    return { s, ph };
  });
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      rig.apply(camera, rel, time, reducedMotion ? 0 : 0.6);
      const vision = sramp(rel, 0.5, 4);
      throne.material.opacity = vision * 0.95;
      train.material.uniforms.uAmount.value = vision;
      train.material.uniforms.uTime.value = time;
      fill.material.uniforms.uTime.value = time;
      fill.material.uniforms.uAmount.value = 0.4 + 0.6 * sramp(rel, 5, 10);
      fill.material.uniforms.uPixelRatio.value = pixelRatio;
      for (const { s, ph } of seraphim) s.set(sramp(rel, 3 + ph * 0.3, 6 + ph * 0.3), time, ph);
      return {
        grade: { bloom: 0.9, threshold: 0.5, exposure: 1 + 0.25 * pulse(rel, 6, 7, 10, 11), saturation: 0.85, tint: [1.05, 1, 0.92] },
        audio: { drone: 0.5, shimmer: 0.4 + 0.5 * pulse(rel, 6, 7, 10.5, 11.5), wind: 0.05 },
      };
    },
  };
}
