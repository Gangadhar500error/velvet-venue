"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Columns3, Download, Filter, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { FilterPanel } from "./components/FilterPanel";
import { BookingTable, columnLabels } from "./components/BookingTable";
import { Booking, BookingColumnKey, BookingFilters, TableDensity } from "./types";
import { confirmAction, notify } from "../_components/ui/Toast";
import {
  cancelBooking,
  fetchBookings,
  filtersToBookingParams,
  mapBookingListItem,
} from "@/lib/bookings";

const defaultFilters: BookingFilters = {
  search: "",
  bookingId: "",
  customer: "",
  phone: "",
  venue: "",
  businessId: "",
  businessProfileId: "",
  vendorId: "",
  eventDate: "",
  bookingStatus: "",
  paymentStatus: "",
  dateFrom: "",
  dateTo: "",
  assignedExecutive: "",
};

const defaultColumns: Record<BookingColumnKey, boolean> = {
  bookingId: true,
  customer: true,
  venue: true,
  business: true,
  event: true,
  bookingDate: true,
  eventDate: true,
  guests: true,
  bookingAmount: true,
  paid: true,
  pending: true,
  bookingStatus: true,
  paymentStatus: true,
  actions: true,
};

export default function BookingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<BookingFilters>(() => {
    const vendorId = searchParams.get("vendor") || searchParams.get("vendorId") || "";
    const businessProfileId =
      searchParams.get("business") || searchParams.get("businessProfileId") || "";
    return vendorId || businessProfileId
      ? { ...defaultFilters, vendorId, businessProfileId }
      : defaultFilters;
  });
  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(() => {
    const vendorId = searchParams.get("vendor") || searchParams.get("vendorId") || "";
    const businessProfileId =
      searchParams.get("business") || searchParams.get("businessProfileId") || "";
    return vendorId || businessProfileId
      ? { ...defaultFilters, vendorId, businessProfileId }
      : defaultFilters;
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("eventDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [density] = useState<TableDensity>("compact");
  const [error, setError] = useState<string | null>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = filtersToBookingParams(appliedFilters, page, pageSize, sortKey, sortDir);
      const data = await fetchBookings(params);
      setBookings(data.items.map(mapBookingListItem));
      setTotal(data.total);
      setTotalPages(Math.max(1, data.total_pages));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load bookings");
      setBookings([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, page, pageSize, sortKey, sortDir]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const activeFilterCount = useMemo(() => {
    const f = appliedFilters;
    return [
      f.bookingId,
      f.customer,
      f.phone,
      f.venue,
      f.businessId,
      f.eventDate,
      f.bookingStatus,
      f.paymentStatus,
      f.dateFrom,
      f.dateTo,
      f.assignedExecutive,
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

  const goCreate = () => router.push("/admin/bookings/create");
  const goEdit = (booking: Booking) => router.push(`/admin/bookings/${booking.id}/edit`);

  const handleCancelBooking = async (booking: Booking) => {
    const ok = await confirmAction({
      title: "Cancel Booking?",
      message: `Are you sure you want to cancel booking ${booking.bookingId}?`,
      confirmLabel: "Cancel Booking",
    });
    if (!ok) return;
    try {
      await cancelBooking(booking.id);
      notify.statusUpdated("Booking cancelled successfully.");
      await loadBookings();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Failed to cancel booking");
    }
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setAppliedFilters((prev) => ({ ...prev, search: value }));
    }, 350);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Bookings"
        subtitle="Manage reservations, customers, payments and event schedules."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Booking Management" },
          { label: "Bookings" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              icon={Download}
              onClick={() => {
                notify.exported();
              }}
            >
              Export
            </Button>
            <Button
              variant="secondary"
              icon={Upload}
              onClick={() => {
                notify.imported();
              }}
            >
              Import
            </Button>
            <Button variant="primary" icon={Plus} onClick={goCreate}>
              Create Booking
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
              placeholder="Search booking ID, customer, phone, venue…"
              className="w-full h-10 pl-10 pr-3.5 rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] text-sm text-[#111827] placeholder:text-[#9CA3AF] hover:border-[#D1D5DB] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={Filter}
              onClick={() => setFiltersOpen((v) => !v)}
              className={filtersOpen || activeFilterCount > 0 ? "!border-[#C89B3C]/40 !bg-[#FFF3EB] !text-[#C89B3C]" : ""}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#C89B3C] text-white text-[10px] font-semibold leading-none">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="relative" ref={columnsRef}>
              <Button variant="secondary" size="sm" icon={Columns3} onClick={() => setColumnsOpen((v) => !v)}>
                Columns
              </Button>
              {columnsOpen && (
                <div className="absolute right-0 top-11 z-20 w-56 rounded-[12px] border border-[#E8EAF0] bg-white shadow-lg p-2 max-h-72 overflow-y-auto">
                  {(Object.keys(columnLabels) as BookingColumnKey[]).map((key) => (
                    <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#F8F9FB] text-sm text-[#374151] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        disabled={key === "actions" || key === "bookingId"}
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

            <Button
              variant="secondary"
              size="sm"
              onClick={() => notify.viewSaved()}
            >
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

      {error ? (
        <div className="rounded-[14px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#DC2626]">
          {error}
        </div>
      ) : null}

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[#FFD4B0] bg-[#FFF8F3] px-4 py-2.5">
          <span className="text-sm font-medium text-[#9A3412]">{selectedIds.length} selected</span>
          <Button variant="secondary" size="sm" onClick={() => notify.exported()}>
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
        <BookingTable
          bookings={bookings}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onToggleSelectAll={() => {
            if (selectedIds.length === bookings.length) setSelectedIds([]);
            else setSelectedIds(bookings.map((b) => b.id));
          }}
          density={density}
          visibleColumns={visibleColumns}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          onEdit={goEdit}
          onCancelBooking={handleCancelBooking}
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
              {total === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, total)}
            </span>{" "}
            of <span className="font-medium text-[#111827]">{total.toLocaleString()}</span>{" "}
            Bookings
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
                  type="button"
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
