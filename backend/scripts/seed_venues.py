"""Seed venue masters and sample venues."""

from decimal import Decimal

from sqlalchemy import func, select

from app.core.logging import get_logger
from app.models.business_profile import BusinessProfile, BusinessProfileStatus
from app.models.venue import (
    Venue,
    VenueAmenityMapping,
    VenueDocument,
    VenueEventMapping,
    VenueFoodSlot,
    VenueGalleryItem,
    VenuePricing,
    VenueServiceMapping,
    VenueSlot,
    VenueStatus,
)
from app.repositories.venue_repository import VenueRepository
from app.services.venue_service import DOCUMENT_SLOTS

logger = get_logger(__name__)

AMENITIES = [
    "Parking",
    "AC",
    "Power Backup",
    "WiFi",
    "Bridal Room",
    "Dining Hall",
    "Stage",
    "Decoration",
    "Music",
    "DJ",
    "Catering",
    "Projector",
    "Swimming Pool",
    "Garden",
    "Valet Parking",
    "Wheelchair Access",
    "Kids Area",
]

SERVICES = [
    "Decorations",
    "Photography",
    "DJ",
    "Generator",
    "Parking",
    "Valet",
    "Projector",
    "Flower Decorations",
]

EVENT_TYPES = [
    "Wedding",
    "Reception",
    "Birthday",
    "Corporate",
    "Engagement",
    "Conference",
    "Anniversary",
    "Sangeet",
]

CITIES = ["Hyderabad", "Karimnagar", "Warangal", "Secunderabad", "Nizamabad"]
CATEGORIES = ["Banquet Hall", "Lawn", "Farmhouse", "Resort", "Hotel Ballroom"]
TYPES = ["Indoor", "Outdoor", "Indoor + Outdoor"]


async def seed_venues(session) -> None:
    repo = VenueRepository(session)

    for idx, name in enumerate(AMENITIES):
        a = await repo.get_or_create_amenity(name)
        a.display_order = idx
    for idx, name in enumerate(SERVICES):
        s = await repo.get_or_create_service(name)
        s.display_order = idx
    for idx, name in enumerate(EVENT_TYPES):
        e = await repo.get_or_create_event_type(name)
        e.display_order = idx
    await session.flush()
    logger.info("Venue masters seeded")

    existing = int(
        (await session.execute(select(func.count()).select_from(Venue))).scalar_one() or 0
    )
    if existing >= 40:
        logger.info("Venues already seeded, skipped samples")
        return

    profiles = list(
        (
            await session.execute(
                select(BusinessProfile).where(
                    BusinessProfile.deleted_at.is_(None),
                    BusinessProfile.status != BusinessProfileStatus.DELETED.value,
                )
            )
        ).scalars().all()
    )
    if not profiles:
        logger.info("No business profiles available for venue seed")
        return

    target = 50
    to_create = max(0, target - existing)
    created = 0
    for i in range(existing, existing + to_create):
        profile = profiles[i % len(profiles)]
        city = CITIES[i % len(CITIES)]
        category = CATEGORIES[i % len(CATEGORIES)]
        venue_type = TYPES[i % len(TYPES)]
        name = f"{profile.business_name.split()[0]} {category} {i + 1}"

        venue = Venue(
            tenant_id=profile.tenant_id,
            business_profile_id=profile.id,
            venue_code=await repo.next_venue_code(),
            venue_name=name,
            category=category,
            venue_type=venue_type,
            short_description=f"Premium {category.lower()} in {city}.",
            description=f"{name} offers elegant spaces for weddings and celebrations.",
            house_rules="No outside alcohol without prior approval. Music till 11 PM.",
            featured=i % 3 == 0,
            address_line1=f"{10 + i}, Jubilee Hills Road",
            city=city,
            state="Telangana",
            country="India",
            postal_code="5000" + str(i % 10) + "1",
            landmark="Near City Center",
            minimum_guests=50,
            maximum_guests=300 + i * 20,
            seating_capacity=200 + i * 15,
            dining_capacity=180 + i * 10,
            venue_status=VenueStatus.PUBLISHED.value if i % 2 == 0 else VenueStatus.PENDING.value,
            approval_status="approved" if i % 2 == 0 else "pending",
            availability_status="available",
            operating_hours="09:00 AM - 11:00 PM",
            support_email=profile.support_email,
            support_phone=profile.support_phone,
            cover_image_url=f"https://picsum.photos/seed/venue{i}/800/600",
        )
        await repo.create(venue)

        for amenity_name in AMENITIES[: 5 + (i % 4)]:
            amenity = await repo.get_or_create_amenity(amenity_name)
            venue.amenity_links.append(VenueAmenityMapping(amenity_id=amenity.id))
        for service_name in SERVICES[: 3 + (i % 3)]:
            service = await repo.get_or_create_service(service_name)
            venue.service_links.append(VenueServiceMapping(service_id=service.id))
        for event_name in EVENT_TYPES[: 3 + (i % 3)]:
            event = await repo.get_or_create_event_type(event_name)
            venue.event_links.append(VenueEventMapping(event_type_id=event.id))

        pricing = VenuePricing(
            pricing_mode="slot_based" if i % 3 == 1 else "full_day",
            pricing_type="venue_food" if i % 3 == 2 else "venue_only",
            gst_percent=Decimal("18"),
            advance_percent=Decimal("25"),
            booking_window_days=180,
            minimum_notice_hours=24,
            operating_hours="09:00 AM - 11:00 PM",
        )
        if pricing.pricing_type == "venue_only":
            if pricing.pricing_mode == "full_day":
                pricing.slots.append(
                    VenueSlot(
                        slot_key="full_day",
                        slot_name="Full Day",
                        time_label="09:00 AM - 11:00 PM",
                        slot_price=Decimal(str(45000 + i * 2500)),
                        display_order=0,
                    )
                )
            else:
                for order, (key, label, start_end, price) in enumerate(
                    [
                        ("morning", "Morning", "09:00 AM - 01:00 PM", 18000),
                        ("afternoon", "Afternoon", "01:00 PM - 05:00 PM", 20000),
                        ("evening", "Evening", "06:00 PM - 11:00 PM", 28000),
                    ]
                ):
                    pricing.slots.append(
                        VenueSlot(
                            slot_key=key,
                            slot_name=label,
                            time_label=start_end,
                            slot_price=Decimal(str(price + i * 500)),
                            display_order=order,
                        )
                    )
        else:
            for order, (key, label, times, veg, nonveg) in enumerate(
                [
                    ("breakfast", "Breakfast", "08:00 AM - 11:00 AM", 450, 550),
                    ("lunch", "Lunch", "12:00 PM - 03:00 PM", 650, 750),
                    ("dinner", "Dinner", "07:00 PM - 11:00 PM", 750, 900),
                ]
            ):
                pricing.food_slots.append(
                    VenueFoodSlot(
                        meal_key=key,
                        meal_name=label,
                        time_label=times,
                        veg_plate_price=Decimal(str(veg + i * 10)),
                        non_veg_plate_price=Decimal(str(nonveg + i * 10)),
                        minimum_guests=50,
                        maximum_guests=400,
                        display_order=order,
                    )
                )
        venue.pricing = pricing

        venue.gallery_items.append(
            VenueGalleryItem(
                image_url=f"https://picsum.photos/seed/venue{i}c/800/600",
                image_type="cover",
                display_order=0,
            )
        )
        for g in range(3):
            venue.gallery_items.append(
                VenueGalleryItem(
                    image_url=f"https://picsum.photos/seed/venue{i}g{g}/800/600",
                    image_type="gallery",
                    display_order=g + 1,
                )
            )
        for slot in DOCUMENT_SLOTS:
            venue.documents.append(
                VenueDocument(document_type=slot, name=slot, status="pending")
            )

        created += 1

    await session.flush()
    logger.info("Sample venues created: %s", created)
