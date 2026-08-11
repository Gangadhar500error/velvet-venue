"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { toast } from "../../_components/ui/Toast";
import type { AvailabilityDay, DayAvailabilityStatus, Venue } from "../types";
import { formatDate } from "../data";
import {
  displayLabelForTone,
  formatAvailabilityDate,
  getDaySummary,
  isDateBookable,
  monthSlotStats,
  normalizePricingMethod,
  pricingMethodLabel,
  resolveFoodSlotsForDate,
  resolveSlotsForDate,
  toYmd,
  type CalendarDayTone,
  type DaySummary,
  type LiveBookingLite,
  type SlotDetailRow,
} from "../availability";
import { fetchAvailabilityDay, isBookingUuid } from "@/lib/availability";

export interface AvailabilityBookPayload {
  date: string;
  dates?: string[];
  slot: string;
  slots?: string[];
  dateSlots?: Array<{ date: string; slotKey: string; slotName: string }>;
  status: DayAvailabilityStatus;
  eventEndDate?: string;
  amount?: number;
}

interface VenueAvailabilityPanelProps {
  venue: Venue;
  availability: AvailabilityDay[];
  onBook: (payload: AvailabilityBookPayload) => void;
  onViewBooking: (row: { bookingId: string; bookingRef?: string }) => void;
  hideSummaryStats?: boolean;
  calendarPageMode?: boolean;
  bookActionLabel?: string;
}

type SlotPick = { date: string; slotKey: string; slotName: string };

export function VenueAvailabilityPanel({
  venue,
  availability,
  onBook,
  onViewBooking,
  hideSummaryStats = false,
  calendarPageMode = false,
}: VenueAvailabilityPanelProps) {
  const isSlotBased = normalizePricingMethod(venue.pricingMethod) === "slot_based";

  const today = toYmd(new Date());
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [focusDate, setFocusDate] = useState(today);
  /** Full Day multi-date selection */
  const [checkedDates, setCheckedDates] = useState<string[]>([]);
  /** Slot Based date+slot picks */
  const [slotPicks, setSlotPicks] = useState<SlotPick[]>([]);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [statusFilter, setStatusFilter] = useState("");
  const [listSearch, setListSearch] = useState("");
  /** Inline slot panel open for this date (slot-based) */
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  /** Reset selection when venue changes (calendar page / venue tab) */
  useEffect(() => {
    setCheckedDates([]);
    setSlotPicks([]);
    setExpandedDate(null);
    setFocusDate(toYmd(new Date()));
    setListSearch("");
    setStatusFilter("");
  }, [venue.id, venue.venueId]);

  const monthPrefix = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;

  const liveBookings = useMemo(() => {
    const byId = new Map<string, LiveBookingLite>();
    const rememberDate = (booking: LiveBookingLite, date: string) => {
      const dates = new Set(
        (booking.selectedDates || "")
          .split(",")
          .map((d) => d.trim())
          .filter(Boolean)
      );
      dates.add(date);
      const sorted = Array.from(dates).sort();
      booking.selectedDates = sorted.join(",");
      booking.eventDate = sorted[0];
      booking.eventEndDate = sorted[sorted.length - 1];
    };
    for (const row of availability) {
      for (const booking of row.bookings || []) {
        const existing = byId.get(booking.id);
        if (!existing) {
          byId.set(booking.id, {
            id: booking.id,
            bookingId: booking.bookingId,
            customerName: booking.customerName || "Guest",
            eventType: booking.eventType || "Event",
            eventDate: row.date,
            eventEndDate: row.date,
            selectedDates: row.date,
            guestCount: booking.guestCount,
            slot: (booking.selectedSlots || []).join(", ") || row.slot || "Full Day",
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            bookingAmount: booking.bookingAmount,
            selectedSlots: booking.selectedSlots,
            selectedFoodSlots: booking.selectedFoodSlots,
          });
        } else {
          rememberDate(existing, row.date);
        }
      }
      const slotBookingId = [row.bookingRef, row.bookingId].find(isBookingUuid);
      if (slotBookingId && (row.status === "booked" || row.status === "completed")) {
        const existing = byId.get(slotBookingId);
        if (!existing) {
          byId.set(slotBookingId, {
            id: slotBookingId,
            bookingId:
              row.bookingId && !isBookingUuid(row.bookingId) ? row.bookingId : slotBookingId,
            customerName: row.customerName || "Guest",
            eventType: row.eventType || "Event",
            eventDate: row.date,
            eventEndDate: row.date,
            selectedDates: row.date,
            guestCount: row.guests || row.guestCount || 0,
            slot: row.slot || row.slotKey || "Full Day",
            bookingStatus: row.status === "completed" ? "completed" : "confirmed",
            selectedSlots: row.slot ? [row.slot] : row.slotKey ? [row.slotKey] : [],
          });
        } else {
          rememberDate(existing, row.date);
          if (!existing.customerName && row.customerName) existing.customerName = row.customerName;
          if (row.slot && !(existing.selectedSlots || []).includes(row.slot)) {
            existing.selectedSlots = [...(existing.selectedSlots || []), row.slot];
            existing.slot = existing.selectedSlots.join(", ");
          }
        }
      }
    }
    return Array.from(byId.values());
  }, [availability]);

  const stats = useMemo(
    () => monthSlotStats(venue, availability, monthPrefix, liveBookings),
    [venue, availability, monthPrefix, liveBookings]
  );

  const focusSlots = useMemo(
    () => resolveSlotsForDate({ venue, date: focusDate, availability, liveBookings }),
    [venue, focusDate, availability, liveBookings]
  );

  const expandedSlots = useMemo(() => {
    if (!expandedDate) return [];
    return resolveSlotsForDate({
      venue,
      date: expandedDate,
      availability,
      liveBookings,
    });
  }, [expandedDate, venue, availability, liveBookings]);

  const expandedFood = useMemo(() => {
    if (!expandedDate) return [];
    return resolveFoodSlotsForDate({
      venue,
      date: expandedDate,
      availability,
      liveBookings,
    });
  }, [expandedDate, venue, availability, liveBookings]);

  const daySummaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    const [y, m] = monthPrefix.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    for (let d = 1; d <= count; d += 1) {
      const date = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      map.set(
        date,
        getDaySummary({
          date,
          venue,
          availability,
          selectedDate: focusDate,
          liveBookings,
        })
      );
    }
    return map;
  }, [monthPrefix, venue, availability, focusDate, liveBookings]);

  const listRows = useMemo(() => {
    const [y, m] = monthPrefix.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    const rows: Array<{
      date: string;
      summary: DaySummary;
      booking: LiveBookingLite | null;
      timeLabel: string;
      bookingCount: number;
      bookedSlots: string;
      foodSlots: string;
      guestCount: number;
    }> = [];
    for (let d = 1; d <= count; d += 1) {
      const date = `${monthPrefix}-${String(d).padStart(2, "0")}`;
      const summary = daySummaries.get(date)!;
      if (statusFilter) {
        const tone = summary.statusTone;
        if (statusFilter === "available" && tone !== "available") continue;
        if (statusFilter === "partial" && tone !== "partial") continue;
        if (statusFilter === "booked" && tone !== "booked") continue;
        if (statusFilter === "completed" && tone !== "completed") continue;
        if (statusFilter === "blocked" && tone !== "blocked") continue;
        if (statusFilter === "holiday" && tone !== "holiday") continue;
        if (statusFilter === "no_booking" && tone !== "no_booking") continue;
      }
      if (listSearch.trim()) {
        const q = listSearch.toLowerCase();
        const primary = summary.coveringBookings[0];
        const hay = [formatDate(date), date, primary?.bookingId, primary?.customerName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) continue;
      }

      let timeLabel = venue.operatingHours || "9 AM – 11 PM";
      const slots = resolveSlotsForDate({
        venue,
        date,
        availability,
        liveBookings,
      });
      if (isSlotBased) {
        timeLabel = slots.map((s) => s.slotName).join(", ") || "—";
      }
      const foods = resolveFoodSlotsForDate({
        venue,
        date,
        availability,
        liveBookings,
      });

      const dayRow = availability.find((row) => row.date === date && !row.slotKey);
      rows.push({
        date,
        summary,
        booking: summary.coveringBookings[0] || null,
        timeLabel,
        bookingCount: dayRow?.bookingCount ?? summary.coveringBookings.length,
        bookedSlots: dayRow?.bookedSlotNames?.join(", ") || slots
          .filter((s) => s.status === "booked" || s.status === "completed")
          .map((s) => s.slotName)
          .join(", ") || "—",
        availableSlots: dayRow?.availableSlotNames?.join(", ") || slots
          .filter((s) => s.status === "available")
          .map((s) => s.slotName)
          .join(", ") || "—",
        bookedFood: dayRow?.bookedFoodSlots?.join(", ") || foods
          .filter((s) => s.status === "booked" || s.status === "completed")
          .map((s) => s.slotName)
          .join(", ") || "—",
        availableFood: dayRow?.availableFoodSlots?.join(", ") || foods
          .filter((s) => s.status === "available")
          .map((s) => s.slotName)
          .join(", ") || "—",
        guestCount: dayRow?.guestCount ?? summary.coveringBookings.reduce((sum, b) => sum + (b.guestCount || 0), 0),
      });
    }
    return rows;
  }, [
    monthPrefix,
    daySummaries,
    statusFilter,
    listSearch,
    venue,
    availability,
    liveBookings,
    isSlotBased,
  ]);

  const focusSummary = daySummaries.get(focusDate);
  const focusCovering = focusSummary?.coveringBookings || [];

  const calendarCells = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const startOffset = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: string | null; day: number | null }> = [];
    for (let i = 0; i < startOffset; i += 1) cells.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({
        day: d,
        date: `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, day: null });
    return cells;
  }, [cursor]);

  const monthLabel = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const modelLabel = pricingMethodLabel(venue.pricingMethod);

  const selectedDateCount = isSlotBased
    ? new Set(slotPicks.map((p) => p.date)).size
    : checkedDates.length;
  const footerVisible = isSlotBased ? slotPicks.length > 0 : checkedDates.length > 0;

  const isDateSelectable = (date: string) => {
    const tone = daySummaries.get(date)?.statusTone;
    return tone ? isDateBookable(tone, date, today) : false;
  };

  const isDateSelected = (date: string) => {
    if (isSlotBased) return slotPicks.some((p) => p.date === date);
    return checkedDates.includes(date);
  };

  const goToday = () => {
    const d = new Date();
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
    setFocusDate(toYmd(d));
  };

  const openDate = (date: string) => {
    setFocusDate(date);
    if (isSlotBased) {
      setExpandedDate((prev) => (prev === date ? null : date));
    } else {
      setExpandedDate(null);
    }
  };

  const toggleFullDayDate = (date: string, disabled?: boolean) => {
    if (disabled || isSlotBased) return;
    if (!checkedDates.includes(date) && !isDateSelectable(date)) {
      toast("Only available dates can be selected for booking.", "warning");
      return;
    }
    setCheckedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    );
    setFocusDate(date);
  };

  const bookingIdsForDate = (date: string) => {
    const ids = new Set<string>();
    for (const booking of daySummaries.get(date)?.coveringBookings || []) {
      if (isBookingUuid(booking.id)) ids.add(booking.id);
    }
    for (const row of availability) {
      if (row.date !== date) continue;
      for (const id of row.bookingIds || []) {
        if (isBookingUuid(id)) ids.add(id);
      }
      if (isBookingUuid(row.bookingRef)) ids.add(row.bookingRef);
      if (isBookingUuid(row.bookingId)) ids.add(row.bookingId);
      for (const booking of row.bookings || []) {
        if (isBookingUuid(booking.id)) ids.add(booking.id);
      }
    }
    return Array.from(ids);
  };

  const openBookedDate = async (date: string, includePartial = false) => {
    const tone = daySummaries.get(date)?.statusTone;
    if (tone !== "booked" && tone !== "completed" && !(includePartial && tone === "partial")) {
      return false;
    }
    let ids = bookingIdsForDate(date);
    if (ids.length === 0) {
      try {
        const detail = await fetchAvailabilityDay(venue.id, date);
        const fetched = [
          ...(detail.bookings || []).map((booking) => booking.booking_id),
          ...(detail.day?.bookings || []).map((booking) => booking.booking_id),
          ...(detail.day?.booking_ids || []),
        ].filter(isBookingUuid);
        ids = Array.from(new Set(fetched));
      } catch {
        return false;
      }
    }
    if (ids.length === 1) {
      onViewBooking({ bookingId: ids[0] });
      return true;
    }
    if (ids.length > 1) {
      setFocusDate(date);
      setExpandedDate(null);
      return true;
    }
    return false;
  };

  const handleDayClick = async (date: string) => {
    const tone = daySummaries.get(date)?.statusTone;
    if (tone === "partial") {
      setFocusDate(date);
      setExpandedDate(date);
      return;
    }
    if (await openBookedDate(date)) return;
    setFocusDate(date);
    if (isSlotBased) {
      setExpandedDate(date);
      return;
    }
    if (isDateSelectable(date)) {
      toggleFullDayDate(date);
    }
  };

  const toggleSlotPick = (slot: SlotDetailRow) => {
    if (slot.status !== "available") {
      toast("Only available slots can be selected.", "warning");
      return;
    }
    setSlotPicks((prev) => {
      const exists = prev.some(
        (p) => p.date === slot.date && p.slotKey === slot.slotKey
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.date === slot.date && p.slotKey === slot.slotKey)
        );
      }
      return [
        ...prev,
        { date: slot.date, slotKey: slot.slotKey, slotName: slot.slotName },
      ].sort((a, b) =>
        a.date === b.date
          ? a.slotName.localeCompare(b.slotName)
          : a.date.localeCompare(b.date)
      );
    });
    setFocusDate(slot.date);
  };

  const clearSelection = () => {
    setCheckedDates([]);
    setSlotPicks([]);
  };

  const proceed = () => {
    if (isSlotBased) {
      if (slotPicks.length === 0) {
        toast("Select at least one available slot.", "warning");
        return;
      }
      const dates = Array.from(new Set(slotPicks.map((p) => p.date))).sort();
      const slotKeys = Array.from(new Set(slotPicks.map((p) => p.slotKey)));
      const slotNames = Array.from(new Set(slotPicks.map((p) => p.slotName)));
      onBook({
        date: dates[0],
        dates,
        slot: slotNames.join(", "),
        slots: slotKeys,
        dateSlots: slotPicks,
        status: "available",
        eventEndDate: dates[dates.length - 1],
      });
      return;
    }

    const sorted = [...checkedDates].sort();
    if (sorted.length === 0) {
      toast("Select at least one available date.", "warning");
      return;
    }
    const unavailable = sorted.filter((d) => !isDateSelectable(d));
    if (unavailable.length > 0) {
      toast(
        "Some selected dates are no longer available. Remove them to continue.",
        "error"
      );
      setCheckedDates((prev) => prev.filter((d) => isDateSelectable(d)));
      return;
    }
    onBook({
      date: sorted[0],
      dates: sorted,
      slot: "Full Day",
      slots: ["Full Day"],
      status: "available",
      eventEndDate: sorted[sorted.length - 1],
    });
  };

  const listSelectDate = (date: string) => {
    if (isSlotBased) {
      openDate(date);
      setViewMode("calendar");
      return;
    }
    if (!isDateSelectable(date)) return;
    toggleFullDayDate(date);
  };

  return (
    <div className={`space-y-4 ${footerVisible ? "pb-24" : ""}`}>
      {!hideSummaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {(
            [
              { label: "Available Days", value: String(stats.available), tone: "text-[#16A34A]" },
              { label: "Booked Days", value: String(stats.booked), tone: "text-[#DC2626]" },
              { label: "Completed Days", value: String(stats.completed), tone: "text-[#2563EB]" },
              { label: "Blocked Days", value: String(stats.blocked), tone: "text-[#6B7280]" },
              { label: "Occupancy %", value: `${stats.occupancy}%`, tone: "text-[#111827]" },
            ] as const
          ).map((stat) => (
            <div
              key={stat.label}
              className="h-[72px] rounded-[12px] border border-[#E8EAF0] bg-white px-3 py-2 flex flex-col justify-center"
            >
              <p className="text-[11px] font-medium text-[#9CA3AF] leading-none">{stat.label}</p>
              <p className={`mt-1.5 text-xl font-semibold leading-none ${stat.tone}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8EAF0] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="w-4 h-4 text-[#C89B3C]" />
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                {calendarPageMode ? "Booking Calendar" : "Availability Calendar"}
              </p>
              <p className="text-[12px] text-[#9CA3AF]">
                {isSlotBased
                  ? `${modelLabel} · Click a date to choose slots`
                  : `${modelLabel} · Select available dates`}
              </p>
            </div>
          </div>
          <div className="inline-flex rounded-lg border border-[#E8EAF0] overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`h-8 px-3 text-[12px] font-medium ${
                viewMode === "calendar"
                  ? "bg-[#FFF8F3] text-[#C89B3C]"
                  : "bg-white text-[#4B5563] hover:bg-[#F8F9FB]"
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`h-8 px-3 text-[12px] font-medium border-l border-[#E8EAF0] ${
                viewMode === "list"
                  ? "bg-[#FFF8F3] text-[#C89B3C]"
                  : "bg-white text-[#4B5563] hover:bg-[#F8F9FB]"
              }`}
            >
              List View
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg border border-[#E8EAF0] text-[12px] text-[#4B5563] bg-white"
            >
              <option value="">Status: All</option>
              <option value="available">Available</option>
              <option value="partial">Partially Booked</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="blocked">Blocked</option>
              <option value="holiday">Holiday</option>
              <option value="no_booking">No Booking</option>
            </select>
            {viewMode === "list" && (
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
                <input
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  placeholder="Search date or booking"
                  className="h-8 w-full sm:w-[200px] pl-8 pr-2 rounded-lg border border-[#E8EAF0] text-[12px] outline-none focus:border-[#C89B3C]"
                />
              </div>
            )}
          </div>

          {viewMode === "calendar" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
                    }
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E8EAF0] text-[#4B5563] hover:bg-[#F8F9FB]"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-semibold text-[#111827] min-w-[140px] text-center">
                    {monthLabel}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
                    }
                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E8EAF0] text-[#4B5563] hover:bg-[#F8F9FB]"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={monthPrefix}
                    onChange={(e) => {
                      const [y, m] = e.target.value.split("-").map(Number);
                      setCursor(new Date(y, m - 1, 1));
                    }}
                    className="h-8 px-2.5 rounded-lg border border-[#E8EAF0] text-[12px] text-[#4B5563] bg-white"
                  >
                    {monthSelectOptions().map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" size="sm" onClick={goToday}>
                    Today
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-[#6B7280]">
                <LegendSwatch tone="available" label="Available" />
                <LegendSwatch tone="partial" label="Partially Booked" />
                <LegendSwatch tone="booked" label="Fully Booked" />
                <LegendSwatch tone="completed" label="Completed" />
                <LegendSwatch tone="blocked" label="Blocked" />
                <LegendSwatch tone="no_booking" label="No Booking" />
                <LegendSwatch tone="holiday" label="Holiday" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded border-2 border-[#C89B3C] bg-white" />
                  Selected
                </span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF] py-1"
                  >
                    {d}
                  </div>
                ))}
                {calendarCells.map((cell, idx) => {
                  if (!cell.date) {
                    return <div key={`empty-${idx}`} className="min-h-[72px] rounded-xl" />;
                  }
                  const summary = daySummaries.get(cell.date)!;
                  const tone = summary.statusTone;
                  if (statusFilter && tone !== statusFilter) {
                    return (
                      <div
                        key={cell.date}
                        className="min-h-[72px] rounded-xl border border-[#F3F4F6] bg-[#FAFAFB] px-2 py-2 opacity-40"
                      >
                        <span className="text-[13px] font-semibold text-[#9CA3AF]">{cell.day}</span>
                      </div>
                    );
                  }
                  const canSelect = isDateBookable(tone, cell.date, today);
                  const selected = isDateSelected(cell.date);
                  const isFocus = focusDate === cell.date;
                  const isToday = cell.date === today;
                  const isExpanded = expandedDate === cell.date;

                  return (
                    <button
                      key={cell.date}
                      type="button"
                      onClick={() => handleDayClick(cell.date!)}
                      title={summary.summaryLabel}
                      className={`relative min-h-[72px] rounded-xl border px-2 py-2 text-left transition-all ${
                        selected || isExpanded
                          ? "border-2 border-[#C89B3C] bg-white"
                          : `${statusCellClass(tone)} ${
                              isFocus ? "ring-1 ring-[#C89B3C]/40" : ""
                            }`
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={`text-[13px] font-semibold leading-none ${
                            isToday ? "text-[#C89B3C]" : "text-[#111827]"
                          }`}
                        >
                          {cell.day}
                        </span>
                        {!isSlotBased && (
                          <input
                            type="checkbox"
                            checked={selected}
                            disabled={!canSelect && !selected}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleFullDayDate(cell.date!, !canSelect && !selected);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-[#D1D5DB] text-[#C89B3C] focus:ring-[#C89B3C] disabled:opacity-40"
                            aria-label={`Select ${cell.date}`}
                          />
                        )}
                      </div>
                      <p className={`mt-2 text-[10px] font-semibold leading-tight ${summaryTextClass(tone)}`}>
                        {shortStatusLabel(tone)}
                      </p>
                      {summary.coveringBookings[0]?.customerName ? (
                        <p className="mt-1 text-[10px] text-[#4B5563] truncate">
                          {summary.coveringBookings.length > 1
                            ? `${summary.coveringBookings.length} bookings`
                            : summary.coveringBookings[0].customerName}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Inline slot panel — Slot Based only */}
              {isSlotBased && expandedDate && (
                <div className="rounded-[12px] border border-[#E8EAF0] bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[#111827]">
                        {formatAvailabilityDate(expandedDate)}
                      </p>
                      <p className="text-[12px] text-[#9CA3AF]">Select available slots</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setExpandedDate(null)}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-[#E8EAF0] text-[#6B7280] hover:bg-[#F8F9FB]"
                      aria-label="Close slots"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {expandedSlots.length === 0 ? (
                    <p className="text-sm text-[#6B7280] py-4 text-center">
                      No slots configured for this venue.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {expandedSlots.map((slot) => {
                        const picked = slotPicks.some(
                          (p) => p.date === slot.date && p.slotKey === slot.slotKey
                        );
                        const available = slot.status === "available";
                        const bookedId = [slot.bookingId, slot.bookingRef].find(isBookingUuid);
                        return (
                          <button
                            key={`${slot.date}-${slot.slotKey}`}
                            type="button"
                            disabled={!available && !picked && !bookedId}
                            onClick={() => {
                              if (!available && bookedId) {
                                onViewBooking({ bookingId: bookedId });
                                return;
                              }
                              toggleSlotPick(slot);
                            }}
                            className={`rounded-[10px] border px-3.5 py-3 text-left transition-colors ${
                              picked
                                ? "border-[#C89B3C] bg-[#FFF8F3]"
                                : available
                                  ? "border-[#E8EAF0] hover:border-[#C89B3C]/50 bg-white"
                                  : "border-[#E8EAF0] bg-[#F9FAFB] opacity-70 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#111827]">
                                {slot.slotName}
                                {picked ? " ✓" : ""}
                              </p>
                              <SlotStatusDot status={slot.status} />
                            </div>
                            <p className="text-[11px] text-[#9CA3AF] mt-1">{slot.timeLabel}</p>
                            <p
                              className={`text-[11px] font-medium mt-1.5 ${
                                available ? "text-[#16A34A]" : "text-[#DC2626]"
                              }`}
                            >
                              {slot.status === "available"
                                ? "Available"
                                : slot.status === "completed"
                                  ? "Completed"
                                  : "Booked"}
                            </p>
                            {!available && (slot.bookingRef || slot.customerName) ? (
                              <div className="mt-1 space-y-0.5">
                                {slot.bookingRef ? (
                                  <p className="text-[11px] font-medium text-[#111827] truncate">
                                    Booking {slot.bookingRef}
                                  </p>
                                ) : null}
                                {slot.customerName ? (
                                  <p className="text-[11px] text-[#4B5563] truncate">
                                    {slot.customerName}
                                    {slot.guests ? ` · ${slot.guests} guests` : ""}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {expandedFood.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[12px] font-semibold text-[#6B7280]">Food</p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {expandedFood.map((slot) => {
                          const available = slot.status === "available";
                          const bookedId = [slot.bookingId, slot.bookingRef].find(isBookingUuid);
                          return (
                            <button
                              key={`food-${slot.slotKey}`}
                              type="button"
                              disabled={!bookedId}
                              onClick={() => {
                                if (bookedId) onViewBooking({ bookingId: bookedId });
                              }}
                              className={`rounded-[10px] border px-3.5 py-3 text-left ${
                                bookedId ? "hover:border-[#C89B3C] cursor-pointer" : "cursor-default"
                              } ${available ? "border-[#E8EAF0] bg-white" : "border-[#E8EAF0] bg-[#F9FAFB]"}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[#111827]">{slot.slotName}</p>
                                <SlotStatusDot status={slot.status} />
                              </div>
                              <p
                                className={`text-[11px] font-medium mt-1.5 ${
                                  available ? "text-[#16A34A]" : "text-[#DC2626]"
                                }`}
                              >
                                {available ? "Available" : "Booked"}
                              </p>
                              {!available && slot.customerName ? (
                                <p className="text-[11px] text-[#4B5563] mt-1 truncate">
                                  {slot.customerName}
                                  {slot.guests ? ` · ${slot.guests} guests` : ""}
                                </p>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <DateListView
              rows={listRows}
              today={today}
              isSlotBased={isSlotBased}
              checkedDates={checkedDates}
              focusDate={focusDate}
              onSelect={listSelectDate}
              onOpenDate={(date) => {
                void handleDayClick(date);
              }}
              onViewBooking={(date) => {
                void (async () => {
                  if (await openBookedDate(date, true)) return;
                  setFocusDate(date);
                  setExpandedDate(date);
                  setViewMode("calendar");
                })();
              }}
            />
          )}
        </div>
      </section>

      {/* Detail panel */}
      <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8EAF0]">
          <p className="text-sm font-semibold text-[#111827]">Selected Details</p>
          <p className="text-[12px] text-[#9CA3AF] mt-0.5">
            {formatAvailabilityDate(focusDate)}
          </p>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            <Meta label="Selected Date" value={formatAvailabilityDate(focusDate)} />
            <Meta label="Venue" value={venue.name} />
            <Meta
              label="Booking Type"
              value={venue.bookingModel === "venue_food" ? "Venue + Food" : "Venue Only"}
            />
            <Meta label="Pricing Mode" value={isSlotBased ? "Slot Based" : "Full Day"} />
            <Meta label="Operating Hours" value={venue.operatingHours || "9 AM – 11 PM"} />
            <Meta
              label="Booking Status"
              value={
                focusSummary?.summaryLabel?.replace(/^✓\s*/, "") ||
                displayLabelForTone(focusSummary?.statusTone || "available")
              }
            />
            <Meta label="Booking Count" value={String(focusCovering.length)} />
            <Meta
              label="Guest Count"
              value={String(focusCovering.reduce((sum, b) => sum + (b.guestCount || 0), 0) || "—")}
            />
          </div>

          {isSlotBased ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {focusSlots.map((slot) => {
                const bookedId = [slot.bookingId, slot.bookingRef].find(isBookingUuid);
                return (
                  <button
                    key={slot.slotKey}
                    type="button"
                    onClick={() => {
                      if (bookedId) onViewBooking({ bookingId: bookedId });
                    }}
                    className={`rounded-[10px] border border-[#E8EAF0] px-3.5 py-3 text-left ${
                      bookedId ? "hover:border-[#C89B3C] cursor-pointer" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-[#111827]">{slot.slotName}</p>
                    <p className="text-[11px] text-[#9CA3AF] mt-0.5">{slot.timeLabel}</p>
                    <p
                      className={`text-[12px] font-medium mt-2 ${
                        slot.status === "available" ? "text-[#16A34A]" : "text-[#DC2626]"
                      }`}
                    >
                      {slot.status === "available"
                        ? "Available"
                        : slot.status === "completed"
                          ? "Completed"
                          : "Booked"}
                    </p>
                    {slot.customerName ? (
                      <p className="text-[11px] text-[#4B5563] mt-1 truncate">
                        {slot.customerName}
                        {slot.guests ? ` · ${slot.guests} guests` : ""}
                      </p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[10px] border border-[#E8EAF0] px-3.5 py-3 max-w-sm">
              <p className="text-sm font-semibold text-[#111827]">Full Day</p>
              <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                {venue.operatingHours || "9 AM – 11 PM"}
              </p>
              <p
                className={`text-[12px] font-medium mt-2 ${
                  focusSummary?.statusTone === "available"
                    ? "text-[#16A34A]"
                    : focusSummary?.statusTone === "booked"
                      ? "text-[#DC2626]"
                      : "text-[#6B7280]"
                }`}
              >
                {shortStatusLabel(focusSummary?.statusTone || "available")}
              </p>
            </div>
          )}

          {(() => {
            const dayRow = availability.find((row) => row.date === focusDate && !row.slotKey);
            const availableSlots =
              dayRow?.availableSlotNames?.length
                ? dayRow.availableSlotNames.join(", ")
                : focusSlots.filter((s) => s.status === "available").map((s) => s.slotName).join(", ") || "—";
            const bookedSlots =
              dayRow?.bookedSlotNames?.length
                ? dayRow.bookedSlotNames.join(", ")
                : focusCovering.flatMap((b) => b.selectedSlots || []).join(", ") || "—";
            const availableFood = dayRow?.availableFoodSlots?.join(", ") || "—";
            const bookedFood =
              dayRow?.bookedFoodSlots?.length
                ? dayRow.bookedFoodSlots.join(", ")
                : focusCovering.flatMap((b) => b.selectedFoodSlots || []).join(", ") || "—";
            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Meta label="Available Slots" value={availableSlots} />
                <Meta label="Booked Slots" value={bookedSlots} />
                <Meta label="Available Food Slots" value={availableFood} />
                <Meta label="Booked Food Slots" value={bookedFood} />
              </div>
            );
          })()}

          {focusCovering.length > 0 && (
            <div className="space-y-2">
              <p className="text-[12px] font-semibold text-[#6B7280]">
                {focusCovering.length === 1 ? "Booking" : `${focusCovering.length} Bookings`}
              </p>
              {focusCovering.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[10px] border border-[#E8EAF0] px-3.5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#111827]">
                      {booking.bookingId}
                      {booking.customerName ? ` · ${booking.customerName}` : ""}
                    </p>
                    <p className="text-[12px] text-[#6B7280]">
                      Guests {booking.guestCount || 0}
                      {booking.selectedSlots?.length ? ` · ${booking.selectedSlots.join(", ")}` : booking.slot ? ` · ${booking.slot}` : ""}
                      {booking.selectedFoodSlots?.length ? ` · Food: ${booking.selectedFoodSlots.join(", ")}` : ""}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {booking.bookingStatus} · {booking.paymentStatus || "pending"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewBooking({ bookingId: booking.id })}
                    className="h-8 px-3 rounded-lg border border-[#E8EAF0] text-[12px] font-semibold text-[#374151] hover:border-[#C89B3C] hover:text-[#C89B3C] shrink-0"
                  >
                    View Booking
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sticky selection bar — portaled to body (admin shell transform breaks position:fixed) */}
      {footerVisible &&
        portalReady &&
        createPortal(
          <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-[200] border-t border-[#E8EAF0] bg-white/98 backdrop-blur-md shadow-[0_-8px_24px_rgba(16,24,40,0.1)]">
            <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#111827]">
                  {isSlotBased
                    ? `${selectedDateCount} Date${selectedDateCount === 1 ? "" : "s"} · ${slotPicks.length} Slot${slotPicks.length === 1 ? "" : "s"}`
                    : `${checkedDates.length} Day${checkedDates.length === 1 ? "" : "s"} Selected`}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {isSlotBased
                    ? slotPicks.map((p) => (
                        <span
                          key={`${p.date}-${p.slotKey}`}
                          className="inline-flex items-center h-6 px-2 rounded-md border border-[#FFD4B0] bg-[#FFF8F3] text-[11px] font-medium text-[#111827]"
                        >
                          {formatAvailabilityDate(p.date)} · {p.slotName}
                        </span>
                      ))
                    : [...checkedDates].sort().map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center h-6 px-2 rounded-md border border-[#FFD4B0] bg-[#FFF8F3] text-[11px] font-medium text-[#111827]"
                        >
                          {formatAvailabilityDate(d)}
                        </span>
                      ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" icon={X} onClick={clearSelection}>
                  Clear Selection
                </Button>
                <Button variant="primary" size="sm" onClick={proceed}>
                  Proceed to Booking
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function DateListView({
  rows,
  today,
  isSlotBased,
  checkedDates,
  focusDate,
  onSelect,
  onOpenDate,
  onViewBooking,
}: {
  rows: Array<{
    date: string;
    summary: DaySummary;
    booking: LiveBookingLite | null;
    timeLabel: string;
    bookingCount: number;
    bookedSlots: string;
    availableSlots: string;
    bookedFood: string;
    availableFood: string;
    guestCount: number;
  }>;
  today: string;
  isSlotBased: boolean;
  checkedDates: string[];
  focusDate: string;
  onSelect: (date: string) => void;
  onOpenDate: (date: string) => void;
  onViewBooking: (date: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[#E8EAF0]">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="bg-[#F8F9FB] text-left text-[11px] uppercase tracking-wide text-[#9CA3AF]">
            {[
              "Date",
              "Status",
              "Booked Slots",
              "Available Slots",
              "Booked Food Slots",
              "Available Food Slots",
              "Bookings Count",
              "Guests",
              "Action",
            ].map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-10 text-center text-sm text-[#6B7280]">
                No dates match this filter.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => {
              const tone = row.summary.statusTone;
              const canBook = isDateBookable(tone, row.date, today);
              const isChecked = checkedDates.includes(row.date);
              const bookingCount = row.bookingCount || row.summary.coveringBookings.length;
              const hasBooking =
                bookingCount > 0 &&
                (tone === "booked" || tone === "completed" || tone === "partial");
              return (
                <tr
                  key={row.date}
                  className={`h-12 border-t border-[#E8EAF0] ${
                    isChecked || focusDate === row.date
                      ? "bg-[#FFF8F3]"
                      : i % 2 === 1
                        ? "bg-[#FCFCFD]"
                        : "bg-white"
                  }`}
                >
                  <td className="px-3 py-0 font-medium text-[#111827] whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onOpenDate(row.date)}
                      className="hover:text-[#C89B3C] hover:underline"
                    >
                      {formatDate(row.date)}
                    </button>
                  </td>
                  <td className="px-3 py-0">
                    <StatusTonePill tone={tone} label={shortStatusLabel(tone)} />
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] max-w-[140px] truncate">
                    {row.bookedSlots && row.bookedSlots !== "—" ? row.bookedSlots : "—"}
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] max-w-[140px] truncate">
                    {row.availableSlots && row.availableSlots !== "—" ? row.availableSlots : "—"}
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] max-w-[140px] truncate">
                    {row.bookedFood && row.bookedFood !== "—" ? row.bookedFood : "—"}
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] max-w-[140px] truncate">
                    {row.availableFood && row.availableFood !== "—" ? row.availableFood : "—"}
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] whitespace-nowrap">
                    {bookingCount || "—"}
                  </td>
                  <td className="px-3 py-0 text-[#4B5563] whitespace-nowrap">
                    {hasBooking ? row.guestCount || "—" : "—"}
                  </td>
                  <td className="px-3 py-0">
                    {hasBooking ? (
                      <button
                        type="button"
                        onClick={() => onViewBooking(row.date)}
                        className="h-8 px-3 rounded-lg border border-[#E8EAF0] text-[11px] font-semibold text-[#374151] hover:border-[#C89B3C] hover:text-[#C89B3C]"
                      >
                        {bookingCount > 1 ? `View ${bookingCount} Bookings` : "View Booking"}
                      </button>
                    ) : canBook ? (
                      <button
                        type="button"
                        onClick={() => onSelect(row.date)}
                        className="h-8 px-3 rounded-lg border border-[#FFD4B0] bg-[#FFF8F3] text-[11px] font-semibold text-[#C89B3C]"
                      >
                        {isSlotBased ? "Choose Slots" : "Select"}
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#9CA3AF]">—</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border border-[#E8EAF0] px-3 py-2.5">
      <p className="text-[11px] text-[#9CA3AF]">{label}</p>
      <p className="text-sm font-semibold text-[#111827] mt-0.5 truncate">{value}</p>
    </div>
  );
}

function SlotStatusDot({ status }: { status: DayAvailabilityStatus }) {
  const color =
    status === "available"
      ? "bg-[#16A34A]"
      : status === "booked"
        ? "bg-[#DC2626]"
        : status === "completed"
          ? "bg-[#2563EB]"
          : "bg-[#9CA3AF]";
  return <span className={`w-2 h-2 rounded-full shrink-0 ${color}`} />;
}

function StatusTonePill({ tone, label }: { tone: CalendarDayTone; label: string }) {
  const map: Record<string, string> = {
    available: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    booked: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
    partial: "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]",
    completed: "bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]",
    no_booking: "bg-[#F9FAFB] text-[#9CA3AF] border-[#E5E7EB]",
    blocked: "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]",
    holiday: "bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${map[tone] || map.available}`}
    >
      {label}
    </span>
  );
}

function LegendSwatch({ tone, label }: { tone: CalendarDayTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded border ${statusCellClass(tone)}`} />
      {label}
    </span>
  );
}

function shortStatusLabel(tone: CalendarDayTone) {
  switch (tone) {
    case "booked":
      return "Booked";
    case "completed":
      return "Completed";
    case "no_booking":
      return "No Booking";
    case "blocked":
      return "Blocked";
    case "holiday":
      return "Holiday";
    case "partial":
      return "Partially Booked";
    default:
      return "Available";
  }
}

function statusCellClass(tone: CalendarDayTone) {
  switch (tone) {
    case "booked":
      return "border-[#FECACA] bg-[#FEF2F2]";
    case "completed":
      return "border-[#BFDBFE] bg-[#EFF6FF]";
    case "no_booking":
      return "border-[#E5E7EB] bg-[#F9FAFB]";
    case "partial":
      return "border-[#FDE68A] bg-[#FFFBEB]";
    case "blocked":
      return "border-[#E5E7EB] bg-[#F3F4F6]";
    case "holiday":
      return "border-[#DDD6FE] bg-[#F5F3FF]";
    default:
      return "border-[#BBF7D0] bg-[#ECFDF3]";
  }
}

function summaryTextClass(tone: CalendarDayTone) {
  switch (tone) {
    case "booked":
      return "text-[#B91C1C]";
    case "completed":
      return "text-[#2563EB]";
    case "no_booking":
      return "text-[#9CA3AF]";
    case "blocked":
      return "text-[#6B7280]";
    case "holiday":
      return "text-[#7C3AED]";
    case "partial":
      return "text-[#D97706]";
    default:
      return "text-[#15803D]";
  }
}

function monthSelectOptions() {
  const opts: { value: string; label: string }[] = [];
  const base = new Date();
  for (let i = 0; i <= 11; i += 1) {
    const d = new Date(base.getFullYear(), base.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    opts.push({
      value,
      label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
    });
  }
  return opts;
}
