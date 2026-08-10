import type { Booking } from "../bookings/types";
import { hydrateBookingPayments } from "../bookings/payments";
import type { BusinessProfile, BusinessVenue, VenueListingStatus } from "../business-profile/types";
import type {
  Customer,
  CustomerBooking,
  CustomerTransaction,
} from "../customers/types";
import type { Venue, VenueBooking } from "../venues/types";
import type { VenueOwner, VenueOwnerBooking } from "../venue-owners/types";
import { paymentMethodLabel } from "../bookings/payments";

export interface DemoSlice {
  businesses: BusinessProfile[];
  venues: Venue[];
  customers: Customer[];
  vendors: VenueOwner[];
  bookings: Booking[];
}

const today = () => new Date().toISOString().slice(0, 10);

function matchId(a?: string, b?: string) {
  if (!a || !b) return false;
  return a === b;
}

function resolvePaymentStatus(bookingAmount: number, paidAmount: number): Booking["paymentStatus"] {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= bookingAmount) return "paid";
  return "partial";
}

function mapVenuePaymentStatus(status: Booking["paymentStatus"]): VenueBooking["paymentStatus"] {
  if (status === "unpaid") return "pending";
  if (status === "paid" || status === "partial" || status === "refunded" || status === "failed") {
    return status;
  }
  return "pending";
}

function mapCustomerBookingStatus(b: Booking): CustomerBooking["bookingStatus"] {
  if (b.bookingStatus === "completed") return "completed";
  if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded") return "cancelled";
  return "upcoming";
}

function mapCustomerPaymentStatus(b: Booking): CustomerBooking["paymentStatus"] {
  if (b.paymentStatus === "paid") return "paid";
  if (b.paymentStatus === "refunded") return "refunded";
  if (b.paymentStatus === "failed") return "failed";
  return "pending";
}

function mapVenueBookingStatus(b: Booking): VenueBooking["status"] {
  if (b.bookingStatus === "completed") return "completed";
  if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded") return "cancelled";
  if (b.bookingStatus === "pending" || b.bookingStatus === "draft") return "pending";
  return "confirmed";
}

function mapOwnerBookingStatus(b: Booking): VenueOwnerBooking["status"] {
  if (b.bookingStatus === "completed") return "completed";
  if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded") return "cancelled";
  if (b.bookingStatus === "pending" || b.bookingStatus === "draft") return "pending";
  return "upcoming";
}

function isUpcomingBooking(b: Booking, refDate: string) {
  return (
    b.eventDate >= refDate &&
    b.bookingStatus !== "cancelled" &&
    b.bookingStatus !== "completed" &&
    b.bookingStatus !== "refunded"
  );
}

function isCancelledBooking(b: Booking) {
  return b.bookingStatus === "cancelled" || b.bookingStatus === "refunded";
}

function isCompletedBooking(b: Booking) {
  return b.bookingStatus === "completed";
}

function findVenue(venues: Venue[], venueId: string) {
  return venues.find((v) => matchId(v.venueId, venueId) || matchId(v.id, venueId));
}

function findOwner(vendors: VenueOwner[], ownerKey?: string) {
  if (!ownerKey) return undefined;
  return vendors.find((v) => matchId(v.id, ownerKey) || matchId(v.ownerId, ownerKey));
}

function findBusiness(businesses: BusinessProfile[], businessId: string) {
  return businesses.find((b) => matchId(b.businessId, businessId) || matchId(b.id, businessId));
}

function enrichBookingRelations(
  booking: Booking,
  venues: Venue[],
  businesses: BusinessProfile[],
  vendors: VenueOwner[]
): Booking {
  const venue = findVenue(venues, booking.venueId);
  const business = findBusiness(businesses, booking.businessId);
  const owner = findOwner(vendors, venue?.ownerId || booking.vendorId);

  const hydrated = hydrateBookingPayments({
    ...booking,
    venueName: booking.venueName || venue?.name || booking.venueName,
    venueCity: booking.venueCity || venue?.city || booking.venueCity,
    businessName: booking.businessName || business?.businessName || booking.businessName,
    vendorId: booking.vendorId || venue?.ownerId || owner?.id || "",
    vendorName: booking.vendorName || owner?.name || venue?.ownerName || booking.vendorName,
  });

  const paidAmount = hydrated.paidAmount || 0;
  const paymentStatus = resolvePaymentStatus(hydrated.bookingAmount, paidAmount);

  return {
    ...hydrated,
    paymentStatus,
    pendingAmount: Math.max(0, hydrated.bookingAmount - paidAmount),
    advancePaid: paidAmount > 0 ? Math.min(paidAmount, hydrated.advancePaid || paidAmount) : 0,
  };
}

function toVenueBooking(b: Booking): VenueBooking {
  return {
    id: b.id,
    bookingId: b.bookingId,
    customerName: b.customerName,
    eventType: b.eventType,
    bookingDate: b.bookingDate,
    eventDate: b.eventDate,
    guests: b.guestCount,
    amount: b.bookingAmount,
    paymentStatus: mapVenuePaymentStatus(b.paymentStatus),
    status: mapVenueBookingStatus(b),
  };
}

function toCustomerBooking(b: Booking): CustomerBooking {
  return {
    id: b.id,
    bookingId: b.bookingId,
    venue: b.venueName,
    eventType: b.eventType,
    bookingDate: b.bookingDate,
    eventDate: b.eventDate,
    guests: b.guestCount,
    amount: b.bookingAmount,
    paymentStatus: mapCustomerPaymentStatus(b),
    bookingStatus: mapCustomerBookingStatus(b),
  };
}

function toCustomerTransaction(b: Booking, txn: NonNullable<Booking["transactions"]>[number]): CustomerTransaction {
  return {
    id: txn.id,
    transactionId: txn.transactionId,
    booking: b.bookingId,
    amount: txn.amount,
    method: paymentMethodLabel(txn.method),
    status: txn.status,
    date: txn.date,
  };
}

function toOwnerBooking(b: Booking): VenueOwnerBooking {
  return {
    id: b.id,
    bookingId: b.bookingId,
    venue: b.venueName,
    customer: b.customerName,
    eventType: b.eventType,
    amount: b.bookingAmount,
    status: mapOwnerBookingStatus(b),
    date: b.eventDate,
  };
}

function recomputeCustomers(customers: Customer[], bookings: Booking[]): Customer[] {
  const refDate = today();

  return customers.map((customer) => {
    const related = bookings.filter(
      (b) => matchId(b.customerId, customer.customerId) || matchId(b.customerId, customer.id)
    );

    const upcoming = related.filter((b) => isUpcomingBooking(b, refDate)).length;
    const completed = related.filter((b) => isCompletedBooking(b)).length;
    const cancelled = related.filter((b) => isCancelledBooking(b)).length;

    const totalPaid = related.reduce((sum, b) => {
      const paid =
        (b.transactions || [])
          .filter((t) => t.status === "success")
          .reduce((s, t) => s + t.amount, 0) || b.paidAmount || 0;
      return sum + paid;
    }, 0);

    const pendingPayments = related.reduce((sum, b) => sum + (b.pendingAmount || 0), 0);
    const refundedPayments = related.reduce((sum, b) => sum + (b.refundAmount || 0), 0);
    const bookingAmountTotal = related.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);

    const sorted = [...related].sort(
      (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
    );
    const recentBookings = sorted.slice(0, 20).map(toCustomerBooking);
    const recentTransactions = sorted
      .flatMap((b) =>
        (b.transactions || [])
          .filter((t) => t.status === "success" || t.status === "pending")
          .map((t) => toCustomerTransaction(b, t))
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);

    const eventTypeCounts = related.reduce<Record<string, number>>((acc, b) => {
      acc[b.eventType] = (acc[b.eventType] || 0) + 1;
      return acc;
    }, {});
    const favoriteEventType =
      Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      customer.favoriteEventType ||
      "—";

    const last = sorted[0];

    return {
      ...customer,
      bookings: related.length,
      upcomingBookings: upcoming,
      completedBookings: completed,
      cancelledBookings: cancelled,
      totalSpend: totalPaid,
      totalPaid,
      pendingPayments,
      refundedPayments,
      averageBooking: related.length ? Math.round(bookingAmountTotal / related.length) : 0,
      favoriteEventType: related.length ? favoriteEventType : "—",
      lastBooking: last
        ? new Date(last.eventDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : customer.lastBooking,
      recentBookings,
      recentTransactions,
      journey: customer.journey,
    };
  });
}

function recomputeVenues(venues: Venue[], bookings: Booking[]): Venue[] {
  const refDate = today();

  return venues.map((venue) => {
    const related = bookings.filter(
      (b) => matchId(b.venueId, venue.venueId) || matchId(b.venueId, venue.id)
    );

    const venueBookings = related.map(toVenueBooking);
    const upcomingBookings = related.filter((b) => isUpcomingBooking(b, refDate)).length;
    const completedBookings = related.filter((b) => isCompletedBooking(b)).length;
    const cancelledBookings = related.filter((b) => isCancelledBooking(b)).length;
    const revenue = related.reduce((sum, b) => sum + (b.bookingAmount || 0), 0);
    const todaysBookings = related.filter((b) => b.eventDate === refDate).length;

    return {
      ...venue,
      availability: syncAvailabilityFromBookings(venue.availability || [], related),
      bookings: venueBookings,
      totalBookings: related.length,
      upcomingBookings,
      completedBookings,
      cancelledBookings,
      revenue,
      todaysBookings,
    };
  });
}

/** Keep venue.availability booked rows aligned with the Booking store (single source of truth). */
function syncAvailabilityFromBookings(
  availability: Venue["availability"],
  related: Booking[]
): Venue["availability"] {
  const byDate = new Map<string, (typeof availability)[number]>();
  (availability || []).forEach((row) => {
    const existing = byDate.get(row.date);
    // Prefer full-day / first row per date
    if (!existing) byDate.set(row.date, { ...row });
  });

  // Clear stale booked markers only; preserve blocked / holiday / maintenance rows
  byDate.forEach((row, date) => {
    if (row.status === "booked") {
      byDate.set(date, {
        ...row,
        status: "available",
        bookingId: undefined,
        bookingRef: undefined,
        customerName: undefined,
        eventType: undefined,
        guests: undefined,
      });
    }
  });

  related.forEach((b) => {
    if (b.bookingStatus === "cancelled" || b.bookingStatus === "refunded") return;
    datesForBooking(b).forEach((date) => {
      const prev = byDate.get(date);
      byDate.set(date, {
        date,
        slot: prev?.slot || "Full Day",
        status: "booked",
        bookingId: b.bookingId,
        bookingRef: b.id,
        customerName: b.customerName,
        eventType: b.eventType,
        guests: b.guestCount,
      });
    });
  });

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function datesForBooking(b: Booking): string[] {
  const selected = (b.selectedDates || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (selected.length > 0) return Array.from(new Set(selected)).sort();

  if (!b.eventDate) return [];
  if (!b.eventEndDate || b.eventEndDate <= b.eventDate) return [b.eventDate];

  const out: string[] = [];
  const cur = new Date(`${b.eventDate}T12:00:00`);
  const last = new Date(`${b.eventEndDate}T12:00:00`);
  while (cur <= last) {
    const y = cur.getFullYear();
    const m = String(cur.getMonth() + 1).padStart(2, "0");
    const d = String(cur.getDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function mapVenueListingStatus(status: Venue["status"]): VenueListingStatus {
  if (status === "archived") return "inactive";
  return status as VenueListingStatus;
}

function countVenuesByStatus(venues: Venue[]) {
  return {
    total: venues.length,
    published: venues.filter((v) => v.status === "published").length,
    pending: venues.filter((v) => v.status === "pending").length,
    inactive: venues.filter((v) => v.status === "inactive" || v.status === "archived").length,
    draft: venues.filter((v) => v.status === "draft").length,
  };
}

function recomputeBusinesses(
  businesses: BusinessProfile[],
  venues: Venue[],
  bookings: Booking[]
): BusinessProfile[] {
  return businesses.map((business) => {
    const bizVenues = venues.filter(
      (v) => matchId(v.businessId, business.businessId) || matchId(v.businessId, business.id)
    );
    const counts = countVenuesByStatus(bizVenues);

    const venueRows: BusinessVenue[] = bizVenues.map((v) => {
      const venueBookingCount = bookings.filter(
        (b) => matchId(b.venueId, v.venueId) || matchId(b.venueId, v.id)
      ).length;
      const existing = business.venues.find(
        (row) => matchId(row.venueId, v.venueId) || matchId(row.id, v.id)
      );
      return {
        id: v.id,
        venueId: v.venueId,
        name: v.name,
        category: v.category,
        capacity: v.seatingCapacity || v.maxGuests || 0,
        city: v.city,
        status: mapVenueListingStatus(v.status),
        rating: v.rating,
        bookings: venueBookingCount,
      };
    });

    return {
      ...business,
      totalVenues: counts.total,
      publishedVenues: counts.published,
      pendingVenues: counts.pending,
      inactiveVenues: counts.inactive,
      draftVenues: counts.draft,
      venues: venueRows,
    };
  });
}

function recomputeVendors(
  vendors: VenueOwner[],
  businesses: BusinessProfile[],
  venues: Venue[],
  bookings: Booking[]
): VenueOwner[] {
  return vendors.map((vendor) => {
    const linkedBusinesses = businesses.filter(
      (b) => matchId(b.ownerId, vendor.id) || matchId(b.ownerId, vendor.ownerId)
    );
    const linkedVenues = venues.filter(
      (v) => matchId(v.ownerId, vendor.id) || matchId(v.ownerId, vendor.ownerId)
    );
    const venueIds = new Set(linkedVenues.flatMap((v) => [v.venueId, v.id]));
    const relatedBookings = bookings.filter(
      (b) =>
        matchId(b.vendorId, vendor.id) ||
        matchId(b.vendorId, vendor.ownerId) ||
        venueIds.has(b.venueId)
    );

    const recentBookings = [...relatedBookings]
      .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime())
      .slice(0, 20)
      .map(toOwnerBooking);

    const assignedBusinessRows = linkedBusinesses.map((b) => ({
      id: b.id,
      name: b.businessName,
      businessType: b.businessType,
      city: b.city,
      status: b.status as "active" | "inactive" | "pending",
    }));

    return {
      ...vendor,
      businesses: assignedBusinessRows.length ? assignedBusinessRows : vendor.businesses,
      assignedBusinesses: linkedBusinesses.length,
      totalVenues: linkedVenues.length,
      recentBookings,
    };
  });
}

/** Single source-of-truth pass: hydrate bookings and sync all derived aggregates. */
export function reconcileDemoState(state: DemoSlice): DemoSlice {
  const bookings = state.bookings.map((b) =>
    enrichBookingRelations(b, state.venues, state.businesses, state.vendors)
  );
  const venues = recomputeVenues(state.venues, bookings);
  const customers = recomputeCustomers(state.customers, bookings);
  const businesses = recomputeBusinesses(state.businesses, venues, bookings);
  const vendors = recomputeVendors(state.vendors, businesses, venues, bookings);

  return {
    bookings,
    venues,
    customers,
    businesses,
    vendors,
  };
}

export function summarizeBookingsGlobal(bookings: Booking[]) {
  const refDate = today();
  const revenue = bookings.reduce((s, b) => s + (b.bookingAmount || 0), 0);
  const collected = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const pending = bookings.reduce((s, b) => s + (b.pendingAmount || 0), 0);
  const completed = bookings.filter((b) => isCompletedBooking(b)).length;
  const upcoming = bookings.filter((b) => isUpcomingBooking(b, refDate)).length;
  const cancelled = bookings.filter((b) => isCancelledBooking(b)).length;
  return {
    total: bookings.length,
    revenue,
    collected,
    pending,
    completed,
    upcoming,
    cancelled,
  };
}
