import json
from functools import lru_cache
from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.site import build_site_bundle, write_site_bundle


ROOT = Path(__file__).parents[1]


@lru_cache(maxsize=1)
def _bundle():
    dataset = load_dataset(ROOT / "data", ROOT / "schemas")
    return dataset, build_site_bundle(dataset, resolve_model(dataset, "hybrid_reference"))


def _people(core):
    fields = core["people_fields"]
    return {row[0]: dict(zip(fields, row)) for row in core["people"]}


def test_every_resolved_person_and_every_book_is_in_the_bundle() -> None:
    dataset, (core, details) = _bundle()
    humans = {e.id for e in dataset.entities.values() if e.entity_type == "human"}
    assert {row[0] for row in core["people"]} == humans
    assert set(details["people"]) == humans
    assert [b["id"] for b in core["books"]][:3] == ["genesis", "exodus", "leviticus"]
    assert {b["id"] for b in core["books"]} == set(dataset.works)
    sections = [b["section"] for b in core["books"]]
    assert sections.index("nt") > sections.index("eth") > sections.index("dc") > sections.index("ot")


def test_display_years_are_astronomical_and_grades_are_kept() -> None:
    _, (core, _) = _bundle()
    people = _people(core)
    david = people["david"]
    assert (david["birth"], david["death"]) == (-1039, -969)  # 1040-970 BCE
    assert david["grade"] == "C"
    assert people["herod-mat2"]["death"] == -3                 # 4 BCE
    assert people["jesus"]["grade"] == "E"
    assert all(p["birth"] <= p["death"] for p in people.values())


def test_chapters_index_people_and_events() -> None:
    _, (core, _) = _bundle()
    people = core["people"]
    genesis = core["books"][0]
    gen22 = next(c for c in genesis["chapters"] if c["n"] == "22")
    assert {"abram", "isaac"} <= {people[i][0] for i in gen22["people"]}
    assert genesis["chapters"][0]["n"] == "1:1-2:3"            # section units sort by chapter and verse
    matthew14 = next(c for c in next(b for b in core["books"] if b["id"] == "matthew")["chapters"] if c["n"] == "14")
    assert "feeding-of-five-thousand" in matthew14["events"]


def test_event_years_say_how_they_were_obtained() -> None:
    _, (core, _) = _bundle()
    events = {e["id"]: e for e in core["events"]}
    crucifixion = events["crucifixion-of-jesus"]
    assert crucifixion["basis"] == "dated_claim" and crucifixion["year"] == 30 and crucifixion["grade"] == "C"
    feeding = events["feeding-of-five-thousand"]
    assert feeding["basis"] == "participants" and feeding["grade"] == "E"
    assert feeding["gospels"] == ["Matthew", "Mark", "Luke", "John"]
    assert 0 < feeding["year"] <= 30                           # during the ministry, not at the window midpoint
    assert events["birth-of-jesus"]["year"] < 0                # a genealogy's David does not drag the birth back
    assert {e["basis"] for e in core["events"]} <= {"dated_claim", "participants", "chapter", "unplaced"}


def test_details_carry_provenance_and_family() -> None:
    _, (core, details) = _bundle()
    isaac = details["people"]["isaac"]
    assert ["child", "abram"] in isaac["relations"] and ["parent", "jacob"] in isaac["relations"]
    assert any(c["predicate"] == "age_at_birth_of" for c in isaac["claims"])
    assert any(w.startswith("mt-") for w, _ in isaac["attested"])
    for claim in isaac["claims"]:
        assert claim["citations"] and claim["confidence"] in "ABCDE"
    for witness_id, _ in isaac["attested"]:
        assert witness_id in details["witnesses"]
    index = {row[0]: i for i, row in enumerate(core["people"])}
    assert [index["abram"], index["isaac"]] in core["parents"]


def test_written_bundle_is_compact_json(tmp_path) -> None:
    dataset, _ = _bundle()
    write_site_bundle(dataset, resolve_model(dataset, "hybrid_reference"), tmp_path)
    core = json.loads((tmp_path / "core.json").read_text(encoding="utf-8"))
    assert core["schema_version"] == 1
    assert (tmp_path / "core.json").stat().st_size < 2_000_000
