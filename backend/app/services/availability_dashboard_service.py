from datetime import date

from app.models.availability import AvailabilityStatus
from app.repositories.availability_repository import AvailabilityRepository, AvailabilitySlotRepository
from app.schemas.availability import AvailabilityDashboard


class AvailabilityDashboardService:
    def __init__(self, days: AvailabilityRepository, slots: AvailabilitySlotRepository) -> None:
        self.days = days
        self.slots = slots

    async def for_range(self, venue_id, start: date, end: date, today: date | None = None) -> AvailabilityDashboard:
        today = today or date.today()
        counts = await self.days.count_by_status(venue_id, start, end)
        available = counts.get(AvailabilityStatus.AVAILABLE.value, 0)
        booked = counts.get(AvailabilityStatus.BOOKED.value, 0) + counts.get(
            AvailabilityStatus.PARTIALLY_BOOKED.value, 0
        )
        completed = counts.get(AvailabilityStatus.COMPLETED.value, 0)
        blocked = (
            counts.get(AvailabilityStatus.BLOCKED.value, 0)
            + counts.get(AvailabilityStatus.HOLIDAY.value, 0)
            + counts.get(AvailabilityStatus.CLOSED.value, 0)
        )
        denom = available + booked + completed
        occupancy = round(((booked + completed) / denom) * 100) if denom else 0
        todays = await self.slots.todays_booking_count(venue_id, today)
        return AvailabilityDashboard(
            available_days=available,
            booked_days=booked,
            completed_days=completed,
            blocked_days=blocked,
            occupancy_percent=occupancy,
            todays_bookings=todays,
        )
