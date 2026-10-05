"""Reference-model and evidence-aware lifespan overlap assessment."""

from __future__ import annotations

from .dates import HistoricalYear
from .models import OverlapResult, ResolvedLifespan


def _intersects(
    left_start: HistoricalYear,
    left_end: HistoricalYear,
    right_start: HistoricalYear,
    right_end: HistoricalYear,
) -> bool:
    return left_start <= right_end and right_start <= left_end


def assess_overlap(
    left: ResolvedLifespan, right: ResolvedLifespan
) -> OverlapResult:
    """Compare selected lifespans and their independently bounded evidence."""

    reference_overlap = _intersects(
        left.birth_year,
        left.death_year,
        right.birth_year,
        right.death_year,
    )

    ranges = (
        left.birth_range,
        left.death_range,
        right.birth_range,
        right.death_range,
    )
    if any(year_range is None for year_range in ranges):
        return OverlapResult(reference_overlap, "unknown")

    left_birth, left_death = left.birth_range, left.death_range
    right_birth, right_death = right.birth_range, right.death_range
    assert left_birth and left_death and right_birth and right_death

    left_guaranteed = (left_birth.latest, left_death.earliest)
    right_guaranteed = (right_birth.latest, right_death.earliest)
    left_guaranteed_exists = left_guaranteed[0] <= left_guaranteed[1]
    right_guaranteed_exists = right_guaranteed[0] <= right_guaranteed[1]
    if (
        left_guaranteed_exists
        and right_guaranteed_exists
        and _intersects(*left_guaranteed, *right_guaranteed)
    ):
        return OverlapResult(reference_overlap, "supported")

    left_possible = (left_birth.earliest, left_death.latest)
    right_possible = (right_birth.earliest, right_death.latest)
    if _intersects(*left_possible, *right_possible):
        return OverlapResult(reference_overlap, "possible")
    return OverlapResult(reference_overlap, "not_supported")
