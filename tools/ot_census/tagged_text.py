"""Read STEPBible TAHOT (Hebrew OT, Leningrad) and TAGNT (Greek NT) tagged texts into per-verse name occurrences.

Each occurrence: (book code, english chapter, english verse) -> list of (tipnr base id, original-language lemma, in_base_text)
where in_base_text means Leningrad for TAHOT, NA28 for TAGNT.
"""
import re
from collections import defaultdict
from pathlib import Path

REF = re.compile(r"^([1-3]?[A-Z][a-z]{1,2})\.(\d+)\.(\d+)(?:\([^)]*\))?#\d+=(\S*)")
OT_TAG = re.compile(r"=([^=»{}]+)=[^{}»]*»([^{}|]*?@[A-Za-z0-9]+\.\d+\.\d+)")
NT_TAG = re.compile(r"([^\s|»]+@[A-Za-z0-9]+\.\d+\.\d+)")


def base_id(uid):
    m = re.match(r"^(.+?@[A-Za-z0-9]+\.\d+\.\d+)", uid)
    return m.group(1) if m else uid


def read(step_dir):
    occ = defaultdict(list)
    for path in sorted(Path(step_dir).glob("TAHOT *.txt")):
        for ln in open(path, encoding="utf-8"):
            m = REF.match(ln)
            if not m:
                continue
            book, ch, v, marker = m.group(1), int(m.group(2)), int(m.group(3)), m.group(4)
            in_l = marker[:1] in ("L", "Q", "R")  # Leningrad text incl. its Qere and restored parallels; X (from LXX) and V are not
            for lemma, tag in OT_TAG.findall(ln):
                occ[(book, ch, v)].append((base_id(tag.split("»")[-1]), lemma, in_l))
    for path in sorted(Path(step_dir).glob("TAGNT *.txt")):
        for ln in open(path, encoding="utf-8"):
            m = REF.match(ln)
            if not m:
                continue
            cols = ln.rstrip("\n").split("\t")
            if len(cols) < 10 or "@" not in cols[9]:
                continue
            book, ch, v = m.group(1), int(m.group(2)), int(m.group(3))
            in_na28 = "NA28" in cols[5]
            lemma = cols[4].split("=")[0] if "=" in cols[4] else cols[1].split(" ")[0]
            for tag in NT_TAG.findall(cols[9].split("|")[-1]):
                occ[(book, ch, v)].append((base_id(tag), lemma, in_na28))
    return occ
