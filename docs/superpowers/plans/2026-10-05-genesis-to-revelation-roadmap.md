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

### Phase A — Pentateuch (active)

- [x] Genesis 1–50 data foundation and expanded Genesis 36 / unnamed-person census.
- [x] Exodus 1–7: reviewed chapter inventories, LXX/Geʽez/MT witnesses, person/group census, sourced relations and events, Moses/Aaron explicit ages, disclosed display lifespans.
- [x] Exodus 8–40: plagues, Passover, departure, wilderness events, Sinai/covenant, tabernacle; all named and uniquely identifiable unnamed people.
  - [x] Exodus 8–18: plague sequence, departure and sea crossing, wilderness provisions, Amalek battle, Jethro visit; Joshua, Hur, Pharaoh's firstborn, and group entities.
  - [x] Exodus 19–24: Sinai arrival, covenant proposal and ratification, Ten Words, and Moses' ascent.
  - [x] Exodus 25–31: sanctuary instructions, priestly garments and service, Bezalel, Oholiab/Eliab textual form, and the Sabbath sign.
  - [x] Exodus 32–40: calf episode, covenant renewal, tablets, and tabernacle construction narrative.
- [ ] Leviticus 1–27: include narrative persons, otherwise record explicit chapter review with no individuals; track relevant foreign witnesses and events.
- [ ] Numbers 1–36: census lists, wilderness generation, named and unnamed persons, tribal/family relations, age/death claims.
- [ ] Deuteronomy 1–34: speeches, named/unnamed people, Moses' age and death, variant witnesses.

### Phase B — Settlement and united/divided monarchy

- [ ] Joshua, Judges, Ruth: full named/unnamed person census and generation links.
- [ ] 1–2 Samuel / 1–2 Kingdoms: Saul, David, courts, families, prophets, successions, and synchronisms.
- [ ] 1–2 Kings / 3–4 Kingdoms: king-by-king chronology, accession conventions, coregencies, prophetic overlaps, and external anchors.
- [ ] 1–2 Chronicles / Supplements: resolve duplicate/variant names against Samuel–Kings with explicit identity confidence; include genealogical lists without conflation.

### Phase C — Exile, restoration, wisdom, and prophets

- [ ] Ezra, Nehemiah, Esther and Greek additions: people, court/census lists, competing textual scope.
- [ ] Job, Psalms, Proverbs, Ecclesiastes, Song: identify named individuals only where text supports them; preserve uncertain traditional attributions.
- [ ] Isaiah through Malachi: prophetic lifespan windows, kings and synchronisms, named/unnamed courts and audiences.
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
