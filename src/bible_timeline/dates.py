"""Unambiguous historical-year representation and arithmetic."""

from __future__ import annotations

from dataclasses import dataclass
from functools import total_ordering
from typing import Literal

Era = Literal["BCE", "CE"]


@total_ordering
@dataclass(frozen=True)
class HistoricalYear:
    """A public BCE/CE year, neither of which permits year zero."""

    era: Era
    year: int

    def __post_init__(self) -> None:
        if self.era not in ("BCE", "CE"):
            raise ValueError("era must be BCE or CE")
        if not isinstance(self.year, int) or self.year <= 0:
            raise ValueError("public year must be a positive integer")

    def to_ordinal(self) -> int:
        """Return an astronomical ordinal suitable for arithmetic."""

        if self.era == "BCE":
            return 1 - self.year
        return self.year

    @classmethod
    def from_ordinal(cls, value: int) -> HistoricalYear:
        """Create a public year from an astronomical ordinal."""

        if value <= 0:
            return cls("BCE", 1 - value)
        return cls("CE", value)

    def __lt__(self, other: object) -> bool:
        if not isinstance(other, HistoricalYear):
            return NotImplemented
        return self.to_ordinal() < other.to_ordinal()


def add_years(value: HistoricalYear, delta: int) -> HistoricalYear:
    """Shift a historical year while skipping public year zero."""

    return HistoricalYear.from_ordinal(value.to_ordinal() + delta)
