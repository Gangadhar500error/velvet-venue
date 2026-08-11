import type { BookingFormValues } from "./types";
import {
  buildMealGuestEntries,
  parseDateSlotsJson,
  parseFoodSlotKeys,
  parseSelectedSlotKeys,
  resolveBookingDates,
} from "./pricing";
import type { BookingQuotePayload } from "@/lib/bookings";

export function formToBookingPayload(form: BookingFormValues): BookingQuotePayload {
  const dates = resolveBookingDates(form);
  const slotKeys =
    form.bookingType === "venue_food"
      ? parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey)
      : parseSelectedSlotKeys(form.slotKey, form.slot);
  const foodSlots =
    form.bookingType === "venue_food"
      ? buildMealGuestEntries(form).map((entry) => ({
          meal_key: entry.key,
          veg_count: Number(entry.veg) || 0,
          nonveg_count: Number(entry.nonVeg) || 0,
        }))
      : [];
  const services = (form.addonsCsv || "")
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name, price: 0, quantity: 1 }));
  const perDate = parseDateSlotsJson(form.dateSlotsJson);
  const dateSlots = Object.entries(perDate)
    .filter(([, keys]) => keys.length > 0)
    .map(([event_date, keys]) => ({ event_date, slot_keys: keys }));
  const receivedRaw = form.advancePaid.trim();
  const amountReceived =
    receivedRaw === "" ? undefined : Number(receivedRaw);

  return {
    venue_id: form.venueId,
    customer_id: form.customerId || null,
    event_date: dates[0] || form.eventDate,
    event_end_date: dates[dates.length - 1] || form.eventEndDate || null,
    selected_dates: dates,
    booking_type: form.bookingType,
    booking_mode: form.pricingMethod,
    event_type: form.eventType || null,
    guest_count: Number(form.guestCount) || 0,
    special_note: form.specialRequirements || form.notes || null,
    slot_keys: slotKeys,
    food_slots: foodSlots,
    services,
    discount: Number(form.discountAmount) || 0,
    assigned_executive: form.assignedExecutive || null,
    payment_method: form.paymentMethod || null,
    amount_received: Number.isFinite(amountReceived) ? amountReceived : undefined,
    date_slots: dateSlots.length ? dateSlots : undefined,
  };
}
