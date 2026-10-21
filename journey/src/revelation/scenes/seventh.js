// Revelation 11:15–19, through John's eyes, in the throne room. The seventh angel sounds, high above; great
// voices in heaven: "The kingdoms of this world are become the kingdoms of our Lord, and of his Christ" (the
// throne room fills with light). The twenty-four elders fall upon their faces and worship. The nations were
// angry and the time of the dead is come (far below the sea of glass the earth is dark and smouldering, and
// lights rise from it: the reward of the prophets and the saints). The temple of God is opened in heaven, and
// the ark of his testament is seen in his temple; then lightnings, voices, thunderings, an earthquake and
// great hail.

import * as THREE from "three";

import { glowSprite, glowTexture, pulse, sramp } from "../../kit/common.js";
import { weather } from "../../kit/effects.js";
import { MATERIALS } from "../../kit/structures.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { DAIS, ELDER_R, JOHN_Z, elderAngle, heavenRoom } from "../kit/heaven.js";

const FLOOR = 20; // the temple stands above and behind the throne, seen over it
const ARK = [0, FLOOR + 0.9, -44];

/** The ark of his testament: a chest of gold, the mercy seat, two cherubim of gold with wings over it, the staves. */
function arkOfTestament() {
  const g = new THREE.Group();
  const gold = MATERIALS.gold();
  const add = (geo, x, y, z) => { const m = new THREE.Mesh(geo, gold); m.position.set(x, y, z); g.add(m); return m; };
  add(new THREE.BoxGeometry(1.13, 0.68, 0.68), 0, 0.34, 0);
  add(new THREE.BoxGeometry(1.2, 0.06, 0.74), 0, 0.71, 0); // the mercy seat
  for (const z of [-0.42, 0.42]) {
    const stave = add(new THREE.CylinderGeometry(0.025, 0.025, 2.4, 8), 0, 0.2, z);
    stave.rotation.z = Math.PI / 2;
  }
  for (const side of [-1, 1]) {
    const c = new THREE.Group();
    c.position.set(side * 0.42, 0.74, 0);
    c.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2; // facing one another, over the mercy seat
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.34, 10), gold);
    body.position.y = 0.17;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), gold);
    head.position.set(0, 0.36, 0.03);
    head.rotation.x = 0.4;
    c.add(body, head);
    for (const w of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.12, 0.5), gold);
      wing.position.set(w * 0.1, 0.42, 0.18);
      wing.rotation.set(-0.5, w * 0.35, 0);
      c.add(wing);
    }
    g.add(c);
  }
  return g;
}

/** The temple of God in heaven: a hall of light behind two doors of gold, which open. */
function temple() {
  const g = new THREE.Group();
  const stone = new THREE.MeshStandardMaterial({ color: 0xf2ead8, roughness: 0.4, emissive: 0x3a3020, emissiveIntensity: 0.4 });
  const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.6, 34), stone);
  floor.position.set(0, FLOOR - 0.3, -47);
  g.add(floor);
  for (let i = 0; i < 6; i++) for (const x of [-7, 7]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.65, 18, 16), stone);
    col.position.set(x, FLOOR + 9, -34 - i * 5);
    g.add(col);
  }
  const back = glowSprite(0xfff2d8, 26, 0);
  back.position.set(0, FLOOR + 8, -64);
  g.add(back);
  const doors = [-1, 1].map((side) => {
    const hinge = new THREE.Group();
    hinge.position.set(side * 8, FLOOR, -30);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(8, 18, 0.4), MATERIALS.gold());
    leaf.position.set(-side * 4, 9, 0);
    hinge.add(leaf);
    g.add(hinge);
    return { hinge, side };
  });
  return { group: g, doors, back };
}

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, elders } = H;
  const E = [0, EYE, JOHN_Z];

  // the seventh angel, sounding high above the throne: a figure of light with a trumpet of gold
  const herald = new THREE.Group();
  herald.position.set(0, 46, -14);
  const body = glowSprite(0xffe6c0, 1, 0.8);
  body.scale.set(3.2, 9, 1);
  const face = glowSprite(0xfff8ee, 2, 1);
  face.position.y = 4.4;
  const horn = new THREE.Mesh(new THREE.LatheGeometry([[0.05, 0], [0.06, 3.4], [0.2, 4], [0.55, 4.3]].map(([r, y]) => new THREE.Vector2(r, y)), 16), MATERIALS.gold());
  horn.material.side = THREE.DoubleSide;
  horn.position.set(0.4, 4.2, 0.3);
  horn.rotation.z = -0.9;
  herald.add(body, face, horn);
  scene.add(herald);

  // far below the sea of glass: the earth, dark, the nations angry (embers), and the dead judged, the saints
  // rewarded (lights rising)
  const below = new THREE.Group();
  below.position.y = -70;
  below.add(new THREE.Mesh(new THREE.PlaneGeometry(500, 500).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 1 })));
  const anger = weather("embers", { count: 3000, box: [200, 30, 200], seed: 11 });
  below.add(anger.points);
  const RISING = 600;
  const seeds = Float32Array.from({ length: RISING * 3 }, (_, i) => Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1);
  const risePos = new Float32Array(RISING * 3);
  const riseGeo = new THREE.BufferGeometry();
  riseGeo.setAttribute("position", new THREE.BufferAttribute(risePos, 3));
  const rising = new THREE.Points(riseGeo, new THREE.PointsMaterial({ color: 0xfff4dc, size: 1.6, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  rising.frustumCulled = false;
  below.add(rising);
  scene.add(below);

  // the temple of God opened in heaven, and the ark of his testament seen in his temple (11:19)
  const T = temple();
  scene.add(T.group);
  const ark = arkOfTestament();
  ark.position.set(...ARK);
  ark.position.y -= 0.9;
  scene.add(ark);
  const arkLight = new THREE.PointLight(0xffe0a0, 0, 30, 1.5);
  arkLight.position.set(ARK[0], ARK[1] + 3, ARK[2] + 3);
  scene.add(arkLight);
  const shekinah = glowSprite(0xfff6e0, 2.4, 0);
  shekinah.position.set(ARK[0], ARK[1] + 0.6, ARK[2]);
  scene.add(shekinah);

  // great hail (11:19)
  const hail = weather("hail", { count: ctx.quality === "low" ? 2500 : 7000, box: [70, 40, 70], seed: 19 });
  scene.add(hail.points);

  const elderAt = (i) => [Math.sin(elderAngle(i)) * ELDER_R, 1.0, -Math.cos(elderAngle(i)) * ELDER_R + 4];
  const UP = [0, FLOOR + 5, -8]; // in the spirit, carried up before the temple's open doors to see the ark
  const eyes = johnEyes([
    [0, E, [0, 40, -14], 56],
    [4.5, E, [0, 44, -14], 50],
    [5.5, E, [0, DAIS + 4, 0], 58],
    [10, E, [0, 16, -10], 66],
    [11, E, elderAt(4), 46],
    [13, E, elderAt(19), 46],
    [15, E, [0, DAIS + 2, 0], 56],
    [16.5, E, [0, -60, 46], 64],
    [20.5, E, [8, -64, 40], 64],
    [21.5, E, [0, FLOOR + 6, -32], 34],
    [23.5, UP, [0, FLOOR + 3, -40], 30],
    [25, UP, [ARK[0], ARK[1], ARK[2]], 16],
    [26.5, UP, [ARK[0], ARK[1], ARK[2]], 17],
    [28, E, [0, FLOOR, -30], 46],
    [31, E, [0, 10, -10], 60],
  ], { falls: [] });

  const fwd = new THREE.Vector3();
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      // great voices in heaven (11:15): the room fills with light
      const voices = pulse(rel, 5, 6.5, 9.5, 11);
      const storm = sramp(rel, 25.5, 26.5);
      const flash = storm * (pulse((rel * 3.1) % 3, 0, 0.05, 0.12, 0.3) + 0.6 * pulse((rel * 2.3 + 1.1) % 3, 0, 0.05, 0.1, 0.25));
      const atArk = pulse(rel, 22.5, 24, 26.5, 27.5);
      H.tick({ time, pixelRatio, show: (1 + 0.7 * voices) * (1 - 0.75 * atArk), rainbow: 1, lampsOn: 1, lightning: reducedMotion ? flash * 0.3 : flash });
      herald.visible = rel < 6;
      body.material.opacity = 0.8 * (1 - sramp(rel, 4.5, 6));
      // the elders fall upon their faces and worship (11:16)
      const fall = pulse(rel, 10.5, 12, 19.5, 21);
      elders.forEach(({ body: b }) => { b.rotation.x = fall * 1.35; });
      // the nations angry; the dead judged; the reward given (11:18)
      const judged = pulse(rel, 15, 16.5, 20.5, 21.5);
      H.sea.material.opacity = 0.86 * (1 - 0.75 * judged);
      below.visible = judged > 0.01;
      anger.update({ time, pixelRatio, amount: judged * 0.8, center: new THREE.Vector3(0, -70, 40) });
      for (let i = 0; i < RISING; i++) {
        const s = seeds[i * 3 + 2];
        risePos[i * 3] = (seeds[i * 3] - 0.5) * 160;
        risePos[i * 3 + 1] = ((time * (2 + s * 3) + s * 60) % 60);
        risePos[i * 3 + 2] = (seeds[i * 3 + 1] - 0.5) * 160 + 40;
      }
      riseGeo.attributes.position.needsUpdate = true;
      rising.material.opacity = sramp(rel, 17, 18.5) * judged;
      // the temple opened, and the ark seen (11:19)
      const open = sramp(rel, 21.5, 23.5);
      for (const { hinge, side } of T.doors) hinge.rotation.y = side * open * 1.7;
      arkLight.intensity = 60 * open;
      T.back.material.opacity = 0.55 * open;
      shekinah.material.opacity = 0.5 * open * (0.85 + 0.15 * Math.sin(time * 1.3));
      // lightnings, voices, thunderings, an earthquake and great hail
      const quake = reducedMotion ? 0 : pulse(rel, 26.8, 27.2, 29.5, 30.5);
      camera.position.x += Math.sin(time * 37) * 0.22 * quake;
      camera.position.y += Math.sin(time * 41) * 0.16 * quake;
      camera.getWorldDirection(fwd);
      hail.update({ time, pixelRatio, amount: sramp(rel, 26, 27.5), center: camera.position.clone().addScaledVector(fwd, 15) });
      return {
        grade: { bloom: 0.6 + 0.3 * voices + 0.4 * flash, threshold: 0.78 - 0.1 * voices, exposure: 0.95 + 0.25 * voices + 0.3 * flash - 0.15 * judged, tint: [1, 1, 1.02], saturation: 1 - 0.2 * judged },
        audio: {
          drone: 0.35, shimmer: 0.5 + 0.3 * open,
          trumpet: pulse(rel, 0.5, 1.2, 4.5, 6),
          waters: 0.95 * voices + 0.5 * pulse(rel, 11, 12, 19, 20.5),
          wind: 0.4 * judged,
          fire: 0.3 * judged,
          thunder: Math.min(1, 1.3 * flash + 0.5 * quake),
        },
      };
    },
  };
}
