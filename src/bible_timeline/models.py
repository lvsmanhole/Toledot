"""Immutable records used by the chronology data pipeline."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Mapping

from .dates import HistoricalYear


@dataclass(frozen=True, slots=True)
class Citation:
    source_id: str
    locator: str
    witness_id: str | None = None
    passage_id: str | None = None
    direct: bool = True
    note: str | None = None


@dataclass(frozen=True, slots=True)
class Work:
    id: str
    names: tuple[str, ...]
    work_type: str
    citations: tuple[Citation, ...]
    notes: str | None = None


@dataclass(frozen=True, slots=True)
class CanonListItem:
    id: str
    label: str
    position: int
    work_id: str | None = None
    resolution_note: str | None = None


@dataclass(frozen=True, slots=True)
class CanonList:
    id: str
    tradition: str
    name: str
    source_id: str
    items: tuple[CanonListItem, ...]


@dataclass(frozen=True, slots=True)
class CanonMembership:
    id: str
    work_id: str
    canon_list_id: str
    source_list_item_id: str
    status: str
    citations: tuple[Citation, ...]
    counting_group: str | None = None


@dataclass(frozen=True, slots=True)
class Witness:
    id: str
    work_id: str
    tradition: str
    language: str
    edition: str
    citations: tuple[Citation, ...]
    manuscript_family: str | None = None
    notes: str | None = None


@dataclass(frozen=True, slots=True)
class Source:
    id: str
    source_type: str
    title: str
    bibliographic_locator: str
    license_status: str
    url: str | None = None
    authors: tuple[str, ...] = ()
    publication_year: int | None = None


@dataclass(frozen=True, slots=True)
class Passage:
    id: str
    work_id: str
    witness_id: str
    locator: str
    citations: tuple[Citation, ...]
    text_excerpt: str | None = None


@dataclass(frozen=True, slots=True)
class CitationMapping:
    id: str
    from_passage_id: str
    to_passage_id: str
    note: str
    citations: tuple[Citation, ...]


@dataclass(frozen=True, slots=True)
class InventoryUnit:
    id: str
    work_id: str
    locator: str
    reviewed: bool
    passage_ids: tuple[str, ...]
    identified_entity_ids: tuple[str, ...]
    event_ids: tuple[str, ...]
    no_individuals: bool
    citations: tuple[Citation, ...]


@dataclass(frozen=True, slots=True)
class Entity:
    id: str
    entity_type: str
    primary_name: str
    aliases: tuple[str, ...]
    classification: str
    citations: tuple[Citation, ...]
    gender: str | None = None
    description: str | None = None
    identity_status: str | None = None


@dataclass(frozen=True, slots=True)
class Relationship:
    id: str
    relationship_type: str
    subject_id: str
    object_id: str
    claim_ids: tuple[str, ...]
    citations: tuple[Citation, ...]
    derived_from: str | None = None


@dataclass(frozen=True, slots=True)
class EventParticipant:
    entity_id: str
    role: str


@dataclass(frozen=True, slots=True)
class Event:
    id: str
    event_type: str
    name: str
    participants: tuple[EventParticipant, ...]
    date_claim_ids: tuple[str, ...]
    citations: tuple[Citation, ...]
    description: str | None = None


@dataclass(frozen=True, slots=True)
class Claim:
    id: str
    subject_id: str
    predicate: str
    value: Mapping[str, Any]
    evidence_type: str
    confidence: str
    citations: tuple[Citation, ...]
    object_id: str | None = None
    witness_id: str | None = None
    interpretation_note: str | None = None


@dataclass(frozen=True, slots=True)
class ChronologyModel:
    id: str
    name: str
    description: str
    derivations: tuple[Mapping[str, Any], ...]
    resolutions: tuple[Mapping[str, Any], ...]
    citations: tuple[Citation, ...]


@dataclass(frozen=True, slots=True)
class YearRange:
    earliest: HistoricalYear
    latest: HistoricalYear

    def __post_init__(self) -> None:
        if self.latest < self.earliest:
            raise ValueError("year range latest boundary precedes earliest boundary")


@dataclass(frozen=True, slots=True)
class ResolvedLifespan:
    entity_id: str
    model_id: str
    birth_year: HistoricalYear
    death_year: HistoricalYear
    birth_range: YearRange | None
    death_range: YearRange | None
    life_basis: str
    confidence_grade: str
    explanation: str
    birth_derivation_id: str
    death_derivation_id: str
    evidence_claim_ids: tuple[str, ...] = ()
    alternative_claim_ids: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class ResolutionResult:
    model_id: str
    derivation_values: Mapping[str, HistoricalYear]
    lifespans: Mapping[str, ResolvedLifespan]


@dataclass(slots=True)
class Dataset:
    works: dict[str, Work] = field(default_factory=dict)
    canon_lists: dict[str, CanonList] = field(default_factory=dict)
    canon_memberships: dict[str, CanonMembership] = field(default_factory=dict)
    witnesses: dict[str, Witness] = field(default_factory=dict)
    sources: dict[str, Source] = field(default_factory=dict)
    passages: dict[str, Passage] = field(default_factory=dict)
    citation_mappings: dict[str, CitationMapping] = field(default_factory=dict)
    inventory_units: dict[str, InventoryUnit] = field(default_factory=dict)
    entities: dict[str, Entity] = field(default_factory=dict)
    relationships: dict[str, Relationship] = field(default_factory=dict)
    events: dict[str, Event] = field(default_factory=dict)
    claims: dict[str, Claim] = field(default_factory=dict)
    chronology_models: dict[str, ChronologyModel] = field(default_factory=dict)
    record_paths: dict[str, Path] = field(default_factory=dict, repr=False)
