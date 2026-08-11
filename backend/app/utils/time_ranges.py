"""Parse and compare venue slot / operating-hour clocks."""

from __future__ import annotations

import re
from datetime import time

_RANGE_SPLIT = re.compile(r"\s*(?:-|–|—|to)\s*", re.IGNORECASE)
_CLOCK = re.compile(
    r"^\s*(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?\s*$",
    re.IGNORECASE,
)


def parse_clock(value: str | None) -> time | None:
    if not value:
        return None
    match = _CLOCK.match(value.strip())
    if not match:
        return None
    hour = int(match.group(1))
    minute = int(match.group(2) or 0)
    second = int(match.group(3) or 0)
    meridiem = (match.group(4) or "").upper()
    if meridiem:
        if hour == 12:
            hour = 0 if meridiem == "AM" else 12
        elif meridiem == "PM":
            hour += 12
    if hour > 23 or minute > 59 or second > 59:
        return None
    return time(hour=hour, minute=minute, second=second)


def parse_time_range(label: str | None) -> tuple[time | None, time | None]:
    if not label or not label.strip():
        return None, None
    parts = _RANGE_SPLIT.split(label.strip(), maxsplit=1)
    if len(parts) != 2:
        return None, None
    return parse_clock(parts[0]), parse_clock(parts[1])


def format_clock(value: time) -> str:
    hour = value.hour % 12 or 12
    meridiem = "AM" if value.hour < 12 else "PM"
    return f"{hour}:{value.minute:02d} {meridiem}"


def format_time_label(
    start: time | None,
    end: time | None,
    fallback: str | None = None,
) -> str | None:
    if start and end:
        return f"{format_clock(start)} - {format_clock(end)}"
    return fallback


def to_minutes(value: time) -> int:
    return value.hour * 60 + value.minute


def ranges_overlap(a_start: time, a_end: time, b_start: time, b_end: time) -> bool:
    return to_minutes(a_start) < to_minutes(b_end) and to_minutes(b_start) < to_minutes(a_end)
