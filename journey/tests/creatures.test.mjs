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
import { PRICES, STYLE } from "../src/revelation/creatures.js";
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

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { approvalProblems, mayReplace } from "../scripts/creatures.mjs";

const sha = (s) => createHash("sha256").update(s).digest("hex");

test("an approval is tied to the exact file that was approved", () => {
  const read = (key) => ({ ok: "the approved bytes", changed: "other bytes", unhashed: "x" })[key];
  const fake = {
    ok: { status: "approved", sha256: sha("the approved bytes") },
    changed: { status: "approved", sha256: sha("the approved bytes") },
    unhashed: { status: "approved" },
    pending: { status: "pending" },
  };
  assert.deepEqual(approvalProblems(fake, read).sort(), ["changed", "unhashed"]);
});

test("an approved model is never overwritten by a new generation", () => {
  assert.equal(mayReplace({ status: "approved" }), false);
  assert.equal(mayReplace({ status: "pending" }), true);
});

test("every approved creature's model is the file the user approved", () => {
  const read = (key) => readFileSync(new URL(`../assets/creatures/${key}.glb`, import.meta.url));
  assert.deepEqual(approvalProblems(CREATURES, read), []);
});

test("every creature has a triangle budget, and the throne room's copies fit a phone", () => {
  for (const [key, c] of Object.entries(CREATURES)) assert.ok(Number.isFinite(c.tris) && c.tris > 0 && c.tris <= 60000, `${key} budget`);
  const T = (key) => CREATURES[key].tris;
  // as placed in kit/heaven.js and scenes/lamb.js: 25 seats (the throne is one), 24 elders (8 of each) and crowns, four beasts
  // with six wings each, the Lamb, the angel, the book, and a harp or a vial in each elder's hands
  const room = 25 * T("elderSeat") + 8 * (T("elder") + T("elderB") + T("elderC")) + 24 * T("crown") + T("beastLion") + T("beastCalf") + T("beastMan") + T("beastEagle")
    + 24 * T("wingEyes") + T("lamb") + T("angel") + T("sealedBook") + 12 * T("harp") + 12 * T("goldenVial");
  assert.ok(room <= 900000, `desktop throne room ${room} triangles`);
  assert.ok(room / 2 <= 300000, `phone throne room ${Math.round(room / 2)} triangles`);
});

test("an override can only lower the agreed ceiling, never raise or replace it", () => {
  // 1000 concepts cost $30: past the agreed ceiling, whatever the override says
  const r = run(["concept", "lamb", "1000"], { FAL_KEY: "dummy", CREATURES_CEILING: "1000" });
  assert.equal(r.status, 1);
  assert.ok(r.stderr.includes(`agreed ceiling of $${PRICES.ceiling} `), r.stderr);
});

test("the record of what has been spent survives clearing the cache", async () => {
  const { SPENT } = await import("../scripts/creatures.mjs");
  assert.ok(!SPENT.includes(".cache"), SPENT);
});

test("texels the 3D step failed to bake are filled from their neighbours, in every map", async () => {
  const { fillUnbaked } = await import("../scripts/creatures.mjs");
  // 5x5: a white colour texture with a black texel in the middle; its roughness map is black there too. The
  // hole and its rim (3x3) are filled from the baked ring around them
  const rgba = new Uint8Array(100).fill(250);
  const rough = new Uint8Array(100).fill(200);
  for (let c = 0; c < 3; c++) { rgba[48 + c] = 0; rough[48 + c] = 0; }
  assert.equal(fillUnbaked(rgba, [rough], 5, 5), 9);
  assert.deepEqual([...rgba.slice(48, 51)], [250, 250, 250]);
  assert.deepEqual([...rough.slice(48, 51)], [200, 200, 200]);
});
