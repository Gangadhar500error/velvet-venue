"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ExternalLink,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { PageHeader } from "../../_components/ui/PageHeader";
import { Button } from "../../_components/ui/Button";
import { EntityLink } from "../../_components/relations/EntityLink";
import { useDemoStore } from "../../store/demoStore";
import { VenueAvailabilityPanel } from "../../venues/components/VenueAvailabilityPanel";
import type { DayAvailabilityStatus, Venue } from "../../venues/types";
import {
  bookingWindowLabel,
  displayLabelForTone,
  getDaySummary,
  monthSlotStats,
  toYmd,
} from "../../venues/availability";

function pickDefaultVenueId(venueList: Venue[]) {
  if (venueList.length === 0) return "";
  const sorted = [...venueList].sort((a, b) => a.name.localeCompare(b.name));
  return (sorted.find((v) => v.status === "published") || sorted[0]).id;
}

export function BookingCalendarWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const venues = useDemoStore((s) => s.venues);
  const businesses = useDemoStore((s) => s.businesses);
  const bookings = useDemoStore((s) => s.bookings);

  const urlVenueId = searchParams.get("venue") || "";
  const [venueId, setVenueId] = useState(urlVenueId);
  const [isPickingVenue, setIsPickingVenue] = useState(false);
  const [venueQuery, setVenueQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const defaultVenueId = useMemo(() => pickDefaultVenueId(venues), [venues]);

  const today = toYmd(new Date());
  const monthPrefix = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  /** Always read live venue from store (matches venue availability tab) */
  const venue = useMemo(() => {
    if (!venueId || isPickingVenue) return undefined;
    return venues.find((v) => v.id === venueId || v.venueId === venueId);
  }, [venues, venueId, isPickingVenue]);

  const businessProfile = useMemo(
    () =>
      venue
        ? businesses.find(
            (b) => b.id === venue.businessId || b.businessId === venue.businessId
          )
        : undefined,
    [businesses, venue]
  );

  const filteredVenues = useMemo(() => {
    const q = venueQuery.trim().toLowerCase();
    const list = [...venues].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.venueId.toLowerCase().includes(q) ||
        v.businessName.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q)
    );
  }, [venues, venueQuery]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get("venue") || "";
    if (fromUrl && fromUrl !== venueId) {
      setVenueId(fromUrl);
      setIsPickingVenue(false);
    }
  }, [searchParams, venueId]);

  useEffect(() => {
    if (urlVenueId || !defaultVenueId || isPickingVenue) return;
    if (!venueId) {
      setVenueId(defaultVenueId);
      const params = new URLSearchParams(searchParams.toString());
      params.set("venue", defaultVenueId);
      router.replace(`/admin/calendar?${params.toString()}`, { scroll: false });
    }
  }, [urlVenueId, defaultVenueId, venueId, isPickingVenue, router, searchParams]);

  const syncUrl = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) params.set("venue", id);
      else params.delete("venue");
      router.replace(`/admin/calendar?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const selectVenue = (id: string) => {
    setVenueId(id);
    setIsPickingVenue(false);
    setPickerOpen(false);
    setVenueQuery("");
    syncUrl(id);
  };

  const startChangeVenue = () => {
    setIsPickingVenue(true);
    setVenueId("");
    setVenueQuery("");
    setPickerOpen(true);
    syncUrl("");
  };

  const liveBookings = useMemo(() => {
    if (!venue) return [];
    return bookings
      .filter((b) => b.venueId === venue.venueId || b.venueId === venue.id)
      .map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        customerName: b.customerName,
        eventType: b.eventType,
        eventDate: b.eventDate,
        eventEndDate: b.eventEndDate,
        selectedDates: b.selectedDates,
        guestCount: b.guestCount,
        slot: b.slot || "Full Day",
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        bookingAmount: b.bookingAmount,
        startTime: b.startTime,
        endTime: b.endTime,
      }));
  }, [bookings, venue]);

  const stats = useMemo(() => {
    if (!venue) return null;
    return monthSlotStats(venue, venue.availability || [], monthPrefix, liveBookings);
  }, [venue, monthPrefix, liveBookings]);

  const todaySummary = useMemo(() => {
    if (!venue) return null;
    return getDaySummary({
      date: today,
      venue,
      availability: venue.availability || [],
      liveBookings,
    });
  }, [venue, today, liveBookings]);

  const handleBookSlot = (payload: {
    date: string;
    dates?: string[];
    slot: string;
    slots?: string[];
    status: DayAvailabilityStatus;
    eventEndDate?: string;
    amount?: number;
  }) => {
    if (!venue) return;
    if (payload.status === "booked") return;
    const dates = (payload.dates?.length ? payload.dates : [payload.date]).sort();
    const params = new URLSearchParams({
      from: "calendar",
      venueRef: venue.id,
      venueId: venue.venueId,
      venueName: venue.name,
      businessId: venue.businessId,
      businessName: venue.businessName,
      date: dates[0],
      dates: dates.join(","),
      slot: payload.slot || "Full Day",
    });
    if (dates.length > 1) {
      params.set("eventEndDate", payload.eventEndDate || dates[dates.length - 1]);
    } else if (payload.eventEndDate) {
      params.set("eventEndDate", payload.eventEndDate);
    }
    if (payload.slots?.length) params.set("slots", payload.slots.join("|"));
    if (venue.ownerId) params.set("ownerId", venue.ownerId);
    if (venue.ownerName) params.set("ownerName", venue.ownerName);
    if (venue.operatingHours) params.set("hours", venue.operatingHours);
    if (venue.pricingMethod) params.set("pricingMethod", venue.pricingMethod);
    router.push(`/admin/bookings/create?${params.toString()}`);
  };

  const openCreateBooking = () => {
    if (!venue) return;
    const params = new URLSearchParams({
      from: "calendar",
      venueRef: venue.id,
      venueId: venue.venueId,
      venueName: venue.name,
      businessId: venue.businessId,
      businessName: venue.businessName,
    });
    if (venue.ownerId) params.set("ownerId", venue.ownerId);
    if (venue.ownerName) params.set("ownerName", venue.ownerName);
    if (venue.operatingHours) params.set("hours", venue.operatingHours);
    router.push(`/admin/bookings/create?${params.toString()}`);
  };

  const openBooking = (row: { bookingRef?: string; bookingId?: string }) => {
    const target = row.bookingRef || row.bookingId;
    if (!target) return;
    router.push(`/admin/bookings/${target}`);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Calendar"
        subtitle="Venue-centric scheduling — select a venue to view its availability and bookings."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Booking Management" },
          { label: "Calendar" },
        ]}
      />

      {/* Venue selection */}
      <section className="bg-white border border-[#E8EAF0] rounded-[14px] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9CA3AF] mb-2">
          Venue Selection <span className="text-[#DC2626]">*</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
          <div ref={pickerRef} className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
            <input
              type="text"
              value={venue && !isPickingVenue ? venue.name : venueQuery}
              readOnly={Boolean(venue && !isPickingVenue)}
              onChange={(e) => {
                if (venue && !isPickingVenue) return;
                setVenueQuery(e.target.value);
                setPickerOpen(true);
              }}
              onFocus={() => {
                if (!venue || isPickingVenue) setPickerOpen(true);
              }}
              placeholder="Search Venue..."
              className="w-full h-10 pl-10 pr-10 rounded-lg border border-[#E8EAF0] text-sm text-[#111827] outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C]/30"
            />
            {(venue || venueQuery) && (
              <button
                type="button"
                onClick={startChangeVenue}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6]"
                aria-label="Clear venue"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            {pickerOpen && (isPickingVenue || !venue) && (
              <div className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg border border-[#E8EAF0] bg-white shadow-lg">
                {filteredVenues.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-[#6B7280] text-center">No venues found.</p>
                ) : (
                  filteredVenues.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVenue(v.id)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#FFF8F3] border-b border-[#F3F4F6] last:border-0"
                    >
                      <p className="text-sm font-semibold text-[#111827]">{v.name}</p>
                      <p className="text-[12px] text-[#6B7280] mt-0.5">
                        {v.venueId} · {v.city} · {v.businessName}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {venue && !isPickingVenue && (
            <Button
              variant="secondary"
              size="sm"
              icon={ChevronDown}
              onClick={startChangeVenue}
            >
              Change Venue
            </Button>
          )}
        </div>
      </section>

      {!venue && venues.length === 0 ? (
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-16 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#FFF3EB] flex items-center justify-center mb-4">
            <CalendarDays className="w-8 h-8 text-[#C89B3C]" />
          </div>
          <h2 className="text-lg font-semibold text-[#111827]">No venues available</h2>
          <p className="mt-2 text-sm text-[#6B7280] max-w-md mx-auto">
            Add a venue first to view its booking calendar and availability.
          </p>
        </div>
      ) : venue && !isPickingVenue ? (
        <>
          {/* Venue header summary */}
          <section className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
            <div className="px-4 py-3 bg-[#FFF3EB]/60 border-b border-[#E8EAF0] flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-[#111827] truncate">{venue.name}</h2>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-[#6B7280]">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {businessProfile ? (
                      <EntityLink href={`/admin/business-profile/${businessProfile.id}`}>
                        {venue.businessName}
                      </EntityLink>
                    ) : (
                      venue.businessName
                    )}
                  </span>
                  <span>{venue.venueType}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {venue.city}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link href={`/admin/venues/${venue.id}`}>
                  <Button variant="secondary" size="sm" icon={ExternalLink}>
                    Open Venue
                  </Button>
                </Link>
                <Button variant="primary" size="sm" icon={CalendarPlus} onClick={openCreateBooking}>
                  Create Booking
                </Button>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { label: "Operating Hours", value: venue.operatingHours || "—" },
                {
                  label: "Booking Window",
                  value: bookingWindowLabel(venue.maxAdvanceBookingDays),
                },
                {
                  label: "Today's Status",
                  value: todaySummary
                    ? displayLabelForTone(todaySummary.statusTone).replace(/^✓\s*/, "")
                    : "—",
                },
                { label: "Available Days", value: String(stats?.available ?? 0), tone: "text-[#16A34A]" },
                { label: "Booked Days", value: String(stats?.booked ?? 0), tone: "text-[#DC2626]" },
                { label: "Blocked Days", value: String(stats?.blocked ?? 0), tone: "text-[#6B7280]" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] px-3 py-2.5"
                >
                  <p className="text-[11px] text-[#9CA3AF]">{item.label}</p>
                  <p
                    className={`text-sm font-semibold text-[#111827] mt-0.5 truncate ${"tone" in item ? item.tone : ""}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}
              <div className="rounded-[10px] border border-[#E8EAF0] bg-[#FCFCFD] px-3 py-2.5 col-span-2 sm:col-span-1">
                <p className="text-[11px] text-[#9CA3AF]">Occupancy %</p>
                <p className="text-sm font-semibold text-[#111827] mt-0.5">{stats?.occupancy ?? 0}%</p>
              </div>
            </div>
          </section>

          <VenueAvailabilityPanel
            key={venue.id}
            venue={venue}
            availability={venue.availability || []}
            onBook={handleBookSlot}
            onViewBooking={openBooking}
            hideSummaryStats
            calendarPageMode
            bookActionLabel="Proceed to Booking"
          />
        </>
      ) : null}
    </div>
  );
}
