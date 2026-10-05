from dataclasses import replace
import json
from pathlib import Path
import sqlite3

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.publish import publish_artifacts


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "minimal_dataset"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def _dataset_and_resolution():
    dataset = load_dataset(FIXTURE_ROOT, SCHEMA_ROOT)
    dataset.chronology_models["test-model"] = replace(
        dataset.chronology_models["test-model"],
        derivations=(
            {
                "id": "adam-birth",
                "operation": "literal",
                "year": {"era": "BCE", "year": 4000},
            },
            {
                "id": "adam-death",
                "operation": "literal",
                "year": {"era": "BCE", "year": 3070},
            },
        ),
        resolutions=(
            {
                "entity_id": "adam",
                "birth_derivation_id": "adam-birth",
                "death_derivation_id": "adam-death",
                "life_basis": "calculated",
                "confidence_grade": "B",
                "evidence_claim_ids": ["adam-age-at-seth-lxx"],
                "alternative_claim_ids": ["adam-age-at-seth-mt"],
                "explanation": "Fixture chronology",
            },
        ),
    )
    return dataset, resolve_model(dataset, "test-model")


def test_json_publication_is_byte_for_byte_reproducible(tmp_path: Path) -> None:
    dataset, resolution = _dataset_and_resolution()
    first = tmp_path / "first"
    second = tmp_path / "second"

    publish_artifacts(dataset, resolution, first)
    publish_artifacts(dataset, resolution, second)

    for filename in ("dataset.json", "timeline.json", "manifest.json"):
        assert (first / filename).read_bytes() == (second / filename).read_bytes()


def test_json_and_sqlite_record_counts_match(tmp_path: Path) -> None:
    dataset, resolution = _dataset_and_resolution()
    output = tmp_path / "output"
    publish_artifacts(dataset, resolution, output)
    document = json.loads((output / "dataset.json").read_text(encoding="utf-8"))

    with sqlite3.connect(output / "timeline.sqlite3") as connection:
        for family, records in document["records"].items():
            count = connection.execute(f"SELECT COUNT(*) FROM {family}").fetchone()[0]
            assert count == len(records), family
        assert connection.execute("PRAGMA foreign_key_check").fetchall() == []


def test_compact_timeline_contains_consumer_fields(tmp_path: Path) -> None:
    dataset, resolution = _dataset_and_resolution()
    output = tmp_path / "output"
    publish_artifacts(dataset, resolution, output)

    timeline = json.loads((output / "timeline.json").read_text(encoding="utf-8"))

    assert timeline["schema_version"] == 1
    assert timeline["model_id"] == "test-model"
    assert timeline["people"] == [
        {
            "id": "adam",
            "name": "Adam",
            "birth": {"era": "BCE", "year": 4000},
            "death": {"era": "BCE", "year": 3070},
            "birth_ordinal": -3999,
            "death_ordinal": -3069,
            "birth_range": {
                "earliest": {"era": "BCE", "year": 4000},
                "latest": {"era": "BCE", "year": 4000},
            },
            "death_range": {
                "earliest": {"era": "BCE", "year": 3070},
                "latest": {"era": "BCE", "year": 3070},
            },
            "life_basis": "calculated",
            "confidence_grade": "B",
            "explanation": "Fixture chronology",
        }
    ]


def test_manifest_has_stable_hash_and_no_wall_clock_fields(tmp_path: Path) -> None:
    dataset, resolution = _dataset_and_resolution()
    output = tmp_path / "output"

    result = publish_artifacts(dataset, resolution, output)
    manifest_text = (output / "manifest.json").read_text(encoding="utf-8")
    manifest = json.loads(manifest_text)

    assert result.schema_version == 1
    assert result.dataset_hash == manifest["dataset_hash"]
    assert len(result.dataset_hash) == 64
    assert set(manifest["artifacts"]) == {
        "dataset.json",
        "timeline.json",
        "timeline.sqlite3",
    }
    assert "timestamp" not in manifest_text
    assert "generated_at" not in manifest_text
    assert "build_time" not in manifest_text


def test_conflicting_claims_round_trip_without_collapse(tmp_path: Path) -> None:
    dataset, resolution = _dataset_and_resolution()
    output = tmp_path / "output"
    publish_artifacts(dataset, resolution, output)

    document = json.loads((output / "dataset.json").read_text(encoding="utf-8"))
    claims = {
        claim["id"]: claim
        for claim in document["records"]["claims"]
        if claim["predicate"] == "age_at_birth_of"
    }

    assert set(claims) == {"adam-age-at-seth-lxx", "adam-age-at-seth-mt"}
    assert {claim["value"]["value"] for claim in claims.values()} == {130, 230}
    assert all(claim["citations"] for claim in claims.values())
    assert all(claim["witness_id"] for claim in claims.values())

    with sqlite3.connect(output / "timeline.sqlite3") as connection:
        rows = connection.execute(
            "SELECT id, value_json, citations_json, witness_id "
            "FROM claims WHERE predicate = ? ORDER BY id",
            ("age_at_birth_of",),
        ).fetchall()

    assert {row[0] for row in rows} == set(claims)
    assert {json.loads(row[1])["value"] for row in rows} == {130, 230}
    assert all(json.loads(row[2]) for row in rows)
    assert all(row[3] for row in rows)
