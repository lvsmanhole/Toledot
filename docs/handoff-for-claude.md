# Handoff: Bible People Timeline — continue to Revelation

## User's objective and working preferences

Continue the existing project in this workspace toward a detailed, immersive, horizontally scrolling Bible timeline from Genesis through Revelation. The priority is the data model first, followed by the website. The visualization should show people’s lived years and overlaps, with special attention to early Genesis and the Kings/Chronicles periods. Include named people and uniquely identifiable unnamed individuals; do not invent identities for crowds or groups.

The user has explicitly asked that work continue without routine permission/check-in questions. Make sensible implementation decisions and keep going. Do not ask the user to approve ordinary local edits. Preserve transparency: explicit textual dates/ages must remain separate from calculated or editorial calendar placements. When no lifespan dates are given, use a disclosed grade-E estimate, never present it as a fact. The user prefers the recommended approach when a minor choice is needed.

The requested textual scope includes the Septuagint and Ethiopian/Geʽez tradition. Do not claim that a complete Geʽez Bible text is already in the repository: the data foundation currently records witness/citation metadata and selected reviewed passages, not a full imported Ethiopic text.

## Workspace and project architecture

Workspace root:

`C:\Users\tailo\Downloads\DFS\NFL Data\NFL 2025\tools\archive\Projects\Bible Project`

This is currently a Python evidence-data pipeline, not a website. Authored source records are YAML under `data/`; schemas are under `schemas/`; the Python package is under `src/bible_timeline`; tests are under `tests/`; generated JSON/SQLite artifacts and audits are under `generated/`. README has install/verification/build commands. The roadmap is `docs/superpowers/plans/2026-10-05-genesis-to-revelation-roadmap.md`.

Canonical validation commands (Python 3.11):

```powershell
py -3.11 -m pytest -q
py -3.11 -m bible_timeline validate --strict
py -3.11 -m bible_timeline build --output generated
py -3.11 -m bible_timeline report --output generated/reports
git diff --check
```

## State at handoff (updated 2026-10-06)

- Genesis 1–50, Exodus 1–40, Leviticus 1–27, and Numbers 1–36 have chapter-level evidence across Septuagint, Geʽez, and Masoretic witness IDs.
- Numbers has had a person-level completeness review: the twelve spies and fathers, the full Numbers 26 clan list, the Numbers 34 representatives and fathers, Beor, Salu, Peleth, Nun, and uniquely identifiable unnamed people (Num 11:27, 12:1, 15:32-36, 20:14, 21:1, 21:26). New review records live in `data/numbers/review/`, and the Genesis 46 parent links for Gad, Asher, and Benjamin in `data/genesis/37_50/gen46_*.yaml`.
- `tests/test_numbers_census_regressions.py` asserts the reviewed people per chapter, per-witness attestation, and two dataset-wide guards: no alias leaks, and no parent who is under 12 or already dead at a child's display birth.
- Fixed inherited bugs: Reuben's alias "Roubin" had leaked to all of Jacob's children through a YAML anchor; Dishon son of Seir and Dishon son of Anah had been merged; 62 parent/child pairs shared a grade-E bucket year (re-chained with disclosed 30-year editorial generations); Manasseh/Ephraim/Asenath now follow Genesis 41:46-52; Zimri/Cozbi die in the fortieth year, before the Midian campaign; Aaron was removed from Numbers 11 and 28–29.
- Verification at handoff: full suite green, strict validation 0/0, build and reports regenerated.

## Known open items

- Geʽez claims cite Dillmann locators, but name spellings have not been verified reading by reading. Do not show Geʽez spellings in the UI until they are.
- Numbers 26 LXX/Geʽez locators are chapter-level (the Greek clan list is ordered and numbered differently). The LXX omission of Becher (26:35) and the LXX "and before Eleazar the priest" in 36:1 still need checking against Rahlfs–Hanhart.
- Genesis 36:26: the sons of Dishon remain attached to Dishon son of Seir; 1 Chronicles 1:41 places them under Anah's son. Revisit when Chronicles is modeled.
- Agag in Balaam's oracle (Num 24:7) is not modeled; decide whether it is a person or a dynastic title.
- Exodus and Leviticus have not had the same person-by-person audit as Numbers. Run the same kind of chapter-person regression test there.

## Immediate next work

1. Deuteronomy 1–34 (Moses' age 120 and death are explicit at Deut 34:7), then continue in canon order through the historical books, wisdom/prophets, deuterocanonical and Ethiopic broader-canon books, New Testament, and Revelation. For each book, add a chapter-person regression test like the Numbers one.
2. Give extra care to synchronized kings and Chronicles: separate rulers/namesakes unless evidence supports a merge; retain regnal/accession conventions and textual variants; surface uncertainty and overlap.
3. Once coverage is broad and coherent, build the horizontal timeline UI as a consumer of the generated artifacts.

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
