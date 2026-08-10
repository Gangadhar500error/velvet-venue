"use client";

import type { ComponentType, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  IndianRupee,
  Landmark,
  Receipt,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { SearchableSelect, type SearchableOption } from "../../_components/ui/SearchableSelect";
import { Booking, BookingFormValues } from "../types";
import { eventTypeOptions, formatCurrency, formatDate } from "../data";
import {
  availabilityLabel,
  buildVenueFormPatch,
  calculateBookingPricing,
  findFoodSlot,
  findPricingSlot,
  getAvailabilityStatus,
  getEnabledFoodSlots,
  getEnabledSlots,
  getVenueOnlySlotAvailability,
  getVenueBookingTypeSupport,
  getVenuePricingModel,
  parseTimeRange,
  parseSelectedSlotKeys,
  parseFoodSlotKeys,
  buildMealGuestEntries,
  serializeMealGuests,
  formatSelectedMealsLabel,
  formatSelectedMealsSlotLabel,
  getFoodMealAvailability,
  resolveBookingDates,
  slotDisplayLabel,
  validateMealSelections,
  type AvailabilityBadge,
  type MealPricingLine,
} from "../pricing";
import { BookingStatusPill, PaymentStatusPill } from "./BookingTable";
import { BookingPaymentsPanel } from "./BookingPaymentsPanel";
import {
  getBookingInvoices,
  getLatestInvoiceNo,
} from "../payments";
import { useDemoStore } from "../../store/demoStore";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import { notify } from "../../_components/ui/Toast";
import { QuickCreateModal, QuickField, quickInputCls } from "./SmartSearchSelect";
import { blankCustomer } from "../../customers/data";
import type { Venue } from "../../venues/types";

const sectionCls =
  "bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden";
const labelCls =
  "shrink-0 w-[128px] sm:w-[142px] text-sm text-[#6B7280] leading-6 after:content-[':'] after:ml-0.5";
const valueCls = "text-sm font-semibold text-[#111827] leading-6 min-w-0";
const inputCls =
  "w-full min-w-0 h-9 px-0 py-0 bg-transparent border-0 border-b border-[#E5E7EB] rounded-none text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal outline-none transition-colors focus:ring-0 focus:border-[#C89B3C]";

interface Props {
  booking: Booking;
  form: BookingFormValues;
  onChange: <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => void;
  onPatch: (patch: Partial<BookingFormValues>) => void;
  mode: "view" | "edit" | "create";
  editable: boolean;
  isCreate: boolean;
  saving?: boolean;
  /** @deprecated Dates are always editable; kept for API compatibility */
  slotLocked?: boolean;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
}

export function BookingFormFlow({
  booking,
  form,
  onChange,
  onPatch,
  mode,
  editable,
  isCreate,
  saving,
  onCancel,
  onSave,
  onSaveDraft,
}: Props) {
  const venues = useDemoStore((s) => s.venues);
  const customers = useDemoStore((s) => s.customers);
  const addCustomer = useDemoStore((s) => s.addCustomer);
  const nextCustomerIds = useDemoStore((s) => s.nextCustomerIds);

  const [quickModal, setQuickModal] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [customerDraft, setCustomerDraft] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const selectedVenue = useMemo<Venue | undefined>(
    () => venues.find((v) => v.venueId === form.venueId || v.id === form.venueId),
    [venues, form.venueId]
  );

  const bookingTypeSupport = useMemo(
    () => getVenueBookingTypeSupport(selectedVenue),
    [selectedVenue]
  );

  // Keep Booking Type valid for the selected venue's configured pricing
  useEffect(() => {
    if (!editable || !selectedVenue) return;
    if (form.bookingType === "venue_only" && !bookingTypeSupport.venueOnly && bookingTypeSupport.venueFood) {
      onPatch({
        bookingType: "venue_food",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
      return;
    }
    if (form.bookingType === "venue_food" && !bookingTypeSupport.venueFood && bookingTypeSupport.venueOnly) {
      onPatch({
        bookingType: "venue_only",
        vegGuestCount: "",
        nonVegGuestCount: "",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editable,
    selectedVenue?.venueId,
    form.bookingType,
    bookingTypeSupport.venueOnly,
    bookingTypeSupport.venueFood,
  ]);

  const pricing = useMemo(
    () => calculateBookingPricing(selectedVenue, form),
    [selectedVenue, form]
  );

  const bookingDates = useMemo(() => resolveBookingDates(form), [form]);
  const dayCount = Math.max(1, bookingDates.length || pricing.dayCount || 1);

  const availabilityStatus: AvailabilityBadge = useMemo(() => {
    const key = form.slotKey || "full_day";
    const dates = bookingDates.length > 0 ? bookingDates : form.eventDate ? [form.eventDate] : [];
    if (form.bookingType === "venue_only" && dates.length > 0) {
      return getVenueOnlySlotAvailability(selectedVenue, dates, key, {
        excludeBookingId: booking.bookingId,
        excludeBookingRef: isCreate ? undefined : booking.id !== "new" ? booking.id : booking.bookingId,
      });
    }
    if (bookingDates.length === 0) {
      return getAvailabilityStatus(selectedVenue, form.eventDate, key);
    }
    let worst: AvailabilityBadge = "available";
    for (const date of bookingDates) {
      const status = getAvailabilityStatus(selectedVenue, date, key);
      if (status === "booked") return "booked";
      if (status === "blocked") worst = "blocked";
    }
    return worst;
  }, [selectedVenue, form.eventDate, form.slotKey, bookingDates, form.bookingType, booking.bookingId, booking.id, isCreate]);

  const removeBookingDate = (date: string) => {
    const next = bookingDates.filter((d) => d !== date);
    onPatch({
      selectedDates: next.join(","),
      eventDate: next[0] || "",
      eventEndDate: next.length > 1 ? next[next.length - 1] : next[0] || "",
      ...(next.length === 0
        ? { bookingAmount: "", advancePaid: "", taxAmount: "" }
        : {}),
    });
  };

  const foodGuestSplit = useMemo(
    () => validateMealSelections(form, selectedVenue),
    [form, selectedVenue]
  );

  const selectedFoodKeys = useMemo(
    () => parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey),
    [form.foodSlotKeys, form.foodSlotKey]
  );

  const mealGuestEntries = useMemo(() => buildMealGuestEntries(form), [form]);
  const selectedVenueSlotKeys = useMemo(
    () => (form.bookingType === "venue_only" ? parseSelectedSlotKeys(form.slotKey, form.slot) : []),
    [form.bookingType, form.slotKey, form.slot]
  );

  const excludeBookingRef = isCreate ? undefined : booking.id !== "new" ? booking.id : booking.bookingId;

  const isUnavailable =
    availabilityStatus === "booked" || availabilityStatus === "blocked";

  const venueSlotSelectionInvalid =
    form.bookingType === "venue_only" &&
    form.pricingMethod === "slot_based" &&
    selectedVenueSlotKeys.length === 0;

  const isSubmitBlocked =
    isUnavailable ||
    venueSlotSelectionInvalid ||
    (form.bookingType === "venue_food" && editable && !foodGuestSplit.valid);

  const isPersistedBooking = !isCreate && booking.id !== "new";

  // Charges + booking amount from venue pricing; advance auto from advance %
  const displayAmounts = useMemo(() => {
    const venueCharges = pricing.venueCharges;
    const foodCharges =
      form.bookingType === "venue_food" ? pricing.foodCharges : 0;
    const addonCharges = pricing.addonCharges;
    const gstAmount = pricing.gstAmount;
    const bookingAmount = pricing.bookingAmount;
    const minOnlineAmount = pricing.minOnlineAmount;
    const platformCommission = pricing.platformCommission;
    const platformCommissionPercent = pricing.platformCommissionPercent;
    const vendorReceivable = pricing.vendorReceivable;
    const minOnlinePercent = pricing.minOnlinePercent;
    const venuePricePerDay = pricing.venuePricePerDay;
    const days = pricing.dayCount || 1;

    // View fallback when slot pricing can't be resolved from legacy bookings
    if (
      mode === "view" &&
      venueCharges === 0 &&
      booking.bookingAmount > 0
    ) {
      const amount = booking.bookingAmount;
      const paysNow =
        Number(booking.advancePaid) || minOnlineAmount;
      const commission = Math.round(
        (paysNow * (platformCommissionPercent || 2)) / 100
      );
      const resolvedFood =
        form.bookingType === "venue_food" && foodCharges > 0 ? foodCharges : 0;
      const resolvedVenue =
        form.bookingType === "venue_food"
          ? Math.max(0, amount - resolvedFood - (booking.taxAmount || 0))
          : Math.max(0, amount - (booking.taxAmount || 0));

      return {
        venueCharges: resolvedVenue,
        foodCharges: resolvedFood,
        addonCharges: 0,
        gstAmount: booking.taxAmount || 0,
        bookingAmount: amount,
        minOnlineAmount,
        minOnlinePercent,
        platformCommission: commission,
        platformCommissionPercent,
        vendorReceivable: Math.max(0, paysNow - commission),
        customerPaysNow: paysNow,
        remainingBalance: Math.max(0, amount - paysNow),
        venuePricePerDay: days > 0 ? Math.round(resolvedVenue / days) : resolvedVenue,
        dayCount: days,
      };
    }

    const customerPaysNow = pricing.customerPaysOnline;
    return {
      venueCharges,
      foodCharges,
      addonCharges,
      gstAmount,
      bookingAmount,
      minOnlineAmount,
      minOnlinePercent,
      platformCommission,
      platformCommissionPercent,
      vendorReceivable,
      customerPaysNow,
      remainingBalance: pricing.remainingBalance,
      venuePricePerDay,
      dayCount: days,
    };
  }, [
    mode,
    booking.bookingAmount,
    booking.advancePaid,
    booking.taxAmount,
    form.bookingType,
    pricing,
  ]);

  const financeSnapshot = useMemo(() => {
    if (isPersistedBooking) {
      const invoices = getBookingInvoices(booking);
      return {
        bookingAmount: booking.bookingAmount || displayAmounts.bookingAmount,
        totalPaid: booking.paidAmount || 0,
        remaining:
          booking.pendingAmount ??
          Math.max(0, (booking.bookingAmount || 0) - (booking.paidAmount || 0)),
        latestInvoice: getLatestInvoiceNo(booking),
        totalPayments: invoices.length,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
      };
    }
    return {
      bookingAmount: displayAmounts.bookingAmount,
      totalPaid: displayAmounts.customerPaysNow,
      remaining: displayAmounts.remainingBalance,
      latestInvoice: "—",
      totalPayments: 0,
      paymentStatus: form.paymentStatus,
      bookingStatus: form.bookingStatus,
    };
  }, [isPersistedBooking, booking, displayAmounts, form.paymentStatus, form.bookingStatus]);

  const lastSynced = useRef("");
  useEffect(() => {
    lastSynced.current = "";
  }, [form.venueId]);

  useEffect(() => {
    if (!editable) return;
    const signature = `${form.venueId}|${form.bookingType}|${form.foodSlotKeys}|${form.mealGuestsJson}|${form.selectedDates || ""}|${form.eventDate}|${pricing.bookingAmount}|${pricing.minOnlineAmount}|${availabilityStatus}`;
    if (lastSynced.current === signature) return;
    lastSynced.current = signature;

    const bookingAmount = pricing.bookingAmount;
    const advance = pricing.customerPaysOnline;

    const patch: Partial<BookingFormValues> = {
      bookingAmount: bookingAmount ? String(bookingAmount) : "",
      taxAmount: pricing.gstAmount ? String(pricing.gstAmount) : "0",
      advancePaid: advance > 0 ? String(advance) : bookingAmount > 0 ? "0" : "",
      addonsCsv:
        form.addonsCsv ||
        pricing.selectedAddons.map((a) => a.id).join(","),
      availabilityLabel: availabilityLabel(availabilityStatus),
    };

    if (bookingAmount > 0) {
      patch.paymentStatus =
        advance <= 0 ? "unpaid" : advance >= bookingAmount ? "paid" : "partial";
    }

    onPatch(patch);
    // Advance is always calculated from venue advance % — no manual override
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editable,
    form.venueId,
    form.bookingType,
    form.foodSlotKeys,
    form.mealGuestsJson,
    form.selectedDates,
    form.eventDate,
    pricing.bookingAmount,
    pricing.minOnlineAmount,
    availabilityStatus,
    onPatch,
  ]);

  // Sync owner + slot defaults once venue is known (availability prefill)
  useEffect(() => {
    if (!editable || !selectedVenue) return;
    const needsOwner = !form.vendorId && Boolean(selectedVenue.ownerId);
    const needsSlotKey = !form.slotKey && Boolean(form.slot);
    if (!needsOwner && !needsSlotKey) return;
    onPatch(
      buildVenueFormPatch(selectedVenue, {
        preserveSlot: { slotKey: form.slotKey, slotLabel: form.slot },
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, selectedVenue?.id]);

  const customerOptions = useMemo<SearchableOption[]>(
    () =>
      customers.map((c) => ({
        value: c.customerId,
        label: c.name,
        icon: UserRound,
        description: [c.phone, c.email].filter(Boolean),
        meta: c.customerId,
        keywords: `${c.customerId} ${c.phone} ${c.email} ${c.name}`,
      })),
    [customers]
  );

  const venueOptions = useMemo<SearchableOption[]>(
    () =>
      venues.map((v) => ({
        value: v.venueId,
        label: v.name,
        icon: Landmark,
        description: [v.businessName || "", v.city || ""].filter(Boolean),
        meta: v.venueId,
        keywords: [
          v.name,
          v.venueId,
          v.id,
          v.businessName,
          v.businessId,
          v.city,
          v.ownerName,
          v.category,
          v.venueType,
        ]
          .filter(Boolean)
          .join(" "),
      })),
    [venues]
  );

  const eventOptions = useMemo(
    () => eventTypeOptions.map((e) => ({ value: e, label: e, icon: CalendarDays })),
    []
  );

  const venuePricingModel = useMemo(
    () => getVenuePricingModel(selectedVenue, form.bookingType),
    [selectedVenue, form.bookingType]
  );

  const venueTimedSlots = useMemo(
    () => getEnabledSlots(selectedVenue, "slot_based"),
    [selectedVenue]
  );
  const venueFullDaySlots = useMemo(
    () => getEnabledSlots(selectedVenue, "full_day"),
    [selectedVenue]
  );

  const foodMealSlots = useMemo(
    () => getEnabledFoodSlots(selectedVenue),
    [selectedVenue]
  );

  const mealAvailability = useMemo(() => {
    const map: Record<string, AvailabilityBadge> = {};
    if (!selectedVenue || bookingDates.length === 0) return map;
    for (const slot of foodMealSlots) {
      map[slot.key] = getFoodMealAvailability(
        selectedVenue,
        bookingDates,
        slot.key,
        { excludeBookingId: booking.bookingId, excludeBookingRef }
      );
    }
    return map;
  }, [
    selectedVenue,
    foodMealSlots,
    bookingDates,
    booking.bookingId,
    excludeBookingRef,
  ]);

  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

  const getDateAvailability = (date: string): AvailabilityBadge => {
    if (!selectedVenue) return "unknown";
    if (form.bookingType === "venue_food") {
      const keys =
        selectedFoodKeys.length > 0
          ? selectedFoodKeys
          : foodMealSlots.map((s) => s.key);
      let worst: AvailabilityBadge = "available";
      for (const key of keys) {
        const status = getFoodMealAvailability(selectedVenue, [date], key, {
          excludeBookingId: booking.bookingId,
          excludeBookingRef,
        });
        if (status === "booked") return "booked";
        if (status === "blocked") worst = "blocked";
      }
      return worst;
    }
    if (form.bookingType === "venue_only" && form.pricingMethod === "slot_based") {
      const keys =
        selectedVenueSlotKeys.length > 0
          ? selectedVenueSlotKeys
          : venueTimedSlots.map((s) => s.key);
      let worst: AvailabilityBadge = "available";
      for (const key of keys) {
        const status = getVenueOnlySlotAvailability(selectedVenue, [date], key, {
          excludeBookingId: booking.bookingId,
          excludeBookingRef,
        });
        if (status === "booked") return "booked";
        if (status === "blocked") worst = "blocked";
      }
      return worst;
    }
    const slotKey =
      form.pricingMethod === "full_day" ? "full_day" : form.slotKey || "full_day";
    return getVenueOnlySlotAvailability(selectedVenue, [date], slotKey, {
      excludeBookingId: booking.bookingId,
      excludeBookingRef,
    });
  };

  const hasVenueOnlyFullDay = venueFullDaySlots.length > 0;
  const hasVenueOnlySlots = venueTimedSlots.length > 0;
  const canSwitchVenueMode = hasVenueOnlyFullDay && hasVenueOnlySlots;

  const dateScope =
    bookingDates.length > 0 ? bookingDates : form.eventDate ? [form.eventDate] : [];
  const venueTimedSlotAvailability = useMemo(() => {
    const map: Record<string, AvailabilityBadge> = {};
    if (!selectedVenue || dateScope.length === 0) return map;
    for (const slot of venueTimedSlots) {
      map[slot.key] = getVenueOnlySlotAvailability(selectedVenue, dateScope, slot.key, {
        excludeBookingId: booking.bookingId,
        excludeBookingRef,
      });
    }
    return map;
  }, [selectedVenue, dateScope, venueTimedSlots, booking.bookingId, excludeBookingRef]);

  const fullDayAvailability = useMemo(() => {
    if (!selectedVenue || dateScope.length === 0) return "unknown" as AvailabilityBadge;
    return getVenueOnlySlotAvailability(selectedVenue, dateScope, "full_day", {
      excludeBookingId: booking.bookingId,
      excludeBookingRef,
    });
  }, [selectedVenue, dateScope, booking.bookingId, excludeBookingRef]);

  const usingSlot =
    form.bookingType === "venue_food" ||
    form.pricingMethod === "slot_based" ||
    venuePricingModel === "slot_based";

  const selectCustomer = (value: string) => {
    if (!editable) return;
    if (!value) {
      onPatch({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
      });
      return;
    }
    const c = customers.find((x) => x.customerId === value);
    onPatch({
      customerId: value,
      customerName: c?.name || "",
      customerPhone: c?.phone || "",
      customerEmail: c?.email || "",
      customerAddress: [c?.addressLine1, c?.addressLine2, c?.city, c?.state]
        .filter(Boolean)
        .join(", "),
    });
  };

  const selectVenue = (value: string) => {
    if (!editable) return;
    if (!value) {
      onPatch({
        venueId: "",
        venueName: "",
        businessId: "",
        businessName: "",
        vendorId: "",
        vendorName: "",
        slot: "",
        slotKey: "",
        startTime: "",
        endTime: "",
        bookingAmount: "",
        advancePaid: "",
        vegGuestCount: "",
        nonVegGuestCount: "",
        foodSlotKeys: "",
        mealGuestsJson: "",
      });
      return;
    }
    const v = venues.find((x) => x.venueId === value);
    if (!v) return;
    onPatch(
      buildVenueFormPatch(v, {
        preferBookingType: form.bookingType,
        preserveSlot: { slotKey: form.slotKey, slotLabel: form.slot },
      })
    );
  };

  const switchBookingType = (next: "venue_only" | "venue_food") => {
    if (!editable || next === form.bookingType) return;
    const support = getVenueBookingTypeSupport(selectedVenue);
    if (next === "venue_only" && !support.venueOnly) return;
    if (next === "venue_food" && !support.venueFood) return;

    if (!selectedVenue) {
      onPatch({
        bookingType: next,
        vegGuestCount: "",
        nonVegGuestCount: "",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
      return;
    }

    const model = getVenuePricingModel(selectedVenue, next);

    if (next === "venue_food") {
      onPatch({
        bookingType: next,
        pricingMethod: "slot_based",
        foodSlotKey: "",
        foodSlotKeys: "",
        mealGuestsJson: "",
        slotKey: "",
        slot: "",
        startTime: "",
        endTime: "",
        vegGuestCount: "",
        nonVegGuestCount: "",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
      return;
    }

    // venue_only
    if (model === "slot_based") {
      const slot = getEnabledSlots(selectedVenue, "slot_based")[0];
      const times = slot
        ? parseTimeRange(slot.timeLabel)
        : { start: "9 AM", end: "11 PM" };
      onPatch({
        bookingType: next,
        vegGuestCount: "",
        nonVegGuestCount: "",
        pricingMethod: "slot_based",
        foodSlotKey: "",
        slotKey: slot?.key || "",
        slot: slot ? slotDisplayLabel(slot) : "",
        startTime: times.start || "9 AM",
        endTime: times.end || "11 PM",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
    } else {
      const full = getEnabledSlots(selectedVenue, "full_day")[0];
      const times = full
        ? parseTimeRange(full.timeLabel)
        : { start: "9 AM", end: "11 PM" };
      onPatch({
        bookingType: next,
        vegGuestCount: "",
        nonVegGuestCount: "",
        pricingMethod: "full_day",
        foodSlotKey: "",
        slotKey: full?.key || "full_day",
        slot: full ? slotDisplayLabel(full) : "Full Day",
        startTime: times.start || "9 AM",
        endTime: times.end || "11 PM",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
    }
  };

  const selectVenueOnlyPricingMode = (modeKey: "full_day" | "slot_based") => {
    if (!editable || !selectedVenue || form.bookingType !== "venue_only") return;
    if (modeKey === "full_day") {
      const full = venueFullDaySlots[0];
      const times = parseTimeRange(full?.timeLabel || "");
      onPatch({
        pricingMethod: "full_day",
        slotKey: full?.key || "full_day",
        slot: full ? slotDisplayLabel(full) : "Full Day",
        startTime: times.start || "9 AM",
        endTime: times.end || "11 PM",
        bookingAmount: "",
        advancePaid: "",
        taxAmount: "",
      });
      return;
    }
    onPatch({
      pricingMethod: "slot_based",
      slotKey: "",
      slot: "",
      startTime: "",
      endTime: "",
      bookingAmount: "",
      advancePaid: "",
      taxAmount: "",
    });
  };

  const toggleVenueOnlySlot = (slotKey: string) => {
    if (!editable || !selectedVenue || form.bookingType !== "venue_only") return;
    const availability = venueTimedSlotAvailability[slotKey];
    if (availability === "booked" || availability === "blocked") return;

    const current = parseSelectedSlotKeys(form.slotKey, form.slot).filter((k) => k !== "full_day");
    const next = current.includes(slotKey)
      ? current.filter((k) => k !== slotKey)
      : [...current, slotKey];
    const sortedNext = venueTimedSlots
      .map((s) => s.key)
      .filter((k) => next.includes(k));
    const selectedSlots = sortedNext
      .map((k) => findPricingSlot(selectedVenue, k))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const firstTimes = selectedSlots[0] ? parseTimeRange(selectedSlots[0].timeLabel) : { start: "", end: "" };
    const lastTimes = selectedSlots[selectedSlots.length - 1]
      ? parseTimeRange(selectedSlots[selectedSlots.length - 1].timeLabel)
      : { start: "", end: "" };
    onPatch({
      pricingMethod: "slot_based",
      slotKey: sortedNext.join(","),
      slot: selectedSlots.map((s) => s.name).join(", "),
      startTime: firstTimes.start || "",
      endTime: lastTimes.end || "",
      bookingAmount: "",
      advancePaid: "",
      taxAmount: "",
    });
  };

  const syncMealFormFields = (
    keys: string[],
    entries: ReturnType<typeof buildMealGuestEntries>
  ) => {
    const slots = keys
      .map((k) => findFoodSlot(selectedVenue, k))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const first = slots[0];
    const last = slots[slots.length - 1];
    const firstTimes = first ? parseTimeRange(first.timeLabel) : { start: "", end: "" };
    const lastTimes = last ? parseTimeRange(last.timeLabel) : firstTimes;
    const maxGuests = entries.reduce(
      (max, e) => Math.max(max, (Number(e.veg) || 0) + (Number(e.nonVeg) || 0)),
      0
    );

    onPatch({
      foodSlotKeys: keys.join(","),
      foodSlotKey: keys[0] || "",
      mealGuestsJson: serializeMealGuests(entries),
      slotKey: keys.join(","),
      slot: formatSelectedMealsSlotLabel(selectedVenue, keys),
      startTime: firstTimes.start || "",
      endTime: lastTimes.end || "",
      guestCount: maxGuests > 0 ? String(maxGuests) : "",
      bookingAmount: "",
      advancePaid: "",
      taxAmount: "",
    });
  };

  const toggleFoodMealSlot = (slotKey: string) => {
    if (!editable || !selectedVenue) return;
    const key = slotKey.trim();
    const status = mealAvailability[key];
    if (status === "booked" || status === "blocked") return;

    const current = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    const entries = buildMealGuestEntries(form);
    const nextEntries = next.map(
      (k) => entries.find((e) => e.key === k) || { key: k, veg: "", nonVeg: "" }
    );
    syncMealFormFields(next, nextEntries);
    setExpandedMeals((prev) => ({ ...prev, [key]: true }));
  };

  const updateMealGuests = (
    slotKey: string,
    field: "veg" | "nonVeg",
    value: string
  ) => {
    const keys = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
    const entries = buildMealGuestEntries(form).map((e) =>
      e.key === slotKey ? { ...e, [field]: value } : e
    );
    syncMealFormFields(keys, entries);
  };

  const saveQuickCustomer = async () => {
    if (!editable) return;
    if (!customerDraft.name.trim() || !customerDraft.phone.trim()) {
      notify.validation("Please fill in all required fields.");
      return;
    }
    setQuickSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const ids = nextCustomerIds();
    const created = blankCustomer({
      id: ids.id,
      customerId: ids.customerId,
      name: customerDraft.name.trim(),
      phone: customerDraft.phone.trim(),
      email: customerDraft.email.trim(),
      addressLine1: customerDraft.address.trim(),
      source: "admin",
      status: "active",
      initials: customerDraft.name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    });
    addCustomer(created);
    onPatch({
      customerId: created.customerId,
      customerName: created.name,
      customerPhone: created.phone,
      customerEmail: created.email,
      customerAddress: created.addressLine1 || "",
    });
    setQuickSaving(false);
    setQuickModal(false);
    notify.created("Customer");
  };

  const dateReadOnly = !editable;

  const [bookingDatesPickerOpen, setBookingDatesPickerOpen] = useState(false);
  const [pickerDraftDates, setPickerDraftDates] = useState<string[]>([]);
  const [pickerMonth, setPickerMonth] = useState<Date>(() => {
    const seedIso = bookingDates[0] || form.eventDate || new Date().toISOString().slice(0, 10);
    return new Date(`${seedIso}T12:00:00`);
  });
  const [rangeStartIso, setRangeStartIso] = useState<string | null>(null);
  const [rangeHoverEndIso, setRangeHoverEndIso] = useState<string | null>(null);
  const bookingDatesPickerRootRef = useRef<HTMLDivElement | null>(null);

  const toIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const fromIsoDate = (iso: string) => new Date(`${iso}T12:00:00`);

  const computeIsoRangeInclusive = (startIso: string, endIso: string) => {
    const start = fromIsoDate(startIso);
    const end = fromIsoDate(endIso);
    const minMs = Math.min(start.getTime(), end.getTime());
    const maxMs = Math.max(start.getTime(), end.getTime());
    const out: string[] = [];
    const cur = new Date(minMs);
    // Move by whole days to avoid DST surprises.
    cur.setHours(12, 0, 0, 0);
    const last = new Date(maxMs);
    last.setHours(12, 0, 0, 0);
    while (cur.getTime() <= last.getTime()) {
      out.push(toIsoDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const applySelectedDates = (next: string[]) => {
    const sorted = Array.from(new Set(next)).sort();
    if (sorted.length === 0) return;
    onPatch({
      selectedDates: sorted.join(","),
      eventDate: sorted[0],
      eventEndDate: sorted[sorted.length - 1],
    });
  };

  const openBookingDatesPicker = () => {
    const seedIso = bookingDates[0] || form.eventDate || new Date().toISOString().slice(0, 10);
    setPickerMonth(new Date(`${seedIso}T12:00:00`));
    setPickerDraftDates([...bookingDates]);
    setRangeStartIso(null);
    setRangeHoverEndIso(null);
    setBookingDatesPickerOpen(true);
  };

  const closeBookingDatesPicker = (save = false) => {
    if (save) {
      let finalDates = [...pickerDraftDates];
      if (rangeStartIso && !finalDates.includes(rangeStartIso)) {
        const status = getDateAvailability(rangeStartIso);
        if (status !== "booked" && status !== "blocked") {
          finalDates = Array.from(new Set([...finalDates, rangeStartIso])).sort();
        }
      }
      if (finalDates.length === 0) {
        notify.validation("Please select at least one date.");
        return;
      }
      applySelectedDates(finalDates);
    }
    setBookingDatesPickerOpen(false);
    setRangeStartIso(null);
    setRangeHoverEndIso(null);
  };

  useEffect(() => {
    if (!bookingDatesPickerOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const root = bookingDatesPickerRootRef.current;
      const target = e.target as Node | null;
      if (!root || !target) return;
      if (root.contains(target)) return;
      closeBookingDatesPicker(false);
    };
    const pointerOptions = { capture: true } as const;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBookingDatesPicker(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown, pointerOptions);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, pointerOptions);
      window.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingDatesPickerOpen, pickerDraftDates]);

  return (
    <>
      <EntityViewLayout
        main={
          <div className="space-y-3">
          <Section step={1} title="Customer Information" icon={UserRound}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
              {editable ? (
                <div className="sm:col-span-2">
                  <SearchableSelect
                    label="Customer"
                    required
                    wide
                    variant="underline"
                    value={form.customerId}
                    options={customerOptions}
                    placeholder="Select customer"
                    searchPlaceholder="Search customer..."
                    createLabel="New Customer"
                    emptyLabel="No matching results found."
                    onChange={selectCustomer}
                    onCreate={() => {
                      setCustomerDraft({ name: "", phone: "", email: "", address: "" });
                      setQuickModal(true);
                    }}
                  />
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <InfoField label="Customer" value={form.customerName} />
                </div>
              )}
              <InfoField label="Mobile" value={form.customerPhone} />
              <InfoField label="Email" value={form.customerEmail} />
              <div className="sm:col-span-2">
                <InfoField label="Address" value={form.customerAddress} wide />
              </div>
            </div>
          </Section>

          <Section step={2} title="Venue Selection" icon={Building2}>
            <div className="space-y-4">
              {editable ? (
                <SearchableSelect
                  label="Venue"
                  required
                  wide
                  variant="underline"
                  value={form.venueId}
                  options={venueOptions}
                  placeholder="Search venue by name, ID, business, or city"
                  searchPlaceholder="Venue name, ID, business, city…"
                  emptyLabel="No matching venues found."
                  onChange={selectVenue}
                />
              ) : (
                <InfoField label="Venue" value={form.venueName} />
              )}
              {selectedVenue ? (
                <VenueDetailsCard venue={selectedVenue} />
              ) : (
                <p className="text-sm text-[#9CA3AF]">
                  {editable
                    ? "Select a venue to load business, owner, capacity, and pricing automatically."
                    : "Venue details unavailable."}
                </p>
              )}
            </div>
          </Section>

          <Section
            step={3}
            title="Booking Schedule"
            icon={CalendarDays}
            headerAction={
              !dateReadOnly ? (
                <div className="relative shrink-0" ref={bookingDatesPickerRootRef}>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={CalendarDays}
                    onClick={() => {
                      if (bookingDatesPickerOpen) return;
                      openBookingDatesPicker();
                    }}
                  >
                    {bookingDates.length > 0 ? "Edit Booking Dates" : "+ Add Booking Dates"}
                  </Button>

                  {bookingDatesPickerOpen && (
                          <div
                            className="absolute z-50 right-0 mt-2 w-[360px] rounded-[14px] bg-white border border-[#E8EAF0] shadow-[0_16px_40px_rgba(16,24,40,0.14)] overflow-hidden"
                            role="dialog"
                            aria-label="Select booking dates"
                          >
                            <div className="px-4 py-3 border-b border-[#E8EAF0] bg-[#FCFCFD]">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[#E8EAF0] bg-white text-[#6B7280] hover:border-[#C89B3C]/35 hover:text-[#C89B3C] transition-colors"
                                  aria-label="Previous month"
                                  onClick={() => {
                                    setPickerMonth(
                                      new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1, 12, 0, 0, 0)
                                    );
                                  }}
                                >
                                  <ChevronRight className="w-4 h-4 rotate-180" />
                                </button>
                                <div className="text-sm font-semibold text-[#111827]">
                                  {pickerMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                                </div>
                                <button
                                  type="button"
                                  className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-[#E8EAF0] bg-white text-[#6B7280] hover:border-[#C89B3C]/35 hover:text-[#C89B3C] transition-colors"
                                  aria-label="Next month"
                                  onClick={() => {
                                    setPickerMonth(
                                      new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1, 12, 0, 0, 0)
                                    );
                                  }}
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="mt-3 grid grid-cols-7 gap-1.5 text-[11px] text-[#6B7280]">
                                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
                                  <div key={w} className="text-center font-medium">
                                    {w}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {(() => {
                              const monthStart = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1, 12, 0, 0, 0);
                              const startOffset = monthStart.getDay();
                              const gridStart = new Date(monthStart);
                              gridStart.setDate(monthStart.getDate() - startOffset);
                              const cells: { iso: string; inMonth: boolean; timeMs: number }[] = [];
                              for (let i = 0; i < 42; i++) {
                                const d = new Date(gridStart);
                                d.setDate(gridStart.getDate() + i);
                                const iso = toIsoDate(d);
                                cells.push({
                                  iso,
                                  inMonth: d.getMonth() === pickerMonth.getMonth(),
                                  timeMs: d.getTime(),
                                });
                              }
                              const startMs = rangeStartIso ? fromIsoDate(rangeStartIso).getTime() : null;
                              const hoverMs = rangeHoverEndIso ? fromIsoDate(rangeHoverEndIso).getTime() : null;
                              const previewMin = startMs != null && hoverMs != null ? Math.min(startMs, hoverMs) : null;
                              const previewMax = startMs != null && hoverMs != null ? Math.max(startMs, hoverMs) : null;

                              const selectedSet = new Set(pickerDraftDates);

                              return (
                                <div className="px-4 py-3">
                                  <div className="grid grid-cols-7 gap-1.5">
                                    {cells.map((cell) => {
                                      const status = getDateAvailability(cell.iso);
                                      const disabled = status === "booked" || status === "blocked";
                                      const selected = selectedSet.has(cell.iso);
                                      const inPreview =
                                        previewMin != null &&
                                        previewMax != null &&
                                        cell.timeMs >= previewMin &&
                                        cell.timeMs <= previewMax;

                                      const isRangeStart = rangeStartIso === cell.iso;

                                      return (
                                        <button
                                          key={cell.iso}
                                          type="button"
                                          disabled={disabled}
                                          onMouseEnter={() => {
                                            if (!rangeStartIso) return;
                                            if (disabled) return;
                                            setRangeHoverEndIso(cell.iso);
                                          }}
                                          onClick={() => {
                                            const dayStatus = getDateAvailability(cell.iso);
                                            const dayDisabled = dayStatus === "booked" || dayStatus === "blocked";
                                            if (dayDisabled) return;

                                            if (!rangeStartIso) {
                                              if (selectedSet.has(cell.iso)) {
                                                setPickerDraftDates((prev) =>
                                                  prev.filter((iso) => iso !== cell.iso)
                                                );
                                                return;
                                              }
                                              setRangeStartIso(cell.iso);
                                              setRangeHoverEndIso(null);
                                              return;
                                            }

                                            const range = computeIsoRangeInclusive(rangeStartIso, cell.iso);
                                            const newDates = range.filter((iso) => !selectedSet.has(iso));
                                            if (newDates.length === 0) {
                                              notify.validation("These dates are already selected.");
                                              setRangeStartIso(null);
                                              setRangeHoverEndIso(null);
                                              return;
                                            }
                                            const includesUnavailable = range.some((iso) => {
                                              const s = getDateAvailability(iso);
                                              return s === "booked" || s === "blocked";
                                            });

                                            if (includesUnavailable) {
                                              notify.validation("Selected range includes unavailable dates.");
                                              return;
                                            }

                                            setPickerDraftDates((prev) =>
                                              Array.from(new Set([...prev, ...range])).sort()
                                            );
                                            setRangeStartIso(null);
                                            setRangeHoverEndIso(null);
                                          }}
                                          className={[
                                            "w-9 h-9 rounded-lg border text-center text-sm font-semibold transition-colors",
                                            cell.inMonth ? "bg-white" : "bg-white/40 text-[#9CA3AF]",
                                            selected
                                              ? "border-[#C89B3C] bg-[#FFF3EB] text-[#B8862B]"
                                              : status === "available"
                                                ? "border-[#D3F8E1] bg-[#ECFDF3] text-[#16A34A]"
                                                : status === "booked"
                                                  ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                                                  : status === "blocked"
                                                    ? "border-[#FED7AA] bg-[#FCFAF8] text-[#B8862B]"
                                                    : "border-[#E8EAF0] bg-white text-[#4B5563]",
                                            disabled ? "opacity-60 cursor-not-allowed" : "hover:border-[#C89B3C]/35 hover:bg-[#FFF3EB]/50",
                                            inPreview && !disabled
                                              ? "ring-2 ring-[#C89B3C]/30 ring-offset-2 ring-offset-white"
                                              : "",
                                            isRangeStart ? "ring-2 ring-[#C89B3C] ring-offset-2 ring-offset-white" : "",
                                          ].join(" ")}
                                          aria-label={`Select ${cell.iso}`}
                                        >
                                          {Number(cell.iso.slice(-2))}
                                        </button>
                                      );
                                    })}
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-[#E8EAF0] flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#6B7280]">
                                    <div className="inline-flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" aria-hidden />
                                      Available
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-[#DC2626]" aria-hidden />
                                      Booked
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 text-[#B8862B]" aria-hidden />
                                      Blocked
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-3 border-t border-[#E8EAF0] flex items-center justify-between gap-3">
                                    <p className="text-[12px] text-[#6B7280]">
                                      {pickerDraftDates.length > 0
                                        ? `${pickerDraftDates.length} date${pickerDraftDates.length === 1 ? "" : "s"} selected`
                                        : rangeStartIso
                                          ? "Select end date"
                                          : "Select start date"}
                                    </p>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        type="button"
                                        onClick={() => closeBookingDatesPicker(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        type="button"
                                        onClick={() => closeBookingDatesPicker(true)}
                                      >
                                        Done
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                </div>
              ) : null
            }
          >
            <div className="space-y-4">
              {dateReadOnly ? (
                <InfoField
                  label="Booking Date"
                  value={form.eventDate ? formatDate(form.eventDate) : "—"}
                />
              ) : (
                <InlineField label="Booking Dates" required>
                  <div className="space-y-2 pt-0.5">
                    {bookingDates.length > 0 && (
                      <>
                        <div className="flex flex-wrap gap-2">
                          {bookingDates.map((d) => {
                            const status = getDateAvailability(d);
                            return (
                              <span
                                key={d}
                                className="inline-flex items-center gap-2 rounded-lg border border-[#E8EAF0] bg-[#FCFCFD] px-3 py-1.5 text-[12px] font-semibold text-[#111827]"
                              >
                                <span className="whitespace-nowrap">{formatDate(d)}</span>
                                <InlineAvailability status={status} />
                                <button
                                  type="button"
                                  onClick={() => removeBookingDate(d)}
                                  className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[#9CA3AF] hover:text-[#DC2626] hover:bg-white transition-colors"
                                  aria-label={`Remove ${formatDate(d)}`}
                                  title="Remove"
                                >
                                  <X className="w-3.5 h-3.5" aria-hidden />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                        <p className="text-[12px] font-medium text-[#16A34A]">
                          ✓ {bookingDates.length} Dates Selected
                        </p>
                      </>
                    )}
                  </div>
                </InlineField>
              )}

              <InlineField label="Booking Type" required={editable}>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <RadioChip
                    active={form.bookingType === "venue_only"}
                    label="Venue Only"
                    onClick={() => switchBookingType("venue_only")}
                    disabled={!editable || !bookingTypeSupport.venueOnly}
                  />
                  <RadioChip
                    active={form.bookingType === "venue_food"}
                    label="Venue + Food"
                    onClick={() => switchBookingType("venue_food")}
                    disabled={!editable || !bookingTypeSupport.venueFood}
                  />
                </div>
              </InlineField>

              <InlineField label="Booking Duration">
                <div className="space-y-3 pt-0.5">
                  {form.bookingType === "venue_only" && canSwitchVenueMode && (
                    <div>
                      <p className="text-[12px] font-medium text-[#6B7280] mb-1.5">
                        Booking Mode
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <RadioChip
                          active={form.pricingMethod === "full_day"}
                          label="Full Day"
                          onClick={() => selectVenueOnlyPricingMode("full_day")}
                          disabled={!editable || fullDayAvailability === "booked" || fullDayAvailability === "blocked"}
                        />
                        <RadioChip
                          active={form.pricingMethod === "slot_based"}
                          label="Slot Based"
                          onClick={() => selectVenueOnlyPricingMode("slot_based")}
                          disabled={!editable}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
                    <InfoField
                      label="Duration"
                      value={`${dayCount} Day${dayCount === 1 ? "" : "s"}`}
                    />
                    <InfoField
                      label="Type"
                      value={
                        form.bookingType === "venue_food"
                          ? "Meal Slot"
                          : usingSlot
                            ? "Slot Based"
                            : "Full Day"
                      }
                    />
                    <InfoField
                      label="Operating Hours"
                      value={
                        form.startTime && form.endTime
                          ? `${form.startTime} – ${form.endTime}`
                          : selectedVenue?.operatingHours || "9 AM – 11 PM"
                      }
                    />
                    {form.bookingType === "venue_only" && !usingSlot && (
                      <>
                        <InfoField
                          label="Full Day Price"
                          value={formatCurrency(displayAmounts.venuePricePerDay)}
                        />
                        <InfoField
                          label="Min. Booking Amount"
                          value={formatCurrency(displayAmounts.minOnlineAmount)}
                        />
                        <InfoField
                          label="Maximum Guests"
                          value={
                            selectedVenue?.maxGuests
                              ? String(selectedVenue.maxGuests)
                              : "—"
                          }
                        />
                      </>
                    )}
                    {form.bookingType === "venue_only" && usingSlot && (
                      <InfoField
                        label="Slot Cost Per Day"
                        value={formatCurrency(displayAmounts.venuePricePerDay)}
                      />
                    )}
                  </div>

                  {form.bookingType === "venue_only" && usingSlot && venueTimedSlots.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[12px] font-medium text-[#6B7280] mb-1.5">
                        Available Slots
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {venueTimedSlots.map((slot) => {
                          const status = venueTimedSlotAvailability[slot.key] || "unknown";
                          const unavailable = status === "booked" || status === "blocked";
                          const isActive = selectedVenueSlotKeys.includes(slot.key);
                          return (
                            <MealSlotChip
                              key={slot.id}
                              active={isActive}
                              status={status}
                              label={`${slot.name} · ${slot.timeLabel} · ${formatCurrency(slot.price)}`}
                              onClick={() => toggleVenueOnlySlot(slot.key)}
                              disabled={!editable || unavailable}
                            />
                          );
                        })}
                      </div>
                      {selectedVenueSlotKeys.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                            Selected Slots
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedVenueSlotKeys.map((key) => {
                              const slot = findPricingSlot(selectedVenue, key);
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[12px] font-medium text-[#374151]"
                                >
                                  {slot?.name || key}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {form.bookingType === "venue_food" && foodMealSlots.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-[12px] font-medium text-[#6B7280]">
                        Choose Meals
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {foodMealSlots.map((slot) => {
                          const active = selectedFoodKeys.includes(slot.key);
                          const status = mealAvailability[slot.key] || "unknown";
                          const unavailable =
                            status === "booked" || status === "blocked";
                          return (
                            <MealSlotChip
                              key={slot.id}
                              active={active}
                              label={`${slot.name} (${slot.timeLabel})`}
                              status={status}
                              onClick={() => toggleFoodMealSlot(slot.key)}
                              disabled={!editable || unavailable}
                            />
                          );
                        })}
                      </div>
                      {selectedFoodKeys.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                            Selected Meals
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {selectedFoodKeys.map((key) => {
                              const slot = findFoodSlot(selectedVenue, key);
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-[12px] font-medium text-[#374151]"
                                >
                                  {slot?.name || key}
                                </span>
                              );
                            })}
                          </div>
                          <p className="text-[12px] text-[#9CA3AF]">
                            {formatSelectedMealsLabel(selectedVenue, selectedFoodKeys)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </InlineField>

              {form.bookingType === "venue_food" && selectedFoodKeys.length > 0 && (
                <div className="space-y-3 pt-1">
                  {pricing.mealLines.map((meal) => {
                    const entry = mealGuestEntries.find((e) => e.key === meal.slotKey);
                    const expanded = expandedMeals[meal.slotKey] !== false;
                    return (
                      <MealGuestSection
                        key={meal.slotKey}
                        meal={meal}
                        vegValue={entry?.veg || ""}
                        nonVegValue={entry?.nonVeg || ""}
                        expanded={expanded}
                        editable={editable}
                        onToggle={() =>
                          setExpandedMeals((prev) => ({
                            ...prev,
                            [meal.slotKey]: !expanded,
                          }))
                        }
                        onVegChange={(v) => updateMealGuests(meal.slotKey, "veg", v)}
                        onNonVegChange={(v) =>
                          updateMealGuests(meal.slotKey, "nonVeg", v)
                        }
                      />
                    );
                  })}
                  {editable && !foodGuestSplit.valid && foodGuestSplit.message && (
                    <p className="text-[12px] text-[#DC2626]">{foodGuestSplit.message}</p>
                  )}
                </div>
              )}

              {(selectedVenue?.addons?.length || pricing.selectedAddons.length > 0 || form.addonsCsv) && (
                <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
                      Additional Services
                    </p>
                    <p className="text-[12px] text-[#9CA3AF] mt-0.5">
                      Select requested services. Pricing is finalized offline.
                    </p>
                  </div>
                  {editable && selectedVenue ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(selectedVenue.addons || [])
                        .filter((a) => a.active !== false && a.name.trim())
                        .map((service) => {
                          const selected = (form.addonsCsv || "")
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean);
                          const checked =
                            selected.includes(service.id) || selected.includes(service.name);
                          return (
                            <label
                              key={service.id}
                              className="inline-flex items-center gap-2.5 rounded-[10px] border border-[#E8EAF0] bg-white px-3 py-2.5 text-sm text-[#374151] cursor-pointer hover:border-[#C89B3C]/35 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {
                                  const next = checked
                                    ? selected.filter(
                                        (s) => s !== service.id && s !== service.name
                                      )
                                    : [...selected.filter((s) => s !== service.name), service.id];
                                  onChange("addonsCsv", next.join(","));
                                }}
                                className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                              />
                              {service.name}
                            </label>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(pricing.selectedAddons.length
                        ? pricing.selectedAddons
                        : (booking.addons || [])
                      ).map((service) => (
                        <span
                          key={service.id}
                          className="inline-flex items-center rounded-full bg-[#F3F4F6] border border-[#E8EAF0] px-3 py-1 text-[12px] font-medium text-[#374151]"
                        >
                          {service.name}
                        </span>
                      ))}
                      {!pricing.selectedAddons.length && !(booking.addons || []).length && (
                        <span className="text-sm text-[#9CA3AF]">No services selected.</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Section>

          <Section step={5} title="Payment Summary" icon={IndianRupee}>
            <div className="space-y-0">
              {form.bookingType === "venue_only" && (
                <>
                  <PayRow
                    label="Selected Days"
                    value={String(displayAmounts.dayCount)}
                  />
                  {form.pricingMethod === "slot_based" && selectedVenueSlotKeys.length > 0 && (
                    <>
                      {selectedVenueSlotKeys.map((key) => {
                        const slot = findPricingSlot(selectedVenue, key);
                        return (
                          <PayRow
                            key={key}
                            label={slot?.name || key}
                            value={formatCurrency(Number(slot?.price) || 0)}
                          />
                        );
                      })}
                      <PayRow
                        label="Slot Cost Per Day"
                        value={formatCurrency(displayAmounts.venuePricePerDay)}
                      />
                    </>
                  )}
                  {form.pricingMethod !== "slot_based" && (
                    <PayRow
                      label="Venue Price Per Day"
                      value={formatCurrency(displayAmounts.venuePricePerDay)}
                    />
                  )}
                  <PayRow
                    label="Venue Charges"
                    value={formatCurrency(displayAmounts.venueCharges)}
                  />
                </>
              )}
              {form.bookingType === "venue_food" && (
                <>
                  {pricing.mealLines.map((meal) => (
                    <PayRow
                      key={meal.slotKey}
                      label={`${meal.name} Total`}
                      value={formatCurrency(meal.mealTotal)}
                    />
                  ))}
                  <PayRow
                    label="Food Total"
                    value={formatCurrency(displayAmounts.foodCharges)}
                    bold
                  />
                </>
              )}
              {displayAmounts.gstAmount > 0 && (
                <PayRow
                  label={
                    pricing.gstMode === "included"
                      ? `GST (${pricing.gstPercent}% included)`
                      : `GST (${pricing.gstPercent}%)`
                  }
                  value={formatCurrency(displayAmounts.gstAmount)}
                />
              )}

              <div className="border-t border-[#E8EAF0] my-1" />

              <PayRow
                label="Booking Total"
                value={formatCurrency(displayAmounts.bookingAmount)}
                bold
              />
              <PayRow
                label={`Advance (${displayAmounts.minOnlinePercent || 0}%)`}
                value={formatCurrency(displayAmounts.customerPaysNow)}
                bold
              />
              <PayRow
                label={`Platform Commission (${displayAmounts.platformCommissionPercent}%)`}
                value={formatCurrency(displayAmounts.platformCommission)}
              />
              <p className="text-[11px] text-[#9CA3AF] pb-1 text-right">
                Commission is non-refundable and calculated on the advance only.
              </p>
              <PayRow
                label="Vendor Receivable"
                value={formatCurrency(displayAmounts.vendorReceivable || 0)}
              />
              <PayRow
                label="Remaining Balance"
                value={formatCurrency(displayAmounts.remainingBalance)}
                bold
              />
              <p className="text-[11px] text-[#9CA3AF] pt-1">
                Customer pays only the advance online. Remaining balance is paid
                directly to the vendor.
              </p>
            </div>
          </Section>

          <Section step={4} title="Booking Information" icon={Receipt}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
              {editable ? (
                <SearchableSelect
                  label="Event Type"
                  required
                  variant="underline"
                  value={form.eventType}
                  options={eventOptions}
                  placeholder="Select event"
                  searchPlaceholder="Search event type..."
                  onChange={(v) => onChange("eventType", v)}
                />
              ) : (
                <InfoField label="Event Type" value={form.eventType} />
              )}
              {form.bookingType === "venue_only" &&
                (editable ? (
                  <InlineField label="Guest Count">
                    <input
                      type="number"
                      min={1}
                      className={inputCls}
                      value={form.guestCount}
                      onChange={(e) => onChange("guestCount", e.target.value)}
                      placeholder="Optional"
                    />
                  </InlineField>
                ) : (
                  <InfoField label="Guest Count" value={form.guestCount || "—"} />
                ))}
              <div className="sm:col-span-2">
                {editable ? (
                  <InlineField label="Special Requirements" wide>
                    <textarea
                      className={`${inputCls} h-20 py-1 resize-none`}
                      value={form.specialRequirements}
                      onChange={(e) => onChange("specialRequirements", e.target.value)}
                      placeholder="Any special notes for the venue team…"
                    />
                  </InlineField>
                ) : (
                  <InlineField label="Special Requirements" wide>
                    <p className={`${valueCls} whitespace-pre-wrap`}>
                      {form.specialRequirements || "—"}
                    </p>
                  </InlineField>
                )}
              </div>
            </div>
          </Section>

          {editable && (
            <div className="sticky bottom-0 z-20 mt-3">
              <div className="flex flex-wrap items-center justify-end gap-2 rounded-t-[14px] border border-b-0 border-[#E8EAF0] bg-white/95 backdrop-blur-md px-4 py-3 shadow-[0_-6px_20px_rgba(16,24,40,0.08)]">
                <p className="mr-auto text-[12px] text-[#9CA3AF]">
                  {isUnavailable
                    ? "Selected slot is unavailable — choose another date or slot."
                    : venueSlotSelectionInvalid
                      ? "Select at least one slot for slot-based venue booking."
                    : isSubmitBlocked && foodGuestSplit.message
                      ? foodGuestSplit.message
                      : "Pricing is calculated automatically from venue configuration."}
                </p>
                <Button variant="ghost" onClick={onCancel} disabled={saving}>
                  Cancel
                </Button>
                {onSaveDraft && (
                  <Button variant="secondary" onClick={onSaveDraft} disabled={saving}>
                    Save Draft
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={onSave}
                  loading={saving}
                  disabled={isSubmitBlocked}
                >
                  {isCreate ? "Create Booking" : "Update Booking"}
                </Button>
              </div>
            </div>
          )}
          </div>
        }
        overview={
          <div className={sectionCls}>
            <div className="px-4 py-3 border-b border-[#E8EAF0] bg-[#FCFCFD]/80">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
                Booking Summary
              </p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">
                {editable ? "Updates live as you configure" : "Booking snapshot"}
              </p>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <AvailabilityBadgePill status={availabilityStatus} />
                <div className="flex gap-1.5">
                  <BookingStatusPill status={financeSnapshot.bookingStatus} />
                  <PaymentStatusPill status={financeSnapshot.paymentStatus} />
                </div>
              </div>
              <SummaryRow label="Customer" value={form.customerName || "—"} />
              <SummaryRow label="Venue" value={form.venueName || "—"} />
              <SummaryRow label="Business Profile" value={form.businessName || "—"} />
              {bookingDates.length > 1 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-[12px] text-[#6B7280]">Booking Dates</p>
                    <div className="space-y-0.5">
                      {bookingDates.map((d) => (
                        <p key={d} className="text-sm font-semibold text-[#111827]">
                          {formatDate(d)}
                        </p>
                      ))}
                    </div>
                  </div>
                  <SummaryRow
                    label="Duration"
                    value={`${dayCount} Day${dayCount === 1 ? "" : "s"}`}
                  />
                </>
              ) : (
                <SummaryRow
                  label="Booking Date"
                  value={form.eventDate ? formatDate(form.eventDate) : "—"}
                />
              )}
              <SummaryRow label="Venue Type" value={form.bookingType === "venue_food" ? "Venue + Food" : "Venue Only"} />
              {form.bookingType === "venue_food" ? (
                <>
                  <SummaryRow
                    label="Selected Meals"
                    value={
                      selectedFoodKeys.length > 0
                        ? formatSelectedMealsLabel(selectedVenue, selectedFoodKeys)
                        : "—"
                    }
                  />
                  {pricing.mealLines.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[12px] text-[#6B7280]">Guest Summary</p>
                      {pricing.mealLines.map((meal) => (
                        <SummaryRow
                          key={meal.slotKey}
                          label={meal.name}
                          value={`${meal.totalGuests} Guests`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <SummaryRow
                    label="Booking Mode"
                    value={form.pricingMethod === "slot_based" ? "Slot Based" : "Full Day"}
                  />
                  {form.pricingMethod === "slot_based" && selectedVenueSlotKeys.length > 0 && (
                    <>
                      <SummaryRow
                        label="Selected Slots"
                        value={selectedVenueSlotKeys
                          .map((k) => findPricingSlot(selectedVenue, k)?.name || k)
                          .join(", ")}
                      />
                      <SummaryRow
                        label="Total Slots"
                        value={String(selectedVenueSlotKeys.length * Math.max(1, dayCount))}
                      />
                    </>
                  )}
                  <SummaryRow label="Guest Count" value={form.guestCount || "—"} />
                </>
              )}
              {(pricing.selectedAddons.length > 0 || (booking.addons || []).length > 0) && (
                <div className="space-y-1.5">
                  <p className="text-[12px] text-[#6B7280]">Additional Services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(pricing.selectedAddons.length
                      ? pricing.selectedAddons
                      : booking.addons || []
                    ).map((service) => (
                      <span
                        key={service.id}
                        className="inline-flex rounded-full bg-[#F3F4F6] border border-[#E8EAF0] px-2.5 py-0.5 text-[11px] font-medium text-[#374151]"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t border-[#E8EAF0] pt-3 space-y-2.5">
                <SummaryRow
                  label="Booking Total"
                  value={formatCurrency(financeSnapshot.bookingAmount)}
                  strong
                />
                {isPersistedBooking ? (
                  <>
                    <SummaryRow
                      label="Total Amount Paid"
                      value={formatCurrency(financeSnapshot.totalPaid)}
                    />
                    <SummaryRow
                      label="Remaining Balance"
                      value={formatCurrency(financeSnapshot.remaining)}
                      strong
                    />
                    <SummaryRow
                      label="Latest Invoice No"
                      value={financeSnapshot.latestInvoice}
                    />
                    <SummaryRow
                      label="Total Payments"
                      value={String(financeSnapshot.totalPayments)}
                    />
                    <SummaryRow
                      label="Payment Status"
                      value={String(financeSnapshot.paymentStatus || "")
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())}
                    />
                  </>
                ) : (
                  <>
                    <SummaryRow
                      label="Advance"
                      value={formatCurrency(displayAmounts.customerPaysNow)}
                    />
                    <SummaryRow
                      label="Remaining Balance"
                      value={formatCurrency(displayAmounts.remainingBalance)}
                      strong
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        }
        crossReference={
          isPersistedBooking ? (
            <BookingPaymentsPanel
              booking={booking}
              allowRecordPayment={mode === "view" || mode === "edit"}
            />
          ) : undefined
        }
      />

      {editable && (
        <QuickCreateModal
          open={quickModal}
          title="Create New Customer"
          subtitle="Save essential details and continue booking."
          saving={quickSaving}
          onClose={() => setQuickModal(false)}
          onSave={saveQuickCustomer}
        >
          <QuickField label="Full Name" required>
            <input
              className={quickInputCls}
              value={customerDraft.name}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, name: e.target.value }))}
            />
          </QuickField>
          <QuickField label="Mobile Number" required>
            <input
              className={quickInputCls}
              value={customerDraft.phone}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, phone: e.target.value }))}
            />
          </QuickField>
          <QuickField label="Email">
            <input
              className={quickInputCls}
              value={customerDraft.email}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, email: e.target.value }))}
            />
          </QuickField>
          <QuickField label="Address">
            <input
              className={quickInputCls}
              value={customerDraft.address}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, address: e.target.value }))}
            />
          </QuickField>
        </QuickCreateModal>
      )}
    </>
  );
}

function Section({
  step,
  title,
  icon: Icon,
  headerAction,
  children,
}: {
  step: number;
  title: string;
  icon: ComponentType<{ className?: string }>;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={sectionCls}>
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        <span className="w-6 h-6 rounded-full bg-white border border-[#FFD4B0] text-[#C89B3C] text-[11px] font-bold flex items-center justify-center shrink-0">
          {step}
        </span>
        <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
          {title}
        </h2>
        {headerAction ? <div className="ml-auto shrink-0">{headerAction}</div> : null}
      </div>
      <div className="px-4 md:px-5 py-4">{children}</div>
    </section>
  );
}

function InlineField({
  label,
  required,
  children,
  wide,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`flex items-start gap-2 ${wide ? "sm:col-span-2" : ""}`}>
      <p className={labelCls}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </p>
      <div className="flex-1 min-w-0 pt-px">{children}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  editable,
  onChange,
  required,
  wide,
}: {
  label: string;
  value?: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  required?: boolean;
  wide?: boolean;
}) {
  return (
    <InlineField label={label} required={required} wide={wide}>
      {editable ? (
        <input
          className={inputCls}
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <p className={valueCls}>{value || "—"}</p>
      )}
    </InlineField>
  );
}

function VenueDetailsCard({ venue }: { venue: Venue }) {
  const statusLabelText = String(venue.status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const rows: { label: string; value: string }[] = [
    { label: "Business Profile", value: venue.businessName || "—" },
    { label: "Venue Owner", value: venue.ownerName || "—" },
    { label: "Venue Name", value: venue.name || "—" },
    { label: "Venue Category", value: venue.category || "—" },
    { label: "Venue Type", value: venue.venueType || "—" },
    { label: "City", value: venue.city || "—" },
    {
      label: "Maximum Capacity",
      value: venue.seatingCapacity ? String(venue.seatingCapacity) : "—",
    },
    {
      label: "Booking Model",
      value: venue.bookingModel === "venue_food" ? "Venue + Food" : "Venue Only",
    },
    {
      label: "Default Pricing",
      value: "Full Day",
    },
    {
      label: "Minimum Online Booking Amount",
      value: formatCurrency(venue.minOnlineBookingAmount || 0),
    },
    { label: "Status", value: statusLabelText || "—" },
  ];

  return (
    <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] overflow-hidden">
      <div className="px-4 py-2.5 border-b border-[#E8EAF0] bg-[#FFF3EB]/40">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
          Venue Details
        </p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
        {rows.map((row) => (
          <InfoField key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </div>
  );
}

function MealSlotChip({
  active,
  label,
  status,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  status: AvailabilityBadge;
  onClick: () => void;
  disabled?: boolean;
}) {
  const statusHint =
    status === "booked"
      ? "Already Booked"
      : status === "blocked"
        ? "Blocked"
        : status === "available"
          ? "Available"
          : "";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={statusHint || undefined}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
        active
          ? "border-[#C89B3C] bg-[#FFF3EB] text-[#B8862B]"
          : status === "booked"
            ? "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
            : status === "blocked"
              ? "border-[#FED7AA] bg-[#FCFAF8] text-[#B8862B]"
              : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FFD4B0]"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span
        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
          active ? "border-[#C89B3C] bg-[#C89B3C]" : "border-[#CBD5E1] bg-white"
        }`}
      >
        {active && (
          <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" aria-hidden>
            <path
              d="M2 6l2.5 2.5L10 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span>{label}</span>
      {status === "booked" && !active && (
        <span className="text-[10px] font-semibold uppercase tracking-wide">Booked</span>
      )}
    </button>
  );
}

function MealGuestSection({
  meal,
  vegValue,
  nonVegValue,
  expanded,
  editable,
  onToggle,
  onVegChange,
  onNonVegChange,
}: {
  meal: MealPricingLine;
  vegValue: string;
  nonVegValue: string;
  expanded: boolean;
  editable: boolean;
  onToggle: () => void;
  onVegChange: (value: string) => void;
  onNonVegChange: (value: string) => void;
}) {
  const totalGuests = (Number(vegValue) || 0) + (Number(nonVegValue) || 0);

  return (
    <div className="rounded-[10px] bg-[#FAFAFB] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-[#F3F4F6]/80 transition-colors"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#111827]">{meal.name}</p>
          <p className="text-[12px] text-[#9CA3AF]">{meal.timeLabel}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {meal.mealTotal > 0 && (
            <span className="text-sm font-semibold tabular-nums text-[#111827]">
              {formatCurrency(meal.mealTotal)}
            </span>
          )}
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-[#9CA3AF]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
          )}
        </div>
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3">
            <InfoField
              label="Veg Plate Price"
              value={meal.vegPlatePrice ? formatCurrency(meal.vegPlatePrice) : "—"}
            />
            <InfoField
              label="Non-Veg Plate Price"
              value={
                meal.nonVegPlatePrice ? formatCurrency(meal.nonVegPlatePrice) : "—"
              }
            />
            {editable ? (
              <InlineField label="Veg Guests">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={vegValue}
                  onChange={(e) => onVegChange(e.target.value)}
                  placeholder="0"
                />
              </InlineField>
            ) : (
              <InfoField label="Veg Guests" value={vegValue || "0"} />
            )}
            {editable ? (
              <InlineField label="Non-Veg Guests">
                <input
                  type="number"
                  min={0}
                  className={inputCls}
                  value={nonVegValue}
                  onChange={(e) => onNonVegChange(e.target.value)}
                  placeholder="0"
                />
              </InlineField>
            ) : (
              <InfoField label="Non-Veg Guests" value={nonVegValue || "0"} />
            )}
            <InfoField label="Total Guests" value={String(totalGuests || "—")} />
            <InfoField
              label={`${meal.name} Total`}
              value={meal.mealTotal > 0 ? formatCurrency(meal.mealTotal) : "—"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RadioChip({
  active,
  label,
  onClick,
  disabled,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all duration-200 ${
        active
          ? "border-[#C89B3C] bg-[#FFF3EB] text-[#B8862B]"
          : "border-[#E5E7EB] bg-white text-[#4B5563] hover:border-[#FFD4B0]"
      } ${disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""}`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
          active ? "border-[#C89B3C]" : "border-[#CBD5E1]"
        }`}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" />}
      </span>
      {label}
    </button>
  );
}

function PayRowDetail({
  label,
  detail,
  value,
}: {
  label: string;
  detail: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-sm text-[#6B7280]">{label}</p>
        <p className="text-[12px] text-[#9CA3AF] tabular-nums">{detail}</p>
      </div>
      <p className="text-sm text-right tabular-nums shrink-0 text-[#111827] font-normal">
        {value}
      </p>
    </div>
  );
}

function PayRow({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <p
        className={`text-sm ${
          bold
            ? "font-bold text-[#111827]"
            : muted
              ? "text-[#9CA3AF]"
              : "text-[#6B7280]"
        }`}
      >
        {label}
        {muted ? (
          <span className="ml-1.5 text-[11px] font-normal text-[#C0C4CC]">
            (Read Only)
          </span>
        ) : null}
      </p>
      <p
        className={`text-sm text-right tabular-nums shrink-0 text-[#111827] ${
          bold ? "font-bold" : "font-normal"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InlineAvailability({ status }: { status: AvailabilityBadge }) {
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#16A34A]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
        Available
      </span>
    );
  }
  if (status === "booked") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#DC2626]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
        Booked
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#B8862B]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B8862B]" />
        Blocked
      </span>
    );
  }
  return null;
}

function AvailabilityBadgePill({ status }: { status: AvailabilityBadge }) {
  if (status === "unknown") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border bg-[#FCFCFD] text-[#94A3B8] border-[#E8EAF0]">
        Select date & slot
      </span>
    );
  }
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Available
      </span>
    );
  }
  if (status === "booked") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]">
        <XCircle className="w-3.5 h-3.5" />
        Already Booked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border bg-[#FFF3EB] text-[#B8862B] border-[#FED7AA]">
      <AlertTriangle className="w-3.5 h-3.5" />
      Blocked
    </span>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className={`text-[13px] ${strong ? "font-bold text-[#111827]" : "text-[#6B7280]"}`}>
        {label}
      </span>
      <span
        className={`text-sm text-right tabular-nums text-[#111827] ${
          strong ? "font-bold" : "font-normal"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
