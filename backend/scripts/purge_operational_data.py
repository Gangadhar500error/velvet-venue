"""FK-safe purge of bookings, then optionally venues.

Bookings.venue_id is ON DELETE RESTRICT, so venues cannot be hard-deleted
until their bookings are removed.

Usage (from backend/):

    python -m scripts.purge_operational_data --bookings
    python -m scripts.purge_operational_data --bookings --venues
"""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import text

from app.core.logging import get_logger, setup_logging
from app.db.session import AsyncSessionLocal

logger = get_logger(__name__)


async def purge(*, delete_bookings: bool, delete_venues: bool) -> None:
    setup_logging()
    if not delete_bookings and not delete_venues:
        raise SystemExit("Pass --bookings and/or --venues.")

    async with AsyncSessionLocal() as session:
        try:
            if delete_bookings:
                # Child booking tables CASCADE. Availability/review booking_id is SET NULL.
                result = await session.execute(text("DELETE FROM bookings"))
                logger.info("Deleted bookings: %s", result.rowcount)

            if delete_venues:
                result = await session.execute(text("DELETE FROM venues"))
                logger.info("Deleted venues: %s", result.rowcount)

            await session.commit()
            logger.info("Purge completed")
        except Exception:
            await session.rollback()
            logger.exception("Purge failed")
            raise


def main() -> None:
    parser = argparse.ArgumentParser(description="Delete bookings/venues in FK-safe order.")
    parser.add_argument(
        "--bookings",
        action="store_true",
        help="Hard-delete all bookings (and cascaded payments/invoices/slots).",
    )
    parser.add_argument(
        "--venues",
        action="store_true",
        help="Hard-delete all venues. Requires bookings to be gone (use with --bookings).",
    )
    args = parser.parse_args()
    asyncio.run(purge(delete_bookings=args.bookings, delete_venues=args.venues))


if __name__ == "__main__":
    main()
