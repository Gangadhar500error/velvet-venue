import type { Booking, BookingInvoice, BookingTransaction } from "../bookings/types";
import { getBookingInvoices } from "../bookings/payments";
import type {
  InvoiceDatePreset,
  InvoiceDisplayStatus,
  InvoiceFilters,
  InvoiceListRow,
} from "./types";

export function deriveInvoiceStatus(
  invoice: BookingInvoice,
  booking: Booking,
  txn?: BookingTransaction
): InvoiceDisplayStatus {
  if (txn?.status === "refunded" || booking.paymentStatus === "refunded") return "refunded";
  if (invoice.status === "cancelled" || booking.bookingStatus === "cancelled") return "cancelled";
  if (invoice.status === "pending") return "pending";
  if (booking.paymentStatus === "partial" && invoice.paymentType !== "final") return "partial";
  if (invoice.status === "paid") {
    return invoice.remainingBalance <= 0 || booking.paymentStatus === "paid"
      ? "completed"
      : "paid";
  }
  return "pending";
}

export function invoiceStatusLabel(status: InvoiceDisplayStatus | string) {
  const map: Record<string, string> = {
    paid: "Paid",
    partial: "Partial",
    pending: "Pending",
    cancelled: "Cancelled",
    refunded: "Refunded",
    completed: "Completed",
  };
  return map[status] || String(status).replace(/_/g, " ");
}

export function buildInvoiceRows(bookings: Booking[]): InvoiceListRow[] {
  return bookings.flatMap((b) => {
    const invoices = getBookingInvoices(b);
    return invoices.map((inv) => {
      const txn = (b.transactions || []).find(
        (t) => t.transactionId === inv.transactionId || t.invoiceNo === inv.invoiceNo
      );
      const invoiceStatus = deriveInvoiceStatus(inv, b, txn);
      return {
        id: `${b.id}-${inv.id}`,
        invoiceId: inv.id,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        paymentType: inv.paymentType,
        paymentMethod: String(inv.paymentMethod || txn?.method || b.paymentMethod || ""),
        amountReceived: inv.amountReceived,
        remainingBalance: inv.remainingBalance,
        status: inv.status,
        transactionId: inv.transactionId || txn?.transactionId || "",
        gstAmount: inv.gstAmount,
        platformFee: inv.platformFee,
        platformFeePercent: inv.platformFeePercent,
        bookingId: b.bookingId,
        bookingRef: b.id,
        customerId: b.customerId,
        customerName: b.customerName,
        customerPhone: b.customerPhone,
        customerEmail: b.customerEmail,
        venueId: b.venueId,
        venueName: b.venueName,
        businessId: b.businessId,
        businessName: b.businessName,
        vendorId: b.vendorId,
        vendorName: b.vendorName,
        bookingAmount: b.bookingAmount,
        paymentStatus: b.paymentStatus,
        invoiceStatus,
        invoiceAmount: inv.amountReceived,
        amountPaid: inv.amountReceived,
        createdAt: inv.invoiceDate || b.createdAt,
        updatedAt: b.updatedAt,
      };
    });
  });
}

function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  start.setDate(d.getDate() + diff);
  return start;
}

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function resolveDateRange(
  preset: InvoiceDatePreset,
  dateFrom: string,
  dateTo: string
): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = toIsoDate(today);

  if (preset === "today") return { from: todayIso, to: todayIso };
  if (preset === "this_week") {
    const start = startOfWeek(today);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }
  if (preset === "this_month") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: toIsoDate(start), to: toIsoDate(end) };
  }
  if (preset === "custom") return { from: dateFrom, to: dateTo };
  return { from: dateFrom, to: dateTo };
}

function normalizeMethodFilter(method: string, value: string) {
  if (!method) return true;
  if (method === "online_gateway") {
    return ["link", "netbanking", "card", "upi"].includes(value);
  }
  return value === method;
}

export function filterInvoiceRows(
  rows: InvoiceListRow[],
  filters: InvoiceFilters
): InvoiceListRow[] {
  let list = [...rows];
  const f = filters;

  if (f.search) {
    const q = f.search.toLowerCase().trim();
    const qPhone = q.replace(/\s/g, "");
    list = list.filter(
      (r) =>
        r.invoiceNo.toLowerCase().includes(q) ||
        r.bookingId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.venueName.toLowerCase().includes(q) ||
        r.businessName.toLowerCase().includes(q) ||
        r.customerPhone.replace(/\s/g, "").includes(qPhone) ||
        r.transactionId.toLowerCase().includes(q)
    );
  }

  if (f.invoiceStatus) {
    list = list.filter((r) => {
      if (f.invoiceStatus === "paid") {
        return r.invoiceStatus === "paid" || r.invoiceStatus === "completed";
      }
      return r.invoiceStatus === f.invoiceStatus;
    });
  }

  const range = resolveDateRange(f.datePreset, f.dateFrom, f.dateTo);
  if (range.from) list = list.filter((r) => r.invoiceDate.slice(0, 10) >= range.from);
  if (range.to) list = list.filter((r) => r.invoiceDate.slice(0, 10) <= range.to);

  if (f.paymentMethod) {
    list = list.filter((r) => normalizeMethodFilter(f.paymentMethod, r.paymentMethod));
  }
  if (f.businessId) list = list.filter((r) => r.businessId === f.businessId);
  if (f.venueId) list = list.filter((r) => r.venueId === f.venueId);
  if (f.vendorId) list = list.filter((r) => r.vendorId === f.vendorId);
  if (f.customerId) list = list.filter((r) => r.customerId === f.customerId);

  return list;
}

export function sortInvoiceRows(
  rows: InvoiceListRow[],
  sortKey: string,
  sortDir: "asc" | "desc"
): InvoiceListRow[] {
  const list = [...rows];
  list.sort((a, b) => {
    const av = a[sortKey as keyof InvoiceListRow];
    const bv = b[sortKey as keyof InvoiceListRow];
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }
    return sortDir === "asc"
      ? String(av ?? "").localeCompare(String(bv ?? ""))
      : String(bv ?? "").localeCompare(String(av ?? ""));
  });
  return list;
}

export function invoiceBreakdown(booking: Booking, invoice: BookingInvoice) {
  /** Additional services are informational — not included in invoice math */
  const addonCharges = 0;
  const gst = invoice.gstAmount ?? booking.taxAmount ?? 0;
  const discount = booking.discountAmount || 0;
  const platformFee = invoice.platformFee ?? 0;
  const platformFeePercent = invoice.platformFeePercent ?? 2;
  const venueCharges = Math.max(0, booking.bookingAmount - gst + discount);
  return {
    venueCharges,
    foodCharges: 0,
    addonCharges,
    gst,
    platformFee,
    platformFeePercent,
    discount,
    invoiceAmount: invoice.amountReceived,
    paidAmount: invoice.amountReceived,
    remainingBalance: invoice.remainingBalance,
    bookingAmount: booking.bookingAmount,
    addons: booking.addons || [],
  };
}

function escapeCsv(value: string | number) {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportInvoicesCsv(rows: InvoiceListRow[], filename: string) {
  const headers = [
    "Invoice No",
    "Invoice Date",
    "Customer",
    "Phone",
    "Venue",
    "Business Profile",
    "Booking ID",
    "Payment Type",
    "Payment Method",
    "Invoice Amount",
    "Paid",
    "Balance",
    "Payment Status",
    "Invoice Status",
    "Transaction ID",
  ];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.invoiceNo,
        r.invoiceDate.slice(0, 10),
        r.customerName,
        r.customerPhone,
        r.venueName,
        r.businessName,
        r.bookingId,
        r.paymentType,
        r.paymentMethod,
        r.invoiceAmount,
        r.amountPaid,
        r.remainingBalance,
        r.paymentStatus,
        r.invoiceStatus,
        r.transactionId,
      ]
        .map(escapeCsv)
        .join(",")
    ),
  ];
  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportInvoicesExcel(rows: InvoiceListRow[], filename: string) {
  // Excel-friendly HTML table (.xls)
  const headers = [
    "Invoice No",
    "Invoice Date",
    "Customer",
    "Venue",
    "Business Profile",
    "Booking ID",
    "Payment Type",
    "Invoice Amount",
    "Paid",
    "Balance",
    "Payment Status",
    "Invoice Status",
  ];
  const body = rows
    .map(
      (r) =>
        `<tr>
          <td>${r.invoiceNo}</td>
          <td>${r.invoiceDate.slice(0, 10)}</td>
          <td>${r.customerName}</td>
          <td>${r.venueName}</td>
          <td>${r.businessName}</td>
          <td>${r.bookingId}</td>
          <td>${r.paymentType}</td>
          <td>${r.invoiceAmount}</td>
          <td>${r.amountPaid}</td>
          <td>${r.remainingBalance}</td>
          <td>${r.paymentStatus}</td>
          <td>${r.invoiceStatus}</td>
        </tr>`
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel");
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob(["\ufeff" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
