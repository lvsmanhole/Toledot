"""Deterministic JSON and SQLite artifact publication."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, fields, is_dataclass
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import tempfile
from types import MappingProxyType
from typing import Any

from .dates import HistoricalYear
from .models import Dataset, ResolutionResult, ResolvedLifespan, YearRange
from .validation import materialize_relationships


@dataclass(frozen=True, slots=True)
class ArtifactManifest:
    schema_version: int
    dataset_hash: str
    artifacts: Mapping[str, Mapping[str, Any]]


def _primitive(value: Any) -> Any:
    if isinstance(value, HistoricalYear):
        return {"era": value.era, "year": value.year}
    if is_dataclass(value):
        return {
            field.name: _primitive(getattr(value, field.name))
            for field in fields(value)
        }
    if isinstance(value, Mapping):
        return {str(key): _primitive(item) for key, item in sorted(value.items())}
    if isinstance(value, (tuple, list)):
        return [_primitive(item) for item in value]
    return value


def _json_bytes(value: Any) -> bytes:
    return (
        json.dumps(
            _primitive(value),
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
            separators=(",", ": "),
        )
        + "\n"
    ).encode("utf-8")


def _families(dataset: Dataset) -> dict[str, list[Any]]:
    return {
        "canon_lists": sorted(dataset.canon_lists.values(), key=lambda item: item.id),
        "canon_memberships": sorted(
            dataset.canon_memberships.values(), key=lambda item: item.id
        ),
        "chronology_models": sorted(
            dataset.chronology_models.values(), key=lambda item: item.id
        ),
        "citation_mappings": sorted(
            dataset.citation_mappings.values(), key=lambda item: item.id
        ),
        "claims": sorted(dataset.claims.values(), key=lambda item: item.id),
        "entities": sorted(dataset.entities.values(), key=lambda item: item.id),
        "events": sorted(dataset.events.values(), key=lambda item: item.id),
        "inventory_units": sorted(
            dataset.inventory_units.values(), key=lambda item: item.id
        ),
        "passages": sorted(dataset.passages.values(), key=lambda item: item.id),
        "relationships": list(materialize_relationships(dataset)),
        "sources": sorted(dataset.sources.values(), key=lambda item: item.id),
        "witnesses": sorted(dataset.witnesses.values(), key=lambda item: item.id),
        "works": sorted(dataset.works.values(), key=lambda item: item.id),
    }


def _range_payload(value: YearRange | None) -> dict[str, Any] | None:
    if value is None:
        return None
    return {
        "earliest": _primitive(value.earliest),
        "latest": _primitive(value.latest),
    }


def _timeline_person(dataset: Dataset, lifespan: ResolvedLifespan) -> dict[str, Any]:
    entity = dataset.entities[lifespan.entity_id]
    return {
        "id": lifespan.entity_id,
        "name": entity.primary_name,
        "birth": _primitive(lifespan.birth_year),
        "death": _primitive(lifespan.death_year),
        "birth_ordinal": lifespan.birth_year.to_ordinal(),
        "death_ordinal": lifespan.death_year.to_ordinal(),
        "birth_range": _range_payload(lifespan.birth_range),
        "death_range": _range_payload(lifespan.death_range),
        "life_basis": lifespan.life_basis,
        "confidence_grade": lifespan.confidence_grade,
        "explanation": lifespan.explanation,
    }


def _create_sqlite(
    path: Path,
    families: Mapping[str, list[Any]],
    resolution: ResolutionResult,
) -> None:
    with sqlite3.connect(path) as connection:
        connection.execute("PRAGMA page_size = 4096")
        connection.execute("PRAGMA journal_mode = OFF")
        connection.execute("PRAGMA synchronous = OFF")
        connection.execute("PRAGMA foreign_keys = ON")
        connection.execute("PRAGMA user_version = 1")
        connection.execute(
            "CREATE TABLE records (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )

        specialized = {
            "claims",
            "entities",
            "events",
            "passages",
            "relationships",
        }
        for family in sorted(families):
            if family in specialized:
                continue
            connection.execute(
                f"CREATE TABLE {family} (id TEXT PRIMARY KEY REFERENCES records(id), payload_json TEXT NOT NULL) WITHOUT ROWID"
            )
        connection.execute(
            "CREATE TABLE entities (id TEXT PRIMARY KEY REFERENCES records(id), entity_type TEXT NOT NULL, primary_name TEXT NOT NULL, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE passages (id TEXT PRIMARY KEY REFERENCES records(id), work_id TEXT NOT NULL REFERENCES works(id), witness_id TEXT NOT NULL REFERENCES witnesses(id), locator TEXT NOT NULL, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE claims (id TEXT PRIMARY KEY REFERENCES records(id), subject_id TEXT NOT NULL REFERENCES records(id), predicate TEXT NOT NULL, witness_id TEXT, value_json TEXT NOT NULL, citations_json TEXT NOT NULL, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE relationships (id TEXT PRIMARY KEY REFERENCES records(id), relationship_type TEXT NOT NULL, subject_id TEXT NOT NULL REFERENCES entities(id), object_id TEXT NOT NULL REFERENCES entities(id), derived_from TEXT, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE events (id TEXT PRIMARY KEY REFERENCES records(id), event_type TEXT NOT NULL, payload_json TEXT NOT NULL) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE event_participants (event_id TEXT NOT NULL REFERENCES events(id), entity_id TEXT NOT NULL REFERENCES entities(id), role TEXT NOT NULL, PRIMARY KEY (event_id, entity_id, role)) WITHOUT ROWID"
        )
        connection.execute(
            "CREATE TABLE citations (record_id TEXT NOT NULL REFERENCES records(id), record_type TEXT NOT NULL, source_id TEXT NOT NULL REFERENCES sources(id), witness_id TEXT, passage_id TEXT, locator TEXT NOT NULL)"
        )
        connection.execute(
            "CREATE TABLE resolved_lifespans (entity_id TEXT NOT NULL REFERENCES entities(id), model_id TEXT NOT NULL REFERENCES chronology_models(id), birth_ordinal INTEGER NOT NULL, death_ordinal INTEGER NOT NULL, payload_json TEXT NOT NULL, PRIMARY KEY (entity_id, model_id)) WITHOUT ROWID"
        )
        connection.execute("PRAGMA defer_foreign_keys = ON")

        for family in sorted(families):
            for record in families[family]:
                payload = _primitive(record)
                payload_json = json.dumps(
                    payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
                )
                connection.execute(
                    "INSERT INTO records (id, record_type, payload_json) VALUES (?, ?, ?)",
                    (record.id, family, payload_json),
                )

        for family in sorted(families):
            for record in families[family]:
                payload = _primitive(record)
                payload_json = json.dumps(
                    payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
                )
                if family == "entities":
                    connection.execute(
                        "INSERT INTO entities VALUES (?, ?, ?, ?)",
                        (record.id, record.entity_type, record.primary_name, payload_json),
                    )
                elif family == "passages":
                    connection.execute(
                        "INSERT INTO passages VALUES (?, ?, ?, ?, ?)",
                        (
                            record.id,
                            record.work_id,
                            record.witness_id,
                            record.locator,
                            payload_json,
                        ),
                    )
                elif family == "claims":
                    connection.execute(
                        "INSERT INTO claims VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (
                            record.id,
                            record.subject_id,
                            record.predicate,
                            record.witness_id,
                            json.dumps(record.value, sort_keys=True, separators=(",", ":")),
                            json.dumps(
                                _primitive(record.citations),
                                sort_keys=True,
                                separators=(",", ":"),
                            ),
                            payload_json,
                        ),
                    )
                elif family == "relationships":
                    connection.execute(
                        "INSERT INTO relationships VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            record.id,
                            record.relationship_type,
                            record.subject_id,
                            record.object_id,
                            record.derived_from,
                            payload_json,
                        ),
                    )
                elif family == "events":
                    connection.execute(
                        "INSERT INTO events VALUES (?, ?, ?)",
                        (record.id, record.event_type, payload_json),
                    )
                    for participant in sorted(
                        record.participants,
                        key=lambda item: (item.entity_id, item.role),
                    ):
                        connection.execute(
                            "INSERT INTO event_participants VALUES (?, ?, ?)",
                            (record.id, participant.entity_id, participant.role),
                        )
                else:
                    connection.execute(
                        f"INSERT INTO {family} VALUES (?, ?)",
                        (record.id, payload_json),
                    )

                for citation in getattr(record, "citations", ()):
                    connection.execute(
                        "INSERT INTO citations (record_id, record_type, source_id, witness_id, passage_id, locator) VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            record.id,
                            family,
                            citation.source_id,
                            citation.witness_id,
                            citation.passage_id,
                            citation.locator,
                        ),
                    )

        for lifespan in sorted(
            resolution.lifespans.values(), key=lambda item: item.entity_id
        ):
            connection.execute(
                "INSERT INTO resolved_lifespans VALUES (?, ?, ?, ?, ?)",
                (
                    lifespan.entity_id,
                    lifespan.model_id,
                    lifespan.birth_year.to_ordinal(),
                    lifespan.death_year.to_ordinal(),
                    json.dumps(
                        _primitive(lifespan),
                        ensure_ascii=False,
                        sort_keys=True,
                        separators=(",", ":"),
                    ),
                ),
            )

        connection.execute("CREATE INDEX idx_claim_subject ON claims(subject_id)")
        connection.execute("CREATE INDEX idx_claim_predicate ON claims(predicate)")
        connection.execute("CREATE INDEX idx_citation_source ON citations(source_id)")
        connection.execute("CREATE INDEX idx_event_type ON events(event_type)")
        connection.execute(
            "CREATE INDEX idx_relationship_subject ON relationships(subject_id)"
        )
        connection.execute(
            "CREATE INDEX idx_relationship_object ON relationships(object_id)"
        )
        connection.execute(
            "CREATE INDEX idx_lifespan_years ON resolved_lifespans(birth_ordinal, death_ordinal)"
        )
        connection.commit()
        integrity = connection.execute("PRAGMA foreign_key_check").fetchall()
        if integrity:
            raise ValueError(f"SQLite foreign-key validation failed: {integrity!r}")
        connection.execute("VACUUM")
    connection.close()


def _sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def publish_artifacts(
    dataset: Dataset, resolution: ResolutionResult, output_dir: Path
) -> ArtifactManifest:
    """Atomically publish deterministic JSON and SQLite artifacts."""

    families = _families(dataset)
    dataset_document = {
        "schema_version": 1,
        "records": {
            family: [_primitive(record) for record in records]
            for family, records in sorted(families.items())
        },
    }
    timeline_document = {
        "schema_version": 1,
        "model_id": resolution.model_id,
        "people": [
            _timeline_person(dataset, lifespan)
            for lifespan in sorted(
                resolution.lifespans.values(), key=lambda item: item.entity_id
            )
        ],
    }
    dataset_bytes = _json_bytes(dataset_document)
    timeline_bytes = _json_bytes(timeline_document)
    dataset_hash = hashlib.sha256(dataset_bytes + b"\0" + timeline_bytes).hexdigest()

    output_dir = Path(output_dir)
    output_dir.parent.mkdir(parents=True, exist_ok=True)
    temporary_dir = Path(
        tempfile.mkdtemp(prefix=f".{output_dir.name}-", dir=output_dir.parent)
    )
    try:
        (temporary_dir / "dataset.json").write_bytes(dataset_bytes)
        (temporary_dir / "timeline.json").write_bytes(timeline_bytes)
        _create_sqlite(temporary_dir / "timeline.sqlite3", families, resolution)

        artifacts = {
            filename: {
                "sha256": _sha256(temporary_dir / filename),
                "size": (temporary_dir / filename).stat().st_size,
            }
            for filename in ("dataset.json", "timeline.json", "timeline.sqlite3")
        }
        manifest = ArtifactManifest(
            schema_version=1,
            dataset_hash=dataset_hash,
            artifacts=MappingProxyType(artifacts),
        )
        (temporary_dir / "manifest.json").write_bytes(_json_bytes(manifest))

        json.loads((temporary_dir / "dataset.json").read_text(encoding="utf-8"))
        json.loads((temporary_dir / "timeline.json").read_text(encoding="utf-8"))
        json.loads((temporary_dir / "manifest.json").read_text(encoding="utf-8"))
        connection = sqlite3.connect(temporary_dir / "timeline.sqlite3")
        try:
            if connection.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise ValueError("SQLite integrity check failed")
        finally:
            connection.close()

        output_dir.mkdir(parents=True, exist_ok=True)
        for filename in (
            "dataset.json",
            "timeline.json",
            "timeline.sqlite3",
            "manifest.json",
        ):
            os.replace(temporary_dir / filename, output_dir / filename)
        return manifest
    finally:
        shutil.rmtree(temporary_dir, ignore_errors=True)
