import uuid
from datetime import date

from fastapi import HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.availability import RecurrenceType, VenueAvailabilityBlock
from app.models.user import User
from app.repositories.availability_repository import (
    AvailabilityBlockRepository,
    AvailabilityLogRepository,
    AvailabilityRepository,
)
from app.schemas.availability import (
    BlockCreateRequest,
    BlockMutationResponse,
    BlockResponse,
    BlockUpdateRequest,
    MessageResponse,
)
from app.services.availability_generator_service import AvailabilityGeneratorService
from app.services.availability_validation_service import AvailabilityValidationService


class AvailabilityBlockService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.blocks = AvailabilityBlockRepository(db)
        self.days = AvailabilityRepository(db)
        self.logs = AvailabilityLogRepository(db)
        self.generator = AvailabilityGeneratorService(db)
        self.rules = AvailabilityValidationService()

    def to_response(self, row: VenueAvailabilityBlock) -> BlockResponse:
        weekdays = row.weekdays if isinstance(row.weekdays, list) else []
        return BlockResponse(
            id=row.id,
            venue_id=row.venue_id,
            start_date=row.start_date,
            end_date=row.end_date,
            slot_id=row.slot_id,
            food_slot_id=row.food_slot_id,
            reason=row.reason,
            notes=row.notes,
            recurrence_type=row.recurrence_type,
            recurrence_interval=row.recurrence_interval,
            weekdays=[int(w) for w in weekdays],
            nth_weekday=row.nth_weekday,
            recurrence_end_date=row.recurrence_end_date,
            is_active=row.is_active,
            created_at=row.created_at,
        )

    async def create(
        self, actor: User, venue_id: uuid.UUID, payload: BlockCreateRequest
    ) -> BlockMutationResponse:
        if payload.end_date < payload.start_date:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="End date must be on or after start date.",
            )
        row = VenueAvailabilityBlock(
            id=uuid.uuid4(),
            venue_id=venue_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            slot_id=payload.slot_id,
            food_slot_id=payload.food_slot_id,
            reason=payload.reason,
            notes=payload.notes,
            recurrence_type=payload.recurrence_type,
            recurrence_interval=payload.recurrence_interval,
            weekdays=payload.weekdays or [],
            nth_weekday=payload.nth_weekday,
            recurrence_end_date=payload.recurrence_end_date,
            created_by=actor.id,
        )
        await self.blocks.add(row)
        await self.generator.generate_for_venue(venue_id, performed_by=actor.id)
        day = await self.days.get_day(venue_id, payload.start_date)
        if day is not None:
            day.is_manual_override = True
            day.notes = payload.notes or day.notes
            await self.logs.add(
                availability_id=day.id,
                action="blocked",
                old_status=None,
                new_status=day.status,
                performed_by=actor.id,
                notes=payload.reason,
            )
        await self.db.commit()
        row = await self.blocks.get_by_id(row.id)
        assert row is not None
        return BlockMutationResponse(message="Availability blocked successfully.", block=self.to_response(row))

    async def update(self, actor: User, block_id: uuid.UUID, payload: BlockUpdateRequest) -> BlockMutationResponse:
        row = await self.blocks.get_by_id(block_id)
        if row is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Block not found.")
        data = payload.model_dump(exclude_unset=True)
        for key, value in data.items():
            setattr(row, key, value)
        if row.end_date < row.start_date:
            raise HTTPException(
                status_code=http_status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="End date must be on or after start date.",
            )
        await self.generator.generate_for_venue(row.venue_id, performed_by=actor.id)
        await self.db.commit()
        row = await self.blocks.get_by_id(row.id)
        assert row is not None
        return BlockMutationResponse(message="Block updated successfully.", block=self.to_response(row))

    async def delete(self, actor: User, block_id: uuid.UUID) -> MessageResponse:
        row = await self.blocks.get_by_id(block_id)
        if row is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Block not found.")
        venue_id = row.venue_id
        start = row.start_date
        if start < date.today() and row.recurrence_type == RecurrenceType.NONE.value:
            day = await self.days.get_day(venue_id, start)
            if day is not None:
                self.rules.assert_not_historical_delete(day)
        await self.blocks.soft_delete(row)
        await self.generator.generate_for_venue(venue_id, performed_by=actor.id)
        await self.db.commit()
        return MessageResponse(message="Block removed successfully.")
