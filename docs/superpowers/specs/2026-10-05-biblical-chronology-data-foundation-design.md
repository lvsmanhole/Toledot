# Biblical Chronology Data Foundation Design

**Date:** 2026-10-05  
**Status:** Approved in conversation; awaiting written-spec review  
**Scope:** The evidence-aware data foundation for an immersive biblical-person timeline

## 1. Purpose

This project will eventually present an immersive, horizontally scrolling timeline of biblical people from Genesis through Revelation and the wider Ethiopian and Septuagint corpora. Its central question is: who, according to a clearly defined chronology, may have been alive at the same time?

The first project phase is the chronology data foundation. It must support a visually definite default timeline while preserving the evidence, assumptions, uncertainty, textual variants, and alternate chronologies behind every displayed year. The website itself is intentionally outside this design cycle except where its data needs shape the published outputs.

Success for this phase means:

- every included person has a stable identity record;
- named and uniquely identifiable unnamed people are represented;
- divine, angelic, demonic, visionary, and symbolic figures are available as categorized overlays;
- the default timeline can consume one definite reference birth and death year per human person;
- selected dates remain distinguishable from proven dates;
- every date can be traced to textual evidence, historical evidence, a calculation, or a disclosed editorial estimate;
- disagreements among textual traditions remain queryable rather than being silently merged; and
- the same source data can generate validated JSON and SQLite outputs.

## 2. Scope and corpus

The project uses a union corpus. Canon membership is metadata, not a filter that erases material from another tradition.

The corpus includes:

1. The Ethiopian Orthodox Tewahedo broader and narrower canons, with each membership claim recorded explicitly.
2. The Septuagint corpus and its additions, with edition and textual tradition identified where a reading affects chronology.
3. The Hebrew/Protestant corpus as a comparative textual witness.
4. The New Testament.
5. The Samaritan Pentateuch where its readings affect early chronology.
6. External historical sources used as evidence and labeled as non-scriptural.

The phrase “the Ethiopian canon” must not be implemented as an undocumented list of 81 English titles. Ethiopian narrower and broader canon classifications, alternate ways of counting combined or divided works, and the availability of actual Geʽez witnesses must remain explicit. The Ethiopian Orthodox Tewahedo Church describes 46 Old Testament and 35 New Testament books, while scholarly discussion documents complications in broader and narrower lists.

The Septuagint must likewise be represented as a textual tradition with book- and edition-level variation, not as one uniform ancient volume. The Greek translations and revisions developed over time, and the corpus only became relatively fixed later.

Initial reference sources for the book registry include:

- [Ethiopian Orthodox Tewahedo Church: Canonical Books](https://www.ethiopianorthodox.org/english/canonical/books.html?lang=en)
- [Mikre-Sellassie, “The Bible and its Canon in the Ethiopian Orthodox Church”](https://translation.bible/wp-content/uploads/2024/06/mikre-sellassie-1993-the-bible-and-its-canon-in-the-ethiopian-orthodox-church.pdf)
- [Simon Crisp, “The Septuagint as Canon”](https://journals.sagepub.com/doi/10.1177/2051677016649429)

These references seed the source catalog; individual data claims require passage- or work-specific citations.

## 3. Inclusion and identity rules

### 3.1 Included entities

The data includes:

- every named human individual in the union corpus;
- every uniquely identifiable unnamed human individual;
- collective peoples, tribes, armies, crowds, and households as group entities;
- divine beings, angels, demons, visionary figures, and symbolic figures as optional overlays;
- places, nations, offices, dynasties, and other non-person entities needed to express evidence and relationships.

Only human individuals participate in normal lifespan and human-overlap calculations. A non-human or symbolic figure may have an appearance window but receives no human lifespan unless a specific interpretation classifies that figure as a historical human. Competing classifications are stored as claims.

### 3.2 Stable identity

Each entity has a stable, human-readable identifier independent of its display name. Named people use a normalized name plus a disambiguator when needed. Unnamed people use descriptive identifiers such as `pharaohs_daughter_exodus` rather than sequence numbers that may change during later extraction.

Aliases, titles, transliterations, original-language forms, and spelling variants do not create new people. Possible duplicate identities remain separate records connected by an identity claim until the evidence warrants a merge. Identity states include `same`, `possibly_same`, `distinct`, and `disputed`.

Groups never masquerade as individuals. Membership of an individual in a tribe, household, crowd, army, or nation is a relationship.

## 4. Data architecture

The authoritative data is version-controlled, human-readable YAML. JSON Schema definitions validate authored records. A deterministic Python pipeline compiles these records into website-ready JSON and SQLite.

### 4.1 Core record families

#### Works and textual witnesses

`works` identify literary works independently of modern book naming. `witnesses` identify a textual tradition, manuscript family, edition, or translation. Canon-membership records connect works to traditions and distinguish narrower, broader, liturgical, disputed, and comparative status.

#### Passages

`passages` provide resolvable citations within a work and witness. Citation mappings accommodate traditions whose chapter or verse numbering differs. A claim cites a passage locator and witness rather than relying on a display string alone.

#### Entities and persons

`entities` contain shared identity and classification fields. `persons` extend human or person-like entities with names, aliases, sex or gender claims where supported, identity notes, and resolved timeline information. Classification claims allow disputed cases without overwriting alternatives.

#### Relationships

`relationships` represent directed, typed connections such as parent, child, spouse, sibling, ancestor, descendant, ruler, successor, disciple, teacher, ally, enemy, killer, and witness. Inverse relationships are generated where logically valid rather than manually duplicated.

#### Events and participation

`events` represent births, deaths, reigns, battles, migrations, covenants, prophetic ministries, visions, successions, and externally anchored historical occurrences. Participation records connect entities to events with roles and source claims.

#### Claims

A `claim` is the smallest provenance-bearing assertion. It connects a subject and predicate to a value, entity, event, duration, or date expression. Each claim includes its evidence type, source citation, interpretation note when needed, and confidence assessment. Conflicting claims coexist.

#### Chronology models

`chronology_models` define the assumptions, anchors, precedence rules, and calculation choices for a complete or partial chronology. Initial models are:

- Septuagint-derived early chronology;
- Masoretic-derived early chronology;
- Samaritan-derived early chronology;
- scholarly historical ranges; and
- the hybrid Bible Timeline Reference Chronology.

#### Resolved timeline

`resolved_timeline` is generated, not hand-authored. It provides the definite years used by the default visualization together with ranges, confidence, basis, derivation identifiers, and alternative model results.

### 4.2 Dates and calendars

Internal date expressions specify their precision, calendar, era, and source. Year arithmetic uses an unambiguous internal representation. Public BCE/CE display has no year zero, while astronomical numbering may be used internally only when clearly converted at the boundary.

Dates can be exact, approximate, ranged, relative, regnal, genealogical, or unknown. Unknown values remain null and never become zero. “Approximately 1000 BCE” is not stored as an exact 1000 BCE claim.

## 5. Chronology resolution

### 5.1 Reference chronology

The primary visualization uses a hybrid Bible Timeline Reference Chronology. It selects one integer start and end year for each displayed human lifespan. Those selections are project conclusions, not assertions that the underlying evidence is always exact.

The reference model gives priority to:

1. explicit textual statements;
2. synchronisms among people, reigns, and events;
3. firm external historical anchors;
4. internally consistent calculations within a named textual tradition;
5. responsible scholarly date ranges; and
6. disclosed editorial estimates when stronger evidence is unavailable.

For early Genesis, the default favors Septuagint chronology while retaining Masoretic, Samaritan, and relevant Geʽez readings. For monarchic chronology, the resolver accounts for regnal synchronisms, co-regencies, accession-year systems, and external anchors. Later periods increasingly rely on established historical dates and ranges.

### 5.2 Resolved lifespan fields

Every human person in the published reference timeline has:

- `reference_birth_year`;
- `reference_death_year`;
- `birth_range` and `death_range` when uncertainty can be bounded;
- `life_basis`;
- `confidence_grade`;
- `derivation_id`;
- `chronology_model_id`; and
- alternative model results where available.

Allowed `life_basis` values are `explicit`, `calculated`, `synchronized`, `historically_inferred`, and `editorial_estimate`.

Confidence grades communicate evidence quality:

- **A:** directly stated and securely anchored;
- **B:** strongly derived from explicit statements or synchronisms;
- **C:** best-supported reconstruction with meaningful alternatives;
- **D:** weakly constrained inference; and
- **E:** editorial estimate used to place an otherwise undated person.

Each grade requires a textual explanation. It is not computed from an unexplained numeric score.

For a person known only through one event, the authored evidence records the observed activity window. If the reference model supplies birth and death years, both are labeled editorial estimates and linked to the rule used. The UI may draw a precise bar but must visually communicate its confidence and disclose the derivation.

### 5.3 Overlap semantics

The pipeline publishes at least two overlap interpretations:

- `reference_overlap`: the two selected reference lifespans intersect; and
- `evidenced_overlap`: the evidence or bounded ranges support a stronger overlap conclusion.

Consumers must not describe a grade-D or grade-E reference overlap as historically certain. Alternate chronology models can yield different overlap results without corrupting the reference model.

## 6. Source and rights policy

The project stores normalized facts, citations, limited necessary excerpts, and links. It does not copy a modern copyrighted Bible translation wholesale. Public-domain source texts may be indexed locally only after recording their edition, provenance, and license.

Original-language readings and modern scholarly editions must be identified precisely when they affect a claim. “The Septuagint says” is insufficient where Septuagint witnesses or editions differ. A secondary source cannot be presented as a primary textual witness.

Every claim records:

- source type;
- work and passage or external-source locator;
- witness or edition where material;
- direct versus inferred status;
- the responsible editor or import process;
- creation and revision dates; and
- an explanation for non-obvious interpretation.

## 7. Data flow and generated artifacts

The pipeline is:

```text
source catalog
  → authored evidence records
  → schema and semantic validation
  → chronology resolution
  → generated JSON, SQLite, and reports
```

Researchers edit only the source catalog and authored evidence. Generated artifacts are reproducible and are never treated as the authoritative source.

Published outputs are:

1. a complete normalized JSON dataset;
2. a SQLite research database with indexes for identity, passage, event, date, and overlap queries;
3. compact timeline JSON designed for horizontal rendering;
4. a provenance report connecting resolved values to claims;
5. an unresolved-conflicts report; and
6. validation and coverage reports.

The generated outputs include a schema version and build metadata so that a later website can reject incompatible datasets explicitly.

## 8. Validation and failure handling

Structural validation rejects malformed records before chronology resolution. Semantic validation reports:

- missing or malformed citations;
- duplicate or unstable entity identifiers;
- dangling aliases, relationships, events, or derivations;
- accidental identity merges;
- impossible parent-child or reign relationships;
- events outside resolved lifetimes;
- circular chronology derivations;
- invalid BCE/CE conversions;
- unexplained editorial estimates;
- claims that cite an unavailable work or witness; and
- inconsistent resolution results.

A disagreement among sources is valid data. Validation fails only when the disagreement is lost, incorrectly normalized, or left without the required provenance. Fatal errors prevent publication; research warnings appear in reports and may be permitted if explicitly acknowledged in the relevant record.

## 9. Testing strategy

Automated tests cover:

- schema validation for every record family;
- stable ID and alias resolution;
- citation and verse-mapping resolution;
- BCE/CE and no-year-zero arithmetic;
- genealogical date calculations;
- regnal years, co-regencies, and accession systems;
- alternate chronology models;
- circular derivation detection;
- confidence and basis requirements;
- lifespan and event consistency;
- reference and evidenced overlap queries; and
- deterministic regeneration of all published artifacts.

Small synthetic fixtures test isolated rules. Genesis supplies the first real end-to-end fixture. Kings and Chronicles supply the second because parallel accounts and synchronisms expose weaknesses that a simple genealogy does not.

## 10. Research sequence and first milestone

Research proceeds in controlled passes:

1. Define the complete work registry and canon memberships.
2. Establish textual-witness and source records.
3. Extract all named and uniquely identifiable unnamed people.
4. Add aliases, identity claims, and relationships.
5. Add appearances and event participation.
6. Add textual ages and chronological claims.
7. Add events and external anchors.
8. Resolve the hybrid reference chronology.
9. Run completeness, provenance, logic, and overlap checks.

The first milestone delivers:

- the repository and validation/build tooling;
- versioned schemas for the core record families;
- the initial full-corpus work and canon registry;
- the initial source and textual-witness catalog;
- documented chronology and confidence rules;
- a fully researched Genesis vertical slice;
- generated JSON and SQLite outputs; and
- automated tests and validation reports.

This milestone favors a deeply validated Genesis dataset over a shallow, untraceable whole-Bible person list. Once Genesis passes the complete pipeline, Kings and Chronicles become the next vertical slice, followed by staged expansion across the remaining corpus.

## 11. Deferred work

The following are intentionally deferred to later design cycles:

- the immersive horizontal website and its visual language;
- search, filtering, guided tours, and comparison interactions;
- editorial collaboration and web-based data-entry tools;
- deployment and hosting;
- accounts, annotations, and community contributions;
- graph-database migration; and
- automated natural-language extraction as an authoritative research method.

Automated extraction may later propose candidates, but no machine-extracted person, identity, date, or relationship becomes authoritative without validation against cited evidence.

## 12. Key decisions

- Use an evidence-aware relational model with a derivation graph.
- Publish one definite hybrid reference chronology while preserving alternatives.
- Favor Septuagint chronology for early Genesis rather than silently privileging the Masoretic timeline.
- Include the Ethiopian broader corpus and record narrower/broader classifications explicitly.
- Include named and uniquely identifiable unnamed people.
- Keep collective entities separate from individuals.
- Include supernatural and symbolic figures as optional overlays, excluded from ordinary human lifespan calculations.
- Store authored evidence in YAML and compile deterministic JSON and SQLite outputs.
- Treat uncertainty and disagreement as data, not errors to conceal.
- Validate Genesis deeply before scaling corpus-wide.
