"""Verify TIPNR-derived person/chapter entries against the tagged Hebrew (Leningrad) and Greek (NA28) texts.

Usage: verify_tagged.py <repo> <tipnr.json> <step_dir> <report.json> [--apply]

Without --apply it only reports. With --apply it:
  - removes a TIPNR-derived person from a Joshua-Malachi or New Testament chapter when the tagged base text has no
    occurrence of that person anywhere in the chapter (Pentateuch inventories are reported, never edited);
  - rewrites that person's book attestation claim so its locator lists only verified verses;
  - adds original-language name claims (name_as) per book with the lemma found in the tagged text.
"""
import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

root = Path(sys.argv[1])
sys.path.insert(0, str(root / "src"))
sys.path.insert(0, str(Path(__file__).parent))
from bible_timeline.loader import load_dataset  # noqa: E402
from tagged_text import base_id, read  # noqa: E402
import curated as OTC  # noqa: E402
import nt_curated as NTC  # noqa: E402

APPLY = "--apply" in sys.argv
tip = json.load(open(sys.argv[2], encoding="utf-8"))
occ = read(sys.argv[3])
ds = load_dataset(root / "data", root / "schemas")

CODE = {}
for code, work, title, *_ in OTC.BOOKS:
    CODE[work] = (code, title)
for code, work, title, n in NTC.BOOKS:
    CODE[work] = (code, title)
for code, work, title in (("Gen", "genesis", "Genesis"), ("Exo", "exodus", "Exodus"), ("Lev", "leviticus", "Leviticus"),
                          ("Num", "numbers", "Numbers"), ("Deu", "deuteronomy", "Deuteronomy")):
    CODE[work] = (code, title)
PENT = {"genesis", "exodus", "leviticus", "numbers", "deuteronomy"}
NT_WORKS = {b[1] for b in NTC.BOOKS}

# our id for each TIPNR uid (entities carry tipnr_id; Pentateuch people come from the bridge)
uid2id = {}
for path in (root / "data").rglob("entities.yaml"):
    for m in re.finditer(r"\bid: ([a-z0-9-]+),[^\n]*?tipnr_id: \"([^\"]+)\"", path.read_text(encoding="utf-8")):
        uid2id[m.group(2)] = m.group(1)
bridge_path = Path(sys.argv[2]).parent / "bridge.json"
if bridge_path.exists():
    for u, i in json.load(open(bridge_path, encoding="utf-8"))["mapped"].items():
        uid2id.setdefault(u, i)
for u, i in NTC.MANUAL_MAP.items():
    uid2id.setdefault(u, i)
for src, dst in OTC.MERGE_UIDS.items():
    if dst in uid2id:
        uid2id[src] = uid2id[dst]
base2id = {base_id(u): i for u, i in uid2id.items() if i in ds.entities}
# fallback: (name, verse) from TIPNR refs -> our id
name_verse = defaultdict(set)
for r in tip:
    our = uid2id.get(r["uid"])
    if our and our in ds.entities:
        n = r["uid"].split("@")[0]
        for b, c, v in r["refs"]:
            name_verse[(n, b, c, v)].add(our)

# tags not matching an index uid: map by verse overlap with an index person's references (>= 60% of the tag's verses)
tag_verses = defaultdict(set)
for (b, c, v), words in occ.items():
    for tag, lemma, in_base in words:
        tag_verses[tag].add((b, c, v))
person_verses = defaultdict(set)
for r in tip:
    our = uid2id.get(r["uid"])
    if our and our in ds.entities:
        person_verses[our] |= {tuple(x) for x in r["refs"]}
verse_people = defaultdict(set)
for our, vs in person_verses.items():
    for x in vs:
        verse_people[x].add(our)
for tag, vs in tag_verses.items():
    if tag in base2id:
        continue
    counts = Counter(p for x in vs for p in verse_people.get(x, ()))
    if counts:
        best, n = counts.most_common(1)[0]
        if n >= max(1, 0.6 * len(vs)) and n >= 0.3 * len(person_verses[best]):
            base2id[tag] = best

found = defaultdict(lambda: defaultdict(list))  # our id -> (code, ch) -> [(verse, lemma, in_base)]
unmapped = Counter()
for (b, c, v), words in occ.items():
    for tag, lemma, in_base in words:
        our = base2id.get(tag)
        if our is None:
            cands = name_verse.get((tag.split("@")[0], b, c, v), set())
            our = next(iter(cands)) if len(cands) == 1 else None
        if our is None:
            unmapped[tag] += 1
            continue
        found[our][(b, c)].append((v, lemma, in_base))

tipnr_people = set(uid2id.values())
KEEP_PRESENT = {("Mark 7", "jesus")}  # NA28 refers to him only by pronoun in this chapter; he is plainly present
report = {"removed": [], "kept_unverifiable": [], "pentateuch_unverified": [], "verified_entries": 0, "unmapped_tags": unmapped.most_common(40)}
removals = defaultdict(set)  # unit id -> person ids
for u in ds.inventory_units.values():
    if u.work_id not in CODE:
        continue
    code, title = CODE[u.work_id]
    m = re.fullmatch(re.escape(title) + r" (\d+)", u.locator)
    if not m:
        continue
    ch = int(m.group(1))
    for pid in u.identified_entity_ids:
        if pid not in tipnr_people or ds.entities[pid].classification == "unnamed_person":
            continue
        hits = found[pid].get((code, ch), [])
        if any(in_base for v, lemma, in_base in hits):
            report["verified_entries"] += 1
            continue
        why = "only in other editions" if hits else "no tagged occurrence"
        if u.work_id in PENT:
            report["pentateuch_unverified"].append((u.locator, pid, why))
        elif hits and (u.locator, pid) not in KEEP_PRESENT:
            # the name occurs only in editions other than the base text (e.g. TR/Byzantine or LXX-supplied): not in this witness
            removals[u.id].add(pid)
            report["removed"].append((u.locator, pid, why))
        else:
            # presence may be by pronoun or description, or the index may conflate people: kept, listed for manual review
            report["kept_unverifiable"].append((u.locator, pid, why))

print({k: (len(v) if isinstance(v, list) else v) for k, v in report.items()})
json.dump(report, open(sys.argv[4], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if not APPLY:
    sys.exit(0)

# ---------------------------------------------------------------- apply
def edit_inventory(unit_id, drop):
    p = ds.record_paths[unit_id]
    t = p.read_text(encoding="utf-8")
    mm = re.search(r"\bid: " + re.escape(unit_id) + r",[^\n]*?identified_entity_ids: \[([^\]]*)\]", t)
    ids = [x.strip() for x in mm.group(1).split(",") if x.strip() and x.strip() not in drop]
    t = t[:mm.start(1)] + ", ".join(ids) + t[mm.end(1):]
    if not ids:
        t = re.sub(r"(\bid: " + re.escape(unit_id) + r",[^\n]*?no_individuals: )false", r"\1true", t, count=1)
    p.write_text(t, encoding="utf-8", newline="")


for unit_id, drop in removals.items():
    edit_inventory(unit_id, drop)

# attestation claims: rewrite locators to verified verses; add original-language name claims
WITNESS_OF = {}
for w in ds.witnesses.values():
    if w.id.startswith(("mt-", "greek-")):
        WITNESS_OF[w.work_id] = w.id
SOURCE_OF = {w.id: w.citations[0].source_id for w in ds.witnesses.values() if w.citations}
names_added = 0
claims_rewritten = 0
new_name_claims = defaultdict(list)
for cl in ds.claims.values():
    if not cl.id.endswith(("-mt-attested", "-na28-attested")) or cl.subject_id not in tipnr_people or not cl.witness_id:
        continue
    wm = re.fullmatch(r"(?:mt-(.+)-bhs|greek-(.+)-na28)", cl.witness_id)
    if not wm:
        continue
    pid, work = cl.subject_id, wm.group(1) or wm.group(2)
    if cl.id != f"{pid}-{work}-{'mt' if wm.group(1) else 'na28'}-attested":
        continue
    if work not in CODE or work in PENT:
        continue
    code, title = CODE[work]
    verses = sorted({(c, v) for (b, c), hits in found[pid].items() if b == code for v, lemma, inb in hits if inb})
    lemmas = Counter(lemma for (b, c), hits in found[pid].items() if b == code for v, lemma, inb in hits if inb)
    p = ds.record_paths[cl.id]
    t = p.read_text(encoding="utf-8")
    if verses:
        if len(verses) <= 12:
            parts, last = [], None
            for c, v in verses:
                parts.append((f"; {c}:{v}" if last is not None else f"{c}:{v}") if c != last else f", {v}")
                last = c
            loc = f"{title} " + "".join(parts)
        else:
            chs = sorted({c for c, v in verses})
            rng, s, pr = [], chs[0], chs[0]
            for c in chs[1:] + [None]:
                if c is not None and c == pr + 1:
                    pr = c
                    continue
                rng.append(f"{s}" if s == pr else f"{s}-{pr}")
                if c is not None:
                    s = pr = c
            loc = f"{title} {', '.join(rng)}"
        t2 = re.sub(r"(\bid: " + re.escape(cl.id) + r",[^\n]*?citations: \[\{source_id: [a-z0-9-]+, locator: )\"[^\"]*\"", lambda m_: m_.group(1) + json.dumps(loc, ensure_ascii=False), t, count=1)
        if t2 != t:
            claims_rewritten += 1
            p.write_text(t2, encoding="utf-8", newline="")
    if lemmas:
        lemma = lemmas.most_common(1)[0][0]
        wid = cl.witness_id
        lang = "Hebrew/Aramaic (Leningrad)" if wid.startswith("mt-") else "Greek (NA28)"
        first = verses[0] if verses else None
        loc = f"{title} {first[0]}:{first[1]}" if first else title
        new_name_claims[work].append(
            f"  - {{id: {pid}-{work}-original-name, subject_id: {pid}, predicate: name_as, value: {{kind: name_variant, form: {json.dumps(lemma, ensure_ascii=False)}, language: {json.dumps(lang)}}}, "
            f"evidence_type: explicit_text, witness_id: {wid}, confidence: A, interpretation_note: \"Dictionary (lemma) form of the name as tagged in the STEPBible amalgamated text.\", "
            f"citations: [{{source_id: {SOURCE_OF.get(wid, 'na28')}, locator: {json.dumps(loc, ensure_ascii=False)}, witness_id: {wid}}}, {{source_id: stepbible-tagged-texts, locator: {json.dumps(loc, ensure_ascii=False)}}}]}}")
        names_added += 1
for work, lines in new_name_claims.items():
    (root / "data" / work / "original_names.yaml").write_text("schema_version: 1\nrecord_type: claims\nrecords:\n" + "\n".join(lines) + "\n", encoding="utf-8")
src = root / "data/catalog/stepbible_sources.yaml"
src.write_text("schema_version: 1\nrecord_type: sources\nrecords:\n  - {id: stepbible-tagged-texts, source_type: reference_index, title: \"TAHOT and TAGNT - Translators Amalgamated Hebrew OT and Greek NT\", "
               "bibliographic_locator: \"STEPBible.org / Tyndale House Cambridge, STEPBible-Data repository\", url: https://github.com/STEPBible/STEPBible-Data, "
               "license_status: cc_by_4_0_reference, usage_note: \"Used to verify that each indexed person is named in the Leningrad (OT) or NA28 (NT) text of each chapter, and to record dictionary forms of names. The data files are not redistributed.\"}\n",
               encoding="utf-8")
print("removed entries:", sum(len(v) for v in removals.values()), "claims rewritten:", claims_rewritten, "original-name claims:", names_added)
