// Extracts the KJV verses that the journey quotes into tests/fixtures/kjv.json.
// usage: node scripts/kjv-fixture.mjs <path to eBible eng-kjv_vpl.txt>
import { readFileSync, writeFileSync } from "node:fs";

import { BOOK_CODES, refsOf } from "../tests/kjv-refs.mjs";
import { CAPTIONS } from "../src/story.js";

const vpl = process.argv[2];
if (!vpl) throw new Error("usage: node scripts/kjv-fixture.mjs <eng-kjv_vpl.txt>");
const want = new Set(CAPTIONS.filter((c) => c.ref).flatMap((c) => refsOf(c.ref)));
const out = {};
for (const line of readFileSync(vpl, "utf8").split(/\r?\n/)) {
  const m = line.match(/^(\S+) (\d+:\d+) (.*)$/);
  if (!m) continue;
  const key = `${m[1]} ${m[2]}`;
  if (want.has(key)) out[key] = m[3].replace(/[[\]¶]/g, "").replace(/\s+/g, " ").trim();
}
const missing = [...want].filter((k) => !(k in out));
if (missing.length) throw new Error(`verses not found: ${missing.join(", ")}`);
writeFileSync(new URL("../tests/fixtures/kjv.json", import.meta.url), `${JSON.stringify(out, Object.keys(out).sort(), 1)}\n`);
console.log(`wrote ${Object.keys(out).length} verses (${Object.keys(BOOK_CODES).length} book names known)`);
