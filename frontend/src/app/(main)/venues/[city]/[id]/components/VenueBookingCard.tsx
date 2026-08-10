"use client";

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Users,
  Phone,
  MessageCircle,
  CalendarDays,
  ShieldCheck,
  Clock,
  Check,
  Building2,
  UtensilsCrossed,
  MapPin,
} from "lucide-react";
import type { Venue } from "@/app/admin/venues/types";
import type { BookingFormValues } from "@/app/admin/bookings/types";
import {
  calculateBookingPricing,
  getEnabledFoodSlots,
  getEnabledSlots,
  getVenueBookingTypeSupport,
  getVenuePricingModel,
  resolveDefaultBookingType,
  buildVenueFormPatch,
  slotDisplayLabel,
  parseFoodSlotKeys,
  getVenueOnlySlotAvailability,
  getFoodMealAvailability,
  resolveBookingDates,
} from "@/app/admin/bookings/pricing";
import { formatINR } from "./resolvePublicVenue";
import MultiDatePicker from "./MultiDatePicker";
import BookingDetailsModal from "./BookingDetailsModal";
import { savePendingBooking } from "./bookingDraft";

interface VenueBookingCardProps {
  venue: Venue;
  onBook?: () => void;
  onScheduleVisit?: () => void;
}

function emptyPublicForm(venue: Venue): BookingFormValues {
  const patch = buildVenueFormPatch(venue);
  const bookingType = patch.bookingType || resolveDefaultBookingType(venue);
  const foodSlots = getEnabledFoodSlots(venue);
  const firstMeal = foodSlots[0];
  const foodKey =
    bookingType === "venue_food"
      ? patch.foodSlotKey || firstMeal?.key || ""
      : "";
  const foodKeys =
    bookingType === "venue_food" ? patch.foodSlotKeys || foodKey : "";

  // Default Venue Only to Full Day when available
  const fullDay = getEnabledSlots(venue, "full_day")[0];
  const pricingMethod =
    bookingType === "venue_only"
      ? fullDay
        ? "full_day"
        : patch.pricingMethod || "slot_based"
      : "slot_based";

  return {
    customerMode: "new",
    customerId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    businessId: patch.businessId || "",
    businessName: patch.businessName || "",
    venueId: patch.venueId || venue.venueId,
    venueName: venue.name,
    vendorId: patch.vendorId || "",
    vendorName: patch.vendorName || "",
    availabilityLabel: "",
    slot:
      bookingType === "venue_only" && fullDay
        ? slotDisplayLabel(fullDay)
        : patch.slot || "Full Day",
    slotKey:
      bookingType === "venue_only" && fullDay
        ? fullDay.key
        : patch.slotKey || "full_day",
    bookingType,
    pricingMethod,
    foodType: "",
    foodSlotKey: foodKey,
    foodSlotKeys: foodKeys,
    mealGuestsJson:
      bookingType === "venue_food" && foodKeys
        ? syncMealGuests(foodKeys, venue.minGuests || 100, "both")
        : "",
    vegGuestCount: "",
    nonVegGuestCount: "",
    startTime: patch.startTime || "9 AM",
    endTime: patch.endTime || "11 PM",
    eventType: venue.eventCategories?.[0] || "Wedding",
    eventDate: "",
    selectedDates: "",
    guestCount: String(venue.minGuests || 100),
    specialRequirements: "",
    bookingAmount: "",
    advancePaid: "",
    taxAmount: "",
    discountAmount: "",
    paymentMethod: "",
    transactionReference: "",
    paymentStatus: "unpaid",
    bookingStatus: "draft",
    assignedExecutive: "",
    notes: "",
    addonsCsv: "",
  };
}

function syncMealGuests(
  keysCsv: string,
  guestCount: number,
  mode: "veg" | "non_veg" | "both"
) {
  const keys = parseFoodSlotKeys(keysCsv);
  const veg =
    mode === "non_veg" ? 0 : mode === "veg" ? guestCount : Math.ceil(guestCount / 2);
  const nonVeg =
    mode === "veg" ? 0 : mode === "non_veg" ? guestCount : Math.floor(guestCount / 2);
  return JSON.stringify(
    keys.map((key) => ({
      key,
      veg: String(veg),
      nonVeg: String(nonVeg),
    }))
  );
}

export default function VenueBookingCard({
  venue,
  onScheduleVisit,
}: VenueBookingCardProps) {
  const router = useRouter();
  const [form, setForm] = useState<BookingFormValues>(() => emptyPublicForm(venue));
  const [cuisine, setCuisine] = useState<"veg" | "non_veg" | "both">("both");
  const [modalOpen, setModalOpen] = useState(false);
  const [errors, setErrors] = useState<{
    bookingType?: string;
    dates?: string;
    guests?: string;
    meals?: string;
  }>({});

  const patch = useCallback((partial: Partial<BookingFormValues>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const support = useMemo(() => getVenueBookingTypeSupport(venue), [venue]);
  const pricing = useMemo(() => calculateBookingPricing(venue, form), [venue, form]);
  const venueModel = getVenuePricingModel(venue, form.bookingType);
  const fullDaySlots = useMemo(() => getEnabledSlots(venue, "full_day"), [venue]);
  const timedSlots = useMemo(() => getEnabledSlots(venue, "slot_based"), [venue]);
  const foodSlots = useMemo(() => getEnabledFoodSlots(venue), [venue]);
  const selectedFoodKeys = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
  const activeAddons = (venue.addons || []).filter((a) => a.active !== false);
  const selectedAddonIds = new Set(
    (form.addonsCsv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const selectedServiceNames = activeAddons
    .filter((a) => selectedAddonIds.has(a.id))
    .map((a) => a.name);

  const guests = Math.max(0, parseInt(form.guestCount || "0", 10) || 0);
  const minGuests = venue.minGuests || 1;
  const maxGuests = venue.maxGuests || 1000;
  const startsFrom = venue.startingPrice || fullDaySlots[0]?.price || 0;

  const selectedDates = useMemo(
    () => resolveBookingDates(form),
    [form.eventDate, form.selectedDates, form.eventEndDate]
  );

  const setSelectedDates = (dates: string[]) => {
    const sorted = [...dates].sort();
    patch({
      selectedDates: sorted.join(","),
      eventDate: sorted[0] || "",
      eventEndDate: sorted.length > 1 ? sorted[sorted.length - 1] : "",
    });
    if (sorted.length) {
      setErrors((e) => ({ ...e, dates: undefined }));
    }
  };

  const setBookingType = (type: "venue_only" | "venue_food") => {
    const next = buildVenueFormPatch(venue, { preferBookingType: type });
    const meal = getEnabledFoodSlots(venue)[0];
    const foodKey =
      type === "venue_food" ? next.foodSlotKey || meal?.key || "" : "";
    const foodKeys = type === "venue_food" ? next.foodSlotKeys || foodKey : "";
    const fullDay = getEnabledSlots(venue, "full_day")[0];

    patch({
      bookingType: type,
      pricingMethod:
        type === "venue_only"
          ? fullDay
            ? "full_day"
            : "slot_based"
          : "slot_based",
      slotKey:
        type === "venue_only" && fullDay
          ? fullDay.key
          : type === "venue_food"
            ? foodKey || next.slotKey
            : next.slotKey,
      slot:
        type === "venue_only" && fullDay
          ? slotDisplayLabel(fullDay)
          : next.slot,
      foodSlotKey: foodKey,
      foodSlotKeys: foodKeys,
      startTime: next.startTime,
      endTime: next.endTime,
      mealGuestsJson:
        type === "venue_food" && foodKeys
          ? syncMealGuests(foodKeys, guests, cuisine)
          : "",
    });
    setErrors((e) => ({ ...e, bookingType: undefined, meals: undefined }));
  };

  const setGuests = (value: number) => {
    const clamped = Math.min(maxGuests, Math.max(0, value));
    const guestCount = String(clamped);
    if (form.bookingType === "venue_food") {
      patch({
        guestCount,
        mealGuestsJson: syncMealGuests(
          form.foodSlotKeys || form.foodSlotKey,
          clamped,
          cuisine
        ),
      });
    } else {
      patch({ guestCount });
    }
    if (clamped >= minGuests && clamped <= maxGuests) {
      setErrors((e) => ({ ...e, guests: undefined }));
    }
  };

  const toggleFoodSlot = (key: string) => {
    const set = new Set(selectedFoodKeys);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    const keys = Array.from(set);
    const csv = keys.join(",");
    patch({
      foodSlotKey: keys[0] || "",
      foodSlotKeys: csv,
      pricingMethod: "slot_based",
      slotKey: keys[0] || "",
      mealGuestsJson: syncMealGuests(csv, guests, cuisine),
    });
    if (keys.length) setErrors((e) => ({ ...e, meals: undefined }));
  };

  const toggleAddon = (id: string) => {
    const set = new Set(selectedAddonIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    patch({ addonsCsv: Array.from(set).join(",") });
  };

  const phone = venue.contactPhone || venue.ownerPhone || "";
  const wa = phone.replace(/\D/g, "");

  const slotStatus = (key: string) => {
    if (!selectedDates.length) return "available" as const;
    return getVenueOnlySlotAvailability(venue, selectedDates, key);
  };

  const mealStatus = (key: string) => {
    if (!selectedDates.length) return "available" as const;
    return getFoodMealAvailability(venue, selectedDates, key);
  };

  const validateBooking = () => {
    const next: typeof errors = {};
    if (!form.bookingType) next.bookingType = "Please select a booking type";
    if (!selectedDates.length) next.dates = "Please select at least one event date";
    if (!guests || guests < minGuests)
      next.guests = `Guest count must be at least ${minGuests}`;
    else if (guests > maxGuests)
      next.guests = `Guest count cannot exceed ${maxGuests}`;
    if (form.bookingType === "venue_food" && selectedFoodKeys.length === 0)
      next.meals = "Please select at least one meal package";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleBookNow = () => {
    if (!validateBooking()) return;
    setModalOpen(true);
  };

  const handleProceedToPayment = (details: {
    fullName: string;
    mobile: string;
    email: string;
    city: string;
  }) => {
    const foodLabels = selectedFoodKeys.map(
      (k) => foodSlots.find((f) => f.key === k)?.name || k
    );

    savePendingBooking({
      venueId: venue.venueId || venue.id,
      venueName: venue.name,
      city: venue.city,
      area: venue.addressLine1,
      bookingType: form.bookingType,
      pricingMethod: form.pricingMethod,
      slotLabel: form.slot,
      slotKey: form.slotKey,
      foodSlotKeys: form.foodSlotKeys,
      foodSlotLabels: foodLabels,
      selectedDates,
      guestCount: guests,
      services: selectedServiceNames,
      notes: form.specialRequirements || "",
      estimatedTotal: pricing.bookingAmount,
      payOnlineNow: pricing.customerPaysOnline || pricing.bookingAmount,
      customerName: details.fullName,
      customerPhone: details.mobile,
      customerEmail: details.email,
      customerCity: details.city,
      createdAt: new Date().toISOString(),
    });

    setModalOpen(false);
    router.push("/booking/payment");
  };

  return (
    <>
      <aside className="rounded-[20px] border border-[#ECECEC] bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-[#6B7280]">Starts From</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-[#1F2937]">
              {formatINR(startsFrom)}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center gap-1 text-[#C89B3C]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < Math.round(venue.rating)
                      ? "fill-[#C89B3C] text-[#C89B3C]"
                      : "text-[#E5E7EB]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">
              {venue.rating} · {venue.totalReviews} reviews
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-[12px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] px-2.5 py-1 font-medium text-[#166534]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Available
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF6EA] px-2.5 py-1 font-medium text-[#1F2937]">
            <Users className="h-3.5 w-3.5 text-[#C89B3C]" />
            Up to {venue.maxGuests} guests
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-1 font-medium text-[#6B7280]">
            <Clock className="h-3.5 w-3.5" />
            Responds in ~2 hrs
          </span>
        </div>

        {/* Booking Type */}
        {(support.venueOnly || support.venueFood) && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1F2937]">
              Booking Type
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {support.venueOnly && (
                <button
                  type="button"
                  onClick={() => setBookingType("venue_only")}
                  className={`relative rounded-[16px] border p-3 text-left transition-all duration-250 ${
                    form.bookingType === "venue_only"
                      ? "border-[#C89B3C] bg-[#FBF6EA] shadow-sm"
                      : "border-[#ECECEC] bg-white hover:border-[#E9D39B]"
                  }`}
                >
                  {form.bookingType === "venue_only" && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C89B3C] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <Building2 className="mb-1.5 h-4 w-4 text-[#C89B3C]" />
                  <p className="text-[13px] font-semibold text-[#1F2937]">
                    Venue Only
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6B7280]">
                    Book only the venue space
                  </p>
                  <p className="mt-1.5 text-[12px] font-semibold text-[#C89B3C]">
                    From{" "}
                    {formatINR(
                      fullDaySlots[0]?.price || timedSlots[0]?.price || startsFrom
                    )}
                  </p>
                </button>
              )}
              {support.venueFood && (
                <button
                  type="button"
                  onClick={() => setBookingType("venue_food")}
                  className={`relative rounded-[16px] border p-3 text-left transition-all duration-250 ${
                    form.bookingType === "venue_food"
                      ? "border-[#C89B3C] bg-[#FBF6EA] shadow-sm"
                      : "border-[#ECECEC] bg-white hover:border-[#E9D39B]"
                  }`}
                >
                  {form.bookingType === "venue_food" && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#C89B3C] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <UtensilsCrossed className="mb-1.5 h-4 w-4 text-[#C89B3C]" />
                  <p className="text-[13px] font-semibold text-[#1F2937]">
                    Venue + Food
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#6B7280]">
                    Includes catering
                  </p>
                  <p className="mt-1.5 text-[12px] font-semibold text-[#C89B3C]">
                    From{" "}
                    {formatINR(
                      (foodSlots[0]?.vegPlateCost || 500) * (venue.minGuests || 100)
                    )}
                  </p>
                </button>
              )}
            </div>
            {errors.bookingType && (
              <p className="mt-1.5 text-[11px] font-medium text-[#EF4444]">
                {errors.bookingType}
              </p>
            )}
          </div>
        )}

        {/* Venue Only mode */}
        {form.bookingType === "venue_only" && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1F2937]">
              Booking Mode
            </p>
            <div className="mb-3 flex gap-2 rounded-xl bg-[#F3F4F6] p-1">
              {fullDaySlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const s = fullDaySlots[0];
                    patch({
                      pricingMethod: "full_day",
                      slotKey: s.key,
                      slot: slotDisplayLabel(s),
                    });
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-250 ${
                    form.pricingMethod === "full_day"
                      ? "bg-white text-[#1F2937] shadow-sm"
                      : "text-[#6B7280]"
                  }`}
                >
                  Full Day
                </button>
              )}
              {timedSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const s = timedSlots[0];
                    patch({
                      pricingMethod: "slot_based",
                      slotKey: s.key,
                      slot: slotDisplayLabel(s),
                    });
                  }}
                  className={`flex-1 rounded-lg px-3 py-2 text-[13px] font-semibold transition-all duration-250 ${
                    form.pricingMethod === "slot_based"
                      ? "bg-white text-[#1F2937] shadow-sm"
                      : "text-[#6B7280]"
                  }`}
                >
                  Slot Based
                </button>
              )}
            </div>

            {form.pricingMethod === "full_day" && fullDaySlots[0] && (
              <div className="space-y-2 rounded-[14px] border border-[#ECECEC] bg-[#FAFAFA] p-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Duration</span>
                  <span className="font-medium text-[#1F2937]">
                    {venue.bookingDuration || fullDaySlots[0].timeLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Operating Hours</span>
                  <span className="font-medium text-[#1F2937]">
                    {venue.operatingHours || fullDaySlots[0].timeLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Max Guests</span>
                  <span className="font-medium text-[#1F2937]">
                    {fullDaySlots[0].maxGuests || venue.maxGuests}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Venue Price / Day</span>
                  <span className="font-semibold text-[#C89B3C]">
                    {formatINR(fullDaySlots[0].price)}
                  </span>
                </div>
              </div>
            )}

            {form.pricingMethod === "slot_based" && (
              <div className="grid grid-cols-2 gap-2">
                {timedSlots.map((slot) => {
                  const status = slotStatus(slot.key);
                  const soldOut = status === "booked" || status === "blocked";
                  const selected = form.slotKey === slot.key;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={soldOut}
                      onClick={() =>
                        patch({
                          slotKey: slot.key,
                          slot: slotDisplayLabel(slot),
                          pricingMethod: "slot_based",
                        })
                      }
                      className={`rounded-[14px] border p-2.5 text-left transition-all duration-250 ${
                        soldOut
                          ? "cursor-not-allowed border-[#ECECEC] bg-[#F9FAFB] opacity-60"
                          : selected
                            ? "border-[#C89B3C] bg-[#FBF6EA]"
                            : "border-[#ECECEC] hover:border-[#E9D39B]"
                      }`}
                    >
                      <p className="text-[13px] font-semibold text-[#1F2937]">
                        {slot.name}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">{slot.timeLabel}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[#C89B3C]">
                        {formatINR(slot.price)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Venue + Food meals — hidden for Venue Only */}
        {form.bookingType === "venue_food" && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1F2937]">
              Meal Packages
            </p>
            <div className="mb-3 flex gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
              {(["veg", "non_veg", "both"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setCuisine(c);
                    patch({
                      mealGuestsJson: syncMealGuests(
                        form.foodSlotKeys || form.foodSlotKey,
                        guests,
                        c
                      ),
                    });
                  }}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold capitalize transition-all duration-250 ${
                    cuisine === c
                      ? "bg-white text-[#1F2937] shadow-sm"
                      : "text-[#6B7280]"
                  }`}
                >
                  {c === "non_veg"
                    ? "Non Veg"
                    : c === "both"
                      ? "Veg + Non Veg"
                      : "Veg"}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {foodSlots.map((meal) => {
                const selected = selectedFoodKeys.includes(meal.key);
                const status = mealStatus(meal.key);
                const soldOut = status === "booked" || status === "blocked";
                return (
                  <button
                    key={meal.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => toggleFoodSlot(meal.key)}
                    className={`flex w-full items-start justify-between rounded-[14px] border p-3 text-left transition-all duration-250 ${
                      soldOut
                        ? "cursor-not-allowed opacity-60"
                        : selected
                          ? "border-[#C89B3C] bg-[#FBF6EA]"
                          : "border-[#ECECEC] hover:border-[#E9D39B]"
                    }`}
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-[#1F2937]">
                        {meal.name}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">{meal.timeLabel}</p>
                      <p className="mt-1 text-[11px] text-[#6B7280]">
                        Min {meal.minGuests} · Max {meal.maxGuests} guests
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-semibold text-[#C89B3C]">
                        Veg {formatINR(meal.vegPlateCost)}
                      </p>
                      <p className="text-[12px] font-semibold text-[#C89B3C]">
                        Non-Veg {formatINR(meal.nonVegPlateCost)}
                      </p>
                      <p className="text-[10px] text-[#6B7280]">per plate</p>
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.meals && (
              <p className="mt-1.5 text-[11px] font-medium text-[#EF4444]">
                {errors.meals}
              </p>
            )}
          </div>
        )}

        {/* Guests */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
            Guest Count
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setGuests(guests - 10)}
              className="h-10 w-10 rounded-xl border border-[#ECECEC] text-lg font-semibold text-[#1F2937] hover:bg-[#FAFAFA]"
            >
              −
            </button>
            <input
              type="number"
              min={minGuests}
              max={maxGuests}
              value={form.guestCount}
              onChange={(e) => setGuests(parseInt(e.target.value || "0", 10))}
              className={`h-10 flex-1 rounded-xl border px-3 text-center text-[14px] font-semibold text-[#1F2937] outline-none focus:border-[#C89B3C] ${
                errors.guests ? "border-[#EF4444]" : "border-[#ECECEC]"
              }`}
            />
            <button
              type="button"
              onClick={() => setGuests(guests + 10)}
              className="h-10 w-10 rounded-xl border border-[#ECECEC] text-lg font-semibold text-[#1F2937] hover:bg-[#FAFAFA]"
            >
              +
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-[#6B7280]">
            Min {minGuests} · Max {maxGuests} guests
          </p>
          {errors.guests && (
            <p className="mt-1 text-[11px] font-medium text-[#EF4444]">
              {errors.guests}
            </p>
          )}
        </div>

        {/* Dates */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold text-[#1F2937]">
            <CalendarDays className="h-3.5 w-3.5 text-[#C89B3C]" />
            {form.bookingType === "venue_only"
              ? "Event Date(s)"
              : "Event Date"}
          </label>

          {form.bookingType === "venue_only" ? (
            <MultiDatePicker
              selectedDates={selectedDates}
              onChange={setSelectedDates}
              error={errors.dates}
            />
          ) : (
            <>
              <input
                type="date"
                value={form.eventDate}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const v = e.target.value;
                  patch({ eventDate: v, selectedDates: v, eventEndDate: "" });
                  if (v) setErrors((err) => ({ ...err, dates: undefined }));
                }}
                className={`h-10 w-full rounded-xl border px-3 text-[14px] text-[#1F2937] outline-none focus:border-[#C89B3C] ${
                  errors.dates ? "border-[#EF4444]" : "border-[#ECECEC]"
                }`}
              />
              {errors.dates && (
                <p className="mt-1.5 text-[11px] font-medium text-[#EF4444]">
                  {errors.dates}
                </p>
              )}
            </>
          )}
        </div>

        {/* Additional Services — names only, compact side-by-side */}
        {activeAddons.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[13px] font-semibold text-[#1F2937]">
              Additional Services
            </p>
            <div className="flex flex-wrap gap-2">
              {activeAddons.map((addon) => {
                const on = selectedAddonIds.has(addon.id);
                return (
                  <label
                    key={addon.id}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1.5 transition-all duration-250 ${
                      on
                        ? "border-[#C89B3C] bg-[#FBF6EA]"
                        : "border-[#ECECEC] bg-white hover:border-[#E9D39B]"
                    }`}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
                        on
                          ? "border-[#C89B3C] bg-[#C89B3C]"
                          : "border-[#D1D5DB] bg-white"
                      }`}
                    >
                      {on && (
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => toggleAddon(addon.id)}
                    />
                    <span
                      className={`text-[12px] ${
                        on
                          ? "font-semibold text-[#1F2937]"
                          : "font-medium text-[#6B7280]"
                      }`}
                    >
                      {addon.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="mb-4">
          <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
            Special Notes / Requirements
          </label>
          <textarea
            value={form.specialRequirements}
            onChange={(e) => patch({ specialRequirements: e.target.value })}
            rows={3}
            placeholder="Enter any special requests, decoration requirements, catering instructions, or additional information..."
            className="w-full resize-none rounded-xl border border-[#ECECEC] px-3 py-2.5 text-[13px] text-[#1F2937] outline-none placeholder:text-[#9CA3AF] focus:border-[#C89B3C]"
          />
          <p className="mt-1 text-[11px] text-[#6B7280]">Optional</p>
        </div>

        {/* Summary */}
        <div className="mb-4 rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-3">
          <p className="mb-2 text-[13px] font-semibold text-[#1F2937]">
            Booking Summary
          </p>
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7280]">Booking Type</span>
              <span className="font-medium text-[#1F2937]">
                {form.bookingType === "venue_food"
                  ? "Venue + Food"
                  : "Venue Only"}
              </span>
            </div>
            {form.bookingType === "venue_only" && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Mode / Slot</span>
                <span className="font-medium text-[#1F2937]">
                  {form.slot || "—"}
                </span>
              </div>
            )}
            {form.bookingType === "venue_food" && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Meals</span>
                <span className="max-w-[55%] text-right font-medium text-[#1F2937]">
                  {selectedFoodKeys.length
                    ? selectedFoodKeys
                        .map(
                          (k) => foodSlots.find((f) => f.key === k)?.name || k
                        )
                        .join(", ")
                    : "—"}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7280]">Date(s)</span>
              <span className="max-w-[55%] text-right font-medium text-[#1F2937]">
                {selectedDates.length
                  ? `${selectedDates.length} day${selectedDates.length > 1 ? "s" : ""}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7280]">Guests</span>
              <span className="font-medium text-[#1F2937]">
                {guests || "—"}
              </span>
            </div>
            {selectedServiceNames.length > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Services</span>
                <span className="max-w-[55%] text-right font-medium text-[#1F2937]">
                  {selectedServiceNames.join(", ")}
                </span>
              </div>
            )}
            {pricing.venueCharges > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Venue Charges</span>
                <span className="font-medium text-[#1F2937]">
                  {formatINR(pricing.venueCharges)}
                </span>
              </div>
            )}
            {pricing.foodCharges > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Food Charges</span>
                <span className="font-medium text-[#1F2937]">
                  {formatINR(pricing.foodCharges)}
                </span>
              </div>
            )}
            {pricing.gstAmount > 0 && (
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">
                  Taxes ({pricing.gstPercent}%)
                </span>
                <span className="font-medium text-[#1F2937]">
                  {formatINR(pricing.gstAmount)}
                </span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-[#ECECEC] pt-2">
              <span className="font-semibold text-[#1F2937]">Estimated Total</span>
              <span className="text-[15px] font-bold text-[#C89B3C]">
                {formatINR(pricing.bookingAmount)}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBookNow}
          className="mb-2 w-full rounded-xl bg-[#C89B3C] py-3 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(200,155,60,0.35)] transition-all duration-250 hover:bg-[#A77A20] active:scale-[0.98]"
        >
          Book Now
        </button>
        <button
          type="button"
          onClick={onScheduleVisit}
          className="mb-3 w-full rounded-xl border border-[#ECECEC] bg-white py-2.5 text-[14px] font-semibold text-[#1F2937] transition-all duration-250 hover:border-[#C89B3C] hover:bg-[#FBF6EA]"
        >
          Schedule Visit
        </button>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={phone ? `tel:${phone}` : undefined}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ECECEC] py-2.5 text-[13px] font-semibold text-[#1F2937] transition-all duration-250 hover:border-[#C89B3C]"
          >
            <Phone className="h-3.5 w-3.5 text-[#C89B3C]" />
            Call
          </a>
          <a
            href={
              wa
                ? `https://wa.me/${wa.startsWith("91") ? wa : `91${wa}`}`
                : undefined
            }
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ECECEC] py-2.5 text-[13px] font-semibold text-[#1F2937] transition-all duration-250 hover:border-[#C89B3C]"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#22C55E]" />
            WhatsApp
          </a>
        </div>

        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] text-[#6B7280]">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C89B3C]" />
            Verified Venue
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" />
            {venue.city}
          </span>
        </div>
        <span className="sr-only">{venueModel}</span>
      </aside>

      <BookingDetailsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        summary={{
          venueName: venue.name,
          bookingTypeLabel:
            form.bookingType === "venue_food" ? "Venue + Food" : "Venue Only",
          dates: selectedDates,
          guestCount: guests,
          services: selectedServiceNames,
          estimatedTotal: pricing.bookingAmount,
        }}
        onProceed={handleProceedToPayment}
      />
    </>
  );
}
