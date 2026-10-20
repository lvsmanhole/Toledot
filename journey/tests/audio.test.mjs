import assert from "node:assert/strict";
import { test } from "node:test";

import { LAYERS, thunderClaps } from "../src/audio.js";

test("the trumpet, many waters and thunder are layers", () => {
  for (const name of ["trumpet", "waters", "thunder"]) assert.ok(LAYERS.includes(name), name);
});

test("each rise of the thunder level above one half is one clap", () => {
  const levels = [0, 0.6, 0.9, 0.2, 0.7, 0.1, 0.55, 0.56, 0];
  let prev = 0;
  let claps = 0;
  for (const v of levels) { claps += thunderClaps(prev, v); prev = v; }
  assert.equal(claps, 3);
});
