import { apiRequest } from "@/lib/api";
import type {
  AvailabilityDay,
  AvailabilityDayBooking,
  DayAvailabilityStatus,
} from "@/app/admin/venues/types";

const DAY_STATUSES: DayAvailabilityStatus[] = [
  "available",
  "booked",
  "partially_booked",
  "blocked",
  "holiday",
  "closed",
  "maintenance",
  "completed",
  "cancelled",
  "no_booking",
  "expired",
];

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBookingUuid(value?: string | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export interface AvailabilitySlotApi {
  id: string;
  slot_id?: string | null;
  food_slot_id?: string | null;
  slot_kind: string;
  slot_key: string;
  slot_name: string;
  time_label?: string | null;
  status: string;
  booking_id?: string | null;
  booking_ref?: string | null;
  customer_name?: string | null;
  event_type?: string | null;
  guests?: number | null;
  blocked_reason?: string | null;
}

export interface AvailabilityDayBookingApi {
  booking_id: string;
  booking_number: string;
  customer_name?: string;
  guest_count?: number;
  selected_slots?: string[];
  selected_food_slots?: string[];
  payment_status?: string;
  booking_status: string;
  event_type?: string | null;
  total_amount?: number;
}

export interface AvailabilityDayApi {
  id: string;
  date: string;
  status: string;
  available_capacity: number;
  booked_capacity: number;
  available_slots: number;
  booked_slots: number;
  booking_count: number;
  occupancy: number;
  holiday: boolean;
  blocked: boolean;
  notes?: string | null;
  slots: AvailabilitySlotApi[];
  booking_ids?: string[];
  booked_slot_names?: string[];
  available_slot_names?: string[];
  booked_food_slots?: string[];
  available_food_slots?: string[];
  guest_count?: number;
  bookings?: AvailabilityDayBookingApi[];
}

export interface AvailabilityDashboardApi {
  available_days: number;
  booked_days: number;
  completed_days: number;
  blocked_days: number;
  occupancy_percent: number;
  todays_bookings: number;
}

export interface AvailabilityMonthApi {
  success: boolean;
  venue_id: string;
  month: string;
  pricing_mode: string;
  pricing_type: string;
  operating_hours?: string | null;
  booking_window_days: number;
  days: AvailabilityDayApi[];
  dashboard: AvailabilityDashboardApi;
}

export interface AvailabilityDayDetailApi {
  success: boolean;
  venue_id: string;
  venue_name: string;
  booking_type: string;
  pricing_mode: string;
  operating_hours?: string | null;
  day: AvailabilityDayApi;
  occupancy: number;
  vendor_notes?: string | null;
  bookings?: AvailabilityDayBookingApi[];
}

function mapStatus(status: string): DayAvailabilityStatus {
  if ((DAY_STATUSES as string[]).includes(status)) {
    return status as DayAvailabilityStatus;
  }
  return "available";
}

function mapDayBookings(day: AvailabilityDayApi): AvailabilityDayBooking[] {
  return (day.bookings || []).map((booking) => ({
    id: booking.booking_id,
    bookingId: booking.booking_number,
    customerName: booking.customer_name || "",
    guestCount: booking.guest_count || 0,
    selectedSlots: booking.selected_slots || [],
    selectedFoodSlots: booking.selected_food_slots || [],
    paymentStatus: booking.payment_status || "pending",
    bookingStatus: booking.booking_status,
    bookingAmount: booking.total_amount,
    eventType: booking.event_type || undefined,
  }));
}

export function mapAvailabilityDays(days: AvailabilityDayApi[]): AvailabilityDay[] {
  const rows: AvailabilityDay[] = [];
  for (const day of days) {
    const bookings = mapDayBookings(day);
    const primary = bookings[0];
    rows.push({
      date: day.date,
      status: mapStatus(day.status),
      bookingId: primary?.bookingId,
      bookingRef: primary?.id,
      customerName: primary?.customerName,
      eventType: undefined,
      guests: day.guest_count ?? primary?.guestCount,
      bookingCount: day.booking_count,
      bookingIds: (day.booking_ids || []).map(String),
      bookedSlotNames: day.booked_slot_names || [],
      availableSlotNames: day.available_slot_names || [],
      bookedFoodSlots: day.booked_food_slots || [],
      availableFoodSlots: day.available_food_slots || [],
      guestCount: day.guest_count || 0,
      bookings,
    });
    for (const slot of day.slots || []) {
      const linked =
        bookings.find((booking) => booking.id === slot.booking_id) ||
        bookings.find((booking) => booking.bookingId === slot.booking_ref);
      rows.push({
        date: day.date,
        status: mapStatus(slot.status || day.status),
        slot: slot.slot_name,
        slotKey: slot.slot_key,
        slotKind: slot.slot_kind === "food" ? "food" : "venue",
        bookingId: slot.booking_ref || linked?.bookingId,
        bookingRef: slot.booking_id || linked?.id,
        customerName: slot.customer_name || linked?.customerName || undefined,
        eventType: slot.event_type || linked?.eventType || undefined,
        guests: slot.guests ?? linked?.guestCount,
      });
    }
  }
  return rows;
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthKeysForWindow(bookingWindowDays = 180, from = new Date()) {
  const months = Math.max(1, Math.ceil(bookingWindowDays / 28) + 1);
  const keys: string[] = [];
  for (let i = 0; i < months; i += 1) {
    const d = new Date(from.getFullYear(), from.getMonth() + i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export async function fetchAvailabilityMonth(venueId: string, month: string) {
  return apiRequest<AvailabilityMonthApi>(`/venues/${venueId}/availability`, {
    params: { month },
  });
}

export async function fetchAvailabilityDay(venueId: string, date: string) {
  return apiRequest<AvailabilityDayDetailApi>(`/venues/${venueId}/availability/${date}`);
}

export async function fetchAvailabilityDashboard(venueId: string, month?: string) {
  return apiRequest<AvailabilityDashboardApi>(`/venues/${venueId}/availability/dashboard`, {
    params: month ? { month } : undefined,
  });
}

export async function fetchAvailabilityWindow(venueId: string, bookingWindowDays = 180) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now);
  end.setDate(end.getDate() + Math.max(bookingWindowDays, 31));
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const payload = await apiRequest<AvailabilityMonthApi>(`/venues/${venueId}/availability`, {
    params: {
      month,
      start_date: toYmd(start),
      end_date: toYmd(end),
    },
  });
  const seen = new Set<string>();
  const days = mapAvailabilityDays(payload.days || []).filter((row) => {
    const key = `${row.date}:${row.slotKey || row.slot || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { days, dashboard: payload.dashboard };
}

export async function blockAvailability(
  venueId: string,
  payload: {
    start_date: string;
    end_date?: string;
    reason?: string;
    notes?: string;
    recurrence_type?: string;
    weekdays?: number[];
  }
) {
  return apiRequest(`/venues/${venueId}/availability/block`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function regenerateAvailability(venueId: string) {
  return apiRequest(`/venues/${venueId}/availability/regenerate`, { method: "POST" });
}
