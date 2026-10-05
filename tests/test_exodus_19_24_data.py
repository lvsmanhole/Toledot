from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_exodus_nineteen_through_twenty_four_reviews_sinai_and_covenant() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "exodus" and 19 <= int(unit.locator.split()[1].split(":")[0]) <= 24
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(19, 25))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    entities = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "nadab", "abihu", "joshua-exodus", "hur-exodus", "seventy-elders-israel"} <= entities
    events = {event for unit in units for event in unit.event_ids}
    assert {"israel-arrives-sinai", "sinai-covenant-proclaimed", "ten-words-given", "covenant-ratified", "moses-ascends-sinai"} <= events
