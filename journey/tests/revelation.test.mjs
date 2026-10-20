import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import * as revelation from "../src/revelation/story.js";
import { checkStory } from "./storyline-checks.mjs";

const kjv = JSON.parse(readFileSync(new URL("./fixtures/kjv.json", import.meta.url), "utf8"));
const { SCENES } = revelation;

test("revelation story", (t) => checkStory(t, revelation, kjv));

test("the vision has no years", () => {
  assert.ok(SCENES.every((s) => s.years === null));
});
