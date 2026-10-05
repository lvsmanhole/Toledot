from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_exodus_twenty_five_through_thirty_one_covers_tabernacle_and_artisans() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "exodus" and 25 <= int(unit.locator.split()[1].split(":")[0]) <= 31
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(25, 32))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {person for unit in units for person in unit.identified_entity_ids}
    assert {"moses", "bezalel", "uri-bezalel", "hur-ancestor-bezalel", "oholiab", "ahisamach", "tabernacle-craftspeople"} <= people
    assert "Eliab (LXX form)" in dataset.entities["oholiab"].aliases
    assert "Beseleel (LXX form)" in dataset.entities["bezalel"].aliases
    events = {event for unit in units for event in unit.event_ids}
    assert {"tabernacle-instructions", "craftspeople-appointed", "sabbath-covenant-sign"} <= events
    result = resolve_model(dataset, "hybrid_reference")
    assert {"bezalel", "oholiab"} <= set(result.lifespans)
