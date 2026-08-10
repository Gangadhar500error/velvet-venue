# Virtual Office Backend Integration Guide

This document provides complete backend integration instructions for the Virtual Office feature with city-based filtering.

## Overview

The Virtual Office page displays city-specific virtual office listings. When a user selects a city from the SecondaryNav component, they navigate to `/virtual-office/{city-slug}` and the page displays virtual offices available in that city.

## Flow Diagram

```
User clicks city in SecondaryNav
    ↓
WorkspaceTypeModal opens
    ↓
User clicks "Virtual Office"
    ↓
Navigate to: /virtual-office/{city-slug}
    ↓
Page loads → Calls API: GET /virtual-offices?city={city-slug}
    ↓
If data exists → Display cards
If no data → Display ComingSoon component
```

## API Endpoint

### Request

```
GET /virtual-offices?city={city_slug}
```

**Query Parameters:**
- `city` (required): City slug from URL path (e.g., "new-york", "los-angeles", "hyderabad")

**Example Requests:**
```
GET /virtual-offices?city=new-york
GET /virtual-offices?city=los-angeles
GET /virtual-offices?city=hyderabad
```

### Response Format

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "id": "1",
      "name": "Smartworks Purva Summit",
      "rating": 4.2,
      "location": "Hitec City, Hyderabad",
      "image": "/assets/cowork.jpg",
      "features": [
        "Digital KYC & Agreement",
        "Documents in 24 Hours"
      ],
      "services": [
        {
          "name": "Business Address",
          "price": "₹999 /month"
        },
        {
          "name": "Tax Registration",
          "price": "₹2,499 /month"
        },
        {
          "name": "Company Registration",
          "price": "₹1,099 /month"
        }
      ],
      "badge": "Popular"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 1,
    "last_page": 1
  }
}
```

**Empty Response (No Data for City):**
```json
{
  "data": [],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 0,
    "last_page": 1
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Invalid city parameter",
  "message": "City slug format is invalid"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "City not found",
  "message": "No virtual offices available for this city"
}
```

## City Slug Mapping

The city slug in the URL should match the city slug used in SecondaryNav. Here are the supported cities:

| City Name | City Slug | Example URL |
|-----------|-----------|------------|
| New York | `new-york` | `/virtual-office/new-york` |
| Los Angeles | `los-angeles` | `/virtual-office/los-angeles` |
| Chicago | `chicago` | `/virtual-office/chicago` |
| Miami | `miami` | `/virtual-office/miami` |
| San Francisco | `san-francisco` | `/virtual-office/san-francisco` |
| Boston | `boston` | `/virtual-office/boston` |
| Seattle | `seattle` | `/virtual-office/seattle` |
| Dallas | `dallas` | `/virtual-office/dallas` |
| Houston | `houston` | `/virtual-office/houston` |
| Atlanta | `atlanta` | `/virtual-office/atlanta` |
| Phoenix | `phoenix` | `/virtual-office/phoenix` |
| Philadelphia | `philadelphia` | `/virtual-office/philadelphia` |
| San Diego | `san-diego` | `/virtual-office/san-diego` |
| Denver | `denver` | `/virtual-office/denver` |
| Washington DC | `washington-dc` | `/virtual-office/washington-dc` |
| Tampa | `tampa` | `/virtual-office/tampa` |
| Orlando | `orlando` | `/virtual-office/orlando` |
| Las Vegas | `las-vegas` | `/virtual-office/las-vegas` |

## Frontend Behavior

### When Data Exists:
1. Hero section displays with city name
2. Virtual office cards display in 2-column grid
3. Each card shows image, name, rating, location, features, services, and "Get Quote" button

### When No Data Exists:
1. Hero section still displays with city name
2. ComingSoon component displays with message:
   - "Virtual Office listings for {CityName} are coming soon!"
   - "We're working hard to bring you the best virtual office options in this area. Check back soon!"

## Database Query Example

```sql
-- Example SQL query for backend implementation
SELECT 
  id,
  name,
  rating,
  location,
  image_url as image,
  features,
  services,
  badge
FROM virtual_offices
WHERE city_slug = :city_slug
  AND status = 'active'
ORDER BY 
  CASE badge
    WHEN 'Featured' THEN 1
    WHEN 'Popular' THEN 2
    WHEN 'New' THEN 3
    ELSE 4
  END,
  rating DESC;
```

## Features Array Format

The `features` field should be returned as a JSON array:
```json
"features": ["Digital KYC & Agreement", "Documents in 24 Hours"]
```

## Services Array Format

The `services` field should be returned as a JSON array of objects:
```json
"services": [
  {
    "name": "Business Address",
    "price": "₹999 /month"
  },
  {
    "name": "Tax Registration",
    "price": "₹2,499 /month"
  }
]
```

## Image URLs

Images can be:
- Relative paths: `/assets/cowork.jpg`
- Absolute URLs: `https://example.com/images/office.jpg`
- CDN URLs: `https://cdn.example.com/virtual-offices/office-1.jpg`

## Price Format

Prices should include:
- Currency symbol (₹, $, €, etc.)
- Amount
- Time period (/month, /year, etc.)

Examples:
- `"₹999 /month"`
- `"$299 /month"`
- `"€249 /month"`

## Badge Values

Valid badge values:
- `"Popular"` - Popular/trending virtual office
- `"Featured"` - Featured virtual office
- `"New"` - Newly added virtual office
- `"Best Value"` - Best value option
- `null` or omit field - No badge

## Error Handling

### Invalid City Slug
- Return `400 Bad Request` with error message
- Frontend will handle gracefully

### City Not Found
- Return `404 Not Found` OR empty data array `[]`
- Frontend will display ComingSoon component

### Server Error
- Return `500 Internal Server Error`
- Frontend will display error message

## Testing Checklist

- [ ] City slug matches URL parameter correctly
- [ ] Returns correct data for cities with virtual offices
- [ ] Returns empty array for cities without virtual offices
- [ ] Handles invalid city slugs gracefully
- [ ] Image URLs are accessible
- [ ] All required fields are present in response
- [ ] Pagination works correctly
- [ ] Response format matches specification

## Frontend Implementation Notes

1. **City Name Formatting**: The frontend automatically converts city slugs to proper case (e.g., "new-york" → "New York")

2. **Hero Section**: Always displays regardless of data availability

3. **ComingSoon Component**: Automatically displays when `data` array is empty

4. **Loading State**: Frontend shows loading indicator while fetching data

5. **Error Handling**: Frontend handles API errors gracefully

## Example Integration Code

### Node.js/Express Example
```javascript
app.get('/virtual-offices', async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    
    const virtualOffices = await db.query(
      'SELECT * FROM virtual_offices WHERE city_slug = $1 AND status = $2',
      [city, 'active']
    );
    
    res.json({
      data: virtualOffices.rows,
      pagination: {
        current_page: 1,
        per_page: 10,
        total: virtualOffices.rows.length,
        last_page: 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### PHP/Laravel Example
```php
Route::get('/virtual-offices', function (Request $request) {
    $city = $request->query('city');
    
    if (!$city) {
        return response()->json(['error' => 'City parameter is required'], 400);
    }
    
    $offices = VirtualOffice::where('city_slug', $city)
        ->where('status', 'active')
        ->get();
    
    return response()->json([
        'data' => $offices,
        'pagination' => [
            'current_page' => 1,
            'per_page' => 10,
            'total' => $offices->count(),
            'last_page' => 1
        ]
    ]);
});
```

## Data Structure Reference

All data structures are organized in a single folder for easy reference:
- **Location:** `src/app/(main)/virtual-office/[city]/data/`
- **Files:**
  - `cityLocations.ts` - City locations/areas data structure
  - `virtualOfficeCards.ts` - Virtual office listings data structure
  - `index.ts` - Central export point
  - `README.md` - Complete data structure documentation

## Support

For questions or clarifications about the API integration, refer to:
- `VIRTUAL_OFFICE_API_REFERENCE.md` - Complete API reference
- `VIRTUAL_OFFICE_CITY_LOCATIONS_API.md` - City locations API reference
- Frontend code: `src/app/(main)/virtual-office/[city]/page.tsx`
- Data structures: `src/app/(main)/virtual-office/[city]/data/README.md`
