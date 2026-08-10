/**
 * Transactions Data
 */

import { Transaction } from "../types/transaction";

export const mockTransactions: Transaction[] = [
  {
    id: 1,
    transactionId: "TXN-2024-001234",
    type: "payment",
    status: "completed",
    bookingId: "BK-2024-001",
    userId: 101,
    userName: "Rohan Mehta",
    userEmail: "rohan.mehta@gmail.com",
    amount: 250000,
    currency: "INR",
    fee: 7500,
    netAmount: 242500,
    paymentMethod: "credit_card",
    paymentGateway: "Razorpay",
    gatewayTransactionId: "pay_1A2B3C4D5E",
    createdAt: "2024-01-10T10:30:00Z",
    completedAt: "2024-01-10T10:30:15Z",
    description: "Payment for booking BK-2024-001",
  },
  {
    id: 2,
    transactionId: "TXN-2024-002345",
    type: "payment",
    status: "completed",
    bookingId: "BK-2024-002",
    userId: 102,
    userName: "Ananya Sharma",
    userEmail: "ananya.sharma@gmail.com",
    amount: 3780000,
    currency: "INR",
    fee: 113400,
    netAmount: 3666600,
    paymentMethod: "bank_transfer",
    paymentGateway: "Bank Transfer",
    gatewayTransactionId: "BT-2024-002345",
    createdAt: "2024-01-18T14:20:00Z",
    completedAt: "2024-01-19T09:15:00Z",
    description: "Payment for booking BK-2024-002",
  },
  {
    id: 3,
    transactionId: "TXN-2024-003456",
    type: "refund",
    status: "completed",
    bookingId: "BK-2024-003",
    userId: 103,
    userName: "Vikram Nair",
    userEmail: "vikram.nair@gmail.com",
    amount: 335000,
    currency: "INR",
    fee: 0,
    netAmount: 335000,
    paymentMethod: "upi",
    paymentGateway: "UPI",
    gatewayTransactionId: "UPI-REF-003456",
    createdAt: "2024-02-05T11:00:00Z",
    completedAt: "2024-02-05T11:05:00Z",
    description: "Refund for cancelled booking BK-2024-003",
  },
  {
    id: 4,
    transactionId: "TXN-2024-004567",
    type: "commission",
    status: "completed",
    userId: 201,
    userName: "Priya Patel",
    userEmail: "priya.patel@velvetvenues.com",
    amount: 48020,
    currency: "INR",
    fee: 0,
    netAmount: 48020,
    paymentMethod: "bank_transfer",
    paymentGateway: "Bank Transfer",
    createdAt: "2024-01-15T12:00:00Z",
    completedAt: "2024-01-15T12:00:00Z",
    description: "Commission payment for booking BK-2024-001",
  },
  {
    id: 5,
    transactionId: "TXN-2024-005678",
    type: "payment",
    status: "pending",
    bookingId: "BK-2024-006",
    userId: 106,
    userName: "Karan Malhotra",
    userEmail: "karan.malhotra@gmail.com",
    amount: 1200000,
    currency: "INR",
    fee: 36000,
    netAmount: 1164000,
    paymentMethod: "credit_card",
    paymentGateway: "Razorpay",
    gatewayTransactionId: "pay_1F2G3H4I5J",
    createdAt: "2024-02-25T11:00:00Z",
    description: "Payment for booking BK-2024-006",
  },
  {
    id: 6,
    transactionId: "TXN-2024-006789",
    type: "payment",
    status: "failed",
    bookingId: "BK-2024-007",
    userId: 107,
    userName: "Kavya Iyer",
    userEmail: "kavya.iyer@gmail.com",
    amount: 4950000,
    currency: "INR",
    fee: 148500,
    netAmount: 4801500,
    paymentMethod: "credit_card",
    paymentGateway: "Razorpay",
    gatewayTransactionId: "pay_FAILED_001",
    createdAt: "2024-02-12T15:30:00Z",
    description: "Failed payment for booking BK-2024-007 - Insufficient funds",
  },
  {
    id: 7,
    transactionId: "TXN-2024-007890",
    type: "withdrawal",
    status: "completed",
    userId: 202,
    userName: "Arjun Reddy",
    userEmail: "arjun.reddy@velvetvenues.com",
    amount: 3666600,
    currency: "INR",
    fee: 1000,
    netAmount: 3665600,
    paymentMethod: "bank_transfer",
    paymentGateway: "Bank Transfer",
    gatewayTransactionId: "WD-2024-007890",
    createdAt: "2024-01-20T10:00:00Z",
    completedAt: "2024-01-21T14:30:00Z",
    description: "Withdrawal request for earnings",
  },
  {
    id: 8,
    transactionId: "TXN-2024-008901",
    type: "payment",
    status: "completed",
    bookingId: "BK-2024-008",
    userId: 108,
    userName: "Sneha Joshi",
    userEmail: "sneha.joshi@gmail.com",
    amount: 780000,
    currency: "INR",
    fee: 23400,
    netAmount: 756600,
    paymentMethod: "credit_card",
    paymentGateway: "Razorpay",
    gatewayTransactionId: "pay_1K2L3M4N5O",
    createdAt: "2024-03-08T09:15:00Z",
    completedAt: "2024-03-08T09:15:20Z",
    description: "Payment for booking BK-2024-008",
  },
  {
    id: 9,
    transactionId: "TXN-2024-009012",
    type: "payment",
    status: "completed",
    bookingId: "BK-2024-009",
    userId: 109,
    userName: "Meera Kapoor",
    userEmail: "meera.kapoor@gmail.com",
    amount: 1210000,
    currency: "INR",
    fee: 36300,
    netAmount: 1173700,
    paymentMethod: "upi",
    paymentGateway: "UPI",
    gatewayTransactionId: "UPI-009012",
    createdAt: "2024-01-12T10:45:00Z",
    completedAt: "2024-01-12T10:45:10Z",
    description: "Payment for booking BK-2024-009",
  },
  {
    id: 10,
    transactionId: "TXN-2024-010123",
    type: "commission",
    status: "completed",
    userId: 203,
    userName: "Aditya Kulkarni",
    userEmail: "aditya.kulkarni@velvetvenues.com",
    amount: 75660,
    currency: "INR",
    fee: 0,
    netAmount: 75660,
    paymentMethod: "bank_transfer",
    paymentGateway: "Bank Transfer",
    createdAt: "2024-03-10T12:00:00Z",
    completedAt: "2024-03-10T12:00:00Z",
    description: "Commission payment for booking BK-2024-008",
  },
];

export const filterTransactions = (
  transactions: Transaction[],
  searchTerm: string,
  filters?: {
    type?: string;
    status?: string;
    paymentMethod?: string;
  }
): Transaction[] => {
  let filtered = transactions;
  
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (transaction) =>
        transaction.transactionId.toLowerCase().includes(term) ||
        transaction.userName.toLowerCase().includes(term) ||
        transaction.userEmail.toLowerCase().includes(term) ||
        transaction.bookingId?.toLowerCase().includes(term) ||
        transaction.gatewayTransactionId?.toLowerCase().includes(term)
    );
  }
  
  if (filters) {
    if (filters.type) {
      filtered = filtered.filter((transaction) => transaction.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter((transaction) => transaction.status === filters.status);
    }
    
    if (filters.paymentMethod) {
      filtered = filtered.filter((transaction) => transaction.paymentMethod === filters.paymentMethod);
    }
  }
  
  return filtered;
};
