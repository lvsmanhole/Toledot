// Revelation 6:9–11, through John's eyes. The fifth seal: a golden altar before the throne (whose light is far
// behind it), and under the altar the souls of them that were slain for the word of God, a great company of
// pale figures in its glow. They cry with a loud voice, "How long, O Lord?" (their light rises). White robes
// are given unto every one of them, a wave of brightness passing over them all; and they are told to rest yet
// for a little season: they kneel, and the light settles into stillness.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../../kit/common.js";
import { scaled } from "../../kit/budget.js";
import { crowd } from "../../kit/figures.js";
import { flame, weather } from "../../kit/effects.js";
import { MATERIALS } from "../../kit/structures.js";
import { createStars } from "../../engine/stars.js";
import { EYE, johnEyes } from "../kit/eyes.js";

const TOP = 10; // the altar's top, raised high on its four pillars so the souls are under it
const JOHN_Z = 34;

export function create(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x0a0c14, 0.006);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 6000);
  scene.add(camera);
  const stars = createStars({ count: ctx.quality === "low" ? 6000 : 16000, radius: 2500, seed: 609, size: 2.2 });
  scene.add(stars);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x141018, 0.6));
  // the floor of heaven, a dim glassy gold
  const floor = new THREE.Mesh(new THREE.CircleGeometry(120, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3428, metalness: 0.8, roughness: 0.25 }));
  scene.add(floor);
  // the throne's light, far behind the altar
  const throne = glowSprite(0xfff8f0, 60, 0.5);
  throne.position.set(0, 40, -140);
  scene.add(throne);

  // the golden altar: a top with a horn at each corner, on four pillars
  const altar = new THREE.Group();
  const gold = MATERIALS.gold();
  const box = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), gold); m.position.set(x, y, z); altar.add(m); };
  box(26, 1.6, 12, 0, TOP + 0.8, 0);
  box(27, 0.4, 13, 0, TOP, 0);
  for (const x of [-12, 12]) for (const z of [-5, 5]) {
    box(1.4, TOP, 1.4, x, TOP / 2, z);
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.8, 12), gold);
    horn.position.set(x, TOP + 2.5, z);
    altar.add(horn);
  }
  scene.add(altar);
  const fire = flame({ width: 14, height: 5, gain: 0.9, seed: 6 });
  fire.position.set(0, TOP + 1.6, 0);
  scene.add(fire);
  const glow = new THREE.PointLight(0xffd8a0, 60, 60, 1.4);
  glow.position.set(0, TOP - 2, 0);
  scene.add(glow);
  const under = glowSprite(0xffe2b0, 14, 0.2);
  under.position.set(0, 3, 0);
  scene.add(under);

  // the souls under the altar
  const souls = new THREE.MeshStandardMaterial({ color: 0x7c8494, roughness: 0.9, emissive: 0x1a1e28, transparent: true, opacity: 0.85 });
  const company = crowd({
    count: scaled(700, 120), seed: 69, material: souls, face: [0, JOHN_Z], staffChance: 0,
    place: (r) => { const x = (r() - 0.5) * 24; const z = (r() - 0.5) * 11; return [x, z]; },
  });
  scene.add(company.group);
  const pale = new THREE.Color(0x7c8494);
  const white = new THREE.Color(0xfffaf0);
  const paleGlow = new THREE.Color(0x1a1e28);
  const whiteGlow = new THREE.Color(0x8a8270);
  // the gift of white robes passes over them as a wave of light, front to back
  const wave = glowSprite(0xffffff, 16, 0);
  scene.add(wave);
  // the cry rises
  const cry = weather("snowstars", { count: ctx.quality === "low" ? 500 : 1200, box: [26, 30, 12] });
  scene.add(cry.points);

  const E = [0, EYE, JOHN_Z];
  const eyes = johnEyes([
    [0, E, [0, TOP + 2, 0], 50],
    [2.5, E, [0, TOP + 1, 0], 44],
    [5, E, [0, 2, 0], 40],
    [7, E, [0, 2.5, 0], 36],
    [10, E, [0, 9, -2], 46],
    [12.5, E, [0, 2, 2], 40],
    [15, E, [-6, 1.8, 0], 34],
    [18, E, [6, 1.8, 0], 34],
    [20, E, [0, 1.5, 0], 44],
    [23, E, [0, 3, 0], 50],
    [26, E, [0, 6, -10], 54],
  ]);

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      stars.position.copy(camera.position);
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      fire.material.uniforms.uTime.value = time;
      const seen = sramp(rel, 1, 3.5);
      const howLong = pulse(rel, 6.5, 7.5, 11, 12.5);
      const robes = sramp(rel, 12.5, 16.5);
      const rest = sramp(rel, 16.5, 20);
      souls.color.copy(pale).lerp(white, robes);
      souls.emissive.copy(paleGlow).lerp(whiteGlow, robes * (1 - 0.4 * rest));
      souls.opacity = lerp(0.85, 1, robes) * seen;
      company.group.scale.y = 1 + 0.03 * howLong - 0.25 * rest; // they lift up, then kneel to rest
      wave.position.set(0, 3, lerp(8, -8, sramp(rel, 12.5, 16.5)));
      wave.material.opacity = pulse(rel, 12.5, 13.5, 15.5, 16.8) * 0.8;
      glow.intensity = 22 * (1 + 0.6 * howLong) * (1 - 0.35 * rest);
      under.material.opacity = 0.18 * seen * (1 + howLong) * (1 - 0.4 * rest);
      cry.update({ time, pixelRatio, amount: howLong, center: new THREE.Vector3(0, 12, 0) });
      return {
        grade: { bloom: 0.6 + 0.2 * howLong, threshold: 0.78, exposure: 0.9 + 0.1 * robes, tint: [1, 1, 1.03], saturation: 1 - 0.15 * rest },
        audio: {
          drone: 0.35 * (1 - 0.5 * rest), shimmer: 0.3 + 0.4 * robes * (1 - 0.6 * rest), fire: 0.2,
          waters: 0.8 * howLong,
        },
      };
    },
  };
}
