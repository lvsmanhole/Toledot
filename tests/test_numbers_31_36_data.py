from pathlib import Path

from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_thirty_one_through_thirty_six_closes_the_wilderness_book() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 31 <= int(unit.locator.split()[1].split(":")[0]) <= 36
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(31, 37))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"balaam-numbers", "evi-midian", "rekem-midian", "zur-midian", "hur-midian", "reba-midian", "aaron", "moses", "joshua-exodus"} <= people
    # Names explicitly present in the Transjordan settlement and tribal-leader
    # lists must be represented as people, not hidden in passage summaries.
    assert {"machir", "jair-manasseh", "nobah-gilead"} <= people
    land_leaders = {
        "caleb-numbers", "shemuel-land-allotment", "elidad-land-allotment",
        "bukki-land-allotment", "hanniel-land-allotment", "kemuel-land-allotment",
        "elizaphan-land-allotment", "paltiel-land-allotment", "ahihud-land-allotment",
        "pedahel-land-allotment",
    }
    assert land_leaders <= people
    # LXX forms that look like other biblical names are witness variants here,
    # not license to merge unrelated people (notably Eldad of Numbers 11).
    assert "eldad-numbers" not in land_leaders
    events = {event for unit in units for event in unit.event_ids}
    assert {"midian-campaign-and-balaam-death", "aaron-death-dated-at-hor", "daughters-inherit-within-tribe"} <= events
