// Revelation 7:9–17, through John's eyes, in the throne room. He turns: a great multitude which no man could
// number, of all nations, kindreds, people and tongues, in white robes with palms in their hands, filling the
// sea of glass about him and rising tier on tier beyond it. "Salvation to our God". All the angels round about
// the throne, the elders and the four beasts fall on their faces and worship. One of the elders turns to John:
// "What are these which are arrayed in white robes?" "Sir, thou knowest" (his gaze drops). They have washed
// their robes and made them white (the robes brighten); they serve before the throne, and he dwells among them;
// no hunger, no thirst, no sun nor heat (a soft shade); the Lamb comes down from the midst of the throne to lead
// them to living fountains of waters, and God wipes away all tears (a last gentle light).

import * as THREE from "three";

import { glowSprite, pulse, sramp } from "../../kit/common.js";
import { pillar, setFx } from "../../kit/effects.js";
import { cast } from "../kit/cast.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { DAIS, ELDER_R, JOHN_Z, elderAngle, heavenRoom } from "../kit/heaven.js";
import { lights, whiteMultitude } from "../kit/multitude.js";

const ASKER = 23; // the elder nearest John, on his right

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, elders, beasts } = H;
  const E = [0, EYE, JOHN_Z];

  // the multitude: on the sea of glass about John (a clear way left between him and the throne), and tier on
  // tier beyond it, round about the throne
  const near = (r) => {
    const x = (r() - 0.5) * 130;
    const z = 12 + r() * 86;
    if (Math.hypot(x, z - 30) > 68 || Math.hypot(x, z - 4) < ELDER_R + 3.5 || Math.hypot(x, z - JOHN_Z) < 22) return null; // none close by: up close their few triangles show
    if (z < JOHN_Z + 1 && Math.abs(x) < 2 + (JOHN_Z - z) * 0.3) return null;
    return [x, 0, z];
  };
  const tiers = (r) => {
    const a = r() * Math.PI * 2;
    const rad = 76 + r() * 130;
    return [Math.sin(a) * rad, Math.floor((rad - 76) / 7) * 3.2, -Math.cos(a) * rad + 4];
  };
  const crowd = whiteMultitude({
    count: ctx.quality === "low" ? 4000 : 24000,
    place: (r) => (r() < 0.45 ? near(r) : tiers(r)),
    face: [0, 0],
  });
  scene.add(crowd.group);
  // beyond what can be drawn: more of them, as light, without number
  const beyond = lights({ count: ctx.quality === "low" ? 12000 : 40000, place: (r) => { const p = tiers(r); p[0] *= 1.8; p[2] *= 1.8; p[1] = p[1] * 2.2 + 8; return p; }, size: 1.4, seed: 9 });
  scene.add(beyond);
  // all the angels round about the throne (7:11): one stands near, the rest a host of lights above
  const angel = cast("angel", 3.4);
  const angelAt = new THREE.Group();
  angelAt.position.set(-11, DAIS, 8);
  angelAt.lookAt(0, DAIS, 0);
  angelAt.add(angel);
  scene.add(angelAt);
  const host = lights({ count: ctx.quality === "low" ? 6000 : 18000, place: (r) => { const a = r() * Math.PI * 2; const rad = 22 + r() * 40; return [Math.sin(a) * rad, 14 + r() * 50, -Math.cos(a) * rad]; }, seed: 3 });
  scene.add(host);

  // the Lamb in the midst of the throne (7:17), who comes down to lead them
  const lamb = cast("lamb", 1.25);
  lamb.rotation.y = -Math.PI / 2; // facing John
  const lambGlow = glowSprite(0xffffff, 3, 0);
  scene.add(lamb, lambGlow);
  const path = (k) => {
    const z = 4.2 + k * 16;
    return [0, z < 9 ? DAIS : Math.max(0, DAIS - (z - 9) * 0.9), z];
  };
  // living fountains of waters, springing up among them
  const fountains = [[-14, 24], [12, 26], [-6, 44], [20, 50], [-26, 52], [4, 64]].map(([x, z]) => {
    const f = pillar({ radius: 1.1, height: 14, color: [0.6, 0.85, 1], gain: 1.4, soft: 0.6 });
    f.position.set(x, 0, z);
    scene.add(f);
    return f;
  });
  const shade = new THREE.HemisphereLight(0xe8f0ff, 0x203040, 0);
  scene.add(shade);

  // the asking elder turns from the throne toward John
  const asker = elders[ASKER];
  asker.group.updateMatrixWorld(true);
  const toJohn = asker.group.worldToLocal(new THREE.Vector3(0, 0, JOHN_Z));
  const turnTo = Math.atan2(toJohn.x, toJohn.z);
  const askerAt = [Math.sin(elderAngle(ASKER)) * ELDER_R, 1.5, -Math.cos(elderAngle(ASKER)) * ELDER_R + 4];

  const eyes = johnEyes([
    [0, E, [0, DAIS + 2, 0], 50],
    [1.5, E, [-30, 3, 40], 62],
    [4, E, [30, 4, 50], 62],
    [6.5, E, [0, 20, -60], 66],
    [8, E, [0, DAIS + 3, 0], 54],
    [11.5, E, [0, 24, -20], 66],
    [14, E, [-11, DAIS + 1, 8], 50],
    [17, E, [0, DAIS + 1, 2], 56],
    [21, E, [0, DAIS + 2, 0], 52],
    [22, E, askerAt, 34],
    [25.5, E, askerAt, 32],
    [26.5, E, [askerAt[0] * 0.6, 0.2, (askerAt[2] + JOHN_Z) / 2], 40],
    [29.5, E, [askerAt[0] * 0.8, 0.6, askerAt[2] + 4], 38],
    [30.5, E, askerAt, 34],
    [31.5, E, [-20, 2, 44], 60],
    [35, E, [20, 2, 46], 60],
    [36, E, [0, DAIS + 4, 0], 58],
    [40, E, [0, 30, -40], 66],
    [43.5, E, [0, DAIS + 1, 6], 44],
    [46, E, [0, 1.2, 16], 50],
    [49, E, [0, 2, 0], 56],
  ], { falls: [] });

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      const glory = 1 + 0.4 * pulse(rel, 7, 8, 10.5, 11.5) + 0.5 * sramp(rel, 35.5, 38);
      H.tick({ time, pixelRatio, show: Math.min(1.6, glory), rainbow: 1, lampsOn: 1 });
      // all the angels, the elders and the beasts fall on their faces (7:11–12)
      const fall = pulse(rel, 11.5, 13, 20, 21.5);
      elders.forEach(({ body }, i) => {
        body.rotation.x = fall * 1.25;
        body.rotation.y = i === ASKER ? turnTo * pulse(rel, 21, 22.5, 30.5, 32) : 0;
      });
      beasts.forEach(({ group }) => { group.rotation.x = fall * 0.4; });
      angel.rotation.x = fall * 1.2;
      host.material.opacity = (0.9 - 0.55 * fall) * sramp(rel, 10.5, 12.5);
      host.position.y = -6 * fall;
      beyond.material.opacity = 0.75 * sramp(rel, 1, 5);
      // washed and made white (7:14): the robes brighten
      const white = sramp(rel, 30.5, 33.5);
      crowd.material.emissive.setScalar(0.28 * white);
      // the Lamb comes down to lead them to living fountains of waters (7:17)
      const lead = sramp(rel, 43.5, 48.5);
      lamb.position.set(...path(lead));
      lambGlow.position.set(lamb.position.x, lamb.position.y + 0.8, lamb.position.z);
      lambGlow.material.opacity = 0.35 + 0.1 * Math.sin(time * 2);
      for (const [i, f] of fountains.entries()) setFx(f, { time: time + i, amount: sramp(rel, 44.5 + i * 0.3, 46.5 + i * 0.3) });
      // no sun, nor any heat (7:16): a soft shade over them; then God wipes away all tears
      const soft = sramp(rel, 39.5, 42);
      shade.intensity = 0.8 * soft;
      const tears = pulse(rel, 46.5, 48, 49, 50);
      return {
        grade: { bloom: 0.6 + 0.3 * tears, threshold: 0.78 - 0.1 * soft, exposure: 0.95 + 0.1 * tears, tint: [1 - 0.04 * soft, 1, 1 + 0.03 * soft], saturation: 1 - 0.1 * soft },
        audio: {
          drone: 0.35, shimmer: 0.5 + 0.3 * soft,
          waters: Math.max(0.6 * sramp(rel, 1, 5), 0.95 * pulse(rel, 6.5, 7.5, 10.5, 12), 0.8 * pulse(rel, 16.5, 17.5, 20.5, 21.5)),
          water: 0.6 * sramp(rel, 44.5, 46.5),
        },
      };
    },
  };
}
