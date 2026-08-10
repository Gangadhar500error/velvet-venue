# Coworking Listing Page

## 📁 Folder Structure

```
/app/(main)/coworking/[city]/
├── page.tsx                    # Main listing page
├── data/
│   └── workspaces.ts          # Dummy workspace data
└── components/
    ├── FiltersBar.tsx         # Filter dropdowns (Price, Type, Rating, Amenities)
    ├── LocationChips.tsx      # Scrollable area chips
    ├── ListingCard.tsx        # Individual workspace card
    ├── ListingGrid.tsx         # Grid layout wrapper
    ├── SortDropdown.tsx       # Sort options dropdown
    ├── EmptyState.tsx          # No results UI
    ├── LoadingSkeleton.tsx     # Loading state
    └── Pagination.tsx          # Page navigation
```

## 🎯 Features

### Filters
- **Price Range**: All, Under $300, $300-$500, $500-$700, $700+
- **Workspace Type**: Hot Desk, Dedicated Desk, Private Office, Meeting Room
- **Rating**: All, 3.0+, 4.0+, 4.5+
- **Amenities**: WiFi, Parking, AC, Pantry, Meeting Rooms, 24/7 Access

### Sorting
- Recommended (default)
- Price: Low to High
- Price: High to Low
- Rating: High to Low

### Badges
- **Popular** → Yellow badge
- **Special Offer** → Red badge
- **Featured** → Purple badge

### Responsive Design
- Mobile: Stacked layout, single column cards
- Tablet: 2 columns
- Desktop: 3 columns

## 🔧 Usage

### Access the page:
```
/coworking/new-york
/coworking/chicago
/coworking/los-angeles
```

The city name in the URL is automatically formatted (e.g., "new-york" → "New York").

## 📊 Data Structure

Each workspace object includes:
```typescript
{
  id: string;
  name: string;
  city: string;
  area: string;
  rating: number;
  reviewCount: number;
  badge?: "Popular" | "Special Offer" | "Featured";
  price: number;
  image: string;
  amenities: string[];
  type: "Hot Desk" | "Dedicated Desk" | "Private Office" | "Meeting Room";
  description?: string;
}
```

## 🔄 State Management

All filtering and sorting is handled client-side with React hooks:
- `useState` for filters, sorting, pagination
- `useMemo` for computed filtered/sorted results
- Automatic pagination reset on filter changes

## 🚀 Future Enhancements

To connect to a backend API:
1. Replace `getWorkspacesByCity()` with API call
2. Move filter logic to backend query parameters
3. Implement server-side pagination
4. Add loading states for API calls

## 🎨 Styling

- Uses Tailwind CSS utility classes
- Brand colors: `#4ECDC4` (teal), `#FF5A22` (orange)
- Hover effects: Scale transform + shadow
- Smooth transitions on all interactive elements
