import type { Booking, BookingInvoice, BookingTransaction } from "../../bookings/types";
import {
  getBookingInvoices,
  paymentMethodLabel,
  paymentTypeLabel,
} from "../../bookings/payments";
import type { BusinessProfile } from "../../business-profile/types";
import type { Venue } from "../../venues/types";
import type { VenueOwner } from "../../venue-owners/types";

export {
  getBookingInvoices,
  paymentMethodLabel,
  paymentTypeLabel,
  paymentTypeShortLabel,
} from "../../bookings/payments";

export interface RelatedInvoiceRow extends BookingInvoice {
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  venueId: string;
  venueName: string;
  businessId: string;
  businessName: string;
  vendorId?: string;
  vendorName?: string;
  bookingAmount: number;
  paymentStatus: string;
  invoiceAmount: number;
  amountPaid: number;
}

export interface RelatedPaymentRow extends BookingTransaction {
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  venueId: string;
  venueName: string;
  businessId: string;
  businessName: string;
  vendorId?: string;
  vendorName?: string;
}

export function matchId(a?: string, b?: string) {
  if (!a || !b) return false;
  return a === b;
}

export function bookingsForCustomer(bookings: Booking[], customerId: string) {
  return bookings.filter(
    (b) => matchId(b.customerId, customerId) || matchId(b.customerId, customerId)
  );
}

export function bookingsForVenue(bookings: Booking[], venueId: string) {
  return bookings.filter((b) => matchId(b.venueId, venueId));
}

export function bookingsForBusiness(bookings: Booking[], businessId: string) {
  return bookings.filter((b) => matchId(b.businessId, businessId));
}

export function venuesForOwner(venues: Venue[], ownerId: string) {
  return venues.filter((v) => matchId(v.ownerId, ownerId));
}

export function businessesForOwner(businesses: BusinessProfile[], ownerId: string) {
  return businesses.filter((b) => matchId(b.ownerId, ownerId));
}

export function venuesForBusiness(venues: Venue[], businessId: string) {
  return venues.filter((v) => matchId(v.businessId, businessId));
}

export function bookingsForOwner(
  bookings: Booking[],
  venues: Venue[],
  owner: VenueOwner
) {
  const venueIds = new Set(
    venuesForOwner(venues, owner.id)
      .concat(venuesForOwner(venues, owner.ownerId || ""))
      .map((v) => v.venueId)
  );
  return bookings.filter(
    (b) =>
      matchId(b.vendorId, owner.id) ||
      matchId(b.vendorId, owner.ownerId) ||
      venueIds.has(b.venueId)
  );
}

export function flattenInvoices(bookings: Booking[]): RelatedInvoiceRow[] {
  return bookings.flatMap((b) => {
    const invoices = getBookingInvoices(b);
    return invoices.map((inv) => ({
      ...inv,
      bookingId: b.bookingId,
      bookingRef: b.id,
      customerId: b.customerId,
      customerName: b.customerName,
      venueId: b.venueId,
      venueName: b.venueName,
      businessId: b.businessId,
      businessName: b.businessName,
      vendorId: b.vendorId,
      vendorName: b.vendorName,
      bookingAmount: b.bookingAmount,
      paymentStatus: b.paymentStatus,
      invoiceAmount: inv.amountReceived,
      amountPaid: inv.amountReceived,
    }));
  });
}

export function flattenPayments(bookings: Booking[]): RelatedPaymentRow[] {
  return bookings.flatMap((b) =>
    (b.transactions || [])
      .filter((t) => t.status === "success" || t.status === "pending")
      .map((t) => ({
        ...t,
        bookingId: b.bookingId,
        bookingRef: b.id,
        customerId: b.customerId,
        customerName: b.customerName,
        venueId: b.venueId,
        venueName: b.venueName,
        businessId: b.businessId,
        businessName: b.businessName,
        vendorId: b.vendorId,
        vendorName: b.vendorName,
      }))
  );
}

export function summarizeBookings(bookings: Booking[]) {
  const today = new Date().toISOString().slice(0, 10);
  const revenue = bookings.reduce((s, b) => s + (b.bookingAmount || 0), 0);
  const collected = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const pending = bookings.reduce((s, b) => s + (b.pendingAmount || 0), 0);
  const completed = bookings.filter((b) => b.bookingStatus === "completed").length;
  const upcoming = bookings.filter(
    (b) =>
      b.eventDate >= today &&
      b.bookingStatus !== "cancelled" &&
      b.bookingStatus !== "completed" &&
      b.bookingStatus !== "refunded"
  ).length;
  const cancelled = bookings.filter(
    (b) => b.bookingStatus === "cancelled" || b.bookingStatus === "refunded"
  ).length;
  return {
    total: bookings.length,
    revenue,
    collected,
    pending,
    bookingAmount: revenue,
    completed,
    upcoming,
    cancelled,
  };
}

export function findInvoiceContext(
  bookings: Booking[],
  invoiceKey: string
): { booking: Booking; invoice: BookingInvoice } | null {
  const key = decodeURIComponent(invoiceKey);
  for (const booking of bookings) {
    const inv = getBookingInvoices(booking).find(
      (i) => i.invoiceNo === key || i.id === key
    );
    if (inv) return { booking, invoice: inv };
  }
  return null;
}

export function findTransactionContext(
  bookings: Booking[],
  txnKey: string
): { booking: Booking; transaction: BookingTransaction } | null {
  const key = decodeURIComponent(txnKey);
  for (const booking of bookings) {
    const txn = (booking.transactions || []).find(
      (t) => t.transactionId === key || t.id === key
    );
    if (txn) return { booking, transaction: txn };
  }
  return null;
}
