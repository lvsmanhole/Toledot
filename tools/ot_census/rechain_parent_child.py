"""Re-chain grade-E children whose display birth is implausible relative to a parent.

Usage: genfix.py <repo-root> [entity ids to exempt, comma separated]
"""
import json
import re
import sys
from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset

root = Path(sys.argv[1])
EXEMPT = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else set()
CH = root / "data/chronology/hybrid_reference.yaml"
GAP = 30


def y(h):
    return -h.year if h.era == "BCE" else h.year


def load():
    ds = load_dataset(root / "data", root / "schemas")
    return ds, resolve_model(ds, "hybrid_reference").lifespans


def violations(ds, res):
    out = {}
    for r in ds.relationships.values():
        if r.relationship_type != "parent" or r.object_id in EXEMPT:
            continue
        p, c = res.get(r.subject_id), res.get(r.object_id)
        if not p or not c:
            continue
        pb, pd, cb = y(p.birth_year), y(p.death_year), y(c.birth_year)
        if cb - pb < 12 or cb > pd + 1:
            out.setdefault(r.object_id, set()).add(r.subject_id)
    return out


def record_bounds(lines, eid):
    """Return (start, end, is_flow) line indexes of the resolution record for eid."""
    pat = re.compile(r"\bentity_id: " + re.escape(eid) + r"\s*([,}]|$)")
    for i, ln in enumerate(lines):
        if pat.search(ln):
            break
    else:
        raise SystemExit(f"record not found {eid}")
    if "{" in ln and ln.lstrip().startswith("- "):
        return i, i + 1, True
    s = i
    while not lines[s].lstrip().startswith("- "):
        s -= 1
    ind = len(lines[s]) - len(lines[s].lstrip()) + 2
    e = s + 1
    while e < len(lines) and lines[e].strip() and not lines[e].lstrip().startswith("- ") and len(lines[e]) - len(lines[e].lstrip()) >= ind:
        e += 1
    return s, e, False


def anchor_of(lines, eid):
    s, e, _ = record_bounds(lines, eid)
    m = re.search(r"&([\w-]+)", lines[s])
    return m.group(1) if m else None


def merges_anchor(lines, eid, anchor):
    s, e, _ = record_bounds(lines, eid)
    return any(re.search(r"<<: \*" + re.escape(anchor) + r"\b", lines[t]) for t in range(s, e))


def set_fields(lines, eid, fields):
    s, e, flow = record_bounds(lines, eid)
    if flow:
        body = lines[s]
        for k, v in fields.items():
            pat = re.compile(r"(\b" + k + r": )(" + r'"(?:[^"\\]|\\.)*"' + r"|[^,}]+)")
            if pat.search(body):
                body = pat.sub(lambda m: m.group(1) + v, body, count=1)
            else:
                body = re.sub(r"(entity_id: " + re.escape(eid) + r")(?=[,}])", lambda m: m.group(1) + f", {k}: {v}", body, count=1)
        lines[s] = body
        return
    ind = " " * (len(lines[s]) - len(lines[s].lstrip()) + 2)
    for k, v in fields.items():
        for t in range(s, e):
            m = re.match(r"(\s*(?:- )?)" + k + r": ", lines[t])
            if m:
                lines[t] = f"{m.group(1)}{k}: {v}"
                break
        else:
            lines.insert(e, f"{ind}{k}: {v}")
            e += 1


_, base = load()
before = {k: (v.birth_year, v.death_year) for k, v in base.items()}
targets = {}
for rnd in range(30):
    ds, res = load()
    v = violations(ds, res)
    if not v:
        break
    lines = CH.read_text(encoding="utf-8").split("\n")
    newder = []
    progressed = False
    for child, parents in sorted(v.items()):
        if any(p in v for p in parents):
            continue  # parents first; child gets handled in a later round
        c = res[child]
        if c.confidence_grade != "E":
            print("SKIP non-E child", child)
            continue
        all_parents = {r.subject_id for r in ds.relationships.values()
                       if r.relationship_type == "parent" and r.object_id == child and r.subject_id in res}
        par = max(all_parents, key=lambda p: y(res[p].birth_year))
        span = y(c.death_year) - y(c.birth_year)
        b, d = f"gen-{child}-birth", f"gen-{child}-death"
        if child in targets:
            print("cannot fix twice", child)
            continue
        anchor = anchor_of(lines, child)
        if anchor:
            for other, lr in res.items():
                if other == child:
                    continue
                try:
                    if not merges_anchor(lines, other, anchor):
                        continue
                except SystemExit:
                    continue
                set_fields(lines, other, {"birth_derivation_id": lr.birth_derivation_id,
                                          "death_derivation_id": lr.death_derivation_id,
                                          "explanation": json.dumps(lr.explanation, ensure_ascii=False)})
                print("pinned", other, "against anchor", anchor)
        newder.append(f"      - {{id: {b}, operation: offset_years, input_id: {res[par].birth_derivation_id}, offset_years: {GAP}}}")
        newder.append(f"      - {{id: {d}, operation: offset_years, input_id: {b}, offset_years: {span}}}")
        expl = c.explanation.rstrip() + (
            f" Display birth is chained one editorial {GAP}-year generation after "
            f"{ds.entities[par].primary_name}'s display birth so the parent-child order stays plausible; the offset is not textual.")
        set_fields(lines, child, {"birth_derivation_id": b, "death_derivation_id": d,
                                  "explanation": json.dumps(expl, ensure_ascii=False)})
        targets[child] = par
        progressed = True
    text = "\n".join(lines).replace("\n    resolutions:\n", "\n" + "\n".join(newder) + "\n    resolutions:\n", 1)
    CH.write_text(text, encoding="utf-8", newline="")
    if not progressed:
        print("no progress; stopping")
        break

ds, res = load()
print("remaining violations:", violations(ds, res))
moved = sorted(k for k in res if (res[k].birth_year, res[k].death_year) != before.get(k))
print("rechained:", len(targets), "unexpected moves:", sorted(set(moved) - set(targets)))
