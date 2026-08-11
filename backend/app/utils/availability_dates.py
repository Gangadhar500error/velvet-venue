from calendar import monthrange
from datetime import date, timedelta

from app.models.availability import RecurrenceType, VenueAvailabilityBlock

WEEKDAY_NAMES = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


def iter_dates(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


def month_bounds(year: int, month: int) -> tuple[date, date]:
    return date(year, month, 1), date(year, month, monthrange(year, month)[1])


def parse_weekly_off(value: str | None) -> set[int]:
    if not value:
        return set()
    off: set[int] = set()
    for part in value.replace("/", ",").split(","):
        key = part.strip().lower()
        if not key or key in {"none", "nil", "-"}:
            continue
        if key in WEEKDAY_NAMES:
            off.add(WEEKDAY_NAMES[key])
    return off


def nth_weekday_of_month(year: int, month: int, weekday: int, nth: int) -> date | None:
    first = date(year, month, 1)
    offset = (weekday - first.weekday()) % 7
    day = 1 + offset + (nth - 1) * 7
    last = monthrange(year, month)[1]
    if day > last:
        return None
    return date(year, month, day)


def block_matches_date(block: VenueAvailabilityBlock, target: date) -> bool:
    if not block.is_active or block.deleted_at is not None:
        return False
    rtype = (block.recurrence_type or RecurrenceType.NONE.value).lower()
    interval = max(int(block.recurrence_interval or 1), 1)
    if rtype in {"", RecurrenceType.NONE.value}:
        return block.start_date <= target <= block.end_date

    until = block.recurrence_end_date or block.end_date
    if target < block.start_date or (until and target > until):
        return False

    weekdays = block.weekdays if isinstance(block.weekdays, list) else []
    weekdays = [int(w) for w in weekdays] if weekdays else [block.start_date.weekday()]

    if rtype == RecurrenceType.WEEKLY.value:
        if target.weekday() not in weekdays:
            return False
        weeks = (target - block.start_date).days // 7
        return weeks % interval == 0

    if rtype == RecurrenceType.MONTHLY.value:
        months = (target.year - block.start_date.year) * 12 + (
            target.month - block.start_date.month
        )
        if months < 0 or months % interval != 0:
            return False
        if block.nth_weekday:
            expected = nth_weekday_of_month(
                target.year, target.month, weekdays[0], block.nth_weekday
            )
            return expected == target
        return target.day == block.start_date.day

    if rtype == RecurrenceType.YEARLY.value:
        years = target.year - block.start_date.year
        if years < 0 or years % interval != 0:
            return False
        return target.month == block.start_date.month and target.day == block.start_date.day

    return False
