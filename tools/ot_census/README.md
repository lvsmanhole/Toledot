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
