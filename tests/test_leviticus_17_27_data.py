from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_leviticus_seventeen_through_twenty_seven_includes_named_and_unnamed_case_people() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "leviticus" and 17 <= int(unit.locator.split()[1].split(":")[0]) <= 27
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(17, 28))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "shelomith-leviticus", "blasphemer-leviticus", "egyptian-father-of-blasphemer", "israelite-who-fought-blasphemer"} <= people
    assert dataset.entities["blasphemer-leviticus"].identity_status == "unnamed_unique"
    events = {event for unit in units for event in unit.event_ids}
    assert {"blasphemy-case-and-execution", "covenant-law-instructions-leviticus"} <= events
    result = resolve_model(dataset, "hybrid_reference")
    assert {"shelomith-leviticus", "dibri-leviticus", "blasphemer-leviticus", "egyptian-father-of-blasphemer", "israelite-who-fought-blasphemer"} <= set(result.lifespans)
