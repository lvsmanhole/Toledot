from pathlib import Path

from bible_timeline.cli import main


def test_validate_strict_returns_zero_for_production_data(capsys) -> None:
    assert main(["validate", "--strict"]) == 0
    assert "0 error" in capsys.readouterr().out


def test_build_creates_all_artifacts(tmp_path: Path) -> None:
    output = tmp_path / "build"
    assert main(["build", "--output", str(output)]) == 0
    assert {path.name for path in output.iterdir()} == {
        "dataset.json", "timeline.json", "timeline.sqlite3", "manifest.json"
    }


def test_report_creates_all_audit_reports(tmp_path: Path) -> None:
    output = tmp_path / "reports"
    assert main(["report", "--output", str(output)]) == 0
    assert {path.name for path in output.iterdir()} == {
        "provenance.json", "conflicts.json", "coverage.json", "validation.json"
    }
