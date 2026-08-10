"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingWorkspace } from "../components/BookingWorkspace";
import {
  blankBooking,
  bookingToFormValues,
  computePending,
  emptyBookingForm,
} from "../data";
import { BookingFormValues } from "../types";
import {
  calculateBookingPricing,
  getVenueOnlySlotAvailability,
  resolveBookingDates,
  validateMealSelections,
  mealLinesToBookingMeals,
  parseFoodSlotKeys,
  formatSelectedMealsLabel,
} from "../pricing";
import { confirmAction, notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

function CreateBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cloneId = searchParams.get("clone");
  const addBooking = useDemoStore((s) => s.addBooking);
  const nextBookingIds = useDemoStore((s) => s.nextBookingIds);
  const markSlotBooked = useDemoStore((s) => s.markSlotBooked);
  const getBookingById = useDemoStore((s) => s.getBookingById);
  const venues = useDemoStore((s) => s.venues);
  const source = cloneId ? getBookingById(cloneId) : undefined;
  const isClone = Boolean(source);

  const fromSource = searchParams.get("from") || "";
  const fromCalendar = fromSource === "calendar";
  const fromAvailability = fromSource === "availability" || fromCalendar;
  const venueRef = searchParams.get("venueRef") || "";
  const prefillVenueId = searchParams.get("venueId") || "";
  const prefillVenueName = searchParams.get("venueName") || "";
  const prefillBusinessId = searchParams.get("businessId") || "";
  const prefillBusinessName = searchParams.get("businessName") || "";
  const prefillDate = searchParams.get("date") || "";
  const prefillSlot = searchParams.get("slot") || "";
  const prefillSlotsRaw = searchParams.get("slots") || "";
  const prefillPricingMethod = searchParams.get("pricingMethod") || "";
  const prefillEndDate = searchParams.get("eventEndDate") || "";
  const prefillDatesRaw = searchParams.get("dates") || "";
  const prefillAmount = searchParams.get("amount") || "";
  const prefillOwnerId = searchParams.get("ownerId") || "";
  const prefillOwnerName = searchParams.get("ownerName") || "";

  const prefillDates = useMemo(
    () =>
      prefillDatesRaw
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
        .sort(),
    [prefillDatesRaw]
  );

  const prefillSlotKeys = useMemo(() => {
    const fromSlots = prefillSlotsRaw
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    if (fromSlots.length) return fromSlots;
    if (prefillSlot && prefillSlot !== "Full Day") {
      return prefillSlot
        .split(",")
        .map((s) => s.trim().toLowerCase().replace(/\s+/g, "_"))
        .filter(Boolean);
    }
    return [] as string[];
  }, [prefillSlotsRaw, prefillSlot]);

  const initialForm = useMemo(() => {
    if (source) {
      const cloned = bookingToFormValues(source);
      return {
        ...cloned,
        bookingStatus: "draft" as const,
        paymentStatus: "unpaid" as const,
        advancePaid: "",
        transactionReference: "",
      };
    }
    if (fromAvailability) {
      const matched = venues.find((v) => v.venueId === prefillVenueId || v.id === venueRef);
      const startDate = prefillDates[0] || prefillDate;
      const endDate =
        prefillEndDate ||
        (prefillDates.length > 1 ? prefillDates[prefillDates.length - 1] : undefined);
      const hours = matched?.operatingHours || searchParams.get("hours") || "9 AM – 11 PM";
      const timeParts = hours.split(/\s*[–—-]\s*/);

      const methodFromParam =
        prefillPricingMethod === "slot_based"
          ? "slot_based"
          : prefillPricingMethod === "full_day"
            ? "full_day"
            : matched?.pricingMethod === "slot_based"
              ? "slot_based"
              : "full_day";

      const timedKeys = prefillSlotKeys.filter((k) => k !== "full_day" && k.toLowerCase() !== "full day");
      const useSlots = methodFromParam === "slot_based" && timedKeys.length > 0;

      let slotKey = "full_day";
      let slotLabel = "Full Day";
      let startTime = timeParts[0]?.trim() || "9 AM";
      let endTime = timeParts[1]?.trim() || "11 PM";

      if (useSlots && matched?.pricingSlots?.length) {
        const matchedSlots = timedKeys
          .map((k) =>
            matched.pricingSlots.find(
              (s) => s.key === k || s.key === k.toLowerCase() || s.name.toLowerCase() === k.replace(/_/g, " ")
            )
          )
          .filter(Boolean) as typeof matched.pricingSlots;
        if (matchedSlots.length) {
          slotKey = matchedSlots.map((s) => s.key).join(",");
          slotLabel = matchedSlots.map((s) => s.name).join(", ");
          const firstParts = (matchedSlots[0].timeLabel || "").split(/\s*[–—-]\s*/);
          const lastParts = (matchedSlots[matchedSlots.length - 1].timeLabel || "").split(
            /\s*[–—-]\s*/
          );
          startTime = firstParts[0]?.trim() || startTime;
          endTime = lastParts[1]?.trim() || lastParts[0]?.trim() || endTime;
        } else {
          slotKey = timedKeys.join(",");
          slotLabel = prefillSlot || timedKeys.join(", ");
        }
      }

      return {
        ...emptyBookingForm,
        businessId: prefillBusinessId || matched?.businessId || "",
        businessName: prefillBusinessName || matched?.businessName || "",
        venueId: prefillVenueId || matched?.venueId || "",
        venueName: prefillVenueName || matched?.name || "",
        vendorId: prefillOwnerId || matched?.ownerId || "",
        vendorName: prefillOwnerName || matched?.ownerName || "",
        eventDate: startDate,
        eventEndDate: endDate || undefined,
        selectedDates: (prefillDates.length > 0
          ? prefillDates
          : startDate
            ? [startDate]
            : []
        ).join(","),
        slot: slotLabel,
        slotKey,
        pricingMethod: (useSlots ? "slot_based" : "full_day") as "full_day" | "slot_based",
        foodSlotKey: "",
        foodSlotKeys: "",
        mealGuestsJson: "",
        startTime,
        endTime,
        bookingAmount: prefillAmount || "",
        bookingType: (matched?.bookingModel || "venue_only") as "venue_only" | "venue_food",
        availabilityLabel: "Reserved from Availability",
        bookingStatus: "confirmed" as const,
      };
    }
    return emptyBookingForm;
  }, [
    source,
    fromAvailability,
    prefillBusinessId,
    prefillBusinessName,
    prefillVenueId,
    prefillVenueName,
    prefillDate,
    prefillEndDate,
    prefillDates,
    prefillAmount,
    prefillOwnerId,
    prefillOwnerName,
    prefillSlot,
    prefillSlotKeys,
    prefillPricingMethod,
    venueRef,
    venues,
    searchParams,
  ]);

  const [form, setForm] = useState<BookingFormValues>(initialForm);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const patch = (partial: Partial<BookingFormValues>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const selectedVenue = venues.find((v) => v.venueId === form.venueId || v.id === venueRef);
  const pricing = calculateBookingPricing(selectedVenue, form);

  const buildBooking = (ids?: { id: string; bookingId: string }) => {
    const amount = pricing.bookingAmount || Number(form.bookingAmount) || 0;
    const advance = Number(form.advancePaid) || 0;
    const now = new Date().toISOString();
    const hasAdvance = advance > 0;
    const mealGuestMax =
      pricing.mealLines.length > 0
        ? Math.max(...pricing.mealLines.map((m) => m.totalGuests))
        : 0;

    return blankBooking({
      ...(ids || {}),
      customerId: form.customerId || "CUST-NEW",
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      customerEmail: form.customerEmail,
      customerCity: selectedVenue?.city || "",
      businessId: form.businessId,
      businessName: form.businessName,
      venueId: form.venueId,
      venueName: form.venueName,
      venueCity: selectedVenue?.city || "",
      vendorId: form.vendorId,
      vendorName: form.vendorName,
      eventType: form.eventType,
      eventDate: form.eventDate,
      eventEndDate: form.eventEndDate || undefined,
      selectedDates: form.selectedDates || undefined,
      bookingDate: now.slice(0, 10),
      slot:
        form.bookingType === "venue_food"
          ? formatSelectedMealsLabel(
              selectedVenue,
              parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey)
            ) || form.slot
          : form.slot,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      guestCount:
        form.bookingType === "venue_food"
          ? mealGuestMax
          : Number(form.guestCount) || 0,
      meals:
        form.bookingType === "venue_food" && pricing.mealLines.length > 0
          ? mealLinesToBookingMeals(pricing.mealLines)
          : undefined,
      specialRequirements: form.specialRequirements,
      bookingAmount: amount,
      advancePaid: advance,
      paidAmount: advance,
      pendingAmount: computePending(amount, advance),
      taxAmount: pricing.gstAmount || Number(form.taxAmount) || 0,
      discountAmount: Number(form.discountAmount) || 0,
      addons: pricing.selectedAddons.length
        ? pricing.selectedAddons
        : [],
      bookingStatus: hasAdvance
        ? "confirmed"
        : form.bookingStatus === "draft"
          ? "draft"
          : "pending",
      paymentStatus: hasAdvance
        ? advance >= amount
          ? "paid"
          : "partial"
        : "unpaid",
      paymentMethod: form.paymentMethod || "upi",
      assignedExecutive: form.assignedExecutive,
      notes: form.notes,
      createdAt: now,
      updatedAt: now,
      timeline: [
        {
          id: "tl-new",
          type: "created",
          title: "Booking Created",
          description: fromAvailability
            ? "Reservation created from venue availability."
            : "Reservation created from admin booking desk.",
          date: now,
          actor: "Admin",
        },
      ],
    });
  };

  const liveBooking = buildBooking();

  const validate = () => {
    if (!form.customerName.trim() && !form.customerId.trim()) {
      notify.validation("Please select a Customer.");
      return false;
    }
    if (!form.customerName.trim()) {
      notify.validation("Please fill in all required fields.");
      return false;
    }
    if (!form.businessId.trim()) {
      notify.validation("Please select a Business.");
      return false;
    }
    if (!form.venueId.trim()) {
      notify.validation("Please select a Venue.");
      return false;
    }
    if (!form.eventDate.trim()) {
      notify.validation("Please select a Booking Date.");
      return false;
    }
    if (form.bookingType === "venue_food") {
      const split = validateMealSelections(form, selectedVenue);
      if (!split.valid) {
        notify.validation(split.message || "Please enter valid meal selections.");
        return false;
      }
    } else if (form.pricingMethod === "slot_based") {
      const keys = (form.slotKey || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!keys.length) {
        notify.validation("Please select at least one slot.");
        return false;
      }
    }
    if (!form.eventType.trim()) {
      notify.validation("Please select an Event Type.");
      return false;
    }

    const bookingDates = resolveBookingDates(form);
    if (bookingDates.length === 0) {
      notify.validation("Please select at least one booking date.");
      return false;
    }

    const slotKeysToValidate =
      form.bookingType === "venue_only" && form.pricingMethod === "slot_based"
        ? (form.slotKey || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["full_day"];

    for (const date of bookingDates) {
      for (const key of slotKeysToValidate) {
        const avail = getVenueOnlySlotAvailability(selectedVenue, [date], key);
        if (avail === "booked" || avail === "blocked") {
          notify.validation(
            avail === "booked"
              ? `Slot ${key} on ${date} is already booked and cannot be included.`
              : `Slot ${key} on ${date} is blocked and cannot be booked.`
          );
          return false;
        }
      }
    }

    if (!pricing.bookingAmount) {
      notify.validation("Unable to calculate booking amount from venue pricing.");
      return false;
    }

    const advance = Number(form.advancePaid) || 0;
    if (advance < 0) {
      notify.validation("Advance payment cannot be negative.");
      return false;
    }
    if (advance > pricing.bookingAmount) {
      notify.validation("Advance payment cannot exceed the booking amount.");
      return false;
    }

    return true;
  };

  const handleCancel = () => {
    if (fromCalendar && venueRef) {
      router.push(`/admin/calendar?venue=${venueRef}`);
      return;
    }
    if (fromAvailability && venueRef) {
      router.push(`/admin/venues/${venueRef}?tab=availability`);
      return;
    }
    if (source) router.push(`/admin/bookings/${source.id}`);
    else router.push("/admin/bookings");
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const created = buildBooking(nextBookingIds());
    addBooking(created);

    const keysToBook =
      form.bookingType === "venue_food"
        ? parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey)
        : form.slotKey && form.pricingMethod === "slot_based"
          ? form.slotKey.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Full Day"];

    if (fromAvailability && venueRef) {
      let ok = true;
      const datesToMark =
        resolveBookingDates(form).length > 0
          ? resolveBookingDates(form)
          : prefillDates.length > 0
            ? prefillDates
            : [form.eventDate || prefillDate];
      for (const date of datesToMark) {
        for (const slot of keysToBook) {
          const marked = markSlotBooked({
            venueId: venueRef,
            date,
            slot,
            bookingId: created.bookingId,
            bookingRef: created.id,
            customerName: created.customerName,
            eventType: created.eventType,
            guests: created.guestCount,
          });
          if (!marked && slot === keysToBook[0] && date === datesToMark[0]) ok = false;
        }
      }
      setSaving(false);
      if (!ok) {
        notify.validation("This slot is already booked.");
        return;
      }
      notify.created("Booking");
      notify.relatedUpdated();
      if (fromCalendar && venueRef) {
        router.push(`/admin/calendar?venue=${venueRef}&booked=1`);
        return;
      }
      router.push(`/admin/venues/${venueRef}?tab=availability&booked=1`);
      return;
    }

    // Also mark availability for regular creates against the selected venue
    if (created.venueId) {
      const datesToMark = resolveBookingDates({
        eventDate: created.eventDate,
        eventEndDate: created.eventEndDate,
        selectedDates: created.selectedDates,
      });
      for (const date of datesToMark) {
        for (const slot of keysToBook) {
          markSlotBooked({
            venueId: created.venueId,
            date,
            slot,
            bookingId: created.bookingId,
            bookingRef: created.id,
            customerName: created.customerName,
            eventType: created.eventType,
            guests: created.guestCount,
          });
        }
      }
    }

    setSaving(false);
    notify.created("Booking");
    notify.relatedUpdated();
    router.push(`/admin/bookings/${created.id}`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    const drafted = {
      ...buildBooking(nextBookingIds()),
      bookingStatus: "draft" as const,
    };
    addBooking(drafted);
    setSaving(false);
    notify.saved();
    if (fromCalendar && venueRef) {
      router.push(`/admin/calendar?venue=${venueRef}`);
      return;
    }
    if (fromAvailability && venueRef) {
      router.push(`/admin/venues/${venueRef}?tab=availability`);
      return;
    }
    router.push(`/admin/bookings/${drafted.id}`);
  };

  return (
    <BookingWorkspace
      booking={liveBooking}
      mode="create"
      form={form}
      onChange={update}
      onPatch={patch}
      onCancel={handleCancel}
      onSave={handleCreate}
      onSaveDraft={handleSaveDraft}
      saving={saving}
      pageLabel={isClone ? "Duplicate Booking" : "Create Booking"}
      availabilityContext={
        fromAvailability
          ? {
              businessName: form.businessName || prefillBusinessName,
              venueName: form.venueName || prefillVenueName,
              date: form.eventDate || prefillDate,
              endDate: form.eventEndDate || undefined,
              dates: resolveBookingDates(form),
              slot: form.slot || prefillSlot || "Full Day",
              locked: false,
            }
          : undefined
      }
    />
  );
}

export default function CreateBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white border border-[#E8EBEF] rounded-[18px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-24 bg-[#F3F4F6] rounded-lg" />
        </div>
      }
    >
      <CreateBookingContent />
    </Suspense>
  );
}
