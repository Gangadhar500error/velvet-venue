"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Mail, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageBreadcrumb } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { notify } from "../../_components/ui/Toast";
import { entityHref } from "../../_components/relations/EntityLink";
import { PaymentStatusPill } from "../../bookings/components/BookingTable";
import { formatCurrency, formatDate } from "../../bookings/data";
import {
  paymentMethodLabel,
  paymentTypeLabel,
} from "../../bookings/payments";
import type { Booking, BookingInvoice } from "../../bookings/types";
import { useDemoStore } from "../../store/demoStore";
import { deriveInvoiceStatus, invoiceBreakdown } from "../data";
import { InvoiceStatusPill } from "./InvoiceTable";
import { EmailInvoiceModal } from "./EmailInvoiceModal";
import { downloadInvoicePdf, openInvoicePrintWindow } from "./printInvoice";

interface InvoiceWorkspaceProps {
  booking: Booking;
  invoice: BookingInvoice;
}

export function InvoiceWorkspace({ booking, invoice }: InvoiceWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customers = useDemoStore((s) => s.customers);
  const venues = useDemoStore((s) => s.venues);
  const [emailOpen, setEmailOpen] = useState(false);

  const txn = useMemo(
    () =>
      (booking.transactions || []).find(
        (t) => t.transactionId === invoice.transactionId || t.invoiceNo === invoice.invoiceNo
      ),
    [booking.transactions, invoice]
  );

  const invoiceStatus = useMemo(
    () => deriveInvoiceStatus(invoice, booking, txn),
    [invoice, booking, txn]
  );

  const customer = useMemo(
    () =>
      customers.find(
        (c) => c.id === booking.customerId || c.customerId === booking.customerId
      ),
    [customers, booking.customerId]
  );

  const venue = useMemo(
    () => venues.find((v) => v.venueId === booking.venueId || v.id === booking.venueId),
    [venues, booking.venueId]
  );

  const customerAddress = useMemo(() => {
    if (!customer) return booking.customerCity || "—";
    return (
      [customer.addressLine1, customer.addressLine2, customer.city, customer.state, customer.zipCode]
        .filter(Boolean)
        .join(", ") ||
      customer.city ||
      "—"
    );
  }, [customer, booking.customerCity]);

  const breakdown = useMemo(() => invoiceBreakdown(booking, invoice), [booking, invoice]);

  const printArgs = useMemo(
    () => ({
      booking,
      invoice,
      txn,
      invoiceStatus,
      customerAddress,
      venueCategory: venue?.category,
    }),
    [booking, invoice, txn, invoiceStatus, customerAddress, venue]
  );

  const printInvoice = () => {
    const ok = openInvoicePrintWindow({ ...printArgs, autoPrint: true });
    if (!ok) {
      notify.error("Unable to open print window. Allow pop-ups and try again.");
      return;
    }
  };

  const downloadPdf = () => {
    try {
      downloadInvoicePdf(printArgs);
      notify.downloaded();
    } catch {
      notify.error("Unable to download invoice PDF. Please try again.");
    }
  };

  useEffect(() => {
    if (searchParams.get("print") === "1") {
      printInvoice();
      router.replace(entityHref.invoice(invoice.invoiceNo));
    }
    if (searchParams.get("download") === "1") {
      downloadPdf();
      router.replace(entityHref.invoice(invoice.invoiceNo));
    }
    if (searchParams.get("email") === "1") {
      setEmailOpen(true);
      router.replace(entityHref.invoice(invoice.invoiceNo));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4 animate-fadeIn pb-8">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Finance" },
          { label: "Invoices", href: "/admin/invoices" },
          { label: invoice.invoiceNo },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-[#111827]">{invoice.invoiceNo}</h1>
          <InvoiceStatusPill status={invoiceStatus} />
          <PaymentStatusPill status={booking.paymentStatus} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" icon={Printer} onClick={printInvoice}>
            Print Invoice
          </Button>
          <Button variant="secondary" icon={Download} onClick={downloadPdf}>
            Download PDF
          </Button>
          <Button variant="secondary" icon={Mail} onClick={() => setEmailOpen(true)}>
            Email Invoice
          </Button>
        </div>
      </div>

      {/* Centered invoice document */}
      <div className="mx-auto w-full max-w-[820px]">
        <article className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          {/* Header */}
          <div className="px-6 sm:px-8 pt-7 pb-5 border-b-2 border-[#C89B3C] flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[10px] bg-[#C89B3C] text-white flex items-center justify-center text-sm font-bold shrink-0">
                VV
              </div>
              <div>
                <p className="text-lg font-semibold text-[#111827] leading-tight">VelvetVenues</p>
                <p className="text-xs text-[#6B7280] mt-0.5">Premium Venue Booking Platform</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#C89B3C] leading-tight">{invoice.invoiceNo}</p>
              <p className="text-sm text-[#6B7280] mt-1">
                Date: {formatDate(invoice.invoiceDate)}
              </p>
              <div className="mt-2 flex justify-end">
                <InvoiceStatusPill status={invoiceStatus} />
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-8 py-6 space-y-6">
            {/* Parties */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                  Bill To
                </p>
                <p className="text-sm font-semibold text-[#111827]">{booking.customerName}</p>
                <p className="text-sm text-[#6B7280] mt-0.5">{booking.customerPhone || "—"}</p>
                <p className="text-sm text-[#6B7280]">{booking.customerEmail || "—"}</p>
                <p className="text-sm text-[#6B7280] mt-1">{customerAddress}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
                  Venue & Business
                </p>
                <p className="text-sm font-semibold text-[#111827]">{booking.venueName}</p>
                <p className="text-sm text-[#6B7280] mt-0.5">{booking.businessName}</p>
                {booking.vendorName && (
                  <p className="text-sm text-[#6B7280]">Owner: {booking.vendorName}</p>
                )}
                <p className="text-sm text-[#6B7280] mt-1">
                  {booking.venueCity || venue?.city || "—"}
                  {venue?.category ? ` · ${venue.category}` : ""}
                </p>
              </div>
            </div>

            {/* Booking */}
            <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                Booking Details
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Meta label="Booking ID" value={booking.bookingId} />
                <Meta label="Event" value={booking.eventType || "—"} />
                <Meta label="Event Date" value={formatDate(booking.eventDate)} />
                <Meta label="Slot" value="Full Day" />
                <Meta label="Guests" value={String(booking.guestCount || "—")} />
                <Meta label="Booking Amount" value={formatCurrency(booking.bookingAmount)} />
                <Meta label="Payment Type" value={paymentTypeLabel(invoice.paymentType)} />
                <Meta
                  label="Booking Date"
                  value={formatDate(booking.bookingDate)}
                />
              </div>
            </div>

            {/* Amounts */}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                Invoice Amount
              </p>
              <table className="w-full text-sm">
                <tbody>
                  <Line label="Venue Charges" value={formatCurrency(breakdown.venueCharges)} />
                  {breakdown.foodCharges > 0 && (
                    <Line label="Food Charges" value={formatCurrency(breakdown.foodCharges)} />
                  )}
                  {breakdown.addonCharges > 0 && (
                    <Line
                      label="Add-on Services"
                      value={formatCurrency(breakdown.addonCharges)}
                    />
                  )}
                  {breakdown.gst > 0 && (
                    <Line label="GST" value={formatCurrency(breakdown.gst)} />
                  )}
                  {breakdown.platformFee > 0 && (
                    <Line
                      label={`Platform Fee (${breakdown.platformFeePercent}%)`}
                      value={formatCurrency(breakdown.platformFee)}
                    />
                  )}
                  {breakdown.discount > 0 && (
                    <Line label="Discount" value={`− ${formatCurrency(breakdown.discount)}`} />
                  )}
                </tbody>
              </table>
              <div className="mt-3 pt-3 border-t border-[#E8EAF0] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#111827]">
                    Invoice Amount ({paymentTypeLabel(invoice.paymentType)})
                  </span>
                  <span className="text-base font-bold text-[#111827] tabular-nums">
                    {formatCurrency(invoice.amountReceived)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">Paid</span>
                  <span className="font-semibold text-[#16A34A] tabular-nums">
                    {formatCurrency(invoice.amountReceived)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#6B7280]">Remaining Balance</span>
                  <span className="font-semibold text-[#111827] tabular-nums">
                    {formatCurrency(invoice.remainingBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-[12px] border border-[#E8EAF0] bg-[#FCFCFD] px-4 py-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-3">
                Payment Details
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Meta
                  label="Transaction ID"
                  value={txn?.transactionId || invoice.transactionId || "—"}
                />
                <Meta
                  label="Payment Method"
                  value={paymentMethodLabel(
                    String(invoice.paymentMethod || txn?.method || "")
                  )}
                />
                <Meta label="Reference" value={txn?.reference || "—"} />
                <Meta
                  label="Payment Date"
                  value={formatDate(txn?.date || invoice.invoiceDate)}
                />
                <Meta label="Collected By" value={txn?.collectedBy || "Admin"} />
                <Meta
                  label="Status"
                  value={
                    <span className="inline-flex">
                      <PaymentStatusPill status={booking.paymentStatus} />
                    </span>
                  }
                />
              </div>
            </div>

            {/* Terms */}
            <div className="text-[12px] text-[#6B7280] leading-relaxed">
              <p className="font-semibold text-[#9CA3AF] uppercase tracking-wider text-[11px] mb-1.5">
                Terms
              </p>
              <p>
                Platform fee is non-refundable. Venue cancellation policy applies as agreed at
                booking. This invoice confirms receipt of{" "}
                {formatCurrency(invoice.amountReceived)} against booking {booking.bookingId}.
              </p>
            </div>

            <div className="pt-2 border-t border-[#E8EAF0] text-center text-[11px] text-[#9CA3AF]">
              Generated by VelvetVenues
            </div>
          </div>
        </article>
      </div>

      <EmailInvoiceModal
        open={emailOpen}
        invoiceNo={invoice.invoiceNo}
        defaultEmail={booking.customerEmail || ""}
        onClose={() => setEmailOpen(false)}
      />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className="text-sm font-medium text-[#111827] mt-0.5 truncate">{value}</p>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-[#F3F4F6] last:border-0">
      <td className="py-2.5 text-[#6B7280]">{label}</td>
      <td className="py-2.5 text-right font-medium text-[#111827] tabular-nums whitespace-nowrap">
        {value}
      </td>
    </tr>
  );
}
