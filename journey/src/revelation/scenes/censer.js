// Revelation 8:1–6, through John's eyes, in the throne room. The seventh seal is opened, and there is silence
// in heaven about the space of half an hour: no sound at all, the wings and the lamps almost still, no words
// for a long stretch. The seven angels which stood before God are given seven trumpets. Another angel stands
// at the golden altar with a golden censer; much incense is given him, and the smoke of it rises with the
// prayers of the saints before God. He fills the censer with fire of the altar and casts it into the earth:
// voices, thunderings, lightnings and an earthquake. The seven angels turn and prepare themselves to sound.

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../../kit/common.js";
import { flame, smoke } from "../../kit/effects.js";
import { MATERIALS } from "../../kit/structures.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { DAIS, JOHN_Z, heavenRoom } from "../kit/heaven.js";

const ALTAR = [0, 0, 15]; // the golden altar which was before the throne

/** A gold trumpet along +z, its mouthpiece at the origin. */
function trumpet() {
  const pts = [[0.012, 0], [0.016, 0.05], [0.016, 1.0], [0.03, 1.15], [0.08, 1.28], [0.15, 1.34]].map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, 14);
  geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, MATERIALS.gold());
  m.material.side = THREE.DoubleSide;
  return m;
}

/** A golden censer hanging on three chains from its origin (the angel's hand). */
function censerOnChains() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const bowl = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.16, 0.02], [0.22, 0.12], [0.2, 0.2]].map(([r, y]) => new THREE.Vector2(r, y)), 18), gold);
  bowl.position.y = -0.95;
  bowl.material.side = THREE.DoubleSide;
  g.add(bowl);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.8, 4), gold);
    chain.position.set(Math.cos(a) * 0.1, -0.38, Math.sin(a) * 0.1);
    chain.rotation.set(Math.sin(a) * 0.24, 0, -Math.cos(a) * 0.24);
    g.add(chain);
  }
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 6, 12), gold));
  return { group: g, bowl };
}

/** The golden altar with a horn at each corner and fire upon it. */
function goldenAltar() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 1.4), gold);
  body.position.y = 0.65;
  g.add(body);
  for (const [x, z] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.26, 8), gold);
    horn.position.set(x, 1.43, z);
    g.add(horn);
  }
  const fire = flame({ width: 1, height: 1.3, gain: 1.2, seed: 7 });
  fire.position.y = 1.3;
  g.add(fire);
  return { group: g, fire };
}

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, elders, beasts } = H;
  const E = [0, EYE, JOHN_Z];

  // the seven angels which stood before God, in an arc before the throne, facing it; on a small device three
  // are the model and four are figures of light
  const full = ctx.quality !== "low";
  const seven = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 6 - 0.5) * 1.5;
    const at = new THREE.Group();
    at.position.set(Math.sin(a) * 11, 0, Math.cos(a) * 11);
    const faceIn = Math.atan2(-at.position.x, -at.position.z);
    const faceOut = Math.atan2(at.position.x, at.position.z);
    if (full || i % 3 === 0) {
      at.add(cast("angel", 3.4));
    } else {
      const body = glowSprite(0xffe2b8, 1, 0.55);
      body.scale.set(1.3, 3.4, 1);
      body.position.y = 1.7;
      const face = glowSprite(0xfff4e0, 0.7, 0.9);
      face.position.y = 3.1;
      at.add(body, face);
    }
    const horn = trumpet();
    at.add(horn);
    scene.add(at);
    return { at, horn, faceIn, faceOut };
  });
  // another angel at the altar, with a golden censer (8:3)
  const altar = goldenAltar();
  altar.group.position.set(...ALTAR);
  scene.add(altar.group);
  const priest = new THREE.Group();
  priest.position.set(ALTAR[0] + 2.4, 0, ALTAR[2]);
  priest.rotation.y = -Math.PI / 2; // facing the altar
  priest.add(cast("angel", 3.4));
  scene.add(priest);
  const censer = censerOnChains();
  const hand = new THREE.Vector3(ALTAR[0] + 1.75, 1.95, ALTAR[2] - 0.3); // his right hand
  censer.group.position.copy(hand);
  scene.add(censer.group);
  const ember = glowSprite(0xff8a3a, 0.9, 0);
  scene.add(ember);
  const falling = flame({ width: 1.2, height: 2.2, gain: 1.6, seed: 3 });
  scene.add(falling);
  // the smoke of the incense, with the prayers of the saints, ascending before God (8:4)
  const incense = smoke({ count: 700, rise: 26, spread: 0.7, lean: [0, -0.55], color: [0.95, 0.9, 0.8], opacity: 0.32, size: 6, seed: 8, lit: true });
  scene.add(incense);
  // the seventh seal opening: a ring of light at the throne
  const seal = glowSprite(0xfff0d0, 6, 0);
  seal.position.set(0, DAIS + 2.6, 2);
  scene.add(seal);

  const bowlAt = new THREE.Vector3();
  const throwTo = new THREE.Vector3(5, -70, 40);
  // the earth far below the sea of glass, where the fire lands
  const earth = new THREE.Mesh(new THREE.CircleGeometry(900, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x3a3226, roughness: 1 }));
  earth.position.y = throwTo.y;
  const strike = glowSprite(0xff7a2a, 12, 0);
  strike.position.copy(throwTo).add(new THREE.Vector3(0, 6, 0));
  const strikeLight = new THREE.PointLight(0xff8a40, 0, 400, 1.2);
  strikeLight.position.copy(strike.position);
  scene.add(earth, strike, strikeLight);
  const eyes = johnEyes([
    [0, E, [0, DAIS + 2.5, 0], 50],
    [4, E, [0, DAIS + 2.5, 0], 46],
    [20, E, [0, DAIS + 2.2, 0], 48],
    [21.5, E, [-6, 2.4, 9], 58],
    [24, E, [6, 2.4, 9], 58],
    [25.5, E, [1.2, 1.6, ALTAR[2]], 34],
    [30, E, [1.2, 1.6, ALTAR[2]], 32],
    [31, E, [0, 10, 4], 46],
    [34, E, [0, 22, -6], 52],
    [35, E, [1.2, 1.4, ALTAR[2]], 34],
    [36.5, E, [3, 0, 24], 44],
    [38.5, E, [5, -70, 40], 50],
    [40, E, [0, 3, 6], 60],
    [44.5, E, [0, 3, 8], 58],
    [46, E, [0, 3, 8], 58],
  ], { falls: [] });

  let clock = 0;
  let last = null;
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      // silence in heaven about the space of half an hour (8:1): sound off, and everything all but still
      const silence = pulse(rel, 4, 5.5, 19.5, 21);
      const dt = last === null ? 0 : Math.min(0.1, Math.max(0, time - last));
      last = time;
      clock += dt * (1 - 0.97 * silence);
      eyes.apply(camera, rel, clock, reducedMotion || silence > 0.5);
      const flash = pulse(rel, 38.4, 38.6, 38.8, 39.2) + pulse(rel, 39.4, 39.5, 39.6, 40) * 0.8 + pulse(rel, 37.9, 38, 38.1, 38.4) * 0.5;
      H.tick({ time: clock, pixelRatio, show: 1, rainbow: 1, lampsOn: 1, lightning: reducedMotion ? flash * 0.3 : flash });
      seal.material.opacity = pulse(rel, 1, 2, 3, 5) * 0.9;
      // the seven trumpets given (8:2), then raised as they prepare to sound (8:6)
      const given = sramp(rel, 21, 23.5);
      const ready = sramp(rel, 40, 42.5);
      for (const [i, s] of seven.entries()) {
        s.at.rotation.y = s.faceIn + (s.faceOut - s.faceIn) * ready;
        s.horn.visible = given > 0.01;
        s.horn.position.set(-0.5 + 0.35 * ready, 1.85 + 1.05 * ready + 5 * (1 - given), 0.35 + 0.2 * ready);
        s.horn.rotation.x = -0.5 * ready + 0.9 * (1 - ready);
        s.at.position.y = 0.05 * Math.sin(clock * 0.9 + i);
      }
      // the censer: swung at the altar, filled with fire, cast into the earth (8:3–5)
      const fill = sramp(rel, 35, 36);
      const thrown = sramp(rel, 36.3, 38.6);
      censer.group.position.lerpVectors(hand, throwTo, thrown * thrown);
      censer.group.position.y += Math.sin(thrown * Math.PI) * 6;
      censer.group.rotation.z = (1 - thrown) * 0.12 * Math.sin(clock * 1.6) + thrown * 4;
      censer.group.visible = thrown < 0.98;
      censer.bowl.getWorldPosition(bowlAt);
      incense.position.copy(bowlAt);
      incense.material.uniforms.uTime.value = clock;
      incense.material.uniforms.uPixelRatio.value = pixelRatio;
      incense.material.uniforms.uAmount.value = sramp(rel, 25.5, 28) * (1 - sramp(rel, 34.5, 36));
      incense.visible = incense.material.uniforms.uAmount.value > 0.01;
      ember.position.copy(bowlAt);
      ember.material.opacity = fill * 0.95;
      falling.position.copy(bowlAt);
      falling.material.uniforms.uTime.value = clock;
      falling.material.uniforms.uAmount.value = fill * (1 - sramp(rel, 38.4, 38.8));
      falling.visible = fill > 0.01 && rel < 38.8;
      altar.fire.material.uniforms.uTime.value = clock;
      const landed = pulse(rel, 38.4, 38.8, 41, 44);
      earth.visible = rel > 36 && rel < 41.5;
      strike.material.opacity = landed;
      strikeLight.intensity = landed * 1.5e3;
      // the sea of glass clears so the fire is seen falling to the earth
      H.sea.material.opacity = 0.86 * (1 - 0.9 * pulse(rel, 36.5, 37.3, 40, 41));
      // the earthquake (8:5)
      const quake = reducedMotion ? 0 : pulse(rel, 38.4, 38.7, 40, 41);
      camera.position.x += Math.sin(time * 37) * 0.25 * quake;
      camera.position.y += Math.sin(time * 43) * 0.18 * quake;
      elders.forEach(({ body }) => { body.rotation.x = 0.15 * ready; });
      beasts.forEach(({ group }) => { group.rotation.x = 0; });
      const sound = 1 - silence;
      return {
        grade: { bloom: 0.6 + 0.4 * flash, threshold: 0.78, exposure: 0.95 - 0.08 * silence + 0.3 * flash, tint: [1, 1, 1.02], saturation: 1 - 0.15 * silence },
        audio: {
          drone: 0.35 * sound, shimmer: 0.5 * sound,
          fire: 0.5 * pulse(rel, 34.8, 35.5, 38.4, 39) * sound,
          thunder: Math.min(1, 1.2 * flash + 0.6 * quake) * sound,
          trumpet: 0.3 * pulse(rel, 42.5, 43.5, 45, 46) * sound,
        },
      };
    },
  };
}
