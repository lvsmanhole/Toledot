// Checks every story must pass (the Journey and the Revelation): run as subtests of the caller's test.
import assert from "node:assert/strict";

import { captionMatches, refsOf } from "./kjv-refs.mjs";

export async function checkStory(t, { SCENES, LENGTH, CAPTIONS, TRANSITIONS }, kjv) {
  await t.test("scenes tile the story without gaps and have unique ids", () => {
    assert.equal(SCENES[0].from, 0);
    assert.equal(SCENES.at(-1).to, LENGTH);
    for (let i = 1; i < SCENES.length; i++) assert.equal(SCENES[i].from, SCENES[i - 1].to);
    assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  });

  await t.test("every scene after the first enters through a transition", () => {
    assert.deepEqual(TRANSITIONS.map((tr) => tr.at), SCENES.slice(1).map((s) => s.from));
  });

  await t.test("captions stay inside their scene, in order, clear of transitions", () => {
    for (let i = 0; i < CAPTIONS.length; i++) {
      const c = CAPTIONS[i];
      const scene = SCENES.find((s) => s.id === c.scene);
      assert.ok(c.from < c.to && c.from >= scene.from && c.to <= scene.to, c.text);
      if (i) assert.ok(c.from >= CAPTIONS[i - 1].to, `${c.text} overlaps the previous caption`);
      for (const tr of TRANSITIONS) assert.ok(c.to <= tr.at - 0.5 || c.from >= tr.at + 0.5, `${c.text} crosses the transition at ${tr.at}`);
    }
  });

  await t.test("every scripture caption is the King James text of its reference", () => {
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
}
