import type { Venue } from "./types";
import { jsPDF } from "jspdf";
import { formatDate } from "./data";

const EXPORT_HEADERS = [
  "Venue ID",
  "Venue Name",
  "Business Name",
  "Owner Name",
  "Category",
  "City",
  "Capacity",
  "Starting Price",
  "Bookings",
  "Rating",
  "Approval",
  "Status",
  "Featured",
  "Created Date",
] as const;

function escapeCsv(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function excelTextCsv(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value).trim();
  if (!raw) return '""';
  return `"=""${raw.replace(/"/g, '""')}"""`;
}

function formatExportDate(value?: string | null) {
  if (!value) return "";
  const formatted = formatDate(value);
  return formatted === "—" ? "" : formatted;
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

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rowValues(v: Venue) {
  return {
    venueId: v.venueId || "",
    venueName: v.name || "",
    businessName: v.businessName || "",
    ownerName: v.ownerName || "",
    category: v.category || "",
    city: v.city || "",
    capacity: v.seatingCapacity || 0,
    startingPrice: v.startingPrice || 0,
    bookings: v.totalBookings || 0,
    rating: v.rating || 0,
    approval: v.approval || "",
    status: v.status || "",
    featured: v.featured ? "Yes" : "No",
    createdDate: formatExportDate(v.createdAt),
  };
}

export function exportVenuesCsv(rows: Venue[], filename: string) {
  const lines = [
    EXPORT_HEADERS.join(","),
    ...rows.map((v) => {
      const r = rowValues(v);
      return [
        escapeCsv(r.venueId),
        escapeCsv(r.venueName),
        escapeCsv(r.businessName),
        escapeCsv(r.ownerName),
        escapeCsv(r.category),
        escapeCsv(r.city),
        escapeCsv(r.capacity),
        escapeCsv(r.startingPrice),
        escapeCsv(r.bookings),
        escapeCsv(r.rating),
        escapeCsv(r.approval),
        escapeCsv(r.status),
        escapeCsv(r.featured),
        excelTextCsv(r.createdDate),
      ].join(",");
    }),
  ];
  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportVenuesExcel(rows: Venue[], filename: string) {
  const textStyle = "mso-number-format:'\\@'";
  const body = rows
    .map((v) => {
      const r = rowValues(v);
      return `<tr>
        <td>${escapeHtml(r.venueId)}</td>
        <td>${escapeHtml(r.venueName)}</td>
        <td>${escapeHtml(r.businessName)}</td>
        <td>${escapeHtml(r.ownerName)}</td>
        <td>${escapeHtml(r.category)}</td>
        <td>${escapeHtml(r.city)}</td>
        <td>${escapeHtml(String(r.capacity))}</td>
        <td>${escapeHtml(String(r.startingPrice))}</td>
        <td>${escapeHtml(String(r.bookings))}</td>
        <td>${escapeHtml(String(r.rating))}</td>
        <td>${escapeHtml(r.approval)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.featured)}</td>
        <td style="${textStyle}">${escapeHtml(r.createdDate)}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>
    <table border="1">
      <thead><tr>${EXPORT_HEADERS.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${body}</tbody>
    </table>
  </body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel;charset=utf-8;");
}

export function exportVenuesPdf(rows: Venue[], filenameStamp: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const margin = 10;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const startX = margin;
  let y = 14;

  const headers = [
    "Venue ID",
    "Name",
    "Business",
    "City",
    "Category",
    "Capacity",
    "Price",
    "Approval",
    "Status",
  ];
  const widths = [28, 40, 40, 28, 28, 20, 22, 24, 22];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Venues Export", startX, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`${rows.length} record(s) · ${filenameStamp}`, startX, y + 5);
  doc.setTextColor(0);
  y += 12;

  const drawHeader = () => {
    let x = startX;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    headers.forEach((h, i) => {
      doc.text(h, x, y);
      x += widths[i];
    });
    y += 2;
    doc.setDrawColor(200);
    doc.line(startX, y, pageW - margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
  };

  drawHeader();

  rows.forEach((v) => {
    if (y > pageH - 14) {
      doc.addPage();
      y = 14;
      drawHeader();
    }
    const r = rowValues(v);
    const vals = [
      r.venueId,
      r.venueName,
      r.businessName,
      r.city,
      r.category,
      String(r.capacity),
      String(r.startingPrice),
      r.approval,
      r.status,
    ];
    let x = startX;
    doc.setFontSize(7.5);
    vals.forEach((val, i) => {
      const text = doc.splitTextToSize(String(val || "—"), widths[i] - 1);
      doc.text(text[0] || "—", x, y);
      x += widths[i];
    });
    y += 6;
  });

  doc.save(`venues-${filenameStamp}.pdf`);
  return true;
}
