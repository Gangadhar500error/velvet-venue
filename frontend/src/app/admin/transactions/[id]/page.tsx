"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { PageBreadcrumb, PageHeader } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { useDemoStore } from "../../store/demoStore";
import { formatCurrency, formatDate } from "../../bookings/data";
import {
  findTransactionContext,
  getBookingInvoices,
  paymentMethodLabel,
  paymentTypeLabel,
} from "../../_components/relations";
import { EntityLink, entityHref } from "../../_components/relations/EntityLink";
import { EntityViewLayout } from "../../_components/layout/EntityViewLayout";
import { BookingStatusPill, PaymentStatusPill } from "../../bookings/components/BookingTable";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = String(params.id || "");
  const bookings = useDemoStore((s) => s.bookings);

  const ctx = useMemo(() => findTransactionContext(bookings, rawId), [bookings, rawId]);

  if (!ctx) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Transaction Not Found"
          subtitle="No transaction matches this reference."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Finance" },
            { label: "Transactions", href: "/admin/transactions" },
            { label: "Not Found" },
          ]}
          actions={
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => router.push("/admin/transactions")}
            >
              Back to Transactions
            </Button>
          }
        />
      </div>
    );
  }

  const { booking, transaction } = ctx;
  const invoice =
    getBookingInvoices(booking).find(
      (i) =>
        i.invoiceNo === transaction.invoiceNo ||
        i.transactionId === transaction.transactionId
    ) || null;

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      <PageBreadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Finance" },
          { label: "Transactions", href: "/admin/transactions" },
          { label: transaction.transactionId },
        ]}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#111827]">
            {transaction.transactionId}
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {paymentMethodLabel(String(transaction.method))} · {formatDate(transaction.date)}
          </p>
        </div>
        <Button
          variant="secondary"
          icon={ArrowLeft}
          onClick={() => router.push("/admin/transactions")}
        >
          Back
        </Button>
      </div>

      <EntityViewLayout
        main={
          <div className="grid grid-cols-1 gap-4">
            <DetailCard title="Transaction Details">
              <Row label="Transaction ID" value={transaction.transactionId} />
              <Row label="Payment Date" value={formatDate(transaction.date)} />
              <Row label="Payment Method" value={paymentMethodLabel(String(transaction.method))} />
              <Row label="Reference Number" value={transaction.reference || "—"} />
              <Row label="Amount" value={formatCurrency(transaction.amount)} strong />
              <Row label="Collected By" value={transaction.collectedBy || "Admin"} />
              <Row label="Status" value={String(transaction.status)} />
              <Row label="Remarks" value={transaction.remarks || "—"} />
            </DetailCard>

            <DetailCard title="Invoice Details">
              {invoice ? (
                <>
                  <Row
                    label="Invoice No"
                    value={
                      <EntityLink href={entityHref.invoice(invoice.invoiceNo)}>
                        {invoice.invoiceNo}
                      </EntityLink>
                    }
                  />
                  <Row label="Payment Type" value={paymentTypeLabel(invoice.paymentType)} />
                  <Row label="Invoice Date" value={formatDate(invoice.invoiceDate)} />
                  <Row label="Remaining After" value={formatCurrency(invoice.remainingBalance)} />
                </>
              ) : (
                <p className="text-sm text-[#6B7280]">No linked invoice.</p>
              )}
            </DetailCard>
          </div>
        }
        overview={
          <DetailCard title="Booking Details">
            <Row
              label="Booking ID"
              value={
                <EntityLink href={entityHref.booking(booking.id)}>{booking.bookingId}</EntityLink>
              }
            />
            <Row label="Event" value={booking.eventType} />
            <Row label="Booking Amount" value={formatCurrency(booking.bookingAmount)} />
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-[13px] text-[#6B7280]">Statuses</span>
              <div className="flex gap-1.5">
                <BookingStatusPill status={booking.bookingStatus} />
                <PaymentStatusPill status={booking.paymentStatus} />
              </div>
            </div>
          </DetailCard>
        }
        crossReference={
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <DetailCard title="Customer">
                <Row
                  label="Name"
                  value={
                    <EntityLink href={entityHref.customer(booking.customerId)}>
                      {booking.customerName}
                    </EntityLink>
                  }
                />
              </DetailCard>
              <DetailCard title="Venue">
                <Row
                  label="Venue"
                  value={
                    <EntityLink href={entityHref.venue(booking.venueId)}>
                      {booking.venueName}
                    </EntityLink>
                  }
                />
              </DetailCard>
              <DetailCard title="Business Profile">
                <Row
                  label="Business"
                  value={
                    <EntityLink href={entityHref.business(booking.businessId)}>
                      {booking.businessName}
                    </EntityLink>
                  }
                />
              </DetailCard>
              <DetailCard title="Venue Owner">
                <Row
                  label="Owner"
                  value={
                    booking.vendorId ? (
                      <EntityLink href={entityHref.owner(booking.vendorId)}>
                        {booking.vendorName || "—"}
                      </EntityLink>
                    ) : (
                      booking.vendorName || "—"
                    )
                  }
                />
              </DetailCard>
            </div>

            <DetailCard title="Quick Links">
              <div className="flex flex-wrap gap-2">
                <QuickLink href={entityHref.booking(booking.id)} label="Open Booking" />
                {invoice && (
                  <QuickLink href={entityHref.invoice(invoice.invoiceNo)} label="Open Invoice" />
                )}
                <QuickLink href={entityHref.customer(booking.customerId)} label="Open Customer" />
                <QuickLink href={entityHref.venue(booking.venueId)} label="Open Venue" />
                <QuickLink
                  href={entityHref.business(booking.businessId)}
                  label="Open Business Profile"
                />
                {booking.vendorId && (
                  <QuickLink href={entityHref.owner(booking.vendorId)} label="Open Venue Owner" />
                )}
              </div>
            </DetailCard>
          </>
        }
      />
    </div>
  );
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#FFF3EB]/60 border-b border-[#E8EAF0]">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">{title}</p>
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[13px] text-[#6B7280] shrink-0">{label}</span>
      <span
        className={`text-sm text-right ${
          strong ? "font-bold text-[#111827]" : "font-medium text-[#111827]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#E8EAF0] bg-white text-sm font-medium text-[#374151] hover:border-[#C89B3C] hover:text-[#C89B3C]"
    >
      <ExternalLink className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}
