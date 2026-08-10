"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type SortOption =
  | "recommended"
  | "popularity"
  | "price-low"
  | "price-high"
  | "newest"
  | "rating-high";

interface SortDropdownProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "popularity", label: "Popularity" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
  { value: "rating-high", label: "Highest Rated" },
];

export default function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || "Recommended";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 transition-colors duration-250"
      >
        <span className="truncate max-w-[140px] sm:max-w-none">Sort: {currentLabel}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-250 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSortChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                  sortBy === option.value
                    ? "bg-[#C89B3C]/10 text-[#C89B3C] font-medium"
                    : "text-gray-700"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
        </>
      )}
    </div>
  );
}
