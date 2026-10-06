"""List proper-noun candidates per deuterocanonical book from the WEB VPL text.

Usage: dc_candidates.py <eng-web_vpl.txt> <tipnr.txt> <out.json>
"""
import json
import re
import sys
from collections import defaultdict

DC = ["TOB", "JDT", "ESG", "WIS", "SIR", "BAR", "1MA", "2MA", "1ES", "PRM", "PSX", "3MA", "4ES", "4MA", "DNG"]
STOP = set("""I O A An The And But For If In Of On Or So Then Therefore Thus When Who Whom Whose Why What Where While With Yet
God Lord LORD Most High Almighty Holy Spirit Highest Creator Father Mighty One He His Him My Me We Our Us You Your They Their Them She Her It Its
This That These Those There Here All Now Let Behold Blessed Amen Alleluia Hallelujah Moreover Also After Before Because Although Again Afterward
Sabbath Passover Pentecost Law Scripture Prophets Psalms Jubilee Day Days Today Tomorrow Yes No Not Do Don’t Woe Come Go See Hear Take Give
King Kings Queen Prince Princes Governor Captain Chief High Priest Priests Levites Wisdom Truth Death Hades Heaven Heavens Earth Sea Sun Moon
How Why Is Are Was Were Be Been Being Am Will Shall May Might Can Could Should Would Must Has Have Had Did Does Done Know Knowing
One Two Three Four Five Six Seven Eight Nine Ten Twelve Hundred Thousand First Second Third Fourth Fifth Sixth Seventh Eighth Ninth Tenth
Jew Jews Gentiles Gentile Greek Greeks Hebrew Hebrews Israelite Israelites Name Book Books Temple Sanctuary Tabernacle Ark Covenant
Even Each Every Nor Neither Either Whoever Whatever Wherever Since Until Unless Upon Into Unto Toward Against Among Through Without Within Beside""".split())
TOKEN = re.compile(r"[A-Z][a-z’'\-]+(?:-[A-Z][a-z]+)?")


def tipnr_names(path):
    persons, places = set(), set()
    kind = None
    for ln in open(path, encoding="utf-8"):
        if ln.startswith("$=========="):
            kind = "person" if "PERSON" in ln else ("place" if "PLACE" in ln else "other")
            continue
        if ln.startswith("– Named") or ln.startswith("– Greek"):
            cols = ln.split("\t")
            for c in cols[1:5]:
                for n in re.findall(r"([A-Z][a-z’'\-]+)", c.split("@")[0] if "@" in c and cols.index(c) == 1 else c):
                    (persons if kind == "person" else places).add(n)
    return persons, places


verses = defaultdict(list)
for ln in open(sys.argv[1], encoding="utf-8"):
    m = re.match(r"^(\w+) (\d+):(\d+) (.*)", ln)
    if m and m.group(1) in DC:
        verses[m.group(1)].append((int(m.group(2)), int(m.group(3)), m.group(4)))
persons, places = tipnr_names(sys.argv[2])
out = {}
for book, vs in verses.items():
    cands = defaultdict(lambda: {"count": 0, "refs": [], "sample": ""})
    for c, v, text in vs:
        for m in TOKEN.finditer(text):
            w = m.group(0).rstrip("’'")
            w = re.sub(r"’s$|'s$", "", w)
            if w in STOP or len(w) < 2:
                continue
            start = m.start() == 0 or text[:m.start()].rstrip().endswith((".", "!", "?", "“", "\"", ":", ";"))
            if start and w not in persons and w not in places:
                continue
            d = cands[w]
            d["count"] += 1
            if len(d["refs"]) < 400:
                d["refs"].append((c, v))
            if not d["sample"]:
                d["sample"] = f"{c}:{v} " + text[max(0, m.start() - 70): m.end() + 70]
    out[book] = {w: {**d, "tipnr": "person" if w in persons else ("place" if w in places else "")} for w, d in cands.items()}
json.dump(out, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False)
for b in DC:
    d = out.get(b, {})
    print(b, len(d), "person-known:", sum(1 for x in d.values() if x["tipnr"] == "person"),
          "place-known:", sum(1 for x in d.values() if x["tipnr"] == "place"), "unknown:", sum(1 for x in d.values() if not x["tipnr"]))
