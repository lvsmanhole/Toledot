from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_exodus_one_through_seven_has_a_triadic_people_census_and_timeline() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    units = [
        unit for unit in dataset.inventory_units.values()
        if unit.id.startswith("inv-exod-")
        and int(unit.locator.split()[1].split(":")[0]) in range(1, 8)
    ]
    assert {int(unit.locator.split()[1].split(":")[0]) for unit in units} == set(range(1, 8))
    assert all(unit.reviewed and unit.passage_ids for unit in units)

    people = {
        "pharaoh-exodus", "shiphrah-exodus", "puah-exodus",
        "jacob-household-egypt-entry",
        "pharaoh-daughter-exodus", "pharaoh-daughter-handmaid-exodus",
        "amram", "jochebed", "moses", "miriam", "aaron",
        "midian-priest-exodus", "zipporah", "midian-daughters-group",
        "gershom", "eliezer-moses", "egyptian-taskmaster-exodus",
        "moses-son-circumcised",
        "pharaoh-exodus-second", "israelites-exodus",
        "egyptian-taskmasters-exodus",
        "hebrew-man-confronts-moses", "hebrew-foremen-exodus",
        "egyptian-magicians-exodus", "hebrew-male-infants-exodus",
        "izhar-levite", "hebron-levite", "uzziel", "korah-levite",
        "nepheg", "zichri", "mishael", "elzaphan", "sithri",
        "nadab", "abihu", "eleazar-aaron", "ithamar", "elisheba",
        "amminadab", "nahshon", "putiel", "eleazar-wife", "phinehas",
    }
    inventoried = {person for unit in units for person in unit.identified_entity_ids}
    assert people <= inventoried
    assert all(dataset.entities[person].entity_type in {"human", "group"} for person in people)

    witness_ids = {"lxx-exodus-rahlfs-hanhart", "geez-exodus-dillmann", "mt-exodus-bhs"}
    groups = {"midian-daughters-group", "hebrew-foremen-exodus", "egyptian-magicians-exodus", "israelites-exodus", "egyptian-taskmasters-exodus", "hebrew-male-infants-exodus", "jacob-household-egypt-entry"}
    exodus_humans = {
        entity_id for entity_id, entity in dataset.entities.items()
        if entity.entity_type == "human" and "data/exodus/01_07" in dataset.record_paths[entity_id].as_posix()
    }
    assert people - groups <= exodus_humans
    for person in exodus_humans:
        claims = [
            claim for claim in dataset.claims.values()
            if claim.subject_id == person and claim.predicate == "attested_in_passage"
        ]
        cited_witnesses = {citation.witness_id for claim in claims for citation in claim.citations}
        assert witness_ids <= cited_witnesses, person

    result = resolve_model(dataset, "hybrid_reference")
    assert exodus_humans <= set(result.lifespans)
    assert result.lifespans["moses"].confidence_grade == "E"
    assert (result.lifespans["moses"].birth_year.year, result.lifespans["moses"].death_year.year) == (1530, 1410)
    assert (result.lifespans["aaron"].birth_year.year, result.lifespans["aaron"].death_year.year) == (1533, 1410)
    assert dataset.claims["moses-age-at-pharaoh-exodus"].value["value"] == 80
    assert dataset.claims["aaron-age-at-pharaoh-exodus"].value["value"] == 83
    assert dataset.entities["moses-son-circumcised"].identity_status == "unnamed_unique"
    assert dataset.claims["jacob-entry-population-lxx"].value["value"] == 75
    assert dataset.claims["jacob-entry-population-mt"].value["value"] == 70
