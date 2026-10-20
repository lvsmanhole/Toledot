// Revelation 4, through John's eyes. A door opened in heaven, high above; the trumpet voice: "Come up
// hither"; he is lifted through it, and stands on the sea of glass before the throne. His gaze goes round the
// throne room in the order of the text: the One who sat (light, jasper and sardine), the emerald rainbow, the
// twenty-four elders, the lightnings and the seven lamps, the sea of glass, the four beasts one by one, their
// "Holy, holy, holy", and the elders casting their crowns before the throne.

import * as THREE from "three";

import { lerp, pulse, sramp } from "../../kit/common.js";
import { EYE, johnEyes } from "../kit/eyes.js";
import { BEAST_R, DAIS, JOHN_Z, elderAngle, ELDER_R, heavenRoom, lookIn } from "../kit/heaven.js";

const RISE = 300; // John is lifted this far, from under the door to the sea of glass

export function create(ctx) {
  const H = heavenRoom(ctx);
  const { scene, camera, elders, beasts } = H;
  // the door opened in heaven (4:1): a doorway of light in the sky over John's head
  const door = new THREE.Mesh(new THREE.PlaneGeometry(9, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(3, 2.8, 2.4), transparent: true, opacity: 0, side: THREE.DoubleSide }));
  door.position.set(0, -60, JOHN_Z - 10);
  door.rotation.x = -Math.PI / 2.6;
  scene.add(door);

  const Y0 = EYE - RISE;
  const E = [0, Y0, JOHN_Z];
  const at = lookIn(-RISE); // a point in the throne room, as seen from the unlifted eye path
  const beastAt = (i) => {
    const a = Math.PI * 0.25 + (i / 4) * Math.PI * 2;
    return at(Math.cos(a) * BEAST_R, DAIS + 1.4, Math.sin(a) * BEAST_R);
  };
  const elderAt = (i) => at(Math.sin(elderAngle(i)) * ELDER_R, 1.2, -Math.cos(elderAngle(i)) * ELDER_R + 4);
  const eyes = johnEyes([
    [0, E, [0, -60, JOHN_Z - 10], 60],
    [3, E, [0, -60, JOHN_Z - 12], 64],
    [6.5, E, at(0, DAIS + 2, 0), 50],
    [9, E, at(0, DAIS + 3, 0), 34],
    [12.5, E, at(0, DAIS + 3.4, 0), 30],
    [14, E, elderAt(0), 44],
    [16.5, E, elderAt(23), 44],
    [18, E, at(0, DAIS + 6, 0), 40],
    [20.5, E, at(0, DAIS + 1, 7.5), 34],
    [22, E, at(0, 0, 24), 46],
    [24, E, at(0, DAIS + 1.5, 0), 40],
    [25.2, E, beastAt(0), 24],
    [26, E, beastAt(1), 24],
    [26.8, E, beastAt(2), 24],
    [27.7, E, beastAt(3), 24],
    [29, E, at(0, DAIS + 3, 0), 52],
    [31.5, E, at(0, DAIS + 2, 0), 54],
    [33, E, elderAt(4), 40],
    [36, E, elderAt(19), 42],
  ], { lifts: [[3, 6.5, RISE]] });

  return {
    scene,
    camera,
    resize(aspect) { camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update({ rel, time, pixelRatio, reducedMotion }) {
      eyes.apply(camera, rel, time, reducedMotion);
      door.material.opacity = pulse(rel, 0.3, 1.5, 5.5, 6.5);
      const show = sramp(rel, 6, 8.5);
      // lightnings and thunderings out of the throne (4:5)
      const strikes = [17.8, 18.6, 19.9, 20.5];
      const lightning = Math.max(0, ...strikes.map((s) => pulse(rel, s, s + 0.05, s + 0.12, s + 0.35)));
      H.tick({ time, pixelRatio, show, rainbow: sramp(rel, 9.5, 11.5), lightning, lampsOn: sramp(rel, 17.5, 19) });
      elders.forEach(({ group, body, crown, home }, i) => {
        group.visible = rel > 13 + (i / 24) * 2.5;
        // they fall down and cast their crowns before the throne (4:10)
        const bow = sramp(rel, 32 + (i % 6) * 0.15, 33.5 + (i % 6) * 0.15);
        body.rotation.x = bow * 0.9;
        const cast = sramp(rel, 32.6 + (i % 6) * 0.15, 34.6 + (i % 6) * 0.15);
        crown.position.set(home.x, lerp(home.y, 0.25, cast) + Math.sin(cast * Math.PI) * 1.2, lerp(home.z, 2.6, cast));
        crown.rotation.x = cast * 2.4;
      });
      beasts.forEach(({ group }, i) => { group.visible = rel > 22 + i * 0.4; });
      const holy = pulse(rel, 28.5, 29.5, 31, 32);
      return {
        grade: { bloom: 0.6 + 0.4 * lightning, threshold: 0.78, exposure: 0.95 + 0.3 * lightning, tint: [1, 1, 1.02] },
        audio: {
          trumpet: pulse(rel, 0.5, 1.5, 5, 6.5), wind: 0.4 * pulse(rel, 2.5, 3.5, 6, 7.5), drone: 0.35 * show, shimmer: 0.6 * show,
          thunder: lightning, waters: 0.35 * holy,
        },
      };
    },
  };
}
