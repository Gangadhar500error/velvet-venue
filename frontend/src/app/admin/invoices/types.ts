import type {
  BookingInvoiceStatus,
  InvoicePaymentType,
  PaymentStatus,
  TableDensity,
} from "../bookings/types";

export type InvoiceDisplayStatus =
  | "paid"
  | "partial"
  | "pending"
  | "cancelled"
  | "refunded"
  | "completed";

export type InvoiceDatePreset = "" | "today" | "this_week" | "this_month" | "custom";

export interface InvoiceFilters {
  search: string;
  invoiceStatus: string;
  datePreset: InvoiceDatePreset;
  dateFrom: string;
  dateTo: string;
  paymentMethod: string;
  businessId: string;
  venueId: string;
  vendorId: string;
  customerId: string;
}

export type InvoiceColumnKey =
  | "invoiceNo"
  | "invoiceDate"
  | "customer"
  | "venue"
  | "business"
  | "bookingId"
  | "paymentType"
  | "invoiceAmount"
  | "paid"
  | "balance"
  | "paymentStatus"
  | "invoiceStatus"
  | "actions";

export interface InvoiceListRow {
  id: string;
  invoiceId: string;
  invoiceNo: string;
  invoiceDate: string;
  paymentType: InvoicePaymentType;
  paymentMethod: string;
  amountReceived: number;
  remainingBalance: number;
  status: BookingInvoiceStatus;
  transactionId: string;
  gstAmount?: number;
  platformFee?: number;
  platformFeePercent?: number;
  bookingId: string;
  bookingRef: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  venueId: string;
  venueName: string;
  businessId: string;
  businessName: string;
  vendorId?: string;
  vendorName?: string;
  bookingAmount: number;
  paymentStatus: PaymentStatus;
  /** Derived finance-facing invoice status for filters/display */
  invoiceStatus: InvoiceDisplayStatus;
  invoiceAmount: number;
  amountPaid: number;
  createdAt: string;
  updatedAt: string;
}

export type { TableDensity };
