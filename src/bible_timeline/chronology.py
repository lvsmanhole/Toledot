"""Resolve named chronology models through an acyclic derivation graph."""

from __future__ import annotations

from types import MappingProxyType
from typing import Any

from .dates import HistoricalYear, add_years
from .models import Dataset, ResolutionResult, ResolvedLifespan, YearRange


class ChronologyResolutionError(ValueError):
    """Raised when a chronology model cannot be resolved completely."""

    def __init__(self, message: str, *, cycle: tuple[str, ...] = ()) -> None:
        self.cycle = cycle
        super().__init__(message)


def _year(raw: Any, context: str) -> HistoricalYear:
    if not isinstance(raw, dict):
        raise ChronologyResolutionError(f"{context} must contain a year mapping")
    try:
        return HistoricalYear(raw["era"], raw["year"])
    except (KeyError, TypeError, ValueError) as error:
        raise ChronologyResolutionError(f"invalid year in {context}: {error}") from error


def resolve_model(dataset: Dataset, model_id: str) -> ResolutionResult:
    """Resolve all derivations and lifespans in one chronology model."""

    model = dataset.chronology_models.get(model_id)
    if model is None:
        raise ChronologyResolutionError(f"unknown chronology model {model_id!r}")

    nodes: dict[str, dict[str, Any]] = {}
    for raw_node in model.derivations:
        node = dict(raw_node)
        node_id = node.get("id")
        if not isinstance(node_id, str) or not node_id:
            raise ChronologyResolutionError("every derivation requires a non-empty id")
        if node_id in nodes:
            raise ChronologyResolutionError(f"duplicate derivation id {node_id!r}")
        nodes[node_id] = node

    values: dict[str, HistoricalYear] = {}
    active: list[str] = []

    def resolve(node_id: str) -> HistoricalYear:
        if node_id in values:
            return values[node_id]
        if node_id in active:
            cycle_start = active.index(node_id)
            cycle = tuple(active[cycle_start:] + [node_id])
            raise ChronologyResolutionError(
                f"circular chronology derivation: {' -> '.join(cycle)}", cycle=cycle
            )
        node = nodes.get(node_id)
        if node is None:
            raise ChronologyResolutionError(f"missing derivation input {node_id!r}")

        active.append(node_id)
        try:
            operation = node.get("operation")
            if operation == "literal":
                value = _year(node.get("year"), node_id)
            elif operation == "select_claim":
                claim_id = node.get("claim_id")
                claim = dataset.claims.get(claim_id)
                if claim is None:
                    raise ChronologyResolutionError(
                        f"derivation {node_id!r} references missing claim {claim_id!r}"
                    )
                value = _year(dict(claim.value), f"claim {claim_id!r}")
            elif operation == "offset_years":
                input_id = node.get("input_id")
                if not isinstance(input_id, str):
                    raise ChronologyResolutionError(
                        f"derivation {node_id!r} requires input_id"
                    )
                base = resolve(input_id)
                if "offset_claim_id" in node:
                    claim_id = node["offset_claim_id"]
                    claim = dataset.claims.get(claim_id)
                    if claim is None:
                        raise ChronologyResolutionError(
                            f"derivation {node_id!r} references missing claim {claim_id!r}"
                        )
                    if claim.value.get("kind") != "duration" or claim.value.get("unit") != "years":
                        raise ChronologyResolutionError(
                            f"claim {claim_id!r} is not a duration in years"
                        )
                    offset = claim.value.get("value")
                else:
                    offset = node.get("offset_years")
                if not isinstance(offset, int):
                    raise ChronologyResolutionError(
                        f"derivation {node_id!r} requires an integer year offset"
                    )
                value = add_years(base, offset)
            elif operation == "midpoint":
                input_ids = node.get("input_ids")
                if not isinstance(input_ids, list) or len(input_ids) != 2:
                    raise ChronologyResolutionError(
                        f"derivation {node_id!r} requires exactly two input_ids"
                    )
                left, right = (resolve(input_id).to_ordinal() for input_id in input_ids)
                value = HistoricalYear.from_ordinal((left + right) // 2)
            else:
                raise ChronologyResolutionError(
                    f"derivation {node_id!r} has unsupported operation {operation!r}"
                )
            values[node_id] = value
            return value
        finally:
            active.pop()

    for node_id in sorted(nodes):
        resolve(node_id)

    lifespans: dict[str, ResolvedLifespan] = {}
    for raw_resolution in sorted(
        model.resolutions, key=lambda item: str(item.get("entity_id", ""))
    ):
        resolution = dict(raw_resolution)
        entity_id = resolution.get("entity_id")
        entity = dataset.entities.get(entity_id)
        if entity is None:
            raise ChronologyResolutionError(
                f"resolution references missing entity {entity_id!r}"
            )
        if entity.entity_type != "human":
            raise ChronologyResolutionError(
                f"resolution for {entity_id!r} is not a human lifespan"
            )
        if entity_id in lifespans:
            raise ChronologyResolutionError(f"duplicate resolution for {entity_id!r}")

        birth_id = resolution.get("birth_derivation_id")
        death_id = resolution.get("death_derivation_id")
        if not isinstance(birth_id, str) or not isinstance(death_id, str):
            raise ChronologyResolutionError(
                f"resolution for {entity_id!r} requires birth and death derivations"
            )
        birth = resolve(birth_id)
        death = resolve(death_id)
        if death < birth:
            raise ChronologyResolutionError(
                f"death precedes birth for {entity_id!r} in {model_id!r}"
            )

        basis = resolution.get("life_basis")
        grade = resolution.get("confidence_grade")
        evidence = tuple(resolution.get("evidence_claim_ids", ()))
        alternatives = tuple(resolution.get("alternative_claim_ids", ()))
        explanation = str(resolution.get("explanation", "")).strip()
        missing_evidence = [claim_id for claim_id in evidence if claim_id not in dataset.claims]
        missing_alternatives = [
            claim_id for claim_id in alternatives if claim_id not in dataset.claims
        ]
        if missing_evidence or missing_alternatives:
            missing = missing_evidence + missing_alternatives
            raise ChronologyResolutionError(
                f"resolution for {entity_id!r} references missing claims {missing!r}"
            )
        if not evidence:
            policy = "editorial estimate" if basis == "editorial_estimate" else "resolution"
            raise ChronologyResolutionError(f"{policy} for {entity_id!r} requires evidence")
        if not explanation:
            policy = "editorial estimate" if basis == "editorial_estimate" else "resolution"
            raise ChronologyResolutionError(
                f"{policy} for {entity_id!r} requires a non-empty explanation"
            )
        if basis == "editorial_estimate" and grade != "E":
            raise ChronologyResolutionError(
                f"editorial estimate for {entity_id!r} requires confidence grade E"
            )

        def year_range(prefix: str, selected: HistoricalYear) -> YearRange | None:
            ids = resolution.get(f"{prefix}_range_derivation_ids")
            if ids is None:
                return YearRange(selected, selected) if grade in {"A", "B"} else None
            if not isinstance(ids, list) or len(ids) != 2:
                raise ChronologyResolutionError(
                    f"{prefix} range for {entity_id!r} requires two derivations"
                )
            return YearRange(resolve(ids[0]), resolve(ids[1]))

        lifespans[entity_id] = ResolvedLifespan(
            entity_id=entity_id,
            model_id=model_id,
            birth_year=birth,
            death_year=death,
            birth_range=year_range("birth", birth),
            death_range=year_range("death", death),
            life_basis=basis,
            confidence_grade=grade,
            explanation=explanation,
            birth_derivation_id=birth_id,
            death_derivation_id=death_id,
            evidence_claim_ids=evidence,
            alternative_claim_ids=alternatives,
        )

    return ResolutionResult(
        model_id=model_id,
        derivation_values=MappingProxyType(dict(sorted(values.items()))),
        lifespans=MappingProxyType(dict(sorted(lifespans.items()))),
    )
