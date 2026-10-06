"""Compile TIPNR + curated knowledge into project YAML for the whole Old Testament person census.

Usage: otgen.py <repo> <tipnr.json> <bridge.json> [--dry-run]

Writes:
  data/catalog/ot_sources.yaml, data/catalog/ot_witnesses.yaml
  data/<work>/{entities,claims,relationships,events,inventory,passages}.yaml for Joshua-Malachi
  data/<pentateuch work>/tipnr_review/{entities,claims,relationships}.yaml
  edits existing Pentateuch inventory units in place (adds people), and appends to the hybrid chronology.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

root = Path(sys.argv[1])
sys.path.insert(0, str(root / "src"))
sys.path.insert(0, str(Path(__file__).parent))
from bible_timeline.chronology import resolve_model  # noqa: E402
from bible_timeline.loader import load_dataset  # noqa: E402
import curated as C  # noqa: E402

DRY = "--dry-run" in sys.argv
tip = json.load(open(sys.argv[2], encoding="utf-8"))
bridge = json.load(open(sys.argv[3], encoding="utf-8"))
ds = load_dataset(root / "data", root / "schemas")
lifespans = resolve_model(ds, "hybrid_reference").lifespans
log = defaultdict(list)


def q(s):
    return json.dumps(s, ensure_ascii=False)


def by(n):
    return -n.year if n.era == "BCE" else n.year


# ------------------------------------------------------------------ book tables
PENT = [("Gen", "genesis", "Genesis", 50), ("Exo", "exodus", "Exodus", 40), ("Lev", "leviticus", "Leviticus", 27),
        ("Num", "numbers", "Numbers", 36), ("Deu", "deuteronomy", "Deuteronomy", 34)]
PENT_WITNESS = {"Gen": ("bhs-genesis", "mt-genesis-bhs"), "Exo": ("bhs-exodus", "mt-exodus-bhs"), "Lev": ("bhs-leviticus", "mt-leviticus-bhs"),
                "Num": ("bhs-numbers", "mt-numbers-bhs"), "Deu": ("bhs-deuteronomy", "mt-deuteronomy-bhs")}
BOOK = {b[0]: b for b in C.BOOKS}
PENTATEUCH_CODES_EARLY = {"Gen", "Exo", "Lev", "Num", "Deu"}
WORK = {**{b[0]: b[1] for b in C.BOOKS}, **{p[0]: p[1] for p in PENT}}
TITLE = {**{b[0]: b[2] for b in C.BOOKS}, **{p[0]: p[2] for p in PENT}}
ORDER = [p[0] for p in PENT] + [b[0] for b in C.BOOKS]
OT = set(ORDER)
OT_LATER = {b[0] for b in C.BOOKS}


def mt_cite(code, loc):
    if code in PENT_WITNESS:
        src, wid = PENT_WITNESS[code]
    else:
        src, wid = f"bhs-{WORK[code]}", f"mt-{WORK[code]}-bhs"
    return f"{{source_id: {src}, locator: {q(loc)}, witness_id: {wid}}}", wid


def lxx_chapter(code, ch):
    """Greek chapter label for an English chapter."""
    if code == "Neh":
        return f"2 Esdras {ch + 10}"
    if code == "Psa":
        if ch <= 8 or ch >= 148:
            n = str(ch) if ch != 148 else "148"
        elif ch in (9, 10):
            n = "9"
        elif 11 <= ch <= 113:
            n = str(ch - 1)
        elif ch in (114, 115):
            n = "113"
        elif ch == 116:
            n = "114-115"
        elif 117 <= ch <= 146:
            n = str(ch - 1)
        else:  # 147
            n = "146-147"
        return f"Psalms {n}"
    if code == "Jer":
        jer = {25: "25:1-13; 32", 46: "26", 47: "29:1-7", 48: "31", 49: "29:8-23; 30; 25:14-20", 50: "27", 51: "28"}
        if ch in jer:
            return f"Jeremiah {jer[ch]}"
        if 26 <= ch <= 43:
            return f"Jeremiah {ch + 7}"
        if ch == 44:
            return "Jeremiah 51:1-30"
        if ch == 45:
            return "Jeremiah 51:31-35"
        return f"Jeremiah {ch}"
    if code == "Mal" and ch == 4:
        return "Malachi 3:19-24"
    if code == "Jol" and ch == 3:
        return "Joel 4"
    return f"{BOOK[code][4]} {ch}"


# ------------------------------------------------------------------ select TIPNR persons
NON_PERSON = re.compile(r"^(People|A military group|Word sometimes)")
SKIP_UIDS = {"Jerusalem_wives@2Sa.5.13", "Shiloh@Gen.49.10", "father_of_Mamre@Gen.14.13", "husband_of_Matred@Gen.36.39",
             "a_wife_of_Eliphaz@Gen.36.11-1Ch", "a_wife_of_Simeon@Gen.46.10"}
REF_DROP = {("Kenaz@Num.32.12-1Ch", "Num")}  # 'the Kenizzite' is a gentilic, not an appearance of Kenaz himself
persons = {}
for r in tip:
    if not r["gender"] or NON_PERSON.match(r["description"]) or r["uid"] in SKIP_UIDS or r["uid"].startswith("Unnamed#"):
        continue
    person_refs = [tuple(x) for f in r["forms"] if "Group" not in f["label"] for x in f["refs"]]
    refs = [(b, c, v) for b, c, v in person_refs if b in OT and (r["uid"], b) not in REF_DROP and (r["uid"], b, c, v) not in C.REF_DROP_VERSE]
    if refs:
        r = dict(r)
        r["otrefs"] = sorted(set(map(tuple, refs)), key=lambda x: (ORDER.index(x[0]), x[1], x[2]))
        persons[r["uid"]] = r

for src, dst in C.MERGE_UIDS.items():
    s, d = persons.pop(src), persons[dst]
    d["forms"] = d["forms"] + s["forms"]
    d["otrefs"] = sorted(set(d["otrefs"]) | set(s["otrefs"]), key=lambda x: (ORDER.index(x[0]), x[1], x[2]))
    for k in ("father", "mother", "partners"):
        d[k] = d[k] + [x for x in s[k] if x["id"] not in {y["id"] for y in d[k]}]
    for r in persons.values():
        for k in ("father", "mother", "partners"):
            for x in r[k]:
                if x["id"] == src:
                    x["id"] = dst

MANUAL_MAP = {
    "Abimael@Gen.10.28-1Ch": "abimael", "Adah@Gen.26.34-": "adah-esau", "Ammihud@Num.34.20": "ammihud-simeon",
    "Ammihud@Num.34.28": "ammihud-naphtali", "Dishan@Gen.36.21-1Ch": "dishan-horite", "Dishon@Gen.36.21-1Ch": "dishon-horite",
    "Dishon@Gen.36.25-1Ch": "dishon-anah", "Hadad@Gen.36.39-1Ch": "hadar-edom", "Havilah@Gen.10.29-1Ch": "havilah-joktan",
    "Havilah@Gen.10.7-1Ch": "havilah-cush", "Hezron@Gen.46.12-Luk": "hezron-perez", "Mahalath@Gen.28.9-": "mahalath-esau",
    "Mash@Gen.10.23-1Ch": "mash", "Meshech@Gen.10.2-1Ch": "meshech", "Nahor@Gen.11.22-Luk": "nahor-father-terah",
    "Phicol@Gen.21.22-": "phicol-gen21", "Sheba@Gen.10.28-1Ch": "sheba-joktan", "Sheba@Gen.10.7-Jol": "sheba-raamah",
    "Zerah@Gen.36.13-1Ch": "zerah-esau", "Zerah@Gen.36.33-1Ch": "zerah-edom-king", "Pharaoh@Exo.3.10-Rom": "pharaoh-exodus-second",
    "Pharaoh@Gen.12.15-": "pharaoh-gen12", "daughter_of_Pharaoh@Exo.2.5": "pharaoh-daughter-exodus",
    "daughter_of_Putiel@Exo.6.25": "eleazar-wife", "daughter1_of_Lot@Gen.19.37": "lot-daughter-older",
    "daughter2_of_Lot@Gen.19.38": "lot-daughter-younger", "a_wife_of_Lot@Gen.19.15-": "lot-wife",
    "Bath-shua@Gen.38.2-1Ch": "judah-wife", "Mezahab@Gen.36.39-1Ch": "mezahab-edom",
}
uid2id = {**bridge["mapped"], **MANUAL_MAP}
for uid in list(uid2id):
    if uid not in persons:
        uid2id.pop(uid)  # Pentateuch-only person with no OT refs left (should not happen) or excluded
existing_ids = set().union(*(set(getattr(ds, f.name)) for f in __import__("dataclasses").fields(ds) if isinstance(getattr(ds, f.name), dict) and f.name != "record_paths"))
existing_ids |= {b[1] for b in C.BOOKS} | {f"{b[1]}-{n}" for b in C.BOOKS for n in range(1, 151)}

name_count = defaultdict(int)
for r in tip:
    name_count[r["uid"].split("@")[0]] += 1


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def display_name(uid):
    n = uid.split("@")[0].replace("_", " ")
    n = re.sub(r"^(a |the )", "", n)
    n = re.sub(r"\d", "", n).strip()
    return n[0].upper() + n[1:]


for uid, eid in list(uid2id.items()):
    if eid in C.EPONYMS and uid in persons:
        r = persons[uid]
        kept = [x for x in r["otrefs"] if x[0] in PENTATEUCH_CODES_EARLY or (x[0], x[1]) in C.EPONYM_LATER_CONTEXTS]
        log["eponym_refs_dropped"].append((eid, len(r["otrefs"]) - len(kept)))
        r["otrefs"] = kept
used = set(existing_ids)
new_persons = {}
for uid, r in sorted(persons.items(), key=lambda kv: (ORDER.index(kv[1]["otrefs"][0][0]), kv[1]["otrefs"][0][1], kv[0])):
    if uid in uid2id:
        continue
    base = slug(display_name(uid))
    b, c, v = r["otrefs"][0]
    cand = base if name_count[uid.split("@")[0]] == 1 and base not in used else f"{base}-{b.lower()}{c}"
    if cand in used:
        cand = f"{base}-{b.lower()}{c}-{v}"
    n = 2
    while cand in used:
        cand = f"{base}-{b.lower()}{c}-{v}-{n}"
        n += 1
    used.add(cand)
    uid2id[uid] = cand
    new_persons[uid] = cand


FIND_FAIL = {}
CURATED_IDS = {x[0] for x in C.UNNAMED + C.NAMED_EXTRA}


def find(name, kw=""):
    """Resolve a TIPNR person by uid, curated id, or name plus keyword to our id."""
    if "@" in name:
        return uid2id[name]
    if name in CURATED_IDS:
        return name
    cands = [r for r in persons.values() if r["uid"].split("@")[0] == name]
    if kw:
        cands = [r for r in cands if kw.lower() in (r["brief"] + " " + r["description"] + " " + r.get("briefest", "")).lower()]
    if len(cands) != 1:
        allc = [(r["uid"], r["brief"]) for r in persons.values() if r["uid"].split("@")[0] == name]
        if DRY:
            FIND_FAIL[(name, kw)] = allc
            return f"UNRESOLVED-{slug(name)}"
        raise SystemExit(f"find({name!r}, {kw!r}) -> {allc}")
    return uid2id[cands[0]["uid"]]


def resolve_ref(x):
    return x if isinstance(x, str) else find(*x)


# ------------------------------------------------------------------ chapter dating
chapter_year = {}
for code, a, z, ya, yz in C.CHAPTER_DATES:
    for ch in range(a, z + 1):
        chapter_year[(code, ch)] = round(ya + (yz - ya) * ((ch - a) / (z - a) if z > a else 0))

# ------------------------------------------------------------------ people per chapter
chapter_people = defaultdict(set)
person_book_refs = defaultdict(lambda: defaultdict(list))
for uid, r in persons.items():
    eid = uid2id[uid]
    for b, c, v in r["otrefs"]:
        chapter_people[(b, c)].add(eid)
        person_book_refs[eid][b].append((c, v))
info = {}  # our id -> dict(name, gender, kind)
for uid, r in persons.items():
    info[uid2id[uid]] = {"uid": uid, "rec": r}
for uid_id, name, gender, refs, desc, parents in C.UNNAMED + C.NAMED_EXTRA:
    for b, c, v in refs:
        chapter_people[(b, c)].add(uid_id)
        person_book_refs[uid_id][b].append((c, v))

# ------------------------------------------------------------------ outputs
files = defaultdict(lambda: defaultdict(list))  # dir -> kind -> lines


def out_dir(code, review=False):
    w = WORK[code]
    return f"{w}/tipnr_review" if code in PENTATEUCH_CODES or review else w


PENTATEUCH_CODES = {p[0] for p in PENT}


def compress(code, refs):
    refs = sorted(set(refs))
    if len(refs) <= 12:
        parts, last = [], None
        for c, v in refs:
            parts.append(f"{c}:{v}" if c != last else f"{v}")
            last = c
        s = ""
        prev_c = None
        for (c, v), p in zip(refs, parts):
            s += (p if not s else (", " + p if c == prev_c else "; " + p))
            prev_c = c
        return f"{TITLE[code]} {s}"
    chs = sorted({c for c, v in refs})
    ranges, start, prev = [], chs[0], chs[0]
    for c in chs[1:] + [None]:
        if c is not None and c == prev + 1:
            prev = c
            continue
        ranges.append(f"{start}" if start == prev else f"{start}-{prev}")
        if c is not None:
            start = prev = c
    return f"{TITLE[code]} {', '.join(ranges)}"


TIPNR_SRC = "tipnr-stepbible"
NAMED_EXTRA_IDS = {x[0] for x in C.NAMED_EXTRA}

# entities
for uid, eid in new_persons.items():
    r = persons[uid]
    b, c, v = r["otrefs"][0]
    nm = display_name(uid)
    unnamed = "_" in uid.split("@")[0]
    aliases = sorted({n for f in r["forms"] for n in f["names"] if n and n != "[ ]" and n != nm and not n.startswith("[")})
    cite, _ = mt_cite(b, f"{TITLE[b]} {c}:{v}")
    desc = r["brief"] or r["description"]
    fields = [f"id: {eid}", "entity_type: human", f"primary_name: {q(nm)}",
              f"classification: {'unnamed_person' if unnamed else 'named_person'}",
              f"identity_status: {'unnamed_unique' if unnamed else 'named'}", f"aliases: [{', '.join(q(a) for a in aliases)}]",
              f"gender: {r['gender']}", f"description: {q(desc)}", f"tipnr_id: {q(uid)}",
              f"citations: [{cite}, {{source_id: {TIPNR_SRC}, locator: {q(uid)}}}]"]
    files[out_dir(b)]["entities"].append("  - {" + ", ".join(fields) + "}")
for uid_id, name, gender, refs, desc, parents in C.UNNAMED + C.NAMED_EXTRA:
    b, c, v = refs[0]
    cite, _ = mt_cite(b, f"{TITLE[b]} {c}:{v}")
    files[out_dir(b)]["entities"].append(
        f"  - {{id: {uid_id}, entity_type: human, primary_name: {q(name)}, classification: {'named_person' if uid_id in NAMED_EXTRA_IDS else 'unnamed_person'}, identity_status: {'named' if uid_id in NAMED_EXTRA_IDS else 'unnamed_unique'}, "
        f"aliases: [], gender: {gender}, description: {q(desc)}, citations: [{cite}]}}")
    info[uid_id] = {"uid": None, "rec": None, "name": name}

# MT attestation claims: every (person, later book) and (new person or newly inventoried, Pentateuch book)
existing_pent_chapters = defaultdict(set)
pent_ranges = defaultdict(list)  # (code, ch) -> [(first_verse, last_verse, unit)]


def unit_span(title, loc):
    """Chapters/verses covered by an inventory locator such as 'Genesis 11', 'Genesis 11:10-26', 'Genesis 1:1-2:3'."""
    m = re.fullmatch(re.escape(title) + r" (\d+)(?::(\d+))?(?:-(\d+)(?::(\d+))?)?", loc)
    if not m:
        return None
    c1, v1, x, v2 = m.groups()
    c1 = int(c1)
    if v1 is None:
        if x is None:
            return [(c1, 1, 999)]
        return [(c, 1, 999) for c in range(c1, int(x) + 1)]
    v1 = int(v1)
    if x is None:
        return [(c1, v1, v1)]
    if v2 is None:
        return [(c1, v1, int(x))]
    c2, v2 = int(x), int(v2)
    return [(c, v1 if c == c1 else 1, v2 if c == c2 else 999) for c in range(c1, c2 + 1)]


for u in ds.inventory_units.values():
    for code, work, title, n in PENT:
        if u.work_id == work:
            span = unit_span(title, u.locator)
            if not span:
                log["unparsed_pent_locator"].append(u.locator)
                continue
            for ch, a, z in span:
                pent_ranges[(code, ch)].append((a, z, u))
                for e in u.identified_entity_ids:
                    existing_pent_chapters[e].add((code, ch))


def pent_unit_for(code, ch, v):
    for a, z, u in pent_ranges.get((code, ch), []):
        if a <= v <= z:
            return u
    return None


pent_additions = defaultdict(set)  # (code, ch) -> ids to add
for eid, books in person_book_refs.items():
    for code, refs in books.items():
        if code in PENTATEUCH_CODES:
            if eid in C.EPONYMS:
                continue  # curated Pentateuch inventories already decide where the person (not the tribe) appears
            new_refs = [(c, v) for c, v in refs if (code, c) not in existing_pent_chapters[eid]]
            if not new_refs:
                continue
            for c, v in new_refs:
                u = pent_unit_for(code, c, v)
                if u is not None:
                    pent_additions[u.id].add(eid)
                else:
                    log["no_pent_unit"].append((code, c, v))
            refs = new_refs
        cite, wid = mt_cite(code, compress(code, refs))
        files[out_dir(code)]["claims"].append(
            f"  - {{id: {eid}-{WORK[code]}-mt-attested, subject_id: {eid}, predicate: attested_in_passage, "
            f"value: {{kind: attestation, status: {q('named in ' + TITLE[code])}}}, evidence_type: explicit_text, witness_id: {wid}, "
            f"confidence: A, citations: [{cite}]}}")
        if code in OT_LATER and len(refs) >= C.VERSION_PRESENCE_MIN_REFS:
            versions = [("lxx", f"lxx-{WORK[code]}-rahlfs-hanhart", "rahlfs-hanhart-2006", BOOK[code][4])]
            if BOOK[code][5]:
                versions.append(("geez", f"geez-{WORK[code]}-dillmann", "dillmann-octateuch-1853", TITLE[code]))
            for tag, wid2, src, label in versions:
                files[out_dir(code)]["claims"].append(
                    f"  - {{id: {eid}-{WORK[code]}-{tag}-presence, subject_id: {eid}, predicate: attested_in_passage, "
                    f"value: {{kind: attestation, status: {q('present in ' + label + ' (book level)')}}}, evidence_type: editorial_inference, "
                    f"witness_id: {wid2}, confidence: C, interpretation_note: {q('Inferred from the person being named ' + str(len(refs)) + ' times in the Masoretic book; name forms and verse-level presence have not yet been checked in this witness.')}, "
                    f"citations: [{{source_id: {src}, locator: {q(label)}, witness_id: {wid2}}}]}}")

# ------------------------------------------------------------------ relationships
existing_parent = defaultdict(set)
existing_pairs = set()
for rel in ds.relationships.values():
    existing_pairs.add((rel.relationship_type, rel.subject_id, rel.object_id))
    if rel.relationship_type == "parent":
        existing_parent[rel.object_id].add(rel.subject_id)
gender_of = {e.id: getattr(e, "gender", None) for e in ds.entities.values()}
for uid, eid in uid2id.items():
    gender_of.setdefault(eid, persons[uid]["gender"])
for uid_id, name, gender, refs, desc, parents in C.UNNAMED + C.NAMED_EXTRA:
    gender_of[uid_id] = gender

DENY_CHILD_PARENT_LINKS = {"ard", "naaman", "gera", "rosh", "ehi", "muppim", "huppim", "ahiman-anak", "sheshai-anak", "talmai-anak"}
DENY_PAIRS = {("levi", "jochebed"), ("ahasuerus", "darius-dan5"), ("ahasuerus", "artaxerxes"), ("vashti", "artaxerxes"), ("vashti", "darius-dan5"), ("ephrathah", "ram-rut4")}
rel_lines = defaultdict(list)
parents_of = defaultdict(set)
for rel in ds.relationships.values():
    if rel.relationship_type == "parent":
        parents_of[rel.object_id].add(rel.subject_id)
new_parent_edges = []
pending_parent = []


def shared_cite(a_uid, b_uid, fallback):
    ra = set(persons[a_uid]["otrefs"]) if a_uid else set()
    rb = set(persons[b_uid]["otrefs"]) if b_uid else set()
    both = sorted(ra & rb, key=lambda x: (ORDER.index(x[0]), x[1], x[2]))
    later = [x for x in both if x[0] in OT_LATER]
    pick = (later or both or [fallback])[0]
    return pick


def add_parent(p, c, ref, note=None):
    if c in DENY_CHILD_PARENT_LINKS or (p, c) in DENY_PAIRS or p == c:
        log["denied"].append((p, c))
        return
    if ("parent", p, c) in existing_pairs:
        return
    same_gender = [x for x in parents_of[c] if gender_of.get(x) == gender_of.get(p)]
    if same_gender:
        log["parent_conflict"].append((p, c, same_gender))
        return
    pending_parent.append((p, c, ref, note))
    existing_pairs.add(("parent", p, c))
    parents_of[c].add(p)
    new_parent_edges.append((p, c))


def add_spouse(a, b, ref):
    if ("spouse", a, b) in existing_pairs or ("spouse", b, a) in existing_pairs or a == b:
        return
    code, ch, v = ref
    cite, _ = mt_cite(code, f"{TITLE[code]} {ch}:{v}")
    rid = f"{a}-spouse-{b}"
    rel_lines[out_dir(code)].append(
        f"  - {{id: {rid}, relationship_type: spouse, subject_id: {a}, object_id: {b}, claim_ids: [], citations: [{cite}]}}")
    existing_pairs.add(("spouse", a, b))


for uid, r in persons.items():
    c_id = uid2id[uid]
    for key in ("father", "mother"):
        for par in r[key]:
            if set(par["flags"]) & {"a", "d", "f"} or par["id"] not in persons:
                continue
            p_id = uid2id[par["id"]]
            if "?" in par["flags"]:
                log["uncertain_parent_links_skipped"].append((p_id, c_id))
                continue
            if not ({(b, ch) for b, ch, v in persons[par["id"]]["otrefs"]} & {(b, ch) for b, ch, v in r["otrefs"]}):
                log["no_shared_chapter"].append((p_id, c_id))
                continue
            ref = shared_cite(par["id"], uid, r["otrefs"][0])
            add_parent(p_id, c_id, ref, None)
    for par in r["partners"]:
        if par["id"] not in persons or set(par["flags"]) & {"a", "d", "f", "?"}:
            continue
        if not ({(b, ch) for b, ch, v in persons[par["id"]]["otrefs"]} & {(b, ch) for b, ch, v in r["otrefs"]}):
            log["no_shared_chapter"].append((uid2id[par["id"]], c_id))
            continue
        a, b = sorted([c_id, uid2id[par["id"]]])
        add_spouse(a, b, shared_cite(par["id"], uid, r["otrefs"][0]))
for uid_id, name, gender, refs, desc, parents in C.UNNAMED + C.NAMED_EXTRA:
    for p in parents:
        add_parent(resolve_ref(p), uid_id, refs[0])
for p, child in C.UNNAMED_PARENT_OF:
    cid = resolve_ref(child)
    ref = next(iter(person_book_refs[cid].items()))
    code = ref[0]
    add_parent(p, cid, (code, *sorted(ref[1])[0]))
for par, child, ref in C.FIRST_PERSON_PARENTS:
    add_parent(resolve_ref(par), resolve_ref(child), ref, "The parent narrates the birth in the first person.")
for a, b in C.UNNAMED_SPOUSES:
    a, b = resolve_ref(a), resolve_ref(b)
    unnamed_id = a if a in CURATED_IDS else b
    code, ch, v = next(u for u in C.UNNAMED if u[0] == unnamed_id)[3][0]
    add_spouse(*sorted([a, b]), (code, ch, v))

# ------------------------------------------------------------------ explicit claims (rulers + others)
fixed = {}       # id -> (birth, death, grade, explanation, evidence claim ids)
explicit_claim_ids = defaultdict(list)


def verse_code(verse):
    title = re.match(r"^((?:\d )?[A-Za-z ]+?) \d", verse).group(1)
    return next(code for code, t in TITLE.items() if t == title)


def add_claim(cid, subject, predicate, value, verse, note=None, witness="mt", confidence="A", evidence="explicit_text", object_id=None):
    code = verse_code(verse)
    if witness == "mt":
        cite, wid = mt_cite(code, verse)
    else:
        wid = f"lxx-{WORK[code]}-rahlfs-hanhart"
        cite = f"{{source_id: rahlfs-hanhart-2006, locator: {q(BOOK[code][4] + verse[len(TITLE[code]):])}, witness_id: {wid}}}"
    fields = [f"id: {cid}", f"subject_id: {subject}"]
    if object_id:
        fields.append(f"object_id: {object_id}")
    fields += [f"predicate: {predicate}", f"value: {value}", f"evidence_type: {evidence}", f"witness_id: {wid}", f"confidence: {confidence}"]
    if note:
        fields.append(f"interpretation_note: {q(note)}")
    fields.append(f"citations: [{cite}]")
    files[out_dir(code)]["claims"].append("  - {" + ", ".join(fields) + "}")
    explicit_claim_ids[subject].append(cid)
    return cid


ruler_ids = {}
for name, kw, acc, end, age, age_v, reign, reign_v, b_over, d_over, note in C.RULERS:
    rid = find(name, kw)
    ruler_ids[(name, kw)] = rid
    ev = []
    if age is not None:
        ev.append(add_claim(f"{rid}-age-at-accession", rid, "age_at_accession", f"{{kind: duration, value: {age}, unit: years}}", age_v.split(";")[0].strip(), note=None))
    if reign:
        m = re.match(r"(\d+) (years|months|days|year|month)", reign)
        val = f"{{kind: duration, value: {m.group(1)}, unit: {m.group(2).rstrip('s') + 's'}, text: {q(reign)}}}" if m else f"{{kind: text, text: {q(reign)}}}"
        ev.append(add_claim(f"{rid}-reign-length", rid, "reign_length", val, reign_v.split(";")[0].strip()))
    birth = b_over if b_over is not None else acc + age
    death = d_over
    grade = "C" if age is not None else "E"
    expl = (f"Reign {acc}-{end} BCE follows a conventional synchronized chronology of the monarchies (grade C, external anchors). "
            + (f"Birth is computed from the explicit accession age of {age}. " if age is not None else "Birth is an editorial estimate; the text gives no age. ")
            + (note or ""))
    fixed[rid] = (birth, death, grade, expl.strip(), ev)
# 2 Chronicles variants (Masoretic) that conflict with Kings
add_claim("ahaziah-judah-age-variant-2ch", find("Ahaziah", "judah"), "age_at_accession", "{kind: duration, value: 42, unit: years}", "2 Chronicles 22:2",
          note="Conflicts with 2 Kings 8:26 (22 years), which the display chronology follows.")
add_claim("jehoiachin-age-variant-2ch", find("Jehoiachin"), "age_at_accession", "{kind: duration, value: 8, unit: years}", "2 Chronicles 36:9",
          note="Conflicts with 2 Kings 24:8 (18 years), which the display chronology follows.")
for name, kw, pred, val, verse, note in C.EXPLICIT:
    pid = find(name, kw)
    add_claim(f"{pid}-{pred.replace('_', '-')}-{val}", pid, pred, f"{{kind: duration, value: {val}, unit: years}}", verse.split(";")[0].strip(), note=note)
# Reported Septuagint numeric variants (recorded at grade C until checked against the printed edition)
add_claim("eli-judged-years-lxx", find("Eli"), "judged_years", "{kind: duration, value: 20, unit: years}", "1 Samuel 4:18", witness="lxx", confidence="C",
          note="Reported Septuagint reading (1 Reigns 4:18); not yet checked against Rahlfs-Hanhart.")
add_claim("job-years-after-restoration-lxx", find("Job"), "years_after_restoration", "{kind: duration, value: 170, unit: years, total_lifespan: 240}", "Job 42:16",
          witness="lxx", confidence="C", note="Reported Old Greek reading (170 years after the affliction, 240 in all); not yet checked against Rahlfs-Hanhart.")

# fixed lives from explicit ages (non-rulers)
eli = find("Eli")
fixed[eli] = (1178, 1080, "E", "Eli was 98 at death (1 Samuel 4:15); the death year is placed at the ark's capture in the editorial narrative chronology.", explicit_claim_ids[eli])
jehoiada = find("Jehoiada", "priest")
fixed[jehoiada] = (945, 815, "E", "Jehoiada died at 130 (2 Chronicles 24:15) during Joash's reign; the death year is editorial.", explicit_claim_ids[jehoiada])
barz = find("Barzillai", "gileadite")
fixed[barz] = (1060, 970, "E", "Barzillai was 80 at Absalom's revolt (2 Samuel 19:32); dates are editorial.", explicit_claim_ids[barz])
meph = find("Mephibosheth", "jonathan")
fixed[meph] = (1015, 950, "E", "Mephibosheth was five when Saul and Jonathan died (2 Samuel 4:4), placed at 1010 BCE; his death is not narrated.", explicit_claim_ids[meph])

# also resolve dated-event participants now so all lookup failures surface together
for _e in C.DATED_EVENTS:
    for _n, _k in _e[9]:
        find(_n, _k)
if FIND_FAIL:
    for k, v in FIND_FAIL.items():
        print("FIND", k, v)
    sys.exit(1)

joshua, caleb = find("Joshua", "moses' assistant"), find("Caleb@Num.13.6-1Ch")
fixed[joshua] = (1500, 1390, "E", "Joshua died at 110 (Joshua 24:29; Judges 2:8). Birth keeps the earlier grade-E placement (1500 BCE, fifty at the Exodus), so death falls in 1390 BCE; the absolute years remain editorial.", explicit_claim_ids[joshua])
fixed[caleb] = (1489, 1390, "E", "Caleb was 40 when sent as a spy in the second year after the Exodus (Joshua 14:7) and 85 forty-five years later (Joshua 14:10); with the model's 1450 BCE Exodus this places his birth in 1489 BCE. The death year is not stated and remains editorial.", explicit_claim_ids[caleb])

fixed["elishama-ephraim"] = (1545, 1440, "E", "Elishama son of Ammihud led Ephraim at the Sinai census (Numbers 1:10); 1 Chronicles 7:26-27 also makes him the grandfather of Joshua. Honoring both texts puts him in his nineties at the census. The display years are editorial.", [])
fixed["nun-ephraim"] = (1525, 1440, "E", "Grade-E window for Joshua's father, placed between his father Elishama (1 Chronicles 7:26-27) and Joshua's display birth in 1500 BCE. No age is stated.", [])
fixed["potiphera"] = (1905, 1800, "E", "Grade-E window for Asenath's father, the priest of On (Genesis 41:45); placed a generation before Asenath. No age is stated.", [])

# ------------------------------------------------------------------ chronology windows
# Years are BCE numbers (larger = earlier). B = display birth, D = display death.
ERA_RE = re.compile(r"time of (.*)|living (before Israel's Monarchy)")
BOOK_ERA = {"Job": "the Patriarchs"}


def era_of(eid):
    rec = info.get(eid, {}).get("rec")
    m = ERA_RE.search(rec["description"]) if rec else None
    if m:
        return (m.group(1) or m.group(2)).strip()
    books = list(person_book_refs.get(eid, {}))
    return BOOK_ERA.get(books[0]) if books else None


explicit_subjects = {c.subject_id for c in ds.claims.values()
                     if c.confidence == "A" and c.predicate in {"lifespan", "age_at_event", "age_at_birth_of", "age_at_accession"}}
B, D, basis, fixed_ids, existing_adjustable = {}, {}, {}, set(), set()
for eid, ls in lifespans.items():
    B[eid], D[eid] = -by(ls.birth_year), -by(ls.death_year)
    fixed_ids.add(eid)  # existing windows stay put; residual conflicts among them are rechained afterwards
orig = {eid: (B[eid], D[eid]) for eid in lifespans}
# Curated fixed lives (rulers, explicit ages), including overrides of existing people.
for rid, (b, d, g, e, ev) in fixed.items():
    B[rid], D[rid] = b, d
    fixed_ids.add(rid)
    existing_adjustable.discard(rid)

first_last = {}
for eid, books in person_book_refs.items():
    years = [chapter_year[(code, c)] for code, refs in books.items() for c, v in refs
             if (code, c) in chapter_year and (code, c) not in C.UNDATED_CHAPTERS and (code, c, v) not in C.UNDATED_VERSES]
    if years:
        first_last[eid] = (max(years), min(years))
guess = {}
for eid in list(first_last):
    rng = C.ERA_BIRTH.get(era_of(eid))
    if rng and eid not in B:
        b_narr = first_last[eid][0] + C.LEAD_IN
        if b_narr < rng[1] - C.ERA_TOLERANCE and eid not in ("nacon",):
            log["retrospective_first_mention"].append((eid, first_last[eid][0], era_of(eid)))
            first_last.pop(eid)
for eid in set(person_book_refs) - set(B):
    if eid in first_last:
        fy, ly = first_last[eid]
        guess[eid] = fy + C.LEAD_IN
        basis[eid] = f"first appears in a narrative set about {fy} BCE"
    else:
        era = era_of(eid)
        rng = C.ERA_BIRTH.get(era)
        guess[eid] = (rng[0] + rng[1]) // 2 if rng else None
        basis[eid] = f"genealogical or poetic mention only; placed in the {era} period" if rng else "genealogical mention only; placed by family links"
        if not rng:
            log["no_era"].append(eid)

nodes = set(B) | set(guess)
descent = set()
# 1 Chronicles 26:24 makes 'Shebuel son of Gershom, son of Moses' chief treasurer under David: descent, not parenthood.
FORCE_DESCENT = {("gershom", "shebuel-1ch23"), (find("Salmon@Rut.4.20-Luk"), find("Boaz@Rut.2.1-Luk"))}
for p, c, ref, note in pending_parent:
    p_end = D[p] if p in B else (max(first_last[p][1], first_last[p][0] - 30) if p in first_last else None)
    c_birth = B[c] if c in B else (first_last[c][0] + C.LEAD_IN if c in first_last else None)
    if (p, c) in FORCE_DESCENT or (p_end is not None and c_birth is not None and c_birth < p_end - C.DESCENT_GAP):
        descent.add((p, c))
log["descent_links"] = sorted(descent)
new_parent_edges = [(p, c) for p, c in new_parent_edges if (p, c) not in descent]
for p, c, ref, note in pending_parent:
    code, ch, v = ref
    cite, _ = mt_cite(code, f"{TITLE[code]} {ch}:{v}")
    if (p, c) in descent:
        note2 = ("The text calls this person a son (or daughter) of the ancestor, but the narrative setting places the birth "
                 f"more than {C.DESCENT_GAP} years after the ancestor's death or last appearance, so the link is recorded as descent, not parenthood.")
        rel_lines[out_dir(code)].append(
            f"  - {{id: {p}-ancestor-of-{c}, relationship_type: ancestor, subject_id: {p}, object_id: {c}, claim_ids: [], interpretation_note: {q(note2)}, citations: [{cite}]}}")
    else:
        extra = f", interpretation_note: {q(note)}" if note else ""
        rel_lines[out_dir(code)].append(
            f"  - {{id: {p}-parent-{c}, relationship_type: parent, subject_id: {p}, object_id: {c}, claim_ids: []{extra}, citations: [{cite}]}}")
edges = sorted({(r.subject_id, r.object_id) for r in ds.relationships.values() if r.relationship_type == "parent"} | set(new_parent_edges))
edges = [(p, c) for p, c in edges if p in nodes and c in nodes]
children = defaultdict(list)
parents = defaultdict(list)
for p, c in edges:
    children[p].append(c)
    parents[c].append(p)

# topological order (parents first); break cycles
order, state = [], {}


def visit(n, stack):
    state[n] = 1
    for c in children[n]:
        if state.get(c) == 1:
            log["cycle"].append((n, c))
            continue
        if state.get(c) != 2:
            visit(c, stack)
    state[n] = 2
    order.append(n)


sys.setrecursionlimit(100000)
for n in sorted(nodes):
    if n not in state:
        visit(n, [])
order.reverse()
cyc = {tuple(x) for x in log["cycle"]}
edges = [(p, c) for p, c in edges if (p, c) not in cyc]
children = defaultdict(list)
parents = defaultdict(list)
for p, c in edges:
    children[p].append(c)
    parents[c].append(p)

INF = 10 ** 9


def solve(gap):
    """Place unfixed births (BCE numbers, larger = earlier) between bounds implied by fixed people and dated appearances."""
    free = {n for n in nodes if n not in fixed_ids and n not in first_last and not parents[n]}  # genealogy-only roots, e.g. mothers
    lower = {n: (B[n] if n in fixed_ids else -INF) for n in nodes}  # born no later than
    upper = {n: (B[n] if n in fixed_ids else INF) for n in nodes}   # born no earlier than
    for n, (fy, ly) in first_last.items():
        if n not in fixed_ids and n in lower:
            lower[n] = max(lower[n], fy)
    for p, c in edges:
        if p in fixed_ids and c not in fixed_ids:
            lower[c] = max(lower[c], D[p])                      # born while the fixed parent lived
        if c in fixed_ids and p not in fixed_ids:
            upper[p] = min(upper[p], B[c] + C.MAX_PARENT_AGE)   # parent not implausibly old at a fixed child's birth
    for n in reversed(order):
        for c in children[n]:
            if lower[c] > -INF and n not in fixed_ids:
                lower[n] = max(lower[n], lower[c] + gap)
    for n in order:
        for p in parents[n]:
            if upper[p] < INF and n not in fixed_ids and p not in free:
                upper[n] = min(upper[n], upper[p] - gap)
    out, infeasible = {}, []
    for n in order:
        if n in fixed_ids:
            out[n] = B[n]
            continue
        lo, hi = lower[n], upper[n]
        g = B[n] if n in B else guess.get(n)
        if g is None:
            g = lo if lo > -INF else (hi if hi < INF else 900)
        placed = [out[p] for p in parents[n] if p in out and p not in free]
        if placed:
            g = min(g, min(placed) - gap)
            if n not in first_last:
                g = max(g, max(placed) - C.MAX_PARENT_AGE)
        if lo > hi:
            infeasible.append(n)
            g = (lo + hi) // 2
        else:
            g = min(max(g, lo), hi)
        out[n] = g
    return out, infeasible


solved, infeasible = solve(20)
if infeasible:
    s12, inf12 = solve(12)
    for n in infeasible:
        solved[n] = s12[n]
    log["infeasible_at_gap20"] = infeasible
    log["infeasible_at_gap12"] = inf12
for n, b in solved.items():
    if n in fixed_ids:
        continue
    if n in orig:
        span = orig[n][0] - orig[n][1]
        d = b - span if b != orig[n][0] else orig[n][1]
    elif n in first_last:
        d = max(min(first_last[n][1] - 5, b - C.DEFAULT_SPAN), b - C.MAX_LIFE)
    else:
        d = b - C.DEFAULT_SPAN
    B[n], D[n] = b, d
# genealogy-only parents with no dated appearance are positioned relative to their children
for n in reversed(order):
    if n in fixed_ids or n in first_last or not children[n]:
        continue
    kids = [B[c] for c in children[n] if c in B]
    if not kids:
        continue
    anchored = [B[c] for c in children[n] if c in B and (c in fixed_ids or c in first_last)]
    kids = anchored or kids
    lo_ok, hi_ok = max(kids) + 20, min(kids) + C.MAX_PARENT_AGE
    if not (lo_ok <= B[n] <= hi_ok) and lo_ok <= hi_ok:
        span = B[n] - D[n]
        ps = [B[p] for p in parents[n] if p in B]
        target = max(lo_ok, max(kids) + 25)
        if ps:
            target = min(target, min(ps) - 20) if min(ps) - 20 >= lo_ok else target
        B[n], D[n] = target, target - span
        log["free_parent_moved"].append(n)
# undated children are re-clamped against (possibly moved) parents
for n in order:
    if n in fixed_ids or n in first_last or not parents[n]:
        continue
    ps = [B[p] for p in parents[n] if p in B]
    if not ps:
        continue
    lo_b, hi_b = max(ps) - C.MAX_PARENT_AGE, min(ps) - 20
    anchored_kids = [B[c] for c in children[n] if c in B and (c in fixed_ids or c in first_last)]
    if anchored_kids:  # anchored descendants take priority over the parent-age preference
        lo_b = max(lo_b, max(anchored_kids) + 20) if max(anchored_kids) + 20 <= hi_b else max(anchored_kids) + 20
        lo_b, hi_b = max(anchored_kids) + 20, min(hi_b, min(anchored_kids) + C.MAX_PARENT_AGE)
        lo_b = max(lo_b, max(ps) - C.MAX_PARENT_AGE) if max(ps) - C.MAX_PARENT_AGE <= hi_b else lo_b
    if lo_b <= hi_b and not (lo_b <= B[n] <= hi_b):
        span = B[n] - D[n]
        B[n] = min(max(B[n], lo_b), hi_b)
        D[n] = B[n] - span
        log["undated_child_reclamped"].append(n)
# parents must be alive at each child's birth
for n in reversed(order):
    if n in fixed_ids:
        continue
    kids = [B[c] for c in children[n] if c in B]
    if kids and D[n] > min(kids):
        if B[n] - C.MAX_LIFE > min(kids) and n not in first_last:
            ps = [B[p] for p in parents[n] if p in B]
            new_b = min(kids) + C.MAX_LIFE
            if not ps or new_b <= min(ps) - 20:
                B[n] = new_b
                log["parent_shifted_for_child"].append(n)
        D[n] = max(min(kids), B[n] - C.MAX_LIFE)
DEBUG = {"meshelemiah", "pedaiah-1ch3", "ir", "huppim-1ch7", "ephrathah", "machir", "daughter-of-machir"}
for n in sorted(DEBUG):
    if n in B:
        log["debug"].append((n, B[n], D[n], n in fixed_ids, n in first_last and first_last[n], parents[n], children[n][:8]))
for p, c in edges:
    if p in B and c in B and (B[p] - B[c] < 12 or B[c] < D[p]):
        log["implausible_after_solve"].append((p, c, (B[p], D[p]), (B[c], D[c])))
for eid, (fy, ly) in first_last.items():
    if eid in B and eid not in fixed_ids and B[eid] < fy:
        log["born_after_first_appearance"].append((eid, B[eid], fy))
changed_existing = sorted(n for n in existing_adjustable if (B[n], D[n]) != orig[n])
log["existing_windows_changed"] = [(n, orig[n], (B[n], D[n]), sorted(set(parents[n]) | set(children[n]))[:6]) for n in changed_existing]

der, res = [], []
for eid in sorted(set(B) - set(lifespans)):
    b, d = B[eid], D[eid]
    if d >= b:
        d = b - 1
    der.append(f"      - {{id: ot-{eid}-birth, operation: literal, year: {{era: BCE, year: {b}}}}}")
    der.append(f"      - {{id: ot-{eid}-death, operation: literal, year: {{era: BCE, year: {d}}}}}")
    first_book = WORK[next(iter(person_book_refs[eid]))]
    if eid in fixed:
        fb, fd, grade, expl, ev = fixed[eid]
        claims = ev or [f"{eid}-{first_book}-mt-attested"]
        basis_s = "synchronized" if grade == "C" else "editorial_estimate"
    else:
        grade, basis_s = "E", "editorial_estimate"
        claims = [f"{eid}-{first_book}-mt-attested"]
        expl = (f"Grade-E display window: {basis[eid]}. The birth is placed about {C.LEAD_IN} years before the first dated appearance where there is one, "
                "then constrained so parents are at least twenty years older than their children and alive at their births. "
                "The text states no age or lifespan.")
    res.append(f"      - {{entity_id: {eid}, birth_derivation_id: ot-{eid}-birth, death_derivation_id: ot-{eid}-death, life_basis: {basis_s}, "
               f"confidence_grade: {grade}, evidence_claim_ids: [{', '.join(claims)}], alternative_claim_ids: [], explanation: {q(expl)}}}")
# overrides of existing people: adjusted grade-E windows and curated explicit-age lives
overrides = {}
for eid in changed_existing:
    b, d = B[eid], D[eid]
    der.append(f"      - {{id: ot-{eid}-birth, operation: literal, year: {{era: BCE, year: {b}}}}}")
    der.append(f"      - {{id: ot-{eid}-death, operation: literal, year: {{era: BCE, year: {d}}}}}")
    overrides[eid] = lifespans[eid].explanation.rstrip() + (
        " Adjusted when the later genealogies (Joshua-Malachi) linked this person to others: the display window keeps parents at least "
        "twenty years older than their children and alive at their births. The adjustment is editorial.")
for eid in [x for x in fixed if x in lifespans]:
    b, d = B[eid], D[eid]
    der.append(f"      - {{id: ot-{eid}-birth, operation: literal, year: {{era: BCE, year: {b}}}}}")
    der.append(f"      - {{id: ot-{eid}-death, operation: literal, year: {{era: BCE, year: {d}}}}}")
    overrides[eid] = fixed[eid][3]

for d, lines in rel_lines.items():
    files[d]["relationships"].extend(lines)

# ------------------------------------------------------------------ events
event_ids_by_chapter = defaultdict(list)
for code, sections in C.SECTIONS.items():
    work = WORK[code]
    for a, z, name, typ in sections:
        evid = f"{work}-{a}-{z}-" + slug(name)[:48].rstrip("-")
        counts = defaultdict(int)
        for ch in range(a, z + 1):
            for eid in chapter_people[(code, ch)]:
                counts[eid] += sum(1 for c, v in person_book_refs[eid][code] if c == ch)
        top = sorted(counts, key=lambda e: (-counts[e], e))[:6]
        parts = ", ".join(f"{{entity_id: {e}, role: named participant}}" for e in top)
        loc = f"{TITLE[code]} {a}" + (f"-{z}" if z != a else "")
        cite, _ = mt_cite(code, loc)
        lxx = f"{{source_id: rahlfs-hanhart-2006, locator: {q(BOOK[code][4] + ' (corresponding to ' + loc + ')')}, witness_id: lxx-{work}-rahlfs-hanhart}}"
        files[work]["events"].append(f"  - {{id: {evid}, event_type: {typ}, name: {q(name)}, participants: [{parts}], date_claim_ids: [], citations: [{cite}, {lxx}]}}")
        for ch in range(a, z + 1):
            event_ids_by_chapter[(code, ch)].append(evid)

king_by_name = {}
for (name, kw), rid in ruler_ids.items():
    king_by_name.setdefault(name, rid)
king_by_name["Darius"] = find("Darius@Ezr.4.5-Zec")
king_by_name["Hoshea"] = find("Hoshea", "king of israel")
king_by_name["Hezekiah"] = find("Hezekiah", "king of judah")
king_by_name["Josiah"] = find("Josiah", "king of judah")
for evid, code, (a, z), name, typ, verse, rel, year, note, parts in C.DATED_EVENTS:
    work = WORK[code]
    claim_ids = []
    if rel:
        rel = dict(rel)
        if "king" in rel:
            rel["king"] = king_by_name[rel["king"]]
        val = "{" + ", ".join(f"{k}: {v}" for k, v in rel.items()) + "}"
        claim_ids.append(add_claim(f"{evid}-date-mt", evid, "relative_event_date" if "reference_event" in rel else "regnal_date",
                                   val, verse.split(";")[0].strip(), note=note))
    cite, _ = mt_cite(code, verse.split(";")[0].strip())
    files[work]["claims"].append(
        f"  - {{id: {evid}-display-year, subject_id: {evid}, predicate: event_date, value: {{kind: historical_year, era: BCE, year: {year}}}, "
        f"evidence_type: editorial_anchor, confidence: C, interpretation_note: {q('Display year from a conventional synchronized chronology; not stated in the text.')}, citations: [{cite}]}}")
    claim_ids.append(f"{evid}-display-year")
    pp = ", ".join(f"{{entity_id: {find(n, k)}, role: named participant}}" for n, k in parts)
    files[work]["events"].append(f"  - {{id: {evid}, event_type: {typ}, name: {q(name)}, participants: [{pp}], date_claim_ids: [{', '.join(claim_ids)}], citations: [{cite}]}}")
    for ch in range(a, z + 1):
        event_ids_by_chapter[(code, ch)].append(evid)

# ------------------------------------------------------------------ passages + inventory for Joshua-Malachi
for code, work, title, nch, lxx_title, geez, dbcode in C.BOOKS:
    for ch in range(1, nch + 1):
        pids = []
        mt_c, mt_w = mt_cite(code, f"{title} {ch}")
        pid = f"{work}-{ch}-mt"
        files[work]["passages"].append(f"  - {{id: {pid}, work_id: {work}, witness_id: {mt_w}, locator: {q(f'{title} {ch}')}, versification: english, citations: [{mt_c}]}}")
        pids.append(pid)
        lw = f"lxx-{work}-rahlfs-hanhart"
        lloc = lxx_chapter(code, ch)
        files[work]["passages"].append(f"  - {{id: {work}-{ch}-lxx, work_id: {work}, witness_id: {lw}, locator: {q(lloc)}, corresponds_to: {q(f'{title} {ch}')}, "
                                       f"citations: [{{source_id: rahlfs-hanhart-2006, locator: {q(lloc)}, witness_id: {lw}}}]}}")
        pids.append(f"{work}-{ch}-lxx")
        if geez:
            gw = f"geez-{work}-dillmann"
            files[work]["passages"].append(f"  - {{id: {work}-{ch}-geez, work_id: {work}, witness_id: {gw}, locator: {q(f'{title} {ch}')}, "
                                           f"citations: [{{source_id: dillmann-octateuch-1853, locator: {q(f'{title} {ch}')}, witness_id: {gw}}}]}}")
            pids.append(f"{work}-{ch}-geez")
        people = sorted(chapter_people[(code, ch)])
        evs = event_ids_by_chapter[(code, ch)]
        files[work]["inventory"].append(
            f"  - {{id: inv-{work}-{ch}, work_id: {work}, locator: {q(f'{title} {ch}')}, reviewed: true, passage_ids: [{', '.join(pids)}], "
            f"identified_entity_ids: [{', '.join(people)}], event_ids: [{', '.join(evs)}], no_individuals: {'false' if people else 'true'}, "
            f"review_basis: {q('Person census cross-checked against the TIPNR proper-name index (English versification); unnamed individuals curated by hand.')}, "
            f"citations: [{mt_c}]}}")

# ------------------------------------------------------------------ catalog
src_lines, wit_lines = [], []
src_lines.append(f"  - {{id: {TIPNR_SRC}, source_type: reference_index, title: {q('TIPNR - Translators Individualised Proper Names with all References')}, "
                 f"bibliographic_locator: {q('STEPBible.org / Tyndale House Cambridge, STEPBible-Data repository, Proper Nouns')}, "
                 f"url: https://github.com/STEPBible/STEPBible-Data, license_status: cc_by_4_0_reference, "
                 f"usage_note: {q('Used as a completeness and disambiguation index for the person census; descriptions are quoted briefs under CC BY 4.0. The data file itself is not redistributed.')}}}")
for code, work, title, nch, lxx_title, geez, dbcode in C.BOOKS:
    src_lines.append(f"  - {{id: bhs-{work}, source_type: critical_edition, title: {q('Biblia Hebraica Stuttgartensia — ' + title)}, "
                     f"bibliographic_locator: {q('BHS text of Codex Leningradensis, German Bible Society 1967/77')}, url: https://www.die-bibel.de/en/bible/BHS/{dbcode}.1, "
                     f"license_status: copyrighted_download_permitted}}")
    note = C.MT_VERSIFICATION_NOTES.get(work)
    extra = f", versification_note: {q('Locators use English versification. ' + note)}" if note else ", versification_note: \"Locators use English versification, which matches the Masoretic chapter and verse numbering in this book.\""
    wit_lines.append(f"  - {{id: mt-{work}-bhs, work_id: {work}, tradition: masoretic, language: hbo, edition: {q('Biblia Hebraica Stuttgartensia, ' + title)}{extra}, "
                     f"citations: [{{source_id: bhs-{work}, locator: {q(title)}}}]}}")
    lnote = C.LXX_NOTES.get(work)
    lextra = f", structure_note: {q(lnote)}" if lnote else ""
    wit_lines.append(f"  - {{id: lxx-{work}-rahlfs-hanhart, work_id: {work}, tradition: septuagint, language: grc, edition: {q('Rahlfs-Hanhart Septuaginta, editio altera (2006): ' + lxx_title)}{lextra}, "
                     f"citations: [{{source_id: rahlfs-hanhart-2006, locator: {q(lxx_title)}}}]}}")
    if geez:
        wit_lines.append(f"  - {{id: geez-{work}-dillmann, work_id: {work}, tradition: geez, language: gez, edition: {q('Dillmann, Octateuchus Aethiopicus (1853–1855), digitized transcription')}, "
                         f"citations: [{{source_id: dillmann-octateuch-1853, locator: {q(title)}}}]}}")

# ------------------------------------------------------------------ write
report = {k: (v if k in ("solver_iterations",) else len(v)) for k, v in log.items()}
for k, v in FIND_FAIL.items():
    print("FIND", k, v)
print("new persons:", len(new_persons), "| unnamed curated:", len(C.UNNAMED), "| new parent edges:", len(new_parent_edges))
print("log:", report)
json.dump({k: v for k, v in log.items()}, open(Path(__file__).parent.parent / "otgen_log.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
if DRY:
    sys.exit(0)

KIND = {"entities": "entities", "claims": "claims", "relationships": "relationships", "events": "events", "inventory": "inventory_units", "passages": "passages"}
for d, kinds in files.items():
    path = root / "data" / d
    path.mkdir(parents=True, exist_ok=True)
    for kind, lines in kinds.items():
        if lines:
            fname = "ot_" + kind + ".yaml" if d in [p[1] for p in PENT] else kind + ".yaml"
            (path / fname).write_text(f"schema_version: 1\nrecord_type: {KIND[kind]}\nrecords:\n" + "\n".join(lines) + "\n", encoding="utf-8")
(root / "data/catalog/ot_sources.yaml").write_text("schema_version: 1\nrecord_type: sources\nrecords:\n" + "\n".join(src_lines) + "\n", encoding="utf-8")
(root / "data/catalog/ot_witnesses.yaml").write_text("schema_version: 1\nrecord_type: witnesses\nrecords:\n" + "\n".join(wit_lines) + "\n", encoding="utf-8")

# Pentateuch inventory additions (edit in place)
for uid_, ids in pent_additions.items():
    u = ds.inventory_units[uid_]
    p = ds.record_paths[u.id]
    t = p.read_text(encoding="utf-8")
    m = re.search(r"\bid: " + re.escape(u.id) + r"\b[^\n]*?identified_entity_ids: \[([^\]]*)\]", t)
    if not m:
        # block style
        m = re.search(r"id: " + re.escape(u.id) + r"\n(?:\s+[^\n]*\n)*?\s+identified_entity_ids: \[([^\]]*)\]", t)
    if not m:
        log["pent_unit_unedited"].append(u.id)
        continue
    cur = [x.strip() for x in m.group(1).split(",") if x.strip()]
    cur += [x for x in sorted(ids) if x not in cur]
    t = t[:m.start(1)] + ", ".join(cur) + t[m.end(1):]
    p.write_text(t, encoding="utf-8", newline="")

ch_path = root / "data/chronology/hybrid_reference.yaml"
t = ch_path.read_text(encoding="utf-8")
t = t.replace("\n    resolutions:\n", "\n" + "\n".join(der) + "\n    resolutions:\n", 1)
t = t.rstrip("\n") + "\n" + "\n".join(res) + "\n"
lines = t.split("\n")
import chronoedit  # noqa: E402
for eid, expl in overrides.items():
    chronoedit.override(lines, eid, {"birth_derivation_id": f"ot-{eid}-birth", "death_derivation_id": f"ot-{eid}-death",
                                     "explanation": q(expl)}, lifespans, q)
ch_path.write_text("\n".join(lines), encoding="utf-8", newline="")
print("written; pent units unedited:", log.get("pent_unit_unedited"))
