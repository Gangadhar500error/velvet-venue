"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Columns3,
  Download,
  Filter,
  Plus,
  Search,
  Upload,
} from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { FilterPanel } from "./components/FilterPanel";
import { CustomerTable, columnLabels } from "./components/CustomerTable";
import { confirmAction, notify } from "../_components/ui/Toast";
import {
  Customer,
  CustomerColumnKey,
  CustomerFilters,
  CustomerFormValues,
  CustomerStatus,
  RegistrationSource,
  VerificationStatus,
} from "./types";
import {
  createCustomer,
  deleteCustomer,
  fetchAllCustomersForExport,
  fetchCustomers,
  filtersToParams,
  formToCreatePayload,
  mapCustomerListItem,
  updateCustomerStatus,
} from "@/lib/customers";
import { PermissionGate } from "@/components/PermissionGate";
import {
  downloadCustomerImportTemplate,
  exportCustomersCsv,
  exportCustomersExcel,
  exportCustomersPdf,
  parseCustomerImportFile,
} from "./io";

const defaultFilters: CustomerFilters = {
  search: "",
  status: "",
  city: "",
  source: "",
  verification: "",
  dateFrom: "",
  dateTo: "",
  bookingsMin: "",
  spendMin: "",
};

const defaultColumns: Record<CustomerColumnKey, boolean> = {
  profile: true,
  customerId: true,
  mobile: true,
  email: true,
  city: true,
  bookings: true,
  totalSpend: true,
  registrationDate: true,
  verification: true,
  status: true,
  // lastLogin: false,
  actions: true,
};

type ExportFormat = "csv" | "excel" | "pdf";

function normalizeStatus(value?: string): CustomerStatus {
  const v = (value || "").toLowerCase();
  if (v === "inactive" || v === "blocked" || v === "pending") return v;
  return "active";
}

function normalizeVerification(value?: string): VerificationStatus {
  const v = (value || "").toLowerCase();
  if (v === "verified" || v === "rejected") return v;
  return "pending";
}

function normalizeSource(value?: string): RegistrationSource {
  const v = (value || "").toLowerCase().replace(/\s+/g, "_");
  if (v === "mobile_app" || v === "referral" || v === "admin" || v === "partner") return v;
  if (v === "vendor") return "partner";
  return "website";
}

export default function CustomersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<CustomerFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<CustomerFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filtersToParams(appliedFilters, page, pageSize, sortKey, sortDir);
      const data = await fetchCustomers(params);
      setCustomers(data.items.map(mapCustomerListItem));
      setTotal(data.total);
      setTotalPages(Math.max(1, data.total_pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
      setCustomers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, sortKey, sortDir]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
      if (importRef.current && !importRef.current.contains(e.target as Node)) {
        setImportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeFilterCount = useMemo(() => {
    const f = appliedFilters;
    return [
      f.status,
      f.city,
      f.source,
      f.verification,
      f.dateFrom,
      f.dateTo,
      f.bookingsMin,
      f.spendMin,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const startIndex = total === 0 ? 0 : (page - 1) * pageSize;

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === customers.length) setSelectedIds([]);
    else setSelectedIds(customers.map((c) => c.id));
  };

  const goCreate = () => router.push("/admin/customers/create");
  const goEdit = (customer: Customer) => router.push(`/admin/customers/${customer.id}/edit`);

  const handleDelete = async (customer: Customer) => {
    const ok = await confirmAction({
      title: "Delete Customer?",
      message: `Are you sure you want to delete ${customer.name}?\n\nThis will soft-delete the customer record.`,
    });
    if (!ok) return;
    try {
      await deleteCustomer(customer.id);
      setSelectedIds((prev) => prev.filter((id) => id !== customer.id));
      notify.deleted("Customer");
      await loadCustomers();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleBlock = async (customer: Customer) => {
    const isBlocked = customer.status === "blocked";
    const nextStatus = isBlocked ? "active" : "blocked";
    const ok = await confirmAction({
      title: isBlocked ? "Unblock Customer?" : "Block Customer?",
      message: isBlocked
        ? `Unblock ${customer.name}? Their status will be set to Active.`
        : `Block ${customer.name}? Their status will be set to Blocked.`,
      confirmLabel: isBlocked ? "Unblock" : "Block",
    });
    if (!ok) return;
    try {
      await updateCustomerStatus(customer.id, nextStatus);
      notify.statusUpdated(
        isBlocked
          ? `${customer.name} has been unblocked.`
          : `${customer.name} has been blocked.`
      );
      await loadCustomers();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, search: value }));
    }, 350);
  };

  const resolveExportRows = useCallback(async () => {
    if (selectedIds.length > 0) {
      return customers.filter((c) => selectedIds.includes(c.id));
    }
    return fetchAllCustomersForExport(appliedFilters, sortKey, sortDir);
  }, [selectedIds, customers, appliedFilters, sortKey, sortDir]);

  const runExport = async (format: ExportFormat) => {
    setExportOpen(false);
    setExporting(true);
    try {
      const rows = await resolveExportRows();
      if (!rows.length) {
        notify.error("No customers to export.");
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === "csv") {
        exportCustomersCsv(rows, `customers-${stamp}.csv`);
        notify.exported();
        return;
      }
      if (format === "excel") {
        exportCustomersExcel(rows, `customers-${stamp}.xls`);
        notify.exported();
        return;
      }
      exportCustomersPdf(rows, stamp);
      notify.exported();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleImportFile = async (file: File | null) => {
    if (!file) return;
    setImportOpen(false);
    setImporting(true);
    try {
      const rows = await parseCustomerImportFile(file);
      if (!rows.length) {
        notify.error("No valid customer rows found in the file.");
        return;
      }

      let created = 0;
      let existed = 0;
      let failed = 0;

      for (const row of rows) {
        const form: CustomerFormValues = {
          name: row.name,
          email: row.email,
          phone: row.mobile,
          gender: "",
          city: row.city || "",
          country: row.country || "India",
          addressLine1: row.addressLine1 || "",
          addressLine2: "",
          state: row.state || "",
          zipCode: "",
          dob: "",
          source: normalizeSource(row.source),
          status: normalizeStatus(row.status),
          emailVerified: false,
          mobileVerified: false,
          communicationPreference: "email",
          verification: normalizeVerification(row.verification),
          notes: row.notes || "",
        };
        try {
          const result = await createCustomer({
            ...formToCreatePayload(form),
            return_existing: true,
          });
          if (result.existed) existed += 1;
          else created += 1;
        } catch {
          failed += 1;
        }
      }

      notify.imported();
      if (failed > 0 || existed > 0) {
        notify.statusUpdated(
          `Import finished: ${created} created, ${existed} already existed, ${failed} failed.`
        );
      }
      await loadCustomers();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts, bookings, activities, verification status and account lifecycle."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "User Management" },
          { label: "Customers" },
        ]}
        actions={
          <PermissionGate permission="Customer.Create">
            <Button variant="primary" icon={Plus} onClick={goCreate}>
              Create Customer
            </Button>
          </PermissionGate>
        }
      />

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="px-4 py-3.5 flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            <input
              value={filters.search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search by name, email, phone or customer ID..."
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
                className={columnsOpen ? "!border-[#C89B3C]/40 !bg-[#FFF3EB] !text-[#C89B3C]" : ""}
              >
                Columns
              </Button>
              {columnsOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#E8EAF0] rounded-xl shadow-[0_8px_24px_rgba(16,24,40,0.12)] z-30 p-2">
                  <p className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF]">
                    Visible columns
                  </p>
                  {(Object.keys(defaultColumns) as CustomerColumnKey[])
                    .filter((k) => k !== "actions" && k !== "profile")
                    .map((key) => (
                      <label
                        key={key}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[#F8F9FB] cursor-pointer text-sm text-[#374151]"
                      >
                        <input
                          type="checkbox"
                          checked={visibleColumns[key]}
                          onChange={() =>
                            setVisibleColumns((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                          className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C]"
                        />
                        {columnLabels[key]}
                      </label>
                    ))}
                </div>
              )}
            </div>

            <div className="hidden sm:block w-px h-7 bg-[#E8EAF0] mx-0.5" aria-hidden />

            <div className="relative" ref={importRef}>
              <PermissionGate permission="Customer.Create">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Upload}
                  disabled={importing}
                  onClick={() => {
                    setExportOpen(false);
                    setImportOpen((v) => !v);
                  }}
                >
                  {importing ? "Importing…" : "Import"}
                </Button>
              </PermissionGate>
              {importOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E8EAF0] rounded-xl shadow-[0_8px_24px_rgba(16,24,40,0.12)] z-30 py-1">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#F8F9FB]"
                    onClick={() => {
                      setImportOpen(false);
                      downloadCustomerImportTemplate();
                    }}
                  >
                    Download Template
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm text-[#374151] hover:bg-[#F8F9FB]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload CSV / Excel
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => handleImportFile(e.target.files?.[0] || null)}
              />
            </div>

            <PermissionGate permission="Customer.Export">
              <div className="relative" ref={exportRef}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Download}
                  disabled={exporting}
                  onClick={() => {
                    setImportOpen(false);
                    setExportOpen((v) => !v);
                  }}
                >
                  {exporting ? "Exporting…" : "Export"}
                </Button>
                {exportOpen && (
                  <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-[#E8EAF0] rounded-xl shadow-[0_8px_24px_rgba(16,24,40,0.12)] z-30 py-1">
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
            </PermissionGate>
          </div>
        </div>
      </div>

      <FilterPanel
        open={filtersOpen}
        filters={filters}
        activeCount={activeFilterCount}
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
      />

      {error ? (
        <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </div>
      ) : null}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#C89B3C]/20 bg-[#FFF3EB] px-4 py-3">
          <p className="text-sm font-medium text-[#111827]">
            <span className="text-[#C89B3C] font-semibold">{selectedIds.length}</span> customers
            selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" icon={Download} onClick={() => runExport("csv")}>
              Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={() => runExport("excel")}>
              Export Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={() => runExport("pdf")}>
              Export PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#F3F4F6] rounded-lg" />
          ))}
        </div>
      ) : (
        <CustomerTable
          customers={customers}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onToggleSelectAll={toggleSelectAll}
          density="comfortable"
          visibleColumns={visibleColumns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={goEdit}
          onDelete={handleDelete}
          onBlock={handleBlock}
          emptyAction={goCreate}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-[#6B7280]">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="h-9 px-2.5 rounded-[10px] border border-[#E8EAF0] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#C89B3C]/25"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span>
            Showing{" "}
            <span className="font-medium text-[#111827]">
              {total === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + pageSize, total)}
            </span>{" "}
            of <span className="font-medium text-[#111827]">{total.toLocaleString()}</span>{" "}
            Customers
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce<(number | string)[]>((acc, p, idx, arr) => {
              if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              typeof p === "string" ? (
                <span key={`e-${idx}`} className="px-2 text-[#9CA3AF]">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`min-w-9 h-9 rounded-[10px] text-sm font-medium transition-colors ${
                    page === p
                      ? "bg-[#C89B3C] text-white"
                      : "bg-white border border-[#E8EAF0] text-[#4B5563] hover:bg-[#F8F9FB]"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
