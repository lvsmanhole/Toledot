"""Schema validation and deterministic loading of authored YAML records."""

from __future__ import annotations

from collections.abc import Callable
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator
from referencing import Registry, Resource
import yaml

from .models import (
    CanonList,
    CanonListItem,
    CanonMembership,
    ChronologyModel,
    Citation,
    CitationMapping,
    Claim,
    Dataset,
    Entity,
    Event,
    EventParticipant,
    InventoryUnit,
    Passage,
    Relationship,
    Source,
    Witness,
    Work,
)


class StructuralValidationError(ValueError):
    """A path-aware structural or loading error."""

    def __init__(self, path: Path, json_pointer: str, message: str) -> None:
        self.path = path
        self.json_pointer = json_pointer
        super().__init__(f"{path}:{json_pointer or '/'}: {message}")


def _citations(raw: list[dict[str, Any]]) -> tuple[Citation, ...]:
    return tuple(
        Citation(
            source_id=item["source_id"],
            locator=item["locator"],
            witness_id=item.get("witness_id"),
            passage_id=item.get("passage_id"),
            direct=item.get("direct", True),
            note=item.get("note"),
        )
        for item in raw
    )


def _work(raw: dict[str, Any]) -> Work:
    return Work(
        id=raw["id"],
        names=tuple(raw["names"]),
        work_type=raw["work_type"],
        citations=_citations(raw["citations"]),
        notes=raw.get("notes"),
    )


def _canon_list(raw: dict[str, Any]) -> CanonList:
    return CanonList(
        id=raw["id"],
        tradition=raw["tradition"],
        name=raw["name"],
        source_id=raw["source_id"],
        items=tuple(CanonListItem(**item) for item in raw["items"]),
    )


def _canon_membership(raw: dict[str, Any]) -> CanonMembership:
    return CanonMembership(
        id=raw["id"],
        work_id=raw["work_id"],
        canon_list_id=raw["canon_list_id"],
        source_list_item_id=raw["source_list_item_id"],
        status=raw["status"],
        citations=_citations(raw["citations"]),
        counting_group=raw.get("counting_group"),
    )


def _witness(raw: dict[str, Any]) -> Witness:
    return Witness(
        id=raw["id"],
        work_id=raw["work_id"],
        tradition=raw["tradition"],
        language=raw["language"],
        edition=raw["edition"],
        citations=_citations(raw["citations"]),
        manuscript_family=raw.get("manuscript_family"),
        notes=raw.get("notes"),
    )


def _source(raw: dict[str, Any]) -> Source:
    return Source(
        id=raw["id"],
        source_type=raw["source_type"],
        title=raw["title"],
        bibliographic_locator=raw["bibliographic_locator"],
        license_status=raw["license_status"],
        url=raw.get("url"),
        authors=tuple(raw.get("authors", ())),
        publication_year=raw.get("publication_year"),
    )


def _passage(raw: dict[str, Any]) -> Passage:
    return Passage(
        id=raw["id"],
        work_id=raw["work_id"],
        witness_id=raw["witness_id"],
        locator=raw["locator"],
        citations=_citations(raw["citations"]),
        text_excerpt=raw.get("text_excerpt"),
    )


def _citation_mapping(raw: dict[str, Any]) -> CitationMapping:
    return CitationMapping(
        id=raw["id"],
        from_passage_id=raw["from_passage_id"],
        to_passage_id=raw["to_passage_id"],
        note=raw["note"],
        citations=_citations(raw["citations"]),
    )


def _inventory_unit(raw: dict[str, Any]) -> InventoryUnit:
    return InventoryUnit(
        id=raw["id"],
        work_id=raw["work_id"],
        locator=raw["locator"],
        reviewed=raw["reviewed"],
        passage_ids=tuple(raw["passage_ids"]),
        identified_entity_ids=tuple(raw["identified_entity_ids"]),
        event_ids=tuple(raw["event_ids"]),
        no_individuals=raw["no_individuals"],
        citations=_citations(raw["citations"]),
    )


def _entity(raw: dict[str, Any]) -> Entity:
    return Entity(
        id=raw["id"],
        entity_type=raw["entity_type"],
        primary_name=raw["primary_name"],
        aliases=tuple(raw["aliases"]),
        classification=raw["classification"],
        citations=_citations(raw["citations"]),
        gender=raw.get("gender"),
        description=raw.get("description"),
        identity_status=raw.get("identity_status"),
    )


def _relationship(raw: dict[str, Any]) -> Relationship:
    return Relationship(
        id=raw["id"],
        relationship_type=raw["relationship_type"],
        subject_id=raw["subject_id"],
        object_id=raw["object_id"],
        claim_ids=tuple(raw["claim_ids"]),
        citations=_citations(raw["citations"]),
        derived_from=raw.get("derived_from"),
    )


def _event(raw: dict[str, Any]) -> Event:
    return Event(
        id=raw["id"],
        event_type=raw["event_type"],
        name=raw["name"],
        participants=tuple(EventParticipant(**item) for item in raw["participants"]),
        date_claim_ids=tuple(raw["date_claim_ids"]),
        citations=_citations(raw["citations"]),
        description=raw.get("description"),
    )


def _claim(raw: dict[str, Any]) -> Claim:
    return Claim(
        id=raw["id"],
        subject_id=raw["subject_id"],
        predicate=raw["predicate"],
        value=dict(raw["value"]),
        evidence_type=raw["evidence_type"],
        confidence=raw["confidence"],
        citations=_citations(raw["citations"]),
        object_id=raw.get("object_id"),
        witness_id=raw.get("witness_id"),
        interpretation_note=raw.get("interpretation_note"),
    )


def _chronology_model(raw: dict[str, Any]) -> ChronologyModel:
    return ChronologyModel(
        id=raw["id"],
        name=raw["name"],
        description=raw["description"],
        derivations=tuple(dict(item) for item in raw["derivations"]),
        resolutions=tuple(dict(item) for item in raw["resolutions"]),
        citations=_citations(raw["citations"]),
    )


Builder = Callable[[dict[str, Any]], Any]

_RECORD_CONFIG: dict[str, tuple[str, str, Builder]] = {
    "works": ("work.schema.json", "works", _work),
    "canon_lists": ("canon-list.schema.json", "canon_lists", _canon_list),
    "canon_memberships": (
        "canon-membership.schema.json",
        "canon_memberships",
        _canon_membership,
    ),
    "witnesses": ("witness.schema.json", "witnesses", _witness),
    "sources": ("source.schema.json", "sources", _source),
    "passages": ("passage.schema.json", "passages", _passage),
    "citation_mappings": (
        "citation-mapping.schema.json",
        "citation_mappings",
        _citation_mapping,
    ),
    "inventory_units": ("inventory.schema.json", "inventory_units", _inventory_unit),
    "entities": ("entity.schema.json", "entities", _entity),
    "relationships": ("relationship.schema.json", "relationships", _relationship),
    "events": ("event.schema.json", "events", _event),
    "claims": ("claim.schema.json", "claims", _claim),
    "chronology_models": (
        "chronology-model.schema.json",
        "chronology_models",
        _chronology_model,
    ),
}


# libyaml's C parser is an order of magnitude faster and constructs identical safe types.
_SAFE_LOADER = getattr(yaml, "CSafeLoader", yaml.SafeLoader)


def _pointer(parts: Any) -> str:
    escaped = (str(part).replace("~", "~0").replace("/", "~1") for part in parts)
    return "/" + "/".join(escaped)


def _load_yaml(path: Path) -> dict[str, Any]:
    try:
        document = yaml.load(path.read_text(encoding="utf-8"), Loader=_SAFE_LOADER)
    except (OSError, UnicodeError, yaml.YAMLError) as error:
        raise StructuralValidationError(path, "", str(error)) from error
    if not isinstance(document, dict):
        raise StructuralValidationError(path, "", "document must be a mapping")
    return document


def load_dataset(data_root: Path, schema_root: Path) -> Dataset:
    """Load all YAML records below *data_root* in deterministic path order."""

    common_schema = _load_yaml(schema_root / "common.schema.json")
    registry = Registry().with_resource(
        "common.schema.json", Resource.from_contents(common_schema)
    )
    validators: dict[str, Draft202012Validator] = {}
    dataset = Dataset()
    seen: dict[str, Path] = {}

    for path in sorted(data_root.rglob("*.yaml"), key=lambda item: item.as_posix()):
        document = _load_yaml(path)
        record_type = document.get("record_type")
        if record_type not in _RECORD_CONFIG:
            raise StructuralValidationError(
                path, "/record_type", f"unknown record type {record_type!r}"
            )
        schema_name, dataset_attribute, builder = _RECORD_CONFIG[record_type]
        validator = validators.get(schema_name)
        if validator is None:
            schema = _load_yaml(schema_root / schema_name)
            validator = Draft202012Validator(schema, registry=registry)
            validators[schema_name] = validator
        errors = sorted(validator.iter_errors(document), key=lambda item: list(item.path))
        if errors:
            error = errors[0]
            raise StructuralValidationError(
                path, _pointer(error.absolute_path), error.message
            )

        destination = getattr(dataset, dataset_attribute)
        for index, raw_record in enumerate(document["records"]):
            record_id = raw_record["id"]
            if record_id in seen:
                raise StructuralValidationError(
                    path,
                    f"/records/{index}/id",
                    f"duplicate record id {record_id!r}; first defined in {seen[record_id]}",
                )
            try:
                record = builder(raw_record)
            except (KeyError, TypeError, ValueError) as error:
                raise StructuralValidationError(
                    path, f"/records/{index}", f"could not construct record: {error}"
                ) from error
            destination[record_id] = record
            dataset.record_paths[record_id] = path
            seen[record_id] = path

    return dataset
