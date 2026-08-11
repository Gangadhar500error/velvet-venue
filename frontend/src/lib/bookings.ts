import { apiRequest } from "@/lib/api";

export interface BookingQuotePayload {
  venue_id: string;
  customer_id?: string | null;
  event_date: string;
  event_end_date?: string | null;
  selected_dates?: string[];
  booking_type?: "venue_only" | "venue_food";
  booking_mode?: "full_day" | "slot_based";
  event_type?: string | null;
  guest_count?: number;
  special_note?: string | null;
  slot_keys?: string[];
  food_slots?: Array<{
    food_slot_id?: string | null;
    meal_key?: string | null;
    veg_count?: number;
    nonveg_count?: number;
  }>;
  services?: Array<{ name: string; price: number; quantity: number }>;
  discount?: number;
  booking_status?: string;
  assigned_executive?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface BookingQuote {
  success: boolean;
  venue_price: number;
  food_cost: number;
  services_total: number;
  subtotal: number;
  gst_amount: number;
  discount: number;
  grand_total: number;
  advance: number;
  remaining: number;
  commission: number;
  vendor_amount: number;
  gst_percent: number;
  advance_percent: number;
  currency: string;
}

export interface BookingMutationResponse {
  success: boolean;
  message: string;
  booking: {
    id: string;
    booking_number: string;
    booking_status: string;
    payment_status: string;
    venue?: { venue_name?: string };
    customer?: { name?: string };
  };
}

export async function quoteBooking(payload: BookingQuotePayload) {
  return apiRequest<BookingQuote>("/bookings/quote", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createBooking(payload: BookingQuotePayload) {
  return apiRequest<BookingMutationResponse>("/bookings", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
