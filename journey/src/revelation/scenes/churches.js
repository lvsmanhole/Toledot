// Revelation 2–3, the seven letters, through John's eyes on Patmos. The Son of Man stands in the midst of
// the seven candlesticks; for each church in turn John's gaze goes to its candlestick, with its star (its
// angel, 1:20) above it, and what the letter promises "to him that overcometh" appears in the light over it:
// the tree of life; the crown of life; hidden manna and a white stone with a new name no man can read; the
// rod of iron, the potter's vessels broken, and the morning star; white raiment and the book of life; an
// open door, the crown held fast, and a pillar in the temple; a door knocked upon, and a throne.

import * as THREE from "three";

import { glowSprite, lerp, pulse, sramp } from "../../kit/common.js";
import { MATERIALS } from "../../kit/structures.js";
import { figure } from "../../kit/figures.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { JOHN, patmos } from "../kit/island.js";
import { crown, elderSeat, goldenVial, keys as keysProp } from "../kit/standins.js";
import { LETTERS, letterStart } from "../story.js";
import { candlestick } from "./sonofman.js";


const std = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...opts });
const at = (obj, x, y, z) => { obj.position.set(x, y, z); return obj; };

/** A mark of light that cannot be read: a name the text says is written but does not give. */
function unreadableName(scale = 0.25) {
  const s = glowSprite(0xfff3d0, scale, 0);
  s.scale.set(scale * 1.8, scale * 0.45, 1);
  return s;
}

// what each letter shows, built small around its candlestick's top; `show(k, local, time)` per letter
function promises() {
  return [
    // Ephesus: the candlestick threatened (2:5), the tree of life (2:7)
    () => {
      const g = new THREE.Group();
      g.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.7, 8), std(0x5a4030)), 0, 0.35, 0));
      const crownOfTree = at(new THREE.Mesh(new THREE.SphereGeometry(0.42, 18, 14), std(0x3f6a2c, { emissive: 0x0e2008 })), 0, 0.85, 0);
      g.add(crownOfTree);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.add(at(glowSprite(0xffc860, 0.12, 0.9), Math.cos(a) * 0.4, 0.8 + Math.sin(i) * 0.15, Math.sin(a) * 0.4));
      }
      return { group: g, at: 11.6, lift: 0, size: 1.6 };
    },
    // Smyrna: the crown of life (2:10)
    () => ({ group: crown(), at: 8.1 }),
    // Pergamos: the hidden manna and the white stone with a new name written (2:17)
    () => {
      const g = new THREE.Group();
      g.add(at(goldenVial(), -0.25, 0, 0));
      const stone = at(new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 14), std(0xf4f2ec, { roughness: 0.3 })), 0.25, 0.1, 0);
      stone.scale.set(1, 0.55, 1);
      g.add(stone, at(unreadableName(0.18), 0.25, 0.2, 0.16));
      return { group: g, at: 11.6 };
    },
    // Thyatira: the rod of iron and the vessels of a potter broken to shivers (2:27), the morning star (2:28)
    () => {
      const g = new THREE.Group();
      const rod = at(new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 10), std(0x3a3632, { metalness: 0.8 })), -0.3, 0.3, 0);
      rod.rotation.z = 0.5;
      g.add(rod);
      for (let i = 0; i < 9; i++) {
        const shard = at(new THREE.Mesh(new THREE.TetrahedronGeometry(0.06 + (i % 3) * 0.02), std(0x9a5a3a)), 0.1 + (i % 3) * 0.12, -0.05 + Math.floor(i / 3) * 0.05, -0.15 + (i % 4) * 0.1);
        shard.rotation.set(i, i * 2, i * 3);
        g.add(shard);
      }
      const star = at(glowSprite(0xfff6e8, 0.9, 1), 0, 0.45, 0);
      star.name = "morningStar";
      g.add(star);
      return { group: g, at: 8.1 };
    },
    // Sardis: white raiment (3:4–5), the book of life
    () => {
      const g = new THREE.Group();
      const robe = figure(0.9, { robe: 0xf6f4ee, beard: false });
      g.add(at(robe, -0.25, -0.3, 0));
      g.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.2), std(0x6a4a2a)), 0.3, 0.1, 0));
      return { group: g, at: 8.1 };
    },
    // Philadelphia: the key of David (3:7), an open door (3:8), the crown held fast (3:11), the pillar with the
    // name of God and of new Jerusalem written on it (3:12)
    () => {
      const g = new THREE.Group();
      const key = at(keysProp(), -0.6, 0.2, 0);
      key.name = "key";
      const door = new THREE.Group();
      door.name = "door";
      door.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), MATERIALS.gold()), -0.3, 0.6, 0));
      door.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 0.06), MATERIALS.gold()), 0.3, 0.6, 0));
      door.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.06, 0.06), MATERIALS.gold()), 0, 1.2, 0));
      door.add(at(new THREE.Mesh(new THREE.PlaneGeometry(0.54, 1.14), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2, 1.7), transparent: true, opacity: 0.9, side: THREE.DoubleSide })), 0, 0.6, 0));
      const c = at(crown(), 0.7, 0.4, 0);
      c.name = "crown";
      const pillar = at(new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 1.4, 20), std(0xe6e0d4, { roughness: 0.5 })), 0, 0.7, 0);
      pillar.name = "pillar";
      pillar.add(at(unreadableName(0.22), 0, 0.2, 0.2), at(unreadableName(0.22), 0, -0.1, 0.2));
      g.add(key, door, c, pillar);
      return { group: g, at: 0.5, lift: 0.4, size: 1.2 };
    },
    // Laodicea: gold tried in the fire, white raiment, eyesalve (3:18); the door knocked upon (3:20); the throne
    // (3:21)
    () => {
      const g = new THREE.Group();
      const gold = at(glowSprite(0xffb040, 0.6, 1), -0.5, 0.3, 0);
      gold.name = "gold";
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.4, 0.08), std(0x5a3e26));
      door.name = "door";
      at(door, 0, 0.7, 0);
      const seat = at(elderSeat(), 0, 0, 0);
      seat.name = "throne";
      seat.scale.setScalar(1.1);
      seat.rotation.y = Math.PI; // its seat toward John
      g.add(gold, door, seat);
      return { group: g, at: 4.3, lift: 0, size: 1.4 };
    },
  ];
}

export function create(ctx) {
  const [jx, jz] = JOHN;
  const C = [jx - 16, jz];
  const L = patmos(ctx, {
    sky: () => [[0.3, "morning"], [0.7, "dusk"]],
    camera: [[0, [jx, 30, jz], [jx - 20, 25, jz], 50], [1, [jx, 30, jz], [jx - 20, 25, jz], 50]], // replaced by John's eyes
    keepAboveGround: false,
    grade: () => ({ bloom: 0.45, threshold: 0.85, exposure: 0.85, tint: [1.04, 1, 0.94] }),
    audio: (rel) => ({ water: 0.25, wind: 0.15, drone: 0.3, shimmer: 0.45, waters: 0.25 }),
  });
  const h = L.height;
  const G = h(jx, jz);
  const gc = h(C[0], C[1]);
  const E = [jx, G + EYE, jz];

  const ring = new THREE.Group();
  ring.position.set(C[0], gc, C[1]);
  L.add(ring);
  const him = cast("sonOfMan", 2.4);
  him.rotation.y = Math.PI / 2;
  ring.add(him);
  const face = glowSprite(0xfff6e0, 1.1, 0.6);
  face.position.set(0.26, 2.2, 0);
  ring.add(face);
  // the candlesticks, ordered so the first letter's stands nearest John's left and the rest go round
  const stands = [];
  const made = promises();
  for (let i = 0; i < 7; i++) {
    const a = Math.PI * 0.35 + (i / 7) * Math.PI * 2;
    const s = candlestick(i);
    s.group.position.set(Math.cos(a) * 4.5, 0, Math.sin(a) * 4.5);
    ring.add(s.group);
    const star = glowSprite(0xfff8e8, 0.8, 0.6);
    star.position.set(s.group.position.x, 3.4, s.group.position.z);
    ring.add(star);
    const p = made[i]();
    p.group.position.set(s.group.position.x + 1.3, p.lift ?? 2.25, s.group.position.z);
    p.group.rotation.y = Math.PI / 2;
    p.group.visible = false;
    ring.add(p.group);
    stands.push({ ...s, star, promise: p });
  }
  const glow = new THREE.PointLight(0xfff0d8, 0, 14, 1.6);
  ring.add(glow);

  // John's gaze: to each candlestick in turn, framed so the light above it sits over the caption
  const keys = [[0, E, [C[0], gc + 1.6, C[1]], 44]];
  stands.forEach(({ group }, i) => {
    const t0 = letterStart(i);
    const target = [C[0] + group.position.x + 0.6, gc + 2.0, C[1] + group.position.z];
    keys.push([t0 + 0.8, E, target, 26], [t0 + LETTERS[i] - 0.8, E, target, 24]);
  });
  keys.push([letterStart(7), E, [C[0], gc + 1.6, C[1]], 44]);
  const eyes = johnEyes(keys);
  L.scene.add(L.camera);

  L.onUpdate(({ rel, time, reducedMotion, camera }) => {
    eyes.apply(camera, rel, time, reducedMotion);
    stands.forEach(({ group, flame, star, promise }, i) => {
      const t0 = letterStart(i);
      const local = rel - t0;
      const now = pulse(rel, t0, t0 + 1, t0 + LETTERS[i] - 0.5, t0 + LETTERS[i] + 0.5);
      flame.material.uniforms.uTime.value = time;
      // Ephesus: "I will … remove thy candlestick out of his place, except thou repent" (2:5)
      const threat = i === 0 ? pulse(local, 8.2, 9.2, 10.6, 11.4) : 0;
      group.position.y = threat * 0.5;
      flame.material.uniforms.uAmount.value = (0.55 + 0.45 * now) * (1 - 0.8 * threat * (0.5 + 0.5 * Math.sin(time * 18)));
      star.material.opacity = 0.35 + 0.65 * now;
      star.scale.setScalar(0.8 + 0.6 * now);
      const p = promise.group;
      const show = sramp(local, promise.at, promise.at + 1.2) * (1 - sramp(local, LETTERS[i] - 0.4, LETTERS[i] + 0.4));
      p.visible = show > 0.01;
      p.scale.setScalar(Math.max(0.001, show) * (promise.size ?? 1.7));
      p.rotation.y = Math.PI / 2 + Math.sin(time * 0.4) * 0.2;
      // within the letter, its parts come in their order
      const part = (name, from, to = LETTERS[i]) => { const o = p.getObjectByName(name); if (o) o.visible = local > from && local < to; };
      if (i === 3) part("morningStar", 11.6);
      if (i === 5) { part("key", 0, 4.3); part("door", 4.3, 8.1); part("crown", 8.1, 11.6); part("pillar", 11.6); }
      if (i === 6) {
        part("gold", 8.1, 11.6); part("door", 11.6, 15.2); part("throne", 15.2);
        // three knocks on the door (3:20)
        const d = p.getObjectByName("door");
        if (d) d.position.z = [12.4, 12.9, 13.4].some((k) => local > k && local < k + 0.12) ? -0.04 : 0;
      }
    });
    glow.intensity = 30;
  });
  return L;
}
