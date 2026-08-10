# Virtual Office API Reference

This document outlines the API structure for Virtual Office listings to help backend developers implement the endpoint.

## API Endpoint

```
GET /virtual-offices?city={city_slug}
```

Example: `/virtual-offices?city=hyderabad` or `/virtual-offices?city=new-york`

**Note:** The `city` parameter should match the city slug from the URL path (e.g., `/virtual-office/new-york` → `city=new-york`)

## Response Structure

The API should return a JSON response with the following structure:

```json
{
  "data": [
    {
      "id": "string",
      "name": "string",
      "rating": "number",
      "location": "string",
      "features": ["string"],
      "services": [
        {
          "name": "string",
          "price": "string"
        }
      ],
      "badge": "string (optional)"
    }
  ],
  "pagination": {
    "current_page": "number",
    "per_page": "number",
    "total": "number",
    "last_page": "number"
  }
}
```

## Field Descriptions

### Virtual Office Object

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | Unique identifier for the virtual office | `"1"` |
| `name` | string | Yes | Name of the virtual office location | `"Smartworks Purva Summit"` |
| `rating` | number | Yes | Rating (0-5 scale) | `4.2` |
| `location` | string | Yes | Full address or area name | `"Hitec City, Hyderabad"` |
| `image` | string | Yes | Image URL for the virtual office | `"/assets/cowork.jpg"` or `"https://example.com/image.jpg"` |
| `features` | array[string] | Yes | List of features/services offered | `["Digital KYC & Agreement", "Documents in 24 Hours"]` |
| `services` | array[object] | Yes | List of services with pricing | See Service Object below |
| `badge` | string | No | Badge label (e.g., "Popular", "Featured", "New") | `"Popular"` |

### Service Object

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `name` | string | Yes | Name of the service | `"Business Address"` |
| `price` | string | Yes | Price with currency symbol | `"₹999 /month"` |

## Example Response

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
    },
    {
      "id": "2",
      "name": "WeWork Cyber Towers",
      "rating": 4.5,
      "location": "Gachibowli, Hyderabad",
      "features": [
        "Digital KYC & Agreement",
        "Documents in 24 Hours",
        "Mail Forwarding"
      ],
      "services": [
        {
          "name": "Business Address",
          "price": "₹1,299 /month"
        },
        {
          "name": "Tax Registration",
          "price": "₹2,999 /month"
        },
        {
          "name": "Company Registration",
          "price": "₹1,499 /month"
        }
      ],
      "badge": "Featured"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 10,
    "total": 2,
    "last_page": 1
  }
}
```

## Common Service Names

The following service names are commonly used:

- `"Business Address"` - Virtual business address service
- `"Tax Registration"` - Tax registration service
- `"Company Registration"` - Company registration service
- `"Mail Handling"` - Mail handling and forwarding
- `"Phone Answering"` - Phone answering service
- `"Meeting Room Access"` - Access to meeting rooms
- `"Reception Services"` - Reception and front desk services

## Common Features

The following features are commonly displayed:

- `"Digital KYC & Agreement"` - Digital KYC and agreement processing
- `"Documents in 24 Hours"` - Fast document processing
- `"Mail Forwarding"` - Mail forwarding service
- `"24/7 Online Dashboard"` - Online dashboard access
- `"Tax Support"` - Tax registration support
- `"Company Registration Support"` - Company registration assistance

## Badge Values

Common badge values:

- `"Popular"` - Popular/trending virtual office
- `"Featured"` - Featured virtual office
- `"New"` - Newly added virtual office
- `"Best Value"` - Best value option
- `null` or omit field - No badge

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `city` | string | Yes | City slug or name | `"hyderabad"` or `"new-york"` |

## Notes for Backend Developers

1. **City Parameter**: The `city` parameter comes from the URL path and should match the city slug format (e.g., "hyderabad", "new-york", "los-angeles"). The backend should filter virtual offices based on this city parameter.

2. **City-Based Filtering**: When a city is selected in the SecondaryNav component, users navigate to `/virtual-office/{city-slug}`. The backend API should return only virtual offices available in that specific city.

3. **Empty Results**: If no virtual offices exist for a city, return an empty array `[]` in the `data` field. The frontend will automatically display the ComingSoon component.

4. **City Name Format**: The city slug in the URL (e.g., "new-york") should be converted to the proper city name format (e.g., "New York") for display purposes. The backend can return the city name in the response if needed.

2. **Rating**: Should be a decimal number between 0 and 5, typically displayed with one decimal place (e.g., 4.2).

3. **Price Format**: Prices should include currency symbol and time period (e.g., "₹999 /month", "$99 /month").

4. **Features Array**: Should contain 2-4 key features that highlight the virtual office's main benefits.

5. **Services Array**: Should contain 3-5 services with their respective pricing. These are displayed as a list in the card.

6. **Badge**: Optional field. If not provided or null, no badge will be displayed.

7. **Pagination**: Standard pagination structure should be included in the response.

8. **Error Handling**: Return appropriate HTTP status codes:
   - `200` - Success
   - `400` - Bad Request (invalid city parameter)
   - `404` - Not Found (no virtual offices for the city)
   - `500` - Internal Server Error

## Frontend Implementation

The frontend displays virtual offices in a responsive grid layout:
- Mobile: 1 column (cards stack vertically)
- Desktop: 2 columns per row

Each card displays in horizontal layout:
- **Left side**: Image (40% width on desktop)
- **Right side**: Content (60% width on desktop)
  - Office name and rating
  - Location
  - Features as badges
  - Services with pricing in a list
  - "Get Quote" button

The hero section includes a booking form that can be submitted separately to a booking endpoint.

### Card Layout Details

- Cards use a horizontal flex layout on desktop
- Image takes 2/5 width, content takes 3/5 width
- On mobile, cards stack vertically (image on top, content below)
- Badge appears as overlay on the top-right corner of the image
- "Get Quote" button is positioned at the bottom of the content area
