// Downloads the CC0 assets the journey uses from Poly Haven (https://polyhaven.com, all CC0) into
// journey/public/lib/, which Vite copies into site/lib/. Files already present are skipped.
// usage: node scripts/fetch-assets.mjs
import { execFileSync } from "node:child_process";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";

import { HDRIS, MODELS, TEXTURES } from "../src/kit/assets-manifest.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "lib");
const CACHE = join(ROOT, ".cache", "polyhaven"); // raw scans, never shipped
const API = "https://api.polyhaven.com/files/";

async function json(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

async function download(url, path) {
  if (existsSync(path)) return false;
  mkdirSync(dirname(path), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  return true;
}

let fetched = 0;
const credits = [];
for (const [key, { id, res }] of Object.entries(HDRIS)) {
  const files = await json(API + id);
  const f = files.hdri[res].hdr;
  if (await download(f.url, join(OUT, "hdri", `${key}.hdr`))) fetched++;
  credits.push(id);
}
for (const [key, { id, res = "1k" }] of Object.entries(TEXTURES)) {
  const files = await json(API + id);
  const maps = { diff: files.Diffuse ?? files.diff, nor: files.nor_gl, arm: files.arm };
  for (const [map, entry] of Object.entries(maps)) {
    if (!entry) continue;
    const f = entry[res].jpg ?? entry[res].png;
    if (await download(f.url, join(OUT, "tex", `${key}_${map}.jpg`))) fetched++;
  }
  credits.push(id);
}
for (const [key, { id, res = "1k", ratio = 0.05 }] of Object.entries(MODELS)) {
  const out = join(OUT, "models", `${key}.glb`);
  credits.push(id);
  if (existsSync(out)) continue;
  const files = await json(API + id);
  const g = files.gltf[res].gltf;
  // the .gltf plus its .bin and textures, kept in the relative layout the .gltf expects
  const src = join(CACHE, key, `${id}.gltf`);
  await download(g.url, src);
  for (const [rel, inc] of Object.entries(g.include ?? {})) await download(inc.url, join(CACHE, key, rel));
  // scans are millions of triangles: simplify, quantize and compress for the browser
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(process.execPath, [join(ROOT, "node_modules", "@gltf-transform", "cli", "bin", "cli.js"), "optimize", src, out,
    "--simplify-ratio", String(ratio), "--simplify-error", "0.01", "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024"], { stdio: "inherit" });
  fetched++;
}
// the trees' photographed leaf atlases, for foliage cards (the scans' own leaf geometry is too heavy)
for (const [key, { id, leaves }] of Object.entries(MODELS)) {
  if (!leaves) continue;
  const src = join(CACHE, key, "textures", `${id}_leaves_diff_1k.jpg`);
  const dst = join(OUT, "tex", `${key}_leaves.jpg`);
  if (existsSync(src) && !existsSync(dst)) copyFileSync(src, dst);
}
writeFileSync(join(OUT, "CREDITS.txt"), `Assets from Poly Haven (https://polyhaven.com), CC0 1.0 Universal.\n${credits.map((c) => `- ${c}`).join("\n")}\n`);
console.log(`assets ready in ${OUT} (${fetched} files downloaded)`);
