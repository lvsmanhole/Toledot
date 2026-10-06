"""Map TIPNR persons to existing project entities.  Usage: bridge.py <repo> <tipnr.json> <out.json>"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(sys.argv[1]) / "src"))
from bible_timeline.loader import load_dataset  # noqa: E402

BOOK = {"genesis": "Gen", "exodus": "Exo", "leviticus": "Lev", "numbers": "Num", "deuteronomy": "Deu"}
PENTATEUCH = set(BOOK.values())
NON_PERSON = re.compile(r"^(People|A military group|Word sometimes)")


def norm(s):
    s = re.sub(r"\(.*?\)", "", s)
    s = s.lower().replace("ʽ", "").replace("'", "").strip()
    return s


root = Path(sys.argv[1])
ds = load_dataset(root / "data", root / "schemas")
tip = json.load(open(sys.argv[2], encoding="utf-8"))

chapters = defaultdict(set)
for u in ds.inventory_units.values():
    if u.work_id in BOOK:
        ch = int(u.locator.split()[-1].split(":")[0])
        for e in u.identified_entity_ids:
            chapters[e].add((BOOK[u.work_id], ch))
names = defaultdict(set)
for e in ds.entities.values():
    if e.entity_type != "human":
        continue
    for n in [e.primary_name, *e.aliases]:
        k = norm(n)
        names[k].add(e.id)
        names[k.split(" ")[0]].add(e.id) if " son of " in k or " of " in k else None

result = {"mapped": {}, "missing": [], "ambiguous": [], "unmatched_entities": []}
used = defaultdict(list)
for p in tip:
    if NON_PERSON.match(p["description"]):
        continue
    pent = {(b, c) for b, c, v in p["refs"] if b in PENTATEUCH}
    if not pent:
        continue
    pnames = {norm(n) for f in p["forms"] for n in f["names"] if n and n != "[ ]"}
    pnames.add(norm(p["uid"].split("@")[0].replace("_", " ")))
    cands = set()
    for n in pnames:
        cands |= names.get(n, set())
    scored = sorted(((len(chapters[c] & pent), c) for c in cands), reverse=True)
    scored = [s for s in scored if s[0] > 0]
    if not scored:
        result["missing"].append({"uid": p["uid"], "names": sorted(pnames), "chapters": sorted(pent)[:6], "brief": p["brief"]})
    elif len(scored) > 1 and scored[0][0] == scored[1][0]:
        result["ambiguous"].append({"uid": p["uid"], "cands": scored, "brief": p["brief"]})
    else:
        result["mapped"][p["uid"]] = scored[0][1]
        used[scored[0][1]].append(p["uid"])
result["double_mapped"] = {k: v for k, v in used.items() if len(v) > 1}
mapped_ids = set(result["mapped"].values())
for e in ds.entities.values():
    if e.entity_type == "human" and e.id not in mapped_ids and chapters.get(e.id):
        result["unmatched_entities"].append({"id": e.id, "name": e.primary_name, "status": getattr(e, "identity_status", None),
                                             "classification": e.classification})
json.dump(result, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print({k: len(v) for k, v in result.items()})
