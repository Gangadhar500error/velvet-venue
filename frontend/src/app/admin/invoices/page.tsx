"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Columns3,
  Download,
  FileDown,
  Filter,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { notify } from "../_components/ui/Toast";
import { useDemoStore } from "../store/demoStore";
import { findInvoiceContext } from "../_components/relations";
import { FilterPanel } from "./components/FilterPanel";
import { InvoiceTable, columnLabels } from "./components/InvoiceTable";
import {
  buildInvoiceRows,
  deriveInvoiceStatus,
  exportInvoicesCsv,
  exportInvoicesExcel,
  filterInvoiceRows,
  sortInvoiceRows,
} from "./data";
import { downloadInvoicePdf, openInvoicePrintWindow } from "./components/printInvoice";
import type { InvoiceColumnKey, InvoiceFilters, InvoiceListRow, TableDensity } from "./types";

const defaultFilters: InvoiceFilters = {
  search: "",
  invoiceStatus: "",
  datePreset: "",
  dateFrom: "",
  dateTo: "",
  paymentMethod: "",
  businessId: "",
  venueId: "",
  vendorId: "",
  customerId: "",
};

const defaultColumns: Record<InvoiceColumnKey, boolean> = {
  invoiceNo: true,
  invoiceDate: true,
  customer: true,
  venue: true,
  business: true,
  bookingId: true,
  paymentType: true,
  invoiceAmount: true,
  paid: true,
  balance: true,
  paymentStatus: true,
  invoiceStatus: true,
  actions: true,
};

export default function InvoicesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const bookings = useDemoStore((s) => s.bookings);
  const [filters, setFilters] = useState<InvoiceFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<InvoiceFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("invoiceDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [density] = useState<TableDensity>("compact");
  const columnsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const allRows = useMemo(() => buildInvoiceRows(bookings), [bookings]);

  const activeFilterCount = useMemo(() => {
    const f = appliedFilters;
    return [
      f.invoiceStatus,
      f.datePreset,
      f.dateFrom,
      f.dateTo,
      f.paymentMethod,
      f.businessId,
      f.venueId,
      f.vendorId,
      f.customerId,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const filtered = useMemo(() => {
    const list = filterInvoiceRows(allRows, appliedFilters);
    return sortInvoiceRows(list, sortKey, sortDir);
  }, [allRows, appliedFilters, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [appliedFilters, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setAppliedFilters((prev) => ({ ...prev, search: value }));
  };

  const selectedRows = useMemo(
    () => filtered.filter((r) => selectedIds.includes(r.id)),
    [filtered, selectedIds]
  );
  const exportRows = selectedRows.length > 0 ? selectedRows : filtered;

  const runExport = (format: "csv" | "excel" | "pdf") => {
    setExportOpen(false);
    const stamp = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      exportInvoicesCsv(exportRows, `invoices-${stamp}.csv`);
      notify.exported();
      return;
    }
    if (format === "excel") {
      exportInvoicesExcel(exportRows, `invoices-${stamp}.xls`);
      notify.exported();
      return;
    }
    // PDF report: open printable summary
    const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!w) {
      notify.error("Unable to open print window. Allow pop-ups and try again.");
      return;
    }
    const rowsHtml = exportRows
      .map(
        (r) =>
          `<tr>
            <td>${r.invoiceNo}</td>
            <td>${r.invoiceDate.slice(0, 10)}</td>
            <td>${r.customerName}</td>
            <td>${r.venueName}</td>
            <td>${r.bookingId}</td>
            <td>${r.invoiceAmount}</td>
            <td>${r.remainingBalance}</td>
            <td>${r.invoiceStatus}</td>
          </tr>`
      )
      .join("");
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice Report</title>
      <style>
        body{font-family:Segoe UI,Arial,sans-serif;padding:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px} p{color:#666;margin:0 0 16px;font-size:13px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #e5e7eb;padding:8px;text-align:left}
        th{background:#fcfcfd}
        @media print{body{padding:0}}
      </style></head><body>
      <h1>VelvetVenues — Invoice Report</h1>
      <p>Generated ${stamp} · ${exportRows.length} invoice(s)</p>
      <table><thead><tr>
        <th>Invoice No</th><th>Date</th><th>Customer</th><th>Venue</th>
        <th>Booking</th><th>Amount</th><th>Balance</th><th>Status</th>
      </tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`);
    w.document.close();
    notify.downloaded();
  };

  const handleInvoiceAction = (row: InvoiceListRow, action: "print" | "download") => {
    const ctx = findInvoiceContext(bookings, row.invoiceNo);
    if (!ctx) {
      notify.error("Invoice not found.");
      return;
    }
    const txn = (ctx.booking.transactions || []).find(
      (t) => t.transactionId === ctx.invoice.transactionId || t.invoiceNo === ctx.invoice.invoiceNo
    );
    const args = {
      booking: ctx.booking,
      invoice: ctx.invoice,
      txn,
      invoiceStatus: deriveInvoiceStatus(ctx.invoice, ctx.booking, txn),
      customerAddress: ctx.booking.customerCity,
    };
    if (action === "print") {
      const ok = openInvoicePrintWindow({ ...args, autoPrint: true });
      if (!ok) notify.error("Unable to open print window. Allow pop-ups and try again.");
      return;
    }
    try {
      downloadInvoicePdf(args);
      notify.downloaded();
    } catch {
      notify.error("Unable to download invoice PDF. Please try again.");
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Invoices"
        subtitle="Manage all customer payment invoices generated from bookings."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Finance" },
          { label: "Invoices" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative" ref={exportRef}>
              <Button
                variant="secondary"
                icon={Download}
                onClick={() => setExportOpen((v) => !v)}
              >
                Export
              </Button>
              {exportOpen && (
                <div className="absolute right-0 top-11 z-20 w-44 rounded-[12px] border border-[#E8EAF0] bg-white shadow-lg py-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#F8F9FB]"
                    onClick={() => runExport("csv")}
                  >
                    Export CSV
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#F8F9FB]"
                    onClick={() => runExport("excel")}
                  >
                    Export Excel
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#F8F9FB]"
                    onClick={() => runExport("pdf")}
                  >
                    Export PDF
                  </button>
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              icon={FileDown}
              onClick={() => runExport("pdf")}
            >
              Download Report
            </Button>
          </div>
        }
      />

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="px-4 py-3.5 flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            <input
              value={filters.search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search invoice no, booking ID, customer, venue, business, phone, transaction…"
              className="w-full h-10 pl-10 pr-3.5 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={Filter}
              onClick={() => setFiltersOpen((v) => !v)}
              className={
                filtersOpen || activeFilterCount > 0
                  ? "!border-[#C89B3C]/40 !bg-[#FFF3EB] !text-[#C89B3C]"
                  : ""
              }
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C89B3C] text-white text-[10px] font-semibold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="relative" ref={columnsRef}>
              <Button
                variant="secondary"
                size="sm"
                icon={Columns3}
                onClick={() => setColumnsOpen((v) => !v)}
              >
                Columns
              </Button>
              {columnsOpen && (
                <div className="absolute right-0 top-11 z-20 w-56 rounded-[12px] border border-[#E8EAF0] bg-white shadow-lg p-2 max-h-72 overflow-y-auto">
                  {(Object.keys(columnLabels) as InvoiceColumnKey[]).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8F9FB] text-sm text-[#374151] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        disabled={key === "actions" || key === "invoiceNo"}
                        onChange={() =>
                          setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                      />
                      {columnLabels[key]}
                    </label>
                  ))}
                </div>
              )}
            </div>

            <Button variant="secondary" size="sm" onClick={() => notify.viewSaved()}>
              Save View
            </Button>
          </div>
        </div>
      </div>

      <FilterPanel
        open={filtersOpen}
        filters={filters}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onApply={() => {
          setAppliedFilters(filters);
          setFiltersOpen(false);
          notify.filtersApplied();
        }}
        onReset={() => {
          setFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
          notify.filtersReset();
        }}
        onClose={() => setFiltersOpen(false)}
        onSave={() => notify.viewSaved()}
        activeCount={activeFilterCount}
      />

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#FFD4B0] bg-[#FFF8F3] px-4 py-2.5">
          <span className="text-sm font-medium text-[#9A3412]">
            {selectedIds.length} selected
          </span>
          <Button variant="secondary" size="sm" onClick={() => runExport("csv")}>
            Export
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
            Clear
          </Button>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          <div className="h-10 bg-[#F3F4F6] rounded-lg" />
          <div className="h-64 bg-[#F3F4F6] rounded-lg" />
        </div>
      ) : (
        <InvoiceTable
          rows={pageItems}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onToggleSelectAll={() => {
            if (selectedIds.length === pageItems.length) setSelectedIds([]);
            else setSelectedIds(pageItems.map((r) => r.id));
          }}
          density={density}
          visibleColumns={visibleColumns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onPrint={(row) => handleInvoiceAction(row, "print")}
          onDownload={(row) => handleInvoiceAction(row, "download")}
          onEmail={(row) =>
            router.push(`/admin/invoices/${encodeURIComponent(row.invoiceNo)}?email=1`)
          }
        />
      )}

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-[#6B7280]">
          Showing{" "}
          <span className="font-semibold text-[#111827]">
            {filtered.length === 0 ? 0 : startIndex + 1}
          </span>
          –
          <span className="font-semibold text-[#111827]">
            {Math.min(startIndex + pageSize, filtered.length)}
          </span>{" "}
          of <span className="font-semibold text-[#111827]">{filtered.length}</span> invoices
        </p>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 px-2.5 rounded-lg border border-[#E8EAF0] text-sm text-[#4B5563] bg-white"
          >
            {[10, 25, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-[#6B7280] px-1">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
