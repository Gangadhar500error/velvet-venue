import type { BusinessProfile } from "./types";
import { jsPDF } from "jspdf";
import { formatDate } from "./data";

const EXPORT_HEADERS = [
  "Business ID",
  "Business Name",
  "Legal Business Name",
  "Business Type",
  "Owner Name",
  "Owner Email",
  "Owner Phone",
  "City",
  "Country",
  "State",
  "GST Number",
  "Status",
  "Verification",
  "Total Venues",
  "Created Date",
] as const;

const IMPORT_TEMPLATE_HEADERS = [
  "Business Name",
  "Legal Business Name",
  "Business Type",
  "Owner Email",
  "City",
  "Country",
  "State",
  "Status",
  "Verification",
  "Support Email",
  "Support Phone",
  "Address Line 1",
  "GST Number",
  "PAN Number",
] as const;

export type BusinessProfileImportRow = {
  businessName: string;
  legalBusinessName: string;
  businessType: string;
  ownerEmail: string;
  city?: string;
  country?: string;
  state?: string;
  status?: string;
  verification?: string;
  supportEmail?: string;
  supportPhone?: string;
  addressLine1?: string;
  gstNumber?: string;
  panNumber?: string;
};

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

function rowValues(b: BusinessProfile) {
  return {
    businessId: b.businessId || "",
    businessName: b.businessName || "",
    legalBusinessName: b.legalBusinessName || "",
    businessType: b.businessType || "",
    ownerName: b.ownerName || "",
    ownerEmail: b.ownerEmail || "",
    ownerPhone: (b.ownerPhone || "").trim(),
    city: b.city || "",
    country: b.country || "",
    state: b.state || "",
    gstNumber: b.gstNumber || "",
    status: b.status || "",
    verification: b.verification || "",
    totalVenues: b.totalVenues || 0,
    createdDate: formatExportDate(b.createdAt),
  };
}

export function exportBusinessProfilesCsv(rows: BusinessProfile[], filename: string) {
  const lines = [
    EXPORT_HEADERS.join(","),
    ...rows.map((b) => {
      const r = rowValues(b);
      return [
        escapeCsv(r.businessId),
        escapeCsv(r.businessName),
        escapeCsv(r.legalBusinessName),
        escapeCsv(r.businessType),
        escapeCsv(r.ownerName),
        escapeCsv(r.ownerEmail),
        excelTextCsv(r.ownerPhone),
        escapeCsv(r.city),
        escapeCsv(r.country),
        escapeCsv(r.state),
        escapeCsv(r.gstNumber),
        escapeCsv(r.status),
        escapeCsv(r.verification),
        escapeCsv(r.totalVenues),
        excelTextCsv(r.createdDate),
      ].join(",");
    }),
  ];
  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportBusinessProfilesExcel(rows: BusinessProfile[], filename: string) {
  const textStyle = "mso-number-format:'\\@'";
  const body = rows
    .map((b) => {
      const r = rowValues(b);
      return `<tr>
        <td>${escapeHtml(r.businessId)}</td>
        <td>${escapeHtml(r.businessName)}</td>
        <td>${escapeHtml(r.legalBusinessName)}</td>
        <td>${escapeHtml(r.businessType)}</td>
        <td>${escapeHtml(r.ownerName)}</td>
        <td>${escapeHtml(r.ownerEmail)}</td>
        <td style="${textStyle}">${escapeHtml(r.ownerPhone)}</td>
        <td>${escapeHtml(r.city)}</td>
        <td>${escapeHtml(r.country)}</td>
        <td>${escapeHtml(r.state)}</td>
        <td>${escapeHtml(r.gstNumber)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.verification)}</td>
        <td>${r.totalVenues}</td>
        <td style="${textStyle}">${escapeHtml(r.createdDate)}</td>
      </tr>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${EXPORT_HEADERS.map(
    (h) => `<th>${h}</th>`
  ).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel");
}

export function exportBusinessProfilesPdf(rows: BusinessProfile[], filenameStamp: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const headers = [
    "Business ID",
    "Business Name",
    "Owner",
    "Type",
    "City",
    "Venues",
    "Verification",
    "Status",
    "Created",
  ];
  const widths = [26, 42, 34, 28, 24, 16, 24, 20, 24];
  const startX = margin;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Business Profiles Export", startX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Generated ${filenameStamp} · ${rows.length} records`, startX, y);
  doc.setTextColor(0);
  y += 8;

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

  rows.forEach((b) => {
    if (y > pageH - 14) {
      doc.addPage();
      y = 14;
      drawHeader();
    }
    const r = rowValues(b);
    const vals = [
      r.businessId,
      r.businessName,
      r.ownerName,
      r.businessType,
      r.city,
      String(r.totalVenues),
      r.verification,
      r.status,
      r.createdDate,
    ];
    let x = startX;
    doc.setFontSize(7.5);
    vals.forEach((v, i) => {
      const text = doc.splitTextToSize(String(v || "—"), widths[i] - 1);
      doc.text(text[0] || "—", x, y);
      x += widths[i];
    });
    y += 6;
  });

  doc.save(`business-profiles-${filenameStamp}.pdf`);
  return true;
}

export function downloadBusinessProfileImportTemplate() {
  const sample = [
    "Sunrise Events Pvt Ltd",
    "Sunrise Events Private Limited",
    "Private Limited",
    "owner@example.com",
    "Hyderabad",
    "India",
    "Telangana",
    "pending",
    "pending",
    "support@sunrise.example.com",
    "+91 98765 43210",
    "12 MG Road",
    "36AAAAA0000A1Z5",
    "AAAAA0000A",
  ];
  const lines = [IMPORT_TEMPLATE_HEADERS.join(","), sample.map(escapeCsv).join(",")];
  downloadBlob(lines.join("\n"), "business-profiles-import-template.csv", "text/csv;charset=utf-8;");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<keyof BusinessProfileImportRow, string[]> = {
  businessName: ["businessname", "business", "name", "company"],
  legalBusinessName: ["legalbusinessname", "legalname", "registeredname"],
  businessType: ["businesstype", "type"],
  ownerEmail: ["owneremail", "email", "venueowneremail", "owner"],
  city: ["city"],
  country: ["country"],
  state: ["state", "province"],
  status: ["status", "accountstatus"],
  verification: ["verification", "verificationstatus"],
  supportEmail: ["supportemail"],
  supportPhone: ["supportphone", "phone", "mobile"],
  addressLine1: ["address", "addressline1", "address1"],
  gstNumber: ["gst", "gstnumber"],
  panNumber: ["pan", "pannumber"],
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
      } else if (ch === '"') inQuotes = false;
      else cell += ch;
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
  return Array.from(doc.querySelectorAll("table tr"))
    .map((tr) =>
      Array.from(tr.querySelectorAll("th,td")).map((cell) => (cell.textContent || "").trim())
    )
    .filter((r) => r.some((v) => v));
}

function mapRowsToImport(matrix: string[][]): BusinessProfileImportRow[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map(normalizeHeader);
  const indexOf = (key: keyof BusinessProfileImportRow) => {
    const aliases = HEADER_ALIASES[key];
    return headers.findIndex((h) => aliases.includes(h));
  };
  const businessNameIdx = indexOf("businessName");
  const legalIdx = indexOf("legalBusinessName");
  const typeIdx = indexOf("businessType");
  const ownerEmailIdx = indexOf("ownerEmail");
  if (businessNameIdx < 0 || typeIdx < 0 || ownerEmailIdx < 0) {
    throw new Error("Import file must include Business Name, Business Type, and Owner Email columns.");
  }
  const get = (cols: string[], idx: number) => (idx >= 0 ? cols[idx] || "" : "");

  return matrix.slice(1).flatMap((cols) => {
    const businessName = get(cols, businessNameIdx);
    const businessType = get(cols, typeIdx);
    const ownerEmail = get(cols, ownerEmailIdx).toLowerCase();
    if (!businessName || !businessType || !ownerEmail) return [];
    const legalBusinessName = get(cols, legalIdx) || businessName;
    return [
      {
        businessName,
        legalBusinessName,
        businessType,
        ownerEmail,
        city: get(cols, indexOf("city")) || undefined,
        country: get(cols, indexOf("country")) || undefined,
        state: get(cols, indexOf("state")) || undefined,
        status: get(cols, indexOf("status")) || undefined,
        verification: get(cols, indexOf("verification")) || undefined,
        supportEmail: get(cols, indexOf("supportEmail")) || undefined,
        supportPhone: get(cols, indexOf("supportPhone")) || undefined,
        addressLine1: get(cols, indexOf("addressLine1")) || undefined,
        gstNumber: get(cols, indexOf("gstNumber")) || undefined,
        panNumber: get(cols, indexOf("panNumber")) || undefined,
      },
    ];
  });
}

export async function parseBusinessProfileImportFile(
  file: File
): Promise<BusinessProfileImportRow[]> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  const matrix =
    lower.endsWith(".xls") || lower.endsWith(".html") || text.includes("<table")
      ? parseExcelHtml(text)
      : parseCsvText(text.replace(/^\uFEFF/, ""));
  return mapRowsToImport(matrix);
}
