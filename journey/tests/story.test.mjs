import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { ACTS, CAPTIONS, LENGTH, SCENES, TRANSITIONS, envelope, locate, yearAt } from "../src/story.js";
import { captionMatches, refsOf } from "./kjv-refs.mjs";

const kjv = JSON.parse(readFileSync(new URL("./fixtures/kjv.json", import.meta.url), "utf8"));

test("scenes tile the story without gaps and have unique ids", () => {
  assert.equal(SCENES[0].from, 0);
  assert.equal(SCENES.at(-1).to, LENGTH);
  for (let i = 1; i < SCENES.length; i++) assert.equal(SCENES[i].from, SCENES[i - 1].to);
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
});

test("every scene after the first enters through a transition", () => {
  assert.deepEqual(TRANSITIONS.map((t) => t.at), SCENES.slice(1).map((s) => s.from));
});

test("captions stay inside their scene, in order, clear of transitions", () => {
  for (let i = 0; i < CAPTIONS.length; i++) {
    const c = CAPTIONS[i];
    const scene = SCENES.find((s) => s.id === c.scene);
    assert.ok(c.from < c.to && c.from >= scene.from && c.to <= scene.to, c.text);
    if (i) assert.ok(c.from >= CAPTIONS[i - 1].to, `${c.text} overlaps the previous caption`);
    for (const t of TRANSITIONS) assert.ok(c.to <= t.at - 0.5 || c.from >= t.at + 0.5, `${c.text} crosses the transition at ${t.at}`);
  }
});

test("every scripture caption is the King James text of its reference", () => {
  for (const c of CAPTIONS) {
    if (!c.ref || c.style === "note") continue;
    const refs = refsOf(c.ref);
    if (!refs.length) continue;
    const verses = refs.map((r) => kjv[r]);
    assert.ok(verses.every(Boolean), `${c.ref} missing from the KJV fixture (run scripts/kjv-fixture.mjs)`);
    if (c.text === "The lineage of promise") continue; // a title over a genealogy reference
    assert.ok(captionMatches(c.text, verses), `"${c.text}" is not the KJV text of ${c.ref}`);
  }
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
