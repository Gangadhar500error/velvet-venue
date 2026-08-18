"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { formatCurrency, formatDate, paymentMethodOptions } from "../data";
import {
  availabilityLabel,
  buildVenueFormPatch,
  calculateBookingPricing,
  findFoodSlot,
  findPricingSlot,
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
  getDaySlotAvailability,
  getFoodMealAvailability,
  parseDateSlotsJson,
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
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import { notify } from "../../_components/ui/Toast";
import { QuickCreateModal, QuickField, quickInputCls } from "./SmartSearchSelect";
import type { Venue } from "../../venues/types";
import {
  createCustomer,
  searchCustomers,
  type CustomerSearchItem,
} from "@/lib/customers";
import {
  fetchVenue,
  fetchVenueMeta,
  mapVenueDetail,
  searchVenues,
  type VenueSearchItem,
} from "@/lib/venues";
import { fetchAvailabilityWindow } from "@/lib/availability";
import { quoteBooking, type BookingQuote } from "@/lib/bookings";
import { formToBookingPayload } from "../apiMap";

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
  onBookingUpdated?: (booking: Booking) => void;
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
  onBookingUpdated,
}: Props) {
  const [quickModal, setQuickModal] = useState(false);
  const [quickSaving, setQuickSaving] = useState(false);
  const [customerDraft, setCustomerDraft] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    country: "India",
  });
  const [customerHits, setCustomerHits] = useState<CustomerSearchItem[]>([]);
  const [customerSearching, setCustomerSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchItem | null>(null);
  const [venueHits, setVenueHits] = useState<VenueSearchItem[]>([]);
  const [venueSearching, setVenueSearching] = useState(false);
  const [liveVenue, setLiveVenue] = useState<Venue | undefined>(undefined);
  const [venueLoading, setVenueLoading] = useState(false);
  const [backendQuote, setBackendQuote] = useState<BookingQuote | null>(null);
  const [catalogEventTypes, setCatalogEventTypes] = useState<string[]>([]);
  const amountReceivedTouched = useRef(false);

  useEffect(() => {
    amountReceivedTouched.current = false;
  }, [form.venueId, form.selectedDates, form.eventDate, form.slotKey, form.bookingType]);

  const selectedVenue = liveVenue;

  useEffect(() => {
    let cancelled = false;
    fetchVenueMeta()
      .then((meta) => {
        if (!cancelled) setCatalogEventTypes(meta.event_types || []);
      })
      .catch(() => {
        if (!cancelled) setCatalogEventTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    selectedVenue?.id,
    form.bookingType,
    bookingTypeSupport.venueOnly,
    bookingTypeSupport.venueFood,
  ]);

  useEffect(() => {
    const venueId = form.venueId?.trim();
    if (!venueId) {
      setLiveVenue(undefined);
      setBackendQuote(null);
      return;
    }
    if (liveVenue && (liveVenue.id === venueId || liveVenue.venueId === venueId)) return;
    let cancelled = false;
    setVenueLoading(true);
    (async () => {
      try {
        const detail = await fetchVenue(venueId);
        const mapped = mapVenueDetail(detail);
        const windowDays = mapped.maxAdvanceBookingDays || 180;
        const availability = await fetchAvailabilityWindow(mapped.id, windowDays);
        mapped.availability = availability.days;
        if (!cancelled) setLiveVenue(mapped);
      } catch (error) {
        if (!cancelled) {
          setLiveVenue(undefined);
          notify.error(error instanceof Error ? error.message : "Unable to load venue.");
        }
      } finally {
        if (!cancelled) setVenueLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.venueId]);

  useEffect(() => {
    if (!editable || !form.venueId || !form.eventDate) {
      setBackendQuote(null);
      return;
    }
    const timer = window.setTimeout(async () => {
      try {
        const quote = await quoteBooking(formToBookingPayload(form));
        setBackendQuote(quote);
      } catch {
        setBackendQuote(null);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    editable,
    form.venueId,
    form.eventDate,
    form.eventEndDate,
    form.selectedDates,
    form.bookingType,
    form.pricingMethod,
    form.slotKey,
    form.foodSlotKeys,
    form.mealGuestsJson,
    form.guestCount,
    form.vegGuestCount,
    form.nonVegGuestCount,
    form.addonsCsv,
    form.discountAmount,
    form.advancePaid,
    form.dateSlotsJson,
  ]);

  const searchCustomerDirectory = useCallback(async (query: string) => {
    setCustomerSearching(true);
    try {
      const data = await searchCustomers(query, 1, 20);
      setCustomerHits(data.items || []);
    } catch {
      setCustomerHits([]);
    } finally {
      setCustomerSearching(false);
    }
  }, []);

  const searchVenueDirectory = useCallback(async (query: string) => {
    setVenueSearching(true);
    try {
      const data = await searchVenues(query, 1, 20);
      setVenueHits(data.items || []);
    } catch {
      setVenueHits([]);
    } finally {
      setVenueSearching(false);
    }
  }, []);

  const pricing = useMemo(
    () => calculateBookingPricing(selectedVenue, form),
    [selectedVenue, form]
  );

  const bookingDates = useMemo(() => resolveBookingDates(form), [form]);
  const dayCount = Math.max(1, bookingDates.length || pricing.dayCount || 1);

  const availabilityStatus: AvailabilityBadge = useMemo(() => {
    const dates = bookingDates.length > 0 ? bookingDates : form.eventDate ? [form.eventDate] : [];
    if (dates.length === 0) return "unknown";
    const exclude = {
      excludeBookingId: booking.bookingId,
      excludeBookingRef: isCreate ? undefined : booking.id !== "new" ? booking.id : booking.bookingId,
    };
    const perDate = parseDateSlotsJson(form.dateSlotsJson);
    const selectedKeys = parseSelectedSlotKeys(form.slotKey, form.slot).filter((k) => k !== "full_day");
    if (form.bookingType === "venue_only" && form.pricingMethod === "slot_based") {
      let worst: AvailabilityBadge = "available";
      for (const date of dates) {
        const keys = perDate[date]?.length ? perDate[date] : selectedKeys;
        if (keys.length === 0) {
          const day = getDaySlotAvailability(selectedVenue, date, {
            bookingType: "venue_only",
            pricingMethod: "slot_based",
            ...exclude,
          });
          if (day === "booked") return "booked";
          if (day === "blocked") worst = "blocked";
          if (day === "partial" && worst === "available") worst = "partial";
          continue;
        }
        for (const key of keys) {
          const status = getVenueOnlySlotAvailability(selectedVenue, [date], key, exclude);
          if (status === "booked") return "booked";
          if (status === "blocked") worst = "blocked";
        }
      }
      return worst;
    }
    let worst: AvailabilityBadge = "available";
    for (const date of dates) {
      const status = getDaySlotAvailability(selectedVenue, date, {
        bookingType: form.bookingType,
        pricingMethod: form.pricingMethod,
        ...exclude,
      });
      if (status === "booked") return "booked";
      if (status === "blocked") worst = "blocked";
      if (status === "partial" && worst === "available") worst = "partial";
    }
    return worst;
  }, [
    selectedVenue,
    form.eventDate,
    form.slotKey,
    form.slot,
    form.dateSlotsJson,
    form.pricingMethod,
    bookingDates,
    form.bookingType,
    booking.bookingId,
    booking.id,
    isCreate,
  ]);

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
  // Partial days remain bookable for remaining slots.

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
      const commission =
        booking.platformCommission ??
        Math.round((paysNow * (platformCommissionPercent || 0)) / 100);
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
        platformCommissionPercent:
          booking.platformCommissionPercent ?? platformCommissionPercent,
        vendorReceivable: booking.vendorReceivable ?? Math.max(0, paysNow - commission),
        customerPaysNow: booking.paidAmount || paysNow,
        remainingBalance: booking.pendingAmount ?? Math.max(0, amount - paysNow),
        venuePricePerDay: days > 0 ? Math.round(resolvedVenue / days) : resolvedVenue,
        dayCount: days,
      };
    }

    if (editable) {
      if (!backendQuote) {
        return {
          venueCharges: 0,
          foodCharges: 0,
          addonCharges: 0,
          gstAmount: 0,
          bookingAmount: 0,
          minOnlineAmount: 0,
          minOnlinePercent: 0,
          platformCommission: 0,
          platformCommissionPercent: 0,
          vendorReceivable: 0,
          customerPaysNow: 0,
          remainingBalance: 0,
          venuePricePerDay: 0,
          dayCount: days,
        };
      }
      const quoteDays = Math.max(1, days);
      return {
        venueCharges: backendQuote.venue_price,
        foodCharges: backendQuote.food_cost,
        addonCharges: backendQuote.services_total,
        gstAmount: backendQuote.gst_amount,
        bookingAmount: backendQuote.grand_total,
        minOnlineAmount: backendQuote.advance,
        minOnlinePercent: backendQuote.advance_percent,
        platformCommission: backendQuote.commission,
        platformCommissionPercent: backendQuote.platform_commission_percent ?? 0,
        vendorReceivable: backendQuote.vendor_amount,
        customerPaysNow:
          backendQuote.amount_received ?? backendQuote.advance,
        remainingBalance: backendQuote.remaining,
        venuePricePerDay:
          quoteDays > 0 ? Math.round(backendQuote.venue_price / quoteDays) : backendQuote.venue_price,
        dayCount: quoteDays,
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
    backendQuote,
    editable,
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
    const bookingAmount = backendQuote?.grand_total ?? 0;
    const advance = backendQuote?.advance ?? 0;
    const gstAmount = backendQuote?.gst_amount ?? 0;
    const signature = `${form.venueId}|${form.bookingType}|${form.foodSlotKeys}|${form.mealGuestsJson}|${form.selectedDates || ""}|${form.eventDate}|${bookingAmount}|${advance}|${availabilityStatus}`;
    if (lastSynced.current === signature) return;
    lastSynced.current = signature;

    const suggested = advance > 0 ? String(advance) : bookingAmount > 0 ? "0" : "";
    const received = amountReceivedTouched.current
      ? Number(form.advancePaid) || 0
      : advance;
    const patch: Partial<BookingFormValues> = {
      bookingAmount: bookingAmount ? String(bookingAmount) : "",
      taxAmount: gstAmount ? String(gstAmount) : "0",
      addonsCsv:
        form.addonsCsv ||
        pricing.selectedAddons.map((a) => a.id).join(","),
      availabilityLabel: availabilityLabel(availabilityStatus),
    };
    if (!amountReceivedTouched.current) {
      patch.advancePaid = suggested;
    }

    if (bookingAmount > 0) {
      const paid = received;
      patch.paymentStatus =
        paid <= 0 ? "unpaid" : paid >= bookingAmount ? "paid" : "partial";
    }

    onPatch(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    editable,
    form.venueId,
    form.bookingType,
    form.foodSlotKeys,
    form.mealGuestsJson,
    form.selectedDates,
    form.eventDate,
    backendQuote,
    availabilityStatus,
    onPatch,
  ]);

  // Load venue, business, vendor, pricing, and booking mode from the selected venue.
  useEffect(() => {
    if (!editable || !selectedVenue) return;
    onPatch(
      buildVenueFormPatch(selectedVenue, {
        preserveSlot: { slotKey: form.slotKey, slotLabel: form.slot },
        preferBookingType: form.bookingType,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, selectedVenue?.id]);

  const customerOptions = useMemo<SearchableOption[]>(
    () =>
      customerHits.map((c) => ({
        value: c.id,
        label: c.full_name,
        icon: UserRound,
        description: [c.phone, c.email].filter(Boolean),
        meta: c.customer_code,
        keywords: `${c.customer_code} ${c.phone} ${c.email} ${c.full_name}`,
      })),
    [customerHits]
  );

  const selectedCustomerOption = useMemo<SearchableOption | null>(() => {
    if (!form.customerId) return null;
    const hit = customerHits.find((c) => c.id === form.customerId) || selectedCustomer;
    if (!hit) {
      return form.customerName
        ? { value: form.customerId, label: form.customerName, icon: UserRound }
        : null;
    }
    return {
      value: hit.id,
      label: hit.full_name,
      icon: UserRound,
      description: [hit.phone, hit.email].filter(Boolean),
      meta: hit.customer_code,
    };
  }, [form.customerId, form.customerName, customerHits, selectedCustomer]);

  const venueOptions = useMemo<SearchableOption[]>(
    () =>
      venueHits.map((v) => ({
        value: v.id,
        label: v.venue_name,
        icon: Landmark,
        description: [v.business_name || "", v.city || ""].filter(Boolean),
        meta: v.venue_code,
        keywords: [v.venue_name, v.venue_code, v.business_name, v.city, v.category]
          .filter(Boolean)
          .join(" "),
      })),
    [venueHits]
  );

  const selectedVenueOption = useMemo<SearchableOption | null>(() => {
    if (!form.venueId) return null;
    const hit = venueHits.find((v) => v.id === form.venueId);
    if (hit) {
      return {
        value: hit.id,
        label: hit.venue_name,
        icon: Landmark,
        description: [hit.business_name || "", hit.city || ""].filter(Boolean),
        meta: hit.venue_code,
      };
    }
    if (liveVenue && (liveVenue.id === form.venueId || liveVenue.venueId === form.venueId)) {
      return {
        value: liveVenue.id,
        label: liveVenue.name,
        icon: Landmark,
        description: [liveVenue.businessName || "", liveVenue.city || ""].filter(Boolean),
        meta: liveVenue.venueId,
      };
    }
    return form.venueName
      ? { value: form.venueId, label: form.venueName, icon: Landmark }
      : null;
  }, [form.venueId, form.venueName, venueHits, liveVenue]);

  const eventOptions = useMemo(
    () =>
      (selectedVenue?.eventCategories?.length
        ? selectedVenue.eventCategories
        : catalogEventTypes
      ).map((e) => ({
        value: e,
        label: e,
        icon: CalendarDays,
      })),
    [selectedVenue?.eventCategories, catalogEventTypes]
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
    return getDaySlotAvailability(selectedVenue, date, {
      bookingType: form.bookingType,
      pricingMethod: form.pricingMethod,
      excludeBookingId: booking.bookingId,
      excludeBookingRef,
    });
  };

  const hasVenueOnlyFullDay = venueFullDaySlots.length > 0;
  const hasVenueOnlySlots = venueTimedSlots.length > 0;
  const canSwitchVenueMode = hasVenueOnlyFullDay && hasVenueOnlySlots;

  const dateScope =
    bookingDates.length > 0 ? bookingDates : form.eventDate ? [form.eventDate] : [];

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

  const applyCustomer = (c: CustomerSearchItem) => {
    setSelectedCustomer(c);
    onPatch({
      customerId: c.id,
      customerName: c.full_name,
      customerPhone: c.phone,
      customerEmail: c.email,
      customerAddress: [c.address, c.city, c.state].filter(Boolean).join(", "),
    });
  };

  const selectCustomer = (value: string) => {
    if (!editable) return;
    if (!value) {
      setSelectedCustomer(null);
      onPatch({
        customerId: "",
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        customerAddress: "",
      });
      return;
    }
    const c = customerHits.find((x) => x.id === value) || selectedCustomer;
    if (!c) {
      onPatch({ customerId: value });
      return;
    }
    applyCustomer(c);
  };

  const selectVenue = (value: string) => {
    if (!editable) return;
    if (!value) {
      setLiveVenue(undefined);
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
    onPatch({ venueId: value });
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

  const applyVenueSlotSelection = (nextByDate: Record<string, string[]>) => {
    if (!selectedVenue) return;
    const union = venueTimedSlots
      .map((s) => s.key)
      .filter((k) => Object.values(nextByDate).some((keys) => keys.includes(k)));
    const selectedSlots = union
      .map((k) => findPricingSlot(selectedVenue, k))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    const firstTimes = selectedSlots[0] ? parseTimeRange(selectedSlots[0].timeLabel) : { start: "", end: "" };
    const lastTimes = selectedSlots[selectedSlots.length - 1]
      ? parseTimeRange(selectedSlots[selectedSlots.length - 1].timeLabel)
      : { start: "", end: "" };
    onPatch({
      pricingMethod: "slot_based",
      slotKey: union.join(","),
      slot: selectedSlots.map((s) => s.name).join(", "),
      dateSlotsJson: JSON.stringify(nextByDate),
      startTime: firstTimes.start || "",
      endTime: lastTimes.end || "",
      bookingAmount: "",
      taxAmount: "",
    });
  };

  const toggleVenueOnlySlot = (slotKey: string, date?: string) => {
    if (!editable || !selectedVenue || form.bookingType !== "venue_only") return;
    const targetDate = date || bookingDates[0] || form.eventDate;
    if (!targetDate) return;
    const status = getVenueOnlySlotAvailability(selectedVenue, [targetDate], slotKey, {
      excludeBookingId: booking.bookingId,
      excludeBookingRef,
    });
    if (status === "booked" || status === "blocked") return;

    const currentMap = parseDateSlotsJson(form.dateSlotsJson);
    const fallback = parseSelectedSlotKeys(form.slotKey, form.slot).filter((k) => k !== "full_day");
    const dates = bookingDates.length ? bookingDates : [targetDate];
    const nextByDate: Record<string, string[]> = {};
    for (const d of dates) {
      nextByDate[d] = currentMap[d]?.length ? [...currentMap[d]] : [...fallback];
    }
    const current = nextByDate[targetDate] || [];
    nextByDate[targetDate] = current.includes(slotKey)
      ? current.filter((k) => k !== slotKey)
      : [...current, slotKey];
    applyVenueSlotSelection(nextByDate);
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
    if (!customerDraft.name.trim() || !customerDraft.phone.trim() || !customerDraft.email.trim()) {
      notify.validation("Name, mobile, and email are required.");
      return;
    }
    setQuickSaving(true);
    try {
      const created = await createCustomer({
        name: customerDraft.name.trim(),
        first_name: customerDraft.name.trim().split(/\s+/)[0],
        last_name: customerDraft.name.trim().split(/\s+/).slice(1).join(" "),
        email: customerDraft.email.trim().toLowerCase(),
        mobile: customerDraft.phone.trim(),
        phone: customerDraft.phone.trim(),
        address: customerDraft.address.trim() || null,
        address_line1: customerDraft.address.trim() || null,
        city: customerDraft.city.trim() || null,
        state: customerDraft.state.trim() || null,
        country: customerDraft.country.trim() || null,
        registration_source: "admin",
        status: "active",
        return_existing: false,
      });
      const item: CustomerSearchItem = {
        id: created.customer.id,
        customer_code: created.customer.customer_code,
        first_name: created.customer.first_name,
        last_name: created.customer.last_name,
        full_name: created.customer.full_name,
        phone: created.customer.mobile,
        email: created.customer.email,
        address: created.customer.address_line1,
        city: created.customer.city,
        state: created.customer.state,
        profile_photo: created.customer.profile_image,
        is_verified: created.customer.email_verified,
        is_active: created.customer.status === "active",
      };
      setCustomerHits((prev) => [item, ...prev.filter((row) => row.id !== item.id)]);
      applyCustomer(item);
      setQuickModal(false);
      setCustomerDraft({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state: "",
        country: "India",
      });
      notify.created("Customer");
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to create customer.");
    } finally {
      setQuickSaving(false);
    }
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
                    selectedOption={selectedCustomerOption}
                    loading={customerSearching}
                    debounceMs={300}
                    placeholder="Select customer"
                    searchPlaceholder="Search name, phone, email, or code..."
                    createLabel="New Customer"
                    emptyLabel="No matching results found."
                    onQueryChange={searchCustomerDirectory}
                    onChange={selectCustomer}
                    onCreate={() => {
                      setCustomerDraft({
                        name: "",
                        phone: "",
                        email: "",
                        address: "",
                        city: "",
                        state: "",
                        country: "India",
                      });
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
                  selectedOption={selectedVenueOption}
                  loading={venueSearching || venueLoading}
                  debounceMs={300}
                  placeholder="Search venue by name, ID, business, or city"
                  searchPlaceholder="Venue name, code, business, city…"
                  emptyLabel="No matching venues found."
                  onQueryChange={searchVenueDirectory}
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
                                      const todayIso = toIsoDate(new Date());
                                      const status = getDateAvailability(cell.iso);
                                      const disabled =
                                        cell.iso < todayIso ||
                                        status === "booked" ||
                                        status === "blocked";
                                      // partial days stay selectable for remaining slots
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
                                            const dayDisabled =
                                              dayStatus === "booked" || dayStatus === "blocked";
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
                                              // partial included in range is allowed
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
                                                : status === "partial"
                                                  ? "border-[#FDE68A] bg-[#FFFBEB] text-[#D97706]"
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
                                      <span className="w-3.5 h-3.5 rounded border border-[#FDE68A] bg-[#FFFBEB]" />
                                      Partial
                                    </div>
                                    <div className="inline-flex items-center gap-2">
                                      <XCircle className="w-4 h-4 text-[#DC2626]" aria-hidden />
                                      Fully Booked
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
                    <div className="space-y-3">
                      {(bookingDates.length > 0 ? bookingDates : form.eventDate ? [form.eventDate] : []).map(
                        (date) => {
                          const perDate = parseDateSlotsJson(form.dateSlotsJson);
                          const selectedForDate =
                            perDate[date]?.length
                              ? perDate[date]
                              : bookingDates.length <= 1
                                ? selectedVenueSlotKeys
                                : [];
                          return (
                            <div key={date} className="space-y-2">
                              <p className="text-[12px] font-medium text-[#6B7280]">
                                {formatDate(date)} · remaining slots
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {venueTimedSlots.map((slot) => {
                                  const status = getVenueOnlySlotAvailability(
                                    selectedVenue,
                                    [date],
                                    slot.key,
                                    {
                                      excludeBookingId: booking.bookingId,
                                      excludeBookingRef,
                                    }
                                  );
                                  const unavailable =
                                    status === "booked" || status === "blocked";
                                  const isActive = selectedForDate.includes(slot.key);
                                  return (
                                    <MealSlotChip
                                      key={`${date}-${slot.id}`}
                                      active={isActive}
                                      status={status}
                                      label={`${slot.name} · ${slot.timeLabel} · ${formatCurrency(slot.price)}`}
                                      onClick={() => toggleVenueOnlySlot(slot.key, date)}
                                      disabled={!editable || unavailable}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          );
                        }
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
                </>
              )}
              <PayRow
                label="Food Charges"
                value={formatCurrency(displayAmounts.foodCharges)}
              />
              <PayRow
                label="Additional Services"
                value={formatCurrency(displayAmounts.addonCharges)}
              />
              <PayRow
                label="Subtotal"
                value={formatCurrency(
                  backendQuote?.subtotal ??
                    displayAmounts.venueCharges +
                      displayAmounts.foodCharges +
                      displayAmounts.addonCharges
                )}
              />
              {displayAmounts.gstAmount > 0 && (
                <PayRow
                  label={
                    (backendQuote?.gst_mode || pricing.gstMode) === "included"
                      ? `GST (${backendQuote?.gst_percent || pricing.gstPercent}% included)`
                      : `GST (${backendQuote?.gst_percent || pricing.gstPercent}%)`
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
                label={`Suggested Advance (${displayAmounts.minOnlinePercent || 0}%)`}
                value={formatCurrency(displayAmounts.minOnlineAmount)}
              />
              {editable ? (
                <div className="flex items-center justify-between gap-4 py-2.5">
                  <p className="text-sm font-bold text-[#111827]">Amount Received</p>
                  <input
                    type="number"
                    min={0}
                    max={displayAmounts.bookingAmount || undefined}
                    className="w-36 h-9 px-2 text-right text-sm font-semibold tabular-nums border-b border-[#E5E7EB] outline-none focus:border-[#C89B3C]"
                    value={form.advancePaid}
                    onChange={(e) => {
                      amountReceivedTouched.current = true;
                      onChange("advancePaid", e.target.value);
                    }}
                    placeholder={String(displayAmounts.minOnlineAmount || 0)}
                  />
                </div>
              ) : (
                <PayRow
                  label="Amount Received"
                  value={formatCurrency(displayAmounts.customerPaysNow)}
                  bold
                />
              )}
              <PayRow
                label={`Platform Commission (${displayAmounts.platformCommissionPercent}%)`}
                value={formatCurrency(displayAmounts.platformCommission)}
              />
              <p className="text-[11px] text-[#9CA3AF] pb-1 text-right">
                Commission is calculated on the amount received.
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
              {editable ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                      Payment Status
                    </span>
                    <select
                      className={inputCls}
                      value={form.paymentStatus}
                      onChange={(e) =>
                        onChange("paymentStatus", e.target.value as BookingFormValues["paymentStatus"])
                      }
                    >
                      <option value="unpaid">Pending</option>
                      <option value="partial">Partially Paid</option>
                      <option value="paid">Paid</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-[#9CA3AF]">
                      Payment Method
                    </span>
                    <select
                      className={inputCls}
                      value={form.paymentMethod}
                      onChange={(e) =>
                        onChange("paymentMethod", e.target.value as BookingFormValues["paymentMethod"])
                      }
                    >
                      <option value="">Select method</option>
                      {paymentMethodOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}
              <p className="text-[11px] text-[#9CA3AF] pt-1">
                Remaining balance is paid directly to the vendor.
              </p>
              <div className="pt-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] mb-2">
                  Payment History
                </p>
                <div className="overflow-x-auto rounded-[10px] border border-[#E8EAF0]">
                  <table className="w-full text-[12px]">
                    <thead className="bg-[#F8F9FB] text-[#9CA3AF] uppercase tracking-wide">
                      <tr>
                        {["Date", "Amount", "Method", "Reference", "Collected By", "Status"].map((h) => (
                          <th key={h} className="text-left px-3 py-2 font-semibold">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(booking.transactions || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-3 py-4 text-[#9CA3AF]">
                            {isCreate
                              ? "The amount received will be recorded when the booking is created."
                              : "No payments recorded yet."}
                          </td>
                        </tr>
                      ) : (
                        (booking.transactions || []).map((txn) => (
                          <tr key={txn.id} className="border-t border-[#E8EAF0]">
                            <td className="px-3 py-2 whitespace-nowrap">
                              {formatDate(txn.date)}
                            </td>
                            <td className="px-3 py-2 tabular-nums font-semibold">
                              {formatCurrency(txn.amount)}
                            </td>
                            <td className="px-3 py-2 capitalize">{String(txn.method || "—")}</td>
                            <td className="px-3 py-2">{txn.reference || txn.transactionId || "—"}</td>
                            <td className="px-3 py-2">{txn.collectedBy || "—"}</td>
                            <td className="px-3 py-2 capitalize">{txn.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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
                      label="Amount Paid"
                      value={formatCurrency(financeSnapshot.totalPaid)}
                    />
                    <SummaryRow
                      label="Remaining Balance"
                      value={formatCurrency(financeSnapshot.remaining)}
                      strong
                    />
                    <SummaryRow
                      label="Platform Commission"
                      value={formatCurrency(booking.platformCommission || displayAmounts.platformCommission)}
                    />
                    <SummaryRow
                      label="Vendor Receivable"
                      value={formatCurrency(booking.vendorReceivable || displayAmounts.vendorReceivable || 0)}
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
                      label="Amount Received"
                      value={formatCurrency(displayAmounts.customerPaysNow)}
                    />
                    <SummaryRow
                      label="Platform Commission"
                      value={formatCurrency(displayAmounts.platformCommission)}
                    />
                    <SummaryRow
                      label="Vendor Receivable"
                      value={formatCurrency(displayAmounts.vendorReceivable || 0)}
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
              onUpdated={onBookingUpdated}
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
          <QuickField label="Email" required>
            <input
              className={quickInputCls}
              type="email"
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
          <QuickField label="City">
            <input
              className={quickInputCls}
              value={customerDraft.city}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, city: e.target.value }))}
            />
          </QuickField>
          <QuickField label="State">
            <input
              className={quickInputCls}
              value={customerDraft.state}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, state: e.target.value }))}
            />
          </QuickField>
          <QuickField label="Country">
            <input
              className={quickInputCls}
              value={customerDraft.country}
              onChange={(e) => setCustomerDraft((p) => ({ ...p, country: e.target.value }))}
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

  const bookingTypesList =
    venue.bookingTypes && venue.bookingTypes.length > 0
      ? venue.bookingTypes
      : venue.bookingModel === "venue_food"
      ? ["venue_food"]
      : ["venue_only"];

  const bookingTypeLabel = bookingTypesList
    .map((t) => (t === "venue_food" ? "Venue + Food" : "Venue Only"))
    .join(", ");

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
      label: "Booking Type",
      value: bookingTypeLabel,
    },
    {
      label: "Default Pricing",
      value: venue.pricingMethod === "slot_based" ? "Slot Based" : "Full Day",
    },
    {
      label: "Minimum Booking Percentage",
      value: `${venue.advancePaymentPercent ?? 25}%`,
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
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D97706]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Partial
      </span>
    );
  }
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
  if (status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold border bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]">
        Partially Booked
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
