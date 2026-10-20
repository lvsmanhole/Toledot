// Makes the Revelation's generated creatures with fal.ai: concept images first (the user picks one), then a
// textured 3D model from the chosen image, packed small for the browser into assets/creatures/<key>.glb.
// Spending is capped: nothing runs without FAL_KEY or past the ceiling the user agreed (PRICES.ceiling).
// usage: node scripts/creatures.mjs cost <key...> | concept <key> [n=4] [first=1] | model <key> --from <png> | pack <key>
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";

import { CREATURES, PRICES, STYLE } from "../src/revelation/creatures.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = join(ROOT, ".cache", "creatures");
const OUT = join(ROOT, "assets", "creatures");
// the running total of what generation has cost: committed beside the models, so clearing .cache cannot reset it
export const SPENT = join(OUT, "spent.json");
export const LIMITS = { triangles: 60000, bytes: 4 * 1024 * 1024 };

/** The full prompt for a creature: its own description, every feature the text gives, and the shared style. */
export function buildPrompt(key) {
  const k = CREATURES[key];
  if (!k) throw new Error(`no creature "${key}"`);
  return `${k.prompt} ${k.features.map((f) => `${f}.`).join(" ")} (Revelation ${k.verse}) ${STYLE}`;
}

/**
 * Approvals that no longer hold: approved creatures with no recorded sha256, or whose model file is not the
 * one the user approved. read(key) returns the model's bytes.
 */
export function approvalProblems(creatures, read) {
  return Object.entries(creatures)
    .filter(([, c]) => c.status === "approved")
    .filter(([key, c]) => !c.sha256 || createHash("sha256").update(read(key)).digest("hex") !== c.sha256)
    .map(([key]) => key);
}

/** A new generation may replace a creature's model only while it is not approved. */
export function mayReplace(spec) {
  return spec.status !== "approved";
}

/** Estimated dollars for these creatures at the recorded prices. */
export function estimate(keys, { concepts = 4, meshes = 2 } = {}) {
  return keys.length * (concepts * PRICES.image.each + meshes * PRICES.mesh.each);
}

const spent = () => (existsSync(SPENT) ? JSON.parse(readFileSync(SPENT, "utf8")).total : 0);
function charge(amount) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(SPENT, JSON.stringify({ total: Math.round((spent() + amount) * 1000) / 1000 }));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

/** Stop before any request unless there is a key and the run stays inside the agreed ceiling. */
function guard(cost) {
  if (!process.env.FAL_KEY) fail("Set FAL_KEY (fal.ai dashboard → Keys) before generating.");
  if (PRICES.ceiling === null || PRICES.ceiling === undefined) fail("No spending ceiling has been agreed yet (PRICES.ceiling in src/revelation/creatures.js).");
  // CREATURES_CEILING (for tests and cautious runs) can only lower the agreed ceiling
  const asked = Number(process.env.CREATURES_CEILING);
  const ceiling = Number.isFinite(asked) ? Math.min(asked, PRICES.ceiling) : PRICES.ceiling;
  if (spent() + cost > ceiling) fail(`This would pass the agreed ceiling of $${ceiling} (spent $${spent().toFixed(2)}, this run $${cost.toFixed(2)}).`);
}

/** Run one request through the fal queue and return its result. */
async function fal(endpoint, input) {
  const headers = { Authorization: `Key ${process.env.FAL_KEY}`, "Content-Type": "application/json" };
  const res = await fetch(`https://queue.fal.run/${endpoint}`, { method: "POST", headers, body: JSON.stringify(input) });
  if (!res.ok) fail(`${endpoint}: ${res.status} ${await res.text()}`);
  const { status_url, response_url } = await res.json();
  const deadline = Date.now() + 20 * 60 * 1000; // a 3D model takes minutes, not hours
  for (;;) {
    await new Promise((r) => setTimeout(r, 3000));
    if (Date.now() > deadline) fail(`${endpoint}: no result after 20 minutes (${status_url})`);
    const res2 = await fetch(status_url, { headers });
    const s = res2.ok ? await res2.json() : null;
    if (!s || !s.status) fail(`${endpoint}: status ${res2.status} ${s ? JSON.stringify(s) : await res2.text()}`);
    if (s.status === "COMPLETED") break;
    if (s.status === "FAILED" || s.error) fail(`${endpoint}: ${JSON.stringify(s)}`);
  }
  const done = await fetch(response_url, { headers });
  if (!done.ok) fail(`${endpoint}: result ${done.status} ${await done.text()}`);
  return done.json();
}

async function download(url, path) {
  const res = await fetch(url);
  if (!res.ok) fail(`${url}: ${res.status}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

export async function triangles(file) {
  // packed models are meshopt-compressed, so reading them back needs the decoder
  await MeshoptDecoder.ready;
  const doc = await new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.decoder": MeshoptDecoder }).read(file);
  let n = 0;
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const prim of mesh.listPrimitives()) {
      const idx = prim.getIndices();
      n += (idx ? idx.getCount() : prim.getAttribute("POSITION").getCount()) / 3;
    }
  }
  return n;
}

/**
 * Fill the texels the 3D step failed to bake. On draped or carved models Trellis can leave blocks of pure
 * black in the colour texture (and its metal-roughness map, where black reads as polished metal); each hole
 * is grown in from its edges with the average of its baked neighbours, in every texture of the material.
 * rgba: the colour texture's pixels; others: the material's other textures, same size. Returns the holes filled.
 */
export function fillUnbaked(rgba, others, width, height) {
  // near-black (darker than any skin or shadow the style paints), and one texel around it: compression leaves a
  // dark rim at each hole's edge
  const dark = new Uint8Array(width * height);
  for (let i = 0; i < dark.length; i++) if (Math.max(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) < 24) dark[i] = 1;
  const hole = new Uint8Array(width * height);
  let left = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let near = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < width && ny < height) near |= dark[ny * width + nx];
    }
    if (near) { hole[y * width + x] = 1; left++; }
  }
  const filled = left;
  const images = [rgba, ...others];
  while (left > 0) {
    const next = [];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!hole[i]) continue;
      const near = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && !hole[ny * width + nx]) near.push(ny * width + nx);
      }
      if (near.length) next.push([i, near]);
    }
    if (!next.length) break;
    for (const [i, near] of next) {
      for (const img of images) for (let c = 0; c < 3; c++) img[i * 4 + c] = Math.round(near.reduce((s, j) => s + img[j * 4 + c], 0) / near.length);
      hole[i] = 0;
      left--;
    }
  }
  return filled;
}

/** Run fillUnbaked over each material of a .glb (raw -> out); prints how much it filled. */
async function repairTextures(raw, out) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(raw);
  for (const m of doc.getRoot().listMaterials()) {
    const base = m.getBaseColorTexture();
    if (!base) continue;
    const others = [m.getMetallicRoughnessTexture()].filter(Boolean);
    const read = async (t) => sharp(Buffer.from(t.getImage())).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const b = await read(base);
    const o = await Promise.all(others.map(read));
    if (o.some((x) => x.info.width !== b.info.width || x.info.height !== b.info.height)) continue;
    const n = fillUnbaked(b.data, o.map((x) => x.data), b.info.width, b.info.height);
    if (!n) continue;
    console.log(`filled ${(100 * n / (b.info.width * b.info.height)).toFixed(1)}% unbaked texels`);
    const write = async (t, { data, info }) => { t.setImage(new Uint8Array(await sharp(data, { raw: info }).png().toBuffer())); t.setMimeType("image/png"); };
    await write(base, b);
    for (const [k, t] of others.entries()) await write(t, o[k]);
  }
  await io.write(out, doc);
}

/** Simplify, compress and size-check the raw model into assets/creatures/<key>.glb; nothing is left on failure. */
export async function pack(key) {
  if (!mayReplace(CREATURES[key])) fail(`${key} is approved; set its status back to "pending" before replacing its model.`);
  const raw = join(CACHE, key, "raw.glb");
  if (!existsSync(raw)) fail(`${raw} is missing (run: model ${key} --from <png>)`);
  const budget = Math.min(LIMITS.triangles, CREATURES[key].tris ?? LIMITS.triangles);
  const ratio = Math.min(1, budget / (await triangles(raw)));
  mkdirSync(OUT, { recursive: true });
  const tmp = join(CACHE, key, "packed.glb");
  const repaired = join(CACHE, key, "repaired.glb");
  await repairTextures(raw, repaired);
  execFileSync(process.execPath, [join(ROOT, "node_modules", "@gltf-transform", "cli", "bin", "cli.js"), "optimize", repaired, tmp,
    "--simplify-ratio", String(Math.max(0.001, ratio * 0.97)), "--simplify-error", "1", "--compress", "meshopt", "--texture-compress", "webp", "--texture-size", "1024"], { stdio: "inherit" });
  const tris = await triangles(tmp);
  const bytes = statSync(tmp).size;
  if (tris > budget || bytes > LIMITS.bytes) {
    rmSync(tmp);
    fail(`${key}: ${Math.round(tris)} triangles, ${(bytes / 1048576).toFixed(1)} MB is over the limit (${budget}, 4 MB).`);
  }
  renameSync(tmp, join(OUT, `${key}.glb`));
  const hash = createHash("sha256").update(readFileSync(join(OUT, `${key}.glb`))).digest("hex");
  console.log(`${key}: ${Math.round(tris)} triangles, ${(bytes / 1048576).toFixed(2)} MB -> assets/creatures/${key}.glb`);
  console.log(`on approval, record in src/revelation/creatures.js: status: "approved", sha256: "${hash}"`);
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
    // first: the number of the first concept (and its seed), to add more without repeating earlier seeds
    const n = Number(args[1] ?? 4);
    const first = Number(args[2] ?? 1);
    guard(n * PRICES.image.each);
    for (let i = first; i < first + n; i++) {
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
    // Trellis splits vertices along texture seams, which no seam-safe simplifier can undo afterwards: ask it for
    // a mesh near the creature's budget instead (in vertices; it allows no fewer than 5000)
    const decimation_target = Math.max(5000, Math.min(LIMITS.triangles, CREATURES[key].tris ?? LIMITS.triangles));
    const out = await fal(PRICES.mesh.endpoint, { ...PRICES.mesh.input, ...CREATURES[key].mesh, image_url: image, decimation_target });
    charge(PRICES.mesh.each);
    await download(out.model_glb.url, join(CACHE, key, "raw.glb"));
    await pack(key);
  } else if (command === "pack") {
    await pack(key);
  } else {
    fail("usage: node scripts/creatures.mjs cost <key...> | concept <key> [n] [first] | model <key> --from <png> | pack <key>");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main(process.argv.slice(2));
