"""Parse TIPNR person records into JSON.  Usage: tipnr_parse.py <tipnr.txt> <out.json>"""
import json
import re
import sys

REF = re.compile(r"\b([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)")
UID = re.compile(r"[^\s,+|]+@[A-Za-z0-9]+\.\d+\.\d+[^\s,+|]*")


def ids_in(field):
    out = []
    for m in UID.finditer(field or ""):
        tok = m.group(0)
        flags = re.findall(r"\((\w|\?)\)", tok)
        base = re.sub(r"\(\w\)|\(\?\)", "", tok).split("=")[0]
        out.append({"id": base, "flags": flags})
    return out


def parse(path):
    text = open(path, encoding="utf-8").read().split("\n")
    people, i, kind = [], 0, None
    while i < len(text):
        line = text[i]
        if line.startswith("$=========="):
            kind = line.strip("$= \t").split("\t")[0].strip()
            i += 1
            if kind not in ("PERSON(s)", "PLACE+PERSON"):
                continue
            # skip blank lines to header
            while i < len(text) and not text[i].strip("\t "):
                i += 1
            if i >= len(text) or text[i].startswith("$"):
                continue
            h = text[i].split("\t")
            uid = h[0].split("=")[0].strip()
            if "@" not in uid:
                i += 1
                continue
            rec = {"uid": uid, "kind": kind, "description": h[1] if len(h) > 1 else "",
                   "parents": [], "siblings": ids_in(h[3] if len(h) > 3 else ""),
                   "partners": ids_in(h[4] if len(h) > 4 else ""), "offspring": ids_in(h[5] if len(h) > 5 else ""),
                   "tribe": h[6] if len(h) > 6 else "", "gender": "", "forms": [], "refs": [], "brief": ""}
            par = h[2] if len(h) > 2 else ""
            male, _, female = par.partition("+")
            rec["father"] = ids_in(male)
            rec["mother"] = ids_in(female)
            for f in h[8:12]:
                if f.strip() in ("Male", "Female"):
                    rec["gender"] = f.strip().lower()
            i += 1
            while i < len(text) and not text[i].startswith("$"):
                ln = text[i]
                if ln.startswith("– ") and not ln.startswith("– Total"):
                    cols = ln.split("\t")
                    label = cols[0]
                    # name form: first column that has '=' with translation codes or plain name after strong
                    form_col = next((c for c in cols[1:] if re.search(r"=(ESV|NIV|KJV)", c)), None)
                    if form_col is None:
                        # primary line: cols[3] is translated name
                        form_col = cols[3] if len(cols) > 3 else ""
                    forms = [re.sub(r"\s*=.*", "", f).strip() for f in form_col.split(";")]
                    refs = [(b, int(c), int(v)) for b, c, v in REF.findall("\t".join(cols[2:]))]
                    rec["forms"].append({"label": label, "names": [f for f in forms if f], "refs": refs})
                    rec["refs"].extend(refs)
                elif ln.startswith("@Brief= "):
                    rec["brief"] = ln[8:].split("\t")[0].strip()
                elif ln.startswith("@Briefest= "):
                    rec["briefest"] = ln[11:].split("\t")[0].strip()
                i += 1
            rec["refs"] = sorted(set(map(tuple, rec["refs"])))
            people.append(rec)
            continue
        i += 1
    return people


if __name__ == "__main__":
    ppl = parse(sys.argv[1])
    json.dump(ppl, open(sys.argv[2], "w", encoding="utf-8"), ensure_ascii=False)
    print(len(ppl), "records")
