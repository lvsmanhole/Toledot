// Static checks that every creature a Revelation scene draws goes through cast()/creature(), is in the
// manifest, has a stand-in, and is named in that scene's `creatures` list (so the ship gate sees it).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { CREATURES } from "../src/revelation/creatures.js";
import { SCENES } from "../src/revelation/story.js";

const src = (path) => readFileSync(new URL(`../src/revelation/${path}`, import.meta.url), "utf8");

/** Creature keys a source file casts: every string literal in the first argument of cast()/creature(). */
function castKeys(code) {
  const keys = new Set();
  for (const m of code.matchAll(/\b(?:cast|creature)\(([^,)]+)[,)]/g)) for (const s of m[1].matchAll(/"([A-Za-z]+)"/g)) keys.add(s[1]);
  return keys;
}

/** A scene module's keys, including the shared kit it imports (the throne room). */
function sceneKeys(module) {
  const code = src(`scenes/${module}.js`);
  const keys = castKeys(code);
  if (code.includes('from "../kit/heaven.js"')) for (const k of castKeys(src("kit/heaven.js"))) keys.add(k);
  return keys;
}

const standIns = new Set([...src("kit/standins.js").match(/export const STANDINS = \{([^}]*)\}/)[1].matchAll(/([A-Za-z]+)(?=\s*(?:[:,]|$))/g)].map((m) => m[1]));
const built = SCENES.filter((s) => s.module !== "maps");

test("scenes never draw stand-ins directly (only through cast)", () => {
  for (const s of built) assert.ok(!src(`scenes/${s.module}.js`).includes("kit/standins.js"), `${s.module}.js imports stand-ins directly`);
});

test("every creature a scene draws is in the manifest, has a stand-in, and is in its creatures list", () => {
  for (const s of built) {
    for (const key of sceneKeys(s.module)) {
      assert.ok(CREATURES[key], `${s.id}: "${key}" is not in the manifest`);
      assert.ok(standIns.has(key), `${s.id}: "${key}" has no stand-in`);
      assert.ok(s.creatures.includes(key), `${s.id}: draws "${key}" but does not list it`);
    }
  }
});

test("an elder's crown is its own creature, so it can be cast before the throne (4:10)", () => {
  assert.ok(!CREATURES.elder.features.some((f) => /crown/i.test(f)) && !/crown/i.test(CREATURES.elder.prompt), "the elder model would wear a crown");
  const body = src("kit/standins.js").match(/export function elder\(\) \{([\s\S]*?)\n\}/)[1];
  assert.ok(!/crown\(/.test(body), "the elder stand-in wears a crown");
});

test("John's own hands show when he is touched as he lies at his feet (1:17)", () => {
  assert.match(src("scenes/sonofman.js"), /\.pose\("touched"/);
});
