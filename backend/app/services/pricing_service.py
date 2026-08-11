from __future__ import annotations

import uuid
from datetime import UTC, datetime, time
from decimal import Decimal

from fastapi import HTTPException, status as http_status
from sqlalchemy import inspect as sa_inspect
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.venue import Venue, VenueFoodSlot, VenuePricing, VenueSlot
from app.repositories.pricing_repository import (
    FoodSlotRepository,
    PricingRepository,
    SlotRepository,
)
from app.repositories.venue_owner_repository import VenueOwnerRepository
from app.repositories.venue_repository import VenueRepository
from app.schemas.pricing import (
    FoodSlotDetailResponse,
    FoodSlotMutationResponse,
    FoodSlotWriteRequest,
    MessageResponse,
    PricingDetailResponse,
    PricingMutationResponse,
    PricingPreviewQuery,
    PricingUpdateRequest,
    PricingWriteRequest,
    SlotDetailResponse,
    SlotMutationResponse,
    SlotWriteRequest,
    _as_uuid,
)
from app.schemas.venue import (
    BookingPreviewRequest,
    BookingPreviewResponse,
    PricingInput,
)
from app.services.booking_calculation_service import BookingCalculationService
from app.services.permission_service import DataScope, PermissionService
from app.services.pricing_validation import (
    FoodValidationService,
    PricingValidationService,
    SlotLike,
    SlotValidationService,
)
from app.utils.time_ranges import format_time_label, parse_time_range


def _slot_times(
    start: time | None,
    end: time | None,
    label: str | None,
) -> tuple[time | None, time | None, str | None]:
    parsed_start, parsed_end = parse_time_range(label)
    start = start or parsed_start
    end = end or parsed_end
    return start, end, format_time_label(start, end, label)


class PricingService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = PricingRepository(db)
        self.slots = SlotRepository(db)
        self.food_slots = FoodSlotRepository(db)
        self.venues = VenueRepository(db)
        self.owners = VenueOwnerRepository(db)
        self.permissions = PermissionService(db)
        self.calculator = BookingCalculationService()
        self.pricing_rules = PricingValidationService()
        self.slot_rules = SlotValidationService()
        self.food_rules = FoodValidationService()

    def _assert_staff(self, actor: User) -> None:
        if self.permissions.get_data_scope(actor) == DataScope.CUSTOMER_OWNED:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Customers cannot access venue pricing management.",
            )

    async def _vendor_owner_id(self, actor: User) -> uuid.UUID | None:
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return None
        if scope == DataScope.VENDOR_OWNED:
            owner = await self.owners.get_by_user_id(actor.id)
            if owner is None:
                raise HTTPException(
                    status_code=http_status.HTTP_403_FORBIDDEN,
                    detail="Venue owner profile is required to manage pricing.",
                )
            return owner.id
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access venue pricing.",
        )

    def _assert_venue_access(self, actor: User, venue: Venue) -> None:
        self._assert_staff(actor)
        scope = self.permissions.get_data_scope(actor)
        if scope == DataScope.ALL:
            return
        profile = venue.business_profile
        owner = profile.venue_owner if profile else None
        if owner is None or owner.user_id != actor.id:
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="You can only manage pricing for your own venues.",
            )

    async def _load_venue(self, actor: User, venue_id: uuid.UUID) -> Venue:
        venue = await self.venues.get_by_id(venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_venue_access(actor, venue)
        return venue

    async def sync_availability(
        self, venue_id: uuid.UUID, performed_by: uuid.UUID | None = None
    ) -> None:
        from app.services.availability_generator_service import AvailabilityGeneratorService

        await AvailabilityGeneratorService(self.db).generate_for_venue(
            venue_id, performed_by=performed_by
        )

    async def _commit_with_availability(
        self, venue_id: uuid.UUID, performed_by: uuid.UUID | None = None
    ) -> None:
        await self.sync_availability(venue_id, performed_by)
        await self.db.commit()

    async def _load_pricing(self, actor: User, pricing_id: uuid.UUID) -> VenuePricing:
        pricing = await self.repo.get_by_id(pricing_id)
        if pricing is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Pricing not found."
            )
        venue = pricing.venue or await self.venues.get_by_id(pricing.venue_id)
        if venue is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Venue not found."
            )
        self._assert_venue_access(actor, venue)
        return pricing

    def to_slot_response(self, slot: VenueSlot) -> SlotDetailResponse:
        return SlotDetailResponse(
            id=slot.id,
            key=slot.slot_key,
            name=slot.slot_name,
            enabled=slot.enabled,
            is_active=slot.enabled,
            time_label=slot.time_label,
            start_time=slot.start_time,
            end_time=slot.end_time,
            price=float(slot.slot_price),
            min_booking_amount=float(slot.min_booking_amount),
            max_guests=slot.max_guests,
            display_order=slot.display_order,
            extra=slot.extra or {},
        )

    def to_food_response(self, slot: VenueFoodSlot) -> FoodSlotDetailResponse:
        return FoodSlotDetailResponse(
            id=slot.id,
            key=slot.meal_key,
            name=slot.meal_name,
            enabled=slot.enabled,
            is_active=slot.enabled,
            time_label=slot.time_label,
            start_time=slot.start_time,
            end_time=slot.end_time,
            veg_plate_cost=float(slot.veg_plate_price),
            non_veg_plate_cost=float(slot.non_veg_plate_price),
            min_guests=slot.minimum_guests,
            max_guests=slot.maximum_guests,
            display_order=slot.display_order,
            extra=slot.extra or {},
        )

    def to_detail(self, pricing: VenuePricing | None) -> PricingDetailResponse:
        if pricing is None:
            return PricingDetailResponse()
        days = pricing.booking_window_days or 180
        return PricingDetailResponse(
            id=pricing.id,
            venue_id=pricing.venue_id,
            name=pricing.name,
            schedule_type=pricing.schedule_type,
            pricing_mode=pricing.pricing_mode,
            pricing_type=pricing.pricing_type,
            gst_percent=float(pricing.gst_percent),
            gst_mode=pricing.gst_mode,
            advance_percent=float(pricing.advance_percent),
            booking_window_days=days,
            booking_window_months=max(1, round(days / 30)),
            minimum_notice_hours=pricing.minimum_notice_hours,
            operating_hours=pricing.operating_hours,
            operating_start_time=pricing.operating_start_time,
            operating_end_time=pricing.operating_end_time,
            booking_confirmation=pricing.booking_confirmation,
            cancellation_preset=pricing.cancellation_preset,
            valid_from=pricing.valid_from,
            valid_to=pricing.valid_to,
            is_active=pricing.is_active,
            extra=pricing.extra or {},
            created_at=pricing.created_at,
            updated_at=pricing.updated_at,
            slots=[
                self.to_slot_response(s)
                for s in sorted(pricing.slots or [], key=lambda x: x.display_order)
                if s.deleted_at is None
            ],
            food_slots=[
                self.to_food_response(s)
                for s in sorted(pricing.food_slots or [], key=lambda x: x.display_order)
                if s.deleted_at is None
            ],
        )

    def _validate_payload(
        self,
        *,
        pricing_mode: str,
        pricing_type: str,
        gst_percent: Decimal,
        advance_percent: Decimal,
        operating_start: time | None,
        operating_end: time | None,
        slots: list[SlotLike],
        food_slots: list[SlotLike],
        require_positive_price: bool,
    ) -> None:
        self.pricing_rules.validate_rates(
            gst_percent=gst_percent, advance_percent=advance_percent
        )
        self.pricing_rules.validate_operating_hours(operating_start, operating_end)
        if pricing_type == "venue_only":
            self.slot_rules.validate_collection(
                slots,
                pricing_mode=pricing_mode,
                require_positive_price=require_positive_price,
            )
        else:
            self.food_rules.validate_collection(
                food_slots, require_positive_price=require_positive_price
            )

    def _sync_operating_clocks(
        self,
        pricing: VenuePricing,
        *,
        operating_hours: str | None,
        operating_start: time | None,
        operating_end: time | None,
    ) -> None:
        start, end, label = _slot_times(operating_start, operating_end, operating_hours)
        pricing.operating_start_time = start
        pricing.operating_end_time = end
        pricing.operating_hours = label or operating_hours

    def _slot_like_from_write(self, item: SlotWriteRequest) -> SlotLike:
        return SlotLike(
            name=item.name,
            enabled=item.enabled,
            start_time=item.start_time,
            end_time=item.end_time,
            time_label=item.time_label,
            price=item.price,
        )

    def _food_like_from_write(self, item: FoodSlotWriteRequest) -> SlotLike:
        return SlotLike(
            name=item.name,
            enabled=item.enabled,
            start_time=item.start_time,
            end_time=item.end_time,
            time_label=item.time_label,
            veg_price=item.veg_plate_cost,
            non_veg_price=item.non_veg_plate_cost,
            min_guests=item.min_guests,
            max_guests=item.max_guests,
        )

    def _apply_slot_fields(self, slot: VenueSlot, item: SlotWriteRequest, order: int) -> None:
        start, end, label = _slot_times(item.start_time, item.end_time, item.time_label)
        slot.slot_key = item.key or "custom"
        slot.slot_name = item.name
        slot.start_time = start
        slot.end_time = end
        slot.time_label = label
        slot.slot_price = item.price
        slot.min_booking_amount = item.min_booking_amount
        slot.max_guests = item.max_guests
        slot.enabled = item.enabled
        slot.display_order = item.display_order if item.display_order is not None else order
        slot.extra = item.extra or {}

    def _apply_food_fields(
        self, slot: VenueFoodSlot, item: FoodSlotWriteRequest, order: int
    ) -> None:
        start, end, label = _slot_times(item.start_time, item.end_time, item.time_label)
        slot.meal_key = item.key or "custom"
        slot.meal_name = item.name
        slot.start_time = start
        slot.end_time = end
        slot.time_label = label
        slot.veg_plate_price = item.veg_plate_cost
        slot.non_veg_plate_price = item.non_veg_plate_cost
        slot.minimum_guests = item.min_guests
        slot.maximum_guests = item.max_guests
        slot.enabled = item.enabled
        slot.display_order = item.display_order if item.display_order is not None else order
        slot.extra = item.extra or {}

    def _loaded_items(self, obj, attr: str) -> list:
        if attr in sa_inspect(obj).unloaded:
            return []
        return list(getattr(obj, attr) or [])

    def _upsert_slots(
        self,
        pricing: VenuePricing,
        incoming: list[SlotWriteRequest],
    ) -> None:
        existing = [s for s in self._loaded_items(pricing, "slots") if s.deleted_at is None]
        by_id = {s.id: s for s in existing}
        by_key = {s.slot_key: s for s in existing}
        keep: set[uuid.UUID] = set()
        seen_keys: set[str] = set()
        for idx, item in enumerate(incoming):
            key = (item.key or "custom").strip() or "custom"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            current = by_key.get(key)
            if current is None and item.id:
                current = by_id.get(item.id)
            if current is None:
                if pricing.id is None:
                    pricing.id = uuid.uuid4()
                current = VenueSlot(id=uuid.uuid4(), venue_pricing_id=pricing.id)
                self.db.add(current)
            self._apply_slot_fields(current, item, idx)
            keep.add(current.id)
            by_id[current.id] = current
            by_key[current.slot_key] = current
        for slot in existing:
            if slot.id not in keep:
                slot.deleted_at = datetime.now(UTC)
                slot.enabled = False

    def _upsert_food_slots(
        self,
        pricing: VenuePricing,
        incoming: list[FoodSlotWriteRequest],
    ) -> None:
        existing = [
            s for s in self._loaded_items(pricing, "food_slots") if s.deleted_at is None
        ]
        by_id = {s.id: s for s in existing}
        by_key = {s.meal_key: s for s in existing}
        keep: set[uuid.UUID] = set()
        seen_keys: set[str] = set()
        for idx, item in enumerate(incoming):
            key = (item.key or "custom").strip() or "custom"
            if key in seen_keys:
                continue
            seen_keys.add(key)
            current = by_key.get(key)
            if current is None and item.id:
                current = by_id.get(item.id)
            if current is None:
                if pricing.id is None:
                    pricing.id = uuid.uuid4()
                current = VenueFoodSlot(id=uuid.uuid4(), venue_pricing_id=pricing.id)
                self.db.add(current)
            self._apply_food_fields(current, item, idx)
            keep.add(current.id)
            by_id[current.id] = current
            by_key[current.meal_key] = current
        for slot in existing:
            if slot.id not in keep:
                slot.deleted_at = datetime.now(UTC)
                slot.enabled = False

    def apply_nested(
        self,
        venue: Venue,
        payload: PricingInput,
        *,
        actor_id: uuid.UUID | None = None,
        require_positive_price: bool = False,
    ) -> VenuePricing:
        slots = [
            SlotWriteRequest(
                id=_as_uuid(getattr(s, "id", None)),
                key=s.key,
                name=s.name,
                enabled=s.enabled,
                time_label=s.time_label,
                price=s.price,
                min_booking_amount=s.min_booking_amount,
                max_guests=s.max_guests,
                display_order=s.display_order,
            )
            for s in payload.slots
        ]
        if payload.pricing_mode == "full_day":
            preferred = [s for s in slots if (s.key or "").strip() == "full_day"]
            slots = preferred or slots[:1]
        else:
            without_full = [s for s in slots if (s.key or "").strip() != "full_day"]
            slots = without_full or slots
        foods = [
            FoodSlotWriteRequest(
                id=_as_uuid(getattr(s, "id", None)),
                key=s.key,
                name=s.name,
                enabled=s.enabled,
                time_label=s.time_label,
                veg_plate_cost=s.veg_plate_cost,
                non_veg_plate_cost=s.non_veg_plate_cost,
                min_guests=s.min_guests,
                max_guests=s.max_guests,
                display_order=s.display_order,
            )
            for s in payload.food_slots
        ]
        start, end, _ = _slot_times(None, None, payload.operating_hours)
        self._validate_payload(
            pricing_mode=payload.pricing_mode,
            pricing_type=payload.pricing_type,
            gst_percent=payload.gst_percent,
            advance_percent=payload.advance_percent,
            operating_start=start,
            operating_end=end,
            slots=[self._slot_like_from_write(s) for s in slots],
            food_slots=[self._food_like_from_write(s) for s in foods],
            require_positive_price=require_positive_price,
        )
        pricing = venue.active_pricing()
        if pricing is None:
            pricing = VenuePricing(
                id=uuid.uuid4(),
                venue_id=venue.id,
                created_by=actor_id,
            )
            venue.pricing_records.append(pricing)
        pricing.pricing_mode = payload.pricing_mode
        pricing.pricing_type = payload.pricing_type
        pricing.gst_percent = payload.gst_percent
        pricing.gst_mode = payload.gst_mode
        pricing.advance_percent = payload.advance_percent
        pricing.booking_window_days = payload.booking_window_days
        pricing.minimum_notice_hours = payload.minimum_notice_hours
        pricing.booking_confirmation = payload.booking_confirmation
        pricing.cancellation_preset = payload.cancellation_preset
        pricing.is_active = True
        pricing.updated_by = actor_id
        self._sync_operating_clocks(
            pricing,
            operating_hours=payload.operating_hours,
            operating_start=None,
            operating_end=None,
        )
        self._upsert_slots(pricing, slots)
        self._upsert_food_slots(pricing, foods)
        return pricing

    def _apply_header(self, pricing: VenuePricing, payload: PricingWriteRequest | PricingUpdateRequest) -> None:
        data = payload.model_dump(exclude_unset=True, exclude={"slots", "food_slots", "booking_window_months"})
        if "booking_window_days" in data and data["booking_window_days"] is not None:
            pricing.booking_window_days = data["booking_window_days"]
        for key in (
            "name",
            "schedule_type",
            "pricing_mode",
            "pricing_type",
            "gst_percent",
            "gst_mode",
            "advance_percent",
            "minimum_notice_hours",
            "booking_confirmation",
            "cancellation_preset",
            "valid_from",
            "valid_to",
            "is_active",
            "extra",
        ):
            if key in data and data[key] is not None:
                setattr(pricing, key, data[key])
        self._sync_operating_clocks(
            pricing,
            operating_hours=data.get("operating_hours", pricing.operating_hours),
            operating_start=data.get("operating_start_time", pricing.operating_start_time),
            operating_end=data.get("operating_end_time", pricing.operating_end_time),
        )

    async def get_venue_pricing(self, actor: User, venue_id: uuid.UUID) -> PricingDetailResponse:
        venue = await self._load_venue(actor, venue_id)
        return self.to_detail(venue.active_pricing())

    async def get_pricing(self, actor: User, pricing_id: uuid.UUID) -> PricingDetailResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        return self.to_detail(pricing)

    async def create_venue_pricing(
        self, actor: User, venue_id: uuid.UUID, payload: PricingWriteRequest
    ) -> PricingMutationResponse:
        venue = await self._load_venue(actor, venue_id)
        slots = payload.slots or []
        foods = payload.food_slots or []
        start, end, _ = _slot_times(
            payload.operating_start_time, payload.operating_end_time, payload.operating_hours
        )
        self._validate_payload(
            pricing_mode=payload.pricing_mode,
            pricing_type=payload.pricing_type,
            gst_percent=payload.gst_percent,
            advance_percent=payload.advance_percent,
            operating_start=start,
            operating_end=end,
            slots=[self._slot_like_from_write(s) for s in slots],
            food_slots=[self._food_like_from_write(s) for s in foods],
            require_positive_price=True,
        )
        if payload.is_active:
            for existing in venue.pricing_records:
                if existing.deleted_at is None and existing.schedule_type == payload.schedule_type:
                    existing.is_active = False
        pricing = VenuePricing(
            id=uuid.uuid4(),
            venue_id=venue.id,
            created_by=actor.id,
            updated_by=actor.id,
        )
        self._apply_header(pricing, payload)
        venue.pricing_records.append(pricing)
        await self.db.flush()
        self._upsert_slots(pricing, slots)
        self._upsert_food_slots(pricing, foods)
        await self._commit_with_availability(venue.id, actor.id)
        pricing = await self.repo.get_by_id(pricing.id)
        assert pricing is not None
        return PricingMutationResponse(
            message="Pricing created successfully.",
            pricing=self.to_detail(pricing),
        )

    async def update_pricing(
        self, actor: User, pricing_id: uuid.UUID, payload: PricingUpdateRequest
    ) -> PricingMutationResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        merged_mode = payload.pricing_mode or pricing.pricing_mode
        merged_type = payload.pricing_type or pricing.pricing_type
        gst = payload.gst_percent if payload.gst_percent is not None else pricing.gst_percent
        advance = (
            payload.advance_percent
            if payload.advance_percent is not None
            else pricing.advance_percent
        )
        start, end, _ = _slot_times(
            payload.operating_start_time or pricing.operating_start_time,
            payload.operating_end_time or pricing.operating_end_time,
            payload.operating_hours or pricing.operating_hours,
        )
        slot_writes = payload.slots
        food_writes = payload.food_slots
        slot_likes = (
            [self._slot_like_from_write(s) for s in slot_writes]
            if slot_writes is not None
            else [
                SlotLike(
                    name=s.slot_name,
                    enabled=s.enabled,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    time_label=s.time_label,
                    price=s.slot_price,
                )
                for s in pricing.slots
                if s.deleted_at is None
            ]
        )
        food_likes = (
            [self._food_like_from_write(s) for s in food_writes]
            if food_writes is not None
            else [
                SlotLike(
                    name=s.meal_name,
                    enabled=s.enabled,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    time_label=s.time_label,
                    veg_price=s.veg_plate_price,
                    non_veg_price=s.non_veg_plate_price,
                    min_guests=s.minimum_guests,
                    max_guests=s.maximum_guests,
                )
                for s in pricing.food_slots
                if s.deleted_at is None
            ]
        )
        self._validate_payload(
            pricing_mode=merged_mode,
            pricing_type=merged_type,
            gst_percent=gst,
            advance_percent=advance,
            operating_start=start,
            operating_end=end,
            slots=slot_likes,
            food_slots=food_likes,
            require_positive_price=True,
        )
        self._apply_header(pricing, payload)
        pricing.updated_by = actor.id
        if slot_writes is not None:
            self._upsert_slots(pricing, slot_writes)
        if food_writes is not None:
            self._upsert_food_slots(pricing, food_writes)
        await self._commit_with_availability(pricing.venue_id, actor.id)
        pricing = await self.repo.get_by_id(pricing.id)
        assert pricing is not None
        return PricingMutationResponse(
            message="Pricing updated successfully.",
            pricing=self.to_detail(pricing),
        )

    async def delete_pricing(self, actor: User, pricing_id: uuid.UUID) -> MessageResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        await self.repo.soft_delete(pricing)
        await self._commit_with_availability(pricing.venue_id, actor.id)
        return MessageResponse(message="Pricing deleted successfully.")

    async def create_slot(
        self, actor: User, pricing_id: uuid.UUID, payload: SlotWriteRequest
    ) -> SlotMutationResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        existing = [
            SlotLike(
                name=s.slot_name,
                enabled=s.enabled,
                start_time=s.start_time,
                end_time=s.end_time,
                time_label=s.time_label,
                price=s.slot_price,
            )
            for s in pricing.slots
            if s.deleted_at is None
        ]
        existing.append(self._slot_like_from_write(payload))
        self.slot_rules.validate_collection(
            existing, pricing_mode=pricing.pricing_mode, require_positive_price=True
        )
        slot = VenueSlot(venue_pricing_id=pricing.id)
        order = await self.slots.next_display_order(pricing.id)
        self._apply_slot_fields(slot, payload, order)
        await self.slots.add(slot)
        pricing.updated_by = actor.id
        await self._commit_with_availability(pricing.venue_id, actor.id)
        slot = await self.slots.get_by_id(slot.id)
        assert slot is not None
        return SlotMutationResponse(message="Slot created successfully.", slot=self.to_slot_response(slot))

    async def update_slot(
        self, actor: User, slot_id: uuid.UUID, payload: SlotWriteRequest
    ) -> SlotMutationResponse:
        slot = await self.slots.get_by_id(slot_id)
        if slot is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Slot not found.")
        pricing = slot.pricing
        self._assert_venue_access(actor, pricing.venue)
        others = [
            SlotLike(
                name=s.slot_name,
                enabled=s.enabled,
                start_time=s.start_time,
                end_time=s.end_time,
                time_label=s.time_label,
                price=s.slot_price,
            )
            for s in pricing.slots
            if s.deleted_at is None and s.id != slot.id
        ]
        others.append(self._slot_like_from_write(payload))
        self.slot_rules.validate_collection(
            others, pricing_mode=pricing.pricing_mode, require_positive_price=True
        )
        self._apply_slot_fields(slot, payload, slot.display_order)
        pricing.updated_by = actor.id
        await self._commit_with_availability(pricing.venue_id, actor.id)
        slot = await self.slots.get_by_id(slot.id)
        assert slot is not None
        return SlotMutationResponse(message="Slot updated successfully.", slot=self.to_slot_response(slot))

    async def delete_slot(self, actor: User, slot_id: uuid.UUID) -> MessageResponse:
        slot = await self.slots.get_by_id(slot_id)
        if slot is None:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Slot not found.")
        self._assert_venue_access(actor, slot.pricing.venue)
        venue_id = slot.pricing.venue_id
        await self.slots.soft_delete(slot)
        await self._commit_with_availability(venue_id, actor.id)
        return MessageResponse(message="Slot deleted successfully.")

    async def create_food_slot(
        self, actor: User, pricing_id: uuid.UUID, payload: FoodSlotWriteRequest
    ) -> FoodSlotMutationResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        existing = [
            SlotLike(
                name=s.meal_name,
                enabled=s.enabled,
                start_time=s.start_time,
                end_time=s.end_time,
                time_label=s.time_label,
                veg_price=s.veg_plate_price,
                non_veg_price=s.non_veg_plate_price,
                min_guests=s.minimum_guests,
                max_guests=s.maximum_guests,
            )
            for s in pricing.food_slots
            if s.deleted_at is None
        ]
        existing.append(self._food_like_from_write(payload))
        self.food_rules.validate_collection(existing, require_positive_price=True)
        slot = VenueFoodSlot(venue_pricing_id=pricing.id)
        order = await self.food_slots.next_display_order(pricing.id)
        self._apply_food_fields(slot, payload, order)
        await self.food_slots.add(slot)
        pricing.updated_by = actor.id
        await self._commit_with_availability(pricing.venue_id, actor.id)
        slot = await self.food_slots.get_by_id(slot.id)
        assert slot is not None
        return FoodSlotMutationResponse(
            message="Food slot created successfully.",
            food_slot=self.to_food_response(slot),
        )

    async def update_food_slot(
        self, actor: User, food_slot_id: uuid.UUID, payload: FoodSlotWriteRequest
    ) -> FoodSlotMutationResponse:
        slot = await self.food_slots.get_by_id(food_slot_id)
        if slot is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Food slot not found."
            )
        pricing = slot.pricing
        self._assert_venue_access(actor, pricing.venue)
        others = [
            SlotLike(
                name=s.meal_name,
                enabled=s.enabled,
                start_time=s.start_time,
                end_time=s.end_time,
                time_label=s.time_label,
                veg_price=s.veg_plate_price,
                non_veg_price=s.non_veg_plate_price,
                min_guests=s.minimum_guests,
                max_guests=s.maximum_guests,
            )
            for s in pricing.food_slots
            if s.deleted_at is None and s.id != slot.id
        ]
        others.append(self._food_like_from_write(payload))
        self.food_rules.validate_collection(others, require_positive_price=True)
        self._apply_food_fields(slot, payload, slot.display_order)
        pricing.updated_by = actor.id
        await self._commit_with_availability(pricing.venue_id, actor.id)
        slot = await self.food_slots.get_by_id(slot.id)
        assert slot is not None
        return FoodSlotMutationResponse(
            message="Food slot updated successfully.",
            food_slot=self.to_food_response(slot),
        )

    async def delete_food_slot(self, actor: User, food_slot_id: uuid.UUID) -> MessageResponse:
        slot = await self.food_slots.get_by_id(food_slot_id)
        if slot is None:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND, detail="Food slot not found."
            )
        self._assert_venue_access(actor, slot.pricing.venue)
        venue_id = slot.pricing.venue_id
        await self.food_slots.soft_delete(slot)
        await self._commit_with_availability(venue_id, actor.id)
        return MessageResponse(message="Food slot deleted successfully.")

    def preview_from_pricing(
        self,
        pricing: VenuePricing,
        payload: BookingPreviewRequest | PricingPreviewQuery,
    ) -> BookingPreviewResponse:
        venue_price = Decimal("0")
        food_total = Decimal("0")
        if pricing.pricing_type == "venue_only":
            slots = [s for s in pricing.slots if s.enabled and s.deleted_at is None]
            slot = None
            slot_id = getattr(payload, "slot_id", None)
            slot_key = getattr(payload, "slot_key", None)
            if slot_id:
                slot = next((s for s in slots if s.id == slot_id), None)
            if slot is None and slot_key:
                slot = next((s for s in slots if s.slot_key == slot_key), None)
            if slot is None and pricing.pricing_mode == "full_day":
                slot = next((s for s in slots if s.slot_key == "full_day"), None)
            if slot is None and slots:
                slot = slots[0]
            if slot:
                venue_price = slot.slot_price
            summary = (
                self.calculator.calculate_full_day(
                    venue_price,
                    gst_percent=pricing.gst_percent,
                    advance_percent=pricing.advance_percent,
                )
                if pricing.pricing_mode == "full_day"
                else self.calculator.calculate_slot(
                    venue_price,
                    gst_percent=pricing.gst_percent,
                    advance_percent=pricing.advance_percent,
                )
            )
        else:
            foods = [s for s in pricing.food_slots if s.enabled and s.deleted_at is None]
            meal = None
            food_id = getattr(payload, "food_slot_id", None)
            meal_key = getattr(payload, "food_meal_key", None)
            if food_id:
                meal = next((s for s in foods if s.id == food_id), None)
            if meal is None and meal_key:
                meal = next((s for s in foods if s.meal_key == meal_key), None)
            if meal is None and foods:
                meal = foods[0]
            plate = Decimal("0")
            guests = getattr(payload, "guests", 100) or 100
            plate_type = getattr(payload, "plate_type", "veg")
            if meal:
                plate = (
                    meal.veg_plate_price
                    if plate_type == "veg"
                    else meal.non_veg_plate_price
                )
            summary = self.calculator.calculate_food(
                plate,
                guests,
                gst_percent=pricing.gst_percent,
                advance_percent=pricing.advance_percent,
            )
            food_total = summary.food_total
        return BookingPreviewResponse(
            venue_price=float(summary.venue_price),
            food_total=float(summary.food_total if pricing.pricing_type != "venue_only" else food_total),
            subtotal=float(summary.subtotal),
            gst_extra=float(summary.gst_extra),
            booking_total=float(summary.booking_total),
            advance_payable=float(summary.advance_payable),
            platform_commission=float(summary.platform_commission),
            vendor_receivable=float(summary.vendor_receivable),
            remaining_balance=float(summary.remaining_balance),
            gst_percent=float(summary.gst_percent),
            advance_percent=float(summary.advance_percent),
            platform_commission_percent=float(summary.platform_commission_percent),
        )

    async def preview_pricing(
        self,
        actor: User,
        pricing_id: uuid.UUID,
        payload: PricingPreviewQuery,
    ) -> BookingPreviewResponse:
        pricing = await self._load_pricing(actor, pricing_id)
        return self.preview_from_pricing(pricing, payload)

    def validate_booking_request(
        self,
        pricing: VenuePricing,
        *,
        start_at: datetime,
        now: datetime | None = None,
    ) -> None:
        """Used by the future customer booking engine."""
        self.pricing_rules.validate_booking_window(
            start_at=start_at,
            operating_start=pricing.operating_start_time,
            operating_end=pricing.operating_end_time,
            minimum_notice_hours=pricing.minimum_notice_hours,
            booking_window_days=pricing.booking_window_days,
            now=now,
        )

    async def preview_venue(
        self,
        actor: User,
        venue_id: uuid.UUID,
        payload: BookingPreviewRequest,
    ) -> BookingPreviewResponse:
        venue = await self._load_venue(actor, venue_id)
        pricing = venue.active_pricing()
        if pricing is None:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Venue pricing is not configured.",
            )
        return self.preview_from_pricing(pricing, payload)
