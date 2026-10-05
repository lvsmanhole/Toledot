from pathlib import Path
import shutil

import pytest
import yaml

from bible_timeline.loader import StructuralValidationError, load_dataset
from bible_timeline.models import (
    CanonList,
    CanonMembership,
    ChronologyModel,
    CitationMapping,
    Claim,
    Entity,
    Event,
    InventoryUnit,
    Passage,
    Relationship,
    Source,
    Witness,
    Work,
)


FIXTURE_ROOT = Path(__file__).parent / "fixtures" / "minimal_dataset"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def test_loads_every_record_family_as_typed_records() -> None:
    dataset = load_dataset(FIXTURE_ROOT, SCHEMA_ROOT)

    assert isinstance(dataset.works["genesis"], Work)
    assert isinstance(dataset.canon_lists["test-canon"], CanonList)
    assert isinstance(
        dataset.canon_memberships["test-canon-genesis-membership"],
        CanonMembership,
    )
    assert isinstance(dataset.witnesses["lxx-genesis-test"], Witness)
    assert isinstance(dataset.sources["source-genesis"], Source)
    assert isinstance(dataset.passages["genesis-5-3-lxx-test"], Passage)
    assert isinstance(
        dataset.citation_mappings["genesis-5-3-self-map"], CitationMapping
    )
    assert isinstance(dataset.inventory_units["genesis-5-3-review"], InventoryUnit)
    assert isinstance(dataset.entities["adam"], Entity)
    assert isinstance(dataset.relationships["adam-parent-of-seth"], Relationship)
    assert isinstance(dataset.events["birth-of-seth"], Event)
    assert isinstance(dataset.claims["adam-age-at-seth-lxx"], Claim)
    assert isinstance(dataset.chronology_models["test-model"], ChronologyModel)
    assert dataset.events["birth-of-seth"].participants[0].entity_id == "seth"


def test_missing_provenance_reports_file_and_json_pointer(tmp_path: Path) -> None:
    data_root = tmp_path / "data"
    shutil.copytree(FIXTURE_ROOT, data_root)
    claims_path = data_root / "claims.yaml"
    document = yaml.safe_load(claims_path.read_text(encoding="utf-8"))
    del document["records"][0]["citations"]
    claims_path.write_text(yaml.safe_dump(document, sort_keys=False), encoding="utf-8")

    with pytest.raises(StructuralValidationError) as caught:
        load_dataset(data_root, SCHEMA_ROOT)

    assert caught.value.path == claims_path
    assert caught.value.json_pointer == "/records/0"
    assert "citations" in str(caught.value)


def test_duplicate_record_ids_report_both_paths(tmp_path: Path) -> None:
    data_root = tmp_path / "data"
    shutil.copytree(FIXTURE_ROOT, data_root)
    duplicate_path = data_root / "duplicate_entities.yaml"
    duplicate_path.write_text(
        """schema_version: 1
record_type: entities
records:
  - id: adam
    entity_type: human
    primary_name: Another Adam
    aliases: []
    classification: historical_human
    citations:
      - source_id: source-genesis
        locator: duplicate
""",
        encoding="utf-8",
    )

    with pytest.raises(StructuralValidationError) as caught:
        load_dataset(data_root, SCHEMA_ROOT)

    message = str(caught.value)
    assert str(duplicate_path) in message
    assert str(data_root / "entities.yaml") in message
    assert "adam" in message


def test_conflicting_claims_remain_distinct() -> None:
    dataset = load_dataset(FIXTURE_ROOT, SCHEMA_ROOT)

    claims = [
        claim
        for claim in dataset.claims.values()
        if claim.subject_id == "adam" and claim.predicate == "age_at_birth_of"
    ]

    assert {claim.id for claim in claims} == {
        "adam-age-at-seth-lxx",
        "adam-age-at-seth-mt",
    }
    assert {claim.value["value"] for claim in claims} == {130, 230}
