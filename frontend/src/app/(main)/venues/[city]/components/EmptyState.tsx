"use client";

import { SearchX } from "lucide-react";

interface EmptyStateProps {
  onReset?: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <SearchX className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">
        No venues match your filters.
      </h3>
      <p className="text-gray-600 text-center max-w-md font-body mb-6">
        Try adjusting your filters to see more results, or reset and start over.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-4 py-2 rounded-lg bg-[#C89B3C] text-white text-sm font-semibold hover:bg-[#B8862B] transition-colors duration-250"
          >
            Reset Filters
          </button>
        )}
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors duration-250"
        >
          Modify Search
        </button>
      </div>
    </div>
  );
}
