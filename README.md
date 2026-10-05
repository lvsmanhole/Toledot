# Bible Timeline data foundation

This repository is the evidence-aware data pipeline for an immersive horizontal Bible chronology. The authored corpus currently reviews Genesis 1–50, Exodus 1–40, Leviticus 1–27, and Numbers 1–4 in the Septuagint, Geʽez, and Masoretic traditions; it preserves textual variants instead of hiding them behind a single unexplained date. The immersive website is planned after broader book coverage and is not implemented yet.

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
