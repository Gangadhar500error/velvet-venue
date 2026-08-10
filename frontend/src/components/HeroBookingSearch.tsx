"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Search,
  Calendar,
  MapPin,
  Users,
  X,
  Building2,
  Sparkles,
} from "lucide-react";
import { allCities } from "@/data/cities";
import {
  venuesPath,
  VENUE_TYPE_FILTERS,
  VENUE_TYPE_FILTER_KEY,
} from "@/lib/routes";

const VENUE_TYPES = VENUE_TYPE_FILTERS.filter((f) => f.value !== "all").map((f) => ({
  label: f.label,
  filterValue: f.value,
}));

const EVENT_TYPES = [
  "Wedding",
  "Reception",
  "Engagement",
  "Birthday",
  "Corporate Event",
  "Conference",
  "Baby Shower",
  "Anniversary",
  "Cocktail Party",
  "Other",
] as const;

const GUEST_RANGES = ["1-50", "51-100", "101-200", "201-500", "500+"] as const;

const POPULAR_CITY_SLUGS = [
  "hyderabad",
  "warangal",
  "karimnagar",
  "visakhapatnam",
  "vijayawada",
  "bengaluru",
  "chennai",
  "mysuru",
] as const;

const CITY_SHORT_LABELS: Record<string, string> = {
  visakhapatnam: "Vizag",
};

type OpenField = "venueType" | "location" | "eventType" | "guests" | null;

interface FieldErrors {
  venueType?: string;
  location?: string;
}

const inputShell =
  "relative flex h-12 w-full items-center gap-2.5 rounded-xl border border-[#E9E9E9] bg-white px-3.5 transition-all duration-300 hover:border-[#C89A2B] focus-within:border-[#C89A2B] focus-within:shadow-[0_0_0_3px_rgba(200,154,43,0.12)]";

export default function HeroBookingSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [venueType, setVenueType] = useState("");
  const [locationSlug, setLocationSlug] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventType, setEventType] = useState("");
  const [guests, setGuests] = useState("");
  const [guestQuery, setGuestQuery] = useState("");
  const [openField, setOpenField] = useState<OpenField>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  const selectedCity = useMemo(
    () => allCities.find((c) => c.slug === locationSlug) ?? null,
    [locationSlug]
  );

  const filteredCities = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return allCities;
    return allCities.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q) ||
        c.slug.includes(q)
    );
  }, [locationQuery]);

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    if (!q) return [...GUEST_RANGES];
    return GUEST_RANGES.filter((g) => g.toLowerCase().includes(q));
  }, [guestQuery]);

  const popularCities = useMemo(
    () =>
      POPULAR_CITY_SLUGS.map((slug) => allCities.find((c) => c.slug === slug)).filter(
        Boolean
      ) as typeof allCities,
    []
  );

  const closeDropdowns = useCallback(() => setOpenField(null), []);

  const closeMobileModal = useCallback(() => {
    setMobileOpen(false);
    closeDropdowns();
  }, [closeDropdowns]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (mobileOpen) return;
      if (!rootRef.current?.contains(e.target as Node)) closeDropdowns();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (mobileOpen) closeMobileModal();
      else closeDropdowns();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [closeDropdowns, closeMobileModal, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const toggleField = (field: OpenField) => {
    setOpenField((prev) => (prev === field ? null : field));
  };

  const selectLocation = (slug: string, name: string) => {
    setLocationSlug(slug);
    setLocationQuery(name);
    setErrors((prev) => ({ ...prev, location: undefined }));
    closeDropdowns();
  };

  const buildSearchUrl = (citySlug: string) => venuesPath(citySlug);

  const applyVenueTypeHint = (filterValue?: string) => {
    try {
      if (filterValue && filterValue !== "all") {
        sessionStorage.setItem(VENUE_TYPE_FILTER_KEY, filterValue);
      } else {
        sessionStorage.removeItem(VENUE_TYPE_FILTER_KEY);
      }
    } catch {
      /* ignore */
    }
  };

  const handleSearch = () => {
    const nextErrors: FieldErrors = {};
    if (!venueType) nextErrors.venueType = "Required";
    if (!locationSlug) nextErrors.location = "Required";
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.venueType) setOpenField("venueType");
      else if (nextErrors.location) setOpenField("location");
      return;
    }

    const matched = VENUE_TYPES.find((t) => t.label === venueType);
    applyVenueTypeHint(matched?.filterValue);
    closeMobileModal();
    router.push(buildSearchUrl(locationSlug));
  };

  const handlePopularCity = (slug: string) => {
    const city = allCities.find((c) => c.slug === slug);
    if (!city) return;
    setLocationSlug(city.slug);
    setLocationQuery(city.name);
    setErrors((prev) => ({ ...prev, location: undefined }));

    const matched = venueType
      ? VENUE_TYPES.find((t) => t.label === venueType)
      : undefined;
    applyVenueTypeHint(matched?.filterValue);
    closeMobileModal();
    router.push(buildSearchUrl(city.slug));
  };

  const today = useMemo(() => new Date().toISOString().split("T")[0], []);

  const formatDisplayDate = (value: string) => {
    if (!value) return "Select Event Date";
    try {
      return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const triggerSummary = useMemo(() => {
    const parts = [venueType, locationQuery, eventType].filter(Boolean);
    if (parts.length === 0) return "Search venues, cities & events";
    return parts.join(" · ");
  }, [venueType, locationQuery, eventType]);

  const dropdownPanel =
    "absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-56 overflow-y-auto rounded-2xl border border-[#E9E9E9] bg-white py-1 shadow-xl";

  const dropdownItem = (active: boolean) =>
    `flex w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#F7E8C5] hover:text-[#6A1233] ${
      active ? "bg-[#F7E8C5] font-semibold text-[#6A1233]" : "text-[#2A2A2A]"
    }`;

  const renderSearchForm = (twoCol: boolean) => (
    <>
      <div className={`grid grid-cols-1 gap-3 ${twoCol ? "sm:grid-cols-2" : ""}`}>
        <div className="relative">
          <button
            type="button"
            onClick={() => toggleField("venueType")}
            className={`${inputShell} ${errors.venueType ? "border-red-400" : ""}`}
            aria-expanded={openField === "venueType"}
          >
            <Building2 className="h-4 w-4 shrink-0 text-[#C89A2B]" strokeWidth={1.75} />
            <span
              className={`flex-1 truncate text-left text-sm font-medium ${
                venueType ? "text-[#2A2A2A]" : "text-[#9A9A9A]"
              }`}
            >
              {venueType || "Venue Type"}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#C89A2B] transition-transform ${
                openField === "venueType" ? "rotate-180" : ""
              }`}
            />
          </button>
          {errors.venueType && (
            <span className="mt-1 block text-[11px] text-red-500">{errors.venueType}</span>
          )}
          {openField === "venueType" && (
            <div className={dropdownPanel}>
              {VENUE_TYPES.map((type) => (
                <button
                  key={type.label}
                  type="button"
                  onClick={() => {
                    setVenueType(type.label);
                    setErrors((prev) => ({ ...prev, venueType: undefined }));
                    closeDropdowns();
                  }}
                  className={dropdownItem(venueType === type.label)}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <div className={`${inputShell} ${errors.location ? "border-red-400" : ""}`}>
            <MapPin className="h-4 w-4 shrink-0 text-[#C89A2B]" strokeWidth={1.75} />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setLocationSlug("");
                setOpenField("location");
                setErrors((prev) => ({ ...prev, location: undefined }));
              }}
              onFocus={() => setOpenField("location")}
              placeholder="Location"
              className="flex-1 bg-transparent text-sm font-medium text-[#2A2A2A] placeholder:text-[#9A9A9A] focus:outline-none"
              autoComplete="off"
            />
            {locationQuery ? (
              <button
                type="button"
                aria-label="Clear location"
                onClick={() => {
                  setLocationQuery("");
                  setLocationSlug("");
                }}
                className="rounded-full p-0.5 text-[#9A9A9A] hover:bg-[#F7E8C5]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-[#C89A2B]" />
            )}
          </div>
          {errors.location && (
            <span className="mt-1 block text-[11px] text-red-500">{errors.location}</span>
          )}
          {openField === "location" && (
            <div className={dropdownPanel}>
              {filteredCities.length === 0 ? (
                <p className="px-4 py-3 text-sm text-[#8A8A8A]">No cities found</p>
              ) : (
                filteredCities.map((city) => (
                  <button
                    key={city.slug}
                    type="button"
                    onClick={() => selectLocation(city.slug, city.name)}
                    className={`flex w-full flex-col px-4 py-2.5 text-left transition-colors hover:bg-[#F7E8C5] ${
                      locationSlug === city.slug ? "bg-[#F7E8C5]" : ""
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#2A2A2A]">{city.name}</span>
                    <span className="text-xs text-[#8A8A8A]">{city.state}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <div className={inputShell}>
            <Calendar
              className="h-4 w-4 shrink-0 text-[#C89A2B] pointer-events-none"
              strokeWidth={1.75}
            />
            <span
              className={`flex-1 truncate text-sm font-medium pointer-events-none ${
                eventDate ? "text-[#2A2A2A]" : "text-[#9A9A9A]"
              }`}
            >
              {formatDisplayDate(eventDate)}
            </span>
            <input
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              onClick={() => closeDropdowns()}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Select event date"
            />
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => toggleField("eventType")}
            className={inputShell}
            aria-expanded={openField === "eventType"}
          >
            <Sparkles className="h-4 w-4 shrink-0 text-[#C89A2B]" strokeWidth={1.75} />
            <span
              className={`flex-1 truncate text-left text-sm font-medium ${
                eventType ? "text-[#2A2A2A]" : "text-[#9A9A9A]"
              }`}
            >
              {eventType || "Event Type"}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#C89A2B] transition-transform ${
                openField === "eventType" ? "rotate-180" : ""
              }`}
            />
          </button>
          {openField === "eventType" && (
            <div className={dropdownPanel}>
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setEventType(type);
                    closeDropdowns();
                  }}
                  className={dropdownItem(eventType === type)}
                >
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`relative ${twoCol ? "sm:col-span-2" : ""}`}>
          <button
            type="button"
            onClick={() => {
              setGuestQuery("");
              toggleField("guests");
            }}
            className={inputShell}
            aria-expanded={openField === "guests"}
          >
            <Users className="h-4 w-4 shrink-0 text-[#C89A2B]" strokeWidth={1.75} />
            <span
              className={`flex-1 truncate text-left text-sm font-medium ${
                guests ? "text-[#2A2A2A]" : "text-[#9A9A9A]"
              }`}
            >
              {guests
                ? guests === "500+"
                  ? "500+ Guests"
                  : `${guests} Guests`
                : "Guests"}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#C89A2B] transition-transform ${
                openField === "guests" ? "rotate-180" : ""
              }`}
            />
          </button>
          {openField === "guests" && (
            <div className={dropdownPanel}>
              <div className="border-b border-[#E9E9E9] p-2">
                <input
                  type="text"
                  value={guestQuery}
                  onChange={(e) => setGuestQuery(e.target.value)}
                  placeholder="Search guests..."
                  className="w-full rounded-lg border border-[#E9E9E9] bg-[#FFFDF8] px-3 py-2 text-sm focus:border-[#C89A2B] focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="max-h-44 overflow-y-auto py-1">
                {filteredGuests.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-[#8A8A8A]">No matches</p>
                ) : (
                  filteredGuests.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => {
                        setGuests(range);
                        closeDropdowns();
                      }}
                      className={dropdownItem(guests === range)}
                    >
                      {range === "500+" ? "500+ Guests" : `${range} Guests`}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSearch}
          className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:opacity-95 active:scale-[0.98] ${
            twoCol ? "sm:col-span-2" : ""
          }`}
          style={{
            background: "linear-gradient(135deg, #C89A2B, #D7A53A)",
            boxShadow: "0 8px 20px rgba(200,154,43,.3)",
          }}
        >
          <Search className="h-4 w-4 text-white" strokeWidth={2.5} />
          <span>Search Venues</span>
        </button>
      </div>

    
    </>
  );

  return (
    <>
      {/* Mobile: one search bar */}
      <div className="w-full max-w-md md:hidden animate-[heroSearchFadeUp_0.5s_ease-out_both]">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-white/95 p-2 pl-4 shadow-[0_16px_40px_rgba(0,0,0,.14)] backdrop-blur-md transition active:scale-[0.99]"
          aria-label="Open venue search"
        >
          <Search className="h-5 w-5 shrink-0 text-[#C89A2B]" strokeWidth={2.25} />
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-semibold text-[#2A2A2A]">
              {triggerSummary}
            </span>
            <span className="block text-[11px] text-[#8A8A8A]">
              Tap to search venues
            </span>
          </span>
          <span
            className="flex h-11 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #C89A2B, #D7A53A)",
              boxShadow: "0 6px 16px rgba(200,154,43,.35)",
            }}
          >
            Search
          </span>
        </button>
      </div>

      {/* Desktop / tablet: full card */}
      <div
        ref={rootRef}
        className="hidden md:block w-full max-w-[560px] lg:max-w-[600px] animate-[heroSearchFadeUp_0.5s_ease-out_both]"
      >
        <div
          className="rounded-2xl border border-white/50 p-5 md:p-6"
          style={{
            background: "rgba(255,255,255,.95)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            boxShadow: "0 20px 50px rgba(0,0,0,.12)",
          }}
        >
          <div className="mb-5">
            <h2 className="text-xl md:text-2xl font-bold leading-tight text-[#6A1233]">
              Find Your Perfect Venue
            </h2>
            <p className="mt-1 text-sm text-[#777777]">
              Wedding venues, banquet halls & more
            </p>
          </div>
          {renderSearchForm(true)}
        </div>
      </div>

      {/* Mobile modal — portaled above header */}
      {portalReady &&
        mobileOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 md:hidden">
            <button
              type="button"
              aria-label="Close search"
              className="absolute inset-0 bg-black/45"
              onClick={closeMobileModal}
            />
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="mobile-search-title"
              className="relative z-10 flex w-full max-w-md max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-[heroSearchFadeUp_0.28s_ease-out_both]"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-[#F0E8DC] px-4 py-3">
                <h2
                  id="mobile-search-title"
                  className="text-base font-bold text-[#6A1233]"
                >
                  Find Your Perfect Venue
                </h2>
                <button
                  type="button"
                  onClick={closeMobileModal}
                  aria-label="Close"
                  className="rounded-full p-1.5 text-[#6A1233] hover:bg-[#F7E8C5]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
                {renderSearchForm(false)}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
