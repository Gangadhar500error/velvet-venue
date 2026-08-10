/**
 * Booking Type Definition
 * Represents a completed booking in the system
 */

export interface Booking {
  id: number;
  bookingId: string; // Unique booking identifier
  status: "completed" | "cancelled" | "pending" | "confirmed";
  
  // Seeker Details (Customer who booked)
  seeker: {
    id: number;
    name: string;
    email: string;
    phone: string;
    image?: string;
  };
  
  // Provider Details (Property Manager/Owner)
  provider: {
    id: number;
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  
  // Property/Venue Details
  property: {
    id: number;
    name: string;
    type:
      | "Coworking"
      | "Private Office"
      | "Meeting Room"
      | "Virtual Office"
      | "Banquet Hall"
      | "Wedding Venue"
      | "Conference Hall"
      | "Party Lawn";
    address: string;
    city: string;
    image?: string;
  };
  
  // Booking Details
  bookingDetails: {
    startDate: string;
    endDate: string;
    duration: string; // e.g., "1 month", "3 days"
    workspaceType?: string;
    numberOfSeats?: number;
    amenities?: string[];
  };
  
  // Billing Details
  billing: {
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    currency: string;
    billingAddress?: string;
  };
  
  // Payment Details
  payment: {
    method: "credit_card" | "debit_card" | "bank_transfer" | "upi" | "wallet" | "cash";
    status: "paid" | "pending" | "failed" | "refunded";
    transactionId?: string;
    paidAt?: string;
    paymentGateway?: string;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Additional Info
  notes?: string;
  invoiceGenerated?: boolean;
  invoiceNumber?: string;
}

