import { apiRequest } from "@/lib/api";
import type { AvailabilityDay, DayAvailabilityStatus } from "@/app/admin/venues/types";

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
}

function mapStatus(status: string): DayAvailabilityStatus {
  if (status === "maintenance") return "maintenance";
  if (status === "holiday") return "holiday";
  if (status === "blocked") return "blocked";
  if (
    status === "booked" ||
    status === "partially_booked" ||
    status === "completed"
  ) {
    return "booked";
  }
  return "available";
}

export function mapAvailabilityDays(days: AvailabilityDayApi[]): AvailabilityDay[] {
  const rows: AvailabilityDay[] = [];
  for (const day of days) {
    const venueSlots = (day.slots || []).filter((slot) => slot.slot_kind !== "food");
    const source = venueSlots.length ? venueSlots : [null];
    for (const slot of source) {
      const status = mapStatus(slot?.status || day.status);
      rows.push({
        date: day.date,
        status:
          day.status === "holiday"
            ? "holiday"
            : day.status === "blocked"
              ? "blocked"
              : status,
        slot: slot?.slot_name,
        slotKey: slot?.slot_key,
        bookingId: slot?.booking_id || undefined,
        bookingRef: slot?.booking_ref || undefined,
        customerName: slot?.customer_name || undefined,
        eventType: slot?.event_type || undefined,
        guests: slot?.guests ?? undefined,
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
