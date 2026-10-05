from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_leviticus_one_through_ten_censuses_instructions_and_priestly_deaths() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "leviticus" and 1 <= int(unit.locator.split()[1].split(":")[0]) <= 10
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(1, 11))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "nadab", "abihu", "eleazar-aaron", "ithamar", "mishael", "elzaphan"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"aaron-and-sons-consecrated", "priests-begin-service", "nadab-abihu-die"} <= events
    assert "Misadai (LXX form)" in dataset.entities["mishael"].aliases
    assert "Elisaphan (LXX form)" in dataset.entities["elzaphan"].aliases
    assert dataset.claims["nadab-death-leviticus-lxx"].confidence == "A"
    result = resolve_model(dataset, "hybrid_reference")
    assert result.lifespans["nadab"].confidence_grade == "E"
    assert result.lifespans["nadab"].death_year.year == 1450
