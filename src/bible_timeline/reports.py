"""Deterministic audit reports for chronology data and model selections."""

from __future__ import annotations

from dataclasses import asdict
import json
from pathlib import Path
import re
from typing import Any

from .models import Citation, Dataset, ResolutionResult
from .validation import validate_dataset


def _citation(citation: Citation) -> dict[str, Any]:
    return {key: value for key, value in asdict(citation).items() if value is not None}


def _year(year: Any) -> dict[str, Any]:
    return {"era": year.era, "year": year.year}


def _provenance(dataset: Dataset, resolution: ResolutionResult) -> dict[str, Any]:
    people = []
    for lifespan in sorted(resolution.lifespans.values(), key=lambda item: item.entity_id):
        evidence = []
        for claim_id in lifespan.evidence_claim_ids:
            claim = dataset.claims[claim_id]
            evidence.append(
                {
                    "claim_id": claim.id,
                    "subject_id": claim.subject_id,
                    "predicate": claim.predicate,
                    "value": dict(claim.value),
                    "evidence_type": claim.evidence_type,
                    "confidence": claim.confidence,
                    "witness_id": claim.witness_id,
                    "citations": [_citation(item) for item in claim.citations],
                }
            )
        people.append(
            {
                "entity_id": lifespan.entity_id,
                "name": dataset.entities[lifespan.entity_id].primary_name,
                "model_id": lifespan.model_id,
                "birth": {
                    "year": _year(lifespan.birth_year),
                    "derivation_id": lifespan.birth_derivation_id,
                },
                "death": {
                    "year": _year(lifespan.death_year),
                    "derivation_id": lifespan.death_derivation_id,
                },
                "life_basis": lifespan.life_basis,
                "confidence_grade": lifespan.confidence_grade,
                "explanation": lifespan.explanation,
                "evidence_claims": evidence,
                "alternative_claim_ids": list(lifespan.alternative_claim_ids),
            }
        )
    return {"schema_version": 1, "model_id": resolution.model_id, "people": people}


def _conflicts(dataset: Dataset) -> dict[str, Any]:
    grouped: dict[tuple[str, str, str | None], list[Any]] = {}
    for claim in dataset.claims.values():
        grouped.setdefault((claim.subject_id, claim.predicate, claim.object_id), []).append(claim)

    conflicts = []
    for (subject_id, predicate, object_id), claims in sorted(grouped.items()):
        values = {
            json.dumps(dict(claim.value), ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            for claim in claims
        }
        witnesses = {claim.witness_id for claim in claims if claim.witness_id}
        if len(values) < 2 or len(witnesses) < 2:
            continue
        conflicts.append(
            {
                "subject_id": subject_id,
                "predicate": predicate,
                "object_id": object_id,
                "status": "unresolved_variant",
                "claims": [
                    {
                        "id": claim.id,
                        "value": dict(claim.value),
                        "witness_id": claim.witness_id,
                        "confidence": claim.confidence,
                        "citations": [_citation(item) for item in claim.citations],
                    }
                    for claim in sorted(claims, key=lambda item: item.id)
                ],
            }
        )
    return {"schema_version": 1, "groups": conflicts}


def _chapters(locator: str) -> set[int]:
    match = re.fullmatch(r"Genesis (\d+)(?::(\d+))?(?:-(?:(\d+):(\d+)|(\d+)))?", locator)
    if match is None:
        return set()
    start = int(match.group(1))
    # A bare range after a verse locator is a verse range; without a verse it
    # denotes chapters. A chapter:verse endpoint is always cross-chapter.
    end = int(match.group(3) or (match.group(5) if match.group(2) is None else None) or start)
    return set(range(start, end + 1))


def _coverage(dataset: Dataset) -> dict[str, Any]:
    units = sorted(
        (unit for unit in dataset.inventory_units.values() if unit.work_id == "genesis"),
        key=lambda item: item.id,
    )
    reviewed_chapters = sorted(
        {
            chapter
            for unit in units
            if unit.reviewed
            for chapter in _chapters(unit.locator)
        }
    )
    reviewed = sum(unit.reviewed for unit in units)
    return {
        "schema_version": 1,
        "genesis": {
            "total_units": len(units),
            "reviewed_units": reviewed,
            "chapters_reviewed": reviewed_chapters,
            "complete": reviewed == len(units) and reviewed_chapters == list(range(1, 51)),
            "units": [
                {
                    "id": unit.id,
                    "locator": unit.locator,
                    "reviewed": unit.reviewed,
                    "passage_ids": list(unit.passage_ids),
                    "identified_entity_ids": list(unit.identified_entity_ids),
                    "no_individuals": unit.no_individuals,
                }
                for unit in units
            ],
        },
    }


def _validation(dataset: Dataset) -> dict[str, Any]:
    issues = validate_dataset(dataset)
    return {
        "schema_version": 1,
        "summary": {
            "errors": sum(issue.severity == "error" for issue in issues),
            "warnings": sum(issue.severity == "warning" for issue in issues),
        },
        "issues": [asdict(issue) for issue in issues],
    }


def build_reports(dataset: Dataset, resolution: ResolutionResult) -> dict[str, Any]:
    """Build all audit reports as JSON-compatible mappings."""

    return {
        "provenance": _provenance(dataset, resolution),
        "conflicts": _conflicts(dataset),
        "coverage": _coverage(dataset),
        "validation": _validation(dataset),
    }


def write_reports(dataset: Dataset, resolution: ResolutionResult, output_dir: Path) -> None:
    """Write all audit reports with stable ordering and formatting."""

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, report in build_reports(dataset, resolution).items():
        payload = json.dumps(
            report,
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
            separators=(",", ": "),
        ) + "\n"
        (output_dir / f"{name}.json").write_text(payload, encoding="utf-8", newline="\n")
