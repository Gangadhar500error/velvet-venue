export type PaymentStatus = "completed" | "pending" | "failed" | "refunded";
export type PaymentMethod = "credit_card" | "debit_card" | "bank_transfer" | "upi" | "wallet" | "cash";

export interface Payment {
  id: number;
  transactionId: string;
  invoiceNumber: string;
  bookingId: string;
  propertyName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  date: string;
  currency: string;
}

