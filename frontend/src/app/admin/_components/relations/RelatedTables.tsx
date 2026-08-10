"use client";

import type { ComponentType, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/Button";
import { BookingStatusPill, PaymentStatusPill } from "../../bookings/components/BookingTable";
import { formatCurrency, formatDate } from "../../bookings/data";
import type { Booking } from "../../bookings/types";
import type { BusinessProfile } from "../../business-profile/types";
import type { Venue } from "../../venues/types";
import { EntityLink, entityHref } from "./EntityLink";
import {
  paymentMethodLabel,
  paymentTypeLabel,
  type RelatedInvoiceRow,
  type RelatedPaymentRow,
} from "./queries";

export function RelationCard({
  icon: Icon,
  title,
  subtitle,
  children,
  actions,
  defaultOpen = true,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
        >
          <Icon className="w-4 h-4 text-[#C89B3C] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
              {title}
            </p>
            {subtitle && (
              <p className="text-[12px] text-[#9CA3AF] normal-case tracking-normal">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#9CA3AF] shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      {open && <div className="px-4 md:px-5 py-4">{children}</div>}
    </section>
  );
}

export function RelationEmpty({
  icon: Icon,
  text,
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm text-[#6B7280]">{text}</p>
    </div>
  );
}

export function RelationKpiGrid({
  items,
}: {
  items: { label: string; value: string | number }[];
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-3 py-2.5"
        >
          <p className="text-[11px] uppercase tracking-wide text-[#9CA3AF] font-semibold">
            {item.label}
          </p>
          <p className="text-base font-semibold text-[#111827] mt-0.5 tabular-nums">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function InvoiceStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    pending: "bg-[#FCFAF8] text-[#B8862B] border-[#FED7AA]",
    cancelled: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
    generated: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    sent: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${
        map[status] || "bg-[#F8FAFC] text-[#64748B] border-[#E8EAF0]"
      }`}
    >
      {String(status).replace(/_/g, " ")}
    </span>
  );
}

export function RelatedBookingsTable({
  bookings,
  showCustomer = false,
  emptyText = "No Bookings Found",
}: {
  bookings: Booking[];
  showCustomer?: boolean;
  emptyText?: string;
}) {
  const router = useRouter();
  if (bookings.length === 0) {
    return <RelationEmpty icon={CalendarIcon} text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {[
              "Booking ID",
              ...(showCustomer ? ["Customer"] : []),
              "Venue",
              "Business Profile",
              "Venue Owner",
              "Booking Type",
              "Event",
              "Booking Date",
              "Event Date",
              "Guests",
              "Booking Amount",
              "Paid Amount",
              "Remaining Balance",
              "Payment Status",
              "Booking Status",
              "Action",
            ].map((h) => (
              <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.booking(b.id)}>{b.bookingId}</EntityLink>
              </td>
              {showCustomer && (
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  <EntityLink href={entityHref.customer(b.customerId)}>
                    {b.customerName}
                  </EntityLink>
                </td>
              )}
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.venue(b.venueId)}>{b.venueName}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.business(b.businessId)}>
                  {b.businessName}
                </EntityLink>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                {b.vendorId ? (
                  <EntityLink href={entityHref.owner(b.vendorId)}>
                    {b.vendorName || "—"}
                  </EntityLink>
                ) : (
                  <span className="text-[#4B5563]">{b.vendorName || "—"}</span>
                )}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563] whitespace-nowrap">—</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{b.eventType}</td>
              <td className="py-2.5 pr-3 text-[#4B5563] whitespace-nowrap">
                {formatDate(b.bookingDate)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563] whitespace-nowrap">
                {formatDate(b.eventDate)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{b.guestCount || "—"}</td>
              <td className="py-2.5 pr-3 font-semibold tabular-nums whitespace-nowrap">
                {formatCurrency(b.bookingAmount)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                {formatCurrency(b.paidAmount)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                {formatCurrency(b.pendingAmount)}
              </td>
              <td className="py-2.5 pr-3">
                <PaymentStatusPill status={b.paymentStatus} />
              </td>
              <td className="py-2.5 pr-3">
                <BookingStatusPill status={b.bookingStatus} />
              </td>
              <td className="py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => router.push(entityHref.booking(b.id))}
                  className="text-[#C89B3C] hover:underline font-medium"
                >
                  View Booking
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RelatedInvoicesTable({
  rows,
  emptyText = "No Invoices Generated",
}: {
  rows: RelatedInvoiceRow[];
  emptyText?: string;
}) {
  const router = useRouter();
  if (rows.length === 0) {
    return <RelationEmpty icon={FileIcon} text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {[
              "Invoice No",
              "Booking ID",
              "Venue",
              "Invoice Date",
              "Payment Type",
              "Payment Method",
              "Invoice Amount",
              "Amount Paid",
              "Remaining Balance",
              "Invoice Status",
              "Payment Status",
              "Action",
            ].map((h) => (
              <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((inv) => (
            <tr key={`${inv.bookingRef}-${inv.id}`} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.invoice(inv.invoiceNo)}>
                  {inv.invoiceNo}
                </EntityLink>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.booking(inv.bookingRef)}>
                  {inv.bookingId}
                </EntityLink>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.venue(inv.venueId)}>{inv.venueName}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563] whitespace-nowrap">
                {formatDate(inv.invoiceDate)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">
                {paymentTypeLabel(inv.paymentType)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">
                {paymentMethodLabel(String(inv.paymentMethod || ""))}
              </td>
              <td className="py-2.5 pr-3 font-semibold tabular-nums whitespace-nowrap">
                {formatCurrency(inv.invoiceAmount)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                {formatCurrency(inv.amountPaid)}
              </td>
              <td className="py-2.5 pr-3 tabular-nums whitespace-nowrap">
                {formatCurrency(inv.remainingBalance)}
              </td>
              <td className="py-2.5 pr-3">
                <InvoiceStatusPill status={inv.status} />
              </td>
              <td className="py-2.5 pr-3">
                <PaymentStatusPill status={inv.paymentStatus as never} />
              </td>
              <td className="py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => router.push(entityHref.invoice(inv.invoiceNo))}
                  className="text-[#C89B3C] hover:underline font-medium"
                >
                  View Invoice
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RelatedPaymentsTable({
  rows,
  emptyText = "No Payments Recorded",
}: {
  rows: RelatedPaymentRow[];
  emptyText?: string;
}) {
  const router = useRouter();
  if (rows.length === 0) {
    return <RelationEmpty icon={WalletIcon} text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {[
              "Transaction ID",
              "Invoice No",
              "Booking ID",
              "Payment Date",
              "Payment Method",
              "Amount",
              "Collected By",
              "Status",
              "Action",
            ].map((h) => (
              <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => (
            <tr key={`${t.bookingRef}-${t.id}`} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.transaction(t.transactionId)}>
                  {t.transactionId}
                </EntityLink>
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                {t.invoiceNo ? (
                  <EntityLink href={entityHref.invoice(t.invoiceNo)}>{t.invoiceNo}</EntityLink>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.booking(t.bookingRef)}>{t.bookingId}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563] whitespace-nowrap">
                {formatDate(t.date)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">
                {paymentMethodLabel(String(t.method))}
              </td>
              <td className="py-2.5 pr-3 font-semibold tabular-nums whitespace-nowrap">
                {formatCurrency(t.amount)}
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{t.collectedBy || "Admin"}</td>
              <td className="py-2.5 pr-3 capitalize text-[#4B5563]">{t.status}</td>
              <td className="py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => router.push(entityHref.transaction(t.transactionId))}
                  className="text-[#C89B3C] hover:underline font-medium"
                >
                  View Transaction
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RelatedVenuesTable({
  venues,
  emptyText = "No Venues Available",
}: {
  venues: Venue[];
  emptyText?: string;
}) {
  const router = useRouter();
  if (venues.length === 0) {
    return <RelationEmpty icon={BuildingIcon} text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {["Venue ID", "Venue Name", "Business Profile", "City", "Category", "Status", "Action"].map(
              (h) => (
                <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {venues.map((v) => (
            <tr key={v.id} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.venue(v.id)}>{v.venueId}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 font-medium text-[#111827]">{v.name}</td>
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.business(v.businessId)}>
                  {v.businessName}
                </EntityLink>
              </td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{v.city}</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{v.category}</td>
              <td className="py-2.5 pr-3 capitalize text-[#4B5563]">{v.status}</td>
              <td className="py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => router.push(entityHref.venue(v.id))}
                  className="text-[#C89B3C] hover:underline font-medium"
                >
                  View Venue
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RelatedBusinessesTable({
  businesses,
  emptyText = "No Business Profiles Available",
}: {
  businesses: BusinessProfile[];
  emptyText?: string;
}) {
  const router = useRouter();
  if (businesses.length === 0) {
    return <RelationEmpty icon={BriefcaseIcon} text={emptyText} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] text-sm">
        <thead>
          <tr className="border-b border-[#E8EAF0] text-left text-[11px] uppercase tracking-wider text-[#6B7280]">
            {["Business ID", "Business Name", "Type", "City", "Status", "Action"].map((h) => (
              <th key={h} className="pb-2.5 pr-3 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {businesses.map((b) => (
            <tr key={b.id} className="border-b border-[#F3F4F6] last:border-0">
              <td className="py-2.5 pr-3 whitespace-nowrap">
                <EntityLink href={entityHref.business(b.id)}>{b.businessId}</EntityLink>
              </td>
              <td className="py-2.5 pr-3 font-medium text-[#111827]">{b.businessName}</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{b.businessType}</td>
              <td className="py-2.5 pr-3 text-[#4B5563]">{b.city}</td>
              <td className="py-2.5 pr-3 capitalize text-[#4B5563]">{b.status}</td>
              <td className="py-2.5 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => router.push(entityHref.business(b.id))}
                  className="text-[#C89B3C] hover:underline font-medium"
                >
                  View Business
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ViewAllButton({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  return (
    <Button variant="outline" size="sm" onClick={() => router.push(href)}>
      {label}
    </Button>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}
function FileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}
function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4z" />
    </svg>
  );
}
function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
    </svg>
  );
}
function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
