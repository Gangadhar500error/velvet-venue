"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Columns3, Download, Filter, Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "../_components/ui/PageHeader";
import { Button } from "../_components/ui/Button";
import { FilterPanel } from "./components/FilterPanel";
import { BookingTable, columnLabels } from "./components/BookingTable";
import { Booking, BookingColumnKey, BookingFilters, TableDensity } from "./types";
import { confirmAction, notify } from "../_components/ui/Toast";
import { useDemoStore } from "../store/demoStore";

const defaultFilters: BookingFilters = {
  search: "",
  bookingId: "",
  customer: "",
  phone: "",
  venue: "",
  businessId: "",
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
  const [loading, setLoading] = useState(true);
  const bookings = useDemoStore((s) => s.bookings);
  const updateBooking = useDemoStore((s) => s.updateBooking);
  const [filters, setFilters] = useState<BookingFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<BookingFilters>(defaultFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortKey, setSortKey] = useState("eventDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [density] = useState<TableDensity>("compact");
  const columnsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (columnsRef.current && !columnsRef.current.contains(e.target as Node)) setColumnsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
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

  const filtered = useMemo(() => {
    let list = [...bookings];
    const f = appliedFilters;

    if (f.search) {
      const q = f.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bookingId.toLowerCase().includes(q) ||
          b.customerName.toLowerCase().includes(q) ||
          b.customerPhone.toLowerCase().includes(q) ||
          b.venueName.toLowerCase().includes(q) ||
          b.businessName.toLowerCase().includes(q) ||
          b.eventType.toLowerCase().includes(q)
      );
    }
    if (f.bookingId) list = list.filter((b) => b.bookingId.toLowerCase().includes(f.bookingId.toLowerCase()));
    if (f.customer) list = list.filter((b) => b.customerName.toLowerCase().includes(f.customer.toLowerCase()));
    if (f.phone) list = list.filter((b) => b.customerPhone.replace(/\s/g, "").includes(f.phone.replace(/\s/g, "")));
    if (f.venue) list = list.filter((b) => b.venueName === f.venue);
    if (f.businessId) list = list.filter((b) => b.businessId === f.businessId);
    if (f.eventDate) list = list.filter((b) => b.eventDate === f.eventDate);
    if (f.bookingStatus) list = list.filter((b) => b.bookingStatus === f.bookingStatus);
    if (f.paymentStatus) list = list.filter((b) => b.paymentStatus === f.paymentStatus);
    if (f.assignedExecutive) list = list.filter((b) => b.assignedExecutive === f.assignedExecutive);
    if (f.dateFrom) list = list.filter((b) => b.bookingDate >= f.dateFrom);
    if (f.dateTo) list = list.filter((b) => b.bookingDate <= f.dateTo);

    list.sort((a, b) => {
      const av = a[sortKey as keyof Booking];
      const bv = b[sortKey as keyof Booking];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

    return list;
  }, [bookings, appliedFilters, sortKey, sortDir]);

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

  const goCreate = () => router.push("/admin/bookings/create");
  const goEdit = (booking: Booking) => router.push(`/admin/bookings/${booking.id}/edit`);

  const handleCancelBooking = async (booking: Booking) => {
    const ok = await confirmAction({
      title: "Cancel Booking?",
      message: `Are you sure you want to cancel booking ${booking.bookingId}?`,
      confirmLabel: "Cancel Booking",
    });
    if (!ok) return;
    updateBooking(booking.id, {
      bookingStatus: "cancelled",
      pendingAmount: 0,
      updatedAt: new Date().toISOString(),
    });
    notify.statusUpdated("Booking cancelled successfully.");
  };

  const applySearch = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
    setAppliedFilters((prev) => ({ ...prev, search: value }));
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
          bookings={pageItems}
          selectedIds={selectedIds}
          onToggleSelect={(id) =>
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          }
          onToggleSelectAll={() => {
            if (selectedIds.length === pageItems.length) setSelectedIds([]);
            else setSelectedIds(pageItems.map((b) => b.id));
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

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-[#6B7280]">
          Showing <span className="font-semibold text-[#111827]">{filtered.length === 0 ? 0 : startIndex + 1}</span>
          –<span className="font-semibold text-[#111827]">{Math.min(startIndex + pageSize, filtered.length)}</span> of{" "}
          <span className="font-semibold text-[#111827]">{filtered.length}</span> bookings
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
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-[#6B7280] px-1">
            {page} / {totalPages}
          </span>
          <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
