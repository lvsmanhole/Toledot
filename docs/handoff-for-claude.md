# Handoff: Bible People Timeline — continue to Revelation

## User's objective and working preferences

Continue the existing project in this workspace toward a detailed, immersive, horizontally scrolling Bible timeline from Genesis through Revelation. The priority is the data model first, followed by the website. The visualization should show people’s lived years and overlaps, with special attention to early Genesis and the Kings/Chronicles periods. Include named people and uniquely identifiable unnamed individuals; do not invent identities for crowds or groups.

The user has explicitly asked that work continue without routine permission/check-in questions. Make sensible implementation decisions and keep going. Do not ask the user to approve ordinary local edits. Preserve transparency: explicit textual dates/ages must remain separate from calculated or editorial calendar placements. When no lifespan dates are given, use a disclosed grade-E estimate, never present it as a fact. The user prefers the recommended approach when a minor choice is needed.

The requested textual scope includes the Septuagint and Ethiopian/Geʽez tradition. Do not claim that a complete Geʽez Bible text is already in the repository: the data foundation currently records witness/citation metadata and selected reviewed passages, not a full imported Ethiopic text.

## Workspace and project architecture

Workspace root: the repository root.

This is a Python evidence-data pipeline plus a static website in `site/` (see README "Website"). Authored source records are YAML under `data/`; schemas are under `schemas/`; the Python package is under `src/bible_timeline`; tests are under `tests/`; generated JSON/SQLite artifacts and audits are under `generated/`. README has install/verification/build commands. The roadmap is `docs/superpowers/plans/2026-10-05-genesis-to-revelation-roadmap.md`.

Canonical validation commands (Python 3.11):

```powershell
py -3.11 -m pytest -q
py -3.11 -m bible_timeline validate --strict
py -3.11 -m bible_timeline build --output generated
py -3.11 -m bible_timeline report --output generated/reports
git diff --check
```

## State at handoff (updated 2026-10-06, Old Testament complete)

- **Hebrew-canon Old Testament (Genesis–Malachi):** every chapter is inventoried, with Masoretic and Septuagint passages and Geʽez for Genesis–Ruth.
  - The person census is cross-checked against the TIPNR proper-name index (STEPBible, CC BY 4.0), giving about 2,900 people.
  - Unnamed individuals, regnal data, dated events and index corrections are curated by hand.
  - Tooling and policies are in `tools/ot_census/README.md`.
- **Septuagint deuterocanon:** Tobit, Judith, Wisdom, Sirach, Baruch, the Letter of Jeremiah, 1–4 Maccabees, 1 Esdras, the Greek additions to Esther and Daniel, the Prayer of Manasseh and Psalm 151.
- **Ethiopic books with a census:** 4 Ezra (Ezra Sutuel), 1 Enoch and Jubilees. The person census comes from public-domain translations (World English Bible; R. H. Charles), giving about 920 people.
- **Ethiopic books with book-level entries only:** Meqabyan 1–3, Tegsats, Josippon, 4 Baruch, Ascension of Isaiah, Odes and Psalms of Solomon. No people are asserted for them.
- **Chronology:**
  - Kings carry Masoretic accession ages and reign lengths (grade A) within synchronized BCE reigns (grade C).
  - Maccabean dates are Seleucid-era text claims, converted to display years at grade C.
  - Everything without an explicit datum is a grade-E display window. Parents are at least 20 years older than their children and alive at their births; lives cap at 100 years unless an age is stated.
  - Jubilees' anno-mundi dates are kept as alternative claims.
- **Guards:**
  - `tests/fixtures/chapter_people_snapshot.json` fails the suite if any chapter loses a person.
  - Dataset-wide tests check alias leaks, parent/child plausibility and that every human has a lifespan.
- **Performance:** YAML is parsed with libyaml, and the test session caches loaded datasets (`tests/conftest.py`). The full suite runs in a few minutes.

## Known open items

- **Septuagint and Geʽez coverage:**
  - Outside the Pentateuch, Septuagint presence for prominent people is book-level and grade C. Verse-level Greek name forms are not recorded.
  - No Geʽez edition is selected for Samuel–Malachi, and Geʽez spellings are unverified everywhere.
- **Deuterocanon checks:**
  - Names and numbering are checked only against an English translation.
  - Still to verify against Rahlfs–Hanhart: the Tobit recension (GI or GII), the Greek Esther/Daniel addition ranges, and Baruch/Letter of Jeremiah chapter numbering.
- **Index-driven decisions to review:**
  - 62 "?"-flagged TIPNR parent links were skipped.
  - 28 links whose two people are never named in the same chapter were skipped. Most are inferences (for example Nahash as Jesse's wife); Isaiah 8:3 is the curated exception.
- **Eponyms:** Jacob/Israel, the tribal patriarchs and clan founders are not inventoried outside the Pentateuch except in genealogies. A few genuine retrospective personal mentions (for example Hosea 12:3 on Jacob) are therefore missing.
- **Identities kept apart deliberately; revisit if better evidence appears:**
  - Sheshbazzar (separate in 1 Esdras; merged with Zerubbabel in the Ezra data).
  - The two Dishons (Gen 36); Phicol (Gen 21/26).
  - Nebuchadnezzar in Judith and Tobit (literary figures).
  - Gabatha and Tharrha (Greek Esther).
- **Textual tensions surfaced, not resolved:**
  - Elishama (Num 1:10) as Joshua's grandfather (1 Chr 7:26-27).
  - Salmon → Boaz (Ruth 4:21), recorded as descent.
  - Judith's genealogy, recorded as descent from Shelumiel.
  - Jochebed "daughter of Levi".
- **Agag in Balaam's oracle (Num 24:7):** now a TIPNR person. Check whether a dynastic-title reading is preferable.

## New Testament (added 2026-10-06)

- **Coverage:** all 27 books, against the NA28 witness. That is about 420 people: 266 new from TIPNR and 49 curated unnamed individuals, plus Old Testament people mentioned retrospectively.
- **Events:** 28 Gospel-parallel events, plus dated events (census of Quirinius, Luke 3:1, crucifixion, Agrippa I's death, Claudius' edict, Gallio).
- **Identity decisions:** listed in `tools/ot_census/README.md`. Isaiah's Immanuel was split from Jesus in commit `b9e098b`.
- **Verification (2026-10-06):**
  - Every TIPNR-derived person/chapter entry is checked against STEPBible's tagged Leningrad (TAHOT) and NA28 (TAGNT) texts: 7,251 entries are verified.
  - 5 entries are removed, because the name is only in TR/Byzantine readings or supplied from the Septuagint.
  - 60 entries are kept for manual review; see `docs/review/tagged-text-review.md`.
  - Claim locators now list only verses where the name is confirmed, and about 4,000 Hebrew/Greek dictionary-form name claims were added.
- **Open:**
  - Manual review of the 60 entries without a tagged occurrence. Examples:
    - James son of Alphaeus is identified with James the younger, and Mary the mother of James with Mary of Clopas; both are traditional, not textual.
    - Arba appears inside the place name Kiriath-arba.
  - No Geʽez New Testament edition is selected.
  - The traditional identifications of epistle authors (James, Jude, Peter) follow TIPNR.

## Immediate next work

1. **Website follow-ups (Phase E is built: `site/`, data from `bible_timeline site`):**
   - an evidence-supported versus reference-year overlap view;
   - a chronology-model switcher once a second model exists;
   - review of TIPNR "persons" that are angels (Michael, Gabriel), which currently draw as lifespans.
2. **Data hardening as the site exposes needs:**
   - Greek and Geʽez name forms;
   - LXX verse-level presence;
   - checking the deuterocanon against Rahlfs–Hanhart.

## Evidence model rules to preserve

- Direct textual claims precede chronology calculations. A `claim` must retain witness, citation, passage/locator, confidence, and whether it is explicit text or an editorial inference.
- Keep differences between Septuagint, Geʽez, Masoretic (and where present Samaritan) claims. Do not silently normalize a spelling or chronology variant.
- Stable IDs are globally unique. Same-name people remain distinct absent explicit identity evidence. Distinguish people from peoples/crowds/groups.
- Parent relationships point from parent (`subject_id`) to child (`object_id`); use source claims/citations. Check parent-child life plausibility when both have selected windows.
- Confidence A is explicit evidence; B is transparent calculation from explicit data; C/D are weaker synchronizations/inferences; E is editorial visualization. Exact-looking BCE/CE years are not automatically historical certainty.
- Keep textual relative dates separate from absolute model dates. Derived display windows must be explainable and visibly marked.
- Respect copyright. Cite public-domain/licensed editions appropriately; do not copy copyrighted full Bible text into the project.

## Handy source anchors

Project witness/source records are authoritative for the data pipeline. Recently consulted text pages include Rahlfs–Hanhart Septuagint Numbers at Deutsche Bibelgesellschaft, including [Numbers 13](https://www.die-bibel.de/bibel/LXX/NUM.13), [Numbers 21](https://www.die-bibel.de/bibel/LXX/NUM.21), [Numbers 25](https://www.die-bibel.de/en/bible/LXX%2CKJV/NUM.25), and the [Swete Septuagint text for Numbers 34](https://biblehub.com/sepd/numbers/34.htm). These browsing pages helped orient the review; continue verifying claims against the precise editions listed in the project catalog. Geʽez material and locators especially need direct review against the cited Dillmann Octateuch edition or an approved Ethiopic witness, rather than inference from English/Greek/Hebrew alone.
