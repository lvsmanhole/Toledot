from collections import defaultdict
from functools import lru_cache
from pathlib import Path

import pytest

from bible_timeline.chronology import resolve_model
from bible_timeline.loader import load_dataset


DATA_ROOT = Path(__file__).parents[1] / "data"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"
NUMBERS_WITNESSES = {"lxx-numbers-rahlfs-hanhart", "geez-numbers-dillmann", "mt-numbers-bhs"}

# Every named or uniquely identifiable individual reviewed per chapter. Removing a name from the
# chapter inventory must fail this test.
NUMBERS_CHAPTER_PEOPLE = {
    11: {"moses", "joshua-exodus", "nun-ephraim", "eldad-numbers", "medad-numbers", "young-man-reporting-eldad"},
    12: {"moses", "aaron", "miriam", "cushite-wife-moses"},
    15: {"moses", "sabbath-wood-gatherer"},
    20: {"moses", "aaron", "miriam", "eleazar-aaron", "king-of-edom-numbers"},
    13: {
        "moses", "caleb-numbers", "jephunneh-numbers", "joshua-exodus", "nun-ephraim",
        "shammua-spy", "zaccur-reuben", "shaphat-spy", "hori-simeon", "igal-spy", "joseph-issachar",
        "palti-spy", "raphu-benjamin", "gaddiel-spy", "sodi-zebulun", "gaddi-spy", "susi-manasseh",
        "ammiel-spy", "gemalli-dan", "sethur-spy", "michael-asher", "nahbi-spy", "vophsi-naphtali",
        "geuel-spy", "machi-gad", "anak", "ahiman-anak", "sheshai-anak", "talmai-anak",
    },
    16: {"korah-levite", "dathan-numbers", "abiram-numbers", "eliab-reuben", "on-numbers", "peleth-reuben"},
    21: {"moses", "sihon-numbers", "og-numbers", "king-of-arad", "former-king-of-moab"},
    22: {"balaam-numbers", "beor-balaam", "balak-numbers", "zippor-balak"},
    25: {"moses", "eleazar-aaron", "phinehas", "zimri-numbers", "salu-simeon", "cozbi-numbers", "zur-midian"},
    26: {
        "moses", "eleazar-aaron", "aaron", "joshua-exodus", "nun-ephraim", "caleb-numbers", "jephunneh-numbers",
        # Reuben
        "reuben", "hanoch-reuben", "pallu", "hezron-reuben", "carmi", "eliab-reuben", "nemuel-reuben",
        "dathan-numbers", "abiram-numbers", "korah-levite",
        # Simeon
        "simeon", "jemuel", "jamin", "jachin", "zohar-simeon", "shaul-simeon",
        # Gad
        "gad", "ziphion", "haggi", "shuni", "ezbon", "eri", "arodi", "areli",
        # Judah
        "judah", "er-judah", "onan", "shelah-judah", "perez", "zerah-judah", "hezron-perez", "hamul",
        # Issachar, Zebulun
        "issachar", "tola", "puah", "jashub", "shimron", "zebulun", "sered", "elon-zebulun", "jahleel",
        # Joseph: Manasseh and Ephraim
        "joseph", "manasseh", "machir", "gilead-manasseh", "iezer-gilead", "helek-gilead", "asriel-gilead",
        "shechem-gilead", "shemida-gilead", "hepher-zelophehad", "zelophehad-numbers", "mahlah-numbers",
        "noah-zelophehad", "hoglah-numbers", "milcah-zelophehad", "tirzah-numbers",
        "ephraim", "shuthelah-ephraim", "becher-ephraim", "tahan-ephraim", "eran-shuthelah",
        # Benjamin, Dan, Asher, Naphtali
        "benjamin", "bela-benjamin", "ashbel", "ehi", "muppim", "huppim", "ard", "naaman",
        "dan", "hushim",
        "asher", "imnah", "ishvi", "beriah", "heber-asher", "malchiel", "serah",
        "naphtali", "jahzeel", "guni", "jezer", "shillem",
        # Levi
        "levi", "gershon", "kohath", "merari", "libni-numbers", "hebron-levite", "mahli-numbers", "mushi-numbers",
        "amram", "jochebed", "miriam", "nadab", "abihu", "ithamar",
    },
    27: {
        "moses", "eleazar-aaron", "joshua-exodus", "nun-ephraim", "aaron", "korah-levite", "zelophehad-numbers",
        "hepher-zelophehad", "gilead-manasseh", "machir", "manasseh", "joseph", "mahlah-numbers",
        "noah-zelophehad", "hoglah-numbers", "milcah-zelophehad", "tirzah-numbers",
    },
    31: {"moses", "eleazar-aaron", "phinehas", "balaam-numbers", "beor-balaam", "evi-midian", "rekem-midian",
         "zur-midian", "hur-midian", "reba-midian"},
    32: {"moses", "eleazar-aaron", "joshua-exodus", "nun-ephraim", "caleb-numbers", "jephunneh-numbers",
         "sihon-numbers", "og-numbers", "manasseh", "machir", "jair-manasseh", "nobah-gilead"},
    33: {"moses", "aaron", "king-of-arad"},
    34: {
        "moses", "eleazar-aaron", "joshua-exodus", "nun-ephraim", "caleb-numbers", "jephunneh-numbers",
        "shemuel-land-allotment", "ammihud-simeon", "elidad-land-allotment", "kislon-land",
        "bukki-land-allotment", "jogli-land", "hanniel-land-allotment", "ephod-land",
        "kemuel-land-allotment", "shiphtan-land", "elizaphan-land-allotment", "parnach-land",
        "paltiel-land-allotment", "azzan-land", "ahihud-land-allotment", "shelomi-land",
        "pedahel-land-allotment", "ammihud-naphtali",
    },
    36: {"moses", "gilead-manasseh", "machir", "manasseh", "joseph", "zelophehad-numbers", "mahlah-numbers",
         "noah-zelophehad", "hoglah-numbers", "milcah-zelophehad", "tirzah-numbers"},
}

# People first introduced by the Numbers completeness review. Each must be attested per witness.
NEW_NUMBERS_PEOPLE = (
    NUMBERS_CHAPTER_PEOPLE[13] - {"moses", "caleb-numbers", "jephunneh-numbers", "joshua-exodus"}
) | {
    "peleth-reuben", "eliab-reuben", "nemuel-reuben", "king-of-arad", "former-king-of-moab", "beor-balaam",
    "salu-simeon", "gilead-manasseh", "iezer-gilead", "helek-gilead", "asriel-gilead", "shechem-gilead",
    "shemida-gilead", "shuthelah-ephraim", "becher-ephraim", "tahan-ephraim", "eran-shuthelah",
    "ammihud-simeon", "kislon-land", "jogli-land", "ephod-land", "shiphtan-land", "parnach-land", "azzan-land",
    "shelomi-land", "ammihud-naphtali", "young-man-reporting-eldad", "cushite-wife-moses", "sabbath-wood-gatherer",
    "king-of-edom-numbers",
}
# Documented exceptions: witness coverage is deliberately narrower and explained in an interpretation note.
MASORETIC_ONLY = {"becher-ephraim"}

# Different-name clan founders in Numbers 26 that are identified (editorially, grade C) with Genesis 46 people.
NUMBERS_26_VARIANT_FORMS = {
    "jemuel": "Nemuel", "zohar-simeon": "Zerah", "ziphion": "Zephon", "ezbon": "Ozni", "arodi": "Arod",
    "puah": "Puvah", "hushim": "Shuham", "ehi": "Ahiram", "muppim": "Shephupham", "huppim": "Hupham",
}

# Aliases legitimately shared by different people (true Septuagint homographs or generic titles).
SHARED_ALIAS_ALLOWLIST = {
    "Abimelech", "Balla", "Elisaph (LXX form)", "Hor (LXX form)", "King of Egypt", "Mathousala", "Phikol", "Saba",
    "Sepphora", "Dishon", "Achiezer (LXX form)",
}


@lru_cache(maxsize=1)
def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


@lru_cache(maxsize=1)
def _lifespans():
    return resolve_model(_dataset(), "hybrid_reference").lifespans


def _chapter_people(chapter: int) -> set[str]:
    units = [
        unit for unit in _dataset().inventory_units.values()
        if unit.work_id == "numbers" and unit.locator == f"Numbers {chapter}"
    ]
    assert len(units) == 1, chapter
    return set(units[0].identified_entity_ids)


@pytest.mark.parametrize("chapter", sorted(NUMBERS_CHAPTER_PEOPLE))
def test_numbers_chapter_inventory_names_every_reviewed_person(chapter: int) -> None:
    missing = NUMBERS_CHAPTER_PEOPLE[chapter] - _chapter_people(chapter)
    assert not missing, f"Numbers {chapter} inventory omits {sorted(missing)}"


def test_aaron_is_not_inventoried_where_the_text_does_not_name_him() -> None:
    assert "aaron" not in _chapter_people(11)
    assert "aaron" not in _chapter_people(28)
    assert "aaron" not in _chapter_people(29)


def test_new_numbers_people_are_human_attested_per_witness_and_dated_grade_e() -> None:
    dataset = _dataset()
    lifespans = _lifespans()
    for person_id in sorted(NEW_NUMBERS_PEOPLE):
        assert dataset.entities[person_id].entity_type == "human", person_id
        witnesses = {
            claim.witness_id for claim in dataset.claims.values()
            if claim.subject_id == person_id and claim.predicate == "attested_in_passage"
            and claim.evidence_type == "explicit_text" and claim.witness_id in NUMBERS_WITNESSES
        }
        expected = {"mt-numbers-bhs"} if person_id in MASORETIC_ONLY else NUMBERS_WITNESSES
        assert witnesses == expected, person_id
        assert lifespans[person_id].confidence_grade == "E", person_id


def test_masoretic_only_people_explain_their_narrower_witness_coverage() -> None:
    for person_id in MASORETIC_ONLY:
        notes = [
            claim.interpretation_note for claim in _dataset().claims.values()
            if claim.subject_id == person_id and claim.predicate == "attested_in_passage"
        ]
        assert any(note and "Septuagint" in note for note in notes), person_id


def test_numbers_26_variant_names_are_kept_as_aliases_with_editorial_identity_claims() -> None:
    dataset = _dataset()
    for person_id, form in NUMBERS_26_VARIANT_FORMS.items():
        name_claims = [
            claim for claim in dataset.claims.values()
            if claim.subject_id == person_id and claim.predicate == "name_as" and claim.value.get("form") == form
        ]
        assert name_claims and all(claim.witness_id == "mt-numbers-bhs" for claim in name_claims), person_id
        identity = dataset.claims[f"{person_id}-identity-numbers26"]
        assert identity.confidence == "C" and identity.evidence_type == "editorial_inference", person_id


def test_conflicting_genealogies_are_claims_not_parent_relationships() -> None:
    dataset = _dataset()
    parents = defaultdict(set)
    for relationship in dataset.relationships.values():
        if relationship.relationship_type == "parent":
            parents[relationship.object_id].add(relationship.subject_id)
    # Numbers 26:40 (sons of Bela) vs Genesis 46:21 MT (sons of Benjamin): keep both readings unmerged.
    assert not parents["ard"] and not parents["naaman"]
    assert "ard-numbers26-son-of-bela-mt" in dataset.claims
    assert "ard-gen46-benjamin-line-variant" in dataset.claims
    # Numbers 26:59 "daughter of Levi" cannot be honored literally by the display chronology.
    assert "levi" not in parents["jochebed"]
    assert "jochebed-daughter-of-levi-mt" in dataset.claims


def test_same_name_people_stay_distinct() -> None:
    entities = _dataset().entities
    for left, right in [
        ("dishon-horite", "dishon-anah"), ("becher-ephraim", "beker"), ("eliab-reuben", "eliab-zebulun"),
        ("nemuel-reuben", "jemuel"), ("shechem-gilead", "shechem"), ("beor-balaam", "beor-edom"),
        ("joseph-issachar", "joseph"), ("hori-simeon", "hori-lotan"), ("elidad-land-allotment", "eldad-numbers"),
    ]:
        assert left in entities and right in entities
    parents = {
        relationship.subject_id for relationship in _dataset().relationships.values()
        if relationship.relationship_type == "parent" and relationship.object_id == "dishon-horite"
    }
    assert parents == {"seir-horite"}


def test_no_alias_leaks_between_differently_named_people() -> None:
    # Genuine variant names are shared by a few people (e.g. Micah/Micaiah/Mica); a YAML anchor leak spreads one alias
    # across many differently named people, as "Roubin" once did across all of Jacob's children.
    by_alias = defaultdict(set)
    for entity in _dataset().entities.values():
        for alias in entity.aliases:
            by_alias[alias].add(entity.primary_name)
    leaked = {alias: names for alias, names in by_alias.items() if len(names) > 4}
    assert not leaked, leaked
    jacob_children = ["reuben", "simeon", "levi", "judah", "dan", "naphtali", "gad", "asher", "issachar", "zebulun",
                      "dinah", "joseph", "benjamin"]
    aliases = [alias for child in jacob_children for alias in _dataset().entities[child].aliases]
    assert "Roubin" not in [alias for child in jacob_children[1:] for alias in _dataset().entities[child].aliases]
    assert len(aliases) == len(set(aliases))


def test_every_parent_is_old_enough_and_alive_at_display_birth_of_child() -> None:
    def ordinal(year):
        return -year.year if year.era == "BCE" else year.year

    lifespans = _lifespans()
    problems = []
    for relationship in _dataset().relationships.values():
        if relationship.relationship_type != "parent":
            continue
        parent, child = lifespans.get(relationship.subject_id), lifespans.get(relationship.object_id)
        if parent is None or child is None:
            continue
        parent_birth, parent_death = ordinal(parent.birth_year), ordinal(parent.death_year)
        child_birth = ordinal(child.birth_year)
        if child_birth - parent_birth < 12 or child_birth > parent_death + 1:
            problems.append((relationship.subject_id, relationship.object_id))
    assert not problems
