from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.validation import validate_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


def test_every_genesis_12_through_36_chapter_is_reviewed() -> None:
    dataset = _dataset()
    units = [
        unit
        for unit in dataset.inventory_units.values()
        if unit.id.startswith("inv-gen-") and unit.locator.removeprefix("Genesis ").isdigit()
    ]
    chapters = {int(unit.locator.split()[1]) for unit in units if 12 <= int(unit.locator.split()[1]) <= 36}

    assert chapters == set(range(12, 37))
    assert all(unit.reviewed and unit.passage_ids for unit in units if int(unit.locator.split()[1]) in chapters)


def test_patriarch_aliases_unnamed_people_and_rulers_are_distinct() -> None:
    dataset = _dataset()

    assert "Abraham" in dataset.entities["abram"].aliases
    assert "Sarah" in dataset.entities["sarai"].aliases
    assert "Edom" in dataset.entities["esau"].aliases
    assert "Israel" in dataset.entities["jacob"].aliases
    assert {"hagar", "ishmael", "isaac", "rebekah"} <= set(dataset.entities)
    for entity_id in ("lot-wife", "lot-daughter-older", "lot-daughter-younger", "abraham-servant"):
        assert dataset.entities[entity_id].identity_status == "unnamed_unique"
    assert dataset.entities["pharaoh-gen12"].id != dataset.entities["abimelech-gen20"].id
    assert dataset.entities["abimelech-gen20"].id != dataset.entities["abimelech-gen26"].id


def test_named_children_and_descendants_are_present() -> None:
    dataset = _dataset()
    expected = {
        "zimran", "jokshan", "medan", "midian", "ishbak", "shuah",
        "nebaioth", "kedar", "adbeel", "mibsam", "mishma", "dumah",
        "massa", "hadad-ishmael", "tema", "jetur", "naphish", "kedemah",
        "eliphaz", "reuel-esau", "jeush", "jalam", "korah-esau", "amalek",
        "reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad",
        "asher", "issachar", "zebulun", "dinah", "joseph", "benjamin",
    }
    assert expected <= set(dataset.entities)


def test_sourced_parentage_marriages_and_direct_ages() -> None:
    dataset = _dataset()
    parent_pairs = {
        (relationship.subject_id, relationship.object_id)
        for relationship in dataset.relationships.values()
        if relationship.relationship_type == "parent"
    }
    spouse_pairs = {
        frozenset((relationship.subject_id, relationship.object_id))
        for relationship in dataset.relationships.values()
        if relationship.relationship_type == "spouse"
    }

    assert {("abram", "ishmael"), ("abram", "isaac"), ("isaac", "esau"), ("isaac", "jacob")} <= parent_pairs
    assert {("jacob", child) for child in ("reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad", "asher", "issachar", "zebulun", "dinah", "joseph", "benjamin")} <= parent_pairs
    assert frozenset(("abram", "sarai")) in spouse_pairs
    assert frozenset(("isaac", "rebekah")) in spouse_pairs
    assert frozenset(("jacob", "leah")) in spouse_pairs
    assert dataset.claims["abram-age-at-departure"].value["value"] == 75
    assert dataset.claims["abram-age-at-ishmael-birth"].value["value"] == 86
    assert dataset.claims["abram-age-at-isaac-birth"].value["value"] == 100
    assert dataset.claims["isaac-age-at-twins-birth"].value["value"] == 60


def test_hybrid_reference_resolves_every_human_in_slice_with_explanations() -> None:
    dataset = _dataset()
    result = resolve_model(dataset, "hybrid_reference")
    slice_humans = {
        entity_id
        for entity_id, entity in dataset.entities.items()
        if entity.entity_type == "human" and "12_36" in dataset.record_paths[entity_id].as_posix()
    }

    assert slice_humans <= set(result.lifespans)
    for entity_id in slice_humans:
        lifespan = result.lifespans[entity_id]
        assert lifespan.birth_year <= lifespan.death_year
        assert lifespan.evidence_claim_ids
        assert lifespan.explanation
        if lifespan.life_basis == "editorial_estimate":
            assert lifespan.confidence_grade == "E"


def test_genesis_12_through_36_has_no_semantic_errors() -> None:
    assert not [issue for issue in validate_dataset(_dataset()) if issue.severity == "error"]


def test_terah_household_estimates_do_not_inherit_abram_lifespan_evidence() -> None:
    dataset = _dataset()
    result = resolve_model(dataset, "hybrid_reference")
    for entity_id in ("nahor-brother-abram", "haran", "lot", "milcah", "iscah"):
        lifespan = result.lifespans[entity_id]
        assert lifespan.life_basis == "editorial_estimate"
        assert lifespan.confidence_grade == "E"
        assert lifespan.evidence_claim_ids == (f"{entity_id}-attested",)
        assert f"{entity_id}-lifespan-lxx" not in lifespan.evidence_claim_ids
