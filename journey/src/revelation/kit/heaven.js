// The throne room of Revelation 4–5, shared by the scenes set in it. The throne stands on a dais at the
// origin; the One who sits on it is never given a form, only light "like a jasper and a sardine stone", in
// an emerald rainbow (4:3). Round about: twenty-four seats with twenty-four elders in white, crowned with gold
// (4:4); before it seven lamps of fire (4:5) and a sea of glass like crystal (4:6); in the midst and round
// about, four beasts full of eyes with six wings each (4:6–8). John stands on the sea of glass at JOHN_Z.

import * as THREE from "three";

import { glowSprite } from "../../kit/common.js";
import { flame } from "../../kit/effects.js";
import { MATERIALS } from "../../kit/structures.js";
import { createStars } from "../../engine/stars.js";
import { cast } from "./cast.js";

export const JOHN_Z = 32; // where John stands, on the sea of glass, facing the throne (-z)
export const DAIS = 3; // the height of the dais the throne stands on
export const ELDER_R = 15;
export const BEAST_R = 6.5;

/** The elders' places: round about the throne (angle 0 is behind it), leaving the side toward John open. */
export function elderAngle(i) {
  return -Math.PI * 0.8 + (i / 23) * Math.PI * 1.6;
}

export function heavenRoom(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);
  scene.fog = new THREE.FogExp2(0x0a0c14, 0.004);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 6000);
  scene.add(camera);
  const stars = createStars({ count: ctx.quality === "low" ? 8000 : 20000, radius: 2500, seed: 404, size: 2.2 });
  scene.add(stars);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x141018, 0.9));

  // the sea of glass like unto crystal, before the throne
  const sea = new THREE.Mesh(new THREE.CircleGeometry(70, 96), new THREE.MeshStandardMaterial({ color: 0x9fb8c8, metalness: 0.9, roughness: 0.06, transparent: true, opacity: 0.86, emissive: 0x0a141c }));
  sea.rotation.x = -Math.PI / 2;
  sea.position.set(0, 0, 30);
  scene.add(sea);
  // the dais and the throne
  const dais = new THREE.Mesh(new THREE.CylinderGeometry(9, 10, DAIS, 48), new THREE.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.35, metalness: 0.1 }));
  dais.position.y = DAIS / 2;
  scene.add(dais);
  const throne = cast("elderSeat", 5.5);
  throne.position.set(0, DAIS, -1);
  throne.rotation.y = Math.PI; // its seat toward John
  // the throne's stone is darker and warmer than the elders' seats, so the light on it reads as light
  throne.traverse((m) => { if (m.isMesh) { m.material = m.material.clone(); m.material.color.multiplyScalar(0.45); } });
  scene.add(throne);
  // he that sat: light only, jasper (clear, white-green) and sardine (red) (4:3)
  const glory = glowSprite(0xfff8f0, 11, 0);
  glory.position.set(0, DAIS + 2.6, 0.4);
  const sardine = glowSprite(0xff5a3a, 7, 0);
  sardine.position.copy(glory.position);
  const jasper = glowSprite(0xd8ffe8, 16, 0);
  jasper.position.copy(glory.position);
  for (const g of [jasper, sardine, glory]) { g.material.depthTest = false; g.renderOrder = 3; }
  scene.add(jasper, sardine, glory);
  const light = new THREE.PointLight(0xfff0e0, 0, 160, 1.2);
  light.position.set(0, DAIS + 9, 8);
  scene.add(light);
  // a rainbow round about the throne, in sight like unto an emerald
  const bow = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.35, 16, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 2.0, 0.85), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  bow.position.copy(glory.position);
  scene.add(bow);
  // the seven lamps of fire burning before the throne
  const lamps = [];
  for (let i = 0; i < 7; i++) {
    const f = flame({ width: 0.7, height: 1.8, gain: 1.4, seed: i * 3 });
    f.position.set(-6 + i * 2, DAIS, 7.5);
    scene.add(f);
    lamps.push(f);
  }
  // the twenty-four seats and elders
  const elders = [];
  for (let i = 0; i < 24; i++) {
    const a = elderAngle(i);
    const g = new THREE.Group();
    g.position.set(Math.sin(a) * ELDER_R, 0, -Math.cos(a) * ELDER_R + 4);
    g.lookAt(0, 0, 0);
    const seat = cast("elderSeat", 1.6);
    seat.rotation.y = Math.PI;
    const body = new THREE.Group(); // the elder bows by tipping this forward about his seat
    const elder = cast(["elder", "elderB", "elderC"][i % 3], 1.55);
    elder.position.set(0, 0.45, 0.05);
    body.add(elder);
    const crown = cast("crown", 0.2);
    crown.position.set(0, 1.92, 0.05);
    g.add(seat, body, crown);
    scene.add(g);
    elders.push({ group: g, body, crown, home: crown.position.clone() });
  }
  // the four beasts: in the midst of the throne and round about it, each with six wings full of eyes
  const kinds = [["beastLion", 2.2], ["beastCalf", 2.0], ["beastMan", 2.4], ["beastEagle", 2.2]];
  const beasts = kinds.map(([key, height], i) => {
    const a = Math.PI * 0.25 + (i / 4) * Math.PI * 2;
    const g = new THREE.Group();
    g.position.set(Math.cos(a) * BEAST_R, DAIS, Math.sin(a) * BEAST_R);
    g.lookAt(0, DAIS, JOHN_Z);
    const body = cast(key, height);
    g.add(body);
    const wings = [];
    for (let w = 0; w < 6; w++) {
      const side = w % 2 ? 1 : -1;
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.3, height * 0.7, -0.2);
      const wing = cast("wingEyes", 0.9);
      wing.rotation.z = -Math.PI / 2;
      wing.scale.x = side;
      pivot.add(wing);
      pivot.userData = { side, tier: Math.floor(w / 2) };
      g.add(pivot);
      wings.push(pivot);
    }
    scene.add(g);
    return { group: g, wings, key };
  });
  // lightnings out of the throne
  const flash = new THREE.PointLight(0xdde8ff, 0, 300, 1);
  flash.position.set(0, DAIS + 12, 0);
  scene.add(flash);

  return {
    scene, camera, stars, sea, throne, glory, sardine, jasper, light, bow, lamps, elders, beasts, flash,
    /** Per frame: show is the throne's glory 0..1; beat drives the wings; lightning 0..1. */
    tick({ time, pixelRatio, show = 1, rainbow = 1, lightning = 0, lampsOn = 1 }) {
      stars.position.copy(camera.position);
      stars.material.uniforms.uTime.value = time;
      stars.material.uniforms.uPixelRatio.value = pixelRatio;
      glory.material.opacity = 0.7 * show;
      jasper.material.opacity = 0.25 * show;
      sardine.material.opacity = 0.35 * show * (0.85 + 0.15 * Math.sin(time * 0.7));
      light.intensity = 90 * show;
      bow.material.opacity = 0.75 * rainbow;
      bow.rotation.z = time * 0.02;
      lamps.forEach((f, i) => { f.material.uniforms.uTime.value = time + i; f.material.uniforms.uAmount.value = lampsOn; });
      flash.intensity = lightning * 4000;
      for (const b of beasts) {
        for (const w of b.wings) {
          const { side, tier } = w.userData;
          w.rotation.z = side * (0.5 - tier * 0.55 + 0.25 * Math.sin(time * 2.2 + tier));
          w.rotation.y = side * 0.4;
        }
      }
    },
  };
}

/** A gaze target given in heaven's coordinates, for keyframes whose eye path was lifted (see door.js). */
export const lookIn = (dy) => (x, y, z) => [x, y + dy, z];
