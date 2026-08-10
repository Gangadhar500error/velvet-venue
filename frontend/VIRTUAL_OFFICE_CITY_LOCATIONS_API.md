# Virtual Office City Locations API Reference

This document provides the API structure for city locations/areas that should be displayed in the Virtual Office hero section.

## Overview

When a user selects a city from SecondaryNav (e.g., "New York", "Chicago", "Hyderabad"), the hero section should display popular areas/locations within that selected city. This helps users filter or navigate to specific areas within the city.

## API Endpoint

### Request

```
GET /cities/{city-slug}/locations
```

**Path Parameters:**
- `city-slug` (required): City slug from URL path (e.g., "new-york", "chicago", "hyderabad")

**Example Requests:**
```
GET /cities/new-york/locations
GET /cities/chicago/locations
GET /cities/hyderabad/locations
```

### Response Format

**Success Response (200 OK):**
```json
{
  "data": [
    {
      "name": "Times Square",
      "slug": "times-square"
    },
    {
      "name": "Manhattan",
      "slug": "manhattan"
    },
    {
      "name": "Brooklyn",
      "slug": "brooklyn"
    }
  ]
}
```

**Empty Response (No Locations for City):**
```json
{
  "data": []
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "City not found",
  "message": "No locations available for this city"
}
```

## Data Structure

### CityLocation Object

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Display name of the location/area (e.g., "Times Square", "Hitec City") |
| `slug` | string | Yes | URL-friendly identifier (e.g., "times-square", "hitec-city") |

### Example Data Structure

```json
{
  "new-york": [
    { "name": "Times Square", "slug": "times-square" },
    { "name": "Manhattan", "slug": "manhattan" },
    { "name": "Brooklyn", "slug": "brooklyn" },
    { "name": "Queens", "slug": "queens" },
    { "name": "Financial District", "slug": "financial-district" }
  ],
  "chicago": [
    { "name": "Downtown Chicago", "slug": "downtown-chicago" },
    { "name": "The Loop", "slug": "the-loop" },
    { "name": "River North", "slug": "river-north" },
    { "name": "Gold Coast", "slug": "gold-coast" }
  ],
  "hyderabad": [
    { "name": "Hitec City", "slug": "hitec-city" },
    { "name": "Gachibowli", "slug": "gachibowli" },
    { "name": "Madhapur", "slug": "madhapur" },
    { "name": "Banjara Hills", "slug": "banjara-hills" }
  ]
}
```

## City Slug Mapping

The city slug should match the city slug used in SecondaryNav and URL routing:

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
| Hyderabad | `hyderabad` | `/virtual-office/hyderabad` |

## Frontend Behavior

1. **User selects city from SecondaryNav** → Navigates to `/virtual-office/{city-slug}`
2. **Page loads** → Calls API: `GET /cities/{city-slug}/locations`
3. **Hero section displays** → Shows "Popular Areas in {CityName}:" with location buttons
4. **User clicks location** → Can filter virtual offices by area (future enhancement)

## Database Query Example

```sql
-- Example SQL query for backend implementation
SELECT 
  location_name as name,
  location_slug as slug
FROM city_locations
WHERE city_slug = :city_slug
  AND status = 'active'
ORDER BY display_order ASC, location_name ASC;
```

## Slug Format Guidelines

- Use lowercase letters
- Replace spaces with hyphens
- Remove special characters
- Keep slugs concise and readable

Examples:
- "Times Square" → `times-square`
- "Financial District" → `financial-district`
- "Hitec City" → `hitec-city`
- "Upper East Side" → `upper-east-side`

## Error Handling

### Invalid City Slug
- Return `400 Bad Request` with error message
- Frontend will handle gracefully (show empty list)

### City Not Found
- Return `404 Not Found` OR empty data array `[]`
- Frontend will show empty locations list

### Server Error
- Return `500 Internal Server Error`
- Frontend will handle gracefully

## Example Integration Code

### Node.js/Express Example
```javascript
app.get('/cities/:citySlug/locations', async (req, res) => {
  try {
    const { citySlug } = req.params;
    
    const locations = await db.query(
      'SELECT location_name as name, location_slug as slug FROM city_locations WHERE city_slug = $1 AND status = $2 ORDER BY display_order ASC',
      [citySlug, 'active']
    );
    
    res.json({
      data: locations.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### PHP/Laravel Example
```php
Route::get('/cities/{citySlug}/locations', function ($citySlug) {
    $locations = CityLocation::where('city_slug', $citySlug)
        ->where('status', 'active')
        ->orderBy('display_order')
        ->get(['location_name as name', 'location_slug as slug']);
    
    return response()->json([
        'data' => $locations
    ]);
});
```

## Frontend Implementation Notes

1. **Location Display**: Locations are displayed as clickable buttons in the hero section
2. **Current Behavior**: Clicking a location scrolls to the virtual offices section (filtering by location can be added later)
3. **Empty State**: If no locations are returned, the locations section is hidden
4. **City Name**: The hero section displays "Popular Areas in {CityName}:" where CityName comes from the URL parameter

## Testing Checklist

- [ ] Returns correct locations for cities with data
- [ ] Returns empty array for cities without locations
- [ ] Handles invalid city slugs gracefully
- [ ] Response format matches specification
- [ ] Slug format is consistent
- [ ] Locations are ordered correctly

## Related Documentation

- `VIRTUAL_OFFICE_BACKEND_INTEGRATION.md` - Complete Virtual Office API integration guide
- `VIRTUAL_OFFICE_API_REFERENCE.md` - Virtual Office listings API reference
- Frontend code: `src/app/(main)/virtual-office/[city]/components/VirtualOfficeHero.tsx`
- Data structure: `src/app/(main)/virtual-office/[city]/data/cityLocations.ts`
