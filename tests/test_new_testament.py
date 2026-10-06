from functools import lru_cache
from pathlib import Path

import pytest

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


ROOT = Path(__file__).parents[1]
BOOKS = [("matthew", "Matthew", 28), ("mark", "Mark", 16), ("luke", "Luke", 24), ("john", "John", 21), ("acts", "Acts", 28),
         ("romans", "Romans", 16), ("1-corinthians", "1 Corinthians", 16), ("2-corinthians", "2 Corinthians", 13), ("galatians", "Galatians", 6),
         ("ephesians", "Ephesians", 6), ("philippians", "Philippians", 4), ("colossians", "Colossians", 4), ("1-thessalonians", "1 Thessalonians", 5),
         ("2-thessalonians", "2 Thessalonians", 3), ("1-timothy", "1 Timothy", 6), ("2-timothy", "2 Timothy", 4), ("titus", "Titus", 3),
         ("philemon", "Philemon", 1), ("hebrews", "Hebrews", 13), ("james", "James", 5), ("1-peter", "1 Peter", 5), ("2-peter", "2 Peter", 3),
         ("1-john", "1 John", 5), ("2-john", "2 John", 1), ("3-john", "3 John", 1), ("jude", "Jude", 1), ("revelation", "Revelation", 22)]
REVIEWED = {
    "Matthew 2": {"herod-mat2", "archelaus", "jesus", "joseph-mat1", "mary-mat1"},
    "Mark 5": {"jairus", "jairus-daughter", "woman-with-hemorrhage", "gerasene-demoniac", "jesus", "peter"},
    "Luke 2": {"augustus", "quirinius", "simeon-luk2", "anna", "phanuel", "jesus", "mary-mat1", "joseph-mat1"},
    "John 4": {"samaritan-woman-at-the-well", "royal-official-capernaum", "son-of-royal-official", "jesus"},
    "John 11": {"lazarus-jhn11", "martha", "caiaphas", "thomas"},
    "Acts 12": {"herod-act12", "rhoda", "peter", "james-mat4", "blastus"},
    "Romans 16": {"phoebe", "priscilla", "aquila", "junia", "andronicus", "tertius", "erastus"},
    "Philemon 1": {"philemon-phm1", "onesimus", "apphia", "archippus", "epaphras"},
    "Revelation 1": {"john-of-patmos", "jesus"},
    "Revelation 2": {"antipas", "jezebel-of-thyatira", "balaam-numbers", "balak-numbers"},
}
ETHIOPIC_BOOK_LEVEL = ["sinodos-sirate-tsion", "sinodos-tizaz", "sinodos-gitsew", "sinodos-abtilis", "book-of-covenant-1",
                       "book-of-covenant-2", "ethiopic-clement", "ethiopic-didascalia"]


@lru_cache(maxsize=1)
def _dataset():
    return load_dataset(ROOT / "data", ROOT / "schemas")


@lru_cache(maxsize=1)
def _lifespans():
    return resolve_model(_dataset(), "hybrid_reference").lifespans


def _unit(locator):
    units = [u for u in _dataset().inventory_units.values() if u.locator == locator]
    assert len(units) == 1, locator
    return units[0]


def _signed(year):
    return -year.year if year.era == "BCE" else year.year


@pytest.mark.parametrize("work_id,title,chapters", BOOKS)
def test_every_new_testament_chapter_is_inventoried_with_na28(work_id, title, chapters) -> None:
    dataset = _dataset()
    units = {u.locator: u for u in dataset.inventory_units.values() if u.work_id == work_id}
    assert set(units) == {f"{title} {c}" for c in range(1, chapters + 1)}
    for unit in units.values():
        assert unit.reviewed and unit.event_ids, unit.locator
        assert {dataset.passages[p].witness_id for p in unit.passage_ids} == {f"greek-{work_id}-na28"}


@pytest.mark.parametrize("locator", sorted(REVIEWED))
def test_reviewed_new_testament_chapters_name_expected_people(locator) -> None:
    missing = REVIEWED[locator] - set(_unit(locator).identified_entity_ids)
    assert not missing, f"{locator} omits {sorted(missing)}"


@pytest.mark.parametrize("work_id", ETHIOPIC_BOOK_LEVEL)
def test_ethiopic_broader_new_testament_works_are_book_level_only(work_id) -> None:
    units = [u for u in _dataset().inventory_units.values() if u.work_id == work_id]
    assert len(units) == 1 and not units[0].reviewed and not units[0].identified_entity_ids


def test_interpretive_and_symbolic_identities_are_not_merged() -> None:
    dataset = _dataset()
    assert "jesus" not in _unit("Isaiah 7").identified_entity_ids and "immanuel-isa7" in _unit("Isaiah 7").identified_entity_ids
    assert "john-mat4" not in _unit("Revelation 1").identified_entity_ids  # the seer's identity with the apostle is traditional
    assert "jezebel" not in _unit("Revelation 2").identified_entity_ids
    assert not any(u.work_id == "luke" and "lazarus-luk16" in u.identified_entity_ids for u in dataset.inventory_units.values())
    assert "mother-of-zebedees-sons" in _unit("Matthew 20").identified_entity_ids


def test_eponyms_are_not_inventoried_for_israel_the_nation() -> None:
    for locator in ["Matthew 10", "Romans 11", "Acts 2"]:
        assert "jacob" not in _unit(locator).identified_entity_ids, locator


def test_herodian_and_roman_anchors() -> None:
    lifespans = _lifespans()
    assert _signed(lifespans["herod-mat2"].death_year) == -4
    assert _signed(lifespans["herod-act12"].death_year) == 44
    assert _signed(lifespans["james-mat4"].death_year) == 44
    assert lifespans["herod-mat2"].confidence_grade == "C"
    jesus = lifespans["jesus"]
    assert _signed(jesus.birth_year) < _signed(lifespans["herod-mat2"].death_year)
    assert jesus.confidence_grade == "E"


def test_explicit_new_testament_ages_and_dates() -> None:
    claims = _dataset().claims
    assert claims["jesus-age-at-event-30-luke"].value["value"] == 30
    assert claims["ministry-of-john-begins-text-date"].value["year_number"] == 15
    display = claims["crucifixion-of-jesus-display-year"]
    assert display.value["year"] == 30 and display.confidence == "C" and "33" in display.interpretation_note


def test_gospel_parallels_link_each_gospel() -> None:
    dataset = _dataset()
    event = dataset.events["feeding-of-five-thousand"]
    locators = {c.locator.split(" ")[0] for c in event.citations}
    assert locators == {"Matthew", "Mark", "Luke", "John"}
    for locator in ["Matthew 14", "Mark 6", "Luke 9", "John 6"]:
        assert "feeding-of-five-thousand" in _unit(locator).event_ids, locator


def test_genealogy_readings_that_conflict_are_claims() -> None:
    dataset = _dataset()
    assert not any(r.relationship_type == "parent" and (r.subject_id, r.object_id) == ("salmon", "boaz") for r in dataset.relationships.values())
    assert any(c.predicate == "parent_reference" and c.subject_id == "boaz" and c.object_id == "salmon" for c in dataset.claims.values())
