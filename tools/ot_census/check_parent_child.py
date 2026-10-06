import sys
from pathlib import Path
from bible_timeline.loader import load_dataset
from bible_timeline.chronology import resolve_model
root = Path(sys.argv[1]); ds = load_dataset(root/"data", root/"schemas")
res = resolve_model(ds, "hybrid_reference").lifespans
def y(h): return -h.year if h.era=="BCE" else h.year
n=0
for r in ds.relationships.values():
    if r.relationship_type!="parent": continue
    p,c=res.get(r.subject_id),res.get(r.object_id)
    if not p or not c: continue
    pb,pd,cb=y(p.birth_year),y(p.death_year),y(c.birth_year)
    if cb-pb<12 or cb>pd+1:
        n+=1; print(f"{r.subject_id}({pb}..{pd}) -> {r.object_id}(b{cb}) [{p.confidence_grade}/{c.confidence_grade}] {r.citations[0].locator}")
print("violations:",n)
