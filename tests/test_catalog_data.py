from pathlib import Path

from bible_timeline.loader import load_dataset
from bible_timeline.validation import validate_dataset


DATA_ROOT = Path(__file__).parents[1] / "data" / "catalog"
SCHEMA_ROOT = Path(__file__).parents[1] / "schemas"

PROTESTANT_WORKS = {
    "genesis", "exodus", "leviticus", "numbers", "deuteronomy",
    "joshua", "judges", "ruth", "1-samuel", "2-samuel", "1-kings",
    "2-kings", "1-chronicles", "2-chronicles", "ezra", "nehemiah",
    "esther", "job", "psalms", "proverbs", "ecclesiastes",
    "song-of-songs", "isaiah", "jeremiah", "lamentations", "ezekiel",
    "daniel", "hosea", "joel", "amos", "obadiah", "jonah", "micah",
    "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi",
    "matthew", "mark", "luke", "john", "acts", "romans",
    "1-corinthians", "2-corinthians", "galatians", "ephesians",
    "philippians", "colossians", "1-thessalonians", "2-thessalonians",
    "1-timothy", "2-timothy", "titus", "philemon", "hebrews", "james",
    "1-peter", "2-peter", "1-john", "2-john", "3-john", "jude",
    "revelation",
}

SEPTUAGINT_ADDITIONS = {
    "1-esdras", "tobit", "judith", "wisdom-of-solomon", "sirach",
    "baruch", "letter-of-jeremiah", "prayer-of-azariah", "susanna",
    "bel-and-dragon", "additions-to-esther", "1-maccabees", "2-maccabees",
    "3-maccabees", "4-maccabees", "psalm-151", "odes",
    "prayer-of-manasseh", "psalms-of-solomon",
}

ETHIOPIAN_SENTINELS = {
    "1-enoch", "jubilees", "1-meqabyan", "2-meqabyan", "3-meqabyan",
    "ezra-sutuel", "tegsats", "josippon", "sinodos-sirate-tsion",
    "sinodos-tizaz", "sinodos-gitsew", "sinodos-abtilis",
    "book-of-covenant-1", "book-of-covenant-2", "ethiopic-clement",
    "ethiopic-didascalia",
}


def _dataset():
    return load_dataset(DATA_ROOT, SCHEMA_ROOT)


def test_union_registry_contains_required_corpora() -> None:
    dataset = _dataset()
    work_ids = set(dataset.works)

    assert PROTESTANT_WORKS <= work_ids
    assert SEPTUAGINT_ADDITIONS <= work_ids
    assert ETHIOPIAN_SENTINELS <= work_ids


def test_ethiopian_memberships_distinguish_narrower_and_broader_status() -> None:
    dataset = _dataset()
    statuses = {
        membership.status
        for membership in dataset.canon_memberships.values()
        if membership.canon_list_id.startswith("ethiopian-")
    }

    assert "included_narrower" in statuses
    assert "included_broader" in statuses
    assert dataset.canon_memberships["ethiopian-broader-ethiopic-clement"].status == (
        "included_broader"
    )


def test_every_source_list_item_is_resolved_and_mapped() -> None:
    dataset = _dataset()
    mapped_item_ids = {
        membership.source_list_item_id
        for membership in dataset.canon_memberships.values()
    }

    for canon_list in dataset.canon_lists.values():
        for item in canon_list.items:
            assert bool(item.work_id) != bool(item.resolution_note), item.id
            if item.work_id:
                assert item.id in mapped_item_ids, item.id


def test_every_membership_cites_its_source_item() -> None:
    dataset = _dataset()
    item_ids = {
        item.id for canon_list in dataset.canon_lists.values() for item in canon_list.items
    }

    for membership in dataset.canon_memberships.values():
        assert membership.source_list_item_id in item_ids
        assert membership.citations
        assert membership.canon_list_id in dataset.canon_lists


def test_witnesses_and_sources_have_required_provenance() -> None:
    dataset = _dataset()
    traditions = {witness.tradition for witness in dataset.witnesses.values()}

    assert {"septuagint", "masoretic", "samaritan", "geez", "new_testament"} <= traditions
    for witness in dataset.witnesses.values():
        assert witness.language.strip()
        assert witness.edition.strip()
        assert witness.citations
    for source in dataset.sources.values():
        assert source.license_status.strip()
        assert source.bibliographic_locator.strip()


def test_catalog_has_no_semantic_validation_errors() -> None:
    issues = validate_dataset(_dataset())

    assert [issue for issue in issues if issue.severity == "error"] == []
