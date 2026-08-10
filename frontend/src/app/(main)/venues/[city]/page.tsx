"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Filter, Map as MapIcon, X } from "lucide-react";
import dynamic from "next/dynamic";
import ListingGrid from "./components/ListingGrid";
import SortDropdown, { SortOption } from "./components/SortDropdown";
import EmptyState from "./components/EmptyState";
import ComingSoon from "./components/ComingSoon";
import LoadingSkeleton from "./components/LoadingSkeleton";
import Pagination from "./components/Pagination";
import FilterSidebar from "./components/FilterSidebar";
import ViewSwitcher from "./components/ViewSwitcher";
import QuoteRequestModal from "@/components/QuoteRequestModal";
import { getWorkspacesByCity, getAreasByCity, Workspace } from "./data/workspaces";
import { generateWorkspaceStructuredData, generateBreadcrumbStructuredData } from "@/lib/seo";
import { VENUE_TYPE_FILTER_KEY } from "@/lib/routes";
import {
  VenueFilterState,
  DEFAULT_VENUE_FILTERS,
  AMENITY_MAP,
  ViewMode,
  resolveVenueTypes,
  countActiveFilters,
} from "./components/filterTypes";
import ActiveFilterBar from "./components/ActiveFilterBar";

const VenueMap = dynamic(() => import("./components/VenueMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500">
      Loading map…
    </div>
  ),
});

const ITEMS_PER_PAGE = 9;

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Wedding",
  reception: "Reception",
  birthday: "Birthday",
  corporate: "Corporate",
  conference: "Conference",
  engagement: "Engagement",
  baby_shower: "Baby Shower",
  anniversary: "Anniversary",
};

const OUTDOOR_TYPES = new Set(["Outdoor Venue", "Farm House", "Beach Venue", "Resort"]);

export default function VenuesCityPage() {
  const params = useParams();
  const city = (params.city as string) || "hyderabad";

  const formattedCity = city
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [filters, setFilters] = useState<VenueFilterState>(() =>
    DEFAULT_VENUE_FILTERS(formattedCity)
  );
  const [sortBy, setSortBy] = useState<SortOption>("recommended");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [quoteWorkspace, setQuoteWorkspace] = useState<Workspace | null>(null);
  const [isLoading] = useState(false);

  useEffect(() => {
    let initialTypes: string[] = [];
    try {
      const stored = sessionStorage.getItem(VENUE_TYPE_FILTER_KEY);
      if (stored) {
        sessionStorage.removeItem(VENUE_TYPE_FILTER_KEY);
        if (stored !== "all") initialTypes = [stored];
      }
    } catch {
      /* ignore */
    }

    setFilters({
      ...DEFAULT_VENUE_FILTERS(formattedCity),
      venue_types: initialTypes,
    });
    setCurrentPage(1);
    setViewMode("list");
    setHighlightedId(null);
  }, [formattedCity]);

  const allWorkspaces = useMemo(
    () => getWorkspacesByCity(formattedCity),
    [formattedCity]
  );

  const areas = useMemo(() => getAreasByCity(formattedCity), [formattedCity]);

  const filteredAndSortedWorkspaces = useMemo(() => {
    let filtered = [...allWorkspaces];

    if (filters.areas.length > 0) {
      filtered = filtered.filter((ws) => filters.areas.includes(ws.area));
    }

    if (filters.price_range !== "all") {
      filtered = filtered.filter((ws) => {
        if (filters.price_range === "300000+") return ws.price >= 300000;
        const [min, max] = filters.price_range.split("-").map((p) =>
          parseInt(p.replace(/\D/g, ""), 10)
        );
        return ws.price >= min && ws.price <= max;
      });
    }

    const venueTypes = resolveVenueTypes(filters.venue_types);
    if (venueTypes) {
      filtered = filtered.filter((ws) => venueTypes.includes(ws.type));
    }

    if (filters.capacity !== "all") {
      const minCapacity = parseInt(filters.capacity.replace(/\D/g, ""), 10);
      if (!Number.isNaN(minCapacity)) {
        filtered = filtered.filter((ws) => (ws.capacity || 0) >= minCapacity);
      }
    }

    if (filters.event_types.length > 0) {
      const labels = filters.event_types.map(
        (et) => EVENT_TYPE_LABELS[et] || et
      );
      filtered = filtered.filter((ws) =>
        (ws.eventTypes || []).some((et) =>
          labels.some((label) => et.toLowerCase() === label.toLowerCase())
        )
      );
    }

    if (filters.rating !== "all") {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter((ws) => ws.rating >= minRating);
    }

    if (filters.indoor_outdoor === "outdoor") {
      filtered = filtered.filter(
        (ws) =>
          OUTDOOR_TYPES.has(ws.type) ||
          ws.amenities.some((a) => /lawn|outdoor|garden/i.test(a))
      );
    } else if (filters.indoor_outdoor === "indoor") {
      filtered = filtered.filter((ws) => !OUTDOOR_TYPES.has(ws.type));
    }

    if (filters.featured_only) {
      filtered = filtered.filter((ws) => ws.badge === "Featured");
    }
    if (filters.popular_only) {
      filtered = filtered.filter((ws) => ws.badge === "Popular");
    }
    if (filters.special_offers) {
      filtered = filtered.filter((ws) => ws.badge === "Special Offer");
    }

    if (filters.amenities.length > 0) {
      filtered = filtered.filter((ws) =>
        filters.amenities.every((amenity) => {
          const label = AMENITY_MAP[amenity] || amenity;
          if (amenity === "wheelchair") {
            return ws.amenities.some((a) => /wheelchair|accessible/i.test(a));
          }
          return ws.amenities.includes(label);
        })
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating-high":
          return b.rating - a.rating;
        case "popularity":
          return b.reviewCount - a.reviewCount;
        case "newest":
          return b.id.localeCompare(a.id);
        case "recommended":
        default: {
          const badgeOrder = { Featured: 3, Popular: 2, "Special Offer": 1 };
          const aBadge = badgeOrder[a.badge as keyof typeof badgeOrder] || 0;
          const bBadge = badgeOrder[b.badge as keyof typeof badgeOrder] || 0;
          if (aBadge !== bBadge) return bBadge - aBadge;
          return b.rating - a.rating;
        }
      }
    });

    return filtered;
  }, [allWorkspaces, filters, sortBy]);

  const totalPages = Math.ceil(filteredAndSortedWorkspaces.length / ITEMS_PER_PAGE);
  const paginatedWorkspaces = useMemo(() => {
    if (viewMode === "map") return filteredAndSortedWorkspaces;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedWorkspaces.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedWorkspaces, currentPage, viewMode]);

  const handleFilterChange = useCallback((next: VenueFilterState) => {
    setFilters(next);
    setCurrentPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_VENUE_FILTERS(formattedCity));
    setCurrentPage(1);
  }, [formattedCity]);

  const handlePinClick = useCallback((id: string) => {
    setHighlightedId(id);
    const el = document.getElementById(`venue-card-${id}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const handleGetQuote = (workspace: Workspace) => {
    setQuoteWorkspace(workspace);
    setQuoteModalOpen(true);
  };

  const showMap = viewMode === "split" || viewMode === "map" || mobileMapOpen;

  const structuredData = useMemo(
    () => [
      generateWorkspaceStructuredData(
        formattedCity,
        "Wedding & Event Venues",
        filteredAndSortedWorkspaces.length
      ),
      generateBreadcrumbStructuredData([
        { name: "Home", url: "https://www.velvetvenues.com" },
        { name: "Home", url: "https://www.velvetvenues.com/" },
        {
          name: "Venues",
          url: `https://www.velvetvenues.com/venues/${params.city}`,
        },
        {
          name: formattedCity,
          url: `https://www.velvetvenues.com/venues/${params.city}`,
        },
      ]),
    ],
    [formattedCity, filteredAndSortedWorkspaces.length, params.city]
  );

  const activeFilterCount = countActiveFilters(filters);

  const filterSidebar = (
    <FilterSidebar
      filters={filters}
      areas={areas}
      onFilterChange={handleFilterChange}
    />
  );

  const activeFilterBar = (
    <ActiveFilterBar
      filters={filters}
      resultCount={filteredAndSortedWorkspaces.length}
      cityName={formattedCity}
      onFilterChange={handleFilterChange}
      onClearAll={handleResetFilters}
    />
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[0]) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData[1]) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Title */}
        <div className="bg-white pt-14 border-b border-gray-100">
          
        </div>

        <div className="container-custom px-4 sm:px-6 lg:px-8 pt-4">
          {/* Toolbar */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="">
            <h1 className="text-base lg:text-2xl font-bold text-gray-900 font-display">
              Wedding & Event Venues in{" "}
              <span className="text-orange-500">{formattedCity}</span>
            </h1>
          </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="hidden lg:block">
                <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
              </div>
              {allWorkspaces.length > 0 && (
                <SortDropdown
                  sortBy={sortBy}
                  onSortChange={(s) => {
                    setSortBy(s);
                    setCurrentPage(1);
                  }}
                />
              )}
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
          ) : allWorkspaces.length === 0 ? (
            <ComingSoon workspaceType="Venue" cityName={formattedCity} />
          ) : (
            <div className="flex flex-col gap-4 lg:flex-row">
              {/* Left filters — sticky, natural height, no inner scroll */}
              {viewMode !== "map" && (
                <aside className="hidden lg:block w-[300px] max-w-[300px] shrink-0 self-start sticky top-36">
                  {filterSidebar}
                </aside>
              )}

              {/* Right cards */}
              {viewMode !== "map" && (
                <div className="min-w-0 flex-1">
                  {activeFilterBar}
                  {paginatedWorkspaces.length > 0 ? (
                    <>
                      <ListingGrid
                        workspaces={paginatedWorkspaces}
                        city={formattedCity}
                        onGetQuote={handleGetQuote}
                        columns={viewMode === "split" ? "split" : "default"}
                        highlightedId={highlightedId}
                        onHover={setHighlightedId}
                      />
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </>
                  ) : (
                    <EmptyState onReset={handleResetFilters} />
                  )}
                </div>
              )}

              {/* Split map */}
              {viewMode === "split" && (
                <div className="hidden lg:block w-[420px] shrink-0 self-start sticky top-36">
                  <div className="h-[calc(100vh-10rem)] overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <VenueMap
                      venues={filteredAndSortedWorkspaces}
                      citySlug={city}
                      highlightedId={highlightedId}
                      onPinClick={handlePinClick}
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}

              {/* Full map desktop */}
              {viewMode === "map" && (
                <div className="relative hidden lg:flex min-h-[560px] h-[calc(100vh-14rem)] w-full overflow-hidden rounded-xl border border-gray-200">
                  <VenueMap
                    venues={filteredAndSortedWorkspaces}
                    citySlug={city}
                    highlightedId={highlightedId}
                    onPinClick={handlePinClick}
                    className="absolute inset-0 h-full w-full"
                  />
                  <div className="relative z-10 m-3 flex w-[360px] max-h-[calc(100%-24px)] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/95 shadow-xl backdrop-blur">
                    <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {filteredAndSortedWorkspaces.length} venues
                      </p>
                      <button
                        type="button"
                        onClick={() => setViewMode("list")}
                        className="rounded-full p-1.5 hover:bg-gray-100"
                        aria-label="Close map panel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3">
                      {filteredAndSortedWorkspaces.length > 0 ? (
                        <ListingGrid
                          workspaces={filteredAndSortedWorkspaces.slice(0, 30)}
                          city={formattedCity}
                          onGetQuote={handleGetQuote}
                          columns="stack"
                          highlightedId={highlightedId}
                          onHover={setHighlightedId}
                        />
                      ) : (
                        <EmptyState onReset={handleResetFilters} />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile floating actions */}
        <div className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-[#C89B3C] px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
          >
            <Filter className="h-4 w-4" />
            Filter
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileMapOpen(true)}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-lg border border-gray-200"
          >
            <MapIcon className="h-4 w-4 text-[#C89B3C]" />
            Map
          </button>
        </div>

        {/* Mobile filter bottom sheet */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col justify-end lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close filters"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl animate-[heroSearchFadeUp_0.25s_ease-out_both]">
              <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-gray-300" />
              <FilterSidebar
                filters={filters}
                areas={areas}
                onFilterChange={handleFilterChange}
                onClose={() => setMobileFiltersOpen(false)}
                className="max-h-[calc(92vh-12px)] max-w-none rounded-none border-0 shadow-none"
              />
            </div>
          </div>
        )}

        {/* Mobile full map + bottom sheet */}
        {mobileMapOpen && (
          <div className="fixed inset-0 z-[60] flex flex-col bg-white lg:hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">
                {filteredAndSortedWorkspaces.length} venues on map
              </p>
              <button
                type="button"
                onClick={() => setMobileMapOpen(false)}
                className="rounded-full p-2 hover:bg-gray-100"
                aria-label="Close map"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <VenueMap
                venues={filteredAndSortedWorkspaces}
                citySlug={city}
                highlightedId={highlightedId}
                onPinClick={handlePinClick}
                className="absolute inset-0"
              />
            </div>
            <div className="max-h-[42vh] overflow-y-auto border-t border-gray-200 bg-white p-3 rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,.08)]">
              <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300" />
              {filteredAndSortedWorkspaces.length > 0 ? (
                <ListingGrid
                  workspaces={filteredAndSortedWorkspaces.slice(0, 20)}
                  city={formattedCity}
                  onGetQuote={handleGetQuote}
                  columns="stack"
                  highlightedId={highlightedId}
                  onHover={setHighlightedId}
                />
              ) : (
                <EmptyState onReset={handleResetFilters} />
              )}
            </div>
          </div>
        )}

        <QuoteRequestModal
          isOpen={quoteModalOpen}
          onClose={() => {
            setQuoteModalOpen(false);
            setQuoteWorkspace(null);
          }}
          workspace={quoteWorkspace}
        />
      </div>
    </>
  );
}
