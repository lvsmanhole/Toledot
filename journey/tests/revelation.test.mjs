import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as revelation from "../src/revelation/story.js";
import { CREATURES } from "../src/revelation/creatures.js";
import { checkStory } from "./storyline-checks.mjs";

const kjv = JSON.parse(readFileSync(new URL("./fixtures/kjv.json", import.meta.url), "utf8"));
const { SCENES } = revelation;

test("revelation story", (t) => checkStory(t, revelation, kjv));

test("the vision has no years", () => {
  assert.ok(SCENES.every((s) => s.years === null));
});

const { BUILT, CHAPTER_VERSES, versesOf } = revelation;
const order = (ref) => { const [c, v] = ref.split(":").map(Number); return c * 1000 + v; };

test("CHAPTER_VERSES sums to 404", () => {
  assert.equal(CHAPTER_VERSES.length, 22);
  assert.equal(CHAPTER_VERSES.reduce((a, b) => a + b, 0), 404);
});

test("versesOf reads verse ranges and whole chapters", () => {
  assert.deepEqual(versesOf("4:1-3"), ["4:1", "4:2", "4:3"]);
  assert.deepEqual(versesOf("1:9"), ["1:9"]);
  assert.equal(versesOf("2-3").length, 29 + 22);
  assert.equal(versesOf("2-3")[0], "2:1");
  assert.equal(versesOf("2-3").at(-1), "3:22");
  assert.equal(versesOf("5").length, 14);
});

test("every verse of the built chapters is covered", () => {
  const covered = new Set(SCENES.flatMap((s) => s.covers.flatMap(versesOf)));
  const missing = versesOf(`1-${Math.max(1, BUILT)}`).filter((ref) => BUILT && !covered.has(ref));
  assert.deepEqual(missing, []);
});

test("covers run in text order", () => {
  let last = 0;
  for (const s of SCENES) {
    const refs = s.covers.flatMap(versesOf).map(order);
    if (!refs.length) continue;
    assert.ok(Math.min(...refs) >= last, `${s.id} starts before the previous scene ends`);
    last = Math.max(...refs);
  }
});

test("scenes name only creatures in the manifest", () => {
  for (const s of SCENES) for (const key of s.creatures) assert.ok(CREATURES[key], `${s.id}: no creature "${key}"`);
});

// The ship gate: nothing generated is shown unapproved. Run with SHIP=1 before a release.
test("every creature a scene uses is approved", { todo: !process.env.SHIP }, () => {
  for (const s of SCENES) for (const key of s.creatures) assert.equal(CREATURES[key]?.status, "approved", `${s.id}: ${key}`);
});

test("the end card says how far the vision has been made, and gives 22:21 only when it is all made", () => {
  const { endCard } = revelation;
  assert.match(endCard(5).line, /chapters 1–5/i);
  assert.doesNotMatch(endCard(5).line, /22:21/);
  assert.match(endCard(22).line, /Revelation 22:21/);
});
