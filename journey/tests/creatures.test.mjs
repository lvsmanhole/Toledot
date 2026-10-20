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

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { buildPrompt, estimate } from "../scripts/creatures.mjs";
import { STYLE } from "../src/revelation/creatures.js";
import { fitToHeight } from "../src/revelation/kit/fit.js";

const script = new URL("../scripts/creatures.mjs", import.meta.url);
const run = (args, env) => spawnSync(process.execPath, [fileURLToPath(script), ...args], { env: { ...process.env, ...env }, encoding: "utf8" });

test("buildPrompt includes the style and every feature", () => {
  const p = buildPrompt("lamb");
  assert.ok(p.includes(STYLE));
  for (const f of CREATURES.lamb.features) assert.ok(p.includes(f), f);
});

test("estimate counts concepts and meshes at the recorded prices", () => {
  const e = estimate(["lamb", "elder"], { concepts: 4, meshes: 2 });
  assert.ok(e > 0);
  assert.equal(Math.round(e * 100), Math.round(estimate(["lamb"], { concepts: 4, meshes: 2 }) * 200));
});

test("missing FAL_KEY stops before any request", () => {
  const r = run(["concept", "lamb"], { FAL_KEY: "" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /FAL_KEY/);
});

test("a run that would pass the ceiling is refused", () => {
  const r = run(["concept", "lamb"], { FAL_KEY: "dummy", CREATURES_CEILING: "0" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /ceiling/);
});

test("fitToHeight stands a model on the ground at the given height, centred", () => {
  const f = fitToHeight({ min: [-1, 2, -3], max: [3, 6, 1] }, 2);
  assert.equal(f.scale, 0.5);
  assert.deepEqual(f.offset, [-0.5, -1, 0.5]);
});
