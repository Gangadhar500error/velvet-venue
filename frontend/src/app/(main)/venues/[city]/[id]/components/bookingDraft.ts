export const PENDING_BOOKING_KEY = "vv_pending_booking";

export type PendingBookingDraft = {
  venueId: string;
  venueName: string;
  city: string;
  area?: string;
  bookingType: "venue_only" | "venue_food";
  pricingMethod: "full_day" | "slot_based";
  slotLabel: string;
  slotKey: string;
  foodSlotKeys: string;
  foodSlotLabels: string[];
  selectedDates: string[];
  guestCount: number;
  services: string[];
  notes: string;
  estimatedTotal: number;
  payOnlineNow: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  createdAt: string;
};

export function savePendingBooking(draft: PendingBookingDraft) {
  try {
    sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function readPendingBooking(): PendingBookingDraft | null {
  try {
    const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PendingBookingDraft;
  } catch {
    return null;
  }
}

export function clearPendingBooking() {
  try {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
  } catch {
    /* ignore */
  }
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
