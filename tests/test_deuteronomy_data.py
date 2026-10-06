from functools import lru_cache
from pathlib import Path

import pytest

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"
DEUT_WITNESSES = {"lxx-deuteronomy-rahlfs-hanhart", "geez-deuteronomy-dillmann", "mt-deuteronomy-bhs"}

# Reviewed individuals per chapter; dropping one from the chapter inventory must fail.
DEUTERONOMY_CHAPTER_PEOPLE = {
    1: {"moses", "sihon-numbers", "og-numbers", "abram", "isaac", "jacob", "caleb-numbers", "jephunneh-numbers",
        "joshua-exodus", "nun-ephraim"},
    2: {"moses", "esau", "lot", "sihon-numbers"},
    3: {"moses", "og-numbers", "sihon-numbers", "jair-manasseh", "manasseh", "machir", "joshua-exodus"},
    4: {"moses", "sihon-numbers", "og-numbers"},
    6: {"abram", "isaac", "jacob", "pharaoh-exodus-second"},
    7: {"pharaoh-exodus-second"},
    9: {"moses", "anak", "aaron", "abram", "isaac", "jacob"},
    10: {"moses", "aaron", "eleazar-aaron"},
    11: {"pharaoh-exodus-second", "dathan-numbers", "abiram-numbers", "eliab-reuben", "reuben"},
    23: {"balaam-numbers", "beor-balaam"},
    24: {"miriam"},
    26: {"jacob"},
    29: {"moses", "pharaoh-exodus-second", "sihon-numbers", "og-numbers", "abram", "isaac", "jacob"},
    30: {"abram", "isaac", "jacob"},
    31: {"moses", "joshua-exodus", "sihon-numbers", "og-numbers"},
    32: {"moses", "joshua-exodus", "nun-ephraim", "aaron"},
    33: {"moses"},
    34: {"moses", "joshua-exodus", "nun-ephraim", "abram", "isaac", "jacob", "pharaoh-exodus-second"},
}


@lru_cache(maxsize=1)
def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


def _units():
    return {unit.locator: unit for unit in _dataset().inventory_units.values() if unit.work_id == "deuteronomy"}


def test_every_deuteronomy_chapter_is_reviewed_in_three_witnesses() -> None:
    units = _units()
    assert set(units) == {f"Deuteronomy {chapter}" for chapter in range(1, 35)}
    passages = _dataset().passages
    for unit in units.values():
        assert unit.reviewed
        assert {passages[passage_id].witness_id for passage_id in unit.passage_ids} == DEUT_WITNESSES, unit.locator


@pytest.mark.parametrize("chapter", sorted(DEUTERONOMY_CHAPTER_PEOPLE))
def test_deuteronomy_chapter_inventory_names_every_reviewed_person(chapter: int) -> None:
    people = set(_units()[f"Deuteronomy {chapter}"].identified_entity_ids)
    missing = DEUTERONOMY_CHAPTER_PEOPLE[chapter] - people
    assert not missing, f"Deuteronomy {chapter} inventory omits {sorted(missing)}"


def test_named_people_in_deuteronomy_are_attested_in_all_three_witnesses() -> None:
    dataset = _dataset()
    named = {person for people in DEUTERONOMY_CHAPTER_PEOPLE.values() for person in people} - {"jacob"}
    for person_id in named:
        witnesses = {
            claim.witness_id for claim in dataset.claims.values()
            if claim.subject_id == person_id and claim.predicate == "attested_in_passage" and claim.witness_id in DEUT_WITNESSES
        }
        assert witnesses == DEUT_WITNESSES, person_id


def test_moab_address_is_dated_relative_to_the_exodus_in_every_witness() -> None:
    dataset = _dataset()
    event = dataset.events["deuteronomy-moab-address-begins"]
    claims = [dataset.claims[claim_id] for claim_id in event.date_claim_ids]
    assert {claim.witness_id for claim in claims} == DEUT_WITNESSES
    for claim in claims:
        assert claim.value["reference_event"] == "passover-and-departure"
        assert (claim.value["year_number"], claim.value["month_number"], claim.value["day_number"]) == (40, 11, 1)


def test_moses_is_120_and_his_display_life_ends_in_the_fortieth_year() -> None:
    dataset = _dataset()
    ages = [claim for claim in dataset.claims.values() if claim.subject_id == "moses" and claim.predicate in {"age_at_event", "lifespan"}
            and claim.witness_id in DEUT_WITNESSES]
    assert {claim.witness_id for claim in ages} == DEUT_WITNESSES
    assert all(claim.value["value"] == 120 for claim in ages)
    lifespan = resolve_model(dataset, "hybrid_reference").lifespans["moses"]
    assert lifespan.birth_year.year - lifespan.death_year.year == 120  # BCE years count down


def test_aaron_death_place_tradition_is_kept_beside_mount_hor() -> None:
    dataset = _dataset()
    moserah = dataset.claims["aaron-death-moserah-mt"]
    assert moserah.value["place"] == "Moserah" and "Mount Hor" in moserah.interpretation_note
    assert "aarons-death-at-hor" in dataset.events
    assert "aaron-death-at-moserah-itinerary" in dataset.events


def test_hoshea_form_and_wandering_aramean_are_flagged_not_normalized() -> None:
    dataset = _dataset()
    assert dataset.claims["joshua-name-hoshea-deut-mt"].value["form"] == "Hoshea"
    aramean = dataset.claims["jacob-wandering-aramean-deut"]
    assert aramean.confidence == "C" and aramean.evidence_type == "editorial_inference"


def test_moses_death_and_joshua_succession_events_exist() -> None:
    events = _dataset().events
    death = events["moses-death-in-moab"]
    assert {participant.entity_id for participant in death.participants} >= {"moses"}
    assert {participant.entity_id for participant in events["joshua-commissioned-at-tent"].participants} >= {"moses", "joshua-exodus"}
