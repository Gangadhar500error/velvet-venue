"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookingWorkspace } from "../components/BookingWorkspace";
import { blankBooking, emptyBookingForm } from "../data";
import { BookingFormValues } from "../types";
import { parseFoodSlotKeys, parseSelectedSlotKeys, resolveBookingDates } from "../pricing";
import { notify } from "../../_components/ui/Toast";
import { createBooking } from "@/lib/bookings";
import { formToBookingPayload } from "../apiMap";

function CreateBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClone = Boolean(searchParams.get("clone"));

  const fromSource = searchParams.get("from") || "";
  const fromCalendar = fromSource === "calendar";
  const fromAvailability = fromSource === "availability" || fromCalendar;
  const venueRef = searchParams.get("venueRef") || "";
  const prefillVenueId = venueRef || searchParams.get("venueId") || "";
  const prefillVenueName = searchParams.get("venueName") || "";
  const prefillBusinessId = searchParams.get("businessId") || "";
  const prefillBusinessName = searchParams.get("businessName") || "";
  const prefillDate = searchParams.get("date") || "";
  const prefillSlot = searchParams.get("slot") || "";
  const prefillSlotsRaw = searchParams.get("slots") || "";
  const prefillPricingMethod = searchParams.get("pricingMethod") || "";
  const prefillEndDate = searchParams.get("eventEndDate") || "";
  const prefillDatesRaw = searchParams.get("dates") || "";
  const prefillDateSlotsRaw = searchParams.get("dateSlots") || "";
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

  const prefillDateSlotsJson = useMemo(() => {
    if (!prefillDateSlotsRaw.trim()) return "";
    const mapped: Record<string, string[]> = {};
    for (const part of prefillDateSlotsRaw.split(";")) {
      const [date, keysRaw] = part.split(":");
      if (!date?.trim() || !keysRaw) continue;
      mapped[date.trim()] = keysRaw
        .split("|")
        .map((key) => key.trim())
        .filter(Boolean);
    }
    return Object.keys(mapped).length ? JSON.stringify(mapped) : "";
  }, [prefillDateSlotsRaw]);

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
    if (fromAvailability || prefillVenueId) {
      const startDate = prefillDates[0] || prefillDate;
      const endDate =
        prefillEndDate ||
        (prefillDates.length > 1 ? prefillDates[prefillDates.length - 1] : undefined);
      const timedKeys = prefillSlotKeys.filter((k) => k !== "full_day" && k.toLowerCase() !== "full day");
      const useSlots = prefillPricingMethod === "slot_based" && timedKeys.length > 0;
      return {
        ...emptyBookingForm,
        businessId: prefillBusinessId,
        businessName: prefillBusinessName,
        venueId: prefillVenueId,
        venueName: prefillVenueName,
        vendorId: prefillOwnerId,
        vendorName: prefillOwnerName,
        eventDate: startDate,
        eventEndDate: endDate || undefined,
        selectedDates: (prefillDates.length > 0 ? prefillDates : startDate ? [startDate] : []).join(","),
        slot: useSlots ? prefillSlot || timedKeys.join(", ") : "Full Day",
        slotKey: useSlots ? timedKeys.join(",") : "full_day",
        dateSlotsJson: prefillDateSlotsJson,
        pricingMethod: (useSlots ? "slot_based" : "full_day") as "full_day" | "slot_based",
        bookingAmount: prefillAmount || "",
        availabilityLabel: fromAvailability ? "Reserved from Availability" : "",
        bookingStatus: "pending" as const,
      };
    }
    return emptyBookingForm;
  }, [
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
    prefillDateSlotsJson,
  ]);

  const [form, setForm] = useState<BookingFormValues>(initialForm);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const patch = (partial: Partial<BookingFormValues>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  };

  const liveBooking = blankBooking({
    customerId: form.customerId,
    customerName: form.customerName,
    customerPhone: form.customerPhone,
    customerEmail: form.customerEmail,
    businessId: form.businessId,
    businessName: form.businessName,
    venueId: form.venueId,
    venueName: form.venueName,
    vendorId: form.vendorId,
    vendorName: form.vendorName,
    eventType: form.eventType,
    eventDate: form.eventDate,
    eventEndDate: form.eventEndDate || undefined,
    selectedDates: form.selectedDates || undefined,
    slot: form.slot,
    guestCount: Number(form.guestCount) || 0,
    specialRequirements: form.specialRequirements,
    bookingStatus: form.bookingStatus,
    paymentStatus: "unpaid",
  });

  const validate = () => {
    if (!form.customerId.trim()) {
      notify.validation("Please select a Customer.");
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
      const keys = parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey);
      if (!keys.length) {
        notify.validation("Please select at least one food slot.");
        return false;
      }
    } else if (form.pricingMethod === "slot_based") {
      const keys = parseSelectedSlotKeys(form.slotKey, form.slot);
      if (!keys.length) {
        notify.validation("Please select at least one slot.");
        return false;
      }
    }
    if (!form.eventType.trim()) {
      notify.validation("Please select an Event Type.");
      return false;
    }
    if (resolveBookingDates(form).length === 0) {
      notify.validation("Please select at least one booking date.");
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
    router.push("/admin/bookings");
  };

  const submit = async (status?: "draft" | "pending") => {
    if (status !== "draft" && !validate()) return;
    if (!form.venueId) {
      notify.validation("Please select a Venue.");
      return;
    }
    setSaving(true);
    try {
      const payload = formToBookingPayload(form);
      if (status) payload.booking_status = status;
      const created = await createBooking(payload);
      notify.created("Booking");
      if (fromCalendar && venueRef) {
        router.push(`/admin/calendar?venue=${venueRef}&booked=1`);
        return;
      }
      if (fromAvailability && venueRef) {
        router.push(`/admin/venues/${venueRef}?tab=availability&booked=1`);
        return;
      }
      router.push(`/admin/bookings/${created.booking.id}`);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : "Unable to create booking.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <BookingWorkspace
      booking={liveBooking}
      mode="create"
      form={form}
      onChange={update}
      onPatch={patch}
      onCancel={handleCancel}
      onSave={() => submit("pending")}
      onSaveDraft={() => submit("draft")}
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
