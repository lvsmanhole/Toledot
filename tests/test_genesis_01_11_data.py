from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.validation import validate_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"

INVENTORY_LOCATORS = {
    "Genesis 1:1-2:3",
    "Genesis 2:4-25",
    "Genesis 3:1-24",
    "Genesis 4:1-16",
    "Genesis 4:17-24",
    "Genesis 4:25-26",
    "Genesis 5:1-32",
    "Genesis 6:1-8",
    "Genesis 6:9-22",
    "Genesis 7:1-24",
    "Genesis 8:1-22",
    "Genesis 9:1-17",
    "Genesis 9:18-29",
    "Genesis 10:1-32",
    "Genesis 11:1-9",
    "Genesis 11:10-26",
    "Genesis 11:27-32",
}

NAMED_GENEALOGY_HUMANS = {
    "adam", "cain", "abel", "seth", "enosh", "enoch-cain", "irad",
    "mehujael", "methushael", "lamech-cain", "jabal", "jubal",
    "tubal-cain", "naamah", "kenan", "mahalalel", "jared",
    "enoch-seth", "methuselah", "lamech-seth", "noah", "shem", "ham",
    "japheth", "gomer", "magog", "madai", "javan", "tubal", "meshech",
    "tiras", "ashkenaz", "riphath", "togarmah", "elishah", "tarshish",
    "kittim", "dodanim", "cush", "mizraim", "put", "canaan", "seba",
    "havilah-cush", "sabtah", "raamah", "sabteca", "sheba-raamah",
    "dedan-raamah", "nimrod", "ludim", "anamim", "lehabim", "naphtuhim",
    "pathrusim", "casluhim", "caphtorim", "sidon", "heth", "elam",
    "asshur", "arphaxad", "lud-shem", "aram", "uz", "hul", "gether",
    "mash", "cainan-postflood", "shelah", "eber", "peleg", "joktan",
    "almodad", "sheleph", "hazarmaveth", "jerah", "hadoram", "uzal",
    "diklah", "obal", "abimael", "sheba-joktan", "ophir",
    "havilah-joktan", "jobab", "reu", "serug", "nahor-father-terah",
    "terah", "abram", "nahor-brother-abram", "haran", "lot",
}

ANTEDILUVIAN_EDGES = (
    ("adam", "seth"),
    ("seth", "enosh"),
    ("enosh", "kenan"),
    ("kenan", "mahalalel"),
    ("mahalalel", "jared"),
    ("jared", "enoch-seth"),
    ("enoch-seth", "methuselah"),
    ("methuselah", "lamech-seth"),
    ("lamech-seth", "noah"),
)


def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


def test_inventory_reviews_every_genesis_1_through_11_unit() -> None:
    dataset = _dataset()
    units = {
        unit.locator: unit
        for unit in dataset.inventory_units.values()
        if unit.work_id == "genesis" and unit.locator in INVENTORY_LOCATORS
    }

    assert set(units) == INVENTORY_LOCATORS
    assert all(unit.reviewed for unit in units.values())
    assert all(unit.passage_ids for unit in units.values())
    assert all(unit.identified_entity_ids or unit.no_individuals for unit in units.values())
    assert {int(locator.split()[1].split(":")[0]) for locator in units} == set(range(1, 12))


def test_named_and_unnamed_people_are_distinct_and_groups_are_not_people() -> None:
    dataset = _dataset()

    assert NAMED_GENEALOGY_HUMANS <= set(dataset.entities)
    nation_groups = {"ludim", "anamim", "lehabim", "naphtuhim", "pathrusim", "casluhim", "caphtorim"}
    assert all(
        dataset.entities[entity_id].entity_type == ("group" if entity_id in nation_groups else "human")
        for entity_id in NAMED_GENEALOGY_HUMANS
    )
    assert dataset.entities["enoch-cain"] != dataset.entities["enoch-seth"]
    assert dataset.entities["noah-wife"].identity_status == "unnamed_unique"
    assert {
        "wife-shem",
        "wife-ham",
        "wife-japheth",
    } <= set(dataset.entities)
    assert len({dataset.entities[item].id for item in ("wife-shem", "wife-ham", "wife-japheth")}) == 3
    assert dataset.entities["sons-of-god"].entity_type == "group"
    assert dataset.entities["nephilim"].entity_type == "group"


def test_genesis_5_age_and_lifespan_claims_retain_each_witness() -> None:
    dataset = _dataset()
    witnesses = {
        "lxx": "lxx-genesis-goettingen",
        "mt": "mt-genesis-bhs",
        "sp": "sp-genesis-schorch",
    }

    for tradition, witness_id in witnesses.items():
        for parent, child in ANTEDILUVIAN_EDGES:
            claim = dataset.claims[f"{parent}-age-at-{child}-{tradition}"]
            assert claim.witness_id == witness_id
            assert claim.object_id == child
            assert claim.evidence_type == "explicit_text"
        for person in (*[parent for parent, _ in ANTEDILUVIAN_EDGES], "noah"):
            claim = dataset.claims[f"{person}-lifespan-{tradition}"]
            assert claim.witness_id == witness_id
            assert claim.value["unit"] == "years"

    expected_lxx_locators = {
        "adam": "Genesis 5:5", "seth": "Genesis 5:8", "enosh": "Genesis 5:11",
        "kenan": "Genesis 5:14", "mahalalel": "Genesis 5:17", "jared": "Genesis 5:20",
        "enoch-seth": "Genesis 5:23-24", "methuselah": "Genesis 5:27",
        "lamech-seth": "Genesis 5:31", "noah": "Genesis 9:28-29",
    }
    for person, locator in expected_lxx_locators.items():
        citation = dataset.claims[f"{person}-lifespan-lxx"].citations[0]
        assert citation.locator == locator


def test_genesis_11_variants_and_lxx_cainan_remain_separate() -> None:
    dataset = _dataset()

    assert dataset.claims["arphaxad-age-at-shelah-mt"].value["value"] == 35
    assert dataset.claims["arphaxad-age-at-shelah-sp"].value["value"] == 135
    assert dataset.claims["arphaxad-age-at-cainan-postflood-lxx"].value["value"] == 135
    cainan = dataset.entities["cainan-postflood"]
    assert cainan.identity_status == "witness_variant"
    assert any(citation.witness_id == "lxx-genesis-goettingen" for citation in cainan.citations)


def test_models_resolve_deterministically_and_hybrid_prefers_lxx_early_chain() -> None:
    dataset = _dataset()
    model_ids = ("lxx_early", "masoretic_early", "samaritan_early", "hybrid_reference")
    results = {}
    for model_id in model_ids:
        first = resolve_model(dataset, model_id)
        second = resolve_model(dataset, model_id)
        assert dict(first.derivation_values) == dict(second.derivation_values)
        assert dict(first.lifespans) == dict(second.lifespans)
        assert all(life.birth_year <= life.death_year for life in first.lifespans.values())
        results[model_id] = first

    for entity_id in ("seth", "enosh", "kenan", "mahalalel", "jared", "enoch-seth", "methuselah", "lamech-seth", "noah"):
        assert results["hybrid_reference"].lifespans[entity_id] == results["lxx_early"].lifespans[entity_id].__class__(
            **{
                **{field: getattr(results["lxx_early"].lifespans[entity_id], field) for field in results["lxx_early"].lifespans[entity_id].__dataclass_fields__},
                "model_id": "hybrid_reference",
            }
        )

    human_ids = {entity.id for entity in dataset.entities.values() if entity.entity_type == "human"}
    assert human_ids <= set(results["hybrid_reference"].lifespans)
    assert all(life.evidence_claim_ids and life.explanation for life in results["hybrid_reference"].lifespans.values())
    assert all(
        life.confidence_grade == "E"
        for life in results["hybrid_reference"].lifespans.values()
        if life.life_basis == "editorial_estimate"
    )


def test_genesis_1_through_11_has_no_semantic_errors() -> None:
    assert not [issue for issue in validate_dataset(_dataset()) if issue.severity == "error"]


def test_plural_nations_in_genesis_10_are_groups_not_human_lifespans() -> None:
    dataset = _dataset()
    nation_ids = {"ludim", "anamim", "lehabim", "naphtuhim", "pathrusim", "casluhim", "caphtorim"}
    assert all(dataset.entities[entity_id].entity_type == "group" for entity_id in nation_ids)
    result = resolve_model(dataset, "hybrid_reference")
    assert nation_ids.isdisjoint(result.lifespans)
