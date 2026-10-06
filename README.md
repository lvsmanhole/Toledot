# Bible Timeline data foundation

This repository is the evidence-aware data pipeline for an immersive horizontal Bible chronology. The authored corpus covers every chapter from Genesis to Revelation (about 3,500 people) in the Masoretic and Septuagint traditions, with Geʽez witnesses for the Octateuch (Genesis–Ruth); it preserves textual variants instead of hiding them behind a single unexplained date. Every chapter's person inventory is cross-checked against the TIPNR proper-name index and guarded by regression tests (see `tools/ot_census/README.md`). Septuagint presence outside the Pentateuch is recorded at book level (grade C), and Geʽez name spellings are not yet verified reading by reading. The Septuagint deuterocanon, 1 Enoch, and Jubilees have a person census from public-domain translations (claims at confidence B); Meqabyan, Tegsats, Josippon, 4 Baruch, and the Ascension of Isaiah are book-level entries pending a citable edition. The New Testament (Matthew–Revelation, against NA28) has a person census with Gospel-parallel events and Herodian/Roman anchors. The `site/` folder holds the timeline website (Toledot) that reads a bundle generated from this data.

## Install and verify

Python 3.11 or newer is required.

```powershell
py -3.11 -m pip install -e ".[dev]"
py -3.11 -m pytest -q
py -3.11 -m bible_timeline validate --strict
```

Build consumer artifacts and audit reports with:

```powershell
py -3.11 -m bible_timeline build --output generated
py -3.11 -m bible_timeline report --output generated/reports
```

The installed `bible-timeline` command accepts the same subcommands. `validate --strict` fails on semantic errors. Warnings remain reportable but nonfatal unless `--warnings-as-errors` is supplied.

## Website

`site/` holds two parts:

- **The Journey** (landing page, source in `journey/`) is a cinematic, scroll-driven WebGL telling of the whole story, from before the world to the new creation. It's built with Three.js and Vite and has 52 scenes across 26 acts.
  - Every environment is procedural (shaders, particles, simple geometry). Figures appear only as silhouettes.
  - Ambient sound is synthesized in the browser and is off until the visitor turns it on.
  - Scripture is quoted from the King James Version, Apocrypha included for 1 Maccabees. `journey/tests/story.test.mjs` checks every caption against the KJV text in `journey/tests/fixtures/kjv.json`.
  - **The Chronicle**, a ribbon along the bottom of every scene, is the Toledot timeline inside the journey. It shows the people of the current chapters alive around the story's year, with dashed lines for editorial estimates, solid lines for anchored dates, and gold for the line of promise. It also shows the chapters' events and a playhead at the current year. Clicking a name or event opens it in Toledot.
  - Scenes load on demand, so only the current scene and its neighbours stay in memory. `?nogate#u=<unit>` deep-links to any point on the 0–1146 story axis, and `?q=low` forces low quality.
- **Toledot** (`site/timeline/`) is the research timeline of every person. It's dependency-free (ES modules, canvas) and reads the generated bundle in `site/data/`.

Build and serve:

```powershell
py -3.11 -m bible_timeline site            # writes site/data/core.json and details.json
cd journey; npm install; npm run build; cd ..   # writes site/index.html and site/assets/
py -3.11 -m http.server 8765 -d site       # open http://127.0.0.1:8765/
node --test site/timeline/tests/layout.test.mjs journey/tests/story.test.mjs
```

`npm run dev` inside `journey/` serves the journey alone with hot reload; the Chronicle and the timeline links need `site/data/` and the built `site/`. The journey's story lives in `journey/src/story.js`:

- scenes in order with their lengths, transitions, years (following the Toledot chronology) and Chronicle chapters;
- captions and their references;
- the act list shown on the rail.

Shared building blocks (terrain, sky, water, vegetation, architecture, figures, effects, the ancient map) are in `journey/src/kit/`. To refresh the KJV fixture after adding captions, run `node journey/scripts/kjv-fixture.mjs <eng-kjv_vpl.txt>` with eBible.org's `eng-kjv` verse-per-line file.

Each scene in `journey/src/scenes/` returns grade and audio levels per frame, and `journey/src/main.js` directs them.

### Toledot data bundle

`core.json` (about 0.8 MB) holds books and chapters, people with display years and grades, events, and family links. `details.json` (about 3.5 MB) holds claims, citations, witnesses, and sources, and loads after first paint.

Display years are astronomical (1 BCE = 0). Every event says how its year was obtained:

- `dated_claim`: an explicit or anchored date;
- `participants`: placed within the years its participants are alive together, with the youngest taken as an adult;
- `chapter`: placed by the chapters that narrate it.

Lifespans resolved at grade E are drawn dashed and labelled as editorial estimates; synchronized lifespans are solid.

Toledot offers:

- a pan/zoom timeline (drag, Ctrl+scroll or pinch, and the keyboard: arrows, `+`/`-`, `0`, `[`/`]` to step through people, Enter for details);
- book and chapter focus;
- canon filters, and a filter for text-anchored dates only;
- search;
- person and event panels with claims, witnesses and family;
- a Gospel-parallels table, a list view, and a method page.

Selection and filters live in the URL hash. Generated files (`site/data/`, `site/index.html`, `site/assets/`) are not committed.

## Authoritative and generated files

Files below `data/` are authored evidence records and are authoritative. JSON, SQLite, manifests, and reports below a build output directory are generated and may be recreated at any time. JSON and SQLite are deliberately deterministic for review and deployment.

The catalog records works, canon lists and memberships, witnesses, editions, and sources. It represents Protestant 66-book, Septuagint, and Ethiopian Orthodox narrower/broader lists separately. It does not claim that one flattened list is universal. Genesis evidence includes independent LXX, Masoretic, Samaritan, and Geʽez witness metadata; Exodus currently includes LXX, Masoretic, and Geʽez passage review. Chronology models keep numerical variants as distinct claims.

## Stable IDs and contributions

Every top-level record ID is globally unique, lowercase, and stable. Do not recycle an ID after publication. Aliases such as Abram/Abraham, Sarai/Sarah, Jacob/Israel, and Esau/Edom belong on one entity. People who merely share a title or name remain separate unless an explicit identity claim supports merging them.

To add a person:

1. Add an `entities` record with a stable ID, classification, aliases, and at least one source citation.
2. Add the person to the relevant reviewed inventory unit and passage.
3. Author direct textual claims before calculations. Keep differing witnesses as separate claims with their own witness IDs.
4. Add sourced relationships and event participation.
5. Add a model resolution with birth and death derivations, evidence claim IDs, confidence, basis, and a plain-language explanation.
6. Run strict validation, focused tests, the full suite, and rebuild the reports.

Never put a calculated year into an `explicit_text` claim. Editorial windows must use `life_basis: editorial_estimate`, confidence grade E, evidence, and an explanation.

## Confidence and overlap

Confidence A means an explicit textual datum; B is a transparent calculation from explicit data; C and D cover progressively weaker synchronization or historical inference; E is an editorial visualization rule. A definite display year is therefore not automatically a claim of historical certainty.

Reference overlap answers whether two selected display lifespans intersect. Evidenced overlap separately reports `supported`, `possible`, `not_supported`, or `unknown` from boundary ranges. Consumers should show both when uncertainty matters.

The audit output contains:

- `provenance.json`: selected birth/death derivations and their claims and citations.
- `conflicts.json`: unresolved witness variants retained as evidence, not structural errors.
- `coverage.json`: reviewed Genesis inventory units and chapter coverage.
- `validation.json`: deterministic semantic validation results.
