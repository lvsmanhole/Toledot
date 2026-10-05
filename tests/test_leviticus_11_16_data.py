from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_leviticus_eleven_through_sixteen_reviews_purity_and_atonement() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "leviticus" and 11 <= int(unit.locator.split()[1].split(":")[0]) <= 16
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(11, 17))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "israelites-exodus", "levitical-priesthood", "leviticus-worshippers"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"purity-instructions-delivered", "day-of-atonement-service"} <= events
