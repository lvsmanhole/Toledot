"""Session-wide cache for ``load_dataset``.

The authored corpus is large and many test modules load it. Records are frozen dataclasses, so each
caller receives a fresh Dataset whose top-level dictionaries are copies (tests may add or replace
entries) while the immutable records themselves are shared. The cache key includes every YAML file's
path, size, and modification time, so edits made during a session are never served stale.
"""

from dataclasses import fields
from pathlib import Path

import bible_timeline.loader as _loader
from bible_timeline.models import Dataset

_original_load_dataset = _loader.load_dataset
_cache: dict[tuple, Dataset] = {}


def _fingerprint(data_root: Path, schema_root: Path) -> tuple:
    files = []
    for root in (Path(data_root), Path(schema_root)):
        for path in sorted(root.rglob("*")):
            if path.is_file():
                stat = path.stat()
                files.append((path.as_posix(), stat.st_size, stat.st_mtime_ns))
    return (Path(data_root).resolve().as_posix(), Path(schema_root).resolve().as_posix(), tuple(files))


def _copy(dataset: Dataset) -> Dataset:
    return Dataset(**{item.name: dict(getattr(dataset, item.name)) for item in fields(Dataset)})


def _cached_load_dataset(data_root: Path, schema_root: Path) -> Dataset:
    key = _fingerprint(data_root, schema_root)
    if key not in _cache:
        _cache[key] = _original_load_dataset(data_root, schema_root)
    return _copy(_cache[key])


_loader.load_dataset = _cached_load_dataset
