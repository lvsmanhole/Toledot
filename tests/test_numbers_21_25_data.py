from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_twenty_one_through_twenty_five_reviews_conquests_and_balaam_cycle() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 21 <= int(unit.locator.split()[1].split(":")[0]) <= 25
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(21, 26))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"sihon-numbers", "og-numbers", "balaam-numbers", "balak-numbers", "phinehas", "zimri-numbers", "cozbi-numbers"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"sihon-defeated", "balaam-and-balak-oracles", "phinehas-at-peor"} <= events
