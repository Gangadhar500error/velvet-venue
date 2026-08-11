import type {
  AvailabilityDay,
  DayAvailabilityStatus,
  PricingMethod,
  PricingSlot,
  Venue,
} from "./types";

const FALLBACK_SLOTS: PricingSlot[] = [
  {
    id: "slot-full",
    key: "full_day",
    name: "Full Day",
    enabled: true,
    timeLabel: "9 AM – 11 PM",
    price: 100000,
    minBookingAmount: 20000,
    maxGuests: 400,
  },
];

export type CalendarDayTone =
  | "available"
  | "booked"
  | "completed"
  | "no_booking"
  | "partial"
  | "blocked"
  | "holiday"
  | "disabled"
  | "selected";

export interface SlotDetailRow {
  date: string;
  slotKey: string;
  slotName: string;
  timeLabel: string;
  status: DayAvailabilityStatus;
  kind?: "venue" | "food";
  bookingId?: string;
  bookingRef?: string;
  customerName?: string;
  eventType?: string;
  guests?: number;
  bookingStatus?: string;
  paymentStatus?: string;
  bookingAmount?: number;
  startTime?: string;
  endTime?: string;
  disabledReason?: string;
  price?: number;
}

export interface LiveBookingLite {
  id: string;
  bookingId: string;
  customerName: string;
  eventType: string;
  eventDate: string;
  eventEndDate?: string;
  selectedDates?: string;
  guestCount: number;
  slot: string;
  bookingStatus: string;
  paymentStatus?: string;
  bookingAmount?: number;
  startTime?: string;
  endTime?: string;
  selectedSlots?: string[];
  selectedFoodSlots?: string[];
}

export interface DaySummary {
  tone: CalendarDayTone;
  /** Status tone ignoring selection (for cell fill) */
  statusTone: CalendarDayTone;
  available: number;
  booked: number;
  blocked: number;
  total: number;
  summaryLabel: string;
  tooltipLines: string[];
  multiDayBookingIds: string[];
  isMultiDayEdge: "start" | "middle" | "end" | null;
  isSelected: boolean;
  /** Real store bookings covering this date (no dummy seed rows) */
  coveringBookings: LiveBookingLite[];
  /** Maintenance / Admin Block / Holiday label when blocked */
  blockedReason?: string;
}

function isUuid(value?: string | null): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function pricingMethodLabel(method?: PricingMethod | string) {
  if (method === "slot_based") return "Slot Based";
  return "Full Day";
}

export function normalizePricingMethod(method?: string | null): PricingMethod {
  if (method === "slot_based") return "slot_based";
  return "full_day";
}

export function normalizeVenueSlotKey(slot?: string) {
  const s = (slot || "full_day").toLowerCase().trim();
  if (s.includes("morning") || s === "morning") return "morning";
  if (s.includes("afternoon") || s === "afternoon") return "afternoon";
  if (s.includes("evening") || s === "evening") return "evening";
  if (s.includes("night") && !s.includes("midnight")) return "night";
  if (s.includes("half")) return "half_day";
  if (s.includes("full") || s === "full_day") return "full_day";
  return s.replace(/\s+/g, "_") || "full_day";
}

export function configuredPricingSlots(venue: Pick<Venue, "pricingMethod" | "pricingSlots">) {
  const method = normalizePricingMethod(venue.pricingMethod);
  const slots = (venue.pricingSlots?.length ? venue.pricingSlots : FALLBACK_SLOTS).filter(
    (s) => s.enabled !== false
  );
  if (method === "slot_based") {
    return slots.filter((s) => s.key !== "full_day");
  }
  const full =
    slots.find((s) => s.key === "full_day") ||
    FALLBACK_SLOTS.find((s) => s.key === "full_day")!;
  return [full];
}

export function bookingWindowLabel(days: number) {
  if (!days || days <= 0) return "Unlimited";
  if (days <= 100) return "Next 3 Months";
  if (days <= 200) return "Next 6 Months";
  if (days <= 400) return "Next 12 Months";
  return `Next ${days} Days`;
}

export function minNoticeLabel(hours: number) {
  if (!hours || hours <= 0) return "Same Day";
  if (hours <= 24) return "24 Hours";
  if (hours <= 48) return "48 Hours";
  if (hours <= 72) return "72 Hours";
  return `${hours} Hours`;
}

export function isDateOutsideBookingWindow(
  dateStr: string,
  maxAdvanceBookingDays: number,
  today = new Date()
) {
  if (!maxAdvanceBookingDays || maxAdvanceBookingDays <= 0) return false;
  const todayYmd = toYmd(today);
  if (dateStr < todayYmd) return true;
  const limit = new Date(today);
  limit.setHours(0, 0, 0, 0);
  limit.setDate(limit.getDate() + maxAdvanceBookingDays);
  return dateStr > toYmd(limit);
}

export function isDateWithinMinNotice(
  dateStr: string,
  minNoticePeriodHours: number,
  now = new Date()
) {
  if (!minNoticePeriodHours || minNoticePeriodHours <= 0) return false;
  const event = new Date(`${dateStr}T00:00:00`);
  const earliest = new Date(now.getTime() + minNoticePeriodHours * 60 * 60 * 1000);
  earliest.setHours(0, 0, 0, 0);
  return event < earliest;
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatAvailabilityDate(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isActiveBooking(b: LiveBookingLite) {
  return b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded";
}

/** True when a live store booking covers the given YYYY-MM-DD date. */
export function bookingCoversDate(b: LiveBookingLite, date: string) {
  if (!isActiveBooking(b)) return false;
  const selected = (b.selectedDates || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (selected.length > 0) return selected.includes(date);
  const end = b.eventEndDate || b.eventDate;
  return Boolean(b.eventDate) && date >= b.eventDate && date <= end;
}

export function bookingsForDate(liveBookings: LiveBookingLite[], date: string) {
  return liveBookings.filter((b) => bookingCoversDate(b, date));
}

function availabilityRowForDate(availability: AvailabilityDay[], date: string) {
  return (
    availability.find((a) => a.date === date && !a.slotKey) ||
    availability.find((a) => a.date === date)
  );
}

/** Resolve calendar/list display status from bookings, availability, and date. */
export function resolveDayDisplayTone(args: {
  date: string;
  coveringBookings: LiveBookingLite[];
  availability: AvailabilityDay[];
  today?: string;
}): CalendarDayTone {
  const today = args.today ?? toYmd(new Date());
  const { date, coveringBookings, availability } = args;
  const row = availabilityRowForDate(availability, date);

  if (row?.status === "completed") return "completed";
  if (row?.status === "blocked" || row?.status === "maintenance") return "blocked";
  if (row?.status === "holiday") return "holiday";
  if (row?.status === "no_booking") return "no_booking";
  if (row?.status === "expired") return "disabled";
  if (row?.status === "partially_booked") return "partial";
  if (row?.status === "booked") return date < today ? "completed" : "booked";

  if (coveringBookings.length > 0) {
    return date < today ? "completed" : "booked";
  }

  if (date < today) return "no_booking";
  return "available";
}

export function displayLabelForTone(tone: CalendarDayTone): string {
  switch (tone) {
    case "booked":
      return "Booked";
    case "completed":
      return "Completed";
    case "no_booking":
      return "No Booking";
    case "blocked":
      return "Blocked";
    case "holiday":
      return "Holiday";
    case "partial":
      return "Partial";
    default:
      return "✓ Available";
  }
}

export function isDateBookable(tone: CalendarDayTone, date: string, today?: string) {
  const t = today ?? toYmd(new Date());
  return (tone === "available" || tone === "partial") && date >= t;
}

export function blockedReasonLabel(row?: AvailabilityDay): string | undefined {
  if (!row) return undefined;
  if (row.status === "maintenance") return "Maintenance";
  if (row.status === "holiday") return "Holiday";
  if (row.status === "blocked") return "Admin Block";
  if (row.status === "expired") return "Outside booking window";
  return undefined;
}

/** Resolve slot rows for a selected date from pricing config + availability + live bookings. */
export function resolveSlotsForDate(args: {
  venue: Venue;
  date: string;
  availability: AvailabilityDay[];
  liveBookings?: LiveBookingLite[];
}): SlotDetailRow[] {
  const { venue, date, availability, liveBookings = [] } = args;
  const method = normalizePricingMethod(venue.pricingMethod);
  const slots = configuredPricingSlots(venue);
  const covering = bookingsForDate(liveBookings, date);
  const today = toYmd(new Date());
  const displayTone = resolveDayDisplayTone({ date, coveringBookings: covering, availability, today });
  const availRow = availabilityRowForDate(availability, date);

  const rowsForDate = availability.filter(
    (a) => a.date === date && a.slotKind !== "food"
  );

  return slots.map((slot) => {
    const availSlot = rowsForDate.find(
      (row) =>
        (row.slotKey && row.slotKey === slot.key) ||
        normalizeVenueSlotKey(row.slot) === slot.key
    );
    const activeBooking = covering.find((b) => {
      const selected = (b.selectedSlots || [])
        .map((name) => normalizeVenueSlotKey(name))
        .filter(Boolean);
      if (selected.length) {
        return selected.includes(slot.key) || selected.includes("full_day");
      }
      const fromLabel = normalizeVenueSlotKey(b.slot);
      if (method === "full_day" || fromLabel === "full_day") return true;
      return fromLabel === slot.key;
    });

    let status: DayAvailabilityStatus = "available";
    if (availSlot?.status === "completed" || activeBooking?.bookingStatus === "completed") {
      status = "completed";
    } else if (activeBooking || availSlot?.status === "booked") {
      status = "booked";
    } else if (availSlot?.status === "holiday" || availRow?.status === "holiday") {
      status = "holiday";
    } else if (
      availSlot?.status === "blocked" ||
      availSlot?.status === "maintenance" ||
      availRow?.status === "blocked" ||
      availRow?.status === "maintenance"
    ) {
      status = "blocked";
    }

    const disabledReason =
      displayTone === "blocked"
        ? "Blocked"
        : displayTone === "holiday"
          ? "Holiday"
          : displayTone === "no_booking"
            ? "No booking was created for this date."
            : displayTone === "completed"
              ? "Completed"
              : undefined;

    return {
      date,
      slotKey: slot.key,
      slotName: method === "full_day" ? "Full Day" : slot.name,
      timeLabel: slot.timeLabel,
      status,
      kind: "venue" as const,
      bookingId:
        activeBooking?.id ||
        (isUuid(availSlot?.bookingRef) ? availSlot.bookingRef : undefined) ||
        (isUuid(availSlot?.bookingId) ? availSlot.bookingId : undefined),
      bookingRef: activeBooking?.bookingId || availSlot?.bookingId,
      customerName: activeBooking?.customerName || availSlot?.customerName,
      eventType: activeBooking?.eventType || availSlot?.eventType,
      guests: activeBooking?.guestCount || availSlot?.guests,
      bookingStatus: activeBooking?.bookingStatus,
      paymentStatus: activeBooking?.paymentStatus,
      bookingAmount: activeBooking?.bookingAmount,
      startTime: activeBooking?.startTime,
      endTime: activeBooking?.endTime,
      disabledReason,
      price: slot.price,
    };
  });
}

export function resolveFoodSlotsForDate(args: {
  venue: Venue;
  date: string;
  availability: AvailabilityDay[];
  liveBookings?: LiveBookingLite[];
}): SlotDetailRow[] {
  const { venue, date, availability, liveBookings = [] } = args;
  const meals = (venue.foodSlots || []).filter((slot) => slot.enabled !== false);
  if (meals.length === 0) return [];
  const covering = bookingsForDate(liveBookings, date);
  const dayRow = availabilityRowForDate(availability, date);
  const foodRows = availability.filter(
    (row) => row.date === date && (row.slotKind === "food" || Boolean(row.slotKey))
  );

  return meals.map((meal) => {
    const key = normalizeVenueSlotKey(meal.key || meal.name);
    const availSlot = foodRows.find(
      (row) =>
        row.slotKind === "food" &&
        (row.slotKey === meal.key || normalizeVenueSlotKey(row.slot) === key)
    );
    const bookedByName = (dayRow?.bookedFoodSlots || []).some(
      (name) => normalizeVenueSlotKey(name) === key
    );
    const activeBooking = covering.find((booking) =>
      (booking.selectedFoodSlots || []).some(
        (name) => normalizeVenueSlotKey(name) === key || name === meal.name
      )
    );
    let status: DayAvailabilityStatus = "available";
    if (availSlot?.status === "completed") status = "completed";
    else if (activeBooking || availSlot?.status === "booked" || bookedByName) status = "booked";
    else if (availSlot?.status === "blocked" || dayRow?.status === "blocked") status = "blocked";
    else if (availSlot?.status === "holiday" || dayRow?.status === "holiday") status = "holiday";

    return {
      date,
      slotKey: meal.key,
      slotName: meal.name,
      timeLabel: meal.timeLabel,
      status,
      kind: "food" as const,
      bookingId:
        activeBooking?.id ||
        (isUuid(availSlot?.bookingRef) ? availSlot.bookingRef : undefined) ||
        (isUuid(availSlot?.bookingId) ? availSlot.bookingId : undefined),
      bookingRef: activeBooking?.bookingId || availSlot?.bookingId,
      customerName: activeBooking?.customerName || availSlot?.customerName,
      guests: activeBooking?.guestCount || availSlot?.guests,
      bookingStatus: activeBooking?.bookingStatus,
    };
  });
}

export function getDaySummary(args: {
  date: string;
  venue: Venue;
  availability: AvailabilityDay[];
  selectedDate?: string;
  liveBookings?: LiveBookingLite[];
}): DaySummary {
  const { date, venue, availability, selectedDate, liveBookings = [] } = args;
  const method = normalizePricingMethod(venue.pricingMethod);

  const coveringBookings = (() => {
    const fromLive = bookingsForDate(liveBookings, date);
    const dayRow = availability.find((row) => row.date === date && !row.slotKey);
    const extras = (dayRow?.bookings || []).map((booking) => ({
      id: booking.id,
      bookingId: booking.bookingId,
      customerName: booking.customerName,
      eventType: booking.eventType || "Event",
      eventDate: date,
      eventEndDate: date,
      selectedDates: date,
      guestCount: booking.guestCount,
      slot: (booking.selectedSlots || []).join(", ") || "Full Day",
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      bookingAmount: booking.bookingAmount,
      selectedSlots: booking.selectedSlots,
      selectedFoodSlots: booking.selectedFoodSlots,
    }));
    const byId = new Map<string, LiveBookingLite>();
    [...fromLive, ...extras].forEach((booking) => {
      if (booking.id) byId.set(booking.id, booking);
    });
    return Array.from(byId.values());
  })();
  const multiCovering = coveringBookings.filter((b) =>
    Boolean(
      (b.selectedDates && b.selectedDates.split(",").filter(Boolean).length > 1) ||
        (b.eventEndDate && b.eventEndDate !== b.eventDate)
    )
  );
  const multiDayBookingIds = multiCovering.map((b) => b.bookingId);
  let isMultiDayEdge: DaySummary["isMultiDayEdge"] = null;
  if (multiCovering[0]) {
    const b = multiCovering[0];
    if (date === b.eventDate) isMultiDayEdge = "start";
    else if (date === (b.eventEndDate || b.eventDate)) isMultiDayEdge = "end";
    else isMultiDayEdge = "middle";
  }

  const slots = resolveSlotsForDate({ venue, date, availability, liveBookings });
  const available = slots.filter((s) => s.status === "available").length;
  const booked = slots.filter((s) => s.status === "booked").length;
  const total = slots.length;
  const today = toYmd(new Date());

  const statusTone = resolveDayDisplayTone({
    date,
    coveringBookings,
    availability,
    today,
  });

  let summaryLabel = displayLabelForTone(statusTone);
  if (statusTone === "booked" || statusTone === "completed") {
    summaryLabel =
      coveringBookings.length > 1
        ? `${coveringBookings.length} Bookings`
        : displayLabelForTone(statusTone);
  }

  const isSelected = selectedDate === date;
  const primary = coveringBookings[0];
  const availRow = availabilityRowForDate(availability, date);
  const blockedReason = blockedReasonLabel(availRow);
  const blockedCount = statusTone === "blocked" || statusTone === "holiday" ? 1 : 0;

  return {
    tone: isSelected ? "selected" : statusTone,
    statusTone,
    available,
    booked: statusTone === "booked" ? Math.max(booked, 1) : booked,
    blocked: blockedCount,
    total,
    summaryLabel,
    tooltipLines: [
      formatAvailabilityDate(date),
      `Model: ${pricingMethodLabel(method)}`,
      coveringBookings.length > 0
        ? coveringBookings.length === 1
          ? `Booking: ${primary?.bookingId || "—"} · ${primary?.customerName || "—"}`
          : `${coveringBookings.length} bookings on this date`
        : displayLabelForTone(statusTone),
      `Hours: ${venue.operatingHours || "—"}`,
    ],
    multiDayBookingIds,
    isMultiDayEdge,
    isSelected,
    coveringBookings,
    blockedReason,
  };
}

/** @deprecated use getDaySummary — kept for callers */
export function calendarToneForDate(args: {
  date: string;
  venue: Venue;
  availability: AvailabilityDay[];
  selectedDate?: string;
  liveBookings?: LiveBookingLite[];
}): CalendarDayTone {
  return getDaySummary(args).tone;
}

export function monthSlotStats(
  venue: Venue,
  availability: AvailabilityDay[],
  monthPrefix: string,
  liveBookings?: LiveBookingLite[]
) {
  const daysInMonth = daysForMonthPrefix(monthPrefix);
  const today = toYmd(new Date());
  let available = 0;
  let booked = 0;
  let completed = 0;
  let blocked = 0;
  daysInMonth.forEach((date) => {
    const summary = getDaySummary({ date, venue, availability, liveBookings });
    switch (summary.statusTone) {
      case "available":
        available += 1;
        break;
      case "booked":
      case "partial":
        booked += 1;
        break;
      case "completed":
        completed += 1;
        break;
      case "blocked":
      case "holiday":
        blocked += 1;
        break;
      default:
        break;
    }
  });
  const denom = available + booked + completed;
  const occupancy = denom > 0 ? Math.round(((booked + completed) / denom) * 100) : 0;
  const todaysBookings = (liveBookings || []).filter((b) =>
    bookingCoversDate(b, today)
  ).length;
  return { available, booked, completed, blocked, occupancy, todaysBookings };
}

function daysForMonthPrefix(prefix: string) {
  const [y, m] = prefix.split("-").map(Number);
  const count = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let d = 1; d <= count; d += 1) {
    out.push(`${prefix}-${String(d).padStart(2, "0")}`);
  }
  return out;
}

export function expandScheduleRows(args: {
  venue: Venue;
  availability: AvailabilityDay[];
  monthPrefix: string;
  liveBookings?: LiveBookingLite[];
  statusFilter?: string;
  slotFilter?: string;
  bookingSearch?: string;
  customerSearch?: string;
}) {
  const {
    venue,
    availability,
    monthPrefix,
    liveBookings,
    statusFilter,
    slotFilter,
    bookingSearch,
    customerSearch,
  } = args;
  const days = daysForMonthPrefix(monthPrefix);
  let rows = days.flatMap((date) =>
    resolveSlotsForDate({ venue, date, availability, liveBookings }).map((s) => ({
      ...s,
      dayName: new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short" }),
    }))
  );

  if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
  if (slotFilter) rows = rows.filter((r) => r.slotKey === slotFilter);
  if (bookingSearch?.trim()) {
    const q = bookingSearch.toLowerCase();
    rows = rows.filter((r) => (r.bookingId || "").toLowerCase().includes(q));
  }
  if (customerSearch?.trim()) {
    const q = customerSearch.toLowerCase();
    rows = rows.filter((r) => (r.customerName || "").toLowerCase().includes(q));
  }
  return rows;
}

/** Seed helper: build multi-slot availability for current + next month. */
export function buildMultiSlotAvailability(
  seed: number,
  bookings: Array<{
    eventDate: string;
    bookingId: string;
    customerName: string;
    eventType: string;
    guests: number;
  }>,
  pricingSlots?: PricingSlot[],
  pricingMethod: PricingMethod = "full_day"
): AvailabilityDay[] {
  const method = normalizePricingMethod(pricingMethod);
  const slots = [
    (pricingSlots || FALLBACK_SLOTS).find((s) => s.key === "full_day") ||
      FALLBACK_SLOTS.find((s) => s.key === "full_day")!,
  ];
  void method;

  const bookingByDate = new Map(bookings.map((b) => [b.eventDate, b]));
  const days: AvailabilityDay[] = [];
  const now = new Date();

  for (let monthOffset = 0; monthOffset <= 1; monthOffset += 1) {
    const year = now.getFullYear();
    const month = now.getMonth() + monthOffset;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dateObj = new Date(year, month, d);
      const dateStr = toYmd(dateObj);
      const dow = dateObj.getDay();
      const linked = bookingByDate.get(dateStr);

      slots.forEach((slot, slotIdx) => {
        const bucket = (d + seed + monthOffset * 3 + slotIdx * 2) % 12;
        void bucket;
        void dow;
        // V1 availability statuses: Available or Booked only
        let status: DayAvailabilityStatus = "available";
        if (linked && slotIdx === 0) {
          status = "booked";
        }

        const sample =
          status === "booked" && linked && slotIdx === 0
            ? {
                bookingId: linked.bookingId,
                customerName: linked.customerName,
                eventType: linked.eventType,
                guests: linked.guests,
              }
            : undefined;

        days.push({
          date: dateStr,
          status,
          slot: slot.name,
          bookingId: sample?.bookingId,
          customerName: sample?.customerName,
          eventType: sample?.eventType,
          guests: sample?.guests,
        });
      });
    }
  }
  return days;
}
