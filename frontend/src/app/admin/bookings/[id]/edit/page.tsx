"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { bookingToFormValues, computePending } from "../../data";
import { BookingWorkspace } from "../../components/BookingWorkspace";
import { BookingFormValues } from "../../types";
import {
  calculateBookingPricing,
  getVenueOnlySlotAvailability,
  validateMealSelections,
  mealLinesToBookingMeals,
  parseFoodSlotKeys,
  formatSelectedMealsLabel,
} from "../../pricing";
import { Button } from "../../../_components/ui/Button";
import { PageHeader } from "../../../_components/ui/PageHeader";
import { notify } from "../../../_components/ui/Toast";
import { useDemoStore } from "../../../store/demoStore";
import { fetchBooking, mapBookingDetail } from "@/lib/bookings";
import type { Booking } from "../../types";

export default function EditBookingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const storeBooking = useDemoStore((s) => s.bookings.find((b) => b.id === id || b.bookingId === id));
  const updateBooking = useDemoStore((s) => s.updateBooking);
  const venues = useDemoStore((s) => s.venues);
  const [booking, setBooking] = useState<Booking | null>(storeBooking || null);
  const [form, setForm] = useState<BookingFormValues | null>(() =>
    storeBooking ? bookingToFormValues(storeBooking) : null
  );
  const [loading, setLoading] = useState(!storeBooking);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchBooking(id);
        if (cancelled) return;
        const mapped = mapBookingDetail(detail);
        setBooking(mapped);
        setForm(bookingToFormValues(mapped));
      } catch {
        if (!cancelled && !storeBooking) setBooking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Keep payment status pills in sync after Record Payment updates the store
  useEffect(() => {
    if (!booking || !form) return;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            paymentStatus: booking.paymentStatus,
            bookingStatus: booking.bookingStatus,
            advancePaid: String(booking.advancePaid || prev.advancePaid || ""),
          }
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.paidAmount, booking?.paymentStatus, booking?.bookingStatus, booking?.pendingAmount]);

  if (loading) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Loading Booking"
          subtitle="Fetching reservation details."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Booking Management" },
            { label: "Bookings", href: "/admin/bookings" },
            { label: "Edit" },
          ]}
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center text-sm text-[#6B7280]">
          Loading booking…
        </div>
      </div>
    );
  }

  if (!booking || !form) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Booking Not Found"
          subtitle="Unable to edit a missing reservation."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Booking Management" },
            { label: "Bookings", href: "/admin/bookings" },
            { label: "Edit" },
          ]}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/admin/bookings")}>
              Back to Bookings
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EBEF] rounded-[18px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No booking exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link href="/admin/bookings" className="text-sm font-medium text-[#C89B3C] hover:underline">
            Return to bookings list
          </Link>
        </div>
      </div>
    );
  }

  const update = <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const patch = (partial: Partial<BookingFormValues>) => {
    setForm((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  const venue = venues.find((v) => v.venueId === form.venueId);
  const pricing = calculateBookingPricing(venue, form);
  const amount = pricing.bookingAmount || Number(form.bookingAmount) || 0;
  const advance = Number(form.advancePaid) || 0;

  const liveBooking = {
    ...booking,
    customerId: form.customerId || booking.customerId,
    customerName: form.customerName || booking.customerName,
    customerPhone: form.customerPhone || booking.customerPhone,
    customerEmail: form.customerEmail || booking.customerEmail,
    businessId: form.businessId || booking.businessId,
    businessName: form.businessName || booking.businessName,
    venueId: form.venueId || booking.venueId,
    venueName: form.venueName || booking.venueName,
    venueCity: venue?.city || booking.venueCity,
    vendorId: form.vendorId || booking.vendorId,
    vendorName: form.vendorName || booking.vendorName,
    eventType: form.eventType || booking.eventType,
    eventDate: form.eventDate || booking.eventDate,
    eventEndDate: form.eventEndDate || booking.eventEndDate,
    selectedDates: form.selectedDates || booking.selectedDates,
    slot:
      form.bookingType === "venue_food"
        ? formatSelectedMealsLabel(
            venue,
            parseFoodSlotKeys(form.foodSlotKeys, form.foodSlotKey)
          ) || form.slot || booking.slot
        : form.slot || booking.slot,
    guestCount:
      form.bookingType === "venue_food" && pricing.mealLines.length > 0
        ? Math.max(...pricing.mealLines.map((m) => m.totalGuests))
        : Number(form.guestCount) || booking.guestCount,
    meals:
      form.bookingType === "venue_food" && pricing.mealLines.length > 0
        ? mealLinesToBookingMeals(pricing.mealLines)
        : booking.meals,
    specialRequirements: form.specialRequirements,
    bookingAmount: amount || booking.bookingAmount,
    // Preserve installment ledger from store — do not overwrite with form advance
    advancePaid: booking.advancePaid || advance,
    paidAmount: booking.paidAmount,
    pendingAmount: computePending(
      amount || booking.bookingAmount,
      booking.paidAmount
    ),
    taxAmount: pricing.gstAmount || Number(form.taxAmount) || booking.taxAmount,
    discountAmount: Number(form.discountAmount) || booking.discountAmount,
    addons: pricing.selectedAddons.length ? pricing.selectedAddons : booking.addons,
    bookingStatus: form.bookingStatus,
    paymentStatus: booking.paymentStatus,
    paymentMethod: form.paymentMethod || booking.paymentMethod,
    assignedExecutive: form.assignedExecutive,
    notes: form.notes,
    transactions: booking.transactions,
    invoices: booking.invoices,
    timeline: booking.timeline,
  };

  const handleCancel = () => router.push(`/admin/bookings/${booking.id}`);

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.venueId.trim()) {
      notify.validation("Please fill in all required fields.");
      return;
    }
    if (!form.eventDate.trim()) {
      notify.validation("Please select a Booking Date.");
      return;
    }
    if (form.bookingType === "venue_food") {
      const split = validateMealSelections(form, venue);
      if (!split.valid) {
        notify.validation(split.message || "Please enter valid meal selections.");
        return;
      }
    } else if (form.pricingMethod === "slot_based") {
      const keys = (form.slotKey || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!keys.length) {
        notify.validation("Please select at least one slot.");
        return;
      }
    }
    const slotKeysToValidate =
      form.pricingMethod === "slot_based"
        ? (form.slotKey || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["full_day"];
    for (const key of slotKeysToValidate) {
      const avail = getVenueOnlySlotAvailability(venue, [form.eventDate], key, {
        excludeBookingId: booking.bookingId,
        excludeBookingRef: booking.id,
      });
      if (avail === "blocked") {
        notify.validation(`Slot ${key} is blocked and cannot be booked.`);
        return;
      }
      if (avail === "booked") {
        notify.validation(`Slot ${key} is already booked.`);
        return;
      }
    }

    if (advance < 0) {
      notify.validation("Advance payment cannot be negative.");
      return;
    }
    if (amount > 0 && advance > amount) {
      notify.validation("Advance payment cannot exceed the booking amount.");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    updateBooking(booking.id, {
      ...liveBooking,
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    notify.updated("Booking");
    notify.relatedUpdated();
    router.push(`/admin/bookings/${booking.id}`);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    updateBooking(booking.id, {
      ...liveBooking,
      bookingStatus: "draft",
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    notify.saved();
    router.push(`/admin/bookings/${booking.id}`);
  };

  return (
    <BookingWorkspace
      booking={liveBooking}
      mode="edit"
      form={form}
      onChange={update}
      onPatch={patch}
      onCancel={handleCancel}
      onSave={handleSave}
      onSaveDraft={handleSaveDraft}
      onBookingUpdated={(next) => {
        setBooking(next);
        setForm((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: next.paymentStatus,
                bookingStatus: next.bookingStatus,
                advancePaid: String(next.paidAmount || next.advancePaid || prev.advancePaid || ""),
              }
            : prev
        );
      }}
      saving={saving}
    />
  );
}
