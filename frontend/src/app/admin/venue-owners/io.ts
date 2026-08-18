import type { VenueOwner } from "./types";
import { jsPDF } from "jspdf";
import { formatDate } from "./data";

const EXPORT_HEADERS = [
  "Owner ID",
  "First Name",
  "Last Name",
  "Email",
  "Mobile",
  "Business Name",
  "Business Type",
  "City",
  "Country",
  "State",
  "Status",
  "Verification",
  "Source",
  "Assigned Businesses",
  "Venues",
  "Registration Date",
] as const;

const IMPORT_TEMPLATE_HEADERS = [
  "First Name",
  "Last Name",
  "Email",
  "Mobile",
  "Business Name",
  "Business Type",
  "City",
  "Country",
  "State",
  "Status",
  "Verification",
  "Source",
  "Address Line 1",
] as const;

export type VenueOwnerImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  businessName?: string;
  businessType?: string;
  city?: string;
  country?: string;
  state?: string;
  status?: string;
  verification?: string;
  source?: string;
  addressLine1?: string;
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

function rowValues(o: VenueOwner) {
  const nameParts = (o.name || "").trim().split(/\s+/);
  return {
    ownerId: o.ownerId || "",
    firstName: o.firstName || nameParts[0] || "",
    lastName: o.lastName || nameParts.slice(1).join(" ") || "",
    email: o.email || "",
    mobile: (o.phone || "").trim(),
    businessName: o.businessName || "",
    businessType: o.businessType || "",
    city: o.city || "",
    country: o.country || "",
    state: o.state || "",
    status: o.status || "",
    verification: o.verification || "",
    source: o.source || "",
    businesses: o.assignedBusinesses || 0,
    venues: o.totalVenues || 0,
    registrationDate: formatExportDate(o.registrationDate),
  };
}

export function exportVenueOwnersCsv(rows: VenueOwner[], filename: string) {
  const lines = [
    EXPORT_HEADERS.join(","),
    ...rows.map((o) => {
      const r = rowValues(o);
      return [
        escapeCsv(r.ownerId),
        escapeCsv(r.firstName),
        escapeCsv(r.lastName),
        escapeCsv(r.email),
        excelTextCsv(r.mobile),
        escapeCsv(r.businessName),
        escapeCsv(r.businessType),
        escapeCsv(r.city),
        escapeCsv(r.country),
        escapeCsv(r.state),
        escapeCsv(r.status),
        escapeCsv(r.verification),
        escapeCsv(r.source),
        escapeCsv(r.businesses),
        escapeCsv(r.venues),
        excelTextCsv(r.registrationDate),
      ].join(",");
    }),
  ];
  downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8;");
}

export function exportVenueOwnersExcel(rows: VenueOwner[], filename: string) {
  const textStyle = "mso-number-format:'\\@'";
  const body = rows
    .map((o) => {
      const r = rowValues(o);
      return `<tr>
        <td>${escapeHtml(r.ownerId)}</td>
        <td>${escapeHtml(r.firstName)}</td>
        <td>${escapeHtml(r.lastName)}</td>
        <td>${escapeHtml(r.email)}</td>
        <td style="${textStyle}">${escapeHtml(r.mobile)}</td>
        <td>${escapeHtml(r.businessName)}</td>
        <td>${escapeHtml(r.businessType)}</td>
        <td>${escapeHtml(r.city)}</td>
        <td>${escapeHtml(r.country)}</td>
        <td>${escapeHtml(r.state)}</td>
        <td>${escapeHtml(r.status)}</td>
        <td>${escapeHtml(r.verification)}</td>
        <td>${escapeHtml(r.source)}</td>
        <td>${r.businesses}</td>
        <td>${r.venues}</td>
        <td style="${textStyle}">${escapeHtml(r.registrationDate)}</td>
      </tr>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body><table><thead><tr>${EXPORT_HEADERS.map(
    (h) => `<th>${h}</th>`
  ).join("")}</tr></thead><tbody>${body}</tbody></table></body></html>`;
  downloadBlob(html, filename, "application/vnd.ms-excel");
}

export function exportVenueOwnersPdf(rows: VenueOwner[], filenameStamp: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const headers = [
    "Owner ID",
    "Name",
    "Email",
    "Mobile",
    "City",
    "Businesses",
    "Venues",
    "Verification",
    "Status",
    "Registered",
  ];
  const widths = [24, 36, 48, 28, 24, 18, 16, 22, 18, 24];
  const startX = margin;
  let y = 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(17, 24, 39);
  doc.text("VelvetVenues — Venue Owners Report", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`Generated ${filenameStamp} · ${rows.length} owner(s)`, margin, y);
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
    while (out.length > 1 && doc.getTextWidth(`${out}…`) > maxW) out = out.slice(0, -1);
    return `${out}…`;
  };

  rows.forEach((o, idx) => {
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
    const r = rowValues(o);
    const values = [
      r.ownerId,
      `${r.firstName} ${r.lastName}`.trim(),
      r.email,
      r.mobile,
      r.city,
      String(r.businesses),
      String(r.venues),
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

  doc.save(`venue-owners-${filenameStamp}.pdf`);
  return true;
}

export function downloadVenueOwnerImportTemplate() {
  const sample = [
    "Ravi",
    "Kumar",
    "ravi.kumar@example.com",
    "+91 98765 43210",
    "Kumar Events",
    "Private Limited",
    "Hyderabad",
    "India",
    "Telangana",
    "active",
    "pending",
    "admin",
    "12 MG Road",
  ];
  const lines = [IMPORT_TEMPLATE_HEADERS.join(","), sample.map(escapeCsv).join(",")];
  downloadBlob(lines.join("\n"), "venue-owners-import-template.csv", "text/csv;charset=utf-8;");
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

const HEADER_ALIASES: Record<keyof VenueOwnerImportRow, string[]> = {
  firstName: ["firstname", "first", "ownerfirstname"],
  lastName: ["lastname", "last", "ownerlastname"],
  email: ["email", "emailaddress", "mail"],
  mobile: ["mobile", "phone", "phonenumber", "contact", "mobilenumber"],
  businessName: ["businessname", "business", "company"],
  businessType: ["businesstype", "type"],
  city: ["city"],
  country: ["country"],
  state: ["state", "province"],
  status: ["status", "accountstatus"],
  verification: ["verification", "verificationstatus"],
  source: ["source", "registrationsource"],
  addressLine1: ["address", "addressline1", "address1"],
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

function mapRowsToImport(matrix: string[][]): VenueOwnerImportRow[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0].map(normalizeHeader);
  const indexOf = (key: keyof VenueOwnerImportRow) => {
    const aliases = HEADER_ALIASES[key];
    return headers.findIndex((h) => aliases.includes(h));
  };
  const nameIdx = headers.findIndex((h) => h === "name" || h === "fullname" || h === "ownername");
  const firstIdx = indexOf("firstName");
  const lastIdx = indexOf("lastName");
  const emailIdx = indexOf("email");
  const mobileIdx = indexOf("mobile");
  if (emailIdx < 0 || mobileIdx < 0) {
    throw new Error("Import file must include Email and Mobile columns.");
  }
  const get = (cols: string[], idx: number) => (idx >= 0 ? cols[idx] || "" : "");

  return matrix.slice(1).flatMap((cols) => {
    const email = get(cols, emailIdx).toLowerCase();
    const mobile = get(cols, mobileIdx);
    if (!email || !mobile) return [];
    let firstName = get(cols, firstIdx);
    let lastName = get(cols, lastIdx);
    if (!firstName && nameIdx >= 0) {
      const parts = get(cols, nameIdx).trim().split(/\s+/);
      firstName = parts[0] || email.split("@")[0] || "Owner";
      lastName = parts.slice(1).join(" ");
    }
    if (!firstName) firstName = email.split("@")[0] || "Owner";
    return [
      {
        firstName,
        lastName,
        email,
        mobile,
        businessName: get(cols, indexOf("businessName")) || undefined,
        businessType: get(cols, indexOf("businessType")) || undefined,
        city: get(cols, indexOf("city")) || undefined,
        country: get(cols, indexOf("country")) || undefined,
        state: get(cols, indexOf("state")) || undefined,
        status: get(cols, indexOf("status")) || undefined,
        verification: get(cols, indexOf("verification")) || undefined,
        source: get(cols, indexOf("source")) || undefined,
        addressLine1: get(cols, indexOf("addressLine1")) || undefined,
      },
    ];
  });
}

export async function parseVenueOwnerImportFile(file: File): Promise<VenueOwnerImportRow[]> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  const matrix =
    lower.endsWith(".xls") || lower.endsWith(".html") || text.includes("<table")
      ? parseExcelHtml(text)
      : parseCsvText(text.replace(/^\uFEFF/, ""));
  return mapRowsToImport(matrix);
}
