// Daniel 5–7 — visions and the fall of Babylon. Night visions: thrones, and one Ancient of days on a
// throne of fiery flame with wheels of burning fire, majestic rather than monstrous; one like the Son of
// man coming with the clouds. Then Belshazzar's hall and the writing on the wall; then the den of lions,
// still, and a man standing unharmed in a shaft of light.

import * as THREE from "three";

import { cameraRig, glowSprite, pulse, sramp, textSprite } from "../kit/common.js";
import { flame, lightShaft, smoke } from "../kit/effects.js";
import { ANIMALS, figure } from "../kit/figures.js";
import { colonnade } from "../kit/structures.js";

function fireWheel(radius) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, radius * 0.06, 8, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.2, 0.35) }));
  const spokes = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(radius * 2, radius * 0.04, radius * 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 0.9, 0.3) }));
    s.rotation.z = (i / 8) * Math.PI;
    spokes.add(s);
  }
  const g = new THREE.Group();
  g.add(ring, spokes);
  return g;
}

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030305);
  scene.fog = new THREE.FogExp2(0x070608, 0.006);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 3000);
  scene.add(new THREE.HemisphereLight(0x6a6a80, 0x1a1410, 0.5));

  // the vision: a throne of fire above clouds (0–11)
  const vision = new THREE.Group();
  scene.add(vision);
  const clouds = smoke({ rise: 20, spread: 160, color: [0.35, 0.35, 0.4], opacity: 0.18, size: 260, count: 1200, seed: 11 });
  clouds.position.set(0, -24, -150);
  vision.add(clouds);
  const throne = glowSprite(0xffffff, 60, 0);
  throne.position.set(0, 40, -160);
  vision.add(throne);
  const fireThrone = [0, 1, 2, 3, 4].map((i) => {
    const f = flame({ width: 26, height: 30, gain: 0.9, seed: i * 2 });
    f.position.set((i - 2) * 14, 10, -150);
    vision.add(f);
    return f;
  });
  const wheels = [-40, 40].map((x) => {
    const w = fireWheel(14);
    w.position.set(x, 18, -150);
    vision.add(w);
    return w;
  });
  const sonOfMan = glowSprite(0xfff2d8, 14, 0);
  vision.add(sonOfMan);

  // Belshazzar's hall (11.5–15): lamps, a plaster wall, the writing
  const hall = new THREE.Group();
  hall.position.set(0, 0, -600);
  scene.add(hall);
  const cols = colonnade({ count: 8, spacing: 8, height: 16, radius: 1.2, rows: 2, rowGap: 30, material: "sandstone" });
  hall.add(cols);
  const plaster = new THREE.Mesh(new THREE.PlaneGeometry(70, 20), new THREE.MeshStandardMaterial({ color: 0xd8cdb6, roughness: 1 }));
  plaster.position.set(0, 10, -18);
  hall.add(plaster);
  const writing = textSprite("מנא מנא תקל ופרסין", { size: 90, scale: 4.5, color: "#ffd88a", font: "Noto Serif Hebrew", letterSpacing: 0 });
  writing.position.set(0, 12, -17.5);
  writing.material.opacity = 0;
  hall.add(writing);
  const hallLight = new THREE.PointLight(0xffb060, 80, 80, 1.5);
  hallLight.position.set(0, 10, 0);
  hall.add(hallLight);

  // the den of lions (15.5–22)
  const den = new THREE.Group();
  den.position.set(0, 0, -1100);
  scene.add(den);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 32), new THREE.MeshStandardMaterial({ color: 0x3a3028, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  den.add(floor);
  const pit = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 30, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a221c, roughness: 1, side: THREE.BackSide }));
  pit.position.y = 15;
  den.add(pit);
  const lionGeo = ANIMALS.lion();
  const lionMat = new THREE.MeshStandardMaterial({ color: 0x1a140e, roughness: 1 });
  for (let i = 0; i < 7; i++) {
    const lion = new THREE.Mesh(lionGeo, lionMat);
    const a = (i / 7) * 6.283;
    lion.position.set(Math.cos(a) * 12, 0, Math.sin(a) * 12);
    lion.lookAt(0, 0, 0);
    lion.rotateY(-Math.PI / 2);
    lion.scale.setScalar(1.6);
    den.add(lion);
  }
  const daniel = figure(1.8);
  den.add(daniel);
  const ray = lightShaft({ length: 60, top: 3, bottom: 5, color: [1, 0.95, 0.85], gain: 0.8 });
  ray.rotation.x = Math.PI;
  ray.position.set(0, 60, 0);
  den.add(ray);
  const denLight = new THREE.PointLight(0xfff0d0, 120, 40, 1.4);
  denLight.position.set(0, 10, 0);
  den.add(denLight);

  const rig = cameraRig([
    [0, [0, 20, 60], [0, 30, -150], 50],
    [6, [0, 24, 20], [0, 26, -150], 52],
    [10.8, [0, 28, -40], [0, 30, -150], 50],
    [11.2, [0, 10, -560], [0, 11, -617], 46],
    [15, [0, 11, -578], [0, 12, -617], 40],
    [15.4, [24, 16, -1080], [0, 1.5, -1100], 48],
    [22, [10, 6, -1088], [0, 1.6, -1100], 42],
  ]);

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      rig.apply(camera, rel, time, reducedMotion ? 0 : 0.5);
      const v = pulse(rel, 0, 1.5, 10, 11);
      throne.material.opacity = v * 0.95;
      fireThrone.forEach((f) => { f.material.uniforms.uAmount.value = v; f.material.uniforms.uTime.value = time; });
      wheels.forEach((w, i) => { w.rotation.z = time * (i ? -0.5 : 0.5); w.visible = v > 0.01; });
      clouds.material.uniforms.uTime.value = time;
      clouds.material.uniforms.uAmount.value = v;
      clouds.material.uniforms.uPixelRatio.value = pixelRatio;
      // one like the Son of man comes with the clouds to the Ancient of days
      const come = sramp(rel, 6.5, 10.5);
      sonOfMan.position.set(0, 10 + come * 26, -20 - come * 130);
      sonOfMan.material.opacity = pulse(rel, 6.5, 7.5, 10, 11) * 0.9;
      writing.material.opacity = pulse(rel, 12, 13, 15, 15.4);
      ray.material.uniforms.uAmount.value = sramp(rel, 16, 18);
      ray.material.uniforms.uTime.value = time;
      return {
        grade: { bloom: 0.8, threshold: 0.55, saturation: rel < 11 ? 0.9 : 0.8, exposure: 1 },
        audio: { drone: 0.45, shimmer: 0.5 * pulse(rel, 1, 3, 9, 11) + 0.3 * pulse(rel, 16, 18, 21, 22), fire: 0.4 * v },
      };
    },
  };
}
