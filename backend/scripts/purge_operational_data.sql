-- FK-safe wipe for Neon / psql.
-- bookings.venue_id is ON DELETE RESTRICT, so venues cannot be deleted first.

BEGIN;

-- 1) Remove bookings. Child rows CASCADE.
--    venue_slot_availability.booking_id and venue_reviews.booking_id are SET NULL.
DELETE FROM bookings;

-- 2) Now venues (and cascaded pricing/availability/gallery/documents) can go.
DELETE FROM venues;

COMMIT;
