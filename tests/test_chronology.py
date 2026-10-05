from dataclasses import replace
from pathlib import Path

import pytest

from bible_timeline.chronology import ChronologyResolutionError, resolve_model
from bible_timeline.dates import HistoricalYear
from bible_timeline.loader import load_dataset
from bible_timeline.models import Claim


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "minimal_dataset"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def _dataset():
    return load_dataset(FIXTURE_ROOT, SCHEMA_ROOT)


def _set_model(dataset, derivations, resolutions=()):
    dataset.chronology_models["test-model"] = replace(
        dataset.chronology_models["test-model"],
        derivations=tuple(derivations),
        resolutions=tuple(resolutions),
    )


def _resolution(
    entity_id: str,
    birth_id: str,
    death_id: str,
    *,
    basis: str = "calculated",
    grade: str = "B",
    evidence=(),
    alternatives=(),
    explanation: str = "Derived from fixture evidence",
):
    return {
        "entity_id": entity_id,
        "birth_derivation_id": birth_id,
        "death_derivation_id": death_id,
        "life_basis": basis,
        "confidence_grade": grade,
        "evidence_claim_ids": list(evidence),
        "alternative_claim_ids": list(alternatives),
        "explanation": explanation,
    }


def test_resolves_literal_anchors_and_select_claim_nodes() -> None:
    dataset = _dataset()
    citation = dataset.claims["adam-age-at-seth-lxx"].citations
    dataset.claims["adam-death-date"] = Claim(
        id="adam-death-date",
        subject_id="adam",
        predicate="death_year",
        value={"kind": "historical_year", "era": "BCE", "year": 3070},
        evidence_type="calculated",
        confidence="B",
        citations=citation,
    )
    _set_model(
        dataset,
        [
            {
                "id": "adam-birth",
                "operation": "literal",
                "year": {"era": "BCE", "year": 4000},
            },
            {
                "id": "adam-death",
                "operation": "select_claim",
                "claim_id": "adam-death-date",
            },
        ],
        [
            _resolution(
                "adam",
                "adam-birth",
                "adam-death",
                evidence=("adam-death-date",),
                alternatives=("adam-age-at-seth-mt",),
            )
        ],
    )

    result = resolve_model(dataset, "test-model")

    assert result.derivation_values["adam-birth"] == HistoricalYear("BCE", 4000)
    assert result.lifespans["adam"].death_year == HistoricalYear("BCE", 3070)
    assert result.lifespans["adam"].evidence_claim_ids == ("adam-death-date",)
    assert result.lifespans["adam"].alternative_claim_ids == (
        "adam-age-at-seth-mt",
    )


def test_resolves_genesis_age_and_lifespan_offsets() -> None:
    dataset = _dataset()
    citation = dataset.claims["adam-age-at-seth-lxx"].citations
    dataset.claims["adam-lifespan"] = Claim(
        id="adam-lifespan",
        subject_id="adam",
        predicate="lifespan",
        value={"kind": "duration", "value": 930, "unit": "years"},
        evidence_type="explicit_text",
        confidence="A",
        citations=citation,
    )
    _set_model(
        dataset,
        [
            {
                "id": "adam-birth",
                "operation": "literal",
                "year": {"era": "BCE", "year": 4000},
            },
            {
                "id": "seth-birth",
                "operation": "offset_years",
                "input_id": "adam-birth",
                "offset_claim_id": "adam-age-at-seth-lxx",
            },
            {
                "id": "adam-death",
                "operation": "offset_years",
                "input_id": "adam-birth",
                "offset_claim_id": "adam-lifespan",
            },
        ],
        [
            _resolution(
                "adam",
                "adam-birth",
                "adam-death",
                evidence=("adam-lifespan", "adam-age-at-seth-lxx"),
            )
        ],
    )

    result = resolve_model(dataset, "test-model")

    assert result.derivation_values["seth-birth"] == HistoricalYear("BCE", 3770)
    assert result.derivation_values["adam-death"] == HistoricalYear("BCE", 3070)


def test_resolves_midpoint_from_two_input_nodes() -> None:
    dataset = _dataset()
    _set_model(
        dataset,
        [
            {"id": "early", "operation": "literal", "year": {"era": "BCE", "year": 110}},
            {"id": "late", "operation": "literal", "year": {"era": "BCE", "year": 90}},
            {"id": "middle", "operation": "midpoint", "input_ids": ["early", "late"]},
        ],
    )

    result = resolve_model(dataset, "test-model")

    assert result.derivation_values["middle"] == HistoricalYear("BCE", 100)


def test_reports_missing_derivation_input() -> None:
    dataset = _dataset()
    _set_model(
        dataset,
        [
            {
                "id": "seth-birth",
                "operation": "offset_years",
                "input_id": "missing-birth",
                "offset_years": 130,
            }
        ],
    )

    with pytest.raises(ChronologyResolutionError, match="missing-birth"):
        resolve_model(dataset, "test-model")


def test_results_are_independent_of_derivation_record_order() -> None:
    dataset = _dataset()
    nodes = [
        {"id": "adam-birth", "operation": "literal", "year": {"era": "BCE", "year": 4000}},
        {"id": "seth-birth", "operation": "offset_years", "input_id": "adam-birth", "offset_years": 230},
    ]
    _set_model(dataset, nodes)
    forward = resolve_model(dataset, "test-model").derivation_values
    _set_model(dataset, reversed(nodes))
    reverse = resolve_model(dataset, "test-model").derivation_values

    assert dict(forward) == dict(reverse)


def test_cycle_error_contains_complete_ordered_cycle() -> None:
    dataset = _dataset()
    _set_model(
        dataset,
        [
            {"id": "adam-birth", "operation": "offset_years", "input_id": "seth-birth", "offset_years": -130},
            {"id": "seth-birth", "operation": "offset_years", "input_id": "adam-birth", "offset_years": 130},
        ],
    )

    with pytest.raises(ChronologyResolutionError) as caught:
        resolve_model(dataset, "test-model")

    assert caught.value.cycle == ("adam-birth", "seth-birth", "adam-birth")
    assert "adam-birth -> seth-birth -> adam-birth" in str(caught.value)


@pytest.mark.parametrize(
    ("grade", "evidence", "explanation"),
    [
        ("D", ("adam-age-at-seth-lxx",), "Estimated"),
        ("E", (), "Estimated"),
        ("E", ("adam-age-at-seth-lxx",), ""),
    ],
)
def test_editorial_estimate_requires_grade_e_evidence_and_explanation(
    grade: str, evidence: tuple[str, ...], explanation: str
) -> None:
    dataset = _dataset()
    _set_model(
        dataset,
        [
            {"id": "adam-birth", "operation": "literal", "year": {"era": "BCE", "year": 4000}},
            {"id": "adam-death", "operation": "literal", "year": {"era": "BCE", "year": 3070}},
        ],
        [
            _resolution(
                "adam",
                "adam-birth",
                "adam-death",
                basis="editorial_estimate",
                grade=grade,
                evidence=evidence,
                explanation=explanation,
            )
        ],
    )

    with pytest.raises(ChronologyResolutionError, match="editorial estimate"):
        resolve_model(dataset, "test-model")


def test_hybrid_reference_parent_child_lifetimes_are_chronologically_possible() -> None:
    root = Path(__file__).parents[1]
    dataset = load_dataset(root / "data", root / "schemas")
    result = resolve_model(dataset, "hybrid_reference")
    for relationship in dataset.relationships.values():
        if relationship.relationship_type != "parent":
            continue
        parent = result.lifespans.get(relationship.subject_id)
        child = result.lifespans.get(relationship.object_id)
        if parent is not None and child is not None:
            assert parent.birth_year <= child.birth_year <= parent.death_year, relationship.id
