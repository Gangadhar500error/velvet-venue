/**
 * Customer Type Definition
 * 
 * Represents a customer in the system (used across dashboard flows).
 * 
 * BACKEND INTEGRATION:
 * This interface matches the expected API response structure for customer data.
 * 
 * Fields:
 * - id: Unique customer identifier (number)
 * - name: Customer's full name (string)
 * - email: Customer's email address (string)
 * - phone: Customer's phone number (string)
 * - image: Optional profile image URL (string)
 * - status: Customer account status - "active" | "inactive" | "pending"
 * - joinDate: Date when customer joined (ISO date string)
 * - location: Optional location/area (string)
 * - city: Optional city name (string)
 * - totalBookings: Total number of bookings (calculated from bookings)
 * - totalSpent: Total amount spent (calculated from bookings)
 * - lastBookingDate: Date of most recent booking (ISO date string)
 * - preferredWorkspaceType: Customer's preferred workspace type
 * - notes: Optional internal notes about the customer
 */

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
  status: "active" | "inactive" | "pending";
  joinDate: string;
  location?: string;
  city?: string;
  totalBookings: number;
  totalSpent: number;
  lastBookingDate?: string;
  preferredWorkspaceType?:
    | "Coworking"
    | "Private Office"
    | "Meeting Room"
    | "Virtual Office"
    | "Wedding Venue"
    | "Banquet Hall"
    | "Resort"
    | "Hotel"
    | "Farm House"
    | "Party Hall";
  notes?: string;
}

