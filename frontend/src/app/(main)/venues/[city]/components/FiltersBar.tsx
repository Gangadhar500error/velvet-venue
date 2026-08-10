"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";

export interface FilterState {
  priceRange: string;
  workspaceType: string | string[]; // Can be "all", single type string, or array of types
  rating: string;
  amenities: string[];
}

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const priceRanges = [
  { value: "all", label: "All Prices" },
  { value: "0-50000", label: "Under ₹50,000" },
  { value: "50000-100000", label: "₹50,000 - ₹1,00,000" },
  { value: "100000-300000", label: "₹1,00,000 - ₹3,00,000" },
  { value: "300000+", label: "₹3,00,000+" }
];


const ratings = [
  { value: "all", label: "All Ratings" },
  { value: "3+", label: "⭐ 3.0+" },
  { value: "4+", label: "⭐ 4.0+" },
  { value: "4.5+", label: "⭐ 4.5+" }
];

const amenitiesList = [
  "Parking",
  "AC",
  "Stage",
  "Rooms",
  "Swimming Pool",
  "Lawn",
  "DJ",
  "Decoration",
  "Generator",
  "Catering",
  "Photography",
  "Valet Parking",
  "Pet Friendly"
];

export default function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePriceChange = (value: string) => {
    onFilterChange({ ...filters, priceRange: value });
    setOpenDropdown(null);
  };


  const handleRatingChange = (value: string) => {
    onFilterChange({ ...filters, rating: value });
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
      priceRange: "all",
      workspaceType: "all",
      rating: "all",
      amenities: []
    });
  };

  const hasActiveFilters = 
    filters.priceRange !== "all" ||
    filters.rating !== "all" ||
    filters.amenities.length > 0;

  // Get selected filter labels
  const getSelectedFilters = () => {
    const selected: Array<{ label: string; onRemove: () => void }> = [];
    
    if (filters.priceRange !== "all") {
      selected.push({
        label: priceRanges.find(r => r.value === filters.priceRange)?.label || "",
        onRemove: () => handlePriceChange("all")
      });
    }
    
    
    if (filters.rating !== "all") {
      selected.push({
        label: ratings.find(r => r.value === filters.rating)?.label || "",
        onRemove: () => handleRatingChange("all")
      });
    }
    
    filters.amenities.forEach(amenity => {
      selected.push({
        label: amenity,
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
        {/* Price Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "price" ? null : "price")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.priceRange !== "all" 
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
                    filters.priceRange === range.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rating Filter */}
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === "rating" ? null : "rating")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-50 hover:bg-gray-100 border rounded-lg text-xs sm:text-sm font-medium transition-all ${
              filters.rating !== "all" 
                ? "border-[#C89B3C] bg-[#C89B3C]/10 text-[#C89B3C]" 
                : "border-gray-300 text-gray-700"
            }`}
          >
            Rating
            <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 ${openDropdown === "rating" ? "rotate-180" : ""}`} />
          </button>
          {openDropdown === "rating" && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {ratings.map((rating) => (
                <button
                  key={rating.value}
                  onClick={() => handleRatingChange(rating.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                    filters.rating === rating.value ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium" : "text-gray-700"
                  }`}
                >
                  {rating.label}
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
            <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {amenitiesList.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={filters.amenities.includes(amenity)}
                    onChange={() => toggleAmenity(amenity)}
                    className="w-4 h-4 text-[#C89B3C] border-gray-300 rounded focus:ring-[#C89B3C] transition-colors"
                  />
                  <span className="text-sm text-gray-700">{amenity}</span>
                </label>
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
