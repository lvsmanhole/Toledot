"""Compact JSON bundle consumed by the static timeline website (``site/``).

Two files are written:

``core.json``
    Everything the timeline needs for first paint: books with their chapters, people with display years and
    confidence grades, events with a display year and how that year was obtained.
``details.json``
    Per-person and per-event provenance loaded after first paint: claims with citations and witnesses,
    family links, chapter appearances, original-language name forms, and the witness/source catalog.

Years are astronomical (1 BCE = 0, 2 BCE = -1), matching ``HistoricalYear.to_ordinal``. Every display year
carries how it was obtained so the site can keep text-anchored and editorial placements visibly apart.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import asdict
import json
from pathlib import Path
import re
import statistics
from typing import Any

from .models import Citation, Claim, Dataset, ResolutionResult


SITE_SCHEMA_VERSION = 1
GOSPELS = ("Matthew", "Mark", "Luke", "John")
ADULT_AGE = 25

# Display sections: (key, label, canon list supplying order, filter on work ids)
_SECTION_ORDER = (
    ("ot", "Old Testament"),
    ("dc", "Deuterocanon & Septuagint"),
    ("eth", "Ethiopian Old Testament"),
    ("nt", "New Testament"),
    ("eth-nt", "Ethiopian broader New Testament"),
)


def _ordinal(year: Any) -> int:
    return year.to_ordinal()


def _cite(citation: Citation) -> dict[str, Any]:
    return {key: value for key, value in asdict(citation).items() if value is not None and key != "direct"} | (
        {} if citation.direct else {"direct": False}
    )


def _claim(claim: Claim) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "id": claim.id,
        "predicate": claim.predicate,
        "value": dict(claim.value),
        "evidence": claim.evidence_type,
        "confidence": claim.confidence,
        "citations": [_cite(item) for item in claim.citations],
    }
    if claim.object_id:
        payload["object"] = claim.object_id
    if claim.witness_id:
        payload["witness"] = claim.witness_id
    if claim.interpretation_note:
        payload["note"] = claim.interpretation_note
    return payload


def _unit_position(locator: str) -> tuple[int, int, str] | None:
    """(chapter, first verse, short label) for 'Book 12' or 'Book 1:1-2:3'; None for book-level locators."""
    match = re.fullmatch(r"(.*\S) (\d+)(?::(\d+)(\S*))?", locator)
    if match is None:
        return None
    chapter, verse = int(match.group(2)), int(match.group(3) or 0)
    short = f"{chapter}:{verse}{match.group(4)}" if match.group(3) else str(chapter)
    return chapter, verse, short


def _shared_window(spans: list[tuple[int, int]]) -> tuple[int, int] | None:
    """Years during which the most people of a set are alive together; the latest such run wins ties,
    so retrospective mentions (an ancestor named in a genealogy) do not pull the window back."""
    if not spans:
        return None
    best_year, best_count = None, -1
    for year in sorted({year for span in spans for year in span}):
        count = sum(start <= year <= end for start, end in spans)
        if count >= best_count:
            best_year, best_count = year, count
    alive = [(s, e) for s, e in spans if s <= best_year <= e]
    return max(s for s, e in alive), min(e for s, e in alive)


def _setting_year(spans: list[tuple[int, int]]) -> int | None:
    window = _shared_window(spans)
    return None if window is None else (window[0] + window[1]) // 2


def _sections(dataset: Dataset) -> list[tuple[str, str, list[str]]]:
    lists = dataset.canon_lists
    protestant = [item.work_id for item in lists["protestant-66"].items if item.work_id]
    nt_start = protestant.index("matthew")
    ot, nt = protestant[:nt_start], protestant[nt_start:]
    seen = set(protestant)
    dc = [item.work_id for item in lists["septuagint-rahlfs-hanhart"].items if item.work_id and item.work_id not in seen]
    seen |= set(dc)
    broader = {item.work_id for item in lists["ethiopian-broader"].items if item.work_id}
    eth = [item.work_id for item in lists["ethiopian-official-81"].items
           if item.work_id and item.work_id not in seen and item.work_id not in broader]
    seen |= set(eth) | broader
    eth += sorted(work_id for work_id in dataset.works if work_id not in seen)
    eth_nt = [item.work_id for item in lists["ethiopian-broader"].items if item.work_id]
    groups = {"ot": ot, "dc": dc, "eth": eth, "nt": nt, "eth-nt": eth_nt}
    return [(key, label, groups[key]) for key, label in _SECTION_ORDER]


def build_site_bundle(dataset: Dataset, resolution: ResolutionResult) -> tuple[dict[str, Any], dict[str, Any]]:
    """Return ``(core, details)`` JSON-compatible mappings."""

    lifespans = resolution.lifespans
    canon_of: dict[str, list[str]] = defaultdict(list)
    for membership in sorted(dataset.canon_memberships.values(), key=lambda item: item.id):
        if membership.canon_list_id not in canon_of[membership.work_id]:
            canon_of[membership.work_id].append(membership.canon_list_id)

    # ---- people (humans with a resolved lifespan), ordered by birth then id
    person_ids = sorted(
        (entity_id for entity_id, entity in dataset.entities.items() if entity.entity_type == "human" and entity_id in lifespans),
        key=lambda entity_id: (_ordinal(lifespans[entity_id].birth_year), entity_id),
    )
    index_of = {entity_id: position for position, entity_id in enumerate(person_ids)}

    # ---- books and chapters
    units_by_work: dict[str, list[Any]] = defaultdict(list)
    for unit in dataset.inventory_units.values():
        units_by_work[unit.work_id].append(unit)
    appearances: dict[str, list[list[Any]]] = defaultdict(list)
    event_chapters: dict[str, list[list[int]]] = defaultdict(list)
    books: list[dict[str, Any]] = []
    sections = []
    for key, label, work_ids in _sections(dataset):
        sections.append({"key": key, "label": label})
        for work_id in work_ids:
            work = dataset.works[work_id]
            book_index = len(books)
            chapters = []
            work_units = units_by_work.get(work_id, [])
            for unit in work_units:
                position = _unit_position(unit.locator) if len(work_units) > 1 else None
                people = [index_of[p] for p in unit.identified_entity_ids if p in index_of]
                spans = [(_ordinal(lifespans[p].birth_year), _ordinal(lifespans[p].death_year))
                         for p in unit.identified_entity_ids if p in lifespans]
                chapters.append({
                    "n": position[2] if position else None,
                    "sort": [position[0], position[1]] if position else [0, 0],
                    "label": unit.locator,
                    "reviewed": unit.reviewed,
                    "people": sorted(people),
                    "events": list(unit.event_ids),
                    "year": _setting_year(spans),
                })
            chapters.sort(key=lambda item: (item["sort"], item["label"]))
            for chapter in chapters:
                del chapter["sort"]
            for chapter_index, chapter in enumerate(chapters):
                for position in chapter["people"]:
                    appearances[person_ids[position]].append([book_index, chapter_index])
                for event_id in chapter["events"]:
                    event_chapters[event_id].append([book_index, chapter_index])
            years = [chapter["year"] for chapter in chapters if chapter["year"] is not None]
            books.append({
                "id": work_id,
                "name": work.names[0],
                "section": key,
                "type": work.work_type,
                "canons": canon_of.get(work_id, []),
                "chapters": chapters,
                "span": [min(years), max(years)] if years else None,
            })

    # ---- people rows: [id, name, birth, death, grade, basis, gender, classification, aliases, description]
    people = []
    for entity_id in person_ids:
        entity = dataset.entities[entity_id]
        lifespan = lifespans[entity_id]
        people.append([
            entity_id,
            entity.primary_name,
            _ordinal(lifespan.birth_year),
            _ordinal(lifespan.death_year),
            lifespan.confidence_grade,
            lifespan.life_basis,
            (entity.gender or "")[:1],
            entity.classification,
            list(entity.aliases),
            entity.description or "",
        ])
    parents, spouses = [], []
    for relationship in sorted(dataset.relationships.values(), key=lambda item: item.id):
        pair = [index_of.get(relationship.subject_id), index_of.get(relationship.object_id)]
        if None in pair:
            continue
        if relationship.relationship_type == "parent":
            parents.append(pair)
        elif relationship.relationship_type == "spouse":
            spouses.append(pair)

    # ---- events: display year from an explicit historical-year claim, otherwise placed by participants/chapters
    events = []
    for event in sorted(dataset.events.values(), key=lambda item: item.id):
        year = None
        basis = "unplaced"
        grade = None
        for claim_id in event.date_claim_ids:
            claim = dataset.claims[claim_id]
            if claim.value.get("kind") == "historical_year":
                ordinal = claim.value["year"] if claim.value["era"] == "CE" else 1 - claim.value["year"]
                if year is None or claim.confidence < grade:
                    year, grade, basis = ordinal, claim.confidence, "dated_claim"
        participants = [p.entity_id for p in event.participants if p.entity_id in lifespans]
        if year is None and participants:
            low, high = _shared_window([(_ordinal(lifespans[p].birth_year), _ordinal(lifespans[p].death_year)) for p in participants])
            # births sit at the start of the shared window, deaths at its end; otherwise the youngest
            # participant is taken as an adult without passing the first death
            if event.event_type == "birth":
                year = low
            elif event.event_type == "death":
                year = high
            else:
                year = min(high, low + ADULT_AGE)
            basis, grade = "participants", "E"
        if year is None:
            chapter_years = [books[b]["chapters"][c]["year"] for b, c in event_chapters.get(event.id, [])]
            chapter_years = [y for y in chapter_years if y is not None]
            if chapter_years:
                year, basis, grade = int(statistics.median(chapter_years)), "chapter", "E"
        gospels = sorted({c.locator.split(" ")[0] for c in event.citations if c.locator.split(" ")[0] in GOSPELS},
                         key=GOSPELS.index)
        events.append({
            "id": event.id,
            "name": event.name,
            "type": event.event_type,
            "year": year,
            "basis": basis,
            "grade": grade,
            "people": [index_of[p.entity_id] for p in event.participants if p.entity_id in index_of],
            "gospels": gospels,
        })

    core = {
        "schema_version": SITE_SCHEMA_VERSION,
        "model_id": resolution.model_id,
        "sections": sections,
        "books": books,
        "people_fields": ["id", "name", "birth", "death", "grade", "basis", "gender", "classification", "aliases", "description"],
        "people": people,
        "events": events,
        "parents": parents,
        "spouses": spouses,
        "canons": {item.id: item.name for item in dataset.canon_lists.values()},
    }

    # ---- details
    claims_by_subject: dict[str, list[Claim]] = defaultdict(list)
    for claim in dataset.claims.values():
        claims_by_subject[claim.subject_id].append(claim)
    relations: dict[str, list[list[str]]] = defaultdict(list)
    for relationship in sorted(dataset.relationships.values(), key=lambda item: item.id):
        kind, subject, obj = relationship.relationship_type, relationship.subject_id, relationship.object_id
        inverse = {"parent": "child", "ancestor": "descendant", "successor_of": "predecessor_of"}.get(kind, kind)
        relations[subject].append([kind, obj])
        relations[obj].append([inverse, subject])

    detail_people: dict[str, Any] = {}
    for entity_id in person_ids:
        entity = dataset.entities[entity_id]
        lifespan = lifespans[entity_id]
        claims = sorted(claims_by_subject.get(entity_id, []), key=lambda item: item.id)
        record: dict[str, Any] = {
            "explanation": lifespan.explanation,
            "evidence": list(lifespan.evidence_claim_ids),
            "alternatives": list(lifespan.alternative_claim_ids),
            "chapters": appearances.get(entity_id, []),
            "relations": [[kind, other] for kind, other in relations.get(entity_id, []) if other in dataset.entities],
            "names": [[c.value.get("form"), c.value.get("language"), c.witness_id] for c in claims if c.predicate == "name_as"],
            "attested": [[c.witness_id, c.citations[0].locator if c.citations else ""] for c in claims if c.predicate == "attested_in_passage"],
            "claims": [_claim(c) for c in claims if c.predicate not in {"name_as", "attested_in_passage"}],
            "cites": [_cite(c) for c in entity.citations],
        }
        # evidence/alternative claims about other subjects (e.g. a parent's age at this birth) are carried inline
        extra = [claim_id for claim_id in record["evidence"] + record["alternatives"]
                 if claim_id in dataset.claims and dataset.claims[claim_id].subject_id != entity_id]
        if extra:
            record["linked_claims"] = [_claim(dataset.claims[claim_id]) for claim_id in sorted(set(extra))]
        if entity.aliases:
            record["aliases"] = list(entity.aliases)
        if entity.description:
            record["description"] = entity.description
        if lifespan.birth_range:
            record["birth_range"] = [_ordinal(lifespan.birth_range.earliest), _ordinal(lifespan.birth_range.latest)]
        if lifespan.death_range:
            record["death_range"] = [_ordinal(lifespan.death_range.earliest), _ordinal(lifespan.death_range.latest)]
        detail_people[entity_id] = record

    groups = {
        entity_id: {"name": entity.primary_name, "description": entity.description}
        for entity_id, entity in dataset.entities.items() if entity_id not in index_of
    }
    detail_events = {
        event.id: {
            "description": event.description,
            "participants": [[p.entity_id, p.role] for p in event.participants],
            "date_claims": [_claim(dataset.claims[c]) for c in event.date_claim_ids],
            "cites": [_cite(c) for c in event.citations],
            "chapters": event_chapters.get(event.id, []),
        }
        for event in dataset.events.values()
    }
    details = {
        "schema_version": SITE_SCHEMA_VERSION,
        "people": detail_people,
        "others": groups,
        "events": detail_events,
        "witnesses": {
            w.id: {"work": w.work_id, "tradition": w.tradition, "language": w.language, "edition": w.edition,
                   **({"family": w.manuscript_family} if w.manuscript_family else {}),
                   **({"notes": w.notes} if w.notes else {})}
            for w in sorted(dataset.witnesses.values(), key=lambda item: item.id)
        },
        "sources": {
            s.id: {"title": s.title, "locator": s.bibliographic_locator, "license": s.license_status,
                   **({"url": s.url} if s.url else {})}
            for s in sorted(dataset.sources.values(), key=lambda item: item.id)
        },
    }
    return core, details


def write_site_bundle(dataset: Dataset, resolution: ResolutionResult, output_dir: Path) -> None:
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    core, details = build_site_bundle(dataset, resolution)
    for name, payload in (("core", core), ("details", details)):
        text = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n"
        (output_dir / f"{name}.json").write_text(text, encoding="utf-8", newline="\n")
