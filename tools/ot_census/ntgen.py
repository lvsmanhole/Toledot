"""Compile TIPNR + nt_curated.py into project YAML for the New Testament.

Usage: ntgen.py <repo> <tipnr.json> <bridge.json> [--dry-run]
Run once against a clean tree (restore data/ before re-running).
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
import curated as OTC  # noqa: E402
import nt_curated as C  # noqa: E402

DRY = "--dry-run" in sys.argv
tip = json.load(open(sys.argv[2], encoding="utf-8"))
bridge = json.load(open(sys.argv[3], encoding="utf-8"))
ds = load_dataset(root / "data", root / "schemas")
L = resolve_model(ds, "hybrid_reference").lifespans
log = defaultdict(list)


def q(s):
    return json.dumps(s, ensure_ascii=False)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


BOOK = {b[0]: b for b in C.BOOKS}
WORK = {b[0]: b[1] for b in C.BOOKS}
TITLE = {b[0]: b[2] for b in C.BOOKS}
ORDER = [b[0] for b in C.BOOKS]
NT = set(ORDER)
CODE_OF_TITLE = {b[2]: b[0] for b in C.BOOKS}


def witness(code):
    return f"greek-{WORK[code]}-na28"


def cite(code, loc):
    return f"{{source_id: na28, locator: {q(loc)}, witness_id: {witness(code)}}}"


def signed(hy):
    return -hy.year if hy.era == "BCE" else hy.year


def era_year(v):
    v = int(round(v))
    if v == 0:
        v = -1
    return ("BCE", -v) if v < 0 else ("CE", v)


# ------------------------------------------------------------------ identity map uid -> our id
uid2id = {}
for path in (root / "data").rglob("entities.yaml"):
    for m in re.finditer(r"\bid: ([a-z0-9-]+),[^\n]*?tipnr_id: \"([^\"]+)\"", path.read_text(encoding="utf-8")):
        uid2id[m.group(2)] = m.group(1)
uid2id.update(bridge["mapped"])
otgen_manual = re.search(r"MANUAL_MAP = \{(.*?)\n\}", (Path(__file__).parent / "otgen.py").read_text(encoding="utf-8"), re.S)
for a, b in re.findall(r'"([^"]+@[^"]+)": "([a-z0-9-]+)"', otgen_manual.group(1)):
    uid2id[a] = b
uid2id.update(C.MANUAL_MAP)
uid2id.pop("Jesus@Isa.7.14-Rev", None)  # the Isaiah record became Immanuel; Jesus is created here
uid2id = {u: i for u, i in uid2id.items() if i in ds.entities}

# ------------------------------------------------------------------ select persons with NT refs
NON_PERSON = re.compile(r"^(People|A military group|Word sometimes)")
web_verses = {}
for ln in open(Path(sys.argv[2]).parent / "dl/webvpl/eng-web_vpl.txt", encoding="utf-8"):
    m = re.match(r"^(\w+) (\d+):(\d+) (.*)", ln)
    if m:
        inv = {v: k for k, v in C.WEB_CODES.items()}
        if m.group(1) in inv:
            web_verses[(inv[m.group(1)], int(m.group(2)), int(m.group(3)))] = m.group(4)
persons = {}
split_to = defaultdict(list)  # curated id -> refs moved from index persons
for r in tip:
    if not r["gender"] or NON_PERSON.match(r["description"]) or r["uid"].startswith("Unnamed#") or r["uid"] in C.DROP_UIDS:
        continue
    forms = [f for f in r["forms"] if "Group" not in f["label"]]
    refs = [tuple(x) for f in forms for x in f["refs"] if x[0] in NT]
    if not refs:
        continue
    our = uid2id.get(r["uid"])
    if our in OTC.__dict__.get("EPONYMS", set()) or our in {"jacob", "judah", "ephraim", "benjamin", "manasseh", "levi", "reuben", "gad",
                                                            "naphtali", "zebulun", "asher", "issachar", "simeon", "dan", "joseph", "shechem",
                                                            "kedar", "merari", "kohath", "gershon", "korah-levite", "machir"}:
        jacob_forms = {tuple(x) for f in forms if set(f["names"]) & C.JACOB_PERSONAL_FORMS for x in f["refs"]} if our == "jacob" else set()
        kept = [x for x in refs if ((x[0], x[1]) in C.EPONYM_CONTEXTS or x in jacob_forms) and x not in C.JACOB_NATION_VERSES]
        log["eponym_refs_dropped"].append((our, len(refs) - len(kept)))
        refs = kept
    stems = {re.sub(r"[^A-Za-z]", "", n)[:4].lower() for f in forms for n in f["names"] if n and not n.startswith("[") and len(n) > 2}
    filtered = []
    for x in refs:
        if x in C.NOT_IN_NA28:
            log["not_in_na28_dropped"].append((r["uid"], x))
            continue
        if (x[0], x[1], x[2] + C.SUBSCRIPTION_CHECK_VERSES) not in web_verses and (x[0], x[1] + 1, 1) not in web_verses:
            text = web_verses.get(x, "").lower()
            if not any(s and s in text for s in stems):
                log["subscription_ref_dropped"].append((r["uid"], x))
                continue
        filtered.append(x)
    refs = filtered
    for uid, book, _, target in C.SPLIT_REFS:
        if r["uid"] == uid:
            moved = [x for x in refs if x[0] == book]
            refs = [x for x in refs if x[0] != book]
            split_to[target] += moved
    if refs:
        r = dict(r)
        r["ntrefs"] = sorted(set(refs), key=lambda x: (ORDER.index(x[0]), x[1], x[2]))
        persons[r["uid"]] = r

name_count = defaultdict(int)
for r in tip:
    name_count[r["uid"].split("@")[0]] += 1
existing_ids = set().union(*(set(getattr(ds, f)) for f in ("entities", "claims", "events", "relationships", "inventory_units", "passages",
                                                              "works", "witnesses", "sources", "canon_lists", "canon_memberships", "chronology_models")))
used = set(existing_ids) | {c[0] for c in C.CURATED}


def display_name(uid):
    n = uid.split("@")[0].replace("_", " ")
    n = re.sub(r"^(a |the )", "", n)
    n = re.sub(r"motherInLaw", "mother-in-law", n)
    return n[0].upper() + n[1:]


new_ids = {}
for uid, r in sorted(persons.items(), key=lambda kv: (ORDER.index(kv[1]["ntrefs"][0][0]), kv[1]["ntrefs"][0][1], kv[0])):
    if uid in uid2id:
        continue
    if uid == "Jesus@Isa.7.14-Rev":
        cand = "jesus"
    else:
        base = slug(display_name(uid))
        b, c, v = r["ntrefs"][0]
        cand = base if name_count[uid.split("@")[0]] == 1 and base not in used else f"{base}-{b.lower()}{c}"
        if cand in used:
            cand = f"{base}-{b.lower()}{c}-{v}"
    assert cand not in used, cand
    used.add(cand)
    uid2id[uid] = cand
    new_ids[uid] = cand


def rid(x):
    """Resolve a curated reference (uid or our id) to our id."""
    return uid2id.get(x, x) if "@" in x else x


# ------------------------------------------------------------------ people per chapter
person_refs = defaultdict(lambda: defaultdict(list))
for uid, r in persons.items():
    for b, c, v in r["ntrefs"]:
        person_refs[uid2id[uid]][b].append((c, v))
for cid, name, gender, refs, desc, unnamed in C.CURATED:
    for b, c, v in refs + split_to.get(cid, []):
        person_refs[cid][b].append((c, v))
chapter_people = defaultdict(set)
for pid, books in person_refs.items():
    for b, refs in books.items():
        for c, v in refs:
            chapter_people[(b, c)].add(pid)

files = defaultdict(lambda: defaultdict(list))


def compress(code, refs):
    refs = sorted(set(refs))
    if len(refs) <= 12:
        out, last = [], None
        for c, v in refs:
            out.append((f"; {c}:{v}" if last is not None else f"{c}:{v}") if c != last else f", {v}")
            last = c
        return f"{TITLE[code]} " + "".join(out)
    chs = sorted({c for c, v in refs})
    rng, s, pr = [], chs[0], chs[0]
    for c in chs[1:] + [None]:
        if c is not None and c == pr + 1:
            pr = c
            continue
        rng.append(f"{s}" if s == pr else f"{s}-{pr}")
        if c is not None:
            s = pr = c
    return f"{TITLE[code]} {', '.join(rng)}"


# entities
home = {}
for uid, pid in new_ids.items():
    r = persons[uid]
    b, c, v = r["ntrefs"][0]
    home[pid] = b
    name, note, unnamed = C.NAME_OVERRIDE.get(uid, (display_name(uid), None, "_" in uid.split("@")[0]))
    aliases = sorted({n for f in r["forms"] for n in f["names"] if n and not n.startswith("[") and n != name and "Group" not in f["label"]})
    desc = r["brief"] or r["description"]
    extra = f", identity_note: {q(note)}" if note else ""
    files[WORK[b]]["entities"].append(
        f"  - {{id: {pid}, entity_type: human, primary_name: {q(name)}, classification: {'unnamed_person' if unnamed else 'named_person'}, "
        f"identity_status: {'unnamed_unique' if unnamed else 'named'}, aliases: [{', '.join(q(a) for a in aliases)}], gender: {r['gender']}, "
        f"description: {q(desc)}{extra}, tipnr_id: {q(uid)}, citations: [{cite(b, f'{TITLE[b]} {c}:{v}')}, {{source_id: tipnr-stepbible, locator: {q(uid)}}}]}}")
for cid, name, gender, refs, desc, unnamed in C.CURATED:
    b, c, v = refs[0]
    home[cid] = b
    files[WORK[b]]["entities"].append(
        f"  - {{id: {cid}, entity_type: human, primary_name: {q(name)}, classification: {'unnamed_person' if unnamed else 'named_person'}, "
        f"identity_status: {'unnamed_unique' if unnamed else 'named'}, aliases: [], gender: {gender}, description: {q(desc)}, citations: [{cite(b, f'{TITLE[b]} {c}:{v}')}]}}")

# attestation claims
for pid, books in person_refs.items():
    for b, refs in books.items():
        files[WORK[b]]["claims"].append(
            f"  - {{id: {pid}-{WORK[b]}-na28-attested, subject_id: {pid}, predicate: attested_in_passage, value: {{kind: attestation, status: {q('named in ' + TITLE[b])}}}, "
            f"evidence_type: explicit_text, witness_id: {witness(b)}, confidence: A, citations: [{cite(b, compress(b, refs))}]}}")
        home.setdefault(pid, b)

# explicit ages
claim_ids_of = defaultdict(list)
for who, pred, val, verse, note in C.EXPLICIT:
    pid = rid(who)
    code = CODE_OF_TITLE[re.match(r"^((?:\d )?[A-Za-z ]+?) \d", verse).group(1)]
    cid = f"{pid}-{pred.replace('_', '-')}-{val}-{WORK[code]}"
    files[WORK[code]]["claims"].append(
        f"  - {{id: {cid}, subject_id: {pid}, predicate: {pred}, value: {{kind: duration, value: {val}, unit: years}}, evidence_type: explicit_text, "
        f"witness_id: {witness(code)}, confidence: A, interpretation_note: {q(note)}, citations: [{cite(code, verse)}]}}")
    claim_ids_of[pid].append(cid)

# ------------------------------------------------------------------ relationships
existing_pairs = {(r.relationship_type, r.subject_id, r.object_id) for r in ds.relationships.values()}
parents_of = defaultdict(set)
for r in ds.relationships.values():
    if r.relationship_type == "parent":
        parents_of[r.object_id].add(r.subject_id)
gender_of = {e.id: getattr(e, "gender", None) for e in ds.entities.values()}
for uid, pid in uid2id.items():
    if uid in persons:
        gender_of.setdefault(pid, persons[uid]["gender"])
for cid, name, gender, *_ in C.CURATED:
    gender_of[cid] = gender
DENY_CHILD = {"ard", "naaman", "gera", "rosh", "ehi", "muppim", "huppim", "ahiman-anak", "sheshai-anak", "talmai-anak"}
new_edges = []


def shared_ref(a_uid, b_uid):
    ra = {(x[0], x[1]): x for x in persons[a_uid]["ntrefs"]}
    rb = {(x[0], x[1]) for x in persons[b_uid]["ntrefs"]}
    both = sorted(set(ra) & rb, key=lambda x: (ORDER.index(x[0]), x[1]))
    return ra[both[0]] if both else None


def parent_claim(p, c, ref, note):
    b, ch, v = ref
    files[WORK[b]]["claims"].append(
        f"  - {{id: {c}-parent-reference-{p}-{WORK[b]}, subject_id: {c}, object_id: {p}, predicate: parent_reference, value: {{kind: parent_reference, parent: {p}}}, "
        f"evidence_type: explicit_text, witness_id: {witness(b)}, confidence: A, interpretation_note: {q(note)}, citations: [{cite(b, f'{TITLE[b]} {ch}:{v}')}]}}")


def add_parent(p, c, ref, genealogy):
    if ("parent", p, c) in existing_pairs or p == c:
        return
    same = [x for x in parents_of[c] if gender_of.get(x) == gender_of.get(p)]
    if ("ancestor", p, c) in existing_pairs:
        parent_claim(p, c, ref, "The New Testament genealogy says 'father of', but the Old Testament data records this link as descent across omitted generations; kept as a claim.")
        log["descent_kept_as_claim"].append((p, c))
        return
    if c in DENY_CHILD or same:
        parent_claim(p, c, ref, ("The New Testament genealogy names this parent, but the record already has "
                                 + (f"a different parent ({', '.join(sorted(same))})" if same else "a disputed parentage")
                                 + "; the reading is kept as a claim, not merged."))
        log["parent_conflict_as_claim"].append((p, c, sorted(same)))
        return
    b, ch, v = ref
    files[WORK[b]]["relationships"].append(
        f"  - {{id: {p}-parent-{c}, relationship_type: parent, subject_id: {p}, object_id: {c}, claim_ids: [], citations: [{cite(b, f'{TITLE[b]} {ch}:{v}')}]}}")
    existing_pairs.add(("parent", p, c))
    parents_of[c].add(p)
    new_edges.append((p, c, genealogy))


def add_spouse(a, b_, ref):
    a, b_ = sorted([a, b_])
    if ("spouse", a, b_) in existing_pairs or ("spouse", b_, a) in existing_pairs or a == b_:
        return
    bk, ch, v = ref
    files[WORK[bk]]["relationships"].append(
        f"  - {{id: {a}-spouse-{b_}, relationship_type: spouse, subject_id: {a}, object_id: {b_}, claim_ids: [], citations: [{cite(bk, f'{TITLE[bk]} {ch}:{v}')}]}}")
    existing_pairs.add(("spouse", a, b_))


for uid, r in persons.items():
    c_id = uid2id[uid]
    for key in ("father", "mother"):
        for par in r[key]:
            if set(par["flags"]) & {"a", "d", "f", "?"} or par["id"] not in persons:
                continue
            ref = shared_ref(par["id"], uid)
            if ref is None:
                log["no_shared_chapter"].append((uid2id[par["id"]], c_id))
                continue
            add_parent(uid2id[par["id"]], c_id, ref, (ref[0], ref[1]) in C.GENEALOGY_CHAPTERS)
    for par in r["partners"]:
        if par["id"] in persons and not set(par["flags"]) & {"a", "d", "f", "?"}:
            ref = shared_ref(par["id"], uid)
            if ref:
                add_spouse(c_id, uid2id[par["id"]], ref)
for p, c in C.CURATED_PARENTS:
    b, ch, v = sorted((bk, cv[0], cv[1]) for bk, refs in person_refs[c].items() for cv in refs)[0]
    add_parent(rid(p), rid(c), (b, ch, v), False)
for (name, _), target in C.CURATED_PARENTS_INDEX:
    src = rid(next(u for u in persons if u.startswith(name + "@") and target and any(x[0] in ("Mrk", "Mat") for x in persons[u]["ntrefs"])))
    b, ch, v = sorted((bk, cv[0], cv[1]) for bk, refs in person_refs[target].items() for cv in refs)[0]
    if target == "mother-of-zebedees-sons":
        add_spouse(src, target, (b, ch, v))
    else:
        add_parent(src, target, (b, ch, v), False)
for a, b_ in C.SPOUSES_INDEX:
    bk, ch, v = sorted((bk, cv[0], cv[1]) for bk, refs in person_refs[rid(b_)].items() for cv in refs)[0]
    add_spouse(rid(a), rid(b_), (bk, ch, v))

# ------------------------------------------------------------------ chronology (signed years)
B, D, fixed, why = {}, {}, set(), {}
for eid, ls in L.items():
    B[eid], D[eid] = signed(ls.birth_year), signed(ls.death_year)
    fixed.add(eid)
for key, (b, d, grade, note) in C.FIXED.items():
    pid = rid(key)
    B[pid], D[pid] = b, d
    why[pid] = (grade, note)
    fixed.add(pid)
chapter_year = {}
for code, a, z, ya, yz in C.CHAPTER_DATES:
    for ch in range(a, z + 1):
        chapter_year[(code, ch)] = round(ya + (yz - ya) * ((ch - a) / (z - a) if z > a else 0))
all_people = set(person_refs)
first_year = {}
for pid in all_people:
    if pid in B:
        continue
    ys = [chapter_year[(b, c)] for b, refs in person_refs[pid].items() for c, v in refs
          if (b, c) in chapter_year and (b, c) not in C.UNDATED_CHAPTERS]
    if ys:
        first, last = min(ys), max(ys)
        first_year[pid] = first
        B[pid] = first - C.LEAD_IN
        D[pid] = min(max(last + 5, B[pid] + C.SPAN), B[pid] + 100)
        why[pid] = ("E", f"Grade-E display window: first named in a passage set about {era_year(first)[1]} {era_year(first)[0]}; the text states no age or lifespan.")
# genealogy-only people: interpolate between the nearest placed ancestor and descendant
par_of, kid_of = defaultdict(list), defaultdict(list)
for r in ds.relationships.values():
    if r.relationship_type == "parent":
        par_of[r.object_id].append(r.subject_id)
        kid_of[r.subject_id].append(r.object_id)
for p, c, g in new_edges:
    par_of[c].append(p)
    kid_of[p].append(c)


def nearest(pid, graph):
    seen, frontier, d = {pid}, [pid], 0
    while frontier:
        d += 1
        nxt = []
        for n in frontier:
            for m in graph[n]:
                if m in seen:
                    continue
                seen.add(m)
                if m in B:
                    return m, d
                nxt.append(m)
        frontier = nxt
    return None, None


for pid in sorted(all_people - set(B)):
    anc, da = nearest(pid, par_of)
    des, dd = nearest(pid, kid_of)
    if anc and des:
        b = B[anc] + (B[des] - B[anc]) * da / (da + dd)
        basis = f"interpolated between {anc} and {des} in the genealogy"
    elif anc:
        b = B[anc] + 30 * da
        basis = f"{da} editorial generation(s) after {anc}"
    elif des:
        b = B[des] - 30 * dd
        basis = f"{dd} editorial generation(s) before {des}"
    else:
        b = 20
        basis = "no dated appearance or family link; placed in the apostolic period"
        log["unplaced_default"].append(pid)
    B[pid], D[pid] = round(b), round(b) + C.SPAN
    why[pid] = ("E", f"Grade-E display window from the genealogy ({basis}); no age is stated.")
# order and alive constraints
edges = [(p, c) for c, ps in par_of.items() for p in ps]
for _ in range(200):
    changed = False
    for p, c in edges:
        if p not in B or c not in B:
            continue
        if B[c] - B[p] < 15:
            if p not in fixed and c not in fixed and first_year.get(c, 10 ** 6) <= first_year.get(p, 10 ** 6):
                span = D[p] - B[p]  # the child is attested no later than the parent: move the parent earlier
                B[p] = B[c] - 25
                D[p] = B[p] + span
                changed = True
            elif c not in fixed:
                span = D[c] - B[c]
                B[c] = B[p] + 15
                D[c] = B[c] + span
                changed = True
            elif p not in fixed:
                span = D[p] - B[p]
                B[p] = B[c] - 15
                D[p] = B[p] + span
                changed = True
        if B[c] > D[p] and p not in fixed:
            D[p] = min(B[c], B[p] + 110)
            changed = True
    if not changed:
        break
for pid, ls in [(rid(w), None) for w, *_ in C.EXPLICIT]:
    pass
der, res = [], []
for pid in sorted(all_people):
    if pid in L:
        continue
    b, d = B[pid], max(D[pid], B[pid] + 1)
    grade, expl = why[pid]
    eb, db = era_year(b), era_year(d)
    der.append(f"      - {{id: nt-{pid}-birth, operation: literal, year: {{era: {eb[0]}, year: {eb[1]}}}}}")
    der.append(f"      - {{id: nt-{pid}-death, operation: literal, year: {{era: {db[0]}, year: {db[1]}}}}}")
    ev = claim_ids_of.get(pid) or [f"{pid}-{WORK[home[pid]]}-na28-attested"]
    res.append(f"      - {{entity_id: {pid}, birth_derivation_id: nt-{pid}-birth, death_derivation_id: nt-{pid}-death, "
               f"life_basis: {'synchronized' if grade != 'E' else 'editorial_estimate'}, confidence_grade: {grade}, evidence_claim_ids: [{', '.join(ev)}], "
               f"alternative_claim_ids: [], explanation: {q(expl)}}}")

# ------------------------------------------------------------------ events
event_ids_by_chapter = defaultdict(list)


def top_people(ranges):
    counts = defaultdict(int)
    for pid, books in person_refs.items():
        for b, refs in books.items():
            for c, v in refs:
                if any(b == rb and (rc1, rv1) <= (c, v) <= (rc2, rv2) for rb, rc1, rv1, rc2, rv2 in ranges):
                    counts[pid] += 1
    return [p for p in sorted(counts, key=lambda p: (-counts[p], p))][:8]


def parse_range(code, s):
    a, _, z = s.partition("-")
    c1, v1 = map(int, a.split(":"))
    if ":" in z:
        c2, v2 = map(int, z.split(":"))
    else:
        c2, v2 = c1, int(z)
    return (code, c1, v1, c2, v2)


for evid, name, typ, refs, note in C.PARALLELS:
    ranges = [parse_range(code, s) for code, s in refs.items()]
    parts = ", ".join(f"{{entity_id: {p}, role: named participant}}" for p in top_people(ranges))
    cites = ", ".join(cite(code, f"{TITLE[code]} {s}") for code, s in refs.items())
    extra = f", parallel_note: {q(note)}" if note else ""
    first = ranges[0]
    files[WORK[first[0]]]["events"].append(f"  - {{id: {evid}, event_type: {typ}, name: {q(name)}, participants: [{parts}], date_claim_ids: []{extra}, "
                                           f"gospel_parallels: [{', '.join(q(f'{TITLE[c]} {s}') for c, s in refs.items())}], citations: [{cites}]}}")
    for code, c1, v1, c2, v2 in ranges:
        for ch in range(c1, c2 + 1):
            event_ids_by_chapter[(code, ch)].append(evid)
for code, sections in C.SECTIONS.items():
    for a, z, name, typ in sections:
        evid = f"{WORK[code]}-{a}-{z}-" + slug(name)[:40].rstrip("-")
        parts = ", ".join(f"{{entity_id: {p}, role: named participant}}" for p in top_people([(code, a, 1, z, 999)]))
        files[WORK[code]]["events"].append(f"  - {{id: {evid}, event_type: {typ}, name: {q(name)}, participants: [{parts}], date_claim_ids: [], "
                                           f"citations: [{cite(code, f'{TITLE[code]} {a}-{z}' if z != a else f'{TITLE[code]} {a}')}]}}")
        for ch in range(a, z + 1):
            event_ids_by_chapter[(code, ch)].append(evid)
for code, work, title, n in C.BOOKS:
    if code in C.SECTIONS:
        continue
    evid = f"{work}-letter"
    parts = ", ".join(f"{{entity_id: {p}, role: named participant}}" for p in top_people([(code, 1, 1, n, 999)]))
    files[work]["events"].append(f"  - {{id: {evid}, event_type: letter, name: {q('Letter: ' + title)}, participants: [{parts}], date_claim_ids: [], "
                                 f"citations: [{cite(code, title)}]}}")
    for ch in range(1, n + 1):
        event_ids_by_chapter[(code, ch)].append(evid)
for evid, code, (a, z), name, typ, verse, val, year, note, parts in C.DATED_EVENTS:
    work = WORK[code]
    cids = []
    if val:
        vv = dict(val)
        for k in ("ruler", "governor", "king"):
            if k in vv:
                vv[k] = rid(vv[k])
        vtxt = "{" + ", ".join(f"{k}: {q(v) if isinstance(v, str) and ' ' in v else v}" for k, v in vv.items()) + "}"
        files[work]["claims"].append(f"  - {{id: {evid}-text-date, subject_id: {evid}, predicate: event_date_in_text, value: {vtxt}, evidence_type: explicit_text, "
                                     f"witness_id: {witness(code)}, confidence: A, citations: [{cite(code, verse)}]}}")
        cids.append(f"{evid}-text-date")
    ey = era_year(year)
    files[work]["claims"].append(f"  - {{id: {evid}-display-year, subject_id: {evid}, predicate: event_date, value: {{kind: historical_year, era: {ey[0]}, year: {ey[1]}}}, "
                                 f"evidence_type: editorial_anchor, confidence: C" + (f", interpretation_note: {q(note)}" if note else "") + f", citations: [{cite(code, verse)}]}}")
    cids.append(f"{evid}-display-year")
    pp = ", ".join(f"{{entity_id: {rid(p)}, role: named participant}}" for p in parts)
    files[work]["events"].append(f"  - {{id: {evid}, event_type: {typ}, name: {q(name)}, participants: [{pp}], date_claim_ids: [{', '.join(cids)}], citations: [{cite(code, verse)}]}}")
    for ch in range(a, z + 1):
        event_ids_by_chapter[(code, ch)].append(evid)

# ------------------------------------------------------------------ passages, inventory, catalog
for code, work, title, n in C.BOOKS:
    for ch in range(1, n + 1):
        loc = f"{title} {ch}"
        files[work]["passages"].append(f"  - {{id: {work}-{ch}-na28, work_id: {work}, witness_id: {witness(code)}, locator: {q(loc)}, citations: [{cite(code, loc)}]}}")
        notes = [txt for (bk, c1, v1, c2, v2), txt in C.DISPUTED.items() if bk == code and c1 <= ch <= c2]
        basis = "Person census cross-checked against the TIPNR proper-name index; unnamed individuals curated by hand." + (" " + " ".join(notes) if notes else "")
        ppl = sorted(chapter_people[(code, ch)])
        files[work]["inventory"].append(
            f"  - {{id: inv-{work}-{ch}, work_id: {work}, locator: {q(loc)}, reviewed: true, passage_ids: [{work}-{ch}-na28], identified_entity_ids: [{', '.join(ppl)}], "
            f"event_ids: [{', '.join(dict.fromkeys(event_ids_by_chapter[(code, ch)]))}], no_individuals: {'false' if ppl else 'true'}, review_basis: {q(basis)}, citations: [{cite(code, loc)}]}}")
wit = []
for code, work, title, n in C.BOOKS:
    if witness(code) in ds.witnesses:
        continue
    note = C.NA28_VERSIFICATION.get(work, "Verse numbers follow English Bibles, which match NA28 in this book.")
    wit.append(f"  - {{id: {witness(code)}, work_id: {work}, tradition: new_testament, language: grc, edition: \"Nestle-Aland Novum Testamentum Graece 28\", "
               f"versification_note: {q(note)}, citations: [{{source_id: na28, locator: {q(title)}}}]}}")
for work, title in C.SENTINELS:
    wit.append(f"  - {{id: book-review-{work}, work_id: {work}, tradition: geez, language: gez, edition: {q(title + ' (book-level review only)')}, citations: [{{source_id: ethiopic-edition-pending, locator: {q(title)}}}]}}")
    files[work]["passages"].append(f"  - {{id: {work}-book-review, work_id: {work}, witness_id: book-review-{work}, locator: {q(title)}, citations: [{{source_id: ethiopic-edition-pending, locator: {q(title)}, witness_id: book-review-{work}}}]}}")
    files[work]["inventory"].append(f"  - {{id: inv-{work}-book, work_id: {work}, locator: {q(title)}, reviewed: false, passage_ids: [{work}-book-review], identified_entity_ids: [], event_ids: [], "
                                    f"no_individuals: false, review_basis: \"Book-level canon entry only (Ethiopian broader New Testament); no people are asserted pending a citable edition.\", "
                                    f"citations: [{{source_id: ethiopic-edition-pending, locator: {q(title)}}}]}}")

print("persons:", len(all_people), "new index persons:", len(new_ids), "curated:", len(C.CURATED), "new parent edges:", len(new_edges))
print({k: len(v) for k, v in log.items()})
json.dump({k: v for k, v in log.items()}, open(Path(sys.argv[2]).parent / "ntgen_log.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=str)
if DRY:
    sys.exit(0)
KIND = {"entities": "entities", "claims": "claims", "relationships": "relationships", "events": "events", "inventory": "inventory_units", "passages": "passages"}
for work, kinds in files.items():
    d = root / "data" / work
    d.mkdir(parents=True, exist_ok=True)
    for kind, lines in kinds.items():
        if lines:
            (d / f"{kind}.yaml").write_text(f"schema_version: 1\nrecord_type: {KIND[kind]}\nrecords:\n" + "\n".join(lines) + "\n", encoding="utf-8")
(root / "data/catalog/nt_witnesses.yaml").write_text("schema_version: 1\nrecord_type: witnesses\nrecords:\n" + "\n".join(wit) + "\n", encoding="utf-8")
ch = root / "data/chronology/hybrid_reference.yaml"
t = ch.read_text(encoding="utf-8")
t = t.replace("\n    resolutions:\n", "\n" + "\n".join(der) + "\n    resolutions:\n", 1)
ch.write_text(t.rstrip("\n") + "\n" + "\n".join(res) + "\n", encoding="utf-8", newline="")
print("written")
