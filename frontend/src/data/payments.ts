import { Payment } from "../types/payment";

export const customerPayments: Payment[] = [
  {
    id: 1,
    transactionId: "TXN-2024-001",
    invoiceNumber: "INV-2024-001",
    bookingId: "BK-2024-001",
    propertyName: "Velvet Grand Wedding Palace",
    amount: 250000,
    method: "credit_card",
    status: "completed",
    date: "2024-01-15",
    currency: "INR",
  },
  {
    id: 2,
    transactionId: "TXN-2024-002",
    invoiceNumber: "INV-2024-003",
    bookingId: "BK-2024-005",
    propertyName: "Emerald Luxury Resort",
    amount: 350000,
    method: "debit_card",
    status: "completed",
    date: "2024-01-19",
    currency: "INR",
  },
  {
    id: 3,
    transactionId: "TXN-2024-003",
    invoiceNumber: "INV-2024-002",
    bookingId: "BK-2024-003",
    propertyName: "City Convention Centre",
    amount: 400000,
    method: "bank_transfer",
    status: "pending",
    date: "2024-01-20",
    currency: "INR",
  },
  {
    id: 4,
    transactionId: "TXN-2024-004",
    invoiceNumber: "INV-2024-005",
    bookingId: "BK-2024-009",
    propertyName: "Lotus Garden Outdoor Venue",
    amount: 180000,
    method: "upi",
    status: "pending",
    date: "2024-01-23",
    currency: "INR",
  },
  {
    id: 5,
    transactionId: "TXN-2024-005",
    invoiceNumber: "INV-2024-004",
    bookingId: "BK-2024-007",
    propertyName: "Sunrise Farm House",
    amount: 80000,
    method: "wallet",
    status: "failed",
    date: "2024-01-25",
    currency: "INR",
  },
  {
    id: 6,
    transactionId: "TXN-2024-006",
    invoiceNumber: "INV-2024-001",
    bookingId: "BK-2024-001",
    propertyName: "Velvet Grand Wedding Palace",
    amount: 250000,
    method: "credit_card",
    status: "refunded",
    date: "2024-01-26",
    currency: "INR",
  },
];

/**
 * Get payment by ID
 */
export const getCustomerPaymentById = (id: number): Payment | undefined => {
  return customerPayments.find((payment) => payment.id === id);
};
