// Revelation 10, through John's eyes on a shore. Another mighty angel comes down from heaven, clothed with a
// cloud, a rainbow upon his head, his face as it were the sun, his feet as pillars of fire; a little book open in
// his hand. He sets his right foot upon the sea and his left foot on the earth, and cries as a lion roars; seven
// thunders utter their voices, one by one. John is about to write, and a voice says "write them not": his hand
// stops. The angel lifts up his hand to heaven and swears that there should be time no longer (the sea and the
// cloud stand still). "Go and take the little book": John goes to him; "Take it, and eat it up". In his mouth
// sweet as honey; his belly bitter. "Thou must prophesy again before many peoples, and nations, and tongues,
// and kings": the peoples and kings of the earth, inland.

import * as THREE from "three";

import { clamp, glowSprite, lerp, pulse, sramp } from "../../kit/common.js";
import { flame, lightShaft, pillar, rainbow, smoke } from "../../kit/effects.js";
import { crowd, figure } from "../../kit/figures.js";
import { createLandscape } from "../../kit/landscape.js";
import { MATERIALS, city } from "../../kit/structures.js";
import { composeHeight, heights } from "../../kit/terrain.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { hands } from "../kit/hands.js";

const TALL = 80; // the mighty angel, in metres
const ANGEL = [0, -250]; // astride the shore: the sea to the west (-x), the earth to the east
const START = [30, 100]; // where John stands on the shore
const NEAR = [24, -160]; // where he goes to take the book
const THUNDERS = [15.7, 16.3, 16.9, 17.5, 18.1, 18.7, 19.3]; // the seven thunders (10:3)

/** A little book, open: two pale leaves on a spine. */
function openBook(size = 1) {
  const g = new THREE.Group();
  const leaf = new THREE.MeshStandardMaterial({ color: 0xece0c0, roughness: 0.9, emissive: 0x2a2010 });
  for (const side of [-1, 1]) {
    const page = new THREE.Mesh(new THREE.BoxGeometry(0.5 * size, 0.02 * size, 0.7 * size), leaf);
    page.position.x = side * 0.26 * size;
    page.rotation.z = -side * 0.18;
    g.add(page);
  }
  return g;
}

export function create(ctx) {
  const low = ctx.quality === "low";
  // the sea to the west, the land rising to the east
  const coast = (x) => clamp(x / 40, -1, 1) * 5 + clamp((x - 150) / 400, 0, 1) * 30;
  const height = composeHeight([(x, z) => coast(x), heights.rolling(1.5, 0.01, 717)], 0.5);
  const at = (x, z, dy = 0) => [x, height(x, z) + dy, z];
  const E0 = at(START[0], START[1], EYE);
  const E1 = at(NEAR[0], NEAR[1], EYE);
  const L = createLandscape(ctx, {
    terrain: { height, palette: "steppe", size: 1600, center: [200, -100], wetLevel: 0.8 },
    water: { size: 3000, wave: 0.5, chop: 1, deep: [0.02, 0.04, 0.06], level: 0 },
    sky: (rel) => [[1 - sramp(rel, 24, 30), "storm"], [sramp(rel, 24, 30), "golden"]],
    lightning: (rel) => pulse(rel, 11.5, 12.5, 14.5, 15.5) * 0.5,
    camera: [[0, E0, [0, 40, -250], 50], [20, E1, [0, 40, -250], 50]], // replaced by John's eyes
    keepClear: [[START[0], START[1], 10], [NEAR[0], NEAR[1], 10], [ANGEL[0], ANGEL[1], 30]],
    keepAboveGround: false,
    plants: false,
  });
  const h = L.height;

  // the mighty angel, come down from heaven, facing John
  const [ax, az] = ANGEL;
  const mighty = new THREE.Group();
  mighty.position.set(ax, 0, az);
  mighty.lookAt(START[0], 0, START[1]);
  const body = cast("angel", TALL);
  mighty.add(body);
  // clothed with a cloud
  // (about his body only, so his face, the rainbow and the book stay clear)
  const clouds = [0.12, 0.3, 0.48].map((k, i) => {
    const c = smoke({ count: low ? 120 : 260, rise: TALL * 0.2, spread: TALL * 0.16, color: [0.86, 0.86, 0.88], opacity: 0.16, size: 140, seed: 40 + i, lit: true });
    c.position.y = TALL * k;
    mighty.add(c);
    return c;
  });
  // a rainbow upon his head; his face as it were the sun
  const bow = rainbow({ radius: TALL * 0.17, width: TALL * 0.04 });
  bow.position.set(0, TALL * 0.86, 0.5);
  const sun = glowSprite(0xfff4d8, TALL * 0.32, 0);
  sun.position.set(0, TALL * 0.9, 2);
  sun.material.depthTest = false;
  sun.renderOrder = 3;
  const light = new THREE.PointLight(0xfff0d8, 0, 2000, 2);
  light.position.set(0, TALL * 0.9, 20);
  mighty.add(bow, sun, light);
  // his feet as pillars of fire: the right on the sea, the left on the earth (he faces +z: his right is -x)
  const feet = [-1, 1].map((side) => {
    const p = pillar({ radius: TALL * 0.045, height: TALL * 0.4, color: [1, 0.55, 0.2], gain: 1, soft: 0.5 });
    const f = flame({ width: TALL * 0.12, height: TALL * 0.28, gain: 0.6, seed: side + 3 });
    p.position.set(side * TALL * 0.08, 0, 0);
    f.position.copy(p.position);
    mighty.add(p, f);
    return [p, f];
  }).flat();
  // the little book open in his hand, and the hand he lifts up to heaven (10:5)
  const book = openBook(TALL * 0.03);
  const bookGlow = glowSprite(0xffeec8, TALL * 0.08, 0.6);
  const HAND = new THREE.Vector3(-TALL * 0.2, TALL * 0.48, TALL * 0.08); // in the angel's frame
  book.position.copy(HAND);
  bookGlow.position.copy(HAND);
  mighty.add(book, bookGlow);
  const oath = lightShaft({ length: 900, top: TALL * 0.05, bottom: TALL * 0.02, color: [1, 0.92, 0.75], gain: 0.9 });
  oath.position.set(TALL * 0.2, TALL * 0.95, 0);
  mighty.add(oath);
  L.add(mighty);
  // the seven thunders: flashes in seven places across the sky
  const flashes = THUNDERS.map((_, i) => {
    const g = glowSprite(0xdfe8ff, 160, 0);
    g.position.set(-500 + i * 160, 320 + (i % 3) * 60, -700 - (i % 2) * 150);
    L.add(g);
    return g;
  });
  const thunderLight = new THREE.PointLight(0xdde8ff, 0, 3000, 2);
  thunderLight.position.set(0, 400, -400);
  L.add(thunderLight);

  // the peoples, and nations, and tongues, and kings, inland (10:11)
  for (const [cx, cz, n] of [[420, -260, 90], [520, 60, 120], [330, 220, 70]]) {
    const town = city({ count: low ? n / 2 : n, radius: 45, height: (x, z) => h(x + cx, z + cz), style: "mud", seed: cx });
    town.position.set(cx, 0, cz);
    L.add(town);
  }
  const peoples = crowd({ count: low ? 300 : 700, place: (r) => [120 + r() * 260, -260 + r() * 420], height: h, face: NEAR, seed: 33 });
  L.add(peoples.group);
  const kings = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const k = figure(1.8, { robe: [0x5a1e4a, 0x7a2a18, 0x1e3a6a, 0x5a4a14][i] });
    const crown = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.035, 6, 16), MATERIALS.gold());
    crown.rotation.x = Math.PI / 2;
    crown.position.y = 1.82;
    k.add(crown);
    k.position.set(...at(95 + i * 5, -150 + i * 9));
    k.lookAt(NEAR[0], k.position.y, NEAR[1]);
    kings.add(k);
  }
  L.add(kings);

  // John's hands: the book and the reed to write (10:4); then the little book, taken and eaten (10:10)
  L.scene.add(L.camera);
  const hand = hands(L.camera);
  const scroll = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.012, 0.12), new THREE.MeshStandardMaterial({ color: 0x9c8a68, roughness: 1 }));
  scroll.position.set(0, 0.03, -0.05);
  const reed = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.003, 0.18, 6), new THREE.MeshStandardMaterial({ color: 0x6b5236 }));
  reed.position.set(0.12, 0.06, -0.05);
  reed.rotation.set(0.4, 0, -0.9);
  const little = openBook(0.18);
  little.position.set(0, 0.04, -0.16);
  hand.group.add(scroll, reed, little);
  // the book coming down to him from the angel's hand (world space), before it is in his hands
  const handWorld = () => mighty.localToWorld(HAND.clone());
  const given = openBook(1);
  const givenGlow = glowSprite(0xffeec8, 1.2, 0);
  L.add(given);
  L.add(givenGlow);
  const offer = new THREE.Vector3(...at(NEAR[0] - 1.5, NEAR[1] - 3.5, EYE - 0.15));

  const up = [ax, TALL * 0.7, az];
  const eyes = johnEyes([
    [0, E0, [ax, 380, az], 62],
    [3, E0, [ax, 200, az], 62],
    [6, E0, [ax, TALL * 0.55, az], 52],
    [7.5, E0, [ax - 15, TALL * 0.48, az], 44],
    [9, E0, [ax, 8, az], 46],
    [11, E0, [ax, 10, az], 50],
    [12, E0, [ax, TALL * 0.88, az], 36],
    [15, E0, [ax, TALL * 0.88, az], 36],
    [16, E0, [ax - 100, 300, az - 300], 72],
    [19.6, E0, [ax + 100, 300, az - 300], 72],
    [20.5, E0, at(START[0] - 2, START[1] - 30, 0.5), 50],
    [24.5, E0, at(START[0] - 2, START[1] - 30, 1), 50],
    [26, E0, [ax + 15, TALL * 1.3, az], 56],
    [30.5, E0, [ax + 15, TALL * 2, az], 60],
    [31.5, E0, [ax, TALL, az], 58],
    [35, E0, up, 54],
    [36, E0, up, 54],
    [40, E1, [ax - 10, TALL * 0.45, az], 56],
    [41.5, E1, offer.toArray(), 48],
    [44.5, E1, offer.toArray(), 48],
    [45.5, E1, [NEAR[0] - 1, E1[1] - 0.5, NEAR[1] - 10], 50],
    [50, E1, [NEAR[0] - 1, E1[1] - 0.7, NEAR[1] - 10], 50],
    [51.5, E1, at(260, -100, 6), 44],
    [56, E1, at(300, -80, 6), 40],
  ]);

  const frozen = { time: 0 };
  const tmp = new THREE.Vector3();
  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    if (!reducedMotion) camera.position.y += Math.abs(Math.sin(rel * 6)) * 0.04 * pulse(rel, 36, 36.5, 39.5, 40); // walking
    // he comes down from heaven (10:1)
    mighty.position.y = 360 * (1 - sramp(rel, 0, 6.5));
    // time no longer (10:6): the sea, the cloud and the fire stand still while he swears
    const still = pulse(rel, 27.5, 28.5, 30.5, 32);
    frozen.time += (1 - still) * (time - (frozen.last ?? time));
    frozen.last = time;
    const t = frozen.time;
    if (L.water) L.water.mesh.material.uniforms.uTime.value = t;
    for (const c of clouds) c.material.uniforms.uTime.value = t;
    for (const f of feet) f.material.uniforms.uTime.value = t;
    bow.material.uniforms.uAmount.value = sramp(rel, 4, 6.5);
    sun.material.opacity = 0.95 * sramp(rel, 3, 6);
    light.intensity = 2.5e4 * sramp(rel, 3, 6); // about the sun's strength where John takes the book
    // the book in his hand, until it is brought down to John
    const down = sramp(rel, 38, 41.5);
    book.visible = down < 0.01;
    bookGlow.visible = book.visible;
    bookGlow.material.opacity = pulse(rel, 6.5, 7.5, 11, 12) * 0.8 + 0.25;
    tmp.copy(handWorld()).lerp(offer, down);
    given.position.copy(tmp);
    given.scale.setScalar(lerp(TALL * 0.03, 0.18, down));
    given.lookAt(camera.position);
    given.rotateX(Math.PI / 2); // its open pages toward him
    given.visible = down > 0.01 && rel < 43.5;
    givenGlow.position.copy(tmp);
    givenGlow.material.opacity = given.visible ? 0.4 : 0;
    // he lifts up his hand to heaven, and swears (10:5–6)
    oath.material.uniforms.uTime.value = time;
    oath.material.uniforms.uAmount.value = pulse(rel, 25.5, 27, 33, 35);
    oath.visible = rel > 25 && rel < 35.5;
    // the seven thunders
    let thunder = 0;
    THUNDERS.forEach((at0, i) => {
      const k = pulse(rel, at0, at0 + 0.05, at0 + 0.15, at0 + 0.5);
      flashes[i].material.opacity = 0.7 * k;
      thunder = Math.max(thunder, k);
    });
    thunderLight.intensity = thunder * 4e5;
    // [John] to write, and "write them not"; then to take the book, and eat it
    const eat = sramp(rel, 45, 46.5);
    if (rel < 30) hand.pose("write", pulse(rel, 19.6, 20.8, 23.2, 24.6));
    else hand.pose("reach", pulse(rel, 42, 43.5, 48, 49.5));
    scroll.visible = reed.visible = rel < 30;
    little.visible = rel > 43.3 && rel < 47.2;
    little.scale.setScalar(1 - sramp(rel, 46.2, 47.2) * 0.9);
    if (rel > 44.5 && rel < 49.5) {
      // the hands bring it to his mouth
      hand.group.position.set(0, lerp(hand.group.position.y, -0.1, eat), lerp(hand.group.position.z, -0.18, eat));
      hand.group.rotation.x = lerp(hand.group.rotation.x, 0.9, eat);
    }
    // sweet as honey; then bitter
    const sweet = pulse(rel, 46, 46.8, 47.6, 48.3);
    const bitter = pulse(rel, 47.8, 48.6, 50, 51);
    const storm = 1 - sramp(rel, 24, 30);
    return {
      grade: {
        bloom: 0.4 + 0.2 * thunder, threshold: 0.9, exposure: 0.95 + 0.2 * thunder + 0.15 * sweet - 0.2 * bitter,
        tint: [1 + 0.1 * sweet - 0.04 * bitter, 1 + 0.03 * sweet + 0.02 * bitter, 1 - 0.15 * sweet - 0.06 * bitter],
        saturation: 1 + 0.15 * sweet - 0.4 * bitter,
      },
      audio: {
        drone: 0.3 + 0.2 * bitter, shimmer: 0.4 * (1 - storm) + 0.4 * sweet, wind: 0.4 * storm * (1 - still), water: 0.5 * (1 - still),
        fire: 0.4 * sramp(rel, 5, 7) * (1 - still),
        // he cries as when a lion roareth; the seven thunders; the voice of the seventh angel to come
        thunder: Math.max(thunder, pulse(rel, 11.5, 12, 13.5, 15) * 0.85, pulse(rel, 1, 2, 5, 6.5) * 0.3),
        trumpet: pulse(rel, 31.5, 32.5, 34, 35) * 0.35,
        waters: pulse(rel, 20.5, 21, 24, 25) * 0.6 + pulse(rel, 35.5, 36, 39.5, 40.5) * 0.6,
      },
    };
  });
  return L;
}
