from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_twenty_six_through_thirty_reviews_census_inheritance_and_vows() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 26 <= int(unit.locator.split()[1].split(":")[0]) <= 30
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(26, 31))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"zelophehad-numbers", "mahlah-numbers", "noah-zelophehad", "hoglah-numbers", "milcah-zelophehad", "tirzah-numbers", "joshua-exodus"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"second-census", "zelophehad-daughters-inheritance", "joshua-appointed-successor"} <= events
