"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { VENUE_TYPE_FILTERS } from "@/lib/routes";

export interface VenueFilterState {
  city: string;
  price_range: string;
  amenities: string[];
  availability: string;
  venue_type: string;
  capacity: string;
  event_type: string;
}

interface VenueFiltersBarProps {
  filters: VenueFilterState;
  onFilterChange: (filters: VenueFilterState) => void;
}

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-50000", label: "Under ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000-300000", label: "₹1,00,000 - ₹3,00,000" },
  { value: "300000+", label: "₹3,00,000+" }
];

const availabilityOptions = [
  { value: "all", label: "All Availability" },
  { value: "today", label: "Today's Booking" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "weekend", label: "Weekend" },
  { value: "custom", label: "Custom Date" }
];

const venueTypes = VENUE_TYPE_FILTERS.map((f) => ({
  value: f.value,
  label: f.label,
}));

const capacityOptions = [
  { value: "all", label: "All Capacities" },
  { value: "100+", label: "100+ Guests" },
  { value: "300+", label: "300+ Guests" },
  { value: "500+", label: "500+ Guests" },
  { value: "1000+", label: "1000+ Guests" }
];

const eventTypes = [
  { value: "all", label: "All Event Types" },
  { value: "wedding", label: "Wedding" },
  { value: "reception", label: "Reception" },
  { value: "birthday", label: "Birthday" },
  { value: "corporate", label: "Corporate" },
  { value: "conference", label: "Conference" },
  { value: "engagement", label: "Engagement" },
  { value: "baby_shower", label: "Baby Shower" },
  { value: "anniversary", label: "Anniversary" }
];

const amenitiesList = [
  { id: "parking", label: "Parking" },
  { id: "ac", label: "AC" },
  { id: "stage", label: "Stage" },
  { id: "rooms", label: "Rooms" },
  { id: "swimming_pool", label: "Swimming Pool" },
  { id: "lawn", label: "Lawn" },
  { id: "dj", label: "DJ" },
  { id: "decoration", label: "Decoration" },
  { id: "generator", label: "Generator" },
  { id: "catering", label: "Catering" },
  { id: "photography", label: "Photography" },
  { id: "valet_parking", label: "Valet Parking" },
  { id: "pet_friendly", label: "Pet Friendly" }
];

export default function VenueFiltersBar({ filters, onFilterChange }: VenueFiltersBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePriceChange = (value: string) => {
    onFilterChange({ ...filters, price_range: value });
    setOpenDropdown(null);
  };

  const handleAvailabilityChange = (value: string) => {
    onFilterChange({ ...filters, availability: value });
    setOpenDropdown(null);
  };

  const handleVenueTypeChange = (value: string) => {
    onFilterChange({ ...filters, venue_type: value });
    setOpenDropdown(null);
  };

  const handleCapacityChange = (value: string) => {
    onFilterChange({ ...filters, capacity: value });
    setOpenDropdown(null);
  };

  const handleEventTypeChange = (value: string) => {
    onFilterChange({ ...filters, event_type: value });
    setOpenDropdown(null);
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = filters.amenities.includes(amenity)
      ? filters.amenities.filter(a => a !== amenity)
      : [...filters.amenities, amenity];
    onFilterChange({ ...filters, amenities: newAmenities });
  };

  const clearAllFilters = () => {
    onFilterChange({
      city: filters.city, // Keep city as it's usually from URL
      price_range: "all",
      amenities: [],
      availability: "all",
      venue_type: "all",
      capacity: "all",
      event_type: "all"
    });
  };

  const hasActiveFilters = 
    filters.price_range !== "all" ||
    filters.availability !== "all" ||
    filters.venue_type !== "all" ||
    filters.capacity !== "all" ||
    filters.event_type !== "all" ||
    filters.amenities.length > 0;

  // Get selected filter labels
  const getSelectedFilters = () => {
    const selected: Array<{ label: string; onRemove: () => void }> = [];
    
    if (filters.price_range !== "all") {
      selected.push({
        label: priceRanges.find(r => r.value === filters.price_range)?.label || "",
        onRemove: () => handlePriceChange("all")
      });
    }
    
    if (filters.availability !== "all") {
      selected.push({
        label: availabilityOptions.find(a => a.value === filters.availability)?.label || "",
        onRemove: () => handleAvailabilityChange("all")
      });
    }
    
    if (filters.venue_type !== "all") {
      selected.push({
        label: venueTypes.find(s => s.value === filters.venue_type)?.label || "",
        onRemove: () => handleVenueTypeChange("all")
      });
    }

    if (filters.capacity !== "all") {
      selected.push({
        label: capacityOptions.find(c => c.value === filters.capacity)?.label || "",
        onRemove: () => handleCapacityChange("all")
      });
    }

    if (filters.event_type !== "all") {
      selected.push({
        label: eventTypes.find(e => e.value === filters.event_type)?.label || "",
        onRemove: () => handleEventTypeChange("all")
      });
    }
    
    filters.amenities.forEach(amenity => {
      const amenityLabel = amenitiesList.find(a => a.id === amenity)?.label || amenity;
      selected.push({
        label: amenityLabel,
        onRemove: () => toggleAmenity(amenity)
      });
    });
    
    return selected;
  };

  const selectedFilters = getSelectedFilters();

  return (
    <div className="w-full">
      {/* Single Row: All Filter Buttons, Selected Chips, and Clear Button */}
      <div className="flex flex-wrap items-center gap-2 lg:gap-3">
        {/* Venue Type Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "venue_type" ? null : "venue_type")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.venue_type !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Venue Type
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "venue_type" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "venue_type" && (
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200 max-h-72 overflow-y-auto">
              {venueTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleVenueTypeChange(type.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.venue_type === type.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.price_range !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Price
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "price" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "price" && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {priceRanges.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handlePriceChange(range.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.price_range === range.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Capacity Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "capacity" ? null : "capacity")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.capacity !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Capacity
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "capacity" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "capacity" && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {capacityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleCapacityChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.capacity === option.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Amenities Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "amenities" ? null : "amenities")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.amenities.length > 0 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Amenities
            {filters.amenities.length > 0 && (
              <span className="bg-[#C89B3C] text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold">
                {filters.amenities.length}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "amenities" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "amenities" && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200 max-h-64 overflow-y-auto">
              {amenitiesList.map((amenity) => (
                <label
                  key={amenity.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity.id)}
                    onChange={() => toggleAmenity(amenity.id)}
                    className="w-4 h-4 text-[#C89B3C] border-gray-300 rounded focus:ring-[#C89B3C] transition-colors"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Availability Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "availability" ? null : "availability")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.availability !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Availability
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "availability" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "availability" && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {availabilityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAvailabilityChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.availability === option.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Event Type Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "event_type" ? null : "event_type")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.event_type !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Event Type
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "event_type" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "event_type" && (
            <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {eventTypes.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleEventTypeChange(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.event_type === option.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Filter Chips - Inline with filter buttons */}
        {selectedFilters.map((filter, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 bg-[#C89B3C]/10 text-[#C89B3C] text-xs rounded-full border border-[#C89B3C]/20 transition-all hover:bg-[#C89B3C]/20 animate-in fade-in slide-in-from-left-1 duration-200"
          >
            <span className="truncate max-w-[120px] sm:max-w-none">{filter.label}</span>
            <button
              onClick={filter.onRemove}
              className="hover:text-[#B8862B] shrink-0 transition-colors"
              aria-label="Remove filter"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Clear All Button - At the end */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-300 hover:border-gray-400 rounded-lg transition-all whitespace-nowrap shadow-sm hover:shadow-md ml-auto"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Clear all</span>
            <span className="sm:hidden">Clear</span>
          </button>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {openDropdown && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setOpenDropdown(null)}
        />
      )}
    </div>
  );
}
