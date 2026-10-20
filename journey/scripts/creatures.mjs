// Makes the Revelation's generated creatures with fal.ai: concept images first (the user picks one), then a
// textured 3D model from the chosen image, packed small for the browser into assets/creatures/<key>.glb.
// Spending is capped: nothing runs without FAL_KEY or past the ceiling the user agreed (PRICES.ceiling).
// usage: node scripts/creatures.mjs cost <key...> | concept <key> [n=4] | model <key> --from <png> | pack <key>
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";

import { CREATURES, PRICES, STYLE } from "../src/revelation/creatures.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, ".cache", "creatures");
const OUT = join(ROOT, "assets", "creatures");
const SPENT = join(CACHE, "spent.json"); // running total of what generation has cost, kept outside git
export const LIMITS = { triangles: 60000, bytes: 4 * 1024 * 1024 };

/** The full prompt for a creature: its own description, every feature the text gives, and the shared style. */
export function buildPrompt(key) {
  const k = CREATURES[key];
  if (!k) throw new Error(`no creature "${key}"`);
  return `${k.prompt} ${k.features.map((f) => `${f}.`).join(" ")} (Revelation ${k.verse}) ${STYLE}`;
}

/** Estimated dollars for these creatures at the recorded prices. */
export function estimate(keys, { concepts = 4, meshes = 2 } = {}) {
  return keys.length * (concepts * PRICES.image.each + meshes * PRICES.mesh.each);
}

const spent = () => (existsSync(SPENT) ? JSON.parse(readFileSync(SPENT, "utf8")).total : 0);
function charge(amount) {
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(SPENT, JSON.stringify({ total: Math.round((spent() + amount) * 1000) / 1000 }));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Stop before any request unless there is a key and the run stays inside the agreed ceiling. */
function guard(cost) {
  if (!process.env.FAL_KEY) fail("Set FAL_KEY (fal.ai dashboard → Keys) before generating.");
  const ceiling = process.env.CREATURES_CEILING !== undefined ? Number(process.env.CREATURES_CEILING) : PRICES.ceiling;
  if (ceiling === null || ceiling === undefined) fail("No spending ceiling has been agreed yet (PRICES.ceiling in src/revelation/creatures.js).");
  if (spent() + cost > ceiling) fail(`This would pass the agreed ceiling of $${ceiling} (spent $${spent().toFixed(2)}, this run $${cost.toFixed(2)}).`);
}

/** Run one request through the fal queue and return its result. */
async function fal(endpoint, input) {
  const headers = { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
  const res = await fetch(`https://queue.fal.run/${endpoint}`, { method: "POST", headers, body: JSON.stringify(input) });
  if (!res.ok) fail(`${endpoint}: ${res.status} ${await res.text()}`);
  const { status_url, response_url } = await res.json();
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    const s = await (await fetch(status_url, { headers })).json();
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.error) fail(`${endpoint}: ${JSON.stringify(s)}`);
  }
  return (await fetch(response_url, { headers })).json();
}

async function download(url, path) {
  const res = await fetch(url);
  if (!res.ok) fail(`${url}: ${res.status}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

async function triangles(file) {
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).read(file);
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      n += (idx ? idx.getCount() : prim.getAttribute("POSITION").getCount()) / 3;
    }
  }
  return n;
}

/** Simplify, compress and size-check the raw model into assets/creatures/<key>.glb; nothing is left on failure. */
export async function pack(key) {
  const raw = join(CACHE, key, "raw.glb");
  if (!existsSync(raw)) fail(`${raw} is missing (run: model ${key} --from <png>)`);
  const ratio = Math.min(1, LIMITS.triangles / (await triangles(raw)));
  mkdirSync(OUT, { recursive: true });
  const tmp = join(CACHE, key, "packed.glb");
  execFileSync(process.execPath, [join(ROOT, "node_modules", "@gltf-transform", "cli", "bin", "cli.js"), "optimize", raw, tmp,
    "--simplify-ratio", String(Math.max(0.001, ratio * 0.97)), "--simplify-error", "0.01", "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024"], { stdio: "inherit" });
  const tris = await triangles(tmp);
  const bytes = statSync(tmp).size;
  if (tris > LIMITS.triangles || bytes > LIMITS.bytes) {
    rmSync(tmp);
    fail(`${key}: ${Math.round(tris)} triangles, ${(bytes / 1048576).toFixed(1)} MB is over the limit (${LIMITS.triangles}, 4 MB).`);
  }
  renameSync(tmp, join(OUT, `${key}.glb`));
  console.log(`${key}: ${Math.round(tris)} triangles, ${(bytes / 1048576).toFixed(2)} MB -> assets/creatures/${key}.glb`);
}

async function main([command, ...args]) {
  if (command === "cost") {
    const keys = args.length ? args : Object.keys(CREATURES);
    console.log(`estimate for ${keys.length} creatures (4 concepts, 2 meshes each): $${estimate(keys).toFixed(2)}`);
    console.log(`spent so far: $${spent().toFixed(2)}; ceiling: ${PRICES.ceiling === null ? "not agreed" : `$${PRICES.ceiling}`}`);
    return;
  }
  const key = args[0];
  if (!CREATURES[key]) fail(`no creature "${key}"`);
  if (command === "concept") {
    const n = Number(args[1] ?? 4);
    guard(n * PRICES.image.each);
    for (let i = 1; i <= n; i++) {
      const out = await fal(PRICES.image.endpoint, { ...PRICES.image.input, prompt: buildPrompt(key), seed: 1000 + i });
      charge(PRICES.image.each);
      await download(out.images[0].url, join(CACHE, key, `concept-${i}.png`));
      console.log(`concept-${i}.png`);
    }
  } else if (command === "model") {
    const from = args[args.indexOf("--from") + 1];
    if (!from || !existsSync(join(CACHE, key, from))) fail(`--from <concept png in .cache/creatures/${key}/> is required`);
    guard(PRICES.mesh.each);
    const image = `data:image/png;base64,${readFileSync(join(CACHE, key, from)).toString("base64")}`;
    const out = await fal(PRICES.mesh.endpoint, { ...PRICES.mesh.input, image_url: image });
    charge(PRICES.mesh.each);
    await download(out.model_glb.url, join(CACHE, key, "raw.glb"));
    await pack(key);
  } else if (command === "pack") {
    await pack(key);
  } else {
    fail("usage: node scripts/creatures.mjs cost <key...> | concept <key> [n] | model <key> --from <png> | pack <key>");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
