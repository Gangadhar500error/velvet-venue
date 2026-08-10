"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Eye, FileText, Mail, MoreHorizontal, Printer } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "../../bookings/data";
import { paymentTypeShortLabel } from "../../bookings/payments";
import { PaymentStatusPill } from "../../bookings/components/BookingTable";
import { Button } from "../../_components/ui/Button";
import { entityHref } from "../../_components/relations/EntityLink";
import { invoiceStatusLabel } from "../data";
import type { InvoiceColumnKey, InvoiceDisplayStatus, InvoiceListRow, TableDensity } from "../types";

interface InvoiceTableProps {
  rows: InvoiceListRow[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  density: TableDensity;
  visibleColumns: Record<InvoiceColumnKey, boolean>;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onPrint?: (row: InvoiceListRow) => void;
  onDownload?: (row: InvoiceListRow) => void;
  onEmail?: (row: InvoiceListRow) => void;
}

export const columnLabels: Record<InvoiceColumnKey, string> = {
  invoiceNo: "Invoice No",
  invoiceDate: "Invoice Date",
  customer: "Customer",
  venue: "Venue",
  business: "Business Profile",
  bookingId: "Booking ID",
  paymentType: "Payment Type",
  invoiceAmount: "Invoice Amount",
  paid: "Paid",
  balance: "Balance",
  paymentStatus: "Payment Status",
  invoiceStatus: "Invoice Status",
  actions: "Action",
};

const invoiceStatusStyles: Record<InvoiceDisplayStatus, string> = {
  paid: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
  completed: "bg-[#EEF2FF] text-[#4F46E5] border-[#E0E7FF]",
  partial: "bg-[#FCFAF8] text-[#D97706] border-[#FDE9CB]",
  pending: "bg-[#FCFAF8] text-[#B8862B] border-[#FED7AA]",
  cancelled: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  refunded: "bg-[#FDF4FF] text-[#A21CAF] border-[#F5D0FE]",
};

export function InvoiceStatusPill({ status }: { status: InvoiceDisplayStatus | string }) {
  const key = (status || "pending") as InvoiceDisplayStatus;
  const cls =
    invoiceStatusStyles[key] || "bg-[#F8FAFC] text-[#64748B] border-[#E8EAF0]";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize whitespace-nowrap ${cls}`}
    >
      {invoiceStatusLabel(status)}
    </span>
  );
}

export function InvoiceTable({
  rows,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  density,
  visibleColumns,
  sortKey,
  sortDir,
  onSort,
  onPrint,
  onDownload,
  onEmail,
}: InvoiceTableProps) {
  const router = useRouter();
  const allSelected = rows.length > 0 && selectedIds.length === rows.length;
  const rowPad = density === "compact" ? "py-2.5" : "py-3.5";

  if (rows.length === 0) {
    return (
      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-[#C89B3C]/10 text-[#C89B3C] flex items-center justify-center mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827]">No Invoices Found</h3>
        <p className="text-sm text-[#6B7280] mt-1.5 max-w-md mx-auto">
          Invoices are generated automatically when a customer makes a successful payment. Adjust
          filters or record a payment on a booking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1500px]">
          <thead className="sticky top-0 z-10 bg-[#FCFCFD] border-b border-[#E8EAF0]">
            <tr>
              <th className="px-4 py-3.5 w-12 text-left">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onToggleSelectAll}
                  className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                  aria-label="Select all invoices"
                />
              </th>
              {visibleColumns.invoiceNo && (
                <SortableTh
                  label="Invoice No"
                  active={sortKey === "invoiceNo"}
                  dir={sortDir}
                  onClick={() => onSort("invoiceNo")}
                />
              )}
              {visibleColumns.invoiceDate && (
                <SortableTh
                  label="Invoice Date"
                  active={sortKey === "invoiceDate"}
                  dir={sortDir}
                  onClick={() => onSort("invoiceDate")}
                />
              )}
              {visibleColumns.customer && (
                <SortableTh
                  label="Customer"
                  active={sortKey === "customerName"}
                  dir={sortDir}
                  onClick={() => onSort("customerName")}
                />
              )}
              {visibleColumns.venue && (
                <SortableTh
                  label="Venue"
                  active={sortKey === "venueName"}
                  dir={sortDir}
                  onClick={() => onSort("venueName")}
                />
              )}
              {visibleColumns.business && <Th>Business Profile</Th>}
              {visibleColumns.bookingId && (
                <SortableTh
                  label="Booking ID"
                  active={sortKey === "bookingId"}
                  dir={sortDir}
                  onClick={() => onSort("bookingId")}
                />
              )}
              {visibleColumns.paymentType && <Th>Payment Type</Th>}
              {visibleColumns.invoiceAmount && (
                <SortableTh
                  label="Invoice Amount"
                  active={sortKey === "invoiceAmount"}
                  dir={sortDir}
                  onClick={() => onSort("invoiceAmount")}
                />
              )}
              {visibleColumns.paid && (
                <SortableTh
                  label="Paid"
                  active={sortKey === "amountPaid"}
                  dir={sortDir}
                  onClick={() => onSort("amountPaid")}
                />
              )}
              {visibleColumns.balance && (
                <SortableTh
                  label="Balance"
                  active={sortKey === "remainingBalance"}
                  dir={sortDir}
                  onClick={() => onSort("remainingBalance")}
                />
              )}
              {visibleColumns.paymentStatus && <Th>Payment Status</Th>}
              {visibleColumns.invoiceStatus && <Th>Invoice Status</Th>}
              {visibleColumns.actions && <Th className="text-center">Action</Th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const selected = selectedIds.includes(row.id);
              const openInvoice = () =>
                router.push(entityHref.invoice(row.invoiceNo));
              return (
                <tr
                  key={row.id}
                  onClick={openInvoice}
                  className={`border-b border-[#F3F4F6] transition-colors cursor-pointer hover:bg-[#FFF3EB] ${
                    selected ? "bg-[#FFF3EB]" : idx % 2 === 1 ? "bg-[#FAFBFC]" : "bg-white"
                  }`}
                >
                  <td className={`px-4 ${rowPad}`} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleSelect(row.id)}
                      className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      aria-label={`Select ${row.invoiceNo}`}
                    />
                  </td>
                  {visibleColumns.invoiceNo && (
                    <td className={`px-4 ${rowPad}`}>
                      <span className="text-sm font-semibold text-[#C89B3C]">
                        {row.invoiceNo}
                      </span>
                    </td>
                  )}
                  {visibleColumns.invoiceDate && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563] whitespace-nowrap`}>
                      {formatDate(row.invoiceDate)}
                    </td>
                  )}
                  {visibleColumns.customer && (
                    <td className={`px-4 ${rowPad} text-sm font-medium text-[#111827]`}>
                      {row.customerName}
                    </td>
                  )}
                  {visibleColumns.venue && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563]`}>{row.venueName}</td>
                  )}
                  {visibleColumns.business && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563]`}>
                      {row.businessName}
                    </td>
                  )}
                  {visibleColumns.bookingId && (
                    <td className={`px-4 ${rowPad}`}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(entityHref.booking(row.bookingRef));
                        }}
                        className="text-sm font-medium text-[#C89B3C] hover:underline"
                      >
                        {row.bookingId}
                      </button>
                    </td>
                  )}
                  {visibleColumns.paymentType && (
                    <td className={`px-4 ${rowPad} text-sm text-[#4B5563]`}>
                      {paymentTypeShortLabel(row.paymentType)}
                    </td>
                  )}
                  {visibleColumns.invoiceAmount && (
                    <td className={`px-4 ${rowPad} text-sm font-semibold tabular-nums whitespace-nowrap`}>
                      {formatCurrency(row.invoiceAmount)}
                    </td>
                  )}
                  {visibleColumns.paid && (
                    <td className={`px-4 ${rowPad} text-sm tabular-nums whitespace-nowrap`}>
                      {formatCurrency(row.amountPaid)}
                    </td>
                  )}
                  {visibleColumns.balance && (
                    <td className={`px-4 ${rowPad} text-sm tabular-nums whitespace-nowrap`}>
                      {formatCurrency(row.remainingBalance)}
                    </td>
                  )}
                  {visibleColumns.paymentStatus && (
                    <td className={`px-4 ${rowPad}`}>
                      <PaymentStatusPill status={row.paymentStatus} />
                    </td>
                  )}
                  {visibleColumns.invoiceStatus && (
                    <td className={`px-4 ${rowPad}`}>
                      <InvoiceStatusPill status={row.invoiceStatus} />
                    </td>
                  )}
                  {visibleColumns.actions && (
                    <td
                      className={`px-4 ${rowPad} text-center`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={openInvoice}
                          className="!px-2"
                        >
                          View Invoice
                        </Button>
                        <RowMenu
                          onView={openInvoice}
                          onPrint={() => onPrint?.(row)}
                          onDownload={() => onDownload?.(row)}
                          onEmail={() => onEmail?.(row)}
                        />
                      </div>
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

function RowMenu({
  onView,
  onPrint,
  onDownload,
  onEmail,
}: {
  onView: () => void;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
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
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]"
        aria-label="More actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 rounded-[12px] border border-[#E8EAF0] bg-white shadow-lg py-1">
          <MenuItem icon={Eye} label="View Invoice" onClick={() => { setOpen(false); onView(); }} />
          {onPrint && (
            <MenuItem icon={Printer} label="Print" onClick={() => { setOpen(false); onPrint(); }} />
          )}
          {onDownload && (
            <MenuItem
              icon={Download}
              label="Download PDF"
              onClick={() => {
                setOpen(false);
                onDownload();
              }}
            />
          )}
          {onEmail && (
            <MenuItem icon={Mail} label="Email Invoice" onClick={() => { setOpen(false); onEmail(); }} />
          )}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-[#374151] hover:bg-[#F8F9FB]"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] ${className}`}
    >
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
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] hover:text-[#111827]"
      >
        {label}
        <span className={`text-[10px] ${active ? "text-[#C89B3C]" : "text-[#D1D5DB]"}`}>
          {active ? (dir === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </button>
    </th>
  );
}
