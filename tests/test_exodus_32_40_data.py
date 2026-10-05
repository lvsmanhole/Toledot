from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_exodus_thirty_two_through_forty_reviews_calf_covenant_and_tabernacle() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "exodus" and 32 <= int(unit.locator.split()[1].split(":")[0]) <= 40
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(32, 41))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "joshua-exodus", "bezalel", "oholiab", "israelites-exodus", "levites-exodus", "sanctuary-contributors-exodus", "tabernacle-craftspeople"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"golden-calf-episode", "covenant-renewed-sinai", "tabernacle-completed", "glory-fills-tabernacle"} <= events
