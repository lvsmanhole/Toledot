from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_sixteen_through_twenty_reviews_rebellion_and_death_at_hor() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 16 <= int(unit.locator.split()[1].split(":")[0]) <= 20
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(16, 21))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"korah-levite", "dathan-numbers", "abiram-numbers", "on-numbers", "aaron", "eleazar-aaron", "miriam"} <= people
    assert "korah-esau" not in people
    events = {event for unit in units for event in unit.event_ids}
    assert {"korah-rebellion", "aarons-death-at-hor", "water-from-rock-at-meribah"} <= events
