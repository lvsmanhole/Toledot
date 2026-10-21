// Revelation 6:1–8, through John's eyes, in the throne room. The Lamb holds the book; he opens the first four
// seals one by one. At each, one of the four beasts says "Come and see" (the first with a voice of thunder),
// and a horse rides out from the midst, over the edge of heaven and down to the earth far below. A white
// horse: his rider has a bow, and a crown is given him; he goes forth conquering. A red horse: a great sword,
// and peace taken from the earth (fires far off). A black horse: a pair of balances in the rider's hand, and a
// voice in the midst of the four beasts, "A measure of wheat for a penny". A pale horse: his name was Death,
// and Hell followed with him (a shadow at his heels); the fourth part of the earth darkens, and in it, seen
// from far above, the sword, hunger, death and the beasts of the earth.

import * as THREE from "three";

import { glowSprite, glowTexture, pulse, sramp } from "../../kit/common.js";
import { herd } from "../../kit/figures.js";
import { smoke } from "../../kit/effects.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { BEAST_R, DAIS, JOHN_Z, heavenRoom } from "../kit/heaven.js";

const EARTH = -50; // the earth, far below the sea of glass
const LAMB = new THREE.Vector3(0, DAIS, 4.2);
const KEYS = ["horseWhite", "horseRed", "horseBlack", "horsePale"];
const SIDES = [1, -1, 1, 1];
const OPEN = [2, 14.8, 27.8, 40.8]; // each seal breaks
const EMERGE = [5.5, 18.5, 29.5, 44.5]; // each horse comes out of the light
// how far along its ride each horse is (the black horse halts while the voice speaks, 6:6)
const RIDE = [
  (r) => 0.45 * sramp(r, 6, 9.5) + 0.55 * sramp(r, 9.5, 13),
  (r) => 0.45 * sramp(r, 19, 22) + 0.55 * sramp(r, 22, 26),
  (r) => 0.45 * sramp(r, 30, 32.5) + 0.55 * sramp(r, 37, 39.5),
  (r) => 0.45 * sramp(r, 45, 48.5) + 0.55 * sramp(r, 48.5, 52),
];

/** A dark, soft blot (normal blending, so it darkens what is behind it). */
function shade(scale, opacity = 0) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0x000000, transparent: true, opacity, depthWrite: false }));
  s.scale.setScalar(scale);
  return s;
}

/** Barren ground cracked by drought (hunger), drawn once. */
function crackedTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#6b5640";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "#2a2018";
  g.lineWidth = 2;
  let s = 9;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 70; i++) {
    let [x, y] = [r() * 256, r() * 256];
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 5; k++) g.lineTo((x += (r() - 0.5) * 50), (y += (r() - 0.5) * 50));
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 4);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, beasts } = H;
  const E = [0, EYE, JOHN_Z];

  // the Lamb, with the book in his possession (taken in 5:7), as in lamb.js
  const lamb = cast("lamb", 1.25);
  lamb.position.copy(LAMB);
  lamb.rotation.y = -Math.PI / 2;
  const sevenEyes = Array.from({ length: 7 }, (_, i) => {
    const a = -1.1 + (i / 6) * 2.2;
    const e = glowSprite(0xfff0c8, 0.08, 0.85);
    e.position.set(0.6 + Math.cos(a) * 0.03, 1.02 + Math.abs(a) * 0.04, Math.sin(a) * 0.13);
    return e;
  });
  lamb.add(...sevenEyes);
  scene.add(lamb);
  const book = cast("sealedBook", 0.16);
  book.scale.setScalar(3);
  book.position.set(0.1, DAIS + 1.05, 4.55);
  scene.add(book);
  const BOOK = [0.1, DAIS + 1.2, 4.55];
  // the seven seals as seven red points along the book; the first four break in turn
  const seals = Array.from({ length: 7 }, (_, i) => {
    const s = glowSprite(0xff4a30, 0.12, 0.8);
    s.position.set(-0.3 + i * 0.1, DAIS + 1.22, 4.75);
    scene.add(s);
    return s;
  });
  const breakFlash = glowSprite(0xfff4e0, 2.5, 0);
  scene.add(breakFlash);

  // each beast's voice, "Come and see": light at its head
  const beastHead = (i) => {
    const a = Math.PI * 0.25 + (i / 4) * Math.PI * 2;
    return [Math.cos(a) * BEAST_R, DAIS + 1.9, Math.sin(a) * BEAST_R];
  };
  const voices = beasts.map((_, i) => {
    const g = glowSprite(0xffe6b8, 3, 0);
    g.position.set(...beastHead(i));
    scene.add(g);
    return g;
  });
  // the voice in the midst of the four beasts (6:6): a ring of light among them
  const midst = new THREE.Mesh(new THREE.TorusGeometry(BEAST_R, 0.08, 8, 96), new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 1.7, 1.1), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  midst.rotation.x = Math.PI / 2;
  midst.position.y = DAIS + 1.2;
  scene.add(midst);

  // the horses: out of the midst, over the edge of heaven, down to the earth
  const paths = SIDES.map((side) => new THREE.CatmullRomCurve3([
    new THREE.Vector3(side * 1.6, DAIS, 5.5),
    new THREE.Vector3(side * 6, DAIS + 1, 16),
    new THREE.Vector3(side * 9, 1, 25),
    new THREE.Vector3(side * 26, -12, 40),
    new THREE.Vector3(side * 24, EARTH + 1, 55),
  ]));
  const at = (i, r) => paths[i].getPoint(RIDE[i](r)).add(new THREE.Vector3(0, 2.4, 0)).toArray(); // the rider, not the hooves
  const horses = KEYS.map((key) => {
    const g = new THREE.Group();
    const h = cast(key, 4); // seen in vision, greater than life, so John sees each one plainly
    h.rotation.y = -Math.PI / 2; // the model's head is toward +x; the group faces along +z
    g.add(h);
    g.visible = false;
    scene.add(g);
    return g;
  });
  // light from the throne falls on each horse on John's side, so it is not lost against the glory behind it
  const onHorse = new THREE.PointLight(0xfff0dc, 0, 40, 1.2);
  scene.add(onHorse);
  const emerge = glowSprite(0xfff6e0, 6, 0);
  emerge.position.set(0, DAIS + 1, 5.5);
  scene.add(emerge);
  // a crown was given unto him (6:2)
  const crown = cast("crown", 0.2);
  horses[0].add(crown);
  const crownGlow = glowSprite(0xffd890, 0.8, 0);
  horses[0].add(crownGlow);
  // the balances held up, with light on the pans (6:5–6)
  const pans = glowSprite(0xffe0a0, 1.2, 0);
  pans.position.set(0, 2.5, 0.6);
  horses[2].add(pans);
  // Hell followed with him (6:8): a shadow at the pale horse's heels
  const hell = Array.from({ length: 6 }, (_, j) => { const s = shade(5 + j * 2.5); scene.add(s); return s; });
  const hellSmoke = smoke({ count: 500, rise: 10, spread: 4, color: [0.04, 0.035, 0.04], opacity: 0.6, size: 14, seed: 13 });
  scene.add(hellSmoke);

  // the earth, far below: seen through the sea of glass as it clears
  const earth = new THREE.Group();
  earth.position.y = EARTH;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a5a38, roughness: 1 }));
  ground.position.z = 40;
  earth.add(ground);
  const sun = new THREE.DirectionalLight(0xfff0dc, 1.2);
  sun.position.set(20, 60, 80);
  earth.add(sun);
  // peace taken from the earth (6:4): fires and smoke far off, no one seen close
  const war = new THREE.Group();
  let s = 21;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 14; i++) {
    const f = glowSprite(0xff7a30, 3 + rnd() * 4, 0.9);
    f.position.set(-24 + (rnd() - 0.5) * 70, 1, 55 + (rnd() - 0.5) * 60);
    war.add(f);
  }
  for (let i = 0; i < (ctx.quality === "low" ? 2 : 4); i++) {
    const sm = smoke({ count: 300, rise: 25, spread: 3, lean: [0.4, 0.1], color: [0.2, 0.18, 0.17], opacity: 0.4, size: 12, seed: 30 + i });
    sm.position.set(-24 + (i - 1.5) * 16, 0, 50 + (i % 2) * 18);
    war.add(sm);
  }
  earth.add(war);
  // the fourth part of the earth (6:8), about where the pale horse comes down, and in it the four means
  const fourth = new THREE.Group();
  fourth.position.set(24, 0.2, 55);
  const dark = new THREE.Mesh(new THREE.CircleGeometry(70, 48, -Math.PI * 0.75, Math.PI / 2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x0c0e0a, transparent: true, opacity: 0, depthWrite: false }));
  dark.position.set(0, 0.1, -25);
  fourth.add(dark);
  const hunger = new THREE.Mesh(new THREE.CircleGeometry(16, 32).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: crackedTexture(), roughness: 1, transparent: true, opacity: 0 }));
  hunger.position.set(-8, 0.2, 6);
  fourth.add(hunger);
  const swords = Array.from({ length: 10 }, (_, i) => {
    const g = glowSprite(0xe8f0ff, 0.9, 0);
    g.position.set(10 + (i % 5) * 3, 1.2, -10 + Math.floor(i / 5) * 4);
    fourth.add(g);
    return g;
  });
  const pallor = glowSprite(0xb8c8a8, 40, 0); // death: a sickly pallor over the land
  pallor.position.set(0, 3, 0);
  fourth.add(pallor);
  const lions = herd({ kind: "lion", count: 24, place: (r) => [-20 + r() * 18, -20 + r() * 16], scale: [2.2, 2.6] });
  fourth.add(lions);
  earth.add(fourth);
  earth.visible = false;
  scene.add(earth);

  const looksDown = (rel) => Math.max(pulse(rel, 9.5, 10.5, 13, 14), pulse(rel, 22, 23, 26, 27), pulse(rel, 37.5, 38.5, 40, 40.8), pulse(rel, 48.5, 49.5, 59, 61));
  const eyes = johnEyes([
    [0, E, [0, DAIS + 1.5, 4.2], 40],
    [1.5, E, BOOK, 16],
    [3, E, BOOK, 16],
    [4, E, beastHead(0), 30],
    [5.5, E, beastHead(0), 30],
    [6.5, E, at(0, 6.5), 30],
    [8.5, E, at(0, 8.5), 32],
    [10.5, E, at(0, 10.5), 44],
    [12.5, E, at(0, 12.5), 52],
    [14, E, BOOK, 20],
    [15.5, E, beastHead(1), 30],
    [18, E, beastHead(1), 30],
    [19.5, E, at(1, 19.5), 32],
    [21.5, E, at(1, 21.5), 40],
    [23.5, E, at(1, 23.5), 48],
    [25.5, E, [-24, EARTH, 58], 56],
    [27, E, BOOK, 20],
    [28.5, E, beastHead(2), 30],
    [30, E, at(2, 30), 30],
    [32.5, E, at(2, 32.5), 22],
    [34, E, [0, DAIS + 1.4, 0], 50],
    [36, E, [0, DAIS + 1.4, 0], 50],
    [37.5, E, at(2, 37.5), 24],
    [39.5, E, at(2, 39.5), 50],
    [40.5, E, BOOK, 20],
    [41.5, E, beastHead(3), 30],
    [44, E, beastHead(3), 30],
    [45.5, E, at(3, 45.5), 32],
    [48, E, at(3, 48), 40],
    [50.5, E, at(3, 50.5), 50],
    [52.5, E, [22, EARTH, 58], 60],
    [56, E, [26, EARTH, 50], 62],
    [60, E, [22, EARTH, 54], 62],
  ]);

  const p = new THREE.Vector3();
  const ahead = new THREE.Vector3();
  const behind = new THREE.Vector3();
  let paleTinted = false;
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      H.tick({ time, pixelRatio, show: 1, rainbow: 1, lampsOn: 1 });
      // the seals break; each beast says "Come and see"
      seals.forEach((sl, i) => { sl.material.opacity = i < 4 && rel > OPEN[i] ? 0 : 0.7 + 0.2 * Math.sin(time * 2 + i); });
      breakFlash.position.set(...BOOK);
      breakFlash.material.opacity = Math.max(...OPEN.map((o) => pulse(rel, o - 0.2, o, o + 0.3, o + 1.2)));
      voices.forEach((v, i) => { const o = OPEN[i]; v.material.opacity = pulse(rel, o + 1, o + 1.6, o + 3.6, o + 4.4) * (0.6 + 0.3 * Math.sin(time * 9)); });
      midst.material.opacity = pulse(rel, 32.5, 33.5, 36.5, 37.5) * (0.5 + 0.2 * Math.sin(time * 4));
      for (const e of sevenEyes) e.material.opacity = 0.75 + 0.2 * Math.sin(time * 1.3);
      // the horses ride out
      horses.forEach((g, i) => {
        const k = RIDE[i](rel);
        g.visible = k > 0.001 && (i === 3 || k < 0.999 || rel < OPEN[i] + 13);
        if (!g.visible) return;
        paths[i].getPoint(k, p);
        paths[i].getPoint(Math.min(1, k + 0.02), ahead);
        if (k > 0.98) ahead.copy(p).add(new THREE.Vector3(SIDES[i] * 0.3, 0, 1));
        g.position.copy(p);
        ahead.y = p.y + (ahead.y - p.y) * 0.3; // they ride down the air, not dive
        g.lookAt(ahead);
        const moving = k < 0.98 || i === 3;
        g.position.y += moving ? Math.abs(Math.sin(time * 6 + i)) * 0.18 : 0;
        if (i === 3 && k > 0.98) g.position.addScaledVector(new THREE.Vector3(SIDES[i] * 0.3, 0, 1).normalize(), (rel - 52) * 0.6);
      });
      const riding = horses.findLastIndex((g) => g.visible);
      onHorse.intensity = riding < 0 ? 0 : 80;
      if (riding >= 0) onHorse.position.copy(horses[riding].position).add(new THREE.Vector3(0, 6, 7));
      emerge.material.opacity = Math.max(...EMERGE.map((e) => pulse(rel, e, e + 0.5, e + 1.5, e + 3)));
      // the pale horse, ashen grey-green (6:8): the model arrives white, so its coat is tinted once it is in
      if (!paleTinted) horses[3].traverse((m) => { if (m.isMesh && m.material.map) { m.material = m.material.clone(); m.material.color.setRGB(0.74, 0.86, 0.72); paleTinted = true; } });
      // the crown comes down on the rider of the white horse
      const crowned = sramp(rel, 7.5, 9);
      crown.position.set(0, 3.85 + (1 - crowned) * 2.5, 0);
      crown.visible = rel > 7.3;
      crownGlow.position.copy(crown.position);
      crownGlow.material.opacity = pulse(rel, 7.5, 8.5, 10, 11.5);
      pans.material.opacity = pulse(rel, 31.5, 32.5, 37, 38) * (0.6 + 0.2 * Math.sin(time * 3));
      // Hell follows the pale horse
      const pale = horses[3];
      const hellOn = sramp(rel, 45.5, 47.5);
      pale.getWorldDirection(behind).negate();
      hell.forEach((h, j) => {
        h.position.copy(pale.position).addScaledVector(behind, 3 + j * 2.2);
        h.position.y += 1 + Math.sin(time * 0.7 + j) * 0.6;
        h.material.opacity = hellOn * (0.75 - j * 0.08);
      });
      hellSmoke.position.copy(hell[2].position).setY(hell[2].position.y - 2);
      hellSmoke.material.uniforms.uTime.value = time;
      hellSmoke.material.uniforms.uPixelRatio.value = pixelRatio;
      hellSmoke.material.uniforms.uAmount.value = hellOn;
      hellSmoke.visible = hellOn > 0.01;
      // the earth below, through the sea of glass
      const down = looksDown(rel);
      earth.visible = down > 0.01 || rel > 22;
      H.sea.material.opacity = 0.86 * (1 - 0.8 * down);
      war.visible = rel > 21.5;
      war.traverse((o) => {
        if (o.isSprite) o.material.opacity = sramp(rel, 21.5, 24) * (0.6 + 0.3 * Math.sin(time * 5 + o.position.x));
        if (o.isPoints) { o.material.uniforms.uTime.value = time; o.material.uniforms.uPixelRatio.value = pixelRatio; }
      });
      const fourthPart = sramp(rel, 51, 54);
      dark.material.opacity = 0.6 * fourthPart;
      hunger.material.opacity = sramp(rel, 52, 54);
      swords.forEach((g, i) => { g.material.opacity = fourthPart * Math.max(0, Math.sin(time * 7 + i * 2.1)) * 0.9; });
      pallor.material.opacity = 0.25 * fourthPart;
      lions.visible = rel > 52;
      lions.position.x = (rel - 52) * 0.4;
      // the grade follows the horse: white, red, black, pale
      const red = pulse(rel, 19, 21, 26, 27.5);
      const black = pulse(rel, 30, 32, 39, 40.5);
      const paleK = sramp(rel, 45, 48);
      const thunder = pulse(rel, OPEN[0] + 1, OPEN[0] + 1.2, OPEN[0] + 1.8, OPEN[0] + 3);
      return {
        grade: {
          bloom: 0.6 + 0.3 * thunder, threshold: 0.78, exposure: 0.95 - 0.15 * paleK,
          tint: [1 + 0.08 * red - 0.04 * paleK, 1 - 0.04 * red + 0.02 * paleK, 1.02 - 0.06 * red - 0.02 * paleK],
          saturation: 1 - 0.35 * black - 0.45 * paleK,
        },
        audio: {
          drone: 0.35 + 0.2 * paleK, shimmer: 0.5 * (1 - paleK),
          thunder: thunder,
          trumpet: 0.3 * Math.max(...OPEN.slice(1).map((o) => pulse(rel, o + 1, o + 1.6, o + 3.6, o + 4.4))),
          waters: 0.45 * pulse(rel, 32.5, 33.5, 36.5, 37.5),
          wind: 0.5 * Math.max(...RIDE.map((f) => { const k = f(rel); return k > 0.01 && k < 0.99 ? 1 : 0; })),
          fire: 0.4 * pulse(rel, 22, 24, 26, 27.5),
        },
      };
    },
  };
}
