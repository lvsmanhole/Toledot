// Extracts the KJV verses that the Journey and the Revelation quote into tests/fixtures/kjv.json, plus the
// whole Book of Revelation (the Revelation shows every verse of it).
// usage: node scripts/kjv-fixture.mjs <path to eBible eng-kjv_vpl.txt>
import { readFileSync, writeFileSync } from "node:fs";

import { BOOK_CODES, refsOf } from "../tests/kjv-refs.mjs";
import { CAPTIONS } from "../src/story.js";
import { CAPTIONS as REVELATION } from "../src/revelation/story.js";

const vpl = process.argv[2];
if (!vpl) throw new Error("usage: node scripts/kjv-fixture.mjs <eng-kjv_vpl.txt>");
const want = new Set([...CAPTIONS, ...REVELATION].filter((c) => c.ref).flatMap((c) => refsOf(c.ref)));
const out = {};
for (const line of readFileSync(vpl, "utf8").split(/\r?\n/)) {
  const m = line.match(/^(\S+) (\d+:\d+) (.*)$/);
  if (!m) continue;
  const key = `${m[1]} ${m[2]}`;
  if (want.has(key) || key.startsWith("REV ")) out[key] = m[3].replace(/[[\]¶]/g, "").replace(/\s+/g, " ").trim();
}
const missing = [...want].filter((k) => !(k in out));
if (missing.length) throw new Error(`verses not found: ${missing.join(", ")}`);
writeFileSync(new URL("../tests/fixtures/kjv.json", import.meta.url), `${JSON.stringify(out, Object.keys(out).sort(), 1)}\n`);
console.log(`wrote ${Object.keys(out).length} verses (${Object.keys(BOOK_CODES).length} book names known)`);
