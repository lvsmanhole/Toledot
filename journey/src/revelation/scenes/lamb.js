// Revelation 5, through John's eyes, in the throne room. The book in the right hand of him that sat, sealed
// with seven seals; a strong angel cries "Who is worthy?"; no one is able, and John weeps (the view swims).
// An elder: "Weep not: behold, the Lion of the tribe of Juda". John looks for a lion, and sees a Lamb as it had
// been slain, with seven horns and seven eyes, standing in the midst. The Lamb takes the book; the beasts and
// elders fall down with harps and golden vials of odours; the new song; angels ten thousand times ten
// thousand round about; every creature in heaven, on earth, under the earth and in the sea; "Amen".

import * as THREE from "three";

import { glowSprite, glowTexture, pulse, sramp } from "../../kit/common.js";
import { scaled } from "../../kit/budget.js";
import { herd } from "../../kit/figures.js";
import { weather } from "../../kit/effects.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { DAIS, ELDER_R, JOHN_Z, elderAngle, heavenRoom } from "../kit/heaven.js";

/** A soft point of light per angel, many thousands of them, rank above rank round about the throne. */
function multitude(count, seed = 5) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const tier = r();
    const a = Math.PI * 0.55 + r() * Math.PI * 1.9;
    const rad = 24 + tier * 160;
    pos.set([Math.sin(a) * rad, 2 + tier * tier * 140 + r() * 6, -Math.cos(a) * rad + 4], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xfff6e6, size: 0.9, sizeAttenuation: true, map: glowTexture(), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  return new THREE.Points(geo, mat);
}

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, elders, beasts } = H;
  const E = [0, EYE, JOHN_Z];
  const handOfHim = new THREE.Vector3(2.4, DAIS + 2.6, 0.6); // the right hand of him that sat (light only)

  const book = cast("sealedBook", 0.16);
  book.scale.setScalar(3);
  scene.add(book);
  const bookGlow = glowSprite(0xffe8c0, 1.6, 0.5);
  scene.add(bookGlow);
  // the strong angel (5:2), to the left of the throne
  const angel = cast("angel", 3.4);
  angel.position.set(-9, DAIS, 10);
  angel.lookAt(0, DAIS, JOHN_Z);
  scene.add(angel);
  const angelFace = glowSprite(0xfff4e0, 0.9, 0.8);
  angelFace.position.set(-9, DAIS + 3.1, 10.2);
  scene.add(angelFace);
  // the Lamb, in the midst of the throne and of the four beasts and of the elders (5:6)
  const lamb = cast("lamb", 1.25);
  lamb.position.set(0, DAIS, 4.2);
  lamb.rotation.y = -Math.PI / 2; // facing John (+z); the stand-in's head is toward +x
  scene.add(lamb);
  const lambGlow = glowSprite(0xffffff, 3, 0);
  lambGlow.position.set(0, DAIS + 0.8, 4.2);
  scene.add(lambGlow);
  // harps and golden vials full of odours, in the hands of the elders (5:8)
  const offerings = elders.map(({ group }, i) => {
    const o = cast(i % 2 ? "goldenVial" : "harp", i % 2 ? 0.12 : 0.36);
    o.position.set(0, 1.0, 0.45);
    o.visible = false;
    group.add(o);
    return o;
  });
  // the odours, the prayers of saints, rising
  const incense = weather("snowstars", { count: 1200, box: [40, 20, 40] });
  scene.add(incense.points);
  // ten thousand times ten thousand, and thousands of thousands (5:11)
  const host = multitude(scaled(24000, 4000));
  scene.add(host);
  // every creature in heaven, on the earth, under the earth and in the sea (5:13), seen far below the sea of
  // glass as it clears: the beasts of the field, the fowls, the fish
  const below = new THREE.Group();
  below.position.y = -40;
  below.add(herd({ kind: "sheep", count: 60, place: (r) => [-40 + r() * 40, 0 + r() * 50], scale: [2.5, 3] }));
  for (const [kind, x] of [["ox", 5], ["camel", 25], ["lion", -25], ["donkey", 40]]) below.add(herd({ kind, count: 12, place: (r) => [x + r() * 18, 10 + r() * 40], scale: [2.5, 3] }));
  const fowls = herd({ kind: "bird", count: 120, place: (r) => [-80 + r() * 160, -60 + r() * 120], scale: [3, 4] });
  fowls.position.y = 25;
  below.add(fowls);
  below.add(new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x4a5a38, roughness: 1 })));
  const fish = new THREE.InstancedMesh(new THREE.ConeGeometry(0.4, 1.6, 6).rotateZ(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x8aa0b0, metalness: 0.4 }), 300);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 300; i++) fish.setMatrixAt(i, m.makeTranslation(-120 + (i % 30) * 4, 8 + Math.floor(i / 30), 70 + Math.sin(i) * 20));
  below.add(fish);
  scene.add(below);
  const birds = weather("snowstars", { count: 600, box: [200, 60, 200] });
  scene.add(birds.points);

  const elderAt = (i) => [Math.sin(elderAngle(i)) * ELDER_R, 1.4, -Math.cos(elderAngle(i)) * ELDER_R + 4];
  const eyes = johnEyes([
    [0, E, [0, DAIS + 3, 0], 44],
    [1.5, E, [handOfHim.x, handOfHim.y, handOfHim.z], 14],
    [5, E, [handOfHim.x, handOfHim.y - 0.3, handOfHim.z], 16],
    [6, E, [-9, DAIS + 2.2, 10], 30],
    [9, E, [-9, DAIS + 2.4, 10], 28],
    [10.5, E, [0, DAIS + 2, 0], 60],
    [13, E, [0, DAIS - 1, 10], 50],
    [16.5, E, elderAt(2), 26],
    [18.5, E, elderAt(2), 26],
    [19.5, E, [-8, DAIS + 1, 2], 40],
    [20.2, E, [0, DAIS + 2.0, 4.2], 16],
    [23.5, E, [0, DAIS + 1.9, 4.2], 14],
    [24.5, E, [1.2, DAIS + 1.6, 2.4], 22],
    [26.5, E, [0, DAIS + 1.6, 4.2], 26],
    [27.5, E, [0, DAIS + 2, 0], 56],
    [30.5, E, [0, DAIS + 2.5, 0], 56],
    [34, E, [0, 40, -60], 70],
    [37, E, [0, 60, -80], 72],
    [41, E, [0, -40, 30], 60],
    [44.5, E, [10, -40, 20], 58],
    [45.5, E, [0, DAIS + 2, 0], 50],
    [48, E, [0, DAIS + 2, 0], 50],
  ], { falls: [] });

  const tmp = new THREE.Vector3();
  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      H.tick({ time, pixelRatio, show: 1, rainbow: 1, lampsOn: 1 });
      // the book: in his right hand, then taken by the Lamb (5:7)
      const take = sramp(rel, 24.2, 26.2);
      tmp.set(0.1, DAIS + 1.05, 4.2 + 0.35);
      book.position.lerpVectors(handOfHim, tmp, take);
      book.position.y += Math.sin(take * Math.PI) * 1.2;
      bookGlow.position.copy(book.position);
      bookGlow.material.opacity = 0.5 + 0.3 * Math.sin(time * 1.5);
      // the strong angel proclaims
      angel.visible = rel > 4.8 && rel < 13;
      angelFace.material.opacity = angel.visible ? 0.8 : 0;
      angel.position.y = DAIS + 0.25 * Math.sin(time * 0.8);
      // the Lamb stands in the midst
      lamb.visible = rel > 19.8;
      lambGlow.material.opacity = sramp(rel, 19.8, 21) * (0.35 + 0.1 * Math.sin(time * 2));
      // the beasts and the elders fall down before the Lamb (5:8), and again at "Amen" (5:14)
      const fall = pulse(rel, 26.8, 28, 33, 34.5) + pulse(rel, 45, 46, 48, 49);
      elders.forEach(({ body }, i) => { body.rotation.x = Math.min(1, fall) * 0.9; offerings[i].visible = rel > 26.8 && rel < 34.5; });
      beasts.forEach(({ group }, i) => { group.rotation.x = Math.min(1, fall) * 0.25; });
      incense.update({ time, pixelRatio, amount: pulse(rel, 27.5, 29, 33, 35), center: new THREE.Vector3(0, DAIS + 8, 0) });
      // the angels round about the throne
      host.material.opacity = sramp(rel, 33.5, 36) * (1 - 0.6 * sramp(rel, 44.5, 46));
      host.rotation.y = time * 0.004;
      // every creature: the sea of glass clears, and below it the earth and the sea
      const clear = pulse(rel, 40.5, 42, 44.5, 45.5);
      H.sea.material.opacity = 0.86 * (1 - 0.7 * clear);
      below.visible = clear > 0.01;
      birds.update({ time, pixelRatio, amount: clear, center: new THREE.Vector3(0, -20, 0) });
      // John weeps much (5:4): the view swims with tears until the elder speaks
      const tears = pulse(rel, 12.8, 14.2, 16.5, 18);
      return {
        grade: { bloom: 0.6, threshold: 0.78, exposure: 0.95, tint: [1, 1, 1.02], blur: tears * 0.9, saturation: 1 - 0.3 * tears },
        audio: {
          drone: 0.35, shimmer: 0.6, trumpet: pulse(rel, 5.5, 6.2, 8.5, 9.5) * 0.8,
          waters: Math.max(0.5 * pulse(rel, 30.5, 31.5, 33, 34), 0.9 * pulse(rel, 34, 35, 44.5, 46)),
          thunder: pulse(rel, 37.6, 37.8, 38, 38.4),
        },
      };
    },
  };
}
