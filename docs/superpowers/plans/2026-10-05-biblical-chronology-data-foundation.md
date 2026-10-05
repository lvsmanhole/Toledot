# Biblical Chronology Data Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a validated, source-traceable chronology data system and a complete Genesis vertical slice that publishes definite reference lifespans without concealing uncertainty or textual disagreement.

**Architecture:** Human-authored YAML records are validated against JSON Schema, loaded into typed Python models, checked semantically, and resolved through an acyclic chronology derivation graph. A deterministic publisher emits full JSON, compact timeline JSON, SQLite, and audit reports; Genesis is the first fully researched corpus slice.

**Tech Stack:** Python 3.11+, standard-library `dataclasses`, `sqlite3`, and `argparse`; PyYAML 6+, jsonschema 4.23+ using Draft 2020-12; pytest 8+.

**Spec:** `docs/superpowers/specs/2026-10-05-biblical-chronology-data-foundation-design.md`

## Global Constraints

- YAML under `data/` is authoritative; generated JSON, SQLite, and reports are never hand-edited.
- Public BCE/CE dates have no year zero; internal arithmetic may use astronomical ordinals only through tested conversion functions.
- The default hybrid model favors Septuagint chronology for early Genesis and retains Masoretic, Samaritan, and relevant Geʽez claims.
- Every resolved year carries a basis, confidence grade, explanation, derivation, model, and cited evidence.
- Conflicting claims coexist; validation must reject silent collapse, not disagreement itself.
- Named humans and uniquely identifiable unnamed humans are people; groups remain separate entities.
- Supernatural and symbolic entities are optional overlays and do not enter ordinary human lifespan calculations.
- Do not store a copyrighted modern Bible translation wholesale; every local text source must record its license status.
- Use stable, human-readable IDs; generated sequence numbers must not become public identifiers.
- All builds are deterministic from the same source tree and configuration.

## Review Focus

- BCE/CE calculations that cross 1 BCE/1 CE must skip public year zero; Task 1 pins this behavior.
- Two people sharing an alias must remain distinct unless an explicit identity claim links them; Task 3 pins this behavior.
- A circular chronology derivation must fail with the complete cycle path instead of partially publishing dates; Task 4 pins this behavior.
- Conflicting textual claims must survive loading, validation, and JSON/SQLite publication as distinct records; Tasks 2 and 6 pin this behavior.
- A reference lifespan based only on editorial estimation must have grade E, evidence, and an explanation; Tasks 4 and 11 pin this behavior.

---

## File Structure

```text
pyproject.toml                         package metadata, dependencies, pytest config, CLI entry point
.gitignore                             local environments, caches, and generated build outputs
README.md                              contributor workflow and canonical commands
schemas/                               JSON Schema Draft 2020-12 record contracts
data/catalog/                          works, canon source lists, memberships, witnesses, and sources
data/chronology/                       chronology models and derivation selections
data/genesis/01_11/                    primordial-history records and coverage inventory
data/genesis/12_36/                    patriarchal records and coverage inventory
data/genesis/37_50/                    Joseph-cycle records and coverage inventory
src/bible_timeline/dates.py            historical-year representation and arithmetic
src/bible_timeline/models.py           typed records shared by all pipeline stages
src/bible_timeline/loader.py           YAML discovery, schema validation, and typed loading
src/bible_timeline/validation.py       cross-record semantic validation
src/bible_timeline/chronology.py       derivation graph and chronology resolution
src/bible_timeline/overlap.py          reference and evidence-aware overlap assessment
src/bible_timeline/publish.py          deterministic JSON and SQLite generation
src/bible_timeline/reports.py          provenance, conflicts, validation, and coverage reports
src/bible_timeline/cli.py              validate, build, and report commands
src/bible_timeline/__main__.py         `python -m bible_timeline` entry point
tests/                                 focused unit, integration, data, and end-to-end tests
```

### Task 1: Historical-year core and project scaffold

**Files:**
- Create: `pyproject.toml`
- Create: `.gitignore`
- Create: `src/bible_timeline/__init__.py`
- Create: `src/bible_timeline/dates.py`
- Create: `tests/test_dates.py`

**Interfaces:**
- Consumes: None.
- Produces: `HistoricalYear(era: Literal["BCE", "CE"], year: int)`, `HistoricalYear.to_ordinal() -> int`, `HistoricalYear.from_ordinal(value: int) -> HistoricalYear`, and `add_years(value: HistoricalYear, delta: int) -> HistoricalYear`.

- [ ] **Step 1: Write failing historical-year tests**

Add tests named `test_rejects_non_positive_public_year`, `test_round_trips_bce_and_ce`, `test_add_years_crosses_eras_without_year_zero`, and `test_orders_older_bce_before_newer_dates`. Assert that adding one year to 1 BCE returns 1 CE and subtracting one year from 1 CE returns 1 BCE.

- [ ] **Step 2: Run the focused tests and confirm failure**

Run: `python -m pytest tests/test_dates.py -v`  
Expected: FAIL because `bible_timeline.dates` does not exist.

- [ ] **Step 3: Add the package scaffold and historical-year API**

Declare Python `>=3.11`, runtime dependencies `PyYAML>=6.0,<7` and `jsonschema>=4.23,<5`, and dev dependency `pytest>=8,<9`. Implement the exact interfaces above with public years restricted to positive integers and ordering based on ordinals.

- [ ] **Step 4: Run the focused tests**

Run: `python -m pytest tests/test_dates.py -v`  
Expected: all tests PASS.

- [ ] **Step 5: Commit the independently working date core**

```bash
git add pyproject.toml .gitignore src/bible_timeline tests/test_dates.py
git commit -m "feat: add historical year arithmetic"
```

### Task 2: Record schemas and typed dataset loader

**Files:**
- Create: `schemas/common.schema.json`
- Create: `schemas/work.schema.json`
- Create: `schemas/canon-list.schema.json`
- Create: `schemas/canon-membership.schema.json`
- Create: `schemas/witness.schema.json`
- Create: `schemas/source.schema.json`
- Create: `schemas/passage.schema.json`
- Create: `schemas/citation-mapping.schema.json`
- Create: `schemas/inventory.schema.json`
- Create: `schemas/entity.schema.json`
- Create: `schemas/relationship.schema.json`
- Create: `schemas/event.schema.json`
- Create: `schemas/claim.schema.json`
- Create: `schemas/chronology-model.schema.json`
- Create: `src/bible_timeline/models.py`
- Create: `src/bible_timeline/loader.py`
- Create: `tests/fixtures/minimal_dataset/`
- Create: `tests/test_loader.py`

**Interfaces:**
- Consumes: `HistoricalYear` from Task 1.
- Produces: immutable record dataclasses `Work`, `CanonList`, `CanonMembership`, `Witness`, `Source`, `Passage`, `CitationMapping`, `InventoryUnit`, `Entity`, `Relationship`, `Event`, `EventParticipant`, `Claim`, and `ChronologyModel`; `Dataset` dictionaries keyed by stable ID; `load_dataset(data_root: Path, schema_root: Path) -> Dataset`; `StructuralValidationError` carrying file path and JSON pointer.

- [ ] **Step 1: Write failing loader tests**

Test that the minimal fixture loads every record family, missing required provenance returns a path-aware `StructuralValidationError`, duplicate record IDs are rejected, and two opposing age claims for one person both remain in `Dataset.claims`.

- [ ] **Step 2: Run the loader tests and confirm failure**

Run: `python -m pytest tests/test_loader.py -v`  
Expected: FAIL because the schemas and loader do not exist.

- [ ] **Step 3: Define the schemas and typed records**

Every YAML file has top-level `schema_version: 1` and `records`. Require stable IDs, record types, and provenance-bearing citations. Claims use typed predicates and values without forcing mutually exclusive claims to overwrite one another. Sources require `source_type`, bibliographic locator, URL when available, and `license_status`. Events carry typed participant records rather than anonymous entity-ID arrays.

- [ ] **Step 4: Implement deterministic discovery and loading**

Discover `*.yaml` paths in sorted order, validate with Draft 2020-12, construct immutable records, and reject duplicate stable IDs with both file paths in the error.

- [ ] **Step 5: Run loader tests and the current suite**

Run: `python -m pytest tests/test_loader.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 6: Commit the schema and loading layer**

```bash
git add schemas src/bible_timeline/models.py src/bible_timeline/loader.py tests
git commit -m "feat: add evidence record schemas and loader"
```

### Task 3: Cross-record semantic validation

**Files:**
- Create: `src/bible_timeline/validation.py`
- Create: `tests/test_validation.py`
- Modify: `tests/fixtures/minimal_dataset/`

**Interfaces:**
- Consumes: `Dataset` from Task 2.
- Produces: `ValidationIssue(code: str, severity: Literal["error", "warning"], record_id: str | None, message: str)`, `validate_dataset(dataset: Dataset) -> tuple[ValidationIssue, ...]`, and `materialize_relationships(dataset: Dataset) -> tuple[Relationship, ...]`.

- [ ] **Step 1: Write failing reference-integrity tests**

Cover dangling entity, source, passage, event, model, and derivation references; an event outside a grade-A explicit lifespan; an unexplained editorial estimate; a group incorrectly assigned a human lifespan; and an inverse relationship that contradicts its source relationship.

Assert that a valid `parent` relationship generates one `child` inverse with a derivation pointer to the authored relationship, while symmetric and non-invertible relationship types are not duplicated.

- [ ] **Step 2: Add the alias non-merge regression test**

Load two distinct people with the alias `Simon`. Assert both IDs survive and no `duplicate_entity` error is emitted unless an explicit `same` identity claim connects them.

- [ ] **Step 3: Run validation tests and confirm failure**

Run: `python -m pytest tests/test_validation.py -v`  
Expected: FAIL because `validate_dataset` does not exist.

- [ ] **Step 4: Implement stable validation codes and severity rules**

Fatal reference and semantic faults use severity `error`; unresolved but properly sourced disagreements use `warning` or no issue. Sort results by severity, code, and record ID so reports are deterministic.

- [ ] **Step 5: Run validation tests and the full suite**

Run: `python -m pytest tests/test_validation.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 6: Commit semantic validation**

```bash
git add src/bible_timeline/validation.py tests
git commit -m "feat: validate chronology record semantics"
```

### Task 4: Chronology derivation graph and reference resolver

**Files:**
- Create: `src/bible_timeline/chronology.py`
- Create: `tests/test_chronology.py`
- Modify: `src/bible_timeline/models.py`
- Modify: `schemas/chronology-model.schema.json`
- Modify: `tests/fixtures/minimal_dataset/`

**Interfaces:**
- Consumes: `Dataset`, `HistoricalYear`, chronology-model records, and claims.
- Produces: `ResolvedLifespan`, `ResolutionResult`, `ChronologyResolutionError`; `resolve_model(dataset: Dataset, model_id: str) -> ResolutionResult`.
- Supported derivation operations: `literal`, `offset_years`, `midpoint`, and `select_claim`; every non-literal node lists its input node or claim IDs.

- [ ] **Step 1: Write failing derivation tests**

Test literal anchors, a Genesis-style `father birth + age at son’s birth` chain, lifespan-derived death, midpoint selection from a range, missing inputs, and stable results independent of YAML record order.

- [ ] **Step 2: Write the circular-derivation regression test**

Create `adam_birth -> seth_birth -> adam_birth`; assert `ChronologyResolutionError` includes the complete ordered cycle and produces no partial `ResolutionResult`.

- [ ] **Step 3: Write the editorial-estimate policy test**

Assert that a `life_basis: editorial_estimate` resolution fails unless it has confidence `E`, at least one evidence claim, and a non-empty explanation.

- [ ] **Step 4: Run chronology tests and confirm failure**

Run: `python -m pytest tests/test_chronology.py -v`  
Expected: FAIL because the resolver does not exist.

- [ ] **Step 5: Implement topological resolution and policy enforcement**

Resolve into a new immutable result without mutating `Dataset`. Use `HistoricalYear` arithmetic exclusively; attach selected and alternative claim IDs to every resolved boundary.

- [ ] **Step 6: Run chronology tests and the full suite**

Run: `python -m pytest tests/test_chronology.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 7: Commit chronology resolution**

```bash
git add schemas/chronology-model.schema.json src/bible_timeline tests
git commit -m "feat: resolve evidence-backed chronology models"
```

### Task 5: Reference and evidence-aware overlap engine

**Files:**
- Create: `src/bible_timeline/overlap.py`
- Create: `tests/test_overlap.py`
- Modify: `src/bible_timeline/models.py`

**Interfaces:**
- Consumes: two `ResolvedLifespan` values.
- Produces: `OverlapResult(reference_overlap: bool, evidenced_overlap: Literal["supported", "possible", "not_supported", "unknown"])` and `assess_overlap(left: ResolvedLifespan, right: ResolvedLifespan) -> OverlapResult`.

- [ ] **Step 1: Write failing overlap tests**

Cover inclusive same-year overlap, adjacent non-overlap, definite reference overlap with only possible evidence overlap, intersecting guaranteed-alive intervals producing `supported`, disjoint possible intervals producing `not_supported`, and absent bounds producing `unknown`.

- [ ] **Step 2: Run overlap tests and confirm failure**

Run: `python -m pytest tests/test_overlap.py -v`  
Expected: FAIL because the overlap module does not exist.

- [ ] **Step 3: Implement overlap assessment**

Reference overlap compares selected lifespan intervals. Evidence assessment compares guaranteed-alive intervals first, then possible-alive intervals; it never upgrades missing evidence to support.

- [ ] **Step 4: Run overlap tests and the full suite**

Run: `python -m pytest tests/test_overlap.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 5: Commit the overlap engine**

```bash
git add src/bible_timeline/models.py src/bible_timeline/overlap.py tests/test_overlap.py
git commit -m "feat: add evidence-aware lifespan overlap"
```

### Task 6: Deterministic JSON and SQLite publication

**Files:**
- Create: `src/bible_timeline/publish.py`
- Create: `tests/test_publish.py`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `Dataset` and `ResolutionResult`.
- Produces: `ArtifactManifest`; `publish_artifacts(dataset: Dataset, resolution: ResolutionResult, output_dir: Path) -> ArtifactManifest` writing `dataset.json`, `timeline.json`, `timeline.sqlite3`, and `manifest.json`.

- [ ] **Step 1: Write failing publication tests**

Assert stable byte-for-byte JSON across two builds, identical record counts in JSON and SQLite, foreign-key integrity, compact timeline fields, schema version and dataset hash in the manifest, and absence of wall-clock timestamps from reproducible content.

- [ ] **Step 2: Add the conflicting-claims round-trip test**

Publish two incompatible age claims for one person and assert both retain distinct IDs, citations, witnesses, and values in `dataset.json` and the SQLite `claims` table.

- [ ] **Step 3: Run publisher tests and confirm failure**

Run: `python -m pytest tests/test_publish.py -v`  
Expected: FAIL because the publisher does not exist.

- [ ] **Step 4: Implement atomic artifact publication**

Write into a sibling temporary directory, validate the completed artifacts, then replace individual output files. Use sorted keys and stable record ordering. Enable SQLite foreign keys and create indexes for IDs, citations, events, reference years, and relationship endpoints.

- [ ] **Step 5: Run publisher tests and the full suite**

Run: `python -m pytest tests/test_publish.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 6: Commit publication support**

```bash
git add .gitignore src/bible_timeline/publish.py tests/test_publish.py
git commit -m "feat: publish deterministic chronology artifacts"
```

### Task 7: Canon, witness, and source registry

**Files:**
- Create: `data/catalog/works.yaml`
- Create: `data/catalog/canon_lists.yaml`
- Create: `data/catalog/canon_memberships.yaml`
- Create: `data/catalog/witnesses.yaml`
- Create: `data/catalog/sources.yaml`
- Create: `data/catalog/citation_mappings.yaml`
- Create: `tests/test_catalog_data.py`

**Interfaces:**
- Consumes: schemas, loader, and semantic validation from Tasks 2–3.
- Produces: the initial union-corpus registry used by every subsequent research record.

- [ ] **Step 1: Write failing catalog acceptance tests**

Require all standard Hebrew/Protestant works, Septuagint additions, and Ethiopian sentinel works including Enoch, Jubilees, 1–3 Meqabyan, Sinodos, Books of Covenant, Ethiopic Clement, and Ethiopic Didascalia. Assert narrower/broader status is explicit, every transcribed source-list item maps to a work or a documented unresolved label, every membership cites a source-list item, every witness names its language and edition/tradition, and every source has a license status.

- [ ] **Step 2: Run catalog tests and confirm failure**

Run: `python -m pytest tests/test_catalog_data.py -v`  
Expected: FAIL because the catalog is absent.

- [ ] **Step 3: Research and author the work and canon registry**

Use the three seed references in the spec, transcribe their relevant enumerations into `canon_lists.yaml`, record disagreements as separate sourced membership claims, and model combined/divided counting without forcing the number of work records to equal a traditional canon count.

- [ ] **Step 4: Author witnesses, sources, and initial citation mappings**

Include Septuagint, Masoretic, Samaritan, Geʽez/Ethiopic, and New Testament witnesses needed for Genesis, plus the bibliographic sources that support the registry. Do not add full copyrighted text.

- [ ] **Step 5: Validate and review the catalog**

Run: `python -m pytest tests/test_catalog_data.py -v`  
Expected: focused tests PASS with no catalog validation errors. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 6: Commit the catalog**

```bash
git add data/catalog tests/test_catalog_data.py
git commit -m "data: add biblical corpus and witness registry"
```

### Task 8: Genesis 1–11 evidence and chronology

**Files:**
- Create: `data/genesis/01_11/inventory.yaml`
- Create: `data/genesis/01_11/entities.yaml`
- Create: `data/genesis/01_11/passages.yaml`
- Create: `data/genesis/01_11/relationships.yaml`
- Create: `data/genesis/01_11/events.yaml`
- Create: `data/genesis/01_11/claims.yaml`
- Create: `data/chronology/lxx_early.yaml`
- Create: `data/chronology/masoretic_early.yaml`
- Create: `data/chronology/samaritan_early.yaml`
- Create: `data/chronology/hybrid_reference.yaml`
- Create: `tests/test_genesis_01_11_data.py`

**Interfaces:**
- Consumes: the catalog and all pipeline interfaces from Tasks 1–7.
- Produces: a passage-reviewed Genesis 1–11 dataset and the initial four chronology models.

- [ ] **Step 1: Write failing coverage and sentinel tests**

Require reviewed inventory entries for every chapter and passage unit in Genesis 1–11. Assert presence of both Enochs, every named genealogy member, Noah’s unnamed wife and three individually distinct unnamed daughters-in-law, Nimrod, and the Septuagint’s additional Cainan where supported; assert groups such as “sons of God” are not individual people.

- [ ] **Step 2: Write failing chronology-model tests**

Assert that every Genesis 5 and 11 age claim retains its witness, the LXX/MT/SP differences remain separate, each named model resolves deterministically, and the hybrid model selects the documented Septuagint-preferred early chain.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `python -m pytest tests/test_genesis_01_11_data.py -v`  
Expected: FAIL because the records are absent.

- [ ] **Step 4: Perform the passage-by-passage person and event extraction**

For each inventory unit, create its resolvable passage records and record `reviewed`, cited witnesses, identified people/groups/events, and an explicit `no_individuals` result when appropriate. Add aliases and relationships without merging disputed identities.

- [ ] **Step 5: Author age claims and model derivations**

Record direct age statements before calculations. Build birth/death derivations from selected witness claims, attach alternative claims, basis, confidence, and explanations, and give any otherwise undated human an explicit grade-E editorial rule.

- [ ] **Step 6: Validate Genesis 1–11**

Run: `python -m pytest tests/test_genesis_01_11_data.py -v`  
Expected: focused tests PASS; no Genesis 1–11 human lacks reference years, evidence, basis, confidence, or explanation. Then run `python -m pytest -q`; expected: full suite PASS.

- [ ] **Step 7: Commit the primordial-history slice**

```bash
git add data/genesis/01_11 data/chronology tests/test_genesis_01_11_data.py
git commit -m "data: add evidence-aware Genesis 1 through 11"
```

### Task 9: Genesis 12–36 patriarchal evidence

**Files:**
- Create: `data/genesis/12_36/inventory.yaml`
- Create: `data/genesis/12_36/entities.yaml`
- Create: `data/genesis/12_36/passages.yaml`
- Create: `data/genesis/12_36/relationships.yaml`
- Create: `data/genesis/12_36/events.yaml`
- Create: `data/genesis/12_36/claims.yaml`
- Modify: `data/chronology/hybrid_reference.yaml`
- Create: `tests/test_genesis_12_36_data.py`

**Interfaces:**
- Consumes: Tasks 1–8 and the early chronology anchors.
- Produces: passage-reviewed records and resolved reference lifespans for Genesis 12–36.

- [ ] **Step 1: Write failing coverage and identity tests**

Require reviewed inventory entries for all 25 chapters. Pin Abraham/Abram, Sarah/Sarai, Hagar, Ishmael, Isaac, Rebekah, Esau/Edom, Jacob/Israel, named children and descendants, Lot’s unnamed wife, Lot’s individually identifiable daughters, and distinguish rulers sharing titles such as Pharaoh or Abimelech unless an explicit identity claim links them.

- [ ] **Step 2: Write failing relationship and chronology tests**

Assert sourced parentage and marriages, direct ages at major events, no event outside an A/B-confidence lifespan, and fully explained reference dates for every human in this slice.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `python -m pytest tests/test_genesis_12_36_data.py -v`  
Expected: FAIL because the slice is absent.

- [ ] **Step 4: Extract and source Genesis 12–36 records**

Review each passage unit, add named and uniquely identifiable unnamed people, record aliases as names rather than new identities, and preserve identity disputes as claims.

- [ ] **Step 5: Extend the hybrid reference model**

Resolve explicit and calculated patriarchal lifespans first; use disclosed grade-E rules only for people lacking adequate boundaries. Link every selected boundary to claims and derivation nodes.

- [ ] **Step 6: Validate and commit the patriarchal slice**

Run: `python -m pytest tests/test_genesis_12_36_data.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

```bash
git add data/genesis/12_36 data/chronology/hybrid_reference.yaml tests/test_genesis_12_36_data.py
git commit -m "data: add evidence-aware Genesis 12 through 36"
```

### Task 10: Genesis 37–50 Joseph-cycle evidence

**Files:**
- Create: `data/genesis/37_50/inventory.yaml`
- Create: `data/genesis/37_50/entities.yaml`
- Create: `data/genesis/37_50/passages.yaml`
- Create: `data/genesis/37_50/relationships.yaml`
- Create: `data/genesis/37_50/events.yaml`
- Create: `data/genesis/37_50/claims.yaml`
- Modify: `data/chronology/hybrid_reference.yaml`
- Create: `tests/test_genesis_37_50_data.py`

**Interfaces:**
- Consumes: Tasks 1–9.
- Produces: complete passage review and resolved reference lifespans for Genesis 37–50.

- [ ] **Step 1: Write failing coverage and sentinel tests**

Require reviewed inventory entries for all 14 chapters. Pin Joseph, Judah, Tamar, Perez, Zerah, Potiphar, Potiphar’s unnamed wife, the individually distinct cupbearer and baker, Asenath, Manasseh, Ephraim, and the unnamed Pharaoh without conflating him with earlier Pharaoh entities.

- [ ] **Step 2: Write failing event and age tests**

Assert Joseph’s stated ages, Jacob’s age statements, migration and death events, sourced family relationships, and complete reference lifespans with confidence and explanations.

- [ ] **Step 3: Run the focused tests and confirm failure**

Run: `python -m pytest tests/test_genesis_37_50_data.py -v`  
Expected: FAIL because the slice is absent.

- [ ] **Step 4: Extract, source, and resolve Genesis 37–50**

Complete passage review, record all qualifying people and events, preserve title-based ambiguity, and extend the hybrid model through Joseph’s death.

- [ ] **Step 5: Validate and commit the Joseph-cycle slice**

Run: `python -m pytest tests/test_genesis_37_50_data.py -v`  
Expected: focused tests PASS. Then run `python -m pytest -q`; expected: full suite PASS.

```bash
git add data/genesis/37_50 data/chronology/hybrid_reference.yaml tests/test_genesis_37_50_data.py
git commit -m "data: complete evidence-aware Genesis dataset"
```

### Task 11: Reports, CLI, and milestone acceptance

**Files:**
- Create: `src/bible_timeline/reports.py`
- Create: `src/bible_timeline/cli.py`
- Create: `src/bible_timeline/__main__.py`
- Create: `tests/test_reports.py`
- Create: `tests/test_cli.py`
- Create: `tests/test_genesis_end_to_end.py`
- Create: `README.md`
- Modify: `pyproject.toml`

**Interfaces:**
- Consumes: all prior pipeline components and production data.
- Produces: `bible-timeline validate`, `bible-timeline build`, and `bible-timeline report`; equivalent `python -m bible_timeline` commands; provenance, conflict, coverage, and validation reports.

- [ ] **Step 1: Write failing report tests**

Assert provenance output traces every selected birth/death boundary to derivations and source claims, conflict output lists unresolved variant claims without labeling them structural failures, and coverage output reports every Genesis passage unit as reviewed.

- [ ] **Step 2: Write failing CLI tests**

Assert `validate --strict` returns 0 only with no errors, `build --output <dir>` creates all four artifacts, and `report --output <dir>` creates `provenance.json`, `conflicts.json`, `coverage.json`, and `validation.json`.

- [ ] **Step 3: Write the end-to-end milestone test**

Load production data, validate it, resolve `hybrid_reference`, publish to a temporary directory, and assert: all Genesis chapters are reviewed; every included human has selected birth and death years; every editorial estimate is grade E with evidence and explanation; JSON and SQLite counts agree; and a second build is byte-identical.

- [ ] **Step 4: Run the focused tests and confirm failure**

Run: `python -m pytest tests/test_reports.py tests/test_cli.py tests/test_genesis_end_to_end.py -v`  
Expected: FAIL because reports and CLI do not exist.

- [ ] **Step 5: Implement reports and CLI orchestration**

Keep command handlers thin: load, validate, resolve, publish, and render reports through the existing public interfaces. Strict validation treats warnings as reportable but not fatal unless `--warnings-as-errors` is supplied.

- [ ] **Step 6: Document contributor and build workflows**

Document installation, authoritative versus generated files, stable-ID rules, adding a person/claim/citation, running validation, building artifacts, and interpreting confidence and overlap results.

- [ ] **Step 7: Run milestone verification**

Run: `python -m pytest -q`  
Expected: all tests PASS.

Run: `python -m bible_timeline validate --strict`  
Expected: exit 0 with zero errors.

Run: `python -m bible_timeline build --output generated`  
Expected: `dataset.json`, `timeline.json`, `timeline.sqlite3`, and `manifest.json` are produced.

Run: `python -m bible_timeline report --output generated/reports`  
Expected: all four audit reports are produced and Genesis coverage is complete.

- [ ] **Step 8: Commit the completed data-foundation milestone**

```bash
git add pyproject.toml README.md src/bible_timeline tests
git commit -m "feat: complete Genesis chronology data foundation"
```

## Completion Criteria

- The entire test suite passes from a clean checkout after installing declared dependencies.
- `validate --strict`, `build`, and `report` complete successfully against production data.
- Genesis 1–50 has passage-level review coverage, including named and uniquely identifiable unnamed humans.
- The hybrid reference model supplies definite, traceable reference lifespans for all included Genesis humans.
- LXX, Masoretic, Samaritan, and relevant Geʽez differences remain separate claims and alternate model inputs.
- Generated JSON and SQLite agree and reproduce byte-for-byte from unchanged inputs.
- The catalog explicitly represents Ethiopian broader/narrower status and Septuagint variation without claiming one undocumented universal list.
- Provenance, conflict, validation, and coverage reports make the dataset independently auditable.
