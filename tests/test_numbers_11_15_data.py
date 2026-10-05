from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_eleven_through_fifteen_review_spies_and_wilderness_generation() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 11 <= int(unit.locator.split()[1].split(":")[0]) <= 15
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(11, 16))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "miriam", "joshua-exodus", "caleb-numbers", "eldad-numbers", "medad-numbers"} <= people
    assert {"eldads-and-medads-prophesy", "twelve-spies-sent", "wilderness-generation-sentence"} <= {
        event for unit in units for event in unit.event_ids
    }
