from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


GENESIS_36_PEOPLE = {
    "seir-horite", "lotan-horite", "shobal-horite", "zibeon-horite", "anah-horite",
    "dishon-horite", "ezer-horite", "dishan-horite", "hori-lotan", "hemam-lotan",
    "alvan-shobal", "manahath-shobal", "ebal-shobal", "shepho-shobal", "onam-shobal",
    "aiah-zibeon", "hemdan-dishon", "eshban-dishon", "ithran-dishon", "cheran-dishon",
    "bilhan-ezer", "zaavan-ezer", "akan-ezer", "uz-dishan", "aran-dishan",
    "bela-edom", "beor-edom", "jobab-edom", "zerah-edom-king", "husham-edom",
    "hadad-edom", "bedad-edom", "samlah-edom", "shaul-edom", "baal-hanan-edom",
    "achbor-edom", "hadar-edom", "mehetabel-edom", "matred-edom", "mezahab-edom",
    "timnah-chief-edom", "alvah-chief-edom", "jetheth-chief-edom", "elah-chief-edom",
    "pinon-chief-edom", "mibzar-chief-edom", "magdiel-chief-edom", "iram-chief-edom",
}


def test_missing_genesis_people_are_sourced_inventoried_and_resolvable() -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    required_people = GENESIS_36_PEOPLE | {"cain-wife", "tamar-midwife"}
    assert required_people <= set(dataset.entities)
    assert all(dataset.entities[person_id].entity_type == "human" for person_id in required_people)

    inventoried = {
        entity_id
        for unit in dataset.inventory_units.values()
        for entity_id in unit.identified_entity_ids
    }
    assert required_people <= inventoried

    for person_id in required_people:
        claims = [
            claim for claim in dataset.claims.values()
            if claim.subject_id == person_id and claim.predicate == "attested_in_passage"
        ]
        attested_witnesses = {claim.witness_id for claim in claims}
        attested_witnesses |= {
            citation.witness_id for claim in claims for citation in claim.citations
        }
        assert attested_witnesses >= {
            "lxx-genesis-goettingen", "geez-genesis-dillmann", "mt-genesis-bhs"
        }, person_id

    resolution = resolve_model(dataset, "hybrid_reference")
    assert required_people <= set(resolution.lifespans)
    assert all(resolution.lifespans[person_id].confidence_grade == "E" for person_id in required_people)
