"""Apply decisions from the manual review of entries without a tagged name occurrence (docs/review/tagged-text-review.md).

Usage: review_fixes.py <repo>   (run once)
"""
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1])
D = root / "data"


def q(s):
    return json.dumps(s, ensure_ascii=False)


def read(p):
    return (D / p).read_text(encoding="utf-8")


def write(p, t):
    (D / p).write_text(t, encoding="utf-8", newline="")


def drop_records(path, ids):
    t = read(path)
    lines = t.split("\n")
    keep = [ln for ln in lines if not any(re.match(r"\s*- \{id: " + re.escape(i) + r",", ln) for i in ids)]
    assert len(lines) - len(keep) == len(ids), (path, ids, len(lines) - len(keep))
    out = "\n".join(keep)
    if not re.search(r"^\s*- \{", out, re.M):
        out = re.sub(r"^records:\s*$", "records: []", out, flags=re.M)
    write(path, out)


def inventory_remove(path, unit_ids, person):
    t = read(path)
    for uid in unit_ids:
        m = re.search(r"\bid: " + re.escape(uid) + r",[^\n]*?identified_entity_ids: \[([^\]]*)\]", t)
        assert m, (path, uid)
        ids = [x.strip() for x in m.group(1).split(",") if x.strip()]
        assert person in ids, (uid, person)
        ids.remove(person)
        t = t[:m.start(1)] + ", ".join(ids) + t[m.end(1):]
        if not ids:
            t = re.sub(r"(id: " + re.escape(uid) + r",[^
]*?no_individuals: )false", r"true", t, count=1)
    write(path, t)


def inventory_replace(path, unit_ids, old, new):
    t = read(path)
    for uid in unit_ids:
        m = re.search(r"\bid: " + re.escape(uid) + r",[^\n]*?identified_entity_ids: \[([^\]]*)\]", t)
        assert m, (path, uid)
        ids = [x.strip() for x in m.group(1).split(",") if x.strip()]
        assert old in ids, (uid, old)
        ids = sorted({new if x == old else x for x in ids})
        t = t[:m.start(1)] + ", ".join(ids) + t[m.end(1):]
    write(path, t)


def set_locator(path, claim_id, loc):
    t = read(path)
    t2 = re.sub(r"(\bid: " + re.escape(claim_id) + r",[^\n]*?citations: \[\{source_id: [a-z0-9-]+, locator: )\"[^\"]*\"", lambda m: m.group(1) + q(loc), t, count=1)
    assert re.search(r"\bid: " + re.escape(claim_id) + r",", t), claim_id  # may already hold the verified locator
    write(path, t2)


def append(path, kind, lines):
    p = D / path
    if p.exists():
        t = p.read_text(encoding="utf-8").rstrip("\n")
        p.write_text(t + "\n" + "\n".join(lines) + "\n", encoding="utf-8", newline="")
    else:
        p.write_text(f"schema_version: 1\nrecord_type: {kind}\nrecords:\n" + "\n".join(lines) + "\n", encoding="utf-8", newline="")


# 1. Lahmi: named in 1 Chronicles 20:5 only; 2 Samuel 21:19 (MT) has Elhanan kill Goliath. 1 Chr 20:8 gives descent from the giants, not a father.
inventory_remove("2-samuel/inventory.yaml", ["inv-2-samuel-21"], "lahmi")
drop_records("2-samuel/claims.yaml", ["lahmi-2-samuel-mt-attested"])
drop_records("2-samuel/relationships.yaml", ["rapha-parent-lahmi"])
_ch = read("chronology/hybrid_reference.yaml")
assert _ch.count("evidence_claim_ids: [lahmi-2-samuel-mt-attested]") == 1
write("chronology/hybrid_reference.yaml", _ch.replace("evidence_claim_ids: [lahmi-2-samuel-mt-attested]", "evidence_claim_ids: [lahmi-1-chronicles-mt-attested]"))

# 2. Agag in Esther: only the gentilic 'Agagite' (Haman) occurs.
inv = read("esther/inventory.yaml")
units = [m.group(1) for m in re.finditer(r"\bid: (inv-esther-\d+),[^\n]*?identified_entity_ids: \[[^\]]*\bagag-1sa15\b", inv)]
inventory_remove("esther/inventory.yaml", units, "agag-1sa15")
drop_records("esther/claims.yaml", ["agag-1sa15-esther-mt-attested"])
drop_records("esther/original_names.yaml", ["agag-1sa15-esther-original-name"])

# 3. Judges 1:16: Moses' father-in-law is unnamed there; Judges 4:11 names Hobab, so no identification is made.
inventory_remove("judges/inventory.yaml", ["inv-judges-1"], "midian-priest-exodus")
drop_records("judges/claims.yaml", ["midian-priest-exodus-judges-mt-attested"])

# 4. 'Jehiel' in 1 Chronicles 6 is the index equating Jahath with Jehiel; the text names Jahath.
inventory_remove("1-chronicles/inventory.yaml", ["inv-1-chronicles-6"], "jehiel-1ch6")
drop_records("1-chronicles/relationships.yaml", ["jehiel-1ch6-parent-shimei-1ch6-42"])

# 5. 'Hodiah' in Nehemiah 12:8: the text has Judah.
inventory_remove("nehemiah/inventory.yaml", ["inv-nehemiah-12"], "hodiah-neh8")

# 6. Not persons in the Masoretic text: 'Asen' (Neh 7:24 reads Hariph) and 'Amminadib' (Song 6:12 is a phrase).
for person, book, unit in (("asen", "nehemiah", "inv-nehemiah-7"), ("amminadib", "song-of-songs", "inv-song-of-songs-6")):
    inventory_remove(f"{book}/inventory.yaml", [unit], person)
    drop_records(f"{book}/entities.yaml", [person])
    drop_records(f"{book}/claims.yaml", [f"{person}-{book}-mt-attested"])
    on = read(f"{book}/original_names.yaml") if (D / book / "original_names.yaml").exists() else ""
    if f"id: {person}-{book}-original-name," in on:
        drop_records(f"{book}/original_names.yaml", [f"{person}-{book}-original-name"])
    ev = read(f"{book}/events.yaml")
    write(f"{book}/events.yaml", re.sub(r"\{entity_id: " + re.escape(person) + r", role: named participant\}, ?|, \{entity_id: " + re.escape(person) + r", role: named participant\}", "", ev))
    ch = read("chronology/hybrid_reference.yaml")
    lines = [ln for ln in ch.split("\n") if not re.search(r"\{id: ot-" + re.escape(person) + r"-(birth|death),|\{entity_id: " + re.escape(person) + r",", ln)]
    assert len(ch.split("\n")) - len(lines) == 3, person
    write("chronology/hybrid_reference.yaml", "\n".join(lines))

# 7. James the younger (Mark 15:40) kept separate from James son of Alphaeus; Mary the mother of James and Joses kept separate
#    from Mary the wife of Clopas (John 19:25). Both identifications are traditional, not textual.
ent = read("matthew/entities.yaml")
ent = re.sub(r'(\{id: mary-mat27, [^\n]*?primary_name: )"Mary"', r'\1"Mary the mother of James and Joses"', ent, count=1)
ent = re.sub(r'(\{id: mary-mat27, [^\n]*?description: )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + q(
    "Present at the crucifixion and the tomb (Matthew 27:56; Mark 15:40). Traditionally identified with Mary the wife of Clopas (John 19:25); the texts do not say so."), ent, count=1)
ent = re.sub(r'(\{id: james-mat10, [^\n]*?description: )"(?:[^"\\]|\\.)*"', lambda m: m.group(1) + q(
    "James son of Alphaeus, one of the Twelve. Traditionally identified with James the younger (Mark 15:40); the texts do not say so."), ent, count=1)
write("matthew/entities.yaml", ent)
cite = lambda book, loc: f"{{source_id: na28, locator: {q(loc)}, witness_id: greek-{book}-na28}}"
append("matthew/entities.yaml", "entities", [
    f"  - {{id: james-the-younger, entity_type: human, primary_name: \"James the younger\", classification: named_person, identity_status: named, aliases: [\"James the less\"], gender: male, "
    f"description: \"Son of Mary, the mother of James and Joses (Mark 15:40). Traditionally identified with James son of Alphaeus; the texts do not say so.\", citations: [{cite('matthew', 'Matthew 27:56')}]}}"])
append("john/entities.yaml", "entities", [
    f"  - {{id: mary-wife-of-clopas, entity_type: human, primary_name: \"Mary the wife of Clopas\", classification: named_person, identity_status: named, aliases: [], gender: female, "
    f"description: \"Stood by the cross with Jesus' mother and Mary Magdalene (John 19:25). Traditionally identified with Mary the mother of James and Joses; the texts do not say so.\", citations: [{cite('john', 'John 19:25')}]}}"])
for book, loc in (("matthew", "Matthew 27:56"), ("mark", "Mark 15:40; 16:1"), ("luke", "Luke 24:10")):
    append(f"{book}/claims.yaml", "claims", [
        f"  - {{id: james-the-younger-{book}-na28-attested, subject_id: james-the-younger, predicate: attested_in_passage, value: {{kind: attestation, status: \"named in {book.title()}\"}}, "
        f"evidence_type: explicit_text, witness_id: greek-{book}-na28, confidence: A, citations: [{cite(book, loc)}]}}"])
set_locator("matthew/claims.yaml", "james-mat10-matthew-na28-attested", "Matthew 10:3")
set_locator("mark/claims.yaml", "james-mat10-mark-na28-attested", "Mark 3:18")
set_locator("luke/claims.yaml", "james-mat10-luke-na28-attested", "Luke 6:15")
inventory_replace("matthew/inventory.yaml", ["inv-matthew-27"], "james-mat10", "james-the-younger")
inventory_replace("mark/inventory.yaml", ["inv-mark-15", "inv-mark-16"], "james-mat10", "james-the-younger")
inventory_replace("luke/inventory.yaml", ["inv-luke-24"], "james-mat10", "james-the-younger")
for book in ("matthew", "mark", "luke"):
    ev = read(f"{book}/events.yaml")
    ev = re.sub(r"(\{id: (?:crucifixion-and-burial|empty-tomb|matthew-26-28[^,]*|mark-14-16[^,]*|luke-20-24[^,]*), [^\n]*?)\{entity_id: james-mat10, ", r"\1{entity_id: james-the-younger, ", ev)
    write(f"{book}/events.yaml", ev)
# Mary of Clopas takes the John 19 record
jc = read("john/claims.yaml")
jc = jc.replace("{id: mary-mat27-john-na28-attested, subject_id: mary-mat27,", "{id: mary-wife-of-clopas-john-na28-attested, subject_id: mary-wife-of-clopas,", 1)
write("john/claims.yaml", jc)
jo = read("john/original_names.yaml")
jo = jo.replace("{id: mary-mat27-john-original-name, subject_id: mary-mat27,", "{id: mary-wife-of-clopas-john-original-name, subject_id: mary-wife-of-clopas,", 1)
write("john/original_names.yaml", jo)
inventory_replace("john/inventory.yaml", ["inv-john-19"], "mary-mat27", "mary-wife-of-clopas")
drop_records("luke/relationships.yaml", ["alphaeus-spouse-mary-mat27"])  # Alphaeus = Clopas is a traditional identification
append("mark/relationships.yaml", "relationships", [
    f"  - {{id: mary-mat27-parent-james-the-younger, relationship_type: parent, subject_id: mary-mat27, object_id: james-the-younger, claim_ids: [], citations: [{cite('mark', 'Mark 15:40')}]}}"])
# chronology for the two new people: same window as Mary the mother of James and Joses' family
ch = read("chronology/hybrid_reference.yaml")
der = ["      - {id: nt-james-the-younger-birth, operation: literal, year: {era: BCE, year: 5}}",
       "      - {id: nt-james-the-younger-death, operation: literal, year: {era: CE, year: 60}}",
       "      - {id: nt-mary-wife-of-clopas-birth, operation: literal, year: {era: BCE, year: 30}}",
       "      - {id: nt-mary-wife-of-clopas-death, operation: literal, year: {era: CE, year: 40}}"]
res = ["      - {entity_id: james-the-younger, birth_derivation_id: nt-james-the-younger-birth, death_derivation_id: nt-james-the-younger-death, life_basis: editorial_estimate, confidence_grade: E, "
       "evidence_claim_ids: [james-the-younger-mark-na28-attested], alternative_claim_ids: [], explanation: \"Grade-E window: an adult son of a woman present at the crucifixion (30 CE); no age is stated.\"}",
       "      - {entity_id: mary-wife-of-clopas, birth_derivation_id: nt-mary-wife-of-clopas-birth, death_derivation_id: nt-mary-wife-of-clopas-death, life_basis: editorial_estimate, confidence_grade: E, "
       "evidence_claim_ids: [mary-wife-of-clopas-john-na28-attested], alternative_claim_ids: [], explanation: \"Grade-E window: present at the crucifixion (30 CE); no age is stated.\"}"]
ch = ch.replace("\n    resolutions:\n", "\n" + "\n".join(der) + "\n    resolutions:\n", 1)
write("chronology/hybrid_reference.yaml", ch.rstrip("\n") + "\n" + "\n".join(res) + "\n")
print("review fixes applied")
