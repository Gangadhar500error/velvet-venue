import type { Customer } from "./types";
import { jsPDF } from "jspdf";
import { formatDate } from "./data";

const EXPORT_HEADERS = [
  "Customer ID",
  "Name",
  "Email",
  "Mobile",
  "City",
  "Country",
  "Status",
  "Verification",
  "Source",
  "Bookings",
  "Total Spend",
  "Registration Date",
  "Last Booking",
] as const;

const IMPORT_TEMPLATE_HEADERS = [
  "Name",
  "Email",
  "Mobile",
  "City",
  "Country",
  "State",
  "Status",
  "Verification",
  "Source",
  "Address Line 1",
  "Notes",
] as const;

export type CustomerImportRow = {
  name: string;
  email: string;
  mobile: string;
  city?: string;
  country?: string;
  state?: string;
  status?: string;
  verification?: string;
  source?: string;
  addressLine1?: string;
  notes?: string;
};

function escapeCsv(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

/** Keep phone/dates as literal text when Excel opens the CSV. */
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

function formatExportMobile(value?: string | null) {
  if (!value) return "";
  // Preserve leading +, spaces, and long digit strings as text
  return String(value).trim();
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

function rowValues(c: Customer): {
  customerId: string;
  name: string;
  email: string;
  mobile: string;
  city: string;
  country: string;
  status: string;
  verification: string;
  source: string;
  bookings: number;
  totalSpend: number;
  registrationDate: string;
  lastBooking: string;
} {
  return {
    customerId: c.customerId || "",
    name: c.name || "",
    email: c.email || "",
    mobile: formatExportMobile(c.phone),
    city: c.city || "",
    country: c.country || "",
    status: c.status || "",
    verification: c.verification || "",
    source: c.source || "",
    bookings: c.bookings || 0,
    totalSpend: c.totalSpend || 0,
    registrationDate: formatExportDate(c.registrationDate),
    lastBooking: formatExportDate(c.lastBooking),
  };
}

export function exportCustomersCsv(rows: Customer[], filename: string) {
  const lines = [
    EXPORT_HEADERS.join(","),
    ...rows.map((c) => {
      const r = rowValues(c);
      return [
        escapeCsv(r.customerId),
        escapeCsv(r.name),
        escapeCsv(r.email),
        excelTextCsv(r.mobile),
        escapeCsv(r.city),
        escapeCsv(r.country),
        escapeCsv(r.status),
        escapeCsv(r.verification),
        escapeCsv(r.source),
        escapeCsv(r.bookings),
        escapeCsv(r.totalSpend),
        excelTextCsv(r.registrationDate),
        excelTextCsv(r.lastBooking),
      ].join(",");
    }),
  ];
  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportCustomersExcel(rows: Customer[], filename: string) {
  const textStyle = "mso-number-format:'\\@'";
  const body = rows
    .map((c) => {
      const r = rowValues(c);
      return `<tr>
        <td>${escapeHtml(r.customerId)}</td>
        <td>${escapeHtml(r.name)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td style="${textStyle}">${escapeHtml(r.mobile)}</td>
        <td>${escapeHtml(r.city)}</td>
        <td>${escapeHtml(r.country)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.verification)}</td>
        <td>${escapeHtml(r.source)}</td>
        <td>${r.bookings}</td>
        <td>${r.totalSpend}</td>
        <td style="${textStyle}">${escapeHtml(r.registrationDate)}</td>
        <td style="${textStyle}">${escapeHtml(r.lastBooking)}</td>
      </tr>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${EXPORT_HEADERS.map(
    (h) => `<th>${h}</th>`
  ).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function exportCustomersPdf(rows: Customer[], filenameStamp: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const headers = [
    "Customer ID",
    "Name",
    "Email",
    "Mobile",
    "City",
    "Bookings",
    "Spend",
    "Verification",
    "Status",
    "Registered",
  ];
  // Column widths tuned for landscape A4
  const widths = [24, 32, 48, 28, 24, 16, 20, 22, 18, 24];
  const startX = margin;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("VelvetVenues — Customers Report", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated ${filenameStamp} · ${rows.length} customer(s)`, margin, y);
  y += 8;

  const drawHeader = () => {
    doc.setFillColor(252, 252, 253);
    doc.rect(margin, y - 4, pageW - margin * 2, 8, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    let x = startX;
    headers.forEach((h, i) => {
      doc.text(h, x + 1, y);
      x += widths[i];
    });
    y += 6;
    doc.setDrawColor(232, 234, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, y - 2, pageW - margin, y - 2);
  };

  drawHeader();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);

  const clip = (text: string, maxW: number) => {
    const t = text || "—";
    if (doc.getTextWidth(t) <= maxW) return t;
    let out = t;
    while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxW) {
      out = out.slice(0, -1);
    }
    return `${out}…`;
  };

  rows.forEach((c, idx) => {
    if (y > pageH - 12) {
      doc.addPage();
      y = 14;
      drawHeader();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
    }

    if (idx % 2 === 1) {
      doc.setFillColor(250, 251, 252);
      doc.rect(margin, y - 3.5, pageW - margin * 2, 6.5, "F");
    }

    const r = rowValues(c);
    const values = [
      r.customerId,
      r.name,
      r.email,
      r.mobile,
      r.city,
      String(r.bookings),
      String(r.totalSpend),
      r.verification,
      r.status,
      r.registrationDate,
    ];

    let x = startX;
    values.forEach((value, i) => {
      doc.text(clip(value, widths[i] - 2), x + 1, y);
      x += widths[i];
    });
    y += 6.5;
  });

  doc.save(`customers-${filenameStamp}.pdf`);
  return true;
}

export function downloadCustomerImportTemplate() {
  const sample = [
    "Aarav Sharma",
    "aarav.sharma@example.com",
    "+91 98765 43210",
    "Hyderabad",
    "India",
    "Telangana",
    "active",
    "verified",
    "website",
    "12 MG Road",
    "",
  ];
  const lines = [IMPORT_TEMPLATE_HEADERS.join(","), sample.map(escapeCsv).join(",")];
  downloadBlob(lines.join("\n"), "customers-import-template.csv", "text/csv;charset=utf-8;");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<keyof CustomerImportRow, string[]> = {
  name: ["name", "fullname", "customername", "customer"],
  email: ["email", "emailaddress", "mail"],
  mobile: ["mobile", "phone", "phonenumber", "contact", "mobilenumber"],
  city: ["city"],
  country: ["country"],
  state: ["state"],
  status: ["status", "accountstatus"],
  verification: ["verification", "verificationstatus", "verified"],
  source: ["source", "registrationsource"],
  addressLine1: ["address", "addressline1", "address1"],
  notes: ["notes", "note", "remarks"],
};

function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((v) => v)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell.trim());
  if (row.some((v) => v)) rows.push(row);
  return rows;
}

function parseExcelHtml(text: string): string[][] {
  const doc = new DOMParser().parseFromString(text, "text/html");
  const trs = Array.from(doc.querySelectorAll("table tr"));
  return trs
    .map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((cell) =>
        (cell.textContent || "").trim()
      )
    )
    .filter((r) => r.some((v) => v));
}

function mapRowsToImport(matrix: string[][]): CustomerImportRow[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map(normalizeHeader);
  const indexOf = (key: keyof CustomerImportRow) => {
    const aliases = HEADER_ALIASES[key];
    return headers.findIndex((h) => aliases.includes(h));
  };

  const nameIdx = indexOf("name");
  const emailIdx = indexOf("email");
  const mobileIdx = indexOf("mobile");
  if (emailIdx < 0 || mobileIdx < 0) {
    throw new Error("Import file must include Email and Mobile columns.");
  }

  const get = (cols: string[], idx: number) => (idx >= 0 ? cols[idx] || "" : "");

  return matrix.slice(1).flatMap((cols) => {
    const email = get(cols, emailIdx).toLowerCase();
    const mobile = get(cols, mobileIdx);
    const name = get(cols, nameIdx) || email.split("@")[0] || "Customer";
    if (!email || !mobile) return [];
    return [
      {
        name,
        email,
        mobile,
        city: get(cols, indexOf("city")) || undefined,
        country: get(cols, indexOf("country")) || undefined,
        state: get(cols, indexOf("state")) || undefined,
        status: get(cols, indexOf("status")) || undefined,
        verification: get(cols, indexOf("verification")) || undefined,
        source: get(cols, indexOf("source")) || undefined,
        addressLine1: get(cols, indexOf("addressLine1")) || undefined,
        notes: get(cols, indexOf("notes")) || undefined,
      },
    ];
  });
}

export async function parseCustomerImportFile(file: File): Promise<CustomerImportRow[]> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  const matrix =
    lower.endsWith(".xls") || lower.endsWith(".html") || text.includes("<table")
      ? parseExcelHtml(text)
      : parseCsvText(text.replace(/^\uFEFF/, ""));
  return mapRowsToImport(matrix);
}
