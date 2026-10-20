import assert from "node:assert/strict";
import { test } from "node:test";

import * as THREE from "three";

import { EYE, fallPose, johnEyes } from "../src/revelation/kit/eyes.js";

const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

test("fallPose: standing at 0, face to the ground at 1", () => {
  assert.deepEqual(fallPose(0), { height: 1.62, pitch: 0 });
  const down = fallPose(1);
  assert.ok(near(down.height, 0.3) && near(down.pitch, -1.2), JSON.stringify(down));
});

test("fallPose only ever goes down", () => {
  let last = fallPose(0);
  for (let i = 1; i <= 20; i++) {
    const p = fallPose(i / 20);
    assert.ok(p.height <= last.height && p.pitch <= last.pitch, `step ${i}`);
    last = p;
  }
});

test("johnEyes: a fall lowers the eyes to the ground and a lift raises them", () => {
  const keys = [[0, [0, EYE, 0], [0, EYE, -10], 50], [30, [0, EYE, 0], [0, EYE, -10], 50]];
  const eyes = johnEyes(keys, { falls: [[10, 12, 20]], lifts: [[22, 26, 40]] });
  const cam = new THREE.PerspectiveCamera();
  eyes.apply(cam, 5, 0, true);
  assert.ok(near(cam.position.y, EYE, 1e-3));
  eyes.apply(cam, 15, 0, true);
  assert.ok(near(cam.position.y, 0.3, 1e-3), `fallen: ${cam.position.y}`);
  eyes.apply(cam, 21, 0, true);
  assert.ok(near(cam.position.y, EYE, 1e-3), `risen: ${cam.position.y}`);
  eyes.apply(cam, 28, 0, true);
  assert.ok(near(cam.position.y, EYE + 40, 1e-3), `lifted: ${cam.position.y}`);
});
