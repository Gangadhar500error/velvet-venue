# Data Structure Documentation

This directory contains all centralized data files used across dashboards.

## 📁 File Structure

```
src/data/
├── README.md              # This file - Data structure overview
├── customers.ts           # Customer data (shared by dashboards)
├── properties.ts          # Property data (shared by dashboards)
├── properties.json        # Property JSON data source
├── bookings.ts            # Booking data with helper functions
└── ...
```

## 🔄 Single Source of Truth

### Customer Data
- **File**: `src/data/customers.ts`
- **Export**: `mockCustomers`, `filterCustomers()`
- **Used By**:
  - Admin: `src/app/admin/customers/page.tsx`
  - Customer features that display customer data
- **Note**: Multiple dashboards use the SAME customer data source

### Property Data
- **File**: `src/data/properties.ts`
- **Export**: `mockProperties`, `filterProperties()`, `getPropertyById()`, etc.
- **Used By**:
  - Admin: `src/app/admin/property-listings/page.tsx`
  - Customer-facing property pages
- **Note**: Multiple dashboards use the SAME property data source

### Booking Data
- **File**: `src/data/bookings.ts`
- **Export**: `mockCompletedBookings`, helper functions for customer/property matching
- **Used By**: All dashboards for calculating stats and relationships

## 🔗 Data Relationships

### Customer ↔ Property Relationship
- Customers are linked to properties through **bookings**
- Matching is done by: `workspaceType + city` (since property IDs differ between data sources)
- Helper functions:
  - `getCustomersByPropertyId()` - Get customers for a property
  - `getCustomerCountByPropertyId()` - Get customer count for a property
  - `getCustomerBookingStats()` - Calculate customer statistics

### Property ↔ Booking Relationship
- Properties in `properties.json` have IDs: 1-15
- Bookings reference property IDs: 301-315
- **Solution**: Matching by workspace type + city combination

## 📊 Data Flow

```
Properties (properties.json)
    ↓
mockProperties (properties.ts)
    ↓
Admin Property Listings Page
    ↓
Customer Count (calculated from bookings)
    ↓
Click Customer Count
    ↓
Customers Page (filtered by property)
```

## 🔌 Backend Integration

### Replace Mock Data with API Calls

1. **Customers API**
   ```typescript
   // Replace in customers.ts
   export const mockCustomers = await fetch('/api/customers').then(r => r.json());
   ```

2. **Properties API**
   ```typescript
   // Replace in properties.ts
   const propertiesData = await fetch('/api/properties').then(r => r.json());
   ```

3. **Bookings API**
   ```typescript
   // Replace in bookings.ts
   export const mockCompletedBookings = await fetch('/api/bookings').then(r => r.json());
   ```

### Expected API Endpoints

- `GET /api/customers` - Fetch all customers
- `GET /api/customers?propertyId={id}` - Fetch customers for a property
- `GET /api/properties` - Fetch all properties
- `GET /api/properties/{id}` - Fetch single property
- `GET /api/bookings` - Fetch all bookings
- `GET /api/bookings?customerId={id}` - Fetch bookings for a customer
- `GET /api/bookings?propertyId={id}` - Fetch bookings for a property

## ✅ Consistency Checklist

- ✅ Dashboards use same customer data (`mockCustomers`)
- ✅ Dashboards use same property data (`mockProperties`)
- ✅ Customer stats calculated dynamically from bookings
- ✅ Property-customer matching uses workspace type + city
- ✅ All helper functions documented
- ✅ Data structure clearly defined

## 📝 Notes for Backend Developers

1. **Property IDs**: Ensure property IDs are consistent across all endpoints
2. **Customer Stats**: Calculate `totalBookings`, `totalSpent`, `lastBookingDate` from bookings
3. **Filtering**: Support filtering by property, status, workspace type
4. **Pagination**: All list endpoints should support pagination
5. **Search**: Support search by name, email, phone, city for customers
