"""Cross-record semantic checks for authored chronology data."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from .chronology import ChronologyResolutionError, resolve_model
from .dates import HistoricalYear
from .models import Claim, Dataset, Relationship

Severity = Literal["error", "warning"]


@dataclass(frozen=True, slots=True)
class ValidationIssue:
    code: str
    severity: Severity
    record_id: str | None
    message: str


_DIRECTED_INVERSES = {
    "parent": "child",
    "child": "parent",
    "teacher": "disciple",
    "disciple": "teacher",
    "predecessor": "successor",
    "successor": "predecessor",
    "ancestor": "descendant",
    "descendant": "ancestor",
}


def materialize_relationships(dataset: Dataset) -> tuple[Relationship, ...]:
    """Return authored relationships plus generated directed inverses."""

    relationships = list(dataset.relationships.values())
    existing_sources = {
        relationship.derived_from
        for relationship in relationships
        if relationship.derived_from is not None
    }
    for relationship in tuple(relationships):
        inverse_type = _DIRECTED_INVERSES.get(relationship.relationship_type)
        if (
            inverse_type is None
            or relationship.derived_from is not None
            or relationship.id in existing_sources
        ):
            continue
        relationships.append(
            Relationship(
                id=f"{relationship.id}--inverse",
                relationship_type=inverse_type,
                subject_id=relationship.object_id,
                object_id=relationship.subject_id,
                claim_ids=relationship.claim_ids,
                citations=relationship.citations,
                derived_from=relationship.id,
            )
        )
    return tuple(sorted(relationships, key=lambda item: item.id))


def _historical_year(claim: Claim) -> HistoricalYear | None:
    value = claim.value
    if value.get("kind") != "historical_year":
        return None
    era = value.get("era")
    year = value.get("year")
    if era not in ("BCE", "CE") or not isinstance(year, int) or year <= 0:
        return None
    return HistoricalYear(era, year)


def validate_dataset(dataset: Dataset) -> tuple[ValidationIssue, ...]:
    """Return deterministic semantic issues without mutating the dataset."""

    issues: list[ValidationIssue] = []

    def error(code: str, record_id: str | None, message: str) -> None:
        issues.append(ValidationIssue(code, "error", record_id, message))

    collections = (
        dataset.works,
        dataset.canon_lists,
        dataset.canon_memberships,
        dataset.witnesses,
        dataset.sources,
        dataset.passages,
        dataset.citation_mappings,
        dataset.inventory_units,
        dataset.entities,
        dataset.relationships,
        dataset.events,
        dataset.claims,
        dataset.chronology_models,
    )
    record_ids = {record_id for collection in collections for record_id in collection}

    for collection in collections:
        for record in collection.values():
            for citation in getattr(record, "citations", ()):
                if citation.source_id not in dataset.sources:
                    error(
                        "dangling_source",
                        record.id,
                        f"citation references missing source {citation.source_id!r}",
                    )
                if citation.passage_id and citation.passage_id not in dataset.passages:
                    error(
                        "dangling_passage",
                        record.id,
                        f"citation references missing passage {citation.passage_id!r}",
                    )
                if citation.witness_id and citation.witness_id not in dataset.witnesses:
                    error(
                        "dangling_witness",
                        record.id,
                        f"citation references missing witness {citation.witness_id!r}",
                    )

    for canon_list in dataset.canon_lists.values():
        if canon_list.source_id not in dataset.sources:
            error("dangling_source", canon_list.id, "canon list source does not exist")
        for item in canon_list.items:
            if item.work_id and item.work_id not in dataset.works:
                error("dangling_work", canon_list.id, f"item {item.id!r} has no work")

    source_list_items = {
        item.id for canon_list in dataset.canon_lists.values() for item in canon_list.items
    }
    for membership in dataset.canon_memberships.values():
        if membership.work_id not in dataset.works:
            error("dangling_work", membership.id, "membership work does not exist")
        if membership.canon_list_id not in dataset.canon_lists:
            error("dangling_canon_list", membership.id, "canon list does not exist")
        if membership.source_list_item_id not in source_list_items:
            error(
                "dangling_canon_item",
                membership.id,
                "source canon-list item does not exist",
            )

    for witness in dataset.witnesses.values():
        if witness.work_id not in dataset.works:
            error("dangling_work", witness.id, "witness work does not exist")

    for passage in dataset.passages.values():
        if passage.work_id not in dataset.works:
            error("dangling_work", passage.id, "passage work does not exist")
        if passage.witness_id not in dataset.witnesses:
            error("dangling_witness", passage.id, "passage witness does not exist")

    for mapping in dataset.citation_mappings.values():
        for passage_id in (mapping.from_passage_id, mapping.to_passage_id):
            if passage_id not in dataset.passages:
                error("dangling_passage", mapping.id, f"missing passage {passage_id!r}")

    for inventory in dataset.inventory_units.values():
        if inventory.work_id not in dataset.works:
            error("dangling_work", inventory.id, "inventory work does not exist")
        for passage_id in inventory.passage_ids:
            if passage_id not in dataset.passages:
                error("dangling_passage", inventory.id, f"missing passage {passage_id!r}")
        for entity_id in inventory.identified_entity_ids:
            if entity_id not in dataset.entities:
                error("dangling_entity", inventory.id, f"missing entity {entity_id!r}")
        for event_id in inventory.event_ids:
            if event_id not in dataset.events:
                error("dangling_event", inventory.id, f"missing event {event_id!r}")

    for relationship in dataset.relationships.values():
        for entity_id in (relationship.subject_id, relationship.object_id):
            if entity_id not in dataset.entities:
                error("dangling_entity", relationship.id, f"missing entity {entity_id!r}")
        for claim_id in relationship.claim_ids:
            if claim_id not in dataset.claims:
                error("dangling_claim", relationship.id, f"missing claim {claim_id!r}")
        if relationship.derived_from:
            source = dataset.relationships.get(relationship.derived_from)
            if source is None:
                error(
                    "dangling_relationship",
                    relationship.id,
                    "derived relationship source does not exist",
                )
            else:
                expected_type = _DIRECTED_INVERSES.get(source.relationship_type)
                valid = (
                    expected_type == relationship.relationship_type
                    and relationship.subject_id == source.object_id
                    and relationship.object_id == source.subject_id
                )
                if not valid:
                    error(
                        "invalid_inverse_relationship",
                        relationship.id,
                        f"does not invert {source.id!r}",
                    )

    for event in dataset.events.values():
        for participant in event.participants:
            if participant.entity_id not in dataset.entities:
                error("dangling_entity", event.id, f"missing entity {participant.entity_id!r}")
        for claim_id in event.date_claim_ids:
            if claim_id not in dataset.claims:
                error("dangling_claim", event.id, f"missing date claim {claim_id!r}")

    for claim in dataset.claims.values():
        if claim.subject_id not in record_ids:
            error("dangling_subject", claim.id, f"missing subject {claim.subject_id!r}")
        if claim.object_id and claim.object_id not in record_ids:
            error("dangling_object", claim.id, f"missing object {claim.object_id!r}")
        if claim.witness_id and claim.witness_id not in dataset.witnesses:
            error("dangling_witness", claim.id, f"missing witness {claim.witness_id!r}")
        if claim.value.get("kind") == "historical_year" and _historical_year(claim) is None:
            error(
                "invalid_historical_year",
                claim.id,
                "historical year must use BCE or CE and a positive integer year",
            )
        model_id = claim.value.get("chronology_model_id")
        if model_id and model_id not in dataset.chronology_models:
            error("dangling_model", claim.id, f"missing chronology model {model_id!r}")
        entity = dataset.entities.get(claim.subject_id)
        if (
            entity is not None
            and entity.entity_type != "human"
            and claim.predicate in {"birth_year", "death_year", "lifespan"}
        ):
            error(
                "nonhuman_lifespan",
                claim.id,
                f"{entity.entity_type} entities cannot have human lifespan claims",
            )

    for model in dataset.chronology_models.values():
        derivation_ids = {
            node.get("id") for node in model.derivations if isinstance(node.get("id"), str)
        }
        for node in model.derivations:
            input_ids = (*node.get("input_ids", ()), node.get("input_id"))
            for input_id in input_ids:
                if input_id is None:
                    continue
                if input_id not in derivation_ids:
                    error("dangling_derivation", model.id, f"missing input {input_id!r}")
            claim_id = node.get("claim_id") or node.get("offset_claim_id")
            if claim_id and claim_id not in dataset.claims:
                error("dangling_claim", model.id, f"missing claim {claim_id!r}")
        for resolution in model.resolutions:
            entity_id = resolution.get("entity_id")
            if entity_id not in dataset.entities:
                error("dangling_entity", model.id, f"missing entity {entity_id!r}")
            for key in ("birth_derivation_id", "death_derivation_id"):
                derivation_id = resolution.get(key)
                if derivation_id not in derivation_ids:
                    error(
                        "dangling_derivation",
                        model.id,
                        f"missing derivation {derivation_id!r}",
                    )
            for claim_id in resolution.get("evidence_claim_ids", ()):
                if claim_id not in dataset.claims:
                    error("dangling_claim", model.id, f"missing claim {claim_id!r}")
            if (
                resolution.get("life_basis") == "editorial_estimate"
                and not str(resolution.get("explanation", "")).strip()
            ):
                error(
                    "unexplained_editorial_estimate",
                    model.id,
                    f"editorial estimate for {entity_id!r} lacks an explanation",
                )

        try:
            resolve_model(dataset, model.id)
        except ChronologyResolutionError as exc:
            error("invalid_model_resolution", model.id, str(exc))

    explicit_boundaries: dict[str, dict[str, list[HistoricalYear]]] = {}
    for claim in dataset.claims.values():
        if claim.confidence != "A" or claim.evidence_type != "explicit_text":
            continue
        year = _historical_year(claim)
        if year and claim.predicate in {"birth_year", "death_year"}:
            explicit_boundaries.setdefault(claim.subject_id, {}).setdefault(
                claim.predicate, []
            ).append(year)

    for event in dataset.events.values():
        event_years = [
            year
            for claim_id in event.date_claim_ids
            if (claim := dataset.claims.get(claim_id)) is not None
            and claim.confidence == "A"
            and (year := _historical_year(claim)) is not None
        ]
        for participant in event.participants:
            boundaries = explicit_boundaries.get(participant.entity_id, {})
            births = boundaries.get("birth_year", [])
            deaths = boundaries.get("death_year", [])
            for event_year in event_years:
                before_every_birth = bool(births) and all(event_year < birth for birth in births)
                after_every_death = bool(deaths) and all(death < event_year for death in deaths)
                if before_every_birth or after_every_death:
                    error(
                        "event_outside_lifespan",
                        event.id,
                        f"event lies outside explicit lifespan of {participant.entity_id!r}",
                    )

    severity_order = {"error": 0, "warning": 1}
    return tuple(
        sorted(
            issues,
            key=lambda issue: (
                severity_order[issue.severity],
                issue.code,
                issue.record_id or "",
                issue.message,
            ),
        )
    )
