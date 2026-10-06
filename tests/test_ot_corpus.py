import json
from functools import lru_cache
from pathlib import Path

import pytest

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


ROOT = Path(__file__).parents[1]
DATA_ROOT = ROOT / "data"
SCHEMA_ROOT = ROOT / "schemas"

BOOKS = [
    ("joshua", "Joshua", 24, True), ("judges", "Judges", 21, True), ("ruth", "Ruth", 4, True),
    ("1-samuel", "1 Samuel", 31, False), ("2-samuel", "2 Samuel", 24, False), ("1-kings", "1 Kings", 22, False),
    ("2-kings", "2 Kings", 25, False), ("1-chronicles", "1 Chronicles", 29, False), ("2-chronicles", "2 Chronicles", 36, False),
    ("ezra", "Ezra", 10, False), ("nehemiah", "Nehemiah", 13, False), ("esther", "Esther", 10, False), ("job", "Job", 42, False),
    ("psalms", "Psalms", 150, False), ("proverbs", "Proverbs", 31, False), ("ecclesiastes", "Ecclesiastes", 12, False),
    ("song-of-songs", "Song of Songs", 8, False), ("isaiah", "Isaiah", 66, False), ("jeremiah", "Jeremiah", 52, False),
    ("lamentations", "Lamentations", 5, False), ("ezekiel", "Ezekiel", 48, False), ("daniel", "Daniel", 12, False),
    ("hosea", "Hosea", 14, False), ("joel", "Joel", 3, False), ("amos", "Amos", 9, False), ("obadiah", "Obadiah", 1, False),
    ("jonah", "Jonah", 4, False), ("micah", "Micah", 7, False), ("nahum", "Nahum", 3, False), ("habakkuk", "Habakkuk", 3, False),
    ("zephaniah", "Zephaniah", 3, False), ("haggai", "Haggai", 2, False), ("zechariah", "Zechariah", 14, False),
    ("malachi", "Malachi", 4, False),
]

# Hand-reviewed people per chapter (named and uniquely identifiable unnamed individuals).
REVIEWED_CHAPTERS = {
    "Joshua 1": {"joshua-exodus", "moses", "nun-ephraim"},
    "Joshua 7": {"achan", "carmi-jos7", "zabdi-jos7", "zerah-judah", "joshua-exodus"},
    "Judges 4": {"deborah-jdg4", "barak", "jabin-jdg4", "sisera-jdg4", "jael", "heber-jdg4", "lappidoth", "abinoam", "ehud-jdg3"},
    "Judges 11": {"jephthah", "jephthah-daughter"},
    "Judges 13": {"manoah", "manoah-wife", "samson"},
    "Judges 19": {"levite-of-ephraim", "levite-concubine", "levite-concubine-father", "old-man-of-gibeah"},
    "Ruth 4": {"boaz", "ruth-rut1", "naomi", "obed-rut4", "jesse", "david", "nearer-redeemer-ruth", "perez", "tamar"},
    "1 Samuel 17": {"david", "goliath", "saul", "jesse", "eliab-1sa16", "abinadab-1sa16", "shimeah-1sa16", "abner"},
    "1 Samuel 28": {"saul", "samuel", "medium-of-endor", "david"},
    "2 Samuel 11": {"david", "bathsheba", "uriah-2sa11", "joab-1sa26", "eliam-2sa11"},
    "1 Kings 3": {"solomon", "david", "mother-of-living-child", "mother-of-dead-child", "daughter-of-pharaoh-1ki3"},
    "1 Kings 17": {"elijah-1ki17", "ahab-1ki16", "widow-of-zarephath", "son-of-widow-of-zarephath"},
    "2 Kings 4": {"elisha", "gehazi", "shunammite-woman", "shunammite-husband", "shunammite-son", "widow-of-prophet-oil"},
    "2 Kings 22": {"josiah-1ki13", "hilkiah-2ki22", "huldah", "shaphan-2ki22", "ahikam", "jedidah", "adaiah-2ki22"},
    "2 Kings 25": {"zedekiah-2ki24", "nebuchadnezzar", "nebuzaradan", "gedaliah-2ki25", "evil-merodach", "jehoiachin"},
    "Esther 1": {"ahasuerus", "vashti", "mehuman", "biztha", "harbona", "bigtha", "abagtha", "zethar", "carkas", "memucan"},
    "Isaiah 20": {"sargon-ii", "tartan-of-sargon", "isaiah-2ki19", "amoz"},
    "Jeremiah 36": {"jeremiah-2ch35", "baruch-jer32", "jehoiakim", "jehudi", "elnathan-jer26", "gemariah-jer36"},
    "Daniel 3": {"nebuchadnezzar", "hananiah-dan1", "mishael-dan1", "azariah-dan1"},
    "Daniel 9": {"darius-dan5", "ahasuerus-dan9", "daniel-ezk14"},
    "Jonah 1": {"jonah-2ki14", "amittai", "jonah-ship-captain"},
}

JUDAH_KING_AGES = {  # id: (age at accession, display birth BCE)
    "rehoboam": (41, 972), "jehoshaphat-1ki15": (35, 907), "jehoram-1ki22": (32, 880), "ahaziah-2ki8": (22, 863),
    "joash-2ki11": (7, 842), "amaziah-2ki12": (25, 821), "uzziah-2ki14": (16, 808), "jotham-2ki15": (25, 775),
    "ahaz-2ki15": (20, 755), "hezekiah-2ki16": (25, 740), "manasseh-2ki20": (12, 708), "amon-2ki21": (22, 664),
    "josiah-1ki13": (8, 648), "jehoahaz-2ki23": (23, 632), "jehoiakim": (25, 634), "jehoiachin": (18, 616),
    "zedekiah-2ki24": (21, 618),
}


@lru_cache(maxsize=1)
def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


@lru_cache(maxsize=1)
def _lifespans():
    return resolve_model(_dataset(), "hybrid_reference").lifespans


def _unit(locator):
    units = [unit for unit in _dataset().inventory_units.values() if unit.locator == locator]
    assert len(units) == 1, locator
    return units[0]


def _bce(year):
    assert year.era == "BCE"
    return year.year


@pytest.mark.parametrize("work_id,title,chapters,geez", BOOKS)
def test_every_chapter_is_inventoried_in_its_witnesses(work_id, title, chapters, geez) -> None:
    dataset = _dataset()
    units = {unit.locator: unit for unit in dataset.inventory_units.values() if unit.work_id == work_id}
    assert set(units) == {f"{title} {chapter}" for chapter in range(1, chapters + 1)}
    expected = {f"mt-{work_id}-bhs", f"lxx-{work_id}-rahlfs-hanhart"} | ({f"geez-{work_id}-dillmann"} if geez else set())
    for unit in units.values():
        assert unit.reviewed
        assert {dataset.passages[pid].witness_id for pid in unit.passage_ids} == expected, unit.locator
        assert unit.event_ids, unit.locator
        assert unit.no_individuals == (not unit.identified_entity_ids)


@pytest.mark.parametrize("locator", sorted(REVIEWED_CHAPTERS))
def test_reviewed_chapters_name_every_expected_person(locator) -> None:
    missing = REVIEWED_CHAPTERS[locator] - set(_unit(locator).identified_entity_ids)
    assert not missing, f"{locator} omits {sorted(missing)}"


def test_chapter_people_never_silently_drop_out() -> None:
    snapshot = json.loads((ROOT / "tests/fixtures/chapter_people_snapshot.json").read_text(encoding="utf-8"))
    current = {unit.locator: set(unit.identified_entity_ids) for unit in _dataset().inventory_units.values()}
    dropped = {loc: sorted(set(people) - current.get(loc, set())) for loc, people in snapshot.items()
               if set(people) - current.get(loc, set())}
    assert not dropped, dropped


def test_every_person_in_a_later_book_has_a_masoretic_attestation_for_that_book() -> None:
    dataset = _dataset()
    attested = {(claim.subject_id, claim.witness_id) for claim in dataset.claims.values() if claim.predicate == "attested_in_passage"}
    missing = []
    for work_id, title, chapters, geez in BOOKS:
        for unit in dataset.inventory_units.values():
            if unit.work_id == work_id:
                missing += [(unit.locator, eid) for eid in unit.identified_entity_ids if (eid, f"mt-{work_id}-bhs") not in attested]
    assert not missing, missing[:20]


def test_book_level_version_presence_is_never_presented_as_verified_text() -> None:
    for claim in _dataset().claims.values():
        if claim.id.endswith("-presence"):
            assert claim.confidence == "C" and claim.evidence_type == "editorial_inference", claim.id


def test_namesake_kings_of_israel_and_judah_stay_distinct() -> None:
    entities = _dataset().entities
    for judah, israel in [("jehoram-1ki22", "joram-2ki1"), ("ahaziah-2ki8", "ahaziah-1ki22"), ("jehoahaz-2ki23", "jehoahaz-2ki10"),
                          ("joash-2ki11", "joash-2ki13")]:
        assert judah in entities and israel in entities and judah != israel
    assert "jeroboam-1ki11" in entities and "jeroboam-2ki13" in entities


@pytest.mark.parametrize("king", sorted(JUDAH_KING_AGES))
def test_judah_kings_have_explicit_accession_ages_and_matching_births(king) -> None:
    dataset = _dataset()
    age, birth = JUDAH_KING_AGES[king]
    claim = dataset.claims[f"{king}-age-at-accession"]
    assert claim.value["value"] == age and claim.witness_id.startswith("mt-") and claim.confidence == "A"
    lifespan = _lifespans()[king]
    assert _bce(lifespan.birth_year) == birth
    assert lifespan.confidence_grade == "C"


def test_regnal_succession_keeps_fathers_older_than_sons() -> None:
    lifespans = _lifespans()
    line = ["david", "solomon", "rehoboam", "abijah-1ki14-31", "asa-1ki15", "jehoshaphat-1ki15", "jehoram-1ki22", "ahaziah-2ki8",
            "joash-2ki11", "amaziah-2ki12", "uzziah-2ki14", "jotham-2ki15", "ahaz-2ki15", "hezekiah-2ki16", "manasseh-2ki20",
            "amon-2ki21", "josiah-1ki13"]
    for father, son in zip(line, line[1:]):
        assert _bce(lifespans[father].birth_year) - _bce(lifespans[son].birth_year) >= 12, (father, son)
        assert _bce(lifespans[son].birth_year) >= _bce(lifespans[father].death_year), (father, son)


def test_textual_variants_are_recorded_beside_the_followed_reading() -> None:
    claims = _dataset().claims
    assert claims["ahaziah-judah-age-variant-2ch"].value["value"] == 42
    assert claims["jehoiachin-age-variant-2ch"].value["value"] == 8
    assert claims["eli-judged-years-lxx"].value["value"] == 20 and claims["eli-judged-years-lxx"].confidence == "C"
    assert claims["job-years-after-restoration-lxx"].value["value"] == 170
    temple = claims["solomon-temple-founded-date-mt"]
    assert temple.value["year_number"] == 480 and "440" in temple.interpretation_note
    assert "tenth day" in claims["jerusalem-burned-date-mt"].interpretation_note


def test_explicit_lifespans_are_honored() -> None:
    lifespans = _lifespans()
    joshua = lifespans["joshua-exodus"]
    assert _bce(joshua.birth_year) - _bce(joshua.death_year) == 110
    eli = lifespans["eli"]
    assert _bce(eli.birth_year) - _bce(eli.death_year) == 98
    caleb = lifespans["caleb-numbers"]
    assert _bce(caleb.birth_year) == 1449 + 40


def test_compressed_genealogies_are_recorded_as_descent_not_parenthood() -> None:
    relationships = _dataset().relationships.values()
    parent = {(r.subject_id, r.object_id) for r in relationships if r.relationship_type == "parent"}
    ancestor = {(r.subject_id, r.object_id) for r in relationships if r.relationship_type == "ancestor"}
    for pair in [("salmon", "boaz"), ("gera", "ehud-jdg3"), ("seraiah-2ki25", "ezra-ezr7"), ("gershom", "shebuel-1ch23")]:
        assert pair in ancestor and pair not in parent, pair


def test_index_merges_that_conflate_different_people_are_split() -> None:
    dataset = _dataset()
    assert "sargon-ii" not in _unit("2 Kings 18").identified_entity_ids
    assert "sennacherib" not in _unit("Isaiah 20").identified_entity_ids
    assert "ahasuerus" not in _unit("Daniel 9").identified_entity_ids
    parents_of_darius = {r.subject_id for r in dataset.relationships.values() if r.relationship_type == "parent" and r.object_id == "darius-dan5"}
    assert parents_of_darius == {"ahasuerus-dan9"}
    assert "Shallum" in dataset.entities["jehoahaz-2ki23"].aliases  # Jeremiah 22:11


def test_eponymous_ancestors_are_not_inventoried_for_tribe_or_nation_usage() -> None:
    for locator in ["1 Kings 12", "Judges 20", "2 Kings 25", "Jeremiah 1"]:
        people = set(_unit(locator).identified_entity_ids)
        assert not people & {"jacob", "judah", "ephraim", "benjamin", "levi"}, locator


def test_dated_events_carry_text_dates_and_separate_display_years() -> None:
    dataset = _dataset()
    for event_id in ["solomon-temple-founded", "fall-of-samaria", "sennacherib-invades-judah", "jerusalem-burned", "cyrus-decree",
                     "second-temple-completed", "nehemiah-commissioned", "esther-made-queen"]:
        claims = [dataset.claims[cid] for cid in dataset.events[event_id].date_claim_ids]
        assert any(c.confidence == "A" and c.evidence_type == "explicit_text" for c in claims), event_id
        display = [c for c in claims if c.value.get("kind") == "historical_year"]
        assert len(display) == 1 and display[0].confidence == "C" and display[0].evidence_type == "editorial_anchor", event_id
