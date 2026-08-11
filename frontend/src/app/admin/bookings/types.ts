export type BookingStatus =
  | "draft"
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled"
  | "refunded";

export type PaymentStatus = "unpaid" | "partial" | "paid" | "refunded" | "failed" | "cancelled";

export type InvoiceStatus = "not_generated" | "generated" | "sent" | "paid";

export type DocumentStatus = "missing" | "uploaded" | "verified" | "rejected";

export type PaymentMethod =
  | "upi"
  | "card"
  | "netbanking"
  | "bank_transfer"
  | "cash"
  | "cheque"
  | "link"
  | "other";

export type TransactionStatus = "success" | "pending" | "failed" | "refunded";

export type InvoicePaymentType = "advance" | "installment" | "final";

export type BookingInvoiceStatus = "paid" | "pending" | "cancelled";

export type TimelineEventType =
  | "created"
  | "payment"
  | "invoice"
  | "reminder"
  | "contact"
  | "status"
  | "document"
  | "note";

export interface BookingAddon {
  id: string;
  name: string;
  amount: number;
}

export interface BookingTransaction {
  id: string;
  transactionId: string;
  method: PaymentMethod | string;
  amount: number;
  reference: string;
  status: TransactionStatus;
  date: string;
  invoiceNo?: string;
  paymentType?: InvoicePaymentType;
  collectedBy?: string;
  remarks?: string;
}

export interface BookingInvoice {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentType: InvoicePaymentType;
  paymentMethod?: PaymentMethod | string;
  amountReceived: number;
  remainingBalance: number;
  status: BookingInvoiceStatus;
  transactionId: string;
  /** Snapshot of booking GST allocation for this payment (informational) */
  gstAmount?: number;
  /** Platform fee is calculated on total booking amount; retained even on cancel/refund */
  platformFee?: number;
  platformFeePercent?: number;
}

export interface BookingDocument {
  id: string;
  key: string;
  label: string;
  status: DocumentStatus;
  uploadedAt?: string;
  verifiedBy?: string;
  fileName?: string;
}

export interface BookingTimelineItem {
  id: string;
  type: TimelineEventType;
  title: string;
  description: string;
  date: string;
  actor?: string;
}

export interface BookingNote {
  id: string;
  body: string;
  author: string;
  date: string;
  attachmentName?: string;
}

/** Per-meal line item for Venue + Food bookings */
export interface BookingMealLine {
  slotKey: string;
  name: string;
  timeLabel: string;
  startTime: string;
  endTime: string;
  vegPlatePrice: number;
  nonVegPlatePrice: number;
  vegGuests: number;
  nonVegGuests: number;
  mealTotal: number;
}

export interface Booking {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerCity: string;
  businessId: string;
  businessName: string;
  venueId: string;
  venueName: string;
  venueCity: string;
  vendorId?: string;
  vendorName?: string;
  eventType: string;
  eventDate: string;
  /** Optional end date for multi-day bookings */
  eventEndDate?: string;
  /** Explicit selected dates (YYYY-MM-DD), comma-separated — preferred for multi-day */
  selectedDates?: string;
  bookingDate: string;
  slot: string;
  /** Optional clock times for custom-time bookings */
  startTime?: string;
  endTime?: string;
  guestCount: number;
  /** Venue + Food: selected meals with per-meal guest counts and totals */
  meals?: BookingMealLine[];
  specialRequirements: string;
  bookingAmount: number;
  advancePaid: number;
  paidAmount: number;
  pendingAmount: number;
  platformCommission?: number;
  vendorReceivable?: number;
  platformCommissionPercent?: number;
  refundAmount: number;
  taxAmount: number;
  discountAmount: number;
  addons: BookingAddon[];
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  invoiceStatus: InvoiceStatus;
  paymentMethod: PaymentMethod | "";
  assignedExecutive: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  transactions: BookingTransaction[];
  /** Per-payment invoices; derived from transactions when empty */
  invoices?: BookingInvoice[];
  documents: BookingDocument[];
  timeline: BookingTimelineItem[];
  noteEntries: BookingNote[];
}

export interface BookingFilters {
  search: string;
  bookingId: string;
  customer: string;
  phone: string;
  venue: string;
  businessId: string;
  eventDate: string;
  bookingStatus: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  assignedExecutive: string;
}

export type TableDensity = "comfortable" | "compact";

export type BookingColumnKey =
  | "bookingId"
  | "customer"
  | "venue"
  | "business"
  | "event"
  | "bookingDate"
  | "eventDate"
  | "guests"
  | "bookingAmount"
  | "paid"
  | "pending"
  | "bookingStatus"
  | "paymentStatus"
  | "actions";

export interface BookingFormValues {
  customerMode: "existing" | "new";
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  businessId: string;
  businessName: string;
  venueId: string;
  venueName: string;
  vendorId: string;
  vendorName: string;
  availabilityLabel: string;
  /** Display label e.g. "Morning (6 AM – 11 AM)" */
  slot: string;
  /** Pricing slot key: morning | afternoon | evening | night | full_day | custom */
  slotKey: string;
  bookingType: "venue_only" | "venue_food";
  /** Customer selection: full day or a timed/meal slot */
  pricingMethod: "full_day" | "slot_based";
  /** @deprecated Legacy single food type — use veg/non-veg guest counts for Venue + Food */
  foodType: "veg" | "non_veg" | "";
  /** @deprecated Use foodSlotKeys — kept for single-meal legacy */
  foodSlotKey: string;
  /** Comma-separated food slot keys e.g. breakfast,lunch */
  foodSlotKeys: string;
  /** JSON array of per-meal guest counts: [{ key, veg, nonVeg }] */
  mealGuestsJson: string;
  /** @deprecated Use mealGuestsJson per meal */
  vegGuestCount: string;
  /** @deprecated Use mealGuestsJson per meal */
  nonVegGuestCount: string;
  startTime: string;
  endTime: string;
  eventEndDate?: string;
  /** Explicit selected dates (YYYY-MM-DD), comma-separated */
  selectedDates?: string;
  /** JSON map of date -> slot keys for independent multi-date slot selection */
  dateSlotsJson?: string;
  eventType: string;
  eventDate: string;
  guestCount: string;
  specialRequirements: string;
  bookingAmount: string;
  advancePaid: string;
  taxAmount: string;
  discountAmount: string;
  paymentMethod: PaymentMethod | "";
  transactionReference: string;
  paymentStatus: PaymentStatus;
  bookingStatus: BookingStatus;
  assignedExecutive: string;
  notes: string;
  addonsCsv: string;
}
