from functools import lru_cache
from pathlib import Path

import pytest

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


ROOT = Path(__file__).parents[1]

# work id -> (title used in locators, expected second witness prefix or None)
CENSUS_WORKS = {
    "tobit": ("Tobit", "lxx"), "judith": ("Judith", "lxx"), "wisdom-of-solomon": ("Wisdom of Solomon", "lxx"),
    "sirach": ("Sirach", "lxx"), "baruch": ("Baruch", "lxx"), "letter-of-jeremiah": ("Letter of Jeremiah", "lxx"),
    "1-maccabees": ("1 Maccabees", "lxx"), "2-maccabees": ("2 Maccabees", "lxx"), "3-maccabees": ("3 Maccabees", "lxx"),
    "4-maccabees": ("4 Maccabees", "lxx"), "1-esdras": ("1 Esdras", "lxx"), "prayer-of-manasseh": ("Prayer of Manasseh", "lxx"),
    "psalm-151": ("Psalm 151", "lxx"), "additions-to-esther": ("Additions to Esther", "lxx"),
    "prayer-of-azariah": ("Prayer of Azariah", "lxx"), "susanna": ("Susanna", "lxx"), "bel-and-dragon": ("Bel and the Dragon", "lxx"),
    "ezra-sutuel": ("4 Ezra (Ezra Sutuel)", None), "1-enoch": ("1 Enoch", "geez"), "jubilees": ("Jubilees", "geez"),
}
BOOK_LEVEL_ONLY = ["1-meqabyan", "2-meqabyan", "3-meqabyan", "tegsats", "josippon", "rest-of-words-of-baruch", "ascension-of-isaiah",
                   "odes", "psalms-of-solomon"]

REVIEWED_CHAPTERS = {
    "Tobit 1": {"tobit-person", "tobias-son-of-tobit", "anna-tobit", "tobiel", "shalmaneser", "sennacherib", "esarhaddon"},
    "Judith 8": {"judith-person", "merari-jdt", "manasses-husband-of-judith", "ozias-of-bethulia", "chabris", "charmis"},
    "1 Maccabees 2": {"mattathias-hasmonean", "judas-maccabeus", "jonathan-apphus", "simon-thassi", "eleazar-avaran", "john-gaddis"},
    "2 Maccabees 7": {"mother-of-seven-brothers", "seven-brothers-son-1", "seven-brothers-son-7", "antiochus-iv-epiphanes"},
    "Susanna 13": {"susanna-person", "daniel-ezk14", "joakim-husband-of-susanna"},
    "Sirach 50": {"simon-son-of-onias-high-priest", "jesus-son-of-sirach"},
    "1 Esdras 3": {"zerubbabel-1ch3", "darius-ezr4"},
    "Bel and the Dragon 14": {"cyrus", "daniel-ezk14", "habakkuk-hab1"},
    "1 Enoch 106": {"enoch-seth", "methuselah", "lamech-seth", "noah"},
}


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


@pytest.mark.parametrize("work_id", sorted(CENSUS_WORKS))
def test_census_works_have_chapter_units_with_their_witnesses(work_id) -> None:
    dataset = _dataset()
    title, second = CENSUS_WORKS[work_id]
    units = [u for u in dataset.inventory_units.values() if u.work_id == work_id]
    assert units, work_id
    for unit in units:
        assert unit.locator.startswith(title) and unit.reviewed, unit.locator
        witnesses = {dataset.passages[p].witness_id for p in unit.passage_ids}
        assert any(w.startswith(("web-", "charles-")) for w in witnesses), unit.locator
        if second:
            assert any(w.startswith(second) for w in witnesses), unit.locator
        else:
            assert len(witnesses) == 1, unit.locator  # 4 Ezra survives in Latin/Ethiopic, not in the Septuagint


@pytest.mark.parametrize("work_id", BOOK_LEVEL_ONLY)
def test_works_without_a_citable_edition_assert_no_people(work_id) -> None:
    units = [u for u in _dataset().inventory_units.values() if u.work_id == work_id]
    assert len(units) == 1
    assert not units[0].reviewed and not units[0].identified_entity_ids


@pytest.mark.parametrize("locator", sorted(REVIEWED_CHAPTERS))
def test_reviewed_deuterocanonical_chapters_name_expected_people(locator) -> None:
    missing = REVIEWED_CHAPTERS[locator] - set(_unit(locator).identified_entity_ids)
    assert not missing, f"{locator} omits {sorted(missing)}"


def test_translation_based_claims_are_marked_below_grade_a() -> None:
    for claim in _dataset().claims.values():
        if claim.witness_id and claim.witness_id.startswith(("web-", "charles-")):
            assert claim.confidence in {"B", "C"}, claim.id


def test_maccabean_and_explicit_lifespans() -> None:
    lifespans = _lifespans()

    def years(eid):
        life = lifespans[eid]
        return life.birth_year.year, life.death_year.year

    assert years("mattathias-hasmonean")[1] == 166
    assert years("judas-maccabeus")[1] == 160
    assert years("simon-thassi")[1] == 134
    assert years("eleazar-martyr") == (257, 167)
    tobit = years("tobit-person")
    assert tobit[0] - tobit[1] == 158
    judith = years("judith-person")
    assert judith[0] - judith[1] == 105


def test_seleucid_era_dates_are_text_claims_with_converted_display_years() -> None:
    dataset = _dataset()
    claims = dataset.claims
    accession = claims["1-maccabees-dated-1-10-date"]
    assert accession.value["year_number"] == 137 and accession.confidence == "B"
    display = claims["1-maccabees-dated-1-10-display-year"]
    assert display.value["year"] in (175, 176) and display.confidence == "C"


def test_identity_decisions() -> None:
    entities = _dataset().entities
    for merged_away in ("nicanor-governor-of-judea", "simon-ii-high-priest", "jonathan-maccabeus", "simon-maccabeus"):
        assert merged_away not in entities
    assert "nebuchadnezzar-judith" in entities and "nebuchadnezzar-judith" != "nebuchadnezzar"
    assert "sheshbazzar-1es" in entities  # 1 Esdras 6:18 names Zerubbabel and Sanabassarus as two men
    relationships = _dataset().relationships.values()
    assert any(r.relationship_type == "ancestor" and (r.subject_id, r.object_id) == ("shelumiel", "nathanael-jdt") for r in relationships)
    assert not any(r.relationship_type == "parent" and r.object_id in {"ard", "naaman"} for r in relationships)
