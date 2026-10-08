// Downloads the CC0 assets the journey uses from Poly Haven (https://polyhaven.com, all CC0) into
// journey/public/lib/, which Vite copies into site/lib/. Files already present are skipped. Raw downloads
// stay in .cache/; what ships is packed small (see pack below): skies as a tone-encoded WebP for the visible
// dome plus a 512px HDR for lighting, textures as WebP, models simplified and meshopt-compressed.
// usage: node scripts/fetch-assets.mjs
import { execFileSync } from "node:child_process";
import { copyFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";
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

// ---------------------------------------------------------------- packing
/** Read a Radiance .hdr (RLE or flat scanlines) into linear float RGB. */
function readHDR(path) {
  const b = readFileSync(path);
  let i = b.indexOf("\n\n") + 2;
  const eol = b.indexOf("\n", i);
  const m = /-Y (\d+) \+X (\d+)/.exec(b.slice(i, eol).toString());
  const H = +m[1];
  const W = +m[2];
  i = eol + 1;
  const rgb = new Float32Array(W * H * 3);
  const row = new Uint8Array(W * 4);
  for (let y = 0; y < H; y++) {
    if (b[i] === 2 && b[i + 1] === 2 && ((b[i + 2] << 8) | b[i + 3]) === W) {
      i += 4;
      for (let c = 0; c < 4; c++) {
        for (let x = 0; x < W;) {
          let n = b[i++];
          if (n > 128) { n -= 128; const v = b[i++]; while (n--) row[(x++) * 4 + c] = v; } else { while (n--) row[(x++) * 4 + c] = b[i++]; }
        }
      }
    } else {
      row.set(b.subarray(i, i + W * 4));
      i += W * 4;
    }
    for (let x = 0; x < W; x++) {
      const e = row[x * 4 + 3];
      const s = e ? Math.pow(2, e - 136) : 0;
      for (let c = 0; c < 3; c++) rgb[(y * W + x) * 3 + c] = row[x * 4 + c] * s;
    }
  }
  return { W, H, rgb };
}

/** Write flat (uncompressed) RGBE scanlines; three's HDRLoader reads them. */
function writeHDR(path, { W, H, rgb }) {
  const head = Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${H} +X ${W}\n`);
  const body = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    const r = rgb[p * 3], g = rgb[p * 3 + 1], bl = rgb[p * 3 + 2];
    const v = Math.max(r, g, bl);
    if (v < 1e-32) continue;
    const e = Math.ceil(Math.log2(v) + 1e-9);
    const k = 256 / Math.pow(2, e);
    body[p * 4] = Math.min(255, r * k); body[p * 4 + 1] = Math.min(255, g * k); body[p * 4 + 2] = Math.min(255, bl * k); body[p * 4 + 3] = e + 128;
  }
  writeFileSync(path, Buffer.concat([head, body]));
}

function shrink({ W, H, rgb }, f) {
  const w = W / f, h = H / f, out = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < 3; c++) {
    let s = 0;
    for (let dy = 0; dy < f; dy++) for (let dx = 0; dx < f; dx++) s += rgb[((y * f + dy) * W + x * f + dx) * 3 + c];
    out[(y * w + x) * 3 + c] = s / (f * f);
  }
  return { W: w, H: h, rgb: out };
}

/**
 * A sky ships as <key>_sky.webp (2k, each channel stored as sqrt(L / (1 + L)) so the full range of the
 * photograph survives 8 bits; the dome shader decodes it) and <key>_env.hdr (512 x 256, for lighting,
 * the sun's direction and the sky's brightness).
 */
async function packSky(key) {
  const sky = join(OUT, "hdri", `${key}_sky.webp`);
  const env = join(OUT, "hdri", `${key}_env.hdr`);
  if (existsSync(sky) && existsSync(env)) return;
  mkdirSync(join(OUT, "hdri"), { recursive: true });
  const img = readHDR(join(CACHE, "hdri", `${key}.hdr`));
  const px = Buffer.alloc(img.W * img.H * 3);
  for (let i = 0; i < px.length; i++) { const l = img.rgb[i]; px[i] = Math.round(Math.sqrt(l / (1 + l)) * 255); }
  // near-lossless: an ordinary lossy encode shows its blocks once the sky is magnified on the dome
  await sharp(px, { raw: { width: img.W, height: img.H, channels: 3 } }).webp({ nearLossless: true, quality: 60 }).toFile(sky);
  writeHDR(env, shrink(img, img.W / 512));
}

async function packTexture(name, map) {
  const dst = join(OUT, "tex", `${name}.webp`);
  if (existsSync(dst)) return;
  mkdirSync(join(OUT, "tex"), { recursive: true });
  // colour takes ordinary lossy compression; normal and ARM maps are data, kept at higher quality
  await sharp(join(CACHE, "tex", `${name}.jpg`)).webp({ quality: map === "diff" ? 82 : 90 }).toFile(dst);
}

let fetched = 0;
const credits = [];
for (const [key, { id, res }] of Object.entries(HDRIS)) {
  const files = await json(API + id);
  const f = files.hdri[res].hdr;
  if (await download(f.url, join(CACHE, "hdri", `${key}.hdr`))) fetched++;
  await packSky(key);
  credits.push(id);
}
for (const [key, { id, res = "1k" }] of Object.entries(TEXTURES)) {
  const files = await json(API + id);
  const maps = { diff: files.Diffuse ?? files.diff, nor: files.nor_gl, arm: files.arm };
  for (const [map, entry] of Object.entries(maps)) {
    if (!entry) continue;
    const f = entry[res].jpg ?? entry[res].png;
    if (await download(f.url, join(CACHE, "tex", `${key}_${map}.jpg`))) fetched++;
    await packTexture(`${key}_${map}`, map);
  }
  credits.push(id);
}
for (const [key, { id, res = "1k", ratio = 0.05, error = 0.01 }] of Object.entries(MODELS)) {
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
    "--simplify-ratio", String(ratio), "--simplify-error", String(error), "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024"], { stdio: "inherit" });
  fetched++;
}
// the trees' photographed leaf atlases, for foliage cards (the scans' own leaf geometry is too heavy)
for (const [key, { id, leaves }] of Object.entries(MODELS)) {
  if (!leaves) continue;
  const src = join(CACHE, key, "textures", `${id}_leaves_diff_1k.jpg`);
  const dst = join(OUT, "tex", `${key}_leaves.webp`);
  if (existsSync(src) && !existsSync(dst)) await sharp(src).webp({ quality: 88 }).toFile(dst);
}
writeFileSync(join(OUT, "CREDITS.txt"), `Assets from Poly Haven (https://polyhaven.com), CC0 1.0 Universal.\n${credits.map((c) => `- ${c}`).join("\n")}\n`);
console.log(`assets ready in ${OUT} (${fetched} files downloaded)`);
