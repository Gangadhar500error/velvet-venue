"use client";

import { Building2, CalendarDays, Copy, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { Booking, BookingFormValues } from "../types";
import { bookingToFormValues, formatDate, formatDateTime } from "../data";
import { BookingStatusPill, PaymentStatusPill } from "./BookingTable";
import { BookingFormFlow } from "./BookingFormFlow";

interface BookingWorkspaceProps {
  booking: Booking;
  mode: "view" | "edit" | "create";
  form?: BookingFormValues;
  onChange?: <K extends keyof BookingFormValues>(key: K, value: BookingFormValues[K]) => void;
  onPatch?: (patch: Partial<BookingFormValues>) => void;
  onEdit?: () => void;
  onCancel?: () => void;
  onSave?: () => void;
  onSaveDraft?: () => void;
  onDelete?: () => void;
  saving?: boolean;
  pageLabel?: string;
  availabilityContext?: {
    businessName: string;
    venueName: string;
    date: string;
    endDate?: string;
    dates?: string[];
    slot: string;
    locked?: boolean;
    onChangeSlot?: () => void;
  };
}

const sectionCls =
  "bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden";

const noopChange = <K extends keyof BookingFormValues>(_key: K, _value: BookingFormValues[K]) => {};
const noopPatch = (_patch: Partial<BookingFormValues>) => {};

export function BookingWorkspace({
  booking,
  mode,
  form,
  onChange,
  onPatch,
  onEdit,
  onCancel,
  onSave,
  onSaveDraft,
  onDelete,
  saving,
  pageLabel,
  availabilityContext,
}: BookingWorkspaceProps) {
  const router = useRouter();
  const isCreate = mode === "create";
  const editable = mode === "edit" || mode === "create";
  const displayForm = form ?? bookingToFormValues(booking);
  const crumbLabel =
    pageLabel ||
    (isCreate ? "Create Booking" : booking.bookingId) ||
    displayForm.customerName ||
    "Booking";

  const customerName = displayForm.customerName || booking.customerName;
  const venueName = displayForm.venueName || booking.venueName;
  const phone = displayForm.customerPhone || booking.customerPhone;
  const bookingStatus = displayForm.bookingStatus || booking.bookingStatus;
  // Payment status always follows the installment ledger on the booking record
  const paymentStatus = booking.paymentStatus || displayForm.paymentStatus;

  const initials =
    (customerName || "BK")
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "BK";

  return (
    <div className="flex flex-col gap-3 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Booking Management" },
          { label: "Bookings", href: "/admin/bookings" },
          { label: crumbLabel },
        ]}
      />

      <div className="space-y-3">
        <div
          className={`${sectionCls} px-4 md:px-5 flex flex-wrap items-center justify-between gap-3`}
        >
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 -mb-px border-[#C89B3C] text-[#C89B3C]"
            >
              <CalendarDays className="w-4 h-4" />
              {isCreate ? "New Booking" : mode === "edit" ? "Edit Booking" : "Overview"}
            </button>
          </div>

          {mode === "view" && (
            <div className="flex flex-wrap items-center gap-2 py-2.5">
              <Button variant="primary" size="sm" icon={Pencil} onClick={onEdit}>
                Edit
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={onDelete}
                className="!text-[#DC2626] !border-[#FECACA] hover:!bg-[#FEF2F2]"
              >
                Delete
              </Button>
              <span className="hidden sm:block w-px h-6 bg-[#E8EBEF] mx-0.5" aria-hidden />
              <Button
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={() => router.push("/admin/bookings/create")}
              >
                Add
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={Copy}
                onClick={() => router.push(`/admin/bookings/create?clone=${booking.id}`)}
              >
                Clone
              </Button>
            </div>
          )}
        </div>

        {/* Date created / last updated strip — all modes */}
        <div className="bg-white border border-[#E8EBEF] rounded-[18px] px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[13px] text-[#6B7280]">
            <span>
              Date Created{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(booking.createdAt)}
              </span>
            </span>
            <span className="hidden sm:inline text-[#E8EBEF]">|</span>
            <span>
              Last Updated{" "}
              <span className="font-semibold text-[#111827]">
                {isCreate ? "—" : formatDateTime(booking.updatedAt)}
              </span>
            </span>
          </div>
        </div>

        {/* Identity header — all modes */}
        <div className="bg-white border border-[#E8EBEF] rounded-[18px] px-4 md:px-5 py-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-[12px] bg-[#F3F4F6] text-[#6B7280] text-lg font-semibold flex items-center justify-center shrink-0 border border-[#E8EBEF]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-[#111827] truncate">
                {isCreate
                  ? customerName || "New Booking"
                  : booking.bookingId || customerName || "—"}
              </h1>
              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#6B7280]">
                {!isCreate && customerName && (
                  <span>
                    Customer:{" "}
                    <span className="font-medium text-[#374151]">{customerName}</span>
                  </span>
                )}
                {isCreate && (
                  <span>
                    ID: <span className="font-medium text-[#374151]">Auto-generated</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {venueName || "—"}
                </span>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-[#4B5563]">
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  {phone || "—"}
                </span>
                <BookingStatusPill status={bookingStatus} />
                <PaymentStatusPill status={paymentStatus} />
              </div>
            </div>
          </div>
        </div>

        {availabilityContext && (
          <div className="rounded-[18px] border border-[#FFD4B0]/70 bg-white px-4 md:px-5 py-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2410C]">
                  Prefill from Availability
                </p>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Business</p>
                    <p className="font-semibold text-[#111827]">
                      {availabilityContext.businessName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Venue</p>
                    <p className="font-semibold text-[#111827]">
                      {availabilityContext.venueName || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">
                      {availabilityContext.dates && availabilityContext.dates.length > 1
                        ? "Dates"
                        : "Date"}
                    </p>
                    <p className="font-semibold text-[#111827]">
                      {availabilityContext.dates && availabilityContext.dates.length > 1
                        ? `${availabilityContext.dates.length} days · ${formatDate(availabilityContext.dates[0])} – ${formatDate(availabilityContext.dates[availabilityContext.dates.length - 1])}`
                        : availabilityContext.date
                          ? formatDate(availabilityContext.date)
                          : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] text-[#9CA3AF]">Booking Type</p>
                    <p className="font-semibold text-[#111827]">
                      Full Day
                    </p>
                  </div>
                </div>
              </div>
              {availabilityContext.locked && availabilityContext.onChangeSlot && (
                <Button variant="secondary" size="sm" onClick={availabilityContext.onChangeSlot}>
                  Change Venue / Date
                </Button>
              )}
            </div>
          </div>
        )}

        <BookingFormFlow
          booking={booking}
          form={displayForm}
          onChange={editable && onChange ? onChange : noopChange}
          onPatch={editable && onPatch ? onPatch : noopPatch}
          mode={mode}
          editable={editable && !!onChange && !!onPatch}
          isCreate={isCreate}
          saving={saving}
          onCancel={onCancel}
          onSave={onSave}
          onSaveDraft={onSaveDraft}
        />
      </div>
    </div>
  );
}
