import { apiRequest } from "@/lib/api";
import type {
  Booking,
  BookingStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  TimelineEventType,
  TransactionStatus,
} from "@/app/admin/bookings/types";

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
  amount_received?: number;
  date_slots?: Array<{ event_date: string; slot_keys: string[] }>;
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
  platform_commission_percent?: number;
  amount_received?: number;
  suggested_advance?: number;
  payment_status?: string;
  gst_mode?: string;
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

export interface BookingDetailApi {
  id: string;
  booking_number: string;
  booking_type: string;
  booking_mode: string;
  event_type?: string | null;
  booking_status: string;
  payment_status: string;
  approval_status: string;
  booking_date: string;
  start_date: string;
  end_date: string;
  guest_count: number;
  special_note?: string | null;
  assigned_executive?: string | null;
  payment_method?: string | null;
  currency: string;
  customer?: { id: string; name: string; email?: string | null; phone?: string | null; city?: string | null; code?: string | null };
  vendor?: { id: string; name: string };
  business_profile?: { id: string; business_name: string };
  venue?: { id: string; venue_code: string; venue_name: string; city?: string | null };
  days?: Array<{ id: string; date: string; status: string }>;
  slots?: Array<{ slot_name: string; slot_key?: string | null; start_time?: string | null; end_time?: string | null }>;
  food_slots?: Array<{
    meal_key?: string | null;
    meal_name: string;
    veg_price: number;
    nonveg_price: number;
    veg_count: number;
    nonveg_count: number;
    subtotal: number;
  }>;
  services?: Array<{ id: string; service_name: string; price: number; quantity: number; subtotal: number }>;
  payment_summary?: {
    total_amount: number;
    advance_amount: number;
    paid_amount: number;
    remaining_amount: number;
    gst_amount: number;
    discount: number;
    payment_status: string;
    platform_commission?: number;
    vendor_amount?: number;
    platform_commission_percent?: number;
    gst_percent?: number;
    gst_mode?: string;
  };
  invoices?: Array<{
    id: string;
    invoice_number: string;
    invoice_type: string;
    invoice_status: string;
    amount: number;
    gst_amount: number;
    created_at: string;
  }>;
  payments?: Array<{
    id: string;
    payment_reference: string;
    transaction_id?: string | null;
    gateway?: string | null;
    amount: number;
    payment_type: string;
    status: string;
    paid_at?: string | null;
    remarks?: string | null;
    collected_by?: string | null;
    created_at: string;
    invoice_number?: string | null;
  }>;
  timeline?: Array<{ id: string; action: string; description: string; created_at: string }>;
  created_at: string;
  updated_at: string;
}

function mapPaymentStatus(status?: string | null): PaymentStatus {
  if (status === "pending") return "unpaid";
  if (
    status === "partial" ||
    status === "paid" ||
    status === "refunded" ||
    status === "failed" ||
    status === "cancelled"
  ) {
    return status;
  }
  return "unpaid";
}

function mapTimelineType(action: string): TimelineEventType {
  const value = (action || "").toLowerCase();
  if (value.includes("payment")) return "payment";
  if (value.includes("invoice")) return "invoice";
  if (value.includes("status") || value.includes("cancel") || value.includes("complete")) return "status";
  if (value.includes("note")) return "note";
  return "created";
}

export function mapBookingDetail(detail: BookingDetailApi): Booking {
  const pay = detail.payment_summary || {
    total_amount: 0,
    advance_amount: 0,
    paid_amount: 0,
    remaining_amount: 0,
    gst_amount: 0,
    discount: 0,
    payment_status: detail.payment_status,
  };
  const dates = (detail.days || []).map((day) => day.date).filter(Boolean).sort();
  const invoiceStatus: InvoiceStatus = (detail.invoices || []).length ? "generated" : "not_generated";
  return {
    id: detail.id,
    bookingId: detail.booking_number,
    customerId: detail.customer?.id || "",
    customerName: detail.customer?.name || "",
    customerPhone: detail.customer?.phone || "",
    customerEmail: detail.customer?.email || "",
    customerCity: detail.customer?.city || "",
    businessId: detail.business_profile?.id || "",
    businessName: detail.business_profile?.business_name || "",
    venueId: detail.venue?.id || "",
    venueName: detail.venue?.venue_name || "",
    venueCity: detail.venue?.city || "",
    vendorId: detail.vendor?.id,
    vendorName: detail.vendor?.name,
    eventType: detail.event_type || "",
    eventDate: detail.start_date,
    eventEndDate: detail.end_date,
    selectedDates: dates.join(","),
    bookingDate: detail.booking_date,
    slot: (detail.slots || []).map((slot) => slot.slot_name).filter(Boolean).join(", ") || "Full Day",
    startTime: detail.slots?.[0]?.start_time || undefined,
    endTime: detail.slots?.[0]?.end_time || undefined,
    guestCount: detail.guest_count || 0,
    meals: (detail.food_slots || []).map((meal) => ({
      slotKey: meal.meal_key || meal.meal_name,
      name: meal.meal_name,
      timeLabel: "",
      startTime: "",
      endTime: "",
      vegPlatePrice: meal.veg_price,
      nonVegPlatePrice: meal.nonveg_price,
      vegGuests: meal.veg_count,
      nonVegGuests: meal.nonveg_count,
      mealTotal: meal.subtotal,
    })),
    specialRequirements: detail.special_note || "",
    bookingAmount: pay.total_amount || 0,
    advancePaid: pay.paid_amount || pay.advance_amount || 0,
    paidAmount: pay.paid_amount || 0,
    pendingAmount: pay.remaining_amount || 0,
    platformCommission: pay.platform_commission || 0,
    vendorReceivable: pay.vendor_amount || 0,
    platformCommissionPercent: pay.platform_commission_percent,
    refundAmount: 0,
    taxAmount: pay.gst_amount || 0,
    discountAmount: pay.discount || 0,
    addons: (detail.services || []).map((service) => ({
      id: service.id,
      name: service.service_name,
      amount: service.subtotal,
    })),
    bookingStatus: (detail.booking_status || "pending") as BookingStatus,
    paymentStatus: mapPaymentStatus(detail.payment_status || pay.payment_status),
    invoiceStatus,
    paymentMethod: (detail.payment_method || "") as PaymentMethod | "",
    assignedExecutive: detail.assigned_executive || "",
    notes: detail.special_note || "",
    createdAt: detail.created_at,
    updatedAt: detail.updated_at,
    createdBy: "",
    updatedBy: "",
    transactions: (detail.payments || []).map((payment) => ({
      id: payment.id,
      transactionId: payment.transaction_id || payment.payment_reference,
      method: payment.gateway || payment.payment_type,
      amount: payment.amount,
      reference: payment.payment_reference,
      status: (payment.status || "success") as TransactionStatus,
      date: payment.paid_at || payment.created_at,
      invoiceNo: payment.invoice_number || undefined,
      paymentType: payment.payment_type as "advance" | "installment" | "final",
      collectedBy: payment.collected_by || undefined,
      remarks: payment.remarks || undefined,
    })),
    invoices: (detail.invoices || []).map((invoice) => ({
      id: invoice.id,
      invoiceNo: invoice.invoice_number,
      invoiceDate: invoice.created_at,
      paymentType: (invoice.invoice_type || "advance") as "advance" | "installment" | "final",
      amountReceived: invoice.amount,
      remainingBalance: pay.remaining_amount || 0,
      status: invoice.invoice_status === "paid" ? "paid" : "pending",
      transactionId: "",
      gstAmount: invoice.gst_amount,
    })),
    documents: [],
    timeline: (detail.timeline || []).map((item) => ({
      id: item.id,
      type: mapTimelineType(item.action),
      title: item.action,
      description: item.description,
      date: item.created_at,
    })),
    noteEntries: [],
  };
}

export async function fetchBooking(bookingId: string) {
  return apiRequest<BookingDetailApi>(`/bookings/${bookingId}`);
}

export async function recordBookingPayment(
  bookingId: string,
  payload: {
    amount: number;
    payment_method?: string;
    transaction_id?: string;
    remarks?: string;
    collected_by?: string;
    paid_at?: string;
    payment_type?: "advance" | "installment" | "final" | "refund";
  }
) {
  return apiRequest<BookingMutationResponse>(`/bookings/${bookingId}/payments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelBooking(bookingId: string) {
  return apiRequest<{ success: boolean; message: string }>(`/bookings/${bookingId}`, {
    method: "DELETE",
  });
}
