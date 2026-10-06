# Genesis-to-Revelation Data and Site Roadmap

> **For agentic workers:** Execute natively and book-by-book. Keep the reviewed tests, provenance, strict validation, reproducible build, and full test suite at every milestone.

**Goal:** Build the evidence-aware people-and-events timeline and immersive horizontal website across the Bible from Genesis through Revelation, including Ethiopic broader/narrower and Septuagint corpora.

**Architecture:** Continue the current YAML → schema/semantic validation → chronology resolution → JSON/SQLite/report pipeline. Add source-reviewed Scripture slices in canonical sequence; connect identities across works without merging namesakes by assumption. Once substantial, coherent data coverage exists, implement the website as a separate consumer of the published artifacts.

**Tech Stack:** Python 3.11+, PyYAML, JSON Schema, pytest, deterministic JSON/SQLite publisher; web stack selected from workspace state when the site phase begins.

**Spec:** `docs/superpowers/specs/2026-10-05-biblical-chronology-data-foundation-design.md`

## Global constraints

- Named individuals and uniquely identifiable unnamed individuals are included; crowds and peoples remain groups.
- Claims retain their witness, source, and passage; textual variants and uncertain identities remain explicit.
- Every selected lifespan year is traceable. Unsupported years are clearly marked grade-E editorial visualization estimates, never textual facts.
- Respect public-domain, licensed, and reference-only source status; do not reproduce copyrighted editions.
- Preserve stable IDs and existing records; verify parent-age constraints and chronology-model resolution.

## Review focus

- Names differ by language, witness, or transliteration: test same-person aliases separately from namesake identities.
- An unnamed person is mentioned but not individually distinguishable: represent a group, not invented individuals.
- Explicit ages occur far from first mention: keep claims and inventory locators at their actual verses.
- A single royal title spans successive rulers: use distinct identities when the text signals succession or death.
- Editorial lifespan windows can create false overlap: require grade E and explicit UI disclosure.

## Phased work

### Phase A — Pentateuch (complete; Geʽez spelling verification open)

- [x] Genesis 1–50 data foundation and expanded Genesis 36 / unnamed-person census.
- [x] Exodus 1–7: reviewed chapter inventories, LXX/Geʽez/MT witnesses, person/group census, sourced relations and events, Moses/Aaron explicit ages, disclosed display lifespans.
- [x] Exodus 8–40: plagues, Passover, departure, wilderness events, Sinai/covenant, tabernacle; all named and uniquely identifiable unnamed people.
  - [x] Exodus 8–18: plague sequence, departure and sea crossing, wilderness provisions, Amalek battle, Jethro visit; Joshua, Hur, Pharaoh's firstborn, and group entities.
  - [x] Exodus 19–24: Sinai arrival, covenant proposal and ratification, Ten Words, and Moses' ascent.
  - [x] Exodus 25–31: sanctuary instructions, priestly garments and service, Bezalel, Oholiab/Eliab textual form, and the Sabbath sign.
  - [x] Exodus 32–40: calf episode, covenant renewal, tablets, and tabernacle construction narrative.
- [x] Leviticus 1–27: reviewed the full book against Septuagint, Geʽez, and Masoretic witnesses; preserved the named and unnamed Leviticus 24 case participants as distinct people with transparent grade-E display windows.
  - [x] Leviticus 1–10: offerings, priestly service, Aaronide consecration, and deaths of Nadab and Abihu.
  - [x] Leviticus 11–16: purity rules and Day of Atonement instructions reviewed.
  - [x] Leviticus 17–27: blood and holiness laws, festivals, land/Jubilee rules, blasphemy case, vows, and tithes reviewed.
- [x] Numbers 1–36: census lists, wilderness generation, named and uniquely identifiable unnamed persons, tribal/family relations, age/death claims. Person-level regression tests (`tests/test_numbers_census_regressions.py`) fail if a reviewed name drops out of a chapter inventory.
  - [x] Numbers 1–4: first census and camp order, 12 named tribal officers and fathers, Levitical family census, transport assignments, explicit 603,550 total, and LXX/MT Levite-service age difference.
  - [x] Numbers 5–10: camp purity/restitution, Nazirite vow, Aaronic blessing, tribal offerings, Levite consecration, Passover/cloud, trumpet signals, march order, Hobab, and Sinai departure date.
  - [x] Numbers 11–15: elders, Eldad/Medad, Miriam, scout mission and Caleb, wilderness sentence, and Numbers 15 instructions; undated lifespans are clearly grade-E windows.
  - [x] Numbers 16–20: Korah's rebellion (distinct from Esau's Korah), Aaron's staff, priestly duties, red-heifer purification, Meribah, and Miriam/Aaron's deaths.
  - [x] Numbers 21–25: Transjordan conflicts, Sihon and Og, Balaam and Balak, Moab plains oracles, and the Peor crisis.
  - [x] Numbers 26–30: second census, Zelophehad's daughters and inheritance petition, Joshua's succession, festival offerings, and vow instructions.
  - [x] Numbers 31–36: Midian campaign/Balaam's death, Transjordan allotments, Aaron's relative death date and age, land/city instructions, and Zelophehad inheritance sequel.
  - [x] Completeness review (2026-10-06): the twelve spies and their fathers (Num 13); Peleth and Eliab of Reuben (Num 16); the king of Arad and the former king of Moab (Num 21); Beor (Num 22, 24, 31); Salu and Zur as Cozbi's father (Num 25); the full second-census clan list with Gilead's and Ephraim's clans (Num 26); Nun; the Numbers 34 fathers' lifespans; unnamed but unique individuals (Num 11:27, 12:1, 15:32-36, 20:14). Aaron was removed from Numbers 11 and 28–29, where the text does not name him.
  - [x] Numbers 26 vs Genesis 46 spelling variants (Nemuel/Jemuel, Zerah/Zohar, Zephon/Ziphion, Ozni/Ezbon, Arod/Arodi, Puvah/Puah, Shuham/Hushim, Ahiram/Ehi, Shephupham/Muppim, Hupham/Huppim) kept as aliases with grade-C editorial identity claims; conflicting genealogies (Ard/Naaman under Bela vs Benjamin; Jochebed "daughter of Levi") are recorded as claims, not merged parent links.
  - [ ] Open: Septuagint/Geʽez locators for the Numbers 26 clan list are chapter-level because the Greek order and verse numbers differ; the Septuagint omission of Becher (Num 26:35) and the LXX addition of Eleazar in Num 36:1 need checking against the printed editions; Agag in Balaam's oracle (Num 24:7) is not yet modeled.
- [x] Deuteronomy 1–34: speeches, named/unnamed people, Moses' age and death, variant witnesses.
  - [x] All 34 chapters inventoried in Septuagint, Geʽez, and Masoretic witnesses, with a per-chapter person regression test (`tests/test_deuteronomy_data.py`); retold events link back to their Exodus/Numbers event IDs instead of duplicating them.
  - [x] Explicit chronology: the address is dated year 40, month 11, day 1 after the Exodus (1:3); Moses is 120 (31:2; 34:7) and is mourned for thirty days (34:8).
  - [x] Variant traditions kept: Aaron's death at Moserah (10:6) beside Mount Hor (Num 20; 33); Masoretic "Hoshea son of Nun" (32:44); the "wandering Aramean" (26:5) is identified with Jacob only as a grade-C editorial claim.
  - [x] Anak and his descendants Ahiman, Sheshai, and Talmai (Num 13:22; Deut 9:2) added to the Numbers 13 inventory.
  - [ ] Open: the Greek forms at 10:6 (Moserah) and 32:44 (Iesous vs Hoshea) still need checking against Rahlfs–Hanhart; chapter 29 Greek/Geʽez locators are chapter-level because of the 28:69 versification shift.

- [ ] Corpus-wide: Geʽez claims cite Dillmann locators but spellings have not been checked reading by reading; add verified Geʽez name forms before presenting them in the UI.
- [x] Corpus-wide integrity guards (2026-10-06): no alias may leak between differently named people (fixed "Roubin" on all of Jacob's sons); every parent must be at least 12 and alive at a child's display birth (62 Genesis/Exodus/Numbers placements re-chained by disclosed 30-year editorial generations); the two Horite Dishons (Gen 36:21, 36:25) are now distinct.

### Phase B — Settlement and united/divided monarchy

- [x] Joshua, Judges, Ruth: full named/unnamed person census and generation links.
- [x] 1–2 Samuel / 1–2 Kingdoms: Saul, David, courts, families, prophets, successions, and synchronisms.
- [x] 1–2 Kings / 3–4 Kingdoms: king-by-king chronology, accession conventions, coregencies, prophetic overlaps, and external anchors. Accession ages and reign lengths are Masoretic claims (grade A); BCE reign windows follow a conventional synchronized chronology (grade C); Israelite kings' births stay grade E.
- [x] 1–2 Chronicles / Supplements: resolve duplicate/variant names against Samuel–Kings with explicit identity confidence; include genealogical lists without conflation. Variant ages kept (2 Chr 22:2 = 42, 2 Chr 36:9 = 8); compressed 'son of' links recorded as descent.

- Census method (2026-10-06): every chapter of Joshua–Malachi is inventoried and cross-checked against the TIPNR proper-name index (STEPBible, CC BY 4.0), with hand-curated unnamed individuals, regnal data, dated events, and index corrections. The same pass added missing Pentateuch people (e.g. Aram son of Kemuel, Korah's sons, Beeri and Elon the Hittites). Tooling and policies: `tools/ot_census/README.md`. A committed snapshot (`tests/fixtures/chapter_people_snapshot.json`) fails the suite if any chapter loses a person.
- Open (Phase B/C): Septuagint and Geʽez presence beyond the Octateuch is book-level and grade C; no Geʽez edition has been selected for Samuel–Malachi; verse-level Greek name forms are not yet recorded.

### Phase C — Exile, restoration, wisdom, and prophets

- [x] Ezra, Nehemiah, Esther: people, court/census lists, dated events (Greek Additions to Esther remain with the deuterocanonical works below).
- [x] Job, Psalms, Proverbs, Ecclesiastes, Song: named individuals (including superscription names) inventoried; Job's era is editorial; the Greek Job 42:16 numbers are recorded as a grade-C variant.
- [x] Isaiah through Malachi: prophetic lifespan windows, kings and synchronisms, named/unnamed courts and audiences. Greek Jeremiah/Psalms chapter correspondences are recorded on the Septuagint passages.
- [ ] Tobit, Judith, Wisdom, Sirach, Baruch, Greek Ezra and other Septuagint/Ethiopic works: add canon-specific witnesses and claims under their actual textual status.
- [ ] Ethiopic broader-canon sentinels (including Enoch, Jubilees, and Meqabyan): book-level source/canon review before person extraction.

### Phase D — New Testament and Revelation

- [ ] Gospels: parallel-event and identity reconciliation for Jesus, disciples, family, officials, crowds, named and uniquely identifiable unnamed people; preserve chronology differences.
- [ ] Acts: church/community census, named/unnamed participants, travel and reign synchronisms.
- [ ] Epistles: people mentioned by name, uncertain identities, and lifespan evidence only when supported.
- [ ] Revelation: historical/visionary/symbolic classifications remain separate; include human people and explicit appearance windows without manufacturing mortal lifespans.
- [ ] Ethiopian New Testament broader-canon books and relevant witnesses.

### Phase E — Immersive website

- [ ] Define the frontend architecture against final published data contracts.
- [ ] Build a polished, responsive horizontal timeline with smooth pan/zoom, book navigation, chronology/model and canon filters, witness/provenance inspection, search, and person/event detail panels.
- [ ] Distinguish evidence-supported overlap from reference-year overlap and visually mark grade-E estimates.
- [ ] Add accessible keyboard/touch navigation, reduced-motion behavior, mobile layout, and user-guided discovery.
- [ ] Test with representative dense regimes: Genesis genealogies, Kings/Chronicles overlap, Gospel parallel events, and Revelation symbolic/human layers.
- [ ] Build and verify deployment artifacts and document contributor/source workflow.

## Slice acceptance checklist

For each Scripture slice: write a failing acceptance test first; source-check names against the actual chosen witnesses; add reviewed passages and inventories; author entities, claims, relationships/events; add transparent chronology resolutions; pass focused and full tests; run `py -3.11 -m bible_timeline validate --strict`, `build`, and `report`; commit the milestone. Update this roadmap as phases progress.
