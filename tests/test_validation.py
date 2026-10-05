from dataclasses import replace
from pathlib import Path

from bible_timeline.loader import load_dataset
from bible_timeline.models import (
    Citation,
    Claim,
    Entity,
    Event,
    EventParticipant,
    Relationship,
)
from bible_timeline.validation import materialize_relationships, validate_dataset


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "minimal_dataset"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"
SOURCE_CITATION = Citation(source_id="source-genesis", locator="test")


def _dataset():
    return load_dataset(FIXTURE_ROOT, SCHEMA_ROOT)


def _codes(dataset) -> set[str]:
    return {issue.code for issue in validate_dataset(dataset)}


def test_reports_dangling_cross_record_references() -> None:
    dataset = _dataset()
    dataset.relationships["adam-parent-of-seth"] = replace(
        dataset.relationships["adam-parent-of-seth"], object_id="missing-person"
    )
    dataset.entities["adam"] = replace(
        dataset.entities["adam"],
        citations=(
            Citation(
                source_id="missing-source",
                passage_id="missing-passage",
                locator="missing",
            ),
        ),
    )
    dataset.inventory_units["genesis-5-3-review"] = replace(
        dataset.inventory_units["genesis-5-3-review"],
        event_ids=("missing-event",),
    )
    dataset.claims["adam-age-at-seth-lxx"] = replace(
        dataset.claims["adam-age-at-seth-lxx"],
        value={"kind": "model_year", "chronology_model_id": "missing-model"},
    )
    dataset.chronology_models["test-model"] = replace(
        dataset.chronology_models["test-model"],
        resolutions=(
            {
                "entity_id": "adam",
                "birth_derivation_id": "missing-derivation",
                "death_derivation_id": "missing-derivation",
                "life_basis": "calculated",
                "confidence_grade": "B",
                "evidence_claim_ids": ["adam-age-at-seth-lxx"],
                "explanation": "fixture",
            },
        ),
    )

    assert {
        "dangling_entity",
        "dangling_source",
        "dangling_passage",
        "dangling_event",
        "dangling_model",
        "dangling_derivation",
    }.issubset(_codes(dataset))


def test_reports_event_outside_explicit_grade_a_lifespan() -> None:
    dataset = _dataset()
    dataset.claims.update(
        {
            "adam-birth-year": Claim(
                id="adam-birth-year",
                subject_id="adam",
                predicate="birth_year",
                value={"kind": "historical_year", "era": "BCE", "year": 100},
                evidence_type="explicit_text",
                confidence="A",
                citations=(SOURCE_CITATION,),
            ),
            "adam-death-year": Claim(
                id="adam-death-year",
                subject_id="adam",
                predicate="death_year",
                value={"kind": "historical_year", "era": "BCE", "year": 10},
                evidence_type="explicit_text",
                confidence="A",
                citations=(SOURCE_CITATION,),
            ),
            "early-event-year": Claim(
                id="early-event-year",
                subject_id="early-event",
                predicate="event_year",
                value={"kind": "historical_year", "era": "BCE", "year": 150},
                evidence_type="explicit_text",
                confidence="A",
                citations=(SOURCE_CITATION,),
            ),
        }
    )
    dataset.events["early-event"] = Event(
        id="early-event",
        event_type="test",
        name="Too early",
        participants=(EventParticipant(entity_id="adam", role="subject"),),
        date_claim_ids=("early-event-year",),
        citations=(SOURCE_CITATION,),
    )

    assert "event_outside_lifespan" in _codes(dataset)


def test_reports_unexplained_editorial_estimate() -> None:
    dataset = _dataset()
    dataset.chronology_models["test-model"] = replace(
        dataset.chronology_models["test-model"],
        derivations=(
            {"id": "adam-birth", "operation": "literal"},
            {"id": "adam-death", "operation": "literal"},
        ),
        resolutions=(
            {
                "entity_id": "adam",
                "birth_derivation_id": "adam-birth",
                "death_derivation_id": "adam-death",
                "life_basis": "editorial_estimate",
                "confidence_grade": "E",
                "evidence_claim_ids": ["adam-age-at-seth-lxx"],
                "explanation": "",
            },
        ),
    )

    assert "unexplained_editorial_estimate" in _codes(dataset)


def test_reports_group_with_human_lifespan_claim() -> None:
    dataset = _dataset()
    dataset.entities["crowd"] = Entity(
        id="crowd",
        entity_type="group",
        primary_name="Crowd",
        aliases=(),
        classification="collective",
        citations=(SOURCE_CITATION,),
    )
    dataset.claims["crowd-birth"] = Claim(
        id="crowd-birth",
        subject_id="crowd",
        predicate="birth_year",
        value={"kind": "historical_year", "era": "BCE", "year": 100},
        evidence_type="editorial_estimate",
        confidence="E",
        citations=(SOURCE_CITATION,),
        interpretation_note="invalid fixture",
    )

    assert "nonhuman_lifespan" in _codes(dataset)


def test_reports_inverse_relationship_that_contradicts_source() -> None:
    dataset = _dataset()
    dataset.relationships["bad-inverse"] = Relationship(
        id="bad-inverse",
        relationship_type="child",
        subject_id="adam",
        object_id="seth",
        claim_ids=("adam-age-at-seth-lxx",),
        citations=(SOURCE_CITATION,),
        derived_from="adam-parent-of-seth",
    )

    assert "invalid_inverse_relationship" in _codes(dataset)


def test_materializes_only_directed_inverse_relationships() -> None:
    dataset = _dataset()
    dataset.relationships["adam-spouse-seth"] = Relationship(
        id="adam-spouse-seth",
        relationship_type="spouse",
        subject_id="adam",
        object_id="seth",
        claim_ids=(),
        citations=(SOURCE_CITATION,),
    )
    dataset.relationships["adam-witness-seth"] = Relationship(
        id="adam-witness-seth",
        relationship_type="witness",
        subject_id="adam",
        object_id="seth",
        claim_ids=(),
        citations=(SOURCE_CITATION,),
    )

    relationships = materialize_relationships(dataset)
    generated = [item for item in relationships if item.derived_from]

    assert len(generated) == 1
    assert generated[0].relationship_type == "child"
    assert generated[0].subject_id == "seth"
    assert generated[0].object_id == "adam"
    assert generated[0].derived_from == "adam-parent-of-seth"


def test_shared_alias_does_not_merge_distinct_people() -> None:
    dataset = _dataset()
    dataset.entities["simon-one"] = Entity(
        id="simon-one",
        entity_type="human",
        primary_name="Simon One",
        aliases=("Simon",),
        classification="historical_human",
        citations=(SOURCE_CITATION,),
    )
    dataset.entities["simon-two"] = Entity(
        id="simon-two",
        entity_type="human",
        primary_name="Simon Two",
        aliases=("Simon",),
        classification="historical_human",
        citations=(SOURCE_CITATION,),
    )

    issues = validate_dataset(dataset)

    assert {"simon-one", "simon-two"}.issubset(dataset.entities)
    assert all(issue.code != "duplicate_entity" for issue in issues)
