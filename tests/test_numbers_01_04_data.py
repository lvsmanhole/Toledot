from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_numbers_one_through_four_reviews_census_and_levite_people() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.work_id == "numbers" and 1 <= int(unit.locator.split()[1].split(":")[0]) <= 4
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(1, 5))
    assert all(unit.reviewed and len(unit.passage_ids) == 3 for unit in units)
    people = {entity for unit in units for entity in unit.identified_entity_ids}
    assert {"moses", "aaron", "eleazar-aaron", "ithamar", "israelites-exodus"} <= people
    assert {"shelumiel", "nahshon", "levi"} <= people
    events = {event for unit in units for event in unit.event_ids}
    assert {"first-census-and-camp-order", "levite-census-and-duties"} <= events
    result = resolve_model(dataset, "hybrid_reference")
    assert {"elizur-reuben", "shelumiel", "nethanel-issachar", "eliab-zebulun"} <= set(result.lifespans)
    census_claims = [claim for claim in dataset.claims.values() if claim.predicate == "population_count"]
    assert any(claim.subject_id == "israelites-exodus" and claim.value.get("count") == 603550 for claim in census_claims)
    age_claims = [claim for claim in dataset.claims.values() if claim.predicate == "census_service_age_range"]
    assert {(claim.witness_id, claim.value.get("minimum_age")) for claim in age_claims} >= {
        ("lxx-numbers-rahlfs-hanhart", 25), ("mt-numbers-bhs", 30)
    }
    tribal_counts = [
        claim for claim in dataset.claims.values()
        if claim.predicate == "census_subcount" and "clan" not in claim.value
    ]
    for witness_id in {claim.witness_id for claim in tribal_counts}:
        assert sum(claim.value["count"] for claim in tribal_counts if claim.witness_id == witness_id) == 603550
    levite_counts = [claim for claim in dataset.claims.values() if claim.predicate == "census_subcount" and "clan" in claim.value]
    assert {claim.value["count"] for claim in levite_counts if claim.witness_id == "lxx-numbers-rahlfs-hanhart"} == {7500, 8600, 6200}
    assert next(claim for claim in census_claims if claim.id == "levite-census-total-lxx").value["count"] == 22000
    census_event = dataset.events["first-census-and-camp-order"]
    assert "numbers-census-year-hybrid" in census_event.date_claim_ids
