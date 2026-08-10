import { Invoice } from "../types/invoice";

export const customerInvoices: Invoice[] = [
  {
    id: 1,
    invoiceNumber: "INV-2024-001",
    bookingId: "BK-2024-001",
    propertyName: "Velvet Grand Wedding Palace",
    issueDate: "2024-01-15",
    dueDate: "2024-01-22",
    amount: 250000,
    tax: 25000,
    totalAmount: 275000,
    status: "paid",
    currency: "INR",
  },
  {
    id: 2,
    invoiceNumber: "INV-2024-002",
    bookingId: "BK-2024-003",
    propertyName: "City Convention Centre",
    issueDate: "2024-01-17",
    dueDate: "2024-01-24",
    amount: 400000,
    tax: 40000,
    totalAmount: 440000,
    status: "pending",
    currency: "INR",
  },
  {
    id: 3,
    invoiceNumber: "INV-2024-003",
    bookingId: "BK-2024-005",
    propertyName: "Emerald Luxury Resort",
    issueDate: "2024-01-19",
    dueDate: "2024-01-26",
    amount: 350000,
    tax: 35000,
    totalAmount: 385000,
    status: "paid",
    currency: "INR",
  },
  {
    id: 4,
    invoiceNumber: "INV-2024-004",
    bookingId: "BK-2024-007",
    propertyName: "Sunrise Farm House",
    issueDate: "2024-01-21",
    dueDate: "2024-01-28",
    amount: 80000,
    tax: 8000,
    totalAmount: 88000,
    status: "overdue",
    currency: "INR",
  },
  {
    id: 5,
    invoiceNumber: "INV-2024-005",
    bookingId: "BK-2024-009",
    propertyName: "Lotus Garden Outdoor Venue",
    issueDate: "2024-01-23",
    dueDate: "2024-01-30",
    amount: 180000,
    tax: 18000,
    totalAmount: 198000,
    status: "pending",
    currency: "INR",
  },
];

/**
 * Get invoice by ID
 */
export const getCustomerInvoiceById = (id: number): Invoice | undefined => {
  return customerInvoices.find((invoice) => invoice.id === id);
};
