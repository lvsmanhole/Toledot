import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { test } from "node:test";

import { CREATURES } from "../src/revelation/creatures.js";

test("every creature names its verse and its features", () => {
  for (const [key, c] of Object.entries(CREATURES)) {
    assert.match(c.verse, /^\d+:\d+(-\d+)?$/, key);
    assert.ok(c.features.length > 0, `${key} has no features`);
  }
});

test("every approved creature has its model, at most 4 MB", () => {
  for (const [key, c] of Object.entries(CREATURES)) {
    if (c.status !== "approved") continue;
    const file = new URL(`../assets/creatures/${key}.glb`, import.meta.url);
    assert.ok(existsSync(file), `${key}.glb missing`);
    assert.ok(statSync(file).size <= 4 * 1024 * 1024, `${key}.glb is over 4 MB`);
  }
});
