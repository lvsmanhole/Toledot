import assert from "node:assert/strict";
import { test } from "node:test";

import { ACTS, CAPTIONS, LENGTH, SCENES, TRANSITIONS, envelope, locate } from "../src/script.js";

test("scenes tile the story without gaps", () => {
  assert.equal(SCENES[0].from, 0);
  assert.equal(SCENES.at(-1).to, LENGTH);
  for (let i = 1; i < SCENES.length; i++) assert.equal(SCENES[i].from, SCENES[i - 1].to);
});

test("every scene boundary has a transition", () => {
  const boundaries = SCENES.slice(1).map((s) => s.from);
  assert.deepEqual(TRANSITIONS.map((t) => t.at), boundaries);
});

test("captions are ordered, do not overlap, and scripture carries a reference", () => {
  for (let i = 0; i < CAPTIONS.length; i++) {
    const c = CAPTIONS[i];
    assert.ok(c.from < c.to && c.to <= LENGTH);
    if (i) assert.ok(c.from >= CAPTIONS[i - 1].to, `${c.text} overlaps the previous caption`);
    if (c.style === "verse") assert.match(c.ref, /^Genesis \d+:\d+$/);
  }
});

test("captions do not sit on a scene transition", () => {
  for (const c of CAPTIONS) {
    for (const t of TRANSITIONS) assert.ok(c.to <= t.at - 0.5 || c.from >= t.at + 0.5, `${c.text} crosses ${t.at}`);
  }
});

test("built acts point inside the story in order", () => {
  const built = ACTS.filter((a) => a.built);
  for (let i = 1; i < built.length; i++) assert.ok(built[i].at > built[i - 1].at);
  assert.ok(built.every((a) => a.at >= 0 && a.at < LENGTH));
});

test("envelope and locate", () => {
  assert.equal(envelope(0, 1, 5), 0);
  assert.equal(envelope(3, 1, 5), 1);
  assert.equal(locate(10).scene.id, "cosmos");
  assert.equal(locate(26).fade, 1);
  assert.equal(locate(60).scene.id, "eden");
  assert.equal(locate(LENGTH).scene.id, "eden");
});
