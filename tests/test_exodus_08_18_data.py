from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_exodus_eight_through_eighteen_covers_plagues_departure_and_sinai() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [unit for unit in dataset.inventory_units.values() if unit.id.startswith("inv-exod-")]
    chapters = {
        int(unit.locator.split()[1].split(":")[0])
        for unit in units
        if 8 <= int(unit.locator.split()[1].split(":")[0]) <= 18
    }
    assert chapters == set(range(8, 19))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units if int(unit.locator.split()[1].split(":")[0]) in chapters)

    required = {
        "moses", "aaron", "pharaoh-exodus-second", "israelites-exodus",
        "joshua-exodus", "hur-exodus", "midian-priest-exodus", "zipporah",
        "gershom", "eliezer-moses", "egyptian-firstborn-exodus",
        "israelite-firstborn-exodus", "amalekites-exodus", "mixed-multitude-exodus",
    }
    inventoried = {entity_id for unit in units if 8 <= int(unit.locator.split()[1].split(":")[0]) <= 18 for entity_id in unit.identified_entity_ids}
    assert required <= inventoried
    assert {"plagues-locusts-darkness", "passover-and-departure", "crossing-of-sea", "battle-with-amalek", "jethro-visits-moses"} <= {
        event_id for unit in units for event_id in unit.event_ids
    }
    result = resolve_model(dataset, "hybrid_reference")
    assert {entity_id for entity_id in required if dataset.entities[entity_id].entity_type == "human"} <= set(result.lifespans)
