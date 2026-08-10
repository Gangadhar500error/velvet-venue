import { jsPDF } from "jspdf";
import type { Booking, BookingInvoice, BookingTransaction } from "../../bookings/types";
import { formatDate } from "../../bookings/data";
import { paymentMethodLabel, paymentTypeLabel } from "../../bookings/payments";
import { invoiceBreakdown, invoiceStatusLabel } from "../data";
import type { InvoiceDisplayStatus } from "../types";

type Breakdown = ReturnType<typeof invoiceBreakdown>;

export type InvoicePrintArgs = {
  booking: Booking;
  invoice: BookingInvoice;
  txn?: BookingTransaction;
  invoiceStatus: InvoiceDisplayStatus;
  customerAddress?: string;
  venueCategory?: string;
};

function money(amount: number) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-IN")}`;
}

function buildInvoiceHtml(args: InvoicePrintArgs & { autoPrint: boolean }) {
  const {
    booking,
    invoice,
    txn,
    invoiceStatus,
    customerAddress,
    venueCategory,
    autoPrint,
  } = args;
  const breakdown = invoiceBreakdown(booking, invoice);

  const addonRows =
    breakdown.addons.length > 0
      ? `<tr><td colspan="2" style="padding-top:10px;color:#6B7280;font-size:12px;">Additional Services (informational): ${escapeHtml(
          breakdown.addons.map((a) => a.name).join(", ")
        )}</td></tr>`
      : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoice.invoiceNo)} — VelvetVenues</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: "Segoe UI", Arial, sans-serif; color: #111827; background: #f3f4f6; }
    .sheet { width: 210mm; min-height: 297mm; margin: 16px auto; background: #fff; padding: 18mm 16mm; box-shadow: 0 8px 24px rgba(0,0,0,.08); }
    .brand { display:flex; justify-content:space-between; align-items:flex-start; border-bottom: 2px solid #C89B3C; padding-bottom: 14px; margin-bottom: 18px; }
    .logo { width: 42px; height: 42px; border-radius: 10px; background: #C89B3C; color: #fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; }
    .brand h1 { margin: 0; font-size: 22px; letter-spacing: -0.02em; }
    .brand p { margin: 2px 0 0; color: #6b7280; font-size: 12px; }
    .meta { text-align: right; }
    .meta .inv { font-size: 18px; font-weight: 700; color: #C89B3C; }
    .meta .badge { display:inline-block; margin-top:6px; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; background:#ECFDF3; color:#16A34A; border:1px solid #D3F8E1; }
    .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
    .card { border: 1px solid #E8EAF0; border-radius: 10px; padding: 12px 14px; }
    .card h3 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #9CA3AF; }
    .card p { margin: 0 0 4px; font-size: 13px; }
    .card strong { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0 16px; }
    th, td { padding: 9px 10px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
    th { text-align: left; color: #6B7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; background: #FCFCFD; }
    td.right, th.right { text-align: right; }
    .totals td { border: 0; padding: 5px 10px; }
    .totals .grand td { font-size: 15px; font-weight: 700; padding-top: 10px; border-top: 2px solid #E8EAF0; }
    .terms { margin-top: 18px; padding: 12px 14px; background: #FCFCFD; border: 1px solid #E8EAF0; border-radius: 10px; font-size: 12px; color: #4B5563; }
    .terms h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #9CA3AF; }
    .terms ul { margin: 0; padding-left: 16px; }
    .sign { display:flex; justify-content:space-between; align-items:flex-end; margin-top: 28px; }
    .qr { width: 72px; height: 72px; border: 1px dashed #D1D5DB; border-radius: 8px; display:flex; align-items:center; justify-content:center; color:#9CA3AF; font-size:10px; text-align:center; }
    .sig-line { width: 180px; border-top: 1px solid #111827; padding-top: 6px; font-size: 12px; color: #6B7280; text-align:center; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #E8EAF0; text-align: center; font-size: 11px; color: #9CA3AF; }
    @media print {
      body { background: #fff; }
      .sheet { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 12mm; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <div style="display:flex;gap:12px;align-items:center">
        <div class="logo">VV</div>
        <div>
          <h1>VelvetVenues</h1>
          <p>Premium Venue Booking Platform</p>
        </div>
      </div>
      <div class="meta">
        <div class="inv">${escapeHtml(invoice.invoiceNo)}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px">Invoice Date: ${formatDate(invoice.invoiceDate)}</div>
        <div class="badge">${escapeHtml(invoiceStatusLabel(invoiceStatus))}</div>
      </div>
    </div>

    <div class="grid">
      <div class="card">
        <h3>Bill To</h3>
        <p><strong>${escapeHtml(booking.customerName)}</strong></p>
        <p>${escapeHtml(booking.customerPhone || "—")}</p>
        <p>${escapeHtml(booking.customerEmail || "—")}</p>
        <p>${escapeHtml(customerAddress || booking.customerCity || "—")}</p>
      </div>
      <div class="card">
        <h3>Venue & Booking</h3>
        <p><strong>${escapeHtml(booking.venueName)}</strong></p>
        <p>${escapeHtml(booking.businessName)}</p>
        <p>Category: ${escapeHtml(venueCategory || "—")}</p>
        <p>Booking: ${escapeHtml(booking.bookingId)}</p>
        <p>Event: ${escapeHtml(booking.eventType)} · ${formatDate(booking.eventDate)}</p>
        <p>Booking: Full Day · Guests: ${booking.guestCount || "—"}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Description</th><th class="right">Amount</th></tr>
      </thead>
      <tbody>
        <tr><td>Venue Charges</td><td class="right">${money(breakdown.venueCharges)}</td></tr>
        <tr><td>Food Charges</td><td class="right">${money(breakdown.foodCharges)}</td></tr>
        ${addonRows}
        <tr><td>GST</td><td class="right">${money(breakdown.gst)}</td></tr>
        <tr><td>Platform Fee (${breakdown.platformFeePercent}%)</td><td class="right">${money(breakdown.platformFee)}</td></tr>
        <tr><td>Discount</td><td class="right">- ${money(breakdown.discount)}</td></tr>
      </tbody>
    </table>

    <table class="totals">
      <tr><td>Booking Amount</td><td class="right">${money(breakdown.bookingAmount)}</td></tr>
      <tr><td>Payment Type</td><td class="right">${escapeHtml(paymentTypeLabel(invoice.paymentType))}</td></tr>
      <tr class="grand"><td>Invoice Amount (This Payment)</td><td class="right">${money(breakdown.invoiceAmount)}</td></tr>
      <tr><td>Paid</td><td class="right">${money(breakdown.paidAmount)}</td></tr>
      <tr><td>Balance</td><td class="right">${money(breakdown.remainingBalance)}</td></tr>
      <tr><td>Payment Method</td><td class="right">${escapeHtml(paymentMethodLabel(String(invoice.paymentMethod || txn?.method || "")))}</td></tr>
      <tr><td>Transaction Reference</td><td class="right">${escapeHtml(txn?.reference || txn?.transactionId || invoice.transactionId || "—")}</td></tr>
    </table>

    <div class="terms">
      <h3>Terms & Conditions</h3>
      <ul>
        <li>Platform fee is non-refundable.</li>
        <li>Venue cancellation policy as agreed at the time of booking applies.</li>
        <li>Taxes are calculated as per applicable GST rules.</li>
        <li>This document confirms receipt of the payment listed above.</li>
      </ul>
    </div>

    <div class="sign">
      <div class="qr">QR Code<br/>Placeholder</div>
      <div class="sig-line">Authorized Signature</div>
    </div>

    <div class="footer">Generated by VelvetVenues</div>
  </div>
  ${autoPrint ? "<script>window.onload=function(){setTimeout(function(){window.focus();window.print()},250)}</script>" : ""}
</body>
</html>`;
}

/** Opens a print-ready invoice window. */
export function openInvoicePrintWindow(args: InvoicePrintArgs & { autoPrint?: boolean }) {
  const html = buildInvoiceHtml({ ...args, autoPrint: Boolean(args.autoPrint) });
  // Do NOT pass noopener in features — it makes window.open return null.
  const w = window.open("", "_blank", "width=900,height=1100");
  if (!w) return false;
  try {
    w.opener = null;
  } catch {
    /* ignore */
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/** Generates and downloads a real PDF file for the invoice. */
export function downloadInvoicePdf(args: InvoicePrintArgs) {
  const { booking, invoice, txn, invoiceStatus, customerAddress, venueCategory } = args;
  const breakdown = invoiceBreakdown(booking, invoice);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 18;

  const line = (text: string, x: number, yy: number, opts?: { align?: "left" | "right" | "center"; size?: number; style?: "normal" | "bold"; color?: [number, number, number] }) => {
    doc.setFont("helvetica", opts?.style || "normal");
    doc.setFontSize(opts?.size || 10);
    if (opts?.color) doc.setTextColor(...opts.color);
    else doc.setTextColor(17, 24, 39);
    doc.text(text, x, yy, { align: opts?.align || "left" });
  };

  // Brand bar
  doc.setFillColor(200, 155, 60);
  doc.roundedRect(margin, y - 6, 12, 12, 2, 2, "F");
  line("VV", margin + 6, y + 2, { align: "center", size: 8, style: "bold", color: [255, 255, 255] });
  line("VelvetVenues", margin + 16, y, { size: 14, style: "bold" });
  line("Premium Venue Booking Platform", margin + 16, y + 5, { size: 8, color: [107, 114, 128] });

  line(invoice.invoiceNo, pageW - margin, y, { align: "right", size: 13, style: "bold", color: [200, 155, 60] });
  line(`Date: ${formatDate(invoice.invoiceDate)}`, pageW - margin, y + 5, {
    align: "right",
    size: 9,
    color: [107, 114, 128],
  });
  line(invoiceStatusLabel(invoiceStatus), pageW - margin, y + 10, {
    align: "right",
    size: 9,
    style: "bold",
    color: [22, 163, 74],
  });

  y += 18;
  doc.setDrawColor(200, 155, 60);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 10;

  // Bill to / Venue
  const col2 = pageW / 2 + 4;
  line("BILL TO", margin, y, { size: 8, style: "bold", color: [156, 163, 175] });
  line("VENUE & BUSINESS", col2, y, { size: 8, style: "bold", color: [156, 163, 175] });
  y += 6;
  line(booking.customerName || "—", margin, y, { size: 11, style: "bold" });
  line(booking.venueName || "—", col2, y, { size: 11, style: "bold" });
  y += 5;
  line(booking.customerPhone || "—", margin, y, { size: 9, color: [75, 85, 99] });
  line(booking.businessName || "—", col2, y, { size: 9, color: [75, 85, 99] });
  y += 5;
  line(booking.customerEmail || "—", margin, y, { size: 9, color: [75, 85, 99] });
  line(venueCategory || booking.venueCity || "—", col2, y, { size: 9, color: [75, 85, 99] });
  y += 5;
  const addr = doc.splitTextToSize(customerAddress || booking.customerCity || "—", pageW / 2 - margin - 8);
  doc.setFontSize(9);
  doc.setTextColor(75, 85, 99);
  doc.text(addr, margin, y);
  line(`Booking: ${booking.bookingId}`, col2, y, { size: 9, color: [75, 85, 99] });
  y += Math.max(addr.length * 4.2, 5) + 4;
  line(`Event: ${booking.eventType} · ${formatDate(booking.eventDate)}`, col2, y - 4, {
    size: 9,
    color: [75, 85, 99],
  });
  line(`Booking: Full Day · Guests: ${booking.guestCount || "—"}`, col2, y + 1, {
    size: 9,
    color: [75, 85, 99],
  });

  y += 12;

  // Amount table header
  doc.setFillColor(252, 252, 253);
  doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
  line("Description", margin + 2, y + 1, { size: 8, style: "bold", color: [107, 114, 128] });
  line("Amount", pageW - margin - 2, y + 1, {
    align: "right",
    size: 8,
    style: "bold",
    color: [107, 114, 128],
  });
  y += 8;

  const rows: [string, string][] = [
    ["Venue Charges", money(breakdown.venueCharges)],
    ["Food Charges", money(breakdown.foodCharges)],
    ["GST", money(breakdown.gst)],
    [`Platform Fee (${breakdown.platformFeePercent}%)`, money(breakdown.platformFee)],
    ["Discount", `- ${money(breakdown.discount)}`],
  ];

  if (breakdown.addons.length > 0) {
    rows.push([
      "Additional Services (info)",
      breakdown.addons.map((a) => a.name).join(", "),
    ]);
  }

  rows.forEach(([label, value]) => {
    line(label, margin + 2, y, { size: 10 });
    line(value, pageW - margin - 2, y, { align: "right", size: 10 });
    y += 6.5;
  });

  y += 3;
  doc.setDrawColor(232, 234, 240);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  const totals: [string, string, boolean?][] = [
    ["Booking Amount", money(breakdown.bookingAmount)],
    ["Payment Type", paymentTypeLabel(invoice.paymentType)],
    ["Invoice Amount (This Payment)", money(breakdown.invoiceAmount), true],
    ["Paid", money(breakdown.paidAmount)],
    ["Balance", money(breakdown.remainingBalance)],
    [
      "Payment Method",
      paymentMethodLabel(String(invoice.paymentMethod || txn?.method || "")),
    ],
    [
      "Transaction Reference",
      txn?.reference || txn?.transactionId || invoice.transactionId || "—",
    ],
  ];

  totals.forEach(([label, value, bold]) => {
    line(label, margin + 2, y, { size: bold ? 11 : 10, style: bold ? "bold" : "normal" });
    line(value, pageW - margin - 2, y, {
      align: "right",
      size: bold ? 11 : 10,
      style: bold ? "bold" : "normal",
    });
    y += bold ? 8 : 6.5;
  });

  y += 8;
  doc.setFillColor(252, 252, 253);
  doc.roundedRect(margin, y, pageW - margin * 2, 28, 2, 2, "F");
  y += 7;
  line("Terms & Conditions", margin + 4, y, { size: 8, style: "bold", color: [156, 163, 175] });
  y += 5;
  const terms = [
    "Platform fee is non-refundable.",
    "Venue cancellation policy as agreed at booking applies.",
    "This document confirms receipt of the payment listed above.",
  ];
  terms.forEach((t) => {
    line(`• ${t}`, margin + 4, y, { size: 8, color: [75, 85, 99] });
    y += 4.5;
  });

  y = Math.max(y + 16, 250);
  line("Authorized Signature", pageW - margin - 45, y, {
    align: "center",
    size: 9,
    color: [107, 114, 128],
  });
  doc.setDrawColor(17, 24, 39);
  doc.line(pageW - margin - 70, y - 4, pageW - margin - 20, y - 4);

  y = 285;
  line("Generated by VelvetVenues", pageW / 2, y, {
    align: "center",
    size: 8,
    color: [156, 163, 175],
  });

  const filename = `${invoice.invoiceNo || "invoice"}.pdf`;
  doc.save(filename);
  return true;
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
