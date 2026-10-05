from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_five_through_ten_reviews_sinai_departure_and_hobab() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 5 <= int(unit.locator.split()[1].split(":")[0]) <= 10
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(5, 11))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "israelites-exodus", "hobab-numbers", "nahshon"} <= people
    assert dataset.entities["hobab-numbers"].identity_status == "named"
    assert "midian-priest-exodus" not in people
    events = {event for unit in units for event in unit.event_ids}
    assert {"nazirite-vow-instructions", "sinai-departure-and-hobab-invitation"} <= events
    departure = dataset.events["sinai-departure-and-hobab-invitation"]
    assert "numbers-sinai-departure-relative-lxx" in departure.date_claim_ids
