"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Columns3, Download, Filter, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { FilterPanel } from "./components/FilterPanel";
import { VenueTable, columnLabels } from "./components/VenueTable";
import { confirmAction, notify } from "../_components/ui/Toast";
import { useDemoStore } from "../store/demoStore";
import { Venue, VenueColumnKey, VenueFilters, VenueStatus, ApprovalStatus } from "./types";

const defaultFilters: VenueFilters = {
  search: "",
  businessId: "",
  ownerId: "",
  category: "",
  city: "",
  approval: "",
  availability: "",
  capacityMin: "",
  priceMin: "",
  priceMax: "",
  featured: "",
  status: "",
};

const defaultColumns: Record<VenueColumnKey, boolean> = {
  profile: true,
  venueId: true,
  business: true,
  category: true,
  city: true,
  capacity: true,
  startingPrice: true,
  bookings: true,
  rating: true,
  approval: true,
  status: true,
  actions: true,
};

export default function VenuesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const venues = useDemoStore((s) => s.venues);
  const updateVenue = useDemoStore((s) => s.updateVenue);
  const removeVenue = useDemoStore((s) => s.removeVenue);
  const [filters, setFilters] = useState<VenueFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<VenueFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("name");
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
      f.businessId,
      f.ownerId,
      f.category,
      f.city,
      f.approval,
      f.availability,
      f.capacityMin,
      f.priceMin,
      f.priceMax,
      f.featured,
      f.status,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const filtered = useMemo(() => {
    let list = [...venues];
    const f = appliedFilters;

    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.venueId.toLowerCase().includes(q) ||
          v.businessName.toLowerCase().includes(q) ||
          v.city.toLowerCase().includes(q) ||
          v.ownerName.toLowerCase().includes(q)
      );
    }
    if (f.businessId) list = list.filter((v) => v.businessId === f.businessId || v.id === f.businessId);
    if (f.ownerId) list = list.filter((v) => v.ownerId === f.ownerId);
    if (f.category) list = list.filter((v) => v.category === f.category);
    if (f.city) list = list.filter((v) => v.city === f.city);
    if (f.approval) list = list.filter((v) => v.approval === f.approval);
    if (f.availability) list = list.filter((v) => v.availabilityLabel === f.availability);
    if (f.capacityMin) list = list.filter((v) => v.maxGuests >= Number(f.capacityMin));
    if (f.priceMin) list = list.filter((v) => v.startingPrice >= Number(f.priceMin));
    if (f.priceMax) list = list.filter((v) => v.startingPrice <= Number(f.priceMax));
    if (f.featured) list = list.filter((v) => (f.featured === "yes" ? v.featured : !v.featured));
    if (f.status) list = list.filter((v) => v.status === f.status);

    list.sort((a, b) => {
      const av = a[sortKey as keyof Venue];
      const bv = b[sortKey as keyof Venue];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

    return list;
  }, [venues, appliedFilters, sortKey, sortDir]);

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
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pageItems.length) setSelectedIds([]);
    else setSelectedIds(pageItems.map((v) => v.id));
  };

  const goCreate = () => router.push("/admin/venues/create");
  const goEdit = (venue: Venue) => router.push(`/admin/venues/${venue.id}/edit`);
  const goClone = (venue: Venue) => router.push(`/admin/venues/create?clone=${venue.id}`);

  const handleDelete = async (venue: Venue) => {
    const ok = await confirmAction({
      title: "Delete Venue?",
      message: `Are you sure you want to delete ${venue.name}?\n\nThis action cannot be undone.`,
    });
    if (!ok) return;
    removeVenue(venue.id);
    setSelectedIds((prev) => prev.filter((id) => id !== venue.id));
    notify.deleted("Venue");
  };

  const handleApprove = (venue: Venue) => updateVenue(venue.id, { approval: "approved" as ApprovalStatus });
  const handleReject = (venue: Venue) => updateVenue(venue.id, { approval: "rejected" as ApprovalStatus });
  const handlePublish = (venue: Venue) => updateVenue(venue.id, { status: "published" as VenueStatus });
  const handleUnpublish = (venue: Venue) => updateVenue(venue.id, { status: "inactive" as VenueStatus });
  const handleArchive = (venue: Venue) => updateVenue(venue.id, { status: "archived" as VenueStatus });

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setAppliedFilters((prev) => ({ ...prev, search: value }));
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Venue Management"
        subtitle="Manage all venues, availability, pricing, approvals and bookings."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Venue Management" },
          { label: "Venues" },
        ]}
        actions={
          <Button variant="primary" icon={Plus} onClick={goCreate}>
            Create Venue
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
              placeholder="Search by venue name, venue ID, business, city or owner..."
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
              Advanced Filters
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
                  {(Object.keys(defaultColumns) as VenueColumnKey[])
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
            <span className="text-[#C89B3C] font-semibold">{selectedIds.length}</span> venues selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm">
              Publish
            </Button>
            <Button variant="secondary" size="sm">
              Unpublish
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
        <VenueTable
          venues={pageItems}
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
          onClone={goClone}
          onApprove={handleApprove}
          onReject={handleReject}
          onPublish={handlePublish}
          onUnpublish={handleUnpublish}
          onArchive={handleArchive}
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
              {filtered.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)}
            </span>{" "}
            of <span className="font-medium text-[#111827]">{filtered.length.toLocaleString()}</span> Venues
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
