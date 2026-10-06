# Old Testament person-census tooling

These scripts generated the Joshua–Malachi data (and the Genesis–Deuteronomy completeness additions) from two inputs:

1. **TIPNR** (*Translators Individualised Proper Names with all References*, STEPBible.org / Tyndale House, CC BY 4.0) is the completeness and disambiguation index. It is **not** redistributed here. Download it from <https://github.com/STEPBible/STEPBible-Data> (`Proper Nouns/TIPNR ….txt`).
2. **`curated.py`** holds hand-reviewed knowledge:
   - book metadata and versification notes;
   - the narrative date of each chapter;
   - the regnal table, with accession ages and reign lengths;
   - other explicit ages and textual variants;
   - dated events, section events and unnamed individuals;
   - corrections where the index merges different people (Sargon/Sennacherib, the two Ahasueruses, Shallum = Jehoahaz).

## Pipeline

```powershell
py -3.11 -I tools/ot_census/tipnr_parse.py <tipnr.txt> <tipnr.json>
py -3.11 tools/ot_census/bridge.py . <tipnr.json> <bridge.json>         # map index people to existing entity ids
py -3.11 tools/ot_census/otgen.py . <tipnr.json> <bridge.json> --dry-run  # review the log first
py -3.11 tools/ot_census/otgen.py . <tipnr.json> <bridge.json>
py -3.11 tools/ot_census/rechain_parent_child.py .                       # fix residual parent/child order among existing grade-E windows
py -3.11 tools/ot_census/check_parent_child.py .
```

`otgen.py` is written to run once against a clean tree. Its outputs are committed data. Do not rerun it on top of its own output; restore `data/` first.

## Policies encoded

- **Index entries that are excluded:** group and gentilic forms such as "Jerahmeelite", TIPNR's `Unnamed#` placeholder ancestors, and `?`-flagged parent links.
- **Parent and spouse links need text support.** They are created only when both people are named in the same chapter (one exception: Isaiah 8:3, which is in the first person).
- **Eponyms are separated from their tribes and nations.** Jacob/Israel, the tribal patriarchs and clan founders are inventoried outside the Pentateuch only where they appear as individuals in genealogies.
- **"Son of" can mean descent.** When the "son" is placed more than 60 years after the parent's death or last appearance, the link is recorded as `ancestor`, not `parent`.
- **Display windows are grade E unless an explicit age or regnal datum supports them.**
  - Births come from the first dated appearance minus 35 years, or from the TIPNR era for genealogy-only people.
  - Parents are 20–90 years older than their children.
  - Lives never exceed 100 years without an explicit age.
- **Kings** use a conventional synchronized chronology (grade C) together with the explicit Masoretic accession ages.

## Deuterocanonical and Ethiopic broader-canon books

1. `dc_candidates.py` extracts proper-noun candidates from the public-domain World English Bible deuterocanon (eBible.org `eng-web` verse-per-line text).
2. Census passes followed `dc_census_instructions.md` to classify every candidate against the full text and write `dc_census/*.json`:
   - Tobit, Judith, Wisdom, Sirach and Baruch with the Letter of Jeremiah;
   - 1–4 Maccabees, 1 Esdras and 4 Ezra;
   - the Greek additions to Esther and Daniel;
   - the Prayer of Manasseh and Psalm 151;
   - 1 Enoch and Jubilees, from R. H. Charles's public-domain translations.
3. `dcgen.py` compiles those files, together with `dc_curated.py` (narrative dates and fixed reigns), into project YAML. It:
   - verifies every reference against the text;
   - merges cross-book identities (for example Nicanor of 1 Maccabees 7 with 2 Maccabees 14–15, and Simon II of Sirach 50 with 3 Maccabees);
   - applies the same deny-list as the Old Testament census;
   - writes Seleucid-era dates as text claims, with converted display years at grade C.
4. Claims cite the translation witness at confidence B, because the original-language reading hasn't been checked. A Septuagint (or, for Enoch and Jubilees, Geʽez) passage is recorded per chapter, with the chapter correspondence assumed.
5. Meqabyan 1–3, Tegsats, Josippon, 4 Baruch, the Ascension of Isaiah, Odes and the Psalms of Solomon are book-level entries only, with `reviewed: false`. No people are asserted for them until a citable edition or public-domain translation is selected.

## New Testament

`ntgen.py` (with `nt_curated.py`) runs the same TIPNR-based census for Matthew–Revelation against the NA28 witness. New Testament-specific policies:

- **Identities:**
  - The Isaiah 7:14 Immanuel reference is not merged with Jesus.
  - John of Patmos is separate from the apostle John.
  - "Jezebel" of Thyatira is separate from Ahab's queen.
  - The mother of Zebedee's sons is separate from Salome.
  - Herodias' daughter is unnamed in the text.
- **Index entries dropped:**
  - Lazarus of Luke 16, a character in a parable.
  - TIPNR inferences without a textual person: Heli's wife, Elizabeth's father, Barnabas' father, and similar.
- **References dropped:** index references from KJV epistle subscriptions (final two verses where the name is absent), and from verses absent from NA28 (Acts 8:37, 15:34, 24:7-8).
- **Eponyms:** "Israel" and "Jacob" meaning the nation are not counted as Jacob.
- **Genealogies:** Matthew 1 and Luke 3 links that conflict with existing parentage become `parent_reference` claims. Luke 3:36's Cainan maps to the Septuagint's post-flood Cainan.
- **Chronology:**
  - Grade C: the Herods, Roman emperors and governors, with external dates.
  - Grade E: Jesus (born before Herod's death in 4 BCE; crucified 30 CE, with 33 CE as the main alternative).
  - Explicit claims (grade A): Jesus about thirty (Luke 3:23), Anna 84, Jairus' daughter 12, the lame man over 40, Luke 3:1's fifteenth year of Tiberius.
- **Gospel parallels:** 28 linked events with per-Gospel ranges and notes on real differences (temple-cleansing timing, the Passover chronology, one versus two demoniacs).
- **Ethiopian broader New Testament** (Sinodos, Book of the Covenant, Clement, Didascalia): book-level entries only.

## Verification against the tagged base texts

`verify_tagged.py` (with `tagged_text.py`) reads STEPBible's TAHOT and TAGNT (CC BY 4.0; not redistributed). It checks every person/chapter entry derived from TIPNR against the base text: Leningrad (including Qere and restored text) for the Old Testament, and words present in NA28 for the New.

- **Removed:** entries whose name occurs only in other editions (TR/Byzantine readings, or text supplied from the Septuagint).
- **Kept:** entries with no tagged name occurrence. The person may be present by pronoun or description. These are listed in `docs/review/tagged-text-review.md` for manual review.
- **Rewritten:** each person's per-book attestation claim, so its locator lists only verses where the name is tagged in the base text.
- **Added:** a `name_as` claim per person and book, giving the Hebrew/Aramaic or Greek dictionary form.

Unnamed people are not checked, since they are identified by description rather than by name tags.
