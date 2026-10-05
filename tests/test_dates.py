import pytest

from bible_timeline.dates import HistoricalYear, add_years


@pytest.mark.parametrize("year", [0, -1])
def test_rejects_non_positive_public_year(year: int) -> None:
    with pytest.raises(ValueError, match="positive"):
        HistoricalYear("BCE", year)


@pytest.mark.parametrize(
    ("value", "ordinal"),
    [
        (HistoricalYear("BCE", 4004), -4003),
        (HistoricalYear("BCE", 1), 0),
        (HistoricalYear("CE", 1), 1),
        (HistoricalYear("CE", 2026), 2026),
    ],
)
def test_round_trips_bce_and_ce(value: HistoricalYear, ordinal: int) -> None:
    assert value.to_ordinal() == ordinal
    assert HistoricalYear.from_ordinal(ordinal) == value


def test_add_years_crosses_eras_without_year_zero() -> None:
    assert add_years(HistoricalYear("BCE", 1), 1) == HistoricalYear("CE", 1)
    assert add_years(HistoricalYear("CE", 1), -1) == HistoricalYear("BCE", 1)


def test_orders_older_bce_before_newer_dates() -> None:
    years = [
        HistoricalYear("CE", 1),
        HistoricalYear("BCE", 2),
        HistoricalYear("BCE", 1),
    ]

    assert sorted(years) == [
        HistoricalYear("BCE", 2),
        HistoricalYear("BCE", 1),
        HistoricalYear("CE", 1),
    ]
