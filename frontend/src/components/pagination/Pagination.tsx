"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
  isDarkMode?: boolean;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  showInfo = true,
  isDarkMode = false,
  className = "",
}: PaginationProps) {
  // Don't render if only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the start
        pages.push(2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push("...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }

    return pages;
  };

  const startIndex = totalItems && itemsPerPage ? (currentPage - 1) * itemsPerPage + 1 : undefined;
  const endIndex = totalItems && itemsPerPage ? Math.min(currentPage * itemsPerPage, totalItems) : undefined;

  return (
    <div className={`rounded-lg border p-4 ${isDarkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200"} ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Results Info */}
        {showInfo && startIndex !== undefined && endIndex !== undefined && totalItems !== undefined && (
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Showing <span className="font-semibold">{startIndex}</span> to{" "}
            <span className="font-semibold">{endIndex}</span> of{" "}
            <span className="font-semibold">{totalItems}</span> results
          </div>
        )}

        {/* Pagination Controls */}
        <div className="flex items-center gap-2">
          {/* Previous Button */}
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 rounded-lg transition-all ${
              currentPage === 1
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-400 hover:text-white disabled:hover:text-gray-400"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:hover:text-gray-500"
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className={`px-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#C89B3C] text-white"
                      : isDarkMode
                      ? "hover:bg-gray-800 text-gray-400 hover:text-white"
                      : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                  }`}
                  aria-label={`Go to page ${pageNumber}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`p-2 rounded-lg transition-all ${
              currentPage === totalPages
                ? "opacity-50 cursor-not-allowed"
                : ""
            } ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-400 hover:text-white disabled:hover:text-gray-400"
                : "hover:bg-gray-100 text-gray-500 hover:text-gray-700 disabled:hover:text-gray-500"
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

