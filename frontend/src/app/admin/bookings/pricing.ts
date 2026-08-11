import type { Venue, PricingSlot, DayAvailabilityStatus, VenueAddon } from "../venues/types";
import type { BookingFormValues, BookingAddon, BookingMealLine } from "./types";
import { PLATFORM_COMMISSION_PERCENT } from "../venues/data";

export type AvailabilityBadge = "available" | "booked" | "blocked" | "unknown";

export const TIMED_SLOT_ORDER = ["morning", "afternoon", "evening", "night"] as const;

export const FOOD_SLOT_ORDER = ["breakfast", "lunch", "dinner"] as const;

export interface MealGuestFormEntry {
  key: string;
  veg: string;
  nonVeg: string;
}

export interface MealPricingLine {
  slotKey: string;
  name: string;
  timeLabel: string;
  startTime: string;
  endTime: string;
  vegPlatePrice: number;
  nonVegPlatePrice: number;
  vegGuests: number;
  nonVegGuests: number;
  vegCharges: number;
  nonVegCharges: number;
  mealTotal: number;
  totalGuests: number;
}

export interface BookingPricingBreakdown {
  venueCharges: number;
  foodCharges: number;
  addonCharges: number;
  gstAmount: number;
  gstMode: "included" | "excluded" | "";
  gstPercent: number;
  subtotalBeforeGst: number;
  bookingAmount: number;
  minOnlineAmount: number;
  minOnlineMode: "fixed" | "percent";
  minOnlinePercent: number;
  customerPaysOnline: number;
  remainingBalance: number;
  platformCommission: number;
  platformCommissionPercent: number;
  /** Advance minus platform commission */
  vendorReceivable: number;
  perPlatePrice: number;
  vegPlatePrice: number;
  nonVegPlatePrice: number;
  vegGuests: number;
  nonVegGuests: number;
  vegCharges: number;
  nonVegCharges: number;
  mealLines: MealPricingLine[];
  venuePricePerDay: number;
  dayCount: number;
  selectedSlots: PricingSlot[];
  selectedAddons: BookingAddon[];
}

/** Resolve explicit booking dates for multi-day pricing/display. */
export function resolveBookingDates(
  form: Pick<BookingFormValues, "eventDate" | "eventEndDate" | "selectedDates">
): string[] {
  const fromSelected = (form.selectedDates || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (fromSelected.length > 0) {
    return Array.from(new Set(fromSelected)).sort();
  }
  if (form.eventDate && form.eventEndDate && form.eventEndDate > form.eventDate) {
    const out: string[] = [];
    const cur = new Date(`${form.eventDate}T12:00:00`);
    const last = new Date(`${form.eventEndDate}T12:00:00`);
    while (cur <= last) {
      const y = cur.getFullYear();
      const m = String(cur.getMonth() + 1).padStart(2, "0");
      const d = String(cur.getDate()).padStart(2, "0");
      out.push(`${y}-${m}-${d}`);
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  }
  return form.eventDate ? [form.eventDate] : [];
}

export function normalizeSlotKey(raw?: string): string {
  const v = (raw || "").toLowerCase().trim();
  if (!v) return "";
  if (v.includes("morning") || v === "morning") return "morning";
  if (v.includes("afternoon") || v === "afternoon") return "afternoon";
  if (v.includes("evening") || v === "evening") return "evening";
  if (v.includes("night") || v === "night") return "night";
  if (v.includes("full") || v === "full_day") return "full_day";
  return v.replace(/\s+/g, "_");
}

/** Parse one or many slot keys from form.slotKey (comma-separated). */
export function parseSelectedSlotKeys(slotKey?: string, slotLabel?: string): string[] {
  const raw = (slotKey || "").trim();
  if (raw) {
    return raw
      .split(",")
      .map((k) => normalizeSlotKey(k))
      .filter(Boolean);
  }
  const fromLabel = normalizeSlotKey(slotLabel);
  return fromLabel ? [fromLabel] : [];
}

export function formatSelectedSlotLabel(slots: PricingSlot[]): string {
  if (slots.length === 0) return "";
  if (slots.length === 1) return slotDisplayLabel(slots[0]);
  if (slots.every((s) => s.key !== "full_day") && slots.length >= 4) {
    return "Full Day";
  }
  return slots.map((s) => s.name.replace(/ Slot$/i, "")).join(" + ");
}

export function slotDisplayLabel(slot: PricingSlot): string {
  if (slot.key === "full_day") return slot.name || "Full Day";
  return `${slot.name} (${slot.timeLabel})`;
}

export function parseTimeRange(timeLabel: string): { start: string; end: string } {
  const parts = (timeLabel || "").split(/[–—-]/).map((s) => s.trim()).filter(Boolean);
  return { start: parts[0] || "", end: parts[1] || "" };
}

/** Effective venue pricing model for a booking type */
export function getVenuePricingModel(
  venue: Venue | undefined,
  bookingType: "venue_only" | "venue_food"
): import("../venues/types").PricingMethod {
  if (!venue) return bookingType === "venue_food" ? "slot_based" : "full_day";
  // Venue + Food is always meal-slot based
  if (bookingType === "venue_food") return "slot_based";
  const m = venue.pricingMethod;
  if (m === "slot_based") return "slot_based";
  return "full_day";
}

/**
 * Enabled pricing options for booking UI.
 */
export function getEnabledSlots(
  venue: Venue | undefined,
  method: import("../venues/types").PricingMethod | "full_day" | "slot_based" = "full_day"
): PricingSlot[] {
  if (!venue?.pricingSlots?.length) return [];
  const slots = venue.pricingSlots.filter((s) => s.enabled !== false);
  if (method === "slot_based") {
    return slots.filter((s) => s.key !== "full_day");
  }
  return slots.filter((s) => s.key === "full_day");
}

export function getEnabledFoodSlots(venue: Venue | undefined) {
  return (venue?.foodSlots || []).filter((s) => s.enabled !== false);
}

export function sortFoodSlotKeys(keys: string[]): string[] {
  return [...keys].sort(
    (a, b) =>
      FOOD_SLOT_ORDER.indexOf(a as (typeof FOOD_SLOT_ORDER)[number]) -
      FOOD_SLOT_ORDER.indexOf(b as (typeof FOOD_SLOT_ORDER)[number])
  );
}

/** Parse comma-separated food slot keys; falls back to legacy single key. */
export function parseFoodSlotKeys(raw?: string, legacyKey?: string): string[] {
  const fromRaw = (raw || "")
    .split(",")
    .map((k) => normalizeSlotKey(k.trim()))
    .filter(Boolean);
  if (fromRaw.length > 0) {
    return sortFoodSlotKeys(Array.from(new Set(fromRaw)));
  }
  const legacy = normalizeSlotKey(legacyKey || "");
  return legacy ? [legacy] : [];
}

export function parseMealGuestsJson(json?: string): Record<string, MealGuestFormEntry> {
  if (!json?.trim()) return {};
  try {
    const parsed = JSON.parse(json) as
      | MealGuestFormEntry[]
      | Record<string, { veg: string; nonVeg: string }>;
    if (Array.isArray(parsed)) {
      return Object.fromEntries(
        parsed
          .filter((e) => e?.key)
          .map((e) => [normalizeSlotKey(e.key), { ...e, key: normalizeSlotKey(e.key) }])
      );
    }
    const out: Record<string, MealGuestFormEntry> = {};
    for (const [key, val] of Object.entries(parsed)) {
      const k = normalizeSlotKey(key);
      out[k] = { key: k, veg: val.veg ?? "", nonVeg: val.nonVeg ?? "" };
    }
    return out;
  } catch {
    return {};
  }
}

export function serializeMealGuests(entries: MealGuestFormEntry[]): string {
  return JSON.stringify(entries);
}

export function buildMealGuestEntries(
  form: Pick<
    BookingFormValues,
    | "foodSlotKeys"
    | "foodSlotKey"
    | "mealGuestsJson"
    | "vegGuestCount"
    | "nonVegGuestCount"
  >
): MealGuestFormEntry[] {
  const keys = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
  const map = parseMealGuestsJson(form.mealGuestsJson);

  if (!form.mealGuestsJson?.trim() && form.foodSlotKey && form.vegGuestCount) {
    return [
      {
        key: normalizeSlotKey(form.foodSlotKey),
        veg: form.vegGuestCount,
        nonVeg: form.nonVegGuestCount || "0",
      },
    ];
  }

  return keys.map(
    (key) => map[key] || { key, veg: "", nonVeg: "" }
  );
}

export function formatSelectedMealsLabel(
  venue: Venue | undefined,
  keys: string[]
): string {
  if (keys.length === 0) return "";
  return keys
    .map((key) => findFoodSlot(venue, key)?.name || key)
    .filter(Boolean)
    .join(", ");
}

export function formatSelectedMealsSlotLabel(
  venue: Venue | undefined,
  keys: string[]
): string {
  if (keys.length === 0) return "";
  return keys
    .map((key) => {
      const slot = findFoodSlot(venue, key);
      return slot ? `${slot.name} (${slot.timeLabel})` : key;
    })
    .join(" • ");
}

export function getFoodMealAvailability(
  venue: Venue | undefined,
  dates: string[],
  mealSlotKey: string,
  options?: { excludeBookingId?: string; excludeBookingRef?: string }
): AvailabilityBadge {
  if (!venue || !mealSlotKey || dates.length === 0) return "unknown";
  const key = normalizeSlotKey(mealSlotKey);

  let worst: AvailabilityBadge = "available";
  for (const date of dates) {
    const row = venue.availability?.find(
      (a) => a.date === date && normalizeSlotKey(a.slot) === key
    );
    if (!row) continue;
    if (row.status === "booked") {
      const own =
        (options?.excludeBookingId &&
          (row.bookingId === options.excludeBookingId ||
            row.bookingRef === options.excludeBookingId)) ||
        (options?.excludeBookingRef &&
          (row.bookingRef === options.excludeBookingRef ||
            row.bookingId === options.excludeBookingRef));
      if (!own) return "booked";
      continue;
    }
    if (
      row.status === "blocked" ||
      row.status === "holiday" ||
      row.status === "maintenance"
    ) {
      worst = "blocked";
    }
  }
  return worst;
}

export function findPricingSlot(
  venue: Venue | undefined,
  slotKey: string
): PricingSlot | undefined {
  if (!venue) return undefined;
  const key = normalizeSlotKey(slotKey);
  return venue.pricingSlots.find((s) => s.key === key || s.id === slotKey);
}

export function findFoodSlot(venue: Venue | undefined, slotKey: string) {
  if (!venue?.foodSlots?.length) return undefined;
  const key = normalizeSlotKey(slotKey);
  return venue.foodSlots.find((s) => s.key === key || s.id === slotKey);
}

export function areSlotKeysConsecutive(keys: string[]): boolean {
  const timed = keys
    .map(normalizeSlotKey)
    .filter((k) => k !== "full_day" && TIMED_SLOT_ORDER.includes(k as (typeof TIMED_SLOT_ORDER)[number]));
  if (timed.length <= 1) return true;
  const indexes = timed
    .map((k) => TIMED_SLOT_ORDER.indexOf(k as (typeof TIMED_SLOT_ORDER)[number]))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (indexes.length !== timed.length) return false;
  for (let i = 1; i < indexes.length; i++) {
    if (indexes[i] !== indexes[i - 1] + 1) return false;
  }
  return true;
}

/**
 * Toggle a timed slot. Selection must stay consecutive.
 * Returns next selected keys (ordered).
 */
export function toggleConsecutiveSlot(currentKeys: string[], toggleKey: string): string[] {
  const key = normalizeSlotKey(toggleKey);
  if (!key || key === "full_day") return currentKeys;

  const current = currentKeys
    .map(normalizeSlotKey)
    .filter((k) => k !== "full_day" && TIMED_SLOT_ORDER.includes(k as (typeof TIMED_SLOT_ORDER)[number]));

  if (current.includes(key)) {
    const next = current.filter((k) => k !== key);
    // Keep the longest consecutive run that still includes an end of the previous range
    if (areSlotKeysConsecutive(next)) return sortTimedKeys(next);
    // If broken, keep the contiguous segment that still borders the removed key
    const idx = TIMED_SLOT_ORDER.indexOf(key as (typeof TIMED_SLOT_ORDER)[number]);
    const left = current.filter(
      (k) => TIMED_SLOT_ORDER.indexOf(k as (typeof TIMED_SLOT_ORDER)[number]) < idx
    );
    const right = current.filter(
      (k) => TIMED_SLOT_ORDER.indexOf(k as (typeof TIMED_SLOT_ORDER)[number]) > idx
    );
    return sortTimedKeys(left.length >= right.length ? left : right);
  }

  if (current.length === 0) return [key];

  const next = [...current, key];
  if (areSlotKeysConsecutive(next)) return sortTimedKeys(next);

  // Not consecutive — start a new selection on the clicked slot
  return [key];
}

function sortTimedKeys(keys: string[]): string[] {
  return [...keys].sort(
    (a, b) =>
      TIMED_SLOT_ORDER.indexOf(a as (typeof TIMED_SLOT_ORDER)[number]) -
      TIMED_SLOT_ORDER.indexOf(b as (typeof TIMED_SLOT_ORDER)[number])
  );
}

export function getAvailabilityStatus(
  venue: Venue | undefined,
  date: string,
  slotKeyOrLabel: string
): AvailabilityBadge {
  if (!venue || !date || !slotKeyOrLabel) return "unknown";
  const keys = parseSelectedSlotKeys(slotKeyOrLabel, slotKeyOrLabel);
  if (keys.length === 0) return "unknown";

  let worst: AvailabilityBadge = "available";
  for (const key of keys) {
    const row = venue.availability?.find(
      (a) => a.date === date && normalizeSlotKey(a.slot) === key
    );
    if (!row) continue;
    if (row.status === "booked") return "booked";
    if (row.status === "blocked" || row.status === "holiday" || row.status === "maintenance")
      worst = "blocked";
  }
  return worst;
}

/**
 * Venue-only slot availability across one or many dates.
 * Rules:
 * - Full-day booking blocks every timed slot.
 * - Any booked timed slot blocks full-day booking for that date.
 */
export function getVenueOnlySlotAvailability(
  venue: Venue | undefined,
  dates: string[],
  slotKey: string,
  options?: { excludeBookingId?: string; excludeBookingRef?: string }
): AvailabilityBadge {
  if (!venue || !slotKey || dates.length === 0) return "unknown";
  const normalized = normalizeSlotKey(slotKey);
  let worst: AvailabilityBadge = "available";

  for (const date of dates) {
    const dayRows = (venue.availability || []).filter((a) => a.date === date);
    const bookedRows = dayRows.filter((a) => a.status === "booked");
    const blockedRows = dayRows.filter(
      (a) =>
        a.status === "blocked" ||
        a.status === "holiday" ||
        a.status === "maintenance"
    );

    const isOwnBookingRow = (row: (typeof bookedRows)[number]) =>
      (options?.excludeBookingId &&
        (row.bookingId === options.excludeBookingId ||
          row.bookingRef === options.excludeBookingId)) ||
      (options?.excludeBookingRef &&
        (row.bookingRef === options.excludeBookingRef ||
          row.bookingId === options.excludeBookingRef));

    const hasBlockingBooked = bookedRows.some((row) => {
      if (isOwnBookingRow(row)) return false;
      const rowKey = normalizeSlotKey(row.slotKey || row.slot);
      if (normalized === "full_day") return true;
      return rowKey === "full_day" || rowKey === normalized;
    });

    if (hasBlockingBooked) return "booked";

    const hasBlockingStatus = blockedRows.some((row) => {
      const rowKey = normalizeSlotKey(row.slotKey || row.slot);
      if (normalized === "full_day") return true;
      return rowKey === "full_day" || rowKey === normalized;
    });
    if (hasBlockingStatus) worst = "blocked";
  }

  return worst;
}

function resolveSelectedSlots(
  venue: Venue,
  form: Pick<BookingFormValues, "pricingMethod" | "slotKey" | "slot" | "bookingType">
): PricingSlot[] {
  if (form.bookingType === "venue_food") return [];

  const venueModel = getVenuePricingModel(venue, "venue_only");
  const selection =
    form.pricingMethod === "slot_based"
      ? "slot_based"
      : form.pricingMethod === "full_day"
        ? "full_day"
        : venueModel === "slot_based"
          ? "slot_based"
          : "full_day";

  if (selection === "full_day") {
    const full =
      findPricingSlot(venue, "full_day") || getEnabledSlots(venue, "full_day")[0];
    return full ? [full] : [];
  }

  const keys = parseSelectedSlotKeys(form.slotKey, form.slot).filter(
    (k) => k !== "full_day"
  );
  if (keys.length === 0) {
    const first = getEnabledSlots(venue, "slot_based")[0];
    return first ? [first] : [];
  }

  return keys
    .map((k) => findPricingSlot(venue, k))
    .filter((s): s is PricingSlot => Boolean(s));
}

function resolveAddonCharges(
  venue: Venue,
  form: Pick<BookingFormValues, "addonsCsv">
): { addonCharges: number; selectedAddons: BookingAddon[] } {
  const venueAddons = (venue.addons || []).filter((a) => a.active !== false);
  const selectedIds = (form.addonsCsv || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const selected: VenueAddon[] = venueAddons.filter(
    (a) => selectedIds.includes(a.id) || selectedIds.includes(a.name)
  );

  /** Informational only — pricing is negotiated offline */
  const selectedAddons: BookingAddon[] = selected.map((a) => ({
    id: a.id,
    name: a.name,
    amount: 0,
  }));

  return {
    addonCharges: 0,
    selectedAddons,
  };
}

/** Advance is always a percentage of booking total (1–100). */
export function resolveMinOnlineAmount(
  venue: Venue | undefined,
  bookingAmount: number
): { amount: number; mode: "fixed" | "percent"; percent: number } {
  if (!venue) return { amount: 0, mode: "percent", percent: 0 };

  let percent = Number(venue.advancePaymentPercent) || 0;
  if (percent < 0) percent = 0;
  if (percent > 100) percent = 100;

  const amount =
    bookingAmount > 0 && percent > 0
      ? Math.round((bookingAmount * percent) / 100)
      : 0;

  return {
    amount: Math.min(amount, bookingAmount || amount),
    mode: "percent",
    percent,
  };
}

/** Validate per-meal guest counts for Venue + Food bookings. */
export function validateMealSelections(
  form: Pick<
    BookingFormValues,
    | "bookingType"
    | "foodSlotKeys"
    | "foodSlotKey"
    | "mealGuestsJson"
    | "vegGuestCount"
    | "nonVegGuestCount"
  >,
  venue?: Venue
): { valid: boolean; message?: string } {
  if (form.bookingType !== "venue_food") return { valid: true };

  const keys = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
  if (keys.length === 0) {
    return { valid: false, message: "Select at least one meal slot." };
  }

  const entries = buildMealGuestEntries(form);
  for (const entry of entries) {
    const veg = Number(entry.veg) || 0;
    const nonVeg = Number(entry.nonVeg) || 0;
    if (veg < 0 || nonVeg < 0) {
      return { valid: false, message: "Guest counts cannot be negative." };
    }
    if (veg + nonVeg <= 0) {
      const slot = findFoodSlot(venue, entry.key);
      return {
        valid: false,
        message: `Enter guest counts for ${slot?.name || entry.key}.`,
      };
    }
  }

  return { valid: true };
}

export function mealLinesToBookingMeals(lines: MealPricingLine[]): BookingMealLine[] {
  return lines.map((m) => ({
    slotKey: m.slotKey,
    name: m.name,
    timeLabel: m.timeLabel,
    startTime: m.startTime,
    endTime: m.endTime,
    vegPlatePrice: m.vegPlatePrice,
    nonVegPlatePrice: m.nonVegPlatePrice,
    vegGuests: m.vegGuests,
    nonVegGuests: m.nonVegGuests,
    mealTotal: m.mealTotal,
  }));
}

/** @deprecated Use validateMealSelections */
export function validateFoodGuestSplit(
  form: Pick<
    BookingFormValues,
    | "bookingType"
    | "guestCount"
    | "vegGuestCount"
    | "nonVegGuestCount"
    | "foodSlotKeys"
    | "foodSlotKey"
    | "mealGuestsJson"
  >
): { valid: boolean; message?: string } {
  return validateMealSelections(form);
}

export function calculateBookingPricing(
  venue: Venue | undefined,
  form: Pick<
    BookingFormValues,
    | "bookingType"
    | "pricingMethod"
    | "slotKey"
    | "slot"
    | "foodSlotKey"
    | "foodSlotKeys"
    | "mealGuestsJson"
    | "guestCount"
    | "vegGuestCount"
    | "nonVegGuestCount"
    | "addonsCsv"
    | "advancePaid"
    | "eventDate"
    | "eventEndDate"
    | "selectedDates"
  >
): BookingPricingBreakdown {
  const empty: BookingPricingBreakdown = {
    venueCharges: 0,
    foodCharges: 0,
    addonCharges: 0,
    gstAmount: 0,
    gstMode: "",
    gstPercent: 0,
    subtotalBeforeGst: 0,
    bookingAmount: 0,
    minOnlineAmount: 0,
    minOnlineMode: "percent",
    minOnlinePercent: venue?.advancePaymentPercent || 0,
    customerPaysOnline: 0,
    remainingBalance: 0,
    platformCommission: 0,
    platformCommissionPercent: PLATFORM_COMMISSION_PERCENT,
    vendorReceivable: 0,
    perPlatePrice: 0,
    vegPlatePrice: 0,
    nonVegPlatePrice: 0,
    vegGuests: 0,
    nonVegGuests: 0,
    vegCharges: 0,
    nonVegCharges: 0,
    mealLines: [],
    venuePricePerDay: 0,
    dayCount: 1,
    selectedSlots: [],
    selectedAddons: [],
  };

  if (!venue) return empty;

  const dayCount = Math.max(1, resolveBookingDates(form).length);

  const selectedSlots =
    form.bookingType === "venue_food" ? [] : resolveSelectedSlots(venue, form);
  const venuePricePerDay = selectedSlots.reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0
  );
  const venueCharges = venuePricePerDay * dayCount;

  const useFoodSlot = form.bookingType === "venue_food";
  const food = venue.foodPricing;
  const mealKeys = useFoodSlot
    ? parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey)
    : [];
  const guestEntries = useFoodSlot ? buildMealGuestEntries(form) : [];
  const mealValid = useFoodSlot
    ? validateMealSelections(form, venue).valid
    : false;

  const mealLines: MealPricingLine[] = [];
  let vegCharges = 0;
  let nonVegCharges = 0;
  let vegGuests = 0;
  let nonVegGuests = 0;
  let vegPlatePrice = 0;
  let nonVegPlatePrice = 0;

  if (useFoodSlot) {
    for (const key of mealKeys) {
      const slot = findFoodSlot(venue, key);
      if (!slot) continue;
      const entry = guestEntries.find((e) => e.key === key) || {
        key,
        veg: "0",
        nonVeg: "0",
      };
      const mealVegGuests = Number(entry.veg) || 0;
      const mealNonVegGuests = Number(entry.nonVeg) || 0;
      const mealVegPlate = Number(slot.vegPlateCost ?? food?.vegPlateCost) || 0;
      const mealNonVegPlate =
        Number(slot.nonVegPlateCost ?? food?.nonVegPlateCost) || 0;
      const times = parseTimeRange(slot.timeLabel);

      let lineVegCharges = 0;
      let lineNonVegCharges = 0;
      if (mealValid) {
        lineVegCharges =
          mealVegGuests > 0 && mealVegPlate > 0
            ? mealVegGuests * mealVegPlate * dayCount
            : 0;
        lineNonVegCharges =
          mealNonVegGuests > 0 && mealNonVegPlate > 0
            ? mealNonVegGuests * mealNonVegPlate * dayCount
            : 0;
      }

      vegCharges += lineVegCharges;
      nonVegCharges += lineNonVegCharges;
      vegGuests += mealVegGuests;
      nonVegGuests += mealNonVegGuests;

      mealLines.push({
        slotKey: slot.key,
        name: slot.name,
        timeLabel: slot.timeLabel,
        startTime: times.start || "",
        endTime: times.end || "",
        vegPlatePrice: mealVegPlate,
        nonVegPlatePrice: mealNonVegPlate,
        vegGuests: mealVegGuests,
        nonVegGuests: mealNonVegGuests,
        vegCharges: lineVegCharges,
        nonVegCharges: lineNonVegCharges,
        mealTotal: lineVegCharges + lineNonVegCharges,
        totalGuests: mealVegGuests + mealNonVegGuests,
      });
    }

    if (mealLines.length === 1) {
      vegPlatePrice = mealLines[0].vegPlatePrice;
      nonVegPlatePrice = mealLines[0].nonVegPlatePrice;
    }
  }

  const foodCharges = vegCharges + nonVegCharges;
  const perPlatePrice = 0;

  // Additional services are informational only (no pricing impact)
  const { selectedAddons } = resolveAddonCharges(venue, form);
  const addonCharges = 0;

  const subtotalBeforeGst = venueCharges + foodCharges;

  const gstMode = venue.gstMode || "excluded";
  const gstPercent = Number(venue.gstPercent) || 0;
  const gstAmount =
    gstPercent > 0 && subtotalBeforeGst > 0
      ? gstMode === "excluded"
        ? Math.round((subtotalBeforeGst * gstPercent) / 100)
        : Math.round(subtotalBeforeGst - subtotalBeforeGst / (1 + gstPercent / 100))
      : 0;

  const bookingAmount =
    gstMode === "excluded" ? subtotalBeforeGst + gstAmount : subtotalBeforeGst;

  const minOnline = resolveMinOnlineAmount(venue, bookingAmount);
  /** Advance is always auto-calculated from advance % — no manual override */
  const customerPaysOnline = minOnline.amount;

  // Commission ONLY on advance amount collected online
  const platformCommission = Math.round(
    (customerPaysOnline * PLATFORM_COMMISSION_PERCENT) / 100
  );
  const vendorReceivable = Math.max(0, customerPaysOnline - platformCommission);

  return {
    venueCharges,
    foodCharges,
    addonCharges,
    gstAmount,
    gstMode,
    gstPercent,
    subtotalBeforeGst,
    bookingAmount,
    minOnlineAmount: minOnline.amount,
    minOnlineMode: "percent",
    minOnlinePercent: minOnline.percent,
    customerPaysOnline,
    remainingBalance: Math.max(0, bookingAmount - customerPaysOnline),
    platformCommission,
    platformCommissionPercent: PLATFORM_COMMISSION_PERCENT,
    vendorReceivable,
    perPlatePrice,
    vegPlatePrice,
    nonVegPlatePrice,
    vegGuests,
    nonVegGuests,
    vegCharges,
    nonVegCharges,
    mealLines,
    venuePricePerDay,
    dayCount,
    selectedSlots,
    selectedAddons,
  };
}

export function applyPricingToForm(
  form: BookingFormValues,
  breakdown: BookingPricingBreakdown
): BookingFormValues {
  const seededAdvance =
    breakdown.minOnlineAmount > 0 && breakdown.bookingAmount > 0
      ? String(Math.min(breakdown.minOnlineAmount, breakdown.bookingAmount))
      : breakdown.bookingAmount > 0
        ? "0"
        : "";
  const advance = Number(seededAdvance) || 0;
  const remaining = breakdown.bookingAmount - advance;

  return {
    ...form,
    bookingAmount: breakdown.bookingAmount ? String(breakdown.bookingAmount) : "",
    taxAmount: breakdown.gstAmount ? String(breakdown.gstAmount) : form.taxAmount,
    advancePaid: seededAdvance,
    addonsCsv:
      form.addonsCsv ||
      breakdown.selectedAddons.map((a) => a.id).join(","),
    paymentStatus:
      advance > 0
        ? remaining > 0
          ? "partial"
          : "paid"
        : form.paymentStatus || "unpaid",
  };
}

/** Which booking types the venue has pricing configured for. */
export function getVenueBookingTypeSupport(venue: Venue | undefined): {
  venueOnly: boolean;
  venueFood: boolean;
} {
  if (!venue) return { venueOnly: true, venueFood: true };

  const venueModel = venue.pricingMethod || "full_day";
  const hasFullDay =
    (Number(findPricingSlot(venue, "full_day")?.price) || 0) > 0 ||
    venueModel === "full_day";
  const hasTimedSlots =
    getEnabledSlots(venue, "slot_based").length > 0 || venueModel === "slot_based";
  const venueOnly =
    hasFullDay ||
    hasTimedSlots ||
    venue.bookingModel === "venue_only" ||
    (venue.pricingSlots || []).some((s) => s.enabled !== false);

  const venueFood =
    getEnabledFoodSlots(venue).length > 0 || venue.bookingModel === "venue_food";

  return { venueOnly, venueFood };
}

/** Default booking type for a venue based on configured pricing. */
export function resolveDefaultBookingType(
  venue: Venue
): BookingFormValues["bookingType"] {
  const { venueOnly, venueFood } = getVenueBookingTypeSupport(venue);
  if (venueOnly && !venueFood) return "venue_only";
  if (!venueOnly && venueFood) return "venue_food";
  return (venue.bookingModel || "venue_only") as BookingFormValues["bookingType"];
}

/** Auto-populate venue-related form fields. Never touches customer fields. */
export function buildVenueFormPatch(
  venue: Venue,
  options?: {
    /** Preserve an already-chosen slot (e.g. from availability) */
    preserveSlot?: { slotKey?: string; slotLabel?: string };
    /** Keep current booking type when still supported by the venue */
    preferBookingType?: BookingFormValues["bookingType"];
  }
): Partial<BookingFormValues> {
  const support = getVenueBookingTypeSupport(venue);
  let bookingType = resolveDefaultBookingType(venue);
  if (options?.preferBookingType === "venue_only" && support.venueOnly) {
    bookingType = "venue_only";
  } else if (options?.preferBookingType === "venue_food" && support.venueFood) {
    bookingType = "venue_food";
  }

  const venueModel = getVenuePricingModel(venue, bookingType);
  const defaultSelection: "full_day" | "slot_based" =
    venueModel === "slot_based" ? "slot_based" : "full_day";

  let slotKey = "full_day";
  let slotLabel = "Full Day";
  let startTime = "9 AM";
  let endTime = "11 PM";
  let foodSlotKey = "";
  let pricingMethod: "full_day" | "slot_based" = defaultSelection;

  if (options?.preserveSlot?.slotKey || options?.preserveSlot?.slotLabel) {
    const keys = parseSelectedSlotKeys(
      options.preserveSlot.slotKey,
      options.preserveSlot.slotLabel
    );
    const found = keys
      .map((k) => venue.pricingSlots.find((s) => s.key === k))
      .filter((s): s is PricingSlot => Boolean(s));
    if (found.length) {
      slotKey = found.map((s) => s.key).join(",");
      slotLabel = formatSelectedSlotLabel(found);
      pricingMethod = found.some((s) => s.key === "full_day")
        ? "full_day"
        : "slot_based";
      const first = parseTimeRange(found[0].timeLabel);
      const last = parseTimeRange(found[found.length - 1].timeLabel);
      startTime = first.start || startTime;
      endTime = last.end || endTime;
    }
  } else if (bookingType === "venue_food") {
    const meal = getEnabledFoodSlots(venue)[0];
    pricingMethod = "slot_based";
    if (meal) {
      foodSlotKey = meal.key;
      slotKey = meal.key;
      slotLabel = `${meal.name} (${meal.timeLabel})`;
      const times = parseTimeRange(meal.timeLabel);
      startTime = times.start || startTime;
      endTime = times.end || endTime;
    }
  } else {
    const slots = getEnabledSlots(
      venue,
      defaultSelection === "slot_based" ? "slot_based" : "full_day"
    );
    if (slots[0]) {
      slotKey = slots[0].key;
      slotLabel = slotDisplayLabel(slots[0]);
      pricingMethod = slots[0].key === "full_day" ? "full_day" : "slot_based";
      const times = parseTimeRange(slots[0].timeLabel);
      startTime = times.start || "9 AM";
      endTime = times.end || "11 PM";
    }
  }

  return {
    venueId: venue.id || venue.venueId,
    venueName: venue.name,
    businessId: venue.businessId,
    businessName: venue.businessName || "",
    vendorId: venue.ownerId || "",
    vendorName: venue.ownerName || "",
    bookingType,
    pricingMethod,
    foodType: "",
    foodSlotKey: "",
    foodSlotKeys: "",
    mealGuestsJson: "",
    vegGuestCount: "",
    nonVegGuestCount: "",
    slotKey,
    slot: slotLabel,
    startTime,
    endTime,
    addonsCsv: "",
    bookingAmount: "",
    advancePaid: "",
    taxAmount: "",
  };
}

export function availabilityLabel(status: AvailabilityBadge | DayAvailabilityStatus): string {
  if (status === "booked") return "Already Booked";
  if (status === "blocked" || status === "holiday" || status === "maintenance") return "Blocked";
  if (status === "available") return "Available";
  return "Checking…";
}

export function resolveBookingStatusFromPayment(args: {
  currentStatus: BookingFormValues["bookingStatus"] | string;
  paidAmount: number;
  bookingAmount: number;
  eventDate?: string;
}): BookingFormValues["bookingStatus"] {
  const { currentStatus, paidAmount, bookingAmount, eventDate } = args;
  if (currentStatus === "cancelled" || currentStatus === "refunded") {
    return currentStatus as BookingFormValues["bookingStatus"];
  }
  if (currentStatus === "completed") return "completed";

  const today = new Date().toISOString().slice(0, 10);
  if (eventDate && eventDate < today && paidAmount >= bookingAmount && bookingAmount > 0) {
    return "completed";
  }

  if (paidAmount <= 0) {
    return currentStatus === "draft" ? "draft" : "pending";
  }
  // Advance or full payment received → Confirmed (Paid is payment status, not booking status)
  return "confirmed";
}
