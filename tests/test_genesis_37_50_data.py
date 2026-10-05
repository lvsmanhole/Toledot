from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.validation import validate_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


def test_every_genesis_37_through_50_chapter_is_reviewed() -> None:
    dataset = _dataset()
    units = [unit for unit in dataset.inventory_units.values() if unit.locator.removeprefix("Genesis ").isdigit()]
    chapters = {int(unit.locator.split()[1]) for unit in units if 37 <= int(unit.locator.split()[1]) <= 50}
    assert chapters == set(range(37, 51))
    assert all(unit.reviewed and unit.passage_ids for unit in units if int(unit.locator.split()[1]) in chapters)


def test_joseph_cycle_sentinels_and_title_ambiguity() -> None:
    dataset = _dataset()
    expected = {
        "joseph", "judah", "tamar", "perez", "zerah-judah", "potiphar",
        "potiphar-wife", "pharaoh-cupbearer", "pharaoh-baker", "asenath",
        "manasseh", "ephraim", "pharaoh-gen41",
    }
    assert expected <= set(dataset.entities)
    assert dataset.entities["potiphar-wife"].identity_status == "unnamed_unique"
    assert dataset.entities["pharaoh-cupbearer"].identity_status == "unnamed_unique"
    assert dataset.entities["pharaoh-baker"].identity_status == "unnamed_unique"
    assert dataset.entities["pharaoh-gen41"].id != dataset.entities["pharaoh-gen12"].id


def test_joseph_and_jacob_age_claims_are_explicit_or_explained_calculations() -> None:
    dataset = _dataset()
    assert dataset.claims["joseph-age-seventeen"].value["value"] == 17
    assert dataset.claims["joseph-age-before-pharaoh"].value["value"] == 30
    assert dataset.claims["joseph-lifespan-lxx"].value["value"] == 110
    assert dataset.claims["jacob-age-before-pharaoh"].value["value"] == 130
    assert dataset.claims["jacob-lifespan-lxx"].value["value"] == 147
    birth_age = dataset.claims["jacob-age-at-joseph-birth-calculated"]
    assert birth_age.value["value"] == 91
    assert birth_age.evidence_type == "calculated"
    assert birth_age.interpretation_note


def test_family_relationships_and_migration_death_events_are_sourced() -> None:
    dataset = _dataset()
    parent_pairs = {
        (relationship.subject_id, relationship.object_id)
        for relationship in dataset.relationships.values()
        if relationship.relationship_type == "parent"
    }
    assert {("judah", "perez"), ("judah", "zerah-judah"), ("joseph", "manasseh"), ("joseph", "ephraim")} <= parent_pairs
    for event_id in ("jacob-household-migrates-egypt", "jacob-death", "joseph-death"):
        event = dataset.events[event_id]
        assert event.citations
        assert event.participants


def test_hybrid_reference_resolves_every_joseph_cycle_human() -> None:
    dataset = _dataset()
    result = resolve_model(dataset, "hybrid_reference")
    slice_humans = {
        entity_id
        for entity_id, entity in dataset.entities.items()
        if entity.entity_type == "human" and "37_50" in dataset.record_paths[entity_id].as_posix()
    }
    assert slice_humans <= set(result.lifespans)
    assert result.lifespans["joseph"].birth_year <= result.lifespans["joseph"].death_year
    assert result.lifespans["joseph"].evidence_claim_ids
    for entity_id in slice_humans:
        lifespan = result.lifespans[entity_id]
        assert lifespan.explanation
        if lifespan.life_basis == "editorial_estimate":
            assert lifespan.confidence_grade == "E"


def test_complete_genesis_dataset_has_no_semantic_errors() -> None:
    assert not [issue for issue in validate_dataset(_dataset()) if issue.severity == "error"]
