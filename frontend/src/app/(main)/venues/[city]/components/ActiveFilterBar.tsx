"use client";

import {
  X,
  MapPin,
  Building2,
  Star,
  Users,
  Car,
  Sparkles,
  CalendarDays,
  IndianRupee,
  PartyPopper,
} from "lucide-react";
import { VENUE_TYPE_FILTERS } from "@/lib/routes";
import {
  VenueFilterState,
  SIDEBAR_AMENITIES,
  countActiveFilters,
  PRICE_SLIDER_MIN,
  PRICE_SLIDER_MAX,
} from "./filterTypes";

export type ActiveFilterChip = {
  key: string;
  label: string;
  icon: typeof MapPin;
  onRemove: () => void;
};

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

const EVENT_LABELS: Record<string, string> = {
  wedding: "Wedding",
  reception: "Reception",
  birthday: "Birthday",
  corporate: "Corporate",
  conference: "Conference",
  engagement: "Engagement",
  baby_shower: "Baby Shower",
  anniversary: "Anniversary",
};

const AVAILABILITY_LABELS: Record<string, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  weekend: "This Weekend",
};

export function buildActiveFilterChips(
  filters: VenueFilterState,
  onChange: (next: VenueFilterState) => void
): ActiveFilterChip[] {
  const patch = (partial: Partial<VenueFilterState>) =>
    onChange({ ...filters, ...partial });

  const chips: ActiveFilterChip[] = [];

  filters.areas.forEach((area) => {
    chips.push({
      key: `area-${area}`,
      label: area,
      icon: MapPin,
      onRemove: () =>
        patch({ areas: filters.areas.filter((a) => a !== area) }),
    });
  });

  filters.venue_types.forEach((value) => {
    const label =
      VENUE_TYPE_FILTERS.find((f) => f.value === value)?.label || value;
    chips.push({
      key: `venue-${value}`,
      label,
      icon: Building2,
      onRemove: () =>
        patch({
          venue_types: filters.venue_types.filter((v) => v !== value),
        }),
    });
  });

  if (filters.price_range !== "all") {
    const { min, max } = parsePriceRange(filters.price_range);
    chips.push({
      key: "price",
      label: `${formatPriceShort(min)} – ${formatPriceShort(max)}`,
      icon: IndianRupee,
      onRemove: () => patch({ price_range: "all" }),
    });
  }

  if (filters.capacity !== "all") {
    chips.push({
      key: "capacity",
      label: `${filters.capacity} Guests`,
      icon: Users,
      onRemove: () => patch({ capacity: "all" }),
    });
  }

  if (filters.rating !== "all") {
    chips.push({
      key: "rating",
      label: `${filters.rating}+ Rating`,
      icon: Star,
      onRemove: () => patch({ rating: "all" }),
    });
  }

  filters.event_types.forEach((value) => {
    chips.push({
      key: `event-${value}`,
      label: EVENT_LABELS[value] || value,
      icon: PartyPopper,
      onRemove: () =>
        patch({
          event_types: filters.event_types.filter((e) => e !== value),
        }),
    });
  });

  if (filters.availability !== "all") {
    chips.push({
      key: "availability",
      label: AVAILABILITY_LABELS[filters.availability] || filters.availability,
      icon: CalendarDays,
      onRemove: () => patch({ availability: "all" }),
    });
  }

  filters.amenities.forEach((id) => {
    const label = SIDEBAR_AMENITIES.find((a) => a.id === id)?.label || id;
    chips.push({
      key: `amenity-${id}`,
      label,
      icon: id === "parking" || id === "valet_parking" ? Car : Sparkles,
      onRemove: () =>
        patch({
          amenities: filters.amenities.filter((a) => a !== id),
        }),
    });
  });

  if (filters.indoor_outdoor !== "all") {
    chips.push({
      key: "setting",
      label: filters.indoor_outdoor === "indoor" ? "Indoor" : "Outdoor",
      icon: MapPin,
      onRemove: () => patch({ indoor_outdoor: "all" }),
    });
  }

  if (filters.featured_only) {
    chips.push({
      key: "featured",
      label: "Featured",
      icon: Sparkles,
      onRemove: () => patch({ featured_only: false }),
    });
  }
  if (filters.popular_only) {
    chips.push({
      key: "popular",
      label: "Popular",
      icon: Sparkles,
      onRemove: () => patch({ popular_only: false }),
    });
  }
  if (filters.special_offers) {
    chips.push({
      key: "offers",
      label: "Special Offers",
      icon: Sparkles,
      onRemove: () => patch({ special_offers: false }),
    });
  }

  return chips;
}

interface ActiveFilterBarProps {
  filters: VenueFilterState;
  resultCount: number;
  cityName: string;
  onFilterChange: (next: VenueFilterState) => void;
  onClearAll: () => void;
}

export default function ActiveFilterBar({
  filters,
  resultCount,
  cityName,
  onFilterChange,
  onClearAll,
}: ActiveFilterBarProps) {
  const chips = buildActiveFilterChips(filters, onFilterChange);
  const activeCount = countActiveFilters(filters);

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-gray-600 font-body">
          Showing{" "}
          <span className="font-semibold text-[#1F2937]">{resultCount}</span>{" "}
          {resultCount === 1 ? "Venue" : "Venues"}
          {activeCount > 0 && (
            <span className="ml-2 text-[#6B7280]">
              · {activeCount} Active Filter{activeCount === 1 ? "" : "s"}
            </span>
          )}
        </p>
      </div>

      {chips.length > 0 && (
        <div className="rounded-xl border border-[#ECECEC] bg-white px-3 py-3 sm:px-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[13px] font-medium text-[#6B7280]">
              Active Filters
              <span className="ml-1 text-[#C89B3C]">({activeCount})</span>
            </p>
            <button
              type="button"
              onClick={onClearAll}
              className="text-[13px] font-semibold text-[#C89B3C] transition-colors duration-200 hover:text-[#D4A73E]"
            >
              Clear All
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5 sm:flex-wrap sm:overflow-visible">
            <span className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C89B3C] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1F2937] transition-all duration-200 hover:bg-[#FBF6EA] hover:scale-[1.02] animate-[filterChipIn_0.22s_ease-out_both]">
              <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" />
              {cityName}
              <button
                type="button"
                onClick={onClearAll}
                className="ml-0.5 rounded-full p-0.5 text-[#6B7280] transition-colors hover:bg-[#E7C87A]/50 hover:text-[#1F2937]"
                aria-label={`Clear filters for ${cityName}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>

            {chips.map((chip) => {
              const Icon = chip.icon;
              return (
                <span
                  key={chip.key}
                  className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#C89B3C] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1F2937] transition-all duration-200 hover:bg-[#FBF6EA] hover:scale-[1.02] animate-[filterChipIn_0.22s_ease-out_both]"
                >
                  <Icon className="h-3.5 w-3.5 text-[#C89B3C]" />
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="ml-0.5 rounded-full p-0.5 text-[#6B7280] transition-colors hover:bg-[#E7C87A]/50 hover:text-[#1F2937]"
                    aria-label={`Remove ${chip.label}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
