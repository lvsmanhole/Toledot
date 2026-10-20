import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ACTS, CAPTIONS, LENGTH, SCENES, envelope, locate, yearAt } from "../src/story.js";
import * as journey from "../src/story.js";
import { layout } from "../src/storyline.js";
import { checkStory } from "./storyline-checks.mjs";

const kjv = JSON.parse(readFileSync(new URL("./fixtures/kjv.json", import.meta.url), "utf8"));

test("journey story", (t) => checkStory(t, journey, kjv));

test("layout derives the same story from the scene list", () => {
  const again = layout(journey.SCENES.map(({ from, to, ...s }) => s));
  assert.equal(again.LENGTH, LENGTH);
  assert.deepEqual(again.ACTS, ACTS);
  assert.deepEqual(again.CAPTIONS.map((c) => [c.from, c.to]), CAPTIONS.map((c) => [c.from, c.to]));
  assert.equal(again.locate(500).scene.id, locate(500).scene.id);
});

test("story years never run backwards across scenes", () => {
  let last = -Infinity;
  for (const s of SCENES) {
    if (!s.years) continue;
    if (s.meanwhile) last = s.years[0][1]; // a declared step back ("in the days when the judges ruled")
    for (const [rel, y] of s.years) {
      assert.ok(rel >= 0 && rel <= s.length, `${s.id} anchor at ${rel}`);
      assert.ok(y >= last, `${s.id}: year ${y} is earlier than ${last}`);
      last = y;
    }
  }
});

test("acts are ordered and inside the story", () => {
  for (let i = 1; i < ACTS.length; i++) assert.ok(ACTS[i].at > ACTS[i - 1].at, ACTS[i].title);
  assert.ok(ACTS.at(-1).title.startsWith("Revelation"));
});

test("envelope, locate and yearAt", () => {
  assert.equal(envelope(0, 1, 5), 0);
  assert.equal(envelope(3, 1, 5), 1);
  assert.equal(locate(10).scene.id, "cosmos");
  assert.equal(locate(26).fade, 1);
  assert.equal(locate(LENGTH).scene.id, "newcreation");
  assert.equal(yearAt(5), null);
  const flood = SCENES.find((s) => s.id === "flood");
  assert.equal(Math.round(yearAt(flood.from + 30)), -3265);
});
