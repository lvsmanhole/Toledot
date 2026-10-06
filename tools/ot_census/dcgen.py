"""Compile census-agent JSON (dc_out/*.json) into project YAML for the deuterocanonical and Ethiopic broader-canon books.

Usage: dcgen.py <repo> <scratch> [--dry-run]
Person identity: an agent's existing_id, else its new_id (after MERGE_IDS). The same new_id in several books is one person.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

root, scratch = Path(sys.argv[1]), Path(sys.argv[2])
DRY = "--dry-run" in sys.argv
sys.path.insert(0, str(root / "src"))
sys.path.insert(0, str(Path(__file__).parent))
from bible_timeline.chronology import resolve_model  # noqa: E402
from bible_timeline.loader import load_dataset  # noqa: E402
import dc_curated as K  # noqa: E402

ds = load_dataset(root / "data", root / "schemas")
L = resolve_model(ds, "hybrid_reference").lifespans
log = defaultdict(list)


def q(s):
    return json.dumps(s, ensure_ascii=False)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def parse_ref(s):
    m = re.match(r"^\s*(\d+):(\d+)", str(s))
    return (int(m.group(1)), int(m.group(2))) if m else None


def in_ranges(ref, ranges):
    for r in ranges:
        a, _, z = r.partition("-")
        a, z = parse_ref(a), (parse_ref(z) if z else parse_ref(a))
        if a and z and a <= ref <= z:
            return True
    return False


# ------------------------------------------------------------------ text
web = defaultdict(dict)
for ln in open(scratch / "dl/webvpl/eng-web_vpl.txt", encoding="utf-8"):
    m = re.match(r"^(\w+) (\d+):(\d+) (.*)", ln)
    if m:
        web[m.group(1)][(int(m.group(2)), int(m.group(3)))] = m.group(4)

outputs = {p.stem: json.load(open(p, encoding="utf-8")) for p in sorted((scratch / "dc_out").glob("*.json"))}

# ------------------------------------------------------------------ work units (code, work, title, ranges or None, census witness kind)
units = []
for code, out in outputs.items():
    if code in K.DC_BOOKS:
        work, title, wkind, lxx = K.DC_BOOKS[code]
        if code == "BAR":
            units += [(code, "baruch", "Baruch", ["1:1-5:999"], wkind), (code, "letter-of-jeremiah", "Letter of Jeremiah", ["6:1-6:999"], wkind)]
        elif code == "4ES":
            units.append((code, work, title, [out.get("sections", {}).get("4-ezra", "3:1-14:999")], wkind))
        else:
            units.append((code, work, title, None, wkind))
    elif code in ("ESG", "DNG"):
        for sec in out.get("addition_sections", []):
            units.append((code, sec["work"], K.ADDITION_TITLES[sec["work"]], sec["ranges"], "web"))


def unit_for(code, ref):
    for u in units:
        if u[0] == code and (u[3] is None or in_ranges(ref, u[3])):
            return u
    return None


# chapters per unit (from the text where we have it; Enoch/Jubilees from refs + agent 'chapters')
unit_chapters = defaultdict(set)
for u in units:
    code, work, title, ranges, wkind = u
    if code in web:
        for (c, v) in web[code]:
            if ranges is None or in_ranges((c, v), ranges):
                unit_chapters[work].add(c)
for code, n in (("ENO", 108), ("JUB", 50)):
    if code in outputs:
        unit_chapters[K.DC_BOOKS[code][0]] = set(range(1, n + 1))

# ------------------------------------------------------------------ identities
MERGE_IDS = {"jonathan-maccabeus": "jonathan-apphus", "simon-maccabeus": "simon-thassi", "seleucus-iv": "seleucus-iv-philopator",
             "antiochus-iii": "antiochus-iii-the-great", "simon-ii-high-priest": "simon-son-of-onias-high-priest",
             "nicanor-governor-of-judea": "nicanor-1ma"}
MERGE_NOTES = {
    "simon-son-of-onias-high-priest": "Sirach 50 (Simon son of Onias) and 3 Maccabees 2:1 (the high priest Simon under Ptolemy IV) are identified here as Simon II; the identification is editorial.",
    "nicanor-1ma": "Nicanor of 1 Maccabees 7 and the governor Nicanor of 2 Maccabees 14-15 are identified by the shared 13 Adar defeat and 'Nicanor's Day'; editorial.",
}
# Same policy as the Old Testament census: conflicting genealogies are claims, not parent links.
DENY_CHILD_PARENT_LINKS = {"ard", "naaman", "gera", "rosh", "ehi", "muppim", "huppim", "ahiman-anak", "sheshai-anak", "talmai-anak"}
DESCENT_LINKS = {("shelumiel", "nathanael-jdt"): "Judith 8:1 continues the genealogy back to Salamiel son of Salasadai, the Simeonite leader of Numbers 1:6; the span of about five centuries in one step shows literary descent, not parenthood."}
DROP_PEOPLE = {("4ES", "jesus"), ("1ES", "charaathalan-1es"), ("1ES", "levis-1es"), ("1ES", "attharias-1es")}  # symbolic Messiah reading; place names; class word; title
DROP_LINKS = {("gabrias", "gabael-rages"),  # Tobit 1:14 and 4:20 disagree (brother vs son)
              ("barzillai-2sa17", "augia-1es"),  # a descendant who took the Gileadite's family name (Ezra 2:61)
              ("hilkiah-2ki22", "zechrias-1es")}  # garbled form of Ezra's priestly ancestry
existing_ids = set().union(*(set(getattr(ds, f)) for f in ("entities", "claims", "events", "relationships", "inventory_units", "passages",
                                                              "works", "witnesses", "sources", "canon_lists", "canon_memberships",
                                                              "chronology_models")))
NEW_ID_RENAME = {}


def canon_id(p):
    if p.get("existing_id") and p["existing_id"] in ds.entities:
        return p["existing_id"]
    if p.get("existing_id"):
        log["bad_existing_id"].append(p["existing_id"])
    nid = MERGE_IDS.get(slug(p.get("new_id") or p["name"]), slug(p.get("new_id") or p["name"]))
    if nid in existing_ids and nid not in ds.entities:
        nid = NEW_ID_RENAME.setdefault(nid, nid + "-person")
    elif nid in ds.entities:
        log["new_id_collides_with_existing_entity"].append(nid)
        nid = NEW_ID_RENAME.setdefault(nid, nid + "-dc")
    return nid


people, name_index = {}, defaultdict(dict)
for code, out in outputs.items():
    for p in out.get("people", []):
        pid = canon_id(p)
        if (code, pid) in DROP_PEOPLE:
            continue
        name_index[code][p["name"]] = pid
        for a in p.get("aliases") or []:
            name_index[code].setdefault(a, pid)
        if p.get("new_id"):
            name_index[code][p["new_id"]] = pid
        if p.get("existing_id"):
            name_index[code][p["existing_id"]] = pid
for code, out in outputs.items():
    for p in out.get("people", []):
        pid = canon_id(p)
        if (code, pid) in DROP_PEOPLE:
            continue
        rec = people.setdefault(pid, {"id": pid, "new": pid not in ds.entities, "names": [], "gender": p.get("gender"),
                                      "unnamed": bool(p.get("unnamed")), "desc": [], "refs": defaultdict(set), "parents": [],
                                      "spouses": [], "ages": [], "notes": [], "codes": []})
        rec["codes"].append(code)
        for n in [p["name"], *(p.get("aliases") or [])]:
            if n not in rec["names"]:
                rec["names"].append(n)
        if p.get("description"):
            rec["desc"].append(p["description"])
        for r in p.get("refs", []):
            ref = parse_ref(r)
            if ref is None or (code in web and ref not in web[code]):
                log["bad_ref"].append((code, pid, r))
                continue
            u = unit_for(code, ref)
            if u is None:
                log["ref_outside_units"].append((code, pid, r))
                continue
            rec["refs"][u[1]].add(ref)
        for kind in ("parents", "spouses"):
            for x in p.get(kind) or []:
                tgt = x.get("ref_id") or x.get("new_id") or x.get("existing_id") or x.get("ref_name")
                tgt = name_index[code].get(tgt) or (MERGE_IDS.get(tgt, tgt) if tgt in ds.entities or MERGE_IDS.get(tgt, tgt) in name_index[code].values() else None)
                if tgt is None:
                    log["unresolved_link"].append((code, pid, kind, x))
                    continue
                rec[kind].append((code, tgt, x.get("verse")))
        for a in p.get("explicit_ages") or []:
            rec["ages"].append((code, a))
        for k in ("identity_note", "descent_note"):
            if p.get(k):
                rec["notes"].append(p[k])
        if p.get("death_verse"):
            rec.setdefault("death", []).append((code, p["death_verse"]))
people = {k: v for k, v in people.items() if v["refs"]}
log["people_without_in_scope_refs_dropped"] = []

# ------------------------------------------------------------------ catalog: sources and witnesses
TITLE = {u[1]: u[2] for u in units}
src_lines = [
    "  - {id: world-english-bible, source_type: translation, title: \"World English Bible (with deuterocanon)\", bibliographic_locator: \"eBible.org, eng-web verse-per-line edition\", url: https://ebible.org/find/details.php?id=eng-web, license_status: public_domain, usage_note: \"English translation of the Greek deuterocanon used to locate names and verses; chapter and verse numbering follows this edition.\"}",
]
srcs = {o.get("source", {}).get("url") for c, o in outputs.items() if c in ("ENO", "JUB")}
src_lines.append("  - {id: charles-enoch-1917, source_type: translation, title: \"The Book of Enoch, translated by R. H. Charles\", bibliographic_locator: \"R. H. Charles, The Book of Enoch (London: SPCK, 1917), sacred-texts.com transcription\", url: https://sacred-texts.com/bib/boe/index.htm, license_status: public_domain}")
src_lines.append("  - {id: charles-jubilees-1917, source_type: translation, title: \"The Book of Jubilees, translated by R. H. Charles\", bibliographic_locator: \"R. H. Charles, The Book of Jubilees (London: SPCK, 1917), sacred-texts.com transcription\", url: https://sacred-texts.com/bib/jub/index.htm, license_status: public_domain}")
src_lines.append("  - {id: charles-ethiopic-enoch-1906, source_type: critical_edition, title: \"The Ethiopic Version of the Book of Enoch\", bibliographic_locator: \"R. H. Charles, Anecdota Oxoniensia, Oxford 1906\", license_status: public_domain}")
src_lines.append("  - {id: charles-ethiopic-jubilees-1895, source_type: critical_edition, title: \"The Ethiopic Version of the Hebrew Book of Jubilees\", bibliographic_locator: \"R. H. Charles, Anecdota Oxoniensia, Oxford 1895\", license_status: public_domain}")
src_lines.append("  - {id: ethiopic-edition-pending, source_type: placeholder, title: \"Ethiopic edition not yet selected\", bibliographic_locator: \"No citable critical edition or public-domain translation has been selected for this work in the project.\", license_status: not_applicable}")
CENSUS_WITNESS = {}
wit_lines = []
for u in units:
    code, work, title, ranges, wkind = u
    if work in CENSUS_WITNESS:
        continue
    if wkind == "web":
        wid = f"web-{work}"
        wit_lines.append(f"  - {{id: {wid}, work_id: {work}, tradition: translation_of_greek, language: en, edition: {q('World English Bible: ' + title)}, "
                         f"versification_note: \"Chapter and verse numbers follow the World English Bible.\", citations: [{{source_id: world-english-bible, locator: {q(title)}}}]}}")
        CENSUS_WITNESS[work] = (wid, "world-english-bible")
        if work != "ezra-sutuel" and (K.DC_BOOKS.get(code, (None, None, None, True))[3] or code in ("ESG", "DNG", "BAR")):
            wit_lines.append(f"  - {{id: lxx-{work}-rahlfs-hanhart, work_id: {work}, tradition: septuagint, language: grc, edition: {q('Rahlfs-Hanhart Septuaginta, editio altera (2006): ' + title)}, "
                             f"citations: [{{source_id: rahlfs-hanhart-2006, locator: {q(title)}}}]}}")
    else:
        src = "charles-enoch-1917" if work == "1-enoch" else "charles-jubilees-1917"
        wid = f"charles-{work}-translation"
        wit_lines.append(f"  - {{id: {wid}, work_id: {work}, tradition: translation_of_geez, language: en, edition: {q('R. H. Charles translation: ' + title)}, "
                         f"citations: [{{source_id: {src}, locator: {q(title)}}}]}}")
        gsrc = "charles-ethiopic-enoch-1906" if work == "1-enoch" else "charles-ethiopic-jubilees-1895"
        wit_lines.append(f"  - {{id: geez-{work}-charles, work_id: {work}, tradition: geez, language: gez, edition: {q('Charles, Ethiopic text: ' + title)}, "
                         f"citations: [{{source_id: {gsrc}, locator: {q(title)}}}]}}")
        CENSUS_WITNESS[work] = (wid, src)
SENTINELS = [("1-meqabyan", "1 Meqabyan"), ("2-meqabyan", "2 Meqabyan"), ("3-meqabyan", "3 Meqabyan"), ("tegsats", "Tegsats"),
             ("josippon", "Josippon"), ("rest-of-words-of-baruch", "Rest of the Words of Baruch"), ("ascension-of-isaiah", "Ascension of Isaiah"),
             ("odes", "Odes"), ("psalms-of-solomon", "Psalms of Solomon")]
for work, title in SENTINELS:
    tradition, lang, src = ("septuagint", "grc", "rahlfs-hanhart-2006") if work in ("odes", "psalms-of-solomon") else ("geez", "gez", "ethiopic-edition-pending")
    wit_lines.append(f"  - {{id: book-review-{work}, work_id: {work}, tradition: {tradition}, language: {lang}, edition: {q(title + ' (book-level review only)')}, citations: [{{source_id: {src}, locator: {q(title)}}}]}}")

# ------------------------------------------------------------------ files
files = defaultdict(lambda: defaultdict(list))


def cite(work, loc):
    wid, src = CENSUS_WITNESS[work]
    return f"{{source_id: {src}, locator: {q(loc)}, witness_id: {wid}}}", wid


def compress(title, refs):
    refs = sorted(refs)
    if len(refs) <= 12:
        out, last = [], None
        for c, v in refs:
            out.append((f"; {c}:{v}" if last is not None else f"{c}:{v}") if c != last else f", {v}")
            last = c
        return f"{title} " + "".join(out)
    chs = sorted({c for c, v in refs})
    rng, s, pr = [], chs[0], chs[0]
    for c in chs[1:] + [None]:
        if c is not None and c == pr + 1:
            pr = c
            continue
        rng.append(f"{s}" if s == pr else f"{s}-{pr}")
        if c is not None:
            s = pr = c
    return f"{title} {', '.join(rng)}"


home = {}
for pid, rec in people.items():
    home[pid] = next(iter(rec["refs"]))
for pid, rec in sorted(people.items()):
    if rec["new"]:
        work = home[pid]
        c1 = min(rec["refs"][work])
        ct, _ = cite(work, f"{TITLE[work]} {c1[0]}:{c1[1]}")
        name = rec["names"][0]
        desc = rec["desc"][0] if rec["desc"] else ""
        notes = " ".join(dict.fromkeys(rec["notes"] + ([MERGE_NOTES[pid]] if pid in MERGE_NOTES else [])))
        extra = f", identity_note: {q(notes)}" if notes else ""
        files[work]["entities"].append(
            f"  - {{id: {pid}, entity_type: human, primary_name: {q(name[0].upper() + name[1:])}, classification: {'unnamed_person' if rec['unnamed'] else 'named_person'}, "
            f"identity_status: {'unnamed_unique' if rec['unnamed'] else 'named'}, aliases: [{', '.join(q(n) for n in rec['names'][1:])}], gender: {rec['gender'] or 'unknown'}, "
            f"description: {q(desc)}{extra}, citations: [{ct}]}}")
    for work, refs in rec["refs"].items():
        ct, wid = cite(work, compress(TITLE[work], refs))
        files[work]["claims"].append(
            f"  - {{id: {pid}-{work}-attested, subject_id: {pid}, predicate: attested_in_passage, value: {{kind: attestation, status: {q('named in ' + TITLE[work])}}}, "
            f"evidence_type: explicit_text, witness_id: {wid}, confidence: B, interpretation_note: {q('Located in a public-domain English translation of this witness; the original-language reading and verse numbering have not been checked.')}, "
            f"citations: [{ct}]}}")
    for code, a in rec["ages"]:
        ref = parse_ref(a.get("verse"))
        u = unit_for(code, ref) if ref else None
        if not u or not isinstance(a.get("years"), int):
            log["age_skipped"].append((pid, a))
            continue
        ct, wid = cite(u[1], f"{u[2]} {a['verse']}")
        files[u[1]]["claims"].append(
            f"  - {{id: {pid}-{slug(a.get('what', 'age'))}-{a['years']}-{u[1]}, subject_id: {pid}, predicate: {slug(a.get('what', 'age')).replace('-', '_')}, "
            f"value: {{kind: duration, value: {a['years']}, unit: years}}, evidence_type: explicit_text, witness_id: {wid}, confidence: B, citations: [{ct}]}}")

# relationships
existing_pairs = {(r.relationship_type, r.subject_id, r.object_id) for r in ds.relationships.values()}
parents_of = defaultdict(set)
for r in ds.relationships.values():
    if r.relationship_type == "parent":
        parents_of[r.object_id].add(r.subject_id)
gender_of = {e.id: getattr(e, "gender", None) for e in ds.entities.values()}
gender_of.update({pid: r["gender"] for pid, r in people.items() if r["new"]})
new_edges = []
for pid, rec in people.items():
    for code, tgt, verse in rec["parents"]:
        if pid in DENY_CHILD_PARENT_LINKS or (tgt, pid) in {("levi", "jochebed")}:
            log["denied"].append((tgt, pid))
            ref = parse_ref(verse) or min(rec["refs"][home[pid]])
            u = unit_for(code, ref) or (None, home[pid], TITLE[home[pid]])
            ct, wid = cite(u[1], f"{u[2]} {ref[0]}:{ref[1]}")
            files[u[1]]["claims"].append(
                f"  - {{id: {pid}-parent-reference-{tgt}-{u[1]}, subject_id: {pid}, object_id: {tgt}, predicate: parent_reference, "
                f"value: {{kind: parent_reference, parent: {tgt}, status: {q('named as a child of ' + tgt + ' in ' + u[2])}}}, evidence_type: explicit_text, "
                f"witness_id: {wid}, confidence: B, interpretation_note: {q('The witnesses disagree about this parentage, so it is recorded as a claim rather than a parent relationship.')}, citations: [{ct}]}}")
            continue
        if (tgt, pid) in DROP_LINKS or tgt == pid or tgt not in people and tgt not in ds.entities:
            log["parent_link_dropped"].append((tgt, pid))
            continue
        if ("parent", tgt, pid) in existing_pairs:
            continue
        same = [x for x in parents_of[pid] if gender_of.get(x) == gender_of.get(tgt)]
        if same:
            log["parent_conflict"].append((tgt, pid, same))
            continue
        ref = parse_ref(verse) or min(rec["refs"][home[pid]])
        u = unit_for(code, ref) or (None, home[pid], TITLE[home[pid]])
        ct, _ = cite(u[1], f"{u[2]} {ref[0]}:{ref[1]}")
        if (tgt, pid) in DESCENT_LINKS:
            files[u[1]]["relationships"].append(f"  - {{id: {tgt}-ancestor-of-{pid}, relationship_type: ancestor, subject_id: {tgt}, object_id: {pid}, claim_ids: [], interpretation_note: {q(DESCENT_LINKS[(tgt, pid)])}, citations: [{ct}]}}")
            continue
        files[u[1]]["relationships"].append(f"  - {{id: {tgt}-parent-{pid}, relationship_type: parent, subject_id: {tgt}, object_id: {pid}, claim_ids: [], citations: [{ct}]}}")
        existing_pairs.add(("parent", tgt, pid))
        parents_of[pid].add(tgt)
        new_edges.append((tgt, pid))
    for code, tgt, verse in rec["spouses"]:
        a, b = sorted([pid, tgt])
        if ("spouse", a, b) in existing_pairs or ("spouse", b, a) in existing_pairs or a == b or (tgt not in people and tgt not in ds.entities):
            continue
        ref = parse_ref(verse) or min(rec["refs"][home[pid]])
        u = unit_for(code, ref) or (None, home[pid], TITLE[home[pid]])
        ct, _ = cite(u[1], f"{u[2]} {ref[0]}:{ref[1]}")
        files[u[1]]["relationships"].append(f"  - {{id: {a}-spouse-{b}, relationship_type: spouse, subject_id: {a}, object_id: {b}, claim_ids: [], citations: [{ct}]}}")
        existing_pairs.add(("spouse", a, b))

# ------------------------------------------------------------------ dated events
SE_EPOCH = 312  # Seleucid era: year N corresponds to about 312 - N BCE (autumn or spring reckoning shifts this by up to a year)
event_ids_by_chapter = defaultdict(list)
dated = 0
for code, out in outputs.items():
    for i, de in enumerate(out.get("dated_events", [])):
        ref = parse_ref(de.get("verse"))
        u = unit_for(code, ref) if ref else None
        if not u:
            continue
        work = u[1]
        evid = f"{work}-dated-{ref[0]}-{ref[1]}" + (f"-{i}" if f"{work}-dated-{ref[0]}-{ref[1]}" in event_ids_by_chapter.get("_seen", []) else "")
        event_ids_by_chapter.setdefault("_seen", []).append(evid)
        ct, wid = cite(work, f"{u[2]} {de['verse']}")
        val = {"kind": "relative_date"}
        claim_ids = []
        if de.get("seleucid_year"):
            val = {"kind": "seleucid_era_date", "year_number": de["seleucid_year"]}
        elif de.get("jubilee"):
            val = {"kind": "jubilees_date", "jubilee": de.get("jubilee"), "week": de.get("week"), "year": de.get("year")}
            if de.get("anno_mundi_if_computable"):
                val["anno_mundi"] = de["anno_mundi_if_computable"]
        elif de.get("regnal_year"):
            val = {"kind": "regnal_date", "king_text": de.get("king"), "year_number": de.get("regnal_year")}
        for k in ("month", "day"):
            if de.get(k) not in (None, ""):
                val[k] = de[k]
        vtxt = "{" + ", ".join(f"{k}: {q(v)}" for k, v in val.items()) + "}"
        note = de.get("note")
        files[work]["claims"].append(f"  - {{id: {evid}-date, subject_id: {evid}, predicate: event_date_in_text, value: {vtxt}, evidence_type: explicit_text, witness_id: {wid}, confidence: B"
                                     + (f", interpretation_note: {q(note)}" if note else "") + f", citations: [{ct}]}}")
        claim_ids.append(f"{evid}-date")
        if de.get("seleucid_year"):
            y = SE_EPOCH - int(de["seleucid_year"]) + 1
            files[work]["claims"].append(f"  - {{id: {evid}-display-year, subject_id: {evid}, predicate: event_date, value: {{kind: historical_year, era: BCE, year: {y}}}, evidence_type: calculated, confidence: C, "
                                         f"interpretation_note: \"Converted from the Seleucid era (year 1 = 312/311 BCE); the result may be one year off depending on spring or autumn reckoning.\", citations: [{ct}]}}")
            claim_ids.append(f"{evid}-display-year")
        parts = []
        for x in de.get("people") or []:
            pid = name_index[code].get(x) or MERGE_IDS.get(x, x)
            if pid in people or pid in ds.entities:
                parts.append(pid)
        pp = ", ".join(f"{{entity_id: {p}, role: named participant}}" for p in dict.fromkeys(parts))
        files[work]["events"].append(f"  - {{id: {evid}, event_type: dated_event, name: {q(de.get('event') or 'Dated event')}, participants: [{pp}], date_claim_ids: [{', '.join(claim_ids)}], citations: [{ct}]}}")
        event_ids_by_chapter[(work, ref[0])].append(evid)
        dated += 1

# ------------------------------------------------------------------ section events, passages, inventory
chapter_people = defaultdict(set)
for pid, rec in people.items():
    for work, refs in rec["refs"].items():
        for c, v in refs:
            chapter_people[(work, c)].add(pid)
for u in {u[1]: u for u in units}.values():
    code, work, title, ranges, wkind = u
    counts = defaultdict(int)
    for pid, rec in people.items():
        counts[pid] = len(rec["refs"].get(work, ()))
    top = [p for p in sorted(counts, key=lambda p: (-counts[p], p)) if counts[p]][:8]
    evid = f"{work}-narrative"
    ct, wid = cite(work, title)
    pp = ", ".join(f"{{entity_id: {p}, role: named participant}}" for p in top)
    files[work]["events"].append(f"  - {{id: {evid}, event_type: book_narrative, name: {q(title)}, participants: [{pp}], date_claim_ids: [], citations: [{ct}]}}")
    for ch in sorted(unit_chapters[work]):
        wid_, src = CENSUS_WITNESS[work]
        loc = f"{title} {ch}"
        pids = [f"{work}-{ch}-census"]
        files[work]["passages"].append(f"  - {{id: {work}-{ch}-census, work_id: {work}, witness_id: {wid_}, locator: {q(loc)}, citations: [{{source_id: {src}, locator: {q(loc)}, witness_id: {wid_}}}]}}")
        if wkind == "web" and work != "ezra-sutuel":
            lw = f"lxx-{work}-rahlfs-hanhart"
            files[work]["passages"].append(f"  - {{id: {work}-{ch}-lxx, work_id: {work}, witness_id: {lw}, locator: {q(loc)}, correspondence_note: \"Chapter correspondence with the Greek edition is assumed, not checked.\", citations: [{{source_id: rahlfs-hanhart-2006, locator: {q(loc)}, witness_id: {lw}}}]}}")
            pids.append(f"{work}-{ch}-lxx")
        elif wkind != "web":
            gw = f"geez-{work}-charles"
            gsrc = "charles-ethiopic-enoch-1906" if work == "1-enoch" else "charles-ethiopic-jubilees-1895"
            files[work]["passages"].append(f"  - {{id: {work}-{ch}-geez, work_id: {work}, witness_id: {gw}, locator: {q(loc)}, citations: [{{source_id: {gsrc}, locator: {q(loc)}, witness_id: {gw}}}]}}")
            pids.append(f"{work}-{ch}-geez")
        ppl = sorted(chapter_people[(work, ch)])
        evs = [evid] + event_ids_by_chapter.get((work, ch), [])
        files[work]["inventory"].append(
            f"  - {{id: inv-{work}-{ch}, work_id: {work}, locator: {q(loc)}, reviewed: true, passage_ids: [{', '.join(pids)}], identified_entity_ids: [{', '.join(ppl)}], "
            f"event_ids: [{', '.join(evs)}], no_individuals: {'false' if ppl else 'true'}, review_basis: \"Person census from a public-domain translation, checked verse by verse by a census pass; see the work's witness notes.\", "
            f"citations: [{{source_id: {src}, locator: {q(loc)}, witness_id: {wid_}}}]}}")
for work, title in SENTINELS:
    files[work]["passages"].append(f"  - {{id: {work}-book-review, work_id: {work}, witness_id: book-review-{work}, locator: {q(title)}, citations: [{{source_id: {'rahlfs-hanhart-2006' if work in ('odes', 'psalms-of-solomon') else 'ethiopic-edition-pending'}, locator: {q(title)}, witness_id: book-review-{work}}}]}}")
    files[work]["inventory"].append(
        f"  - {{id: inv-{work}-book, work_id: {work}, locator: {q(title)}, reviewed: false, passage_ids: [{work}-book-review], identified_entity_ids: [], event_ids: [], no_individuals: false, "
        f"review_basis: {q('Book-level canon entry only. Person extraction is pending a citable edition or public-domain translation; no people are asserted.')}, "
        f"citations: [{{source_id: {'rahlfs-hanhart-2006' if work in ('odes', 'psalms-of-solomon') else 'ethiopic-edition-pending'}, locator: {q(title)}}}]}}")

# ------------------------------------------------------------------ chronology
def bce(y):
    return -y.year if y.era == "BCE" else y.year


B, D, fixed, why = {}, {}, set(), {}
for eid, ls in L.items():
    B[eid], D[eid] = -bce(ls.birth_year), -bce(ls.death_year)
    fixed.add(eid)
B["noah-wife"], D["noah-wife"] = B["noah"], D["noah"]  # overridden below (Jubilees 4:33 makes her the sons' mother)
chapter_year = {}
for key, spans in K.CHAPTER_DATES.items():
    for a, z, ya, yz in spans:
        for ch in range(a, z + 1):
            chapter_year[(key, ch)] = round(ya + (yz - ya) * ((ch - a) / (z - a) if z > a else 0))
CODE_OF_WORK = {u[1]: u[0] for u in units}


def genealogical(code, ref):
    """A verse with two or more 'son of' phrases is a patronymic chain; ancestors named there are not present in the scene."""
    text = web.get(code, {}).get(ref, "")
    return len(re.findall(r"\b(?:son|daughter) of\b", text)) >= 2
for pid, rec in people.items():
    if pid in fixed:
        continue
    if pid in K.FIXED:
        b, d, note = K.FIXED[pid]
        B[pid], D[pid] = b, d
        why[pid] = ("C" if pid == "alexander-the-great" else "E", note + (" Birth year is editorial." if pid != "alexander-the-great" else ""))
        fixed.add(pid)
        continue
    years = []
    for work, refs in rec["refs"].items():
        key = work if work in K.CHAPTER_DATES else CODE_OF_WORK.get(work)
        code_ = CODE_OF_WORK.get(work)
        years += [chapter_year[(key, c)] for c, v in refs if (key, c) in chapter_year and not genealogical(code_, (c, v))]
    if years:
        B[pid] = max(years) + 35
        D[pid] = max(min(years) - 5, B[pid] - 100)
        D[pid] = min(D[pid], B[pid] - 40)
        why[pid] = ("E", f"Grade-E display window from the narrative setting of {TITLE[home[pid]]} (about {max(years)} BCE); the text states no lifespan.")
for pid, rec in people.items():  # explicit lifespans / age at death
    for code, a in rec["ages"]:
        if pid in B and pid not in fixed and a.get("what", "").lower() in ("lifespan", "age at death", "age_at_death") and isinstance(a.get("years"), int):
            D[pid] = B[pid] - a["years"]
            why[pid] = (why[pid][0], why[pid][1] + f" The lifespan of {a['years']} years is stated in the text ({a.get('verse')}).")
# genealogy-only people: place by family links (iterate)
edges = [(r.subject_id, r.object_id) for r in ds.relationships.values() if r.relationship_type == "parent"] + new_edges
for _ in range(60):
    changed = False
    for p, c in edges:
        if c in people and c not in B and p in B:
            B[c] = B[p] - 30
            D[c] = B[c] - 65
            why[c] = ("E", "Grade-E display window placed one editorial generation after a parent; the text states no age.")
            changed = True
        elif p in people and p not in B and c in B:
            B[p] = B[c] + 30
            D[p] = B[p] - 65
            why[p] = ("E", "Grade-E display window placed one editorial generation before a child; the text states no age.")
            changed = True
    if not changed:
        break
for _ in range(5):  # spouses known only through a marriage take their partner's generation
    for pid, rec in people.items():
        if pid in B:
            continue
        for code, tgt, verse in rec["spouses"]:
            if tgt in B:
                B[pid] = B[tgt] - 5
                D[pid] = D[tgt]
                why[pid] = ("E", "Grade-E display window placed in the generation of the spouse named in the text; no age is stated.")
                break
    for pid, rec in people.items():
        for code, tgt, verse in rec["spouses"]:
            if tgt in people and tgt not in B and pid in B:
                B[tgt] = B[pid] + 5
                D[tgt] = D[pid]
                why[tgt] = ("E", "Grade-E display window placed in the generation of the spouse named in the text; no age is stated.")
for _ in range(60):
    changed = False
    for p, c in edges:
        if c in people and c not in B and p in B:
            B[c], D[c] = B[p] - 30, B[p] - 95
            why[c] = ("E", "Grade-E display window placed one editorial generation after a parent; the text states no age.")
            changed = True
    if not changed:
        break
for _ in range(200):  # enforce order: unfixed child at least 20 after parent; unfixed parent alive at child's birth
    changed = False
    for p, c in edges:
        if p not in B or c not in B:
            continue
        if B[p] - B[c] < 20:
            if c not in fixed:
                span = B[c] - D[c]
                B[c] = B[p] - 20
                D[c] = B[c] - span
                changed = True
            elif p not in fixed:
                span = B[p] - D[p]
                B[p] = B[c] + 20
                D[p] = B[p] - span
                changed = True
        if B[c] < D[p] and p not in fixed:
            D[p] = max(B[c], B[p] - 100)
            changed = True
    if not changed:
        break
ANCHOR_TO = {  # people placed only by a dated contemporary: id -> (anchor, years born before the anchor, span, note)
    "midwife-at-noahs-birth": ("noah", 25, 70, "attends Noah's birth (1 Enoch 106)"),
    "adoran-the-aramaean": ("esau", 0, 80, "fights with Esau's sons against Jacob (Jubilees 38)"),
    "makamaron-king-of-canaan": ("joseph", -20, 70, "acts after Joseph's death (Jubilees 46)"),
    "king-of-egypt-slain-by-makamaron": ("joseph", -20, 60, "killed by Makamaron after Joseph's death (Jubilees 46)"),
}
for pid, (anchor, before, span, note) in ANCHOR_TO.items():
    if pid in people and pid not in B and anchor in B:
        B[pid] = B[anchor] + before
        D[pid] = B[pid] - span
        why[pid] = ("E", f"Grade-E display window anchored to {anchor}: the person {note}; the offset is editorial.")
for _ in range(3):  # new parents stay alive for their children's births (longer lives allowed in the antediluvian/patriarchal era)
    for p, c in edges:
        if p in people and p not in fixed and p in B and c in B and B[c] < D[p]:
            cap = B[p] - (1000 if B[p] > 2000 else 120)
            D[p] = max(B[c], cap)
for pid, rec in people.items():  # fallback: anyone still unplaced takes the narrative setting of their first chapter
    if pid in B:
        continue
    work = home[pid]
    key = work if work in K.CHAPTER_DATES else CODE_OF_WORK.get(work)
    ys = [chapter_year[(key, c)] for c, v in rec["refs"][work] if (key, c) in chapter_year]
    if ys:
        B[pid], D[pid] = max(ys) + 35, max(ys) - 30
        why[pid] = ("E", f"Grade-E display window from the narrative setting of {TITLE[work]} (about {max(ys)} BCE); named only in a genealogy or list, with no age stated.")
missing = [p for p in people if p not in B]
log["no_window"] = missing
der, res = [], []
for pid in sorted(people):
    if pid in L or pid not in B:
        continue
    b, d = B[pid], D[pid]
    if d >= b:
        d = b - 1
    grade, expl = why.get(pid, ("E", "Grade-E display window."))
    der.append(f"      - {{id: dc-{pid}-birth, operation: literal, year: {{era: BCE, year: {b}}}}}")
    der.append(f"      - {{id: dc-{pid}-death, operation: literal, year: {{era: BCE, year: {d}}}}}")
    res.append(f"      - {{entity_id: {pid}, birth_derivation_id: dc-{pid}-birth, death_derivation_id: dc-{pid}-death, life_basis: {'synchronized' if grade != 'E' else 'editorial_estimate'}, confidence_grade: {grade}, "
               f"evidence_claim_ids: [{pid}-{home[pid]}-attested], alternative_claim_ids: [], explanation: {q(expl)}}}")

print("people:", len(people), "new:", sum(1 for r in people.values() if r["new"]), "existing:", sum(1 for r in people.values() if not r["new"]),
      "edges:", len(new_edges), "dated events:", dated)
print({k: len(v) for k, v in log.items()})
json.dump({k: v for k, v in log.items()}, open(scratch / "dcgen_log.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
if DRY:
    sys.exit(0)
KIND = {"entities": "entities", "claims": "claims", "relationships": "relationships", "events": "events", "inventory": "inventory_units", "passages": "passages"}
for work, kinds in files.items():
    d = root / "data" / work
    d.mkdir(parents=True, exist_ok=True)
    for kind, lines in kinds.items():
        if lines:
            (d / f"{kind}.yaml").write_text(f"schema_version: 1\nrecord_type: {KIND[kind]}\nrecords:\n" + "\n".join(lines) + "\n", encoding="utf-8")
(root / "data/catalog/dc_sources.yaml").write_text("schema_version: 1\nrecord_type: sources\nrecords:\n" + "\n".join(src_lines) + "\n", encoding="utf-8")
(root / "data/catalog/dc_witnesses.yaml").write_text("schema_version: 1\nrecord_type: witnesses\nrecords:\n" + "\n".join(wit_lines) + "\n", encoding="utf-8")
ch = root / "data/chronology/hybrid_reference.yaml"
t = ch.read_text(encoding="utf-8")
t = t.replace("\n    resolutions:\n", "\n" + "\n".join(der) + "\n    resolutions:\n", 1)
t = t.rstrip("\n") + "\n" + "\n".join(res) + "\n"
import chronoedit  # noqa: E402
nb, nd = -bce(L["noah"].birth_year), -bce(L["noah"].death_year)
t = t.replace("\n    resolutions:\n", f"\n      - {{id: dc-noah-wife-birth, operation: literal, year: {{era: BCE, year: {nb}}}}}\n"
              f"      - {{id: dc-noah-wife-death, operation: literal, year: {{era: BCE, year: {nd}}}}}\n    resolutions:\n", 1)
lines = t.split("\n")
chronoedit.override(lines, "noah-wife", {"birth_derivation_id": "dc-noah-wife-birth", "death_derivation_id": "dc-noah-wife-death",
                                         "explanation": q("Grade-E window matching Noah's display life: Jubilees 4:33 names her Emzara and makes her the mother of Shem, Ham, and Japheth, so she cannot share their birth year. No age is stated.")}, L, q)
ch.write_text("\n".join(lines), encoding="utf-8", newline="")
print("written")
