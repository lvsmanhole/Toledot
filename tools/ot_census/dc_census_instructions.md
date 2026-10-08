# Deuterocanon person-census task (instructions for every census agent)

You are classifying the people named in one or more deuterocanonical books for an evidence-based Bible timeline.
Accuracy is the priority: every entry must be grounded in the actual verses. Never invent a person, relation, or verse.

## Inputs (read-only)

- Text: `dl/webvpl/eng-web_vpl.txt` (World English Bible, public domain). One verse per line: `BOOK C:V text`.
  Book codes: TOB Tobit, JDT Judith, ESG Esther (Greek, with additions), WIS Wisdom, SIR Sirach, BAR Baruch (ch. 6 = Letter of Jeremiah),
  1MA/2MA/3MA/4MA Maccabees, 1ES 1 Esdras, PRM Prayer of Manasseh, PSX Psalm 151, 4ES 2 Esdras (ch. 3-14 = 4 Ezra), DNG Daniel (Greek).
- Candidates: `dc_cands.json` → `{BOOK: {Name: {count, refs: [[c,v],...], sample, tipnr}}}`; `tipnr` says whether the name is a known
  Hebrew-Bible person or place name. Candidates are only a starting point. Also scan the text for **unnamed but uniquely identifiable
  individuals** (e.g. "the mother of the seven sons", "Tobit's dog" is NOT human so skip it), and names the extractor missed.
- Existing people: `entity_index.tsv` (id, primary_name, aliases, description, display years BCE, first chapters).
  When a deuterocanonical name clearly refers to an existing person (e.g. Sirach 44-49 praising Abraham, Moses, David; 1 Esdras
  retelling Josiah, Zerubbabel, Ezra), use that existing `id`. Greek spellings differ (Zorobabel = Zerubbabel, Jeconias = Jehoiachin,
  Joakim may be a different person, Jesus son of Josedek = Joshua/Jeshua the high priest). Only map when the identity is clear;
  otherwise create a new person and explain in `identity_note`.

All paths are relative to the session's scratchpad directory.

## Output

Write exactly one JSON file at the path given in your task (inside `dc_out/`). Do not modify any other file. Format:

```json
{
  "book": "TOB",
  "people": [
    {
      "name": "Tobit",                     // form used in the WEB text
      "existing_id": null,                 // id from entity_index.tsv if this IS that person, else null
      "new_id": "tobit",                   // lowercase-hyphen id for a new person (null if existing_id). Make it distinctive: add a
                                           // book or role suffix when the name is common (e.g. "eleazar-scribe-2ma", "jason-high-priest")
      "gender": "male",                    // male | female
      "unnamed": false,                    // true for uniquely identifiable unnamed individuals (then name is a description)
      "aliases": ["Tobiel"],               // other forms of the same person's name in the book
      "description": "Naphtalite exile in Nineveh, father of Tobias.",   // one short sentence, your own words
      "refs": ["1:1", "1:3", "2:1"],       // every verse in THIS book naming or clearly identifying the person (chapter:verse)
      "parents": [{"ref_name": "Tobiel", "verse": "1:1"}],   // parents explicitly stated; ref_name must match another entry's name
                                                                 // (or an existing id via "existing_id"); include the verse
      "spouses": [{"ref_name": "Anna", "verse": "1:9"}],
      "descent_note": null,                // when "son of X" means a distant ancestor, say so here and do NOT list X as parent
      "explicit_ages": [{"what": "lifespan", "years": 158, "verse": "14:11"}],  // only numbers stated in the text
      "identity_note": null                // anything uncertain about identity or merging
    }
  ],
  "excluded_names": {"Nineveh": "place", "Assyrians": "people", "Raphael": "angel"},  // every candidate you rejected and why
  "notes": "free text: textual oddities, variant numbering, anything the reviewer should check"
}
```

## Rules

- Persons only: humans. Exclude places, peoples/nations/tribes used collectively, angels, demons, deities, animals, months.
- A tribe/eponym name used for the tribe (e.g. "tribe of Naphtali") is NOT a person reference; a named ancestor in a genealogy IS.
- One entry per distinct individual. Same-name different people → separate entries with distinct `new_id`s.
- `refs` must be real verses from the text you checked. Prefer completeness: grep the text for each name.
- Parents/spouses only when the text states them. A list like "Mattathias son of John son of Simeon" gives a chain of parents.
- Keep descriptions neutral and short. Do not copy long passages.
- If a book has no named humans (e.g. most of Wisdom), output an empty `people` list and explain in `notes`.
