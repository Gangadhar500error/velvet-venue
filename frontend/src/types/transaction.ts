/**
 * Transaction Type Definition
 */

export interface Transaction {
  id: number;
  transactionId: string; // Unique transaction identifier
  type: "payment" | "refund" | "withdrawal" | "deposit" | "commission";
  status: "completed" | "pending" | "failed" | "cancelled" | "refunded";
  
  // Related entities
  bookingId?: string;
  userId: number;
  userName: string;
  userEmail: string;
  
  // Amount details
  amount: number;
  currency: string;
  fee?: number;
  netAmount: number; // Amount after fees
  
  // Payment details
  paymentMethod: "credit_card" | "debit_card" | "bank_transfer" | "upi" | "wallet" | "cash";
  paymentGateway?: string;
  gatewayTransactionId?: string;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
  
  // Additional info
  description?: string;
  notes?: string;
}

