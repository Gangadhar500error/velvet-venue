"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  ChevronDown,
  MapPin,
  Building2,
  IndianRupee,
  Users,
  Sparkles,
  Star,
  CalendarDays,
  PartyPopper,
} from "lucide-react";
import { VENUE_TYPE_FILTERS } from "@/lib/routes";
import {
  VenueFilterState,
  SIDEBAR_AMENITIES,
  DEFAULT_VENUE_FILTERS,
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
  PRICE_SLIDER_STEP,
  countActiveFilters,
} from "./filterTypes";

interface FilterSidebarProps {
  filters: VenueFilterState;
  areas: string[];
  onFilterChange: (filters: VenueFilterState) => void;
  onClose?: () => void;
  className?: string;
}

const capacityOptions = [
  { value: "all", label: "Any" },
  { value: "100+", label: "100+" },
  { value: "300+", label: "300+" },
  { value: "500+", label: "500+" },
  { value: "1000+", label: "1000+" },
];

const availabilityOptions = [
  { value: "all", label: "Any" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "This Weekend" },
];

const eventTypes = [
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "conference", label: "Conference" },
  { value: "engagement", label: "Engagement" },
  { value: "anniversary", label: "Anniversary" },
];

const GOLD = "#C89B3C";
const GOLD_HOVER = "#D4A73E";

function formatPriceShort(value: number) {
  if (value >= 100000) {
    const lakhs = value / 100000;
    return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
  }
  if (value >= 1000) return `₹${Math.round(value / 1000)}K`;
  return `₹${value}`;
}

function parsePriceRange(range: string): { min: number; max: number } {
  if (!range || range === "all") {
    return { min: PRICE_SLIDER_MIN, max: PRICE_SLIDER_MAX };
  }
  if (range.endsWith("+")) {
    const min = parseInt(range.replace(/\D/g, ""), 10) || 0;
    return { min, max: PRICE_SLIDER_MAX };
  }
  const [a, b] = range.split("-").map((p) => parseInt(p.replace(/\D/g, ""), 10));
  return {
    min: Number.isFinite(a) ? a : PRICE_SLIDER_MIN,
    max: Number.isFinite(b) ? b : PRICE_SLIDER_MAX,
  };
}

function Section({
  id,
  title,
  icon: Icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: typeof MapPin;
  open: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-[#ECECEC] last:border-b-0">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="flex w-full items-center justify-between gap-2 rounded-lg py-3.5 text-left transition-colors duration-250 hover:bg-[#FAFAFA] -mx-1 px-1"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-[16px] font-semibold text-[#1F2937]">
          <Icon className="h-4 w-4 text-[#C89B3C]" strokeWidth={2} />
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform duration-250 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-250 ease-out ${
          open ? "grid-rows-[1fr] opacity-100 pb-3.5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[13px] transition-all duration-250 hover:-translate-y-0.5 ${
        active
          ? "border border-[#C89B3C] bg-[#FBF6EA] font-semibold text-[#1F2937] shadow-sm"
          : "border border-transparent bg-[#F3F4F6] font-medium text-[#1F2937] hover:bg-[#F7E8C5]"
      }`}
    >
      {children}
    </button>
  );
}

function toggleInList(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((v) => v !== value)
    : [...list, value];
}

export default function FilterSidebar({
  filters,
  areas,
  onFilterChange,
  onClose,
  className = "",
}: FilterSidebarProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    area: true,
    venue_type: true,
    price: true,
    event_type: false,
    capacity: false,
    availability: false,
    amenities: false,
    rating: false,
    setting: false,
    badges: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const patch = (partial: Partial<VenueFilterState>) => {
    onFilterChange({ ...filters, ...partial });
  };

  const priceBounds = useMemo(
    () => parsePriceRange(filters.price_range),
    [filters.price_range]
  );

  const setPriceBounds = (min: number, max: number) => {
    let lo = Math.min(min, max);
    let hi = Math.max(min, max);
    lo = Math.max(PRICE_SLIDER_MIN, Math.min(lo, PRICE_SLIDER_MAX));
    hi = Math.max(PRICE_SLIDER_MIN, Math.min(hi, PRICE_SLIDER_MAX));

    if (lo <= PRICE_SLIDER_MIN && hi >= PRICE_SLIDER_MAX) {
      patch({ price_range: "all" });
      return;
    }
    patch({ price_range: `${lo}-${hi}` });
  };

  const activeCount = countActiveFilters(filters);

  const clearAll = () => {
    onFilterChange(DEFAULT_VENUE_FILTERS(filters.city));
  };

  const venueOptions = VENUE_TYPE_FILTERS.filter((f) => f.value !== "all");

  return (
    <aside
      className={`flex w-full max-w-[300px] flex-col overflow-hidden rounded-[18px] border border-[#ECECEC] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] ${className}`}
    >
      <div className="shrink-0 border-b border-[#ECECEC] px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-[#1F2937]">
              <Search className="h-4 w-4 text-[#C89B3C]" />
              {activeCount > 0
                ? `Filters (${activeCount} Selected)`
                : "Filters"}
            </h2>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              {activeCount > 0
                ? "Refine your venue search"
                : "Select multiple options"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[13px] font-medium text-[#C89B3C] transition-colors duration-250 hover:text-[#D4A73E]"
              >
                Clear All
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-[#6B7280] transition-colors hover:bg-[#F3F4F6] lg:hidden"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
        <Section
          id="area"
          title="Area"
          icon={MapPin}
          open={!!openSections.area}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            <Chip
              active={filters.areas.length === 0}
              onClick={() => patch({ areas: [] })}
            >
              All Areas
            </Chip>
            {areas.map((area) => (
              <Chip
                key={area}
                active={filters.areas.includes(area)}
                onClick={() => patch({ areas: toggleInList(filters.areas, area) })}
              >
                {area}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          id="venue_type"
          title="Venue Type"
          icon={Building2}
          open={!!openSections.venue_type}
          onToggle={toggleSection}
        >
          <div className="space-y-1">
            {venueOptions.map((opt) => {
              const checked = filters.venue_types.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-all duration-250 active:scale-[0.99] ${
                    checked
                      ? "border border-[#C89B3C] bg-[#FBF6EA]"
                      : "border border-transparent hover:bg-[#FAFAFA]"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-250 ${
                      checked
                        ? "border-[#C89B3C] bg-[#C89B3C]"
                        : "border-[#D1D5DB] bg-white"
                    }`}
                  >
                    {checked && (
                      <svg viewBox="0 0 12 12" className="h-3 w-3 text-white">
                        <path
                          d="M2.5 6.2l2.3 2.3 4.7-4.8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() =>
                      patch({
                        venue_types: toggleInList(filters.venue_types, opt.value),
                      })
                    }
                  />
                  <span
                    className={`text-[14px] ${
                      checked
                        ? "font-semibold text-[#1F2937]"
                        : "font-medium text-[#1F2937]"
                    }`}
                  >
                    {opt.label}
                  </span>
                </label>
              );
            })}
          </div>
        </Section>

        <Section
          id="price"
          title="Price Range"
          icon={IndianRupee}
          open={!!openSections.price}
          onToggle={toggleSection}
        >
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-[13px] font-medium text-[#1F2937]">
              <span>{formatPriceShort(priceBounds.min)}</span>
              <span className="text-[#6B7280]">to</span>
              <span>{formatPriceShort(priceBounds.max)}</span>
            </div>
            <label className="block">
              <span className="mb-1 block text-[12px] text-[#6B7280]">Min</span>
              <input
                type="range"
                min={PRICE_SLIDER_MIN}
                max={PRICE_SLIDER_MAX}
                step={PRICE_SLIDER_STEP}
                value={priceBounds.min}
                onChange={(e) =>
                  setPriceBounds(Number(e.target.value), priceBounds.max)
                }
                className="w-full"
                style={{ accentColor: GOLD }}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] text-[#6B7280]">Max</span>
              <input
                type="range"
                min={PRICE_SLIDER_MIN}
                max={PRICE_SLIDER_MAX}
                step={PRICE_SLIDER_STEP}
                value={priceBounds.max}
                onChange={(e) =>
                  setPriceBounds(priceBounds.min, Number(e.target.value))
                }
                className="w-full"
                style={{ accentColor: GOLD }}
              />
            </label>
          </div>
        </Section>

        <Section
          id="capacity"
          title="Capacity"
          icon={Users}
          open={!!openSections.capacity}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {capacityOptions.map((opt) => (
              <Chip
                key={opt.value}
                active={filters.capacity === opt.value}
                onClick={() => patch({ capacity: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          id="rating"
          title="Rating"
          icon={Star}
          open={!!openSections.rating}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            {[
              { value: "all", stars: 0, label: "Any rating" },
              { value: "3", stars: 3, label: "3+ stars" },
              { value: "4", stars: 4, label: "4+ stars" },
              { value: "4.5", stars: 5, label: "4.5+ stars" },
            ].map((opt) => {
              const active = filters.rating === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ rating: opt.value })}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-250 hover:bg-[#FAFAFA] ${
                    active ? "border border-[#C89B3C] bg-[#FBF6EA]" : "border border-transparent"
                  }`}
                >
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < opt.stars
                            ? "fill-[#C89B3C] text-[#C89B3C]"
                            : "text-[#E5E7EB]"
                        }`}
                      />
                    ))}
                  </span>
                  <span className="text-[13px] font-medium text-[#6B7280]">
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          id="amenities"
          title="Amenities"
          icon={Sparkles}
          open={!!openSections.amenities}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {SIDEBAR_AMENITIES.map((opt) => (
              <Chip
                key={opt.id}
                active={filters.amenities.includes(opt.id)}
                onClick={() =>
                  patch({
                    amenities: toggleInList(filters.amenities, opt.id),
                  })
                }
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          id="availability"
          title="Availability"
          icon={CalendarDays}
          open={!!openSections.availability}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-[#F3F4F6] p-1">
            {availabilityOptions.map((opt) => {
              const active = filters.availability === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => patch({ availability: opt.value })}
                  className={`min-w-[calc(50%-4px)] flex-1 rounded-lg px-2 py-2 text-[12px] font-medium transition-all duration-250 ${
                    active
                      ? "bg-white text-[#1F2937] shadow-sm"
                      : "text-[#6B7280] hover:text-[#1F2937]"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          id="event_type"
          title="Event Type"
          icon={PartyPopper}
          open={!!openSections.event_type}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {eventTypes.map((opt) => (
              <Chip
                key={opt.value}
                active={filters.event_types.includes(opt.value)}
                onClick={() =>
                  patch({
                    event_types: toggleInList(filters.event_types, opt.value),
                  })
                }
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          id="setting"
          title="Indoor / Outdoor"
          icon={MapPin}
          open={!!openSections.setting}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "Any" },
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
            ].map((opt) => (
              <Chip
                key={opt.value}
                active={filters.indoor_outdoor === opt.value}
                onClick={() => patch({ indoor_outdoor: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section
          id="badges"
          title="Highlights"
          icon={Sparkles}
          open={!!openSections.badges}
          onToggle={toggleSection}
        >
          <div className="flex flex-wrap gap-2">
            <Chip
              active={filters.featured_only}
              onClick={() => patch({ featured_only: !filters.featured_only })}
            >
              Featured Only
            </Chip>
            <Chip
              active={filters.popular_only}
              onClick={() => patch({ popular_only: !filters.popular_only })}
            >
              Popular Only
            </Chip>
            <Chip
              active={filters.special_offers}
              onClick={() => patch({ special_offers: !filters.special_offers })}
            >
              Special Offers
            </Chip>
          </div>
        </Section>
      </div>

      <div className="shrink-0 border-t border-[#ECECEC] bg-white px-5 py-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="flex-1 rounded-xl border border-[#ECECEC] bg-white px-3 py-2.5 text-[14px] font-semibold text-[#1F2937] transition-all duration-250 hover:border-[#C89B3C] hover:bg-[#FAFAFA] active:scale-[0.98]"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex-1 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(200,155,60,0.35)] transition-all duration-250 hover:brightness-105 active:scale-[0.98]"
            style={{ background: GOLD }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = GOLD_HOVER;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = GOLD;
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
