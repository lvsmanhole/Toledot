# The Revelation Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `/revelation/`, a scroll-driven 3D page that shows the Book of Revelation through John's eyes, event by event. This plan details slice 1 (the engine, the page, the creature pipeline and chapters 1–5) and outlines slices 2–5.

**Architecture:** The Journey's director (`journey/src/main.js`) is generalised to run any story: a scene list, captions, acts and scene modules. The Journey and Revelation become two Vite entry pages that share the director and the kit. Revelation scenes live in `journey/src/revelation/`. Creatures are generated 3D models made by a script against fal.ai, committed as compressed GLBs in `journey/assets/creatures/`, then folded into the existing asset pipeline so `model(key)` loads them like the Poly Haven scans.

**Tech Stack:** Three.js 0.186, Vite 8, Node 22 test runner, @gltf-transform/cli, the fal.ai queue REST API, and the KJV text from eBible.org (`eng-kjv_vpl`).

**Spec:** `docs/superpowers/specs/2026-10-19-revelation-project-design.md`. The spec's Scene Inventory is the acceptance checklist for every scene task.

## Global Constraints

- Every quoted caption is exact KJV text, checked by `captionMatches` against `tests/fixtures/kjv.json`.
- No interpretation: no labels that identify any figure with a historical person, nation or church. Only the text's own explanations appear (1:20, 17:9–18).
- God on the throne has no human form: light, "like a jasper and a sardine stone", with an emerald rainbow. The Son of Man and the rider have human form, and their faces are light with no drawn features.
- Names the text gives are readable exactly as KJV prints them. Names the text doesn't give are glowing marks that cannot be read.
- All ages: nothing explicit. No nudity, no close-up wounds, no gore. The text's terrors are shown through scale, distance, fire and darkness.
- Point of view: after scene `patmos` turns, the camera is John's eyes. **[John]** beats in the inventory use the eyes kit (Task 6).
- The Journey must behave exactly as before every task. `npm test` stays green, and its pages look the same at the check points in Task 2.
- Phones: one scene in memory at a time, gradual compile, `scaled()` budgets for multitudes. Each creature GLB is at most 60k triangles and 1024 px textures on desktop, and at most 20k triangles and 512 px textures on phones.
- No creature appears in a scene until its manifest status is `"approved"`. The user approves every creature against its verse.
- No fal.ai generation runs until the user has agreed a spending ceiling (Task 5). The script refuses to start a run that would pass the ceiling.
- Headless screenshots: always `?q=low`, at most 4 frames per batch, `browse stop` after each batch, never left running.
- Commits are authored `tailo <tailormade.gibson@gmail.com>`. This repo has no git identity configured, so pass `-c user.name=tailo -c user.email=tailormade.gibson@gmail.com`. End each message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Pushing to `main` deploys the site (Cloudflare Pages). Never push without the user's go-ahead.

## Review Focus

1. **Visiting `/revelation` without the trailing slash, or deep-linking `/revelation/#u=120`.** Assets and `lib/` must resolve to the site root, not `/revelation/lib/`. The library base is set explicitly, tested in Task 2.
2. **Journey regression after the director split.** The Chronicle, the end card, the deep links and the WebGL fallback must all still work. Task 2 checks the generic story tests and four screenshots.
3. **A scene referencing a creature that is pending or missing.** The build must fail in tests, not show a blank at runtime. Covered by `scenes use only approved creatures` in Task 4.
4. **A creature file too heavy for an iPhone.** Covered by the triangle and texture limits checked in `creatures.mjs pack` (Task 5) and the file-size test in Task 4.
5. **A missing `FAL_KEY` or an exhausted budget during generation.** The script stops with a clear message and leaves no half-written GLB. Tested in Task 5.

---

## File map

| File | Responsibility |
|---|---|
| `journey/src/storyline.js` (new) | `layout(scenes)`: derives from/to, LENGTH, ACTS, CAPTIONS, TRANSITIONS, `locate`, `yearAt`; `envelope` |
| `journey/src/story.js` | Journey scene list only; derives its exports through `layout` |
| `journey/src/director.js` (new) | the body of today's `main.js`, as `runDirector(options)` |
| `journey/src/main.js` | Journey entry: three lines calling `runDirector` |
| `journey/src/kit/library.js` | gains `setLibraryBase(href)` |
| `journey/revelation/index.html` (new) | Revelation page shell (no Chronicle) |
| `journey/src/revelation/main.js` (new) | Revelation entry |
| `journey/src/revelation/story.js` (new) | Revelation scene list (`covers`, `creatures` fields) |
| `journey/src/revelation/scenes/index.js` + one module per scene (new) | Revelation scene factories |
| `journey/src/revelation/kit/eyes.js` (new) | John's point of view: eye rig, fall and lift, hands |
| `journey/src/revelation/kit/heaven.js` (new) | shared throne-room builder (throne, rainbow, lamps, sea of glass, elders' ring). Used again in slices 2–5 |
| `journey/src/revelation/creatures.js` (new) | creature manifest: key, verse, features checklist, prompt, status, cost |
| `journey/scripts/creatures.mjs` (new) | `concept`, `model`, `pack` and `cost` commands against fal.ai |
| `journey/assets/creatures/*.glb` (new, committed) | approved, compressed creature models |
| `journey/scripts/fetch-assets.mjs` | copies approved creatures into `public/lib/models` and makes `models-m` |
| `journey/src/audio.js` | new layers `trumpet`, `waters`, `thunder` |
| `journey/tests/storyline-checks.mjs` (new) | generic story checks, run for both stories |
| `journey/tests/story.test.mjs` | Journey-specific checks + generic checks |
| `journey/tests/revelation.test.mjs` (new) | Revelation checks: verse coverage, creatures, generic checks |
| `journey/tests/creatures.test.mjs` (new) | manifest and prompt checks |
| `journey/scripts/kjv-fixture.mjs` | reads captions from both stories |
| `journey/vite.config.js` | two inputs |
| `.github/workflows/ci.yml` | runs the new test files |

---

## Slice 1: the engine, the page, creatures, chapters 1–5

### Task 1: Story layout shared by both stories

**Files:**
- Create: `journey/src/storyline.js`, `journey/tests/storyline-checks.mjs`
- Modify: `journey/src/story.js:622-677` (the derived-layout block moves out), `journey/tests/story.test.mjs`

**Interfaces:**
- Produces: `layout(scenes) -> { SCENES, LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate(u), yearAt(u) }`. It mutates each scene with `from`/`to` exactly as today. `envelope(u, from, to, fade = 1.2)` is exported from `storyline.js` and re-exported from `story.js`.
- Produces: `checkStory(t, story, kjv)` in `tests/storyline-checks.mjs`. It runs the four generic tests (tiling and unique ids; transitions at every scene start; captions in their scene, in order and clear of transitions; KJV match) as `t.test(...)` subtests.
- `story.js` keeps exporting `SCENES, LENGTH, ACTS, CAPTIONS, TRANSITIONS, envelope, locate, yearAt, UNIT_VH` with the same values.

- [ ] **Step 1:** Move the four generic tests from `story.test.mjs` into `checkStory`, and call `test("journey story", (t) => checkStory(t, journey, kjv))` from `story.test.mjs`. Keep the Journey-only tests (years, acts end in "Revelation", the `envelope/locate/yearAt` values) where they are.
- [ ] **Step 2:** Run `npm test` in `journey/`. Expected: FAIL, because `storyline.js` doesn't exist yet and `story.test.mjs` imports it for `layout`. (Write the import first so the failure is real.)
- [ ] **Step 3:** Create `storyline.js` with `layout` and `envelope` (move the code verbatim from `story.js`, closing over the passed `scenes`). In `story.js`: `export const { LENGTH, ACTS, CAPTIONS, TRANSITIONS, locate, yearAt } = layout(SCENES); export { envelope } from "./storyline.js";`.
- [ ] **Step 4:** Run `npm test`. Expected: PASS, with the same test count plus the subtests.
- [ ] **Step 5:** Commit: `journey: story layout shared, ready for a second story`.

### Task 2: The director runs any story

**Files:**
- Create: `journey/src/director.js`
- Modify: `journey/src/main.js` (reduced to an entry), `journey/src/kit/library.js:10`

**Interfaces:**
- Consumes: `layout` output from Task 1.
- Produces: `runDirector({ story, modules, chronicle, libBase, header })`:
  - `story`: the object `story.js` exports (`SCENES, LENGTH, ACTS, CAPTIONS, UNIT_VH, envelope, locate, yearAt`).
  - `modules`: a `{ name: () => Promise<factory> }` map.
  - `chronicle`: `{ data: "data/core.json" }` or `null`. When it is `null` the Chronicle element, toggle and `setYear` calls are skipped.
  - `libBase`: a URL string, resolved against `document.baseURI`.
  - `header`: `null`, or a string written into `#place` every frame instead of the year (Revelation passes `"AD 95 · Patmos"`).
- Produces: `setLibraryBase(href: string)` in `library.js`. It replaces the module constant `BASE`. The default stays `new URL("lib/", document.baseURI)`.
- `window.__journey` keeps its shape.

- [ ] **Step 1:** Move `main.js` lines 1–405 into `director.js` inside `export function runDirector(opts)`. Replace direct uses of the story imports and `MODULES` with `opts.story.*` and `opts.modules`. Guard every `chronicle.*` use with `if (opts.chronicle)`. Call `setLibraryBase(opts.libBase)` before `initLibrary`.
- [ ] **Step 2:** In `main.js`, write `import * as story from "./story.js"; import { MODULES } from "./scenes/index.js"; import { runDirector } from "./director.js"; runDirector({ story, modules: MODULES, chronicle: { data: "data/core.json" }, libBase: "lib/", header: null });`.
- [ ] **Step 3:** Run `npm test && npm run build`. Expected: tests PASS, and the build writes `site/index.html` with no warnings beyond today's.
- [ ] **Step 4:** Regression screenshots. Before this task's commit, `git stash` and capture the Journey at `?q=low&nogate#u=10`, `#u=300`, `#u=900` and the end card (`#u=` LENGTH − 0.3), one batch, then `browse stop`. Repeat on this task's build. Expected: the same frames, with the Chronicle visible and the end card visible.
- [ ] **Step 5:** Commit: `journey: the director runs any story`.

### Task 3: The `/revelation/` page

**Files:**
- Create: `journey/revelation/index.html`, `journey/src/revelation/main.js`, `journey/src/revelation/story.js`, `journey/src/revelation/scenes/index.js`, `journey/src/revelation/scenes/prologue.js` (a placeholder dark sea: `createLandscape` water only, night sky)
- Modify: `journey/vite.config.js` (`build.rollupOptions.input = { journey: "index.html", revelation: "revelation/index.html" }`), `journey/index.html` (end card: add `<a class="btn" href="revelation/">Enter the Revelation</a>`), `journey/tests/revelation.test.mjs` (new)

**Interfaces:**
- Revelation scene spec = the Journey scene shape (`id, module, length, enter, years: null, acts, captions`) plus `covers: string[]` (verse ranges in Revelation, such as `"1:1-8"` or `"4:1"`) and `creatures: string[]` (creature keys from Task 4).
- `revelation/main.js` calls `runDirector({ story, modules: MODULES, chronicle: null, libBase: "../lib/", header: "AD 95 · Patmos" })`.
- `revelation/index.html` is a copy of `journey/index.html` with these changes:
  - the title is "The Revelation · Toledot";
  - no Chronicle section;
  - the header shows `<span id="place">` in place of the Chronicle toggle, and the bar links back to the Journey (`../`);
  - the gate kicker is "The Revelation of Jesus Christ", the title is "I John … was in the isle that is called Patmos", and the note is "Scroll moves the vision forward. Scripture is quoted from the King James Version.";
  - the end card has "Return to the beginning" and "Back to the Journey".

- [ ] **Step 1:** Write `revelation.test.mjs` importing `../src/revelation/story.js` and calling `checkStory`. Add `test("the vision has no years", () => SCENES.every((s) => s.years === null))`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (module not found).
- [ ] **Step 3:** Create the page, entry, story (one scene, `prologue`, length 22, `covers: []`, act `{ label: "Prologue", title: "The Revelation of Jesus Christ", at: 0 }`, one caption `h(3, 9, "The Revelation of Jesus Christ", "Revelation 1:1")`) and the placeholder module.
- [ ] **Step 4:** Run `npm test && npm run build`. Expected: PASS. `site/revelation/index.html` exists, and its script and CSS URLs start with `../assets/`.
- [ ] **Step 5:** Run `npm run preview`. Open `/revelation/?q=low&nogate` and `/revelation?q=low&nogate` (no slash), then `browse stop`. Expected: the dark sea and the caption, and no 404s for `lib/` or `assets/` in the console in either case. If the no-slash URL 404s in preview only, note it; production uses `auto-trailing-slash`.
- [ ] **Step 6:** Commit: `revelation: the page and its first scene`.

### Task 4: Verse coverage, creature manifest and the KJV fixture

**Files:**
- Create: `journey/src/revelation/creatures.js`, `journey/tests/creatures.test.mjs`
- Modify: `journey/tests/revelation.test.mjs`, `journey/scripts/kjv-fixture.mjs`, `journey/tests/fixtures/kjv.json` (regenerated)

**Interfaces:**
- Produces in `revelation/story.js`: `export const CHAPTER_VERSES = [20, 29, 22, 11, 14, 17, 17, 13, 21, 11, 19, 17, 18, 20, 8, 21, 18, 24, 21, 15, 27, 21]` (index 0 is chapter 1; the total is 404), and `export const BUILT = 5` (the chapters built so far; each slice raises it).
- Produces `versesOf(range: string) -> string[]` (`"4:1-3"` → `["4:1","4:2","4:3"]`; `"2-3"` (whole chapters) → every verse of chapters 2 and 3) in `revelation/story.js`.
- Produces in `creatures.js`: `export const STYLE` (the shared style prompt; written in Task 5) and `export const CREATURES = { key: { verse, features: string[], prompt, status: "pending" | "approved", source: "generated", cost: 0 } }`.

- [ ] **Step 1:** Add these tests to `revelation.test.mjs`:
  - `every verse of the built chapters is covered`: the union of `versesOf` over all `covers` equals every verse of chapters 1..`BUILT`, from `CHAPTER_VERSES`.
  - `covers run in text order`: the first verse of each scene's `covers` is not before the last verse of the previous scene's, so every scene starts at or after the previous one's end. Scenes with empty `covers` are skipped.
  - `scenes use only approved creatures`: every key in `creatures` exists in `CREATURES` with `status === "approved"`.
  - `CHAPTER_VERSES sums to 404`.
- [ ] **Step 2:** Add these tests to `creatures.test.mjs`:
  - every creature has a `verse` matching `/^\d+:\d+(-\d+)?$/` and at least one `features` entry;
  - every approved creature has a file `assets/creatures/<key>.glb` of at most 4 MB.
- [ ] **Step 3:** Run `npm test`. Expected: FAIL. The coverage test fails (chapters 1–5 are uncovered), and the other new tests fail until the code exists.
- [ ] **Step 4:** Implement `versesOf`, `CHAPTER_VERSES`, `BUILT` and an empty `CREATURES`. **Temporarily set `BUILT = 0`** until Task 12 raises it to 5, so the suite stays green while scenes are built. Each scene task adds its `covers`.
- [ ] **Step 5:** `kjv-fixture.mjs`: also import `CAPTIONS` from `../src/revelation/story.js`, and also want every verse in `versesOf("1-22")` so all of Revelation is in the fixture once. Download `https://ebible.org/Scriptures/eng-kjv_vpl.zip` into `journey/.cache/kjv/` (gitignored), unzip it, and run `node scripts/kjv-fixture.mjs .cache/kjv/eng-kjv_vpl.txt`. Expected: "wrote N verses", with N = the previous count + 404 − overlap.
- [ ] **Step 6:** Run `npm test`. Expected: PASS.
- [ ] **Step 7:** Commit: `revelation: verse coverage, creature manifest, all of Revelation in the KJV fixture`.

### Task 5: The creature pipeline, the spending ceiling and the style

This task has two **user gates**. Stop and ask at each one.

**Files:**
- Create: `journey/scripts/creatures.mjs`, `journey/assets/creatures/.gitkeep`
- Modify: `journey/src/revelation/creatures.js` (`STYLE`, and `PRICES` with `IMAGE_ENDPOINT` and `MESH_ENDPOINT`), `journey/scripts/fetch-assets.mjs`, `journey/tests/creatures.test.mjs`, `journey/.gitignore` (`.cache/` already covers raw downloads)

**Interfaces:**
- `node scripts/creatures.mjs cost <key...>` prints the estimated spend, the total spent so far (from `CREATURES[*].cost`) and the ceiling (`PRICES.ceiling`).
- `node scripts/creatures.mjs concept <key> [n=4]` makes text-to-image concept views from `buildPrompt(key)` and saves them to `.cache/creatures/<key>/concept-<i>.png`.
- `node scripts/creatures.mjs model <key> --from <png>` runs image-to-3D, saves the raw GLB to `.cache/creatures/<key>/raw.glb`, then runs `pack`.
- `node scripts/creatures.mjs pack <key>` runs `gltf-transform optimize` (meshopt, WebP textures at 1024, simplified to at most 60k triangles) into `assets/creatures/<key>.glb`. It refuses (exit 1, no output file) if the result is over 60k triangles or 4 MB.
- `buildPrompt(key) -> string` is exported from `creatures.mjs` (pure; it joins `STYLE`, `CREATURES[key].prompt` and every `features` entry).
- Every command that calls fal.ai first checks `process.env.FAL_KEY` (if missing: "Set FAL_KEY (fal.ai dashboard → Keys)", exit 1). It also checks that the spend so far plus the estimate stays under `PRICES.ceiling` (if not: "This would pass the agreed ceiling of $X", exit 1).
- It calls the fal queue API: `POST https://queue.fal.run/<endpoint>` with `Authorization: Key $FAL_KEY`, polls the returned `status_url` until `COMPLETED`, then fetches `response_url`.
- `fetch-assets.mjs`: for each approved creature, copy `assets/creatures/<key>.glb` to `public/lib/models/<key>.glb`, and write `public/lib/models-m/<key>.glb` at 512 px textures and at most 20k triangles. Add a line "Generated models (fal.ai), made for Toledot" plus the keys to `CREDITS.txt`.

- [ ] **Step 1:** Write the tests in `creatures.test.mjs`:
  - `buildPrompt includes the style and every feature`;
  - `cost refuses past the ceiling`: spawn `node scripts/creatures.mjs concept x` with `FAL_KEY=dummy` and a test ceiling of 0 (via `CREATURES_CEILING=0`). Expected exit 1 and "ceiling" in stderr;
  - `missing FAL_KEY stops before any request`: expected exit 1 and "FAL_KEY" in stderr.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `creatures.mjs` and the `fetch-assets.mjs` change.
- [ ] **Step 4:** Run `npm test`. Expected: PASS.
- [ ] **Step 5:** Pick endpoints and prices. Look up current fal.ai text-to-image and image-to-3D models and their prices on their fal.ai model pages. Choose one image model that holds a consistent painterly-real style, and one image-to-3D model that outputs textured GLB. Record the endpoints and per-call prices in `PRICES` with the date checked. Write `STYLE`: one paragraph for "ancient, reverent, luminous, real materials (gold, linen, fleece, feather, bronze), no cartoon, no gore, no text". Fill `CREATURES` for every slice-1 creature (list below) with `verse`, `features` copied from the spec's wording, and `prompt`.
- [ ] **Step 6: USER GATE: the ceiling.** Run `cost` for all slice-1 creatures, allowing 4 concepts and 2 mesh attempts each. Show the user the estimate and the price source, and ask for a spending ceiling. Write the agreed number into `PRICES.ceiling`. The user sets `FAL_KEY` in their environment (`! setx FAL_KEY ...`, then restart the session).
- [ ] **Step 7: USER GATE: the style.** Run `concept` for `sonOfMan`, `beastLion` and `lamb`. Show the user the 12 images (copy them into the scratchpad and open them) and ask which style direction to keep. Adjust `STYLE` until they pick one. Commit `STYLE` and the chosen concepts' prompts.
- [ ] **Step 8: USER GATE: each creature.** For every slice-1 creature, run `concept`, then `model --from` the concept the user picks. Show the user a turntable of the result: four `?q=low` frames of a scratch scene that spins the model, then `browse stop`. Show it next to its `features` checklist. Set `status: "approved"` and record `cost` only when the user approves. Regenerate on rejection, staying within the ceiling. Commit approved GLBs in batches.
- [ ] **Step 9:** Commit: `revelation: creature pipeline with a spending ceiling and an agreed style`.

**Slice-1 creatures** (each key with its verse and the features the spec lists):
- `john` (1:9): an old man, exile's plain robe, staff. Used only in the outside shots.
- `johnHands` (1:17): first-person forearms and hands, old, sleeves. Posed in code.
- `sonOfMan` (1:13–16): garment down to the foot; golden girdle about the paps; head and hairs white like wool, as white as snow; eyes as a flame of fire; feet like fine brass burned in a furnace; seven stars in the right hand; a sharp two-edged sword out of the mouth; countenance as the sun shining. The face is left as a smooth surface; light is added in code.
- `elder` (4:4): white raiment, crown of gold; seated pose. Instanced 24 times with small variation in code.
- `elderSeat` (4:4): a seat. `crown` (4:10): a gold crown, cast down separately.
- `beastLion`, `beastCalf`, `beastMan` (a creature with a face as a man, not a man), `beastEagle` (4:7). Generated as bodies only.
- `wingEyes` (4:8): one wing full of eyes. Six are attached per beast in code, and they beat.
- `lamb` (5:6): a lamb as it had been slain (a visible healed wound, no blood), seven horns, seven eyes.
- `angel` (5:2, the strong angel): the base angel for every later angel. Robed, winged, no halo, face in light.
- `sealedBook` (5:1): a scroll written within and on the backside, sealed with seven seals.
- `harp`, `goldenVial` (5:8).
- `keys` (1:18): the keys of hell and of death.
- Procedural, not generated: the candlesticks, the seven stars, the door, the throne's light and rainbow, the lamps, the sea of glass, the angels in multitude (instanced `angel` at low detail), and the church-promise props that are plain objects (white stone, manna, pillar, door). Use the kit (`structures.js`, `effects.js`).

### Task 6: John's eyes

**Files:**
- Create: `journey/src/revelation/kit/eyes.js`, `journey/tests/eyes.test.mjs`

**Interfaces:**
- `fallPose(k: number) -> { height: number, pitch: number }`: at k=0 height is 1.62 and pitch is 0; at k=1 height is 0.3 and pitch is −1.2 (radians, face toward the ground); smooth in between.
- `johnEyes(keys, { falls = [], lifts = [] })`, where `keys` are `cameraRig` keyframes at eye height, each fall is `[start, end, recover]` in scene units and each lift is `[start, end, dy]`. Returns `{ apply(camera, rel, time, reducedMotion) }`. It adds breathing sway of 0.6 cm (none when reduced motion is on), applies `fallPose` during falls and rises during lifts.
- `hands(camera) -> { group, pose(name: "rest" | "reach" | "write" | "shield" | "touched", k: number) }`. It loads `model("johnHands")` and parents it to the camera. The scene must add the camera to its scene graph.

- [ ] **Step 1:** Test `fallPose(0)` deep-equals `{ height: 1.62, pitch: 0 }`. Test that `fallPose(1)` is within 1e-6 of `{ height: 0.3, pitch: -1.2 }`. Test that `fallPose` is monotonic over 0..1 in 20 steps.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `eyes.js`. Until `johnHands` is approved, `hands()` uses a placeholder of two robed-arm capsules built from `figures.js` materials.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit: `revelation: John's eyes`.

### Task 7: Sound layers

**Files:** Modify `journey/src/audio.js`.

**Interfaces:** `LAYERS` gains `"trumpet"`, `"waters"` and `"thunder"`. All are synthesised, as the existing layers are. Scenes set them 0..1 in `audio`.
- `trumpet`: a brass-like tone, swelling, recognisable each time.
- `waters`: a deep roar of many waters, distinct from `water`.
- `thunder`: each rise from 0 above 0.5 fires one thunder clap. Seven separate rises are seven claps (needed in slice 2 for 10:3).

- [ ] **Step 1:** Implement the three layers.
- [ ] **Step 2:** Run `npm test`. Expected: PASS (the Journey's levels never set the new layers, so it sounds the same).
- [ ] **Step 3:** Check by ear in `npm run dev` with a scratch scene. Report to the user that this was a manual check.
- [ ] **Step 4:** Commit: `journey: trumpet, many waters and thunder in the ambience`.

### Tasks 8–12: The scenes of chapters 1–5

Each scene task follows the same steps:
1. Add the scene to `revelation/story.js` with its length, transition, acts, KJV captions, `covers` and `creatures`, and register its module.
2. Run `npm test`. Expected: PASS (KJV match, order, coverage of these verses). Coverage is checked fully only when Task 12 sets `BUILT = 5`.
3. Build the module.
4. Run `npm run build && npm run preview`. Capture one `?q=low&nogate#u=…` frame per inventory bullet, at most 4 per batch, then `browse stop` after each batch. Tick every bullet of the spec's inventory for these verses against the frames, and list any that aren't visible as defects to fix before committing.
5. Commit.

Captions are chosen by the builder. Every inventory bullet needs a caption or an unmistakable visual.

**Task 8: `prologue` (1:1–8), length ≈ 22.** This is a title sequence with no point of view: night sea, clouds massing ("he cometh with clouds"), and one light descending, the angel of 1:1. The light becomes the camera's guide down to the island. No figure. Act: Prologue.

**Task 9: `patmos` (1:9–11), ≈ 20.** It opens outside John: a wide shot over the sea, down to `john` on the rocks at first light ("the Lord's day"). The Spirit beat changes the light and lowers ambience. The trumpet voice comes from behind (`trumpet` layer), and the seven churches are named in the caption. During the last third the camera moves into John's eyes (`johnEyes`), facing away from the voice. Act: "I · The Son of Man".

**Task 10: `sonofman` (1:12–20), ≈ 34.** The turn (yaw 180° with `johnEyes`). Seven gold candlesticks (procedural, from the current Journey `patmos.js` with real stands), with `sonOfMan` in their midst. Each feature of 1:13–16 is lit in turn, and `waters` plays for the voice. The fall: `falls: [[17, 19, 23]]`. Then the right hand (`hands.pose("touched")`) and "Fear not". `keys` are held out at 1:18. The seven stars rise to stand above the seven candlesticks for 1:20, with the caption giving the explanation.

**Task 11: `churches` (2–3), ≈ 90, one module with seven beats of about 12 units each and a 6-unit map opening.**
- The map opening uses `createMapScene` with a new program `churches`: Patmos, then Ephesus → Smyrna → Pergamos → Thyatira → Sardis → Philadelphia → Laodicea, in order along the road, with coordinates added to `src/data/geo.js`.
- Each beat brings its candlestick and star forward. It shows a short glimpse of the city (the `city()` kit on its terrain), the title of Christ as the caption, the charge, and the promise object: tree of life, crown of life, hidden manna and white stone, morning star, white raiment, pillar, and "I stand at the door, and knock" with a door and three knocks.
- Ephesus's candlestick flickers at "remove thy candlestick". "Jezebel" and Antipas appear only as words in captions; no figures.
- Act: "II · The Seven Churches".

**Task 12: `door` (4) ≈ 36 and `lamb` (5) ≈ 40, sharing `kit/heaven.js`.**
- `heavenRoom({ quality })` builds the throne, and returns handles for each part so scenes can reveal them in order.
  - The throne itself is light in jasper and sardine colours, with no figure, inside a procedural emerald rainbow (`effects.rainbow`).
  - 24 `elderSeat` and `elder` instances, and seven lamps of fire (`flame`).
  - A crystal sea of glass (`createWater` with zero wave and a high metalness tint).
  - Four beasts, each with six `wingEyes` beating.
  - Lightnings with `thunder`.
- `door`: "Come up hither" (trumpet). John is lifted through the door (`lifts`). The parts appear in the text's order. The "Holy, holy, holy" cycle loops, and the elders cast their `crown`s.
- `lamb`: the `sealedBook` in the right hand of the light. The strong `angel` proclaims. John weeps: a blur grade with tears, through `grade.blur` (add it to `post.js` if it's missing, default 0). The elder says "Weep not … the Lion". The camera looks for a lion, then finds the `lamb` (the expectation turn is the beat). The Lamb takes the book. Harps and `goldenVial`s, and the new song. The angels in multitude: instanced `angel`, `scaled(20000)`. Then every creature: the `ANIMALS` herds, birds, and a fish shoal under a sea surface. "Amen".
- Act: "III · The Throne and the Lamb".
- **Raise `BUILT` to 5.** Run `npm test`. Expected: PASS, so every verse of chapters 1–5 is covered.

### Task 13: Ship slice 1

- [ ] **Step 1:** Run `npm test && npm run build`. Expected: PASS, and the build is clean.
- [ ] **Step 2: Phone pass.** Run `npm run preview` and open `?m=1&q=low` at an iPhone viewport (390×844). Scroll the whole of `/revelation/` in 4-frame batches with `browse stop` between them. Expected: no `webglcontextlost`, no console errors, and the loading veil never stays longer than 3 s. Record the `entry.buildMs` and `compileMs` of each scene from `window.__journey.loaded`.
- [ ] **Step 3:** Spec self-check. Go through the inventory for 1:1–5:14 and the cast list items for these chapters, and tick each one with the frame that shows it.
- [ ] **Step 4:** Add `node --test journey/tests/revelation.test.mjs journey/tests/creatures.test.mjs journey/tests/eyes.test.mjs` to `.github/workflows/ci.yml`. CI never runs `creatures.mjs` generation.
- [ ] **Step 5:** Commit: `revelation: slice 1, Patmos to the Lamb`. **Ask the user before pushing** (a push deploys).
- [ ] **Step 6:** Update the memory file `journey-realism-remaining.md` or add `revelation-progress.md` saying where slice 1 stands.

---

## Slices 2–5 (outline; each gets its own detailed plan when the previous slice ships)

Each slice repeats the same loop:
1. Fill `CREATURES` for its cast and get them approved, within the ceiling (raise it with the user if needed).
2. Build its scenes as in Tasks 8–12.
3. Raise `BUILT`.
4. Do a phone pass, then ship.

The scene ids and chapter coverage follow the spec's inventory numbering.

- **Slice 2: chapters 6–11 (`BUILT = 11`).**
  - Scenes: horsemen, altar souls, sixth seal, sealing, multitude, censer (with the designed half-hour silence), trumpets 1–4, woe angel, pit and locusts, Euphrates horsemen, the little book, the witnesses, the seventh trumpet.
  - New creatures: four horses and riders (Death; Hell following), `locust`, `lionHorse`, `abaddon`, `mightyAngel`, `witness`, idols (gold, silver, brass, stone, wood).
  - Kit: `kit/multitude.js` (instanced crowds of 10⁴–10⁵ at `scaled` budgets) and `kit/cosmic.js` (sun darkened, moon as blood, falling stars, heaven rolled as a scroll).
- **Slice 3: chapters 12–16 (`BUILT = 16`).**
  - Scenes: woman and dragon, war in heaven, eagle's wings and flood, beast from the sea, beast from the earth, Mount Sion, the three angels, harvest and winepress, sea of glass with fire, the seven vials (Armageddon gathered).
  - New creatures: `woman` (clothed with the sun), `dragon` (seven heads, ten horns, seven crowns), `michael`, `beastSea` (with crowns on its horns), `beastEarth`, `imageOfBeast`, `frogSpirit`, `eagleWings`, `sickleOneOnCloud`.
  - Readable text: the number "Six hundred threescore and six" in a caption.
- **Slice 4: chapters 17–20 (`BUILT = 20`).**
  - Scenes: the whore on the scarlet beast (all ages, as the spec stages it), the angel's explanation, the fall of Babylon (with the cargo list and the sounds that cease), Alleluia, the marriage supper, the rider and the armies, the fowls (kept distant), the binding, the thousand years, Gog and Magog, the great white throne.
  - New creatures: `scarletBeast`, `whore` (clothed per 17:4), `millstoneAngel`, `rider` and `whiteHorse`, `armies`, `chainAngel`.
  - Readable in-scene text: MYSTERY, BABYLON THE GREAT…, and KING OF KINGS, AND LORD OF LORDS (a `textSprite` on her forehead and on his vesture and thigh).
- **Slice 5: chapters 21–22 (`BUILT = 22`).**
  - Scenes: new heaven and earth, the descent of the city, the city measured (twelve gates of pearl with twelve angels and twelve tribe names, and twelve foundations in the 21:19–20 order, each named), the river and tree of life, the epilogue, and the last shot back on Patmos with John's hand finishing the scroll.
  - New creatures: `gateAngel` (a variant of `angel`), `treeOfLife`.
  - Finally: the Journey's `newcreation` scene gets a link to `/revelation/`, and a full-length phone pass is run.
