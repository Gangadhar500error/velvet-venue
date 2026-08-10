export type InvoiceStatus = "paid" | "pending" | "overdue" | "cancelled";

export interface Invoice {
  id: number;
  invoiceNumber: string;
  bookingId: string;
  propertyName: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  currency: string;
}

