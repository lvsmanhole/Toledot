"""Command-line orchestration for validation, publication, and audits."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Sequence

from .chronology import resolve_model
from .loader import StructuralValidationError, load_dataset
from .publish import publish_artifacts
from .reports import write_reports
from .site import write_site_bundle
from .validation import validate_dataset


PROJECT_ROOT = Path(__file__).resolve().parents[2]


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="bible-timeline")
    parser.add_argument("--data", type=Path, default=PROJECT_ROOT / "data")
    parser.add_argument("--schemas", type=Path, default=PROJECT_ROOT / "schemas")
    subparsers = parser.add_subparsers(dest="command", required=True)

    validate = subparsers.add_parser("validate", help="validate authored data")
    validate.add_argument("--strict", action="store_true")
    validate.add_argument("--warnings-as-errors", action="store_true")

    build = subparsers.add_parser("build", help="build JSON and SQLite artifacts")
    build.add_argument("--output", type=Path, required=True)
    build.add_argument("--model", default="hybrid_reference")

    report = subparsers.add_parser("report", help="write audit reports")
    report.add_argument("--output", type=Path, required=True)
    report.add_argument("--model", default="hybrid_reference")

    site = subparsers.add_parser("site", help="write the website data bundle")
    site.add_argument("--output", type=Path, default=PROJECT_ROOT / "site" / "data")
    site.add_argument("--model", default="hybrid_reference")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    args = _parser().parse_args(argv)
    try:
        dataset = load_dataset(args.data, args.schemas)
    except StructuralValidationError as error:
        print(f"structural validation failed: {error}")
        return 2

    issues = validate_dataset(dataset)
    errors = [issue for issue in issues if issue.severity == "error"]
    warnings = [issue for issue in issues if issue.severity == "warning"]

    if args.command == "validate":
        for issue in issues:
            print(f"{issue.severity}: {issue.code}: {issue.record_id or '-'}: {issue.message}")
        print(f"{len(errors)} error(s), {len(warnings)} warning(s)")
        if errors or (args.warnings_as_errors and warnings):
            return 1
        return 0

    if errors:
        print(f"build blocked by {len(errors)} validation error(s)")
        return 1

    resolution = resolve_model(dataset, args.model)
    if args.command == "build":
        manifest = publish_artifacts(dataset, resolution, args.output)
        print(f"built {len(manifest.artifacts) + 1} artifacts in {args.output}")
    elif args.command == "site":
        write_site_bundle(dataset, resolution, args.output)
        print(f"wrote site bundle in {args.output}")
    else:
        write_reports(dataset, resolution, args.output)
        print(f"wrote 4 reports in {args.output}")
    return 0
