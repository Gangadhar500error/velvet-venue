"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { BusinessProfileTable, columnLabels } from "./components/BusinessProfileTable";
import { confirmAction, notify } from "../_components/ui/Toast";
import { useDemoStore } from "../store/demoStore";
import {
  BusinessProfile,
  BusinessColumnKey,
  BusinessProfileFilters,
} from "./types";

const defaultFilters: BusinessProfileFilters = {
  search: "",
  status: "",
  verification: "",
  businessType: "",
  city: "",
  owner: "",
  dateFrom: "",
  dateTo: "",
};

const defaultColumns: Record<BusinessColumnKey, boolean> = {
  profile: true,
  businessId: true,
  owner: true,
  businessType: true,
  city: true,
  venues: true,
  verification: true,
  status: true,
  createdAt: true,
  actions: true,
};

export default function BusinessProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const businesses = useDemoStore((s) => s.businesses);
  const updateBusiness = useDemoStore((s) => s.updateBusiness);
  const removeBusiness = useDemoStore((s) => s.removeBusiness);
  const [filters, setFilters] = useState<BusinessProfileFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<BusinessProfileFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("businessName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeFilterCount = useMemo(() => {
    const f = appliedFilters;
    return [
      f.status,
      f.verification,
      f.businessType,
      f.city,
      f.owner,
      f.dateFrom,
      f.dateTo,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const filtered = useMemo(() => {
    let list = [...businesses];
    const f = appliedFilters;

    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.businessName.toLowerCase().includes(q) ||
          b.businessId.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q) ||
          b.gstNumber.toLowerCase().includes(q)
      );
    }
    if (f.status) list = list.filter((b) => b.status === f.status);
    if (f.verification) list = list.filter((b) => b.verification === f.verification);
    if (f.businessType) list = list.filter((b) => b.businessType === f.businessType);
    if (f.city) list = list.filter((b) => b.city === f.city);
    if (f.owner) list = list.filter((b) => b.ownerId === f.owner);
    if (f.dateFrom) list = list.filter((b) => b.createdAt >= f.dateFrom);
    if (f.dateTo) list = list.filter((b) => b.createdAt <= f.dateTo);

    list.sort((a, b) => {
      const av = a[sortKey as keyof BusinessProfile];
      const bv = b[sortKey as keyof BusinessProfile];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return list;
  }, [businesses, appliedFilters, sortKey, sortDir]);

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pageItems.length) setSelectedIds([]);
    else setSelectedIds(pageItems.map((b) => b.id));
  };

  const goCreate = () => router.push("/admin/business-profile/create");
  const goEdit = (business: BusinessProfile) =>
    router.push(`/admin/business-profile/${business.id}/edit`);

  const handleDelete = async (business: BusinessProfile) => {
    const ok = await confirmAction({
      title: "Delete Business Profile?",
      message: `Are you sure you want to delete ${business.businessName}?\n\nThis action cannot be undone.`,
    });
    if (!ok) return;
    removeBusiness(business.id);
    setSelectedIds((prev) => prev.filter((id) => id !== business.id));
    notify.deleted("Business profile");
  };

  const handleToggleStatus = (business: BusinessProfile) => {
    const nextStatus = business.status === "active" ? "inactive" : "active";
    updateBusiness(business.id, { status: nextStatus });
  };

  const handleApprove = (business: BusinessProfile) => {
    updateBusiness(business.id, { verification: "verified", status: "active" });
  };

  const handleReject = (business: BusinessProfile) => {
    updateBusiness(business.id, { verification: "rejected" });
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setAppliedFilters((prev) => ({ ...prev, search: value }));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Business Profiles"
        subtitle="Manage venue businesses, verification, legal information and associated venues."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Venue Management" },
          { label: "Business Profiles" },
        ]}
        actions={
          <Button variant="primary" icon={Plus} onClick={goCreate}>
            Create Business Profile
          </Button>
        }
      />

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="px-4 py-3.5 flex flex-col xl:flex-row xl:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            <input
              value={filters.search}
              onChange={(e) => applySearch(e.target.value)}
              placeholder="Search by business name, business ID, owner, city or GST..."
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
                  {(Object.keys(defaultColumns) as BusinessColumnKey[])
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

            <Button variant="secondary" size="sm" icon={Upload}>
              Import
            </Button>
            <Button variant="secondary" size="sm" icon={Download}>
              Export
            </Button>
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

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#C89B3C]/20 bg-[#FFF3EB] px-4 py-3">
          <p className="text-sm font-medium text-[#111827]">
            <span className="text-[#C89B3C] font-semibold">{selectedIds.length}</span> business profiles
            selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              Activate
            </Button>
            <Button variant="secondary" size="sm">
              Deactivate
            </Button>
            <Button variant="secondary" size="sm" icon={Download}>
              Export
            </Button>
            <Button variant="danger" size="sm">
              Delete
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
        <BusinessProfileTable
          businesses={pageItems}
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
          onToggleStatus={handleToggleStatus}
          onApprove={handleApprove}
          onReject={handleReject}
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
              {filtered.length === 0 ? 0 : startIndex + 1}-
              {Math.min(startIndex + pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-[#111827]">{filtered.length.toLocaleString()}</span>{" "}
            Business Profiles
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
