# Pagination Component

A reusable pagination component for admin pages that displays page navigation controls and results information.

## Location

`/src/components/pagination/Pagination.tsx`

## Usage

```tsx
import { Pagination } from "@/components/pagination";

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={handlePageChange}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  showInfo={true}
  isDarkMode={isDarkMode}
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `currentPage` | `number` | Yes | - | Current active page number |
| `totalPages` | `number` | Yes | - | Total number of pages |
| `onPageChange` | `(page: number) => void` | Yes | - | Callback function when page changes |
| `totalItems` | `number` | No | - | Total number of items (for info display) |
| `itemsPerPage` | `number` | No | - | Items per page (for info display) |
| `showInfo` | `boolean` | No | `true` | Show "Showing X to Y of Z results" |
| `isDarkMode` | `boolean` | No | `false` | Dark mode styling |
| `className` | `string` | No | `""` | Additional CSS classes |

## Features

- **Smart Page Display**: Shows first, last, current, and adjacent pages with ellipsis for large page counts
- **Disabled States**: Previous button disabled on first page, next button disabled on last page
- **Auto-hide**: Component doesn't render if `totalPages <= 1`
- **Smooth Scrolling**: Automatically scrolls to top on page change
- **Accessibility**: Includes ARIA labels and current page indicators
- **Responsive**: Stacks vertically on mobile, horizontal on desktop
- **Dark Mode**: Full dark mode support

## Example: Client-Side Pagination

```tsx
"use client";

import { useState, useEffect } from "react";
import { Pagination } from "@/components/pagination";

export default function MyListingPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Your data
  const allItems = [...]; // Your data array
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = allItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Close expanded rows, reset filters, etc.
  };

  return (
    <>
      {/* Your table/list */}
      <table>
        {paginatedItems.map(item => (
          <tr key={item.id}>{/* ... */}</tr>
        ))}
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={allItems.length}
        itemsPerPage={itemsPerPage}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
```

## Example: Server-Side Pagination (API)

```tsx
"use client";

import { useState, useEffect } from "react";
import { Pagination } from "@/components/pagination";

export default function MyListingPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;

  const fetchData = async (page: number) => {
    const response = await fetch(`/api/items?page=${page}&limit=${itemsPerPage}`);
    const result = await response.json();
    setData(result.data);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
  };

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Data will be refetched via useEffect
  };

  return (
    <>
      {/* Your table/list */}
      <table>
        {data.map(item => (
          <tr key={item.id}>{/* ... */}</tr>
        ))}
      </table>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        isDarkMode={isDarkMode}
      />
    </>
  );
}
```

## Page Number Logic

The component intelligently displays page numbers:

- **≤7 pages**: Shows all page numbers
- **>7 pages**: Shows first page, last page, current page ± 1, with ellipsis

Examples:
- Page 1 of 10: `1 2 3 4 ... 10`
- Page 5 of 10: `1 ... 4 5 6 ... 10`
- Page 10 of 10: `1 ... 7 8 9 10`

## Future Enhancements

The component is designed to be extensible for:
- Page size selector (10, 25, 50, 100 items per page)
- Jump to page input
- URL-based pagination (query params)
- Custom styling variants
- Loading states

## Notes

- Component automatically handles edge cases (invalid page numbers, out of bounds)
- Smooth scroll to top is built-in
- Component returns `null` if `totalPages <= 1` (no rendering)
- All buttons have proper disabled states and ARIA labels

