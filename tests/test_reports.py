import json
from pathlib import Path

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset
from bible_timeline.reports import build_reports, write_reports


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"


def _reports():
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    return dataset, build_reports(dataset, resolve_model(dataset, "hybrid_reference"))


def test_provenance_traces_each_selected_boundary_to_derivation_and_claim_sources() -> None:
    dataset, reports = _reports()
    entries = {entry["entity_id"]: entry for entry in reports["provenance"]["people"]}
    assert set(entries) == set(resolve_model(dataset, "hybrid_reference").lifespans)
    for entry in entries.values():
        for boundary in (entry["birth"], entry["death"]):
            assert boundary["derivation_id"]
            assert boundary["year"]
        assert entry["evidence_claims"]
        assert all(claim["citations"] for claim in entry["evidence_claims"])


def test_conflicts_preserve_unresolved_witness_variants_without_structural_error() -> None:
    _, reports = _reports()
    groups = reports["conflicts"]["groups"]
    adam_seth = next(group for group in groups if group["subject_id"] == "adam" and group["object_id"] == "seth")
    assert adam_seth["status"] == "unresolved_variant"
    assert {claim["witness_id"] for claim in adam_seth["claims"]} == {
        "lxx-genesis-goettingen", "mt-genesis-bhs", "sp-genesis-schorch"
    }
    assert "error" not in adam_seth


def test_coverage_reports_every_genesis_unit_reviewed() -> None:
    dataset, reports = _reports()
    genesis_units = [unit for unit in dataset.inventory_units.values() if unit.work_id == "genesis"]
    coverage = reports["coverage"]
    assert coverage["genesis"]["total_units"] == len(genesis_units)
    assert coverage["genesis"]["reviewed_units"] == len(genesis_units)
    assert coverage["genesis"]["chapters_reviewed"] == list(range(1, 51))
    assert coverage["genesis"]["complete"] is True


def test_write_reports_creates_deterministic_json_files(tmp_path: Path) -> None:
    dataset = load_dataset(DATA_ROOT, SCHEMA_ROOT)
    resolution = resolve_model(dataset, "hybrid_reference")
    first = tmp_path / "first"
    second = tmp_path / "second"
    write_reports(dataset, resolution, first)
    write_reports(dataset, resolution, second)
    for filename in ("provenance.json", "conflicts.json", "coverage.json", "validation.json"):
        assert json.loads((first / filename).read_text(encoding="utf-8"))
        assert (first / filename).read_bytes() == (second / filename).read_bytes()
