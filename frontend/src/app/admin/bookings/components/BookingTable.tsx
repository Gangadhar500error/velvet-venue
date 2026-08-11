"use client";

import { useEffect, useRef, useState } from "react";
import {
  Ban,
  CalendarDays,
  Copy,
  CreditCard,
  Eye,
  FileText,
  MoreHorizontal,
  Pencil,
  Receipt,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Booking, BookingColumnKey, BookingStatus, PaymentStatus, TableDensity } from "../types";
import { formatCurrency, formatDate, statusLabel } from "../data";
import { Button } from "../../_components/ui/Button";
import { notify } from "../../_components/ui/Toast";

interface BookingTableProps {
  bookings: Booking[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<BookingColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onEdit: (booking: Booking) => void;
  onCancelBooking: (booking: Booking) => void;
  emptyAction?: () => void;
}

export const columnLabels: Record<BookingColumnKey, string> = {
  bookingId: "Booking ID",
  customer: "Customer",
  venue: "Venue",
  business: "Business Profile",
  event: "Event",
  bookingDate: "Booking Date",
  eventDate: "Event Date",
  guests: "Guests",
  bookingAmount: "Booking Amount",
  paid: "Paid",
  pending: "Pending",
  bookingStatus: "Booking Status",
  paymentStatus: "Payment Status",
  actions: "Actions",
};

const bookingStatusStyles: Record<BookingStatus, string> = {
  draft: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
  pending: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  confirmed: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  checked_in: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  completed: "bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]",
  cancelled: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  refunded: "bg-[#FDF4FF] text-[#A21CAF] border-[#F5D0FE]",
};

const paymentStatusStyles: Record<PaymentStatus, string> = {
  unpaid: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  partial: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  paid: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  refunded: "bg-[#FDF4FF] text-[#A21CAF] border-[#F5D0FE]",
  failed: "bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]",
  cancelled: "bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]",
};

export function BookingStatusPill({ status }: { status: BookingStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap ${bookingStatusStyles[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap ${paymentStatusStyles[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

export function BookingTable({
  bookings,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  density,
  visibleColumns,
  sortKey,
  sortDir,
  onSort,
  onEdit,
  onCancelBooking,
  emptyAction,
}: BookingTableProps) {
  const router = useRouter();
  const allSelected = bookings.length > 0 && selectedIds.length === bookings.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-3.5";

  if (bookings.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <CalendarDays className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Bookings Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Reservations will appear here as soon as they are created. Adjust filters or create a booking.
        </p>
        {emptyAction && (
          <div className="mt-5">
            <Button variant="primary" onClick={emptyAction}>
              Create Booking
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="sticky top-0 z-10 bg-[#FCFCFD] border-b border-[#E8EAF0]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                  aria-label="Select all bookings"
                />
              </th>
              {visibleColumns.bookingId && (
                <SortableTh label="Booking ID" active={sortKey === "bookingId"} dir={sortDir} onClick={() => onSort("bookingId")} />
              )}
              {visibleColumns.customer && (
                <SortableTh label="Customer" active={sortKey === "customerName"} dir={sortDir} onClick={() => onSort("customerName")} />
              )}
              {visibleColumns.venue && (
                <SortableTh label="Venue" active={sortKey === "venueName"} dir={sortDir} onClick={() => onSort("venueName")} />
              )}
              {visibleColumns.business && <Th>Business Profile</Th>}
              {visibleColumns.event && <Th>Event</Th>}
              {visibleColumns.bookingDate && (
                <SortableTh label="Booking Date" active={sortKey === "bookingDate"} dir={sortDir} onClick={() => onSort("bookingDate")} />
              )}
              {visibleColumns.eventDate && (
                <SortableTh label="Event Date" active={sortKey === "eventDate"} dir={sortDir} onClick={() => onSort("eventDate")} />
              )}
              {visibleColumns.guests && (
                <SortableTh label="Guests" active={sortKey === "guestCount"} dir={sortDir} onClick={() => onSort("guestCount")} />
              )}
              {visibleColumns.bookingAmount && (
                <SortableTh label="Booking Amount" active={sortKey === "bookingAmount"} dir={sortDir} onClick={() => onSort("bookingAmount")} />
              )}
              {visibleColumns.paid && (
                <SortableTh label="Paid" active={sortKey === "paidAmount"} dir={sortDir} onClick={() => onSort("paidAmount")} />
              )}
              {visibleColumns.pending && (
                <SortableTh label="Pending" active={sortKey === "pendingAmount"} dir={sortDir} onClick={() => onSort("pendingAmount")} />
              )}
              {visibleColumns.bookingStatus && <Th>Booking Status</Th>}
              {visibleColumns.paymentStatus && <Th>Payment Status</Th>}
              {visibleColumns.actions && <Th className="text-center">Actions</Th>}
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, idx) => {
              const selected = selectedIds.includes(booking.id);
              return (
                <tr
                  key={booking.id}
                  className={`border-b border-[#F3F4F6] transition-colors hover:bg-[#FFF3EB] ${
                    selected ? "bg-[#FFF3EB]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"
                  }`}
                >
                  <td className={`px-4 ${rowPad}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(booking.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${booking.bookingId}`}
                    />
                  </td>
                  {visibleColumns.bookingId && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        type="button"
                        onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                        className="text-sm font-semibold text-[#C89B3C] hover:underline"
                      >
                        {booking.bookingId}
                      </button>
                    </td>
                  )}
                  {visibleColumns.customer && (
                    <td className={`px-4 ${rowPad}`}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111827] truncate">{booking.customerName}</p>
                        <p className="text-[12px] text-[#9CA3AF] truncate">{booking.customerPhone}</p>
                      </div>
                    </td>
                  )}
                  {visibleColumns.venue && (
                    <td className={`px-4 ${rowPad}`}>
                      <p className="text-sm font-medium text-[#111827] truncate max-w-[180px]">{booking.venueName}</p>
                      <p className="text-[12px] text-[#9CA3AF]">{booking.venueCity}</p>
                    </td>
                  )}
                  {visibleColumns.business && (
                    <td className={`px-4 ${rowPad}`}>
                      <p className="text-sm text-[#4B5563] truncate max-w-[160px]">{booking.businessName}</p>
                    </td>
                  )}
                  {visibleColumns.event && (
                    <td className={`px-4 ${rowPad}`}>
                      <p className="text-sm font-medium text-[#111827]">{booking.eventType}</p>
                      <p className="text-[12px] text-[#9CA3AF] truncate max-w-[140px]">Full Day</p>
                    </td>
                  )}
                  {visibleColumns.bookingDate && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563] whitespace-nowrap`}>{formatDate(booking.bookingDate)}</td>
                  )}
                  {visibleColumns.eventDate && (
                    <td className={`px-4 ${rowPad} text-sm font-medium text-[#111827] whitespace-nowrap`}>{formatDate(booking.eventDate)}</td>
                  )}
                  {visibleColumns.guests && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563]`}>{booking.guestCount}</td>
                  )}
                  {visibleColumns.bookingAmount && (
                    <td className={`px-4 ${rowPad} text-sm font-semibold text-[#111827] whitespace-nowrap`}>
                      {formatCurrency(booking.bookingAmount)}
                    </td>
                  )}
                  {visibleColumns.paid && (
                    <td className={`px-4 ${rowPad} text-sm font-semibold text-[#16A34A] whitespace-nowrap`}>
                      {formatCurrency(booking.paidAmount)}
                    </td>
                  )}
                  {visibleColumns.pending && (
                    <td className={`px-4 ${rowPad} text-sm font-semibold whitespace-nowrap ${booking.pendingAmount > 0 ? "text-[#D97706]" : "text-[#9CA3AF]"}`}>
                      {formatCurrency(booking.pendingAmount)}
                    </td>
                  )}
                  {visibleColumns.bookingStatus && (
                    <td className={`px-4 ${rowPad}`}>
                      <BookingStatusPill status={booking.bookingStatus} />
                    </td>
                  )}
                  {visibleColumns.paymentStatus && (
                    <td className={`px-4 ${rowPad}`}>
                      <PaymentStatusPill status={booking.paymentStatus} />
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td className={`px-4 ${rowPad}`}>
                      <RowActions
                        booking={booking}
                        onView={() => router.push(`/admin/bookings/${booking.id}`)}
                        onEdit={() => onEdit(booking)}
                        onCancel={() => onCancelBooking(booking)}
                        onDuplicate={() => router.push(`/admin/bookings/create?clone=${booking.id}`)}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({
  booking,
  onView,
  onEdit,
  onCancel,
  onDuplicate,
}: {
  booking: Booking;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDuplicate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative flex items-center justify-center gap-1" ref={ref}>
      <button type="button" onClick={onView} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FFF3EB] hover:text-[#C89B3C]" title="View">
        <Eye className="w-4 h-4" />
      </button>
      <button type="button" onClick={onEdit} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#FFF3EB] hover:text-[#C89B3C]" title="Edit">
        <Pencil className="w-4 h-4" />
      </button>
      <button type="button" onClick={() => setOpen((v) => !v)} className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6]" title="More">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 rounded-[12px] border border-[#E8EAF0] bg-white shadow-lg py-1.5">
          <MenuItem icon={Receipt} label="Invoice" onClick={() => { setOpen(false); notify.created("Invoice"); }} />
          <MenuItem icon={CreditCard} label="Payment" onClick={() => { setOpen(false); notify.saved(); }} />
          <MenuItem icon={FileText} label="Documents" onClick={() => { setOpen(false); notify.downloaded(); }} />
          <MenuItem icon={Copy} label="Duplicate Booking" onClick={() => { setOpen(false); onDuplicate(); }} />
          <div className="my-1 border-t border-[#F3F4F6]" />
          <MenuItem
            icon={Ban}
            label="Cancel Booking"
            danger
            onClick={() => {
              setOpen(false);
              onCancel();
            }}
          />
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left ${
        danger ? "text-[#DC2626] hover:bg-[#FEF2F2]" : "text-[#374151] hover:bg-[#F8F9FB]"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] ${className}`}>
      {children}
    </th>
  );
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3.5 text-left">
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] hover:text-[#111827]">
        {label}
        <span className={`text-[10px] ${active ? "text-[#C89B3C]" : "text-[#D1D5DB]"}`}>{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}
