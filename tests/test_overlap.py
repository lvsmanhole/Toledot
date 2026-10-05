from bible_timeline.dates import HistoricalYear
from bible_timeline.models import ResolvedLifespan, YearRange
from bible_timeline.overlap import assess_overlap


def y(year: int) -> HistoricalYear:
    return HistoricalYear("BCE", year)


def life(
    entity_id: str,
    birth: int,
    death: int,
    *,
    birth_range: tuple[int, int] | None = None,
    death_range: tuple[int, int] | None = None,
) -> ResolvedLifespan:
    return ResolvedLifespan(
        entity_id=entity_id,
        model_id="test",
        birth_year=y(birth),
        death_year=y(death),
        birth_range=(
            YearRange(y(birth_range[0]), y(birth_range[1])) if birth_range else None
        ),
        death_range=(
            YearRange(y(death_range[0]), y(death_range[1])) if death_range else None
        ),
        life_basis="calculated",
        confidence_grade="C",
        explanation="fixture",
        birth_derivation_id=f"{entity_id}-birth",
        death_derivation_id=f"{entity_id}-death",
    )


def test_reference_overlap_is_inclusive_of_same_year_boundary() -> None:
    result = assess_overlap(life("a", 100, 50), life("b", 50, 20))

    assert result.reference_overlap is True


def test_adjacent_reference_lifespans_do_not_overlap() -> None:
    result = assess_overlap(life("a", 100, 50), life("b", 49, 20))

    assert result.reference_overlap is False


def test_reference_overlap_can_have_only_possible_evidence_overlap() -> None:
    left = life(
        "a",
        110,
        70,
        birth_range=(120, 100),
        death_range=(80, 60),
    )
    right = life(
        "b",
        80,
        40,
        birth_range=(90, 70),
        death_range=(50, 30),
    )

    result = assess_overlap(left, right)

    assert result.reference_overlap is True
    assert result.evidenced_overlap == "possible"


def test_intersecting_guaranteed_alive_intervals_are_supported() -> None:
    left = life(
        "a",
        110,
        60,
        birth_range=(120, 100),
        death_range=(70, 50),
    )
    right = life(
        "b",
        90,
        40,
        birth_range=(100, 80),
        death_range=(50, 30),
    )

    assert assess_overlap(left, right).evidenced_overlap == "supported"


def test_disjoint_possible_alive_intervals_are_not_supported() -> None:
    left = life(
        "a",
        200,
        150,
        birth_range=(210, 190),
        death_range=(160, 140),
    )
    right = life(
        "b",
        100,
        50,
        birth_range=(110, 90),
        death_range=(60, 40),
    )

    assert assess_overlap(left, right).evidenced_overlap == "not_supported"


def test_missing_evidence_bounds_are_unknown() -> None:
    left = life("a", 100, 50)
    right = life(
        "b",
        80,
        40,
        birth_range=(90, 70),
        death_range=(50, 30),
    )

    assert assess_overlap(left, right).evidenced_overlap == "unknown"
