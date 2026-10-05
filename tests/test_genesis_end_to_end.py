import json
from pathlib import Path
import sqlite3

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.publish import publish_artifacts
from bible_timeline.validation import validate_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_genesis_data_foundation_milestone(tmp_path: Path) -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    assert not [issue for issue in validate_dataset(dataset) if issue.severity == "error"]
    resolution = resolve_model(dataset, "hybrid_reference")

    reviewed_chapters = set()
    for unit in dataset.inventory_units.values():
        if unit.work_id != "genesis" or not unit.reviewed:
            continue
        chapter = int(unit.locator.removeprefix("Genesis ").split(":")[0].split("-")[0])
        reviewed_chapters.add(chapter)
    assert reviewed_chapters == set(range(1, 51))

    human_ids = {entity.id for entity in dataset.entities.values() if entity.entity_type == "human"}
    assert human_ids <= set(resolution.lifespans)
    inventoried_ids = {
        entity_id
        for unit in dataset.inventory_units.values()
        if unit.work_id == "genesis"
        for entity_id in unit.identified_entity_ids
    }
    assert human_ids <= inventoried_ids
    for lifespan in resolution.lifespans.values():
        assert lifespan.birth_year <= lifespan.death_year
        assert lifespan.evidence_claim_ids and lifespan.explanation
        if lifespan.life_basis == "editorial_estimate":
            assert lifespan.confidence_grade == "E"

    first = tmp_path / "first"
    second = tmp_path / "second"
    publish_artifacts(dataset, resolution, first)
    publish_artifacts(dataset, resolution, second)
    for filename in ("dataset.json", "timeline.json", "timeline.sqlite3", "manifest.json"):
        assert (first / filename).read_bytes() == (second / filename).read_bytes()

    document = json.loads((first / "dataset.json").read_text(encoding="utf-8"))
    with sqlite3.connect(first / "timeline.sqlite3") as connection:
        for family, records in document["records"].items():
            assert connection.execute(f"SELECT COUNT(*) FROM {family}").fetchone()[0] == len(records)
        assert connection.execute("SELECT COUNT(*) FROM resolved_lifespans").fetchone()[0] == len(resolution.lifespans)
