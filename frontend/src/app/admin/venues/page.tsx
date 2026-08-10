"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Columns3, Download, Filter, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { FilterPanel } from "./components/FilterPanel";
import { VenueTable, columnLabels } from "./components/VenueTable";
import { confirmAction, notify } from "../_components/ui/Toast";
import { Venue, VenueColumnKey, VenueFilters } from "./types";
import {
  deleteVenue,
  fetchVenues,
  filtersToParams,
  mapVenueListItem,
  updateVenue,
} from "@/lib/venues";
import { fetchBusinessProfiles, mapBusinessProfileListItem } from "@/lib/business-profiles";
import { PermissionGate } from "@/components/PermissionGate";

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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
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
  const [error, setError] = useState<string | null>(null);
  const [businessOptions, setBusinessOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const columnsRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filtersToParams(appliedFilters, page, pageSize, sortKey, sortDir);
      const data = await fetchVenues(params);
      setVenues(data.items.map(mapVenueListItem));
      setTotal(data.total);
      setTotalPages(Math.max(1, data.total_pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load venues");
      setVenues([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, sortKey, sortDir]);

  useEffect(() => {
    loadVenues();
  }, [loadVenues]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchBusinessProfiles({ page: 1, page_size: 100 });
        if (!cancelled) {
          setBusinessOptions(
            data.items.map(mapBusinessProfileListItem).map((b) => ({
              id: b.id,
              name: b.businessName,
            }))
          );
        }
      } catch {
        if (!cancelled) setBusinessOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
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
      f.category,
      f.city,
      f.approval,
      f.status,
    ].filter(Boolean).length;
  }, [appliedFilters]);

  const startIndex = (page - 1) * pageSize;

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === venues.length) setSelectedIds([]);
    else setSelectedIds(venues.map((v) => v.id));
  };

  const goCreate = () => router.push("/admin/venues/create");
  const goEdit = (venue: Venue) => router.push(`/admin/venues/${venue.id}/edit`);

  const handleDelete = async (venue: Venue) => {
    const ok = await confirmAction({
      title: "Delete Venue?",
      message: `Are you sure you want to delete ${venue.name}?\n\nThis will soft-delete the venue.`,
    });
    if (!ok) return;
    try {
      await deleteVenue(venue.id);
      setSelectedIds((prev) => prev.filter((id) => id !== venue.id));
      notify.deleted("Venue");
      await loadVenues();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const handleToggleStatus = async (venue: Venue) => {
    const next = venue.status === "published" ? "inactive" : "published";
    try {
      await updateVenue(venue.id, { venue_status: next });
      notify.updated("Venue");
      await loadVenues();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Status update failed");
    }
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, search: value }));
      setPage(1);
    }, 350);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Venues"
        subtitle="Manage venue listings, pricing, gallery, documents and approval."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Venue Management" },
          { label: "Venues" },
        ]}
        actions={
          <PermissionGate permission="Venue.Create">
            <Button variant="primary" icon={Plus} onClick={goCreate}>
              Create Venue
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
              placeholder="Search by venue name, ID, business or city..."
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
        businessOptions={businessOptions}
        onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))}
        onApply={() => {
          setAppliedFilters(filters);
          setPage(1);
          setFiltersOpen(false);
          notify.filtersApplied();
        }}
        onReset={() => {
          setFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
          setPage(1);
          notify.filtersReset();
        }}
        onClose={() => setFiltersOpen(false)}
      />

      {error ? (
        <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-6 animate-pulse space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-[#F3F4F6] rounded-lg" />
          ))}
        </div>
      ) : (
        <VenueTable
          venues={venues}
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
          onClone={(venue) => router.push(`/admin/venues/create?clone=${venue.id}`)}
          onPublish={handleToggleStatus}
          onUnpublish={handleToggleStatus}
          emptyAction={goCreate}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-[#6B7280]">
          <span>Rows</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
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
              {total === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, total)}
            </span>{" "}
            of <span className="font-medium text-[#111827]">{total.toLocaleString()}</span> Venues
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
