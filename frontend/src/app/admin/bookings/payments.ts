import type {
  Booking,
  BookingInvoice,
  BookingTransaction,
  InvoicePaymentType,
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
} from "./types";
import { PLATFORM_COMMISSION_PERCENT } from "../venues/data";

function computePending(bookingAmount: number, paidAmount: number) {
  return Math.max(0, bookingAmount - paidAmount);
}

function platformFeeForAmount(amount: number) {
  return Math.round((amount * PLATFORM_COMMISSION_PERCENT) / 100);
}

export interface RecordPaymentInput {
  paymentDate: string;
  amount: number;
  method: PaymentMethod | string;
  reference: string;
  notes: string;
  collectedBy?: string;
}

export function bookingInvoicePrefix(bookingId: string) {
  return `INV-${String(bookingId || "").replace(/^BK-/i, "")}`;
}

export function nextInvoiceNo(bookingId: string, existingCount: number) {
  const seq = String(existingCount + 1).padStart(2, "0");
  return `${bookingInvoicePrefix(bookingId)}-${seq}`;
}

export function paymentTypeLabel(type: InvoicePaymentType | string | undefined, index = 0) {
  if (type === "advance") return "Advance Payment";
  if (type === "final") return "Final Settlement";
  if (type === "installment") {
    if (index === 1) return "Second Payment";
    return `Payment ${index + 1}`;
  }
  return type || "Payment";
}

/** Compact labels for tables: Advance | Partial | Final */
export function paymentTypeShortLabel(type: InvoicePaymentType | string | undefined) {
  if (type === "advance") return "Advance";
  if (type === "final") return "Final";
  if (type === "installment") return "Partial";
  return type ? String(type).replace(/_/g, " ") : "—";
}

export function paymentMethodLabel(method: string | undefined) {
  const map: Record<string, string> = {
    upi: "UPI",
    card: "Card",
    cash: "Cash",
    cheque: "Cheque",
    netbanking: "Net Banking",
    bank_transfer: "Bank Transfer",
    link: "Payment Link",
  };
  if (!method) return "—";
  return map[method] || String(method).replace(/_/g, " ");
}

export function resolvePaymentType(
  isFirst: boolean,
  remainingAfter: number
): InvoicePaymentType {
  if (remainingAfter <= 0) return "final";
  if (isFirst) return "advance";
  return "installment";
}

/**
 * Booking status rules (payment-driven):
 * - Draft / Pending: no successful payment
 * - Confirmed: any advance received (partial or full)
 * - Completed: only when already completed or event date passed + fully paid
 * - Cancelled / Refunded: preserved
 * Payment status separately: unpaid | partial | paid
 */
export function resolveStatusesAfterPayment(args: {
  booking: Booking;
  paidAmount: number;
  bookingAmount: number;
}): { paymentStatus: PaymentStatus; bookingStatus: BookingStatus; invoiceStatus: Booking["invoiceStatus"] } {
  const { booking, paidAmount, bookingAmount } = args;
  const remaining = computePending(bookingAmount, paidAmount);

  const paymentStatus: PaymentStatus =
    remaining <= 0 && bookingAmount > 0
      ? "paid"
      : paidAmount > 0
        ? "partial"
        : "unpaid";

  let bookingStatus: BookingStatus = booking.bookingStatus;
  if (bookingStatus !== "cancelled" && bookingStatus !== "refunded") {
    if (bookingStatus === "completed") {
      // keep completed
    } else if (paidAmount <= 0) {
      bookingStatus = bookingStatus === "draft" ? "draft" : "pending";
    } else {
      bookingStatus = "confirmed";
    }
  }

  const invoiceStatus =
    remaining <= 0 ? ("paid" as const) : paidAmount > 0 ? ("generated" as const) : ("not_generated" as const);

  return { paymentStatus, bookingStatus, invoiceStatus };
}

/** Build invoices from successful transactions when invoices[] is missing or empty. */
export function deriveInvoicesFromTransactions(booking: Booking): BookingInvoice[] {
  const txns = [...(booking.transactions || [])]
    .filter((t) => t.status === "success")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let paidRunning = 0;
  return txns.map((txn, index) => {
    paidRunning += txn.amount;
    const remaining = Math.max(0, booking.bookingAmount - paidRunning);
    const paymentType =
      txn.paymentType ||
      resolvePaymentType(index === 0, remaining);
    const invoiceNo =
      txn.invoiceNo || nextInvoiceNo(booking.bookingId, index);
    return {
      id: `inv-${txn.id || index}`,
      invoiceNo,
      invoiceDate: txn.date,
      paymentType,
      paymentMethod: txn.method,
      amountReceived: txn.amount,
      remainingBalance: remaining,
      status: "paid" as const,
      transactionId: txn.transactionId || txn.id,
      gstAmount: booking.taxAmount || 0,
      platformFee: platformFeeForAmount(txn.amount),
      platformFeePercent: PLATFORM_COMMISSION_PERCENT,
    };
  });
}

export function getBookingInvoices(booking: Booking): BookingInvoice[] {
  if (booking.invoices && booking.invoices.length > 0) {
    const fee = platformFeeForAmount(booking.advancePaid || booking.bookingAmount);
    return [...booking.invoices]
      .sort(
        (a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime()
      )
      .map((inv) => {
        const txn = (booking.transactions || []).find(
          (t) => t.transactionId === inv.transactionId || t.invoiceNo === inv.invoiceNo
        );
        return {
          ...inv,
          paymentMethod: inv.paymentMethod || txn?.method,
          gstAmount: inv.gstAmount ?? booking.taxAmount ?? 0,
          platformFee: inv.platformFee ?? fee,
          platformFeePercent: inv.platformFeePercent ?? PLATFORM_COMMISSION_PERCENT,
        };
      });
  }
  return deriveInvoicesFromTransactions(booking);
}

export function getLatestInvoiceNo(booking: Booking): string {
  const invoices = getBookingInvoices(booking);
  if (invoices.length === 0) return "—";
  return invoices[invoices.length - 1].invoiceNo;
}

export function hydrateBookingPayments(booking: Booking): Booking {
  const invoices = getBookingInvoices(booking);
  const transactions = (booking.transactions || []).map((txn, index) => {
    const inv = invoices.find((i) => i.transactionId === txn.transactionId) || invoices[index];
    return {
      ...txn,
      invoiceNo: txn.invoiceNo || inv?.invoiceNo,
      paymentType: txn.paymentType || inv?.paymentType,
      collectedBy: txn.collectedBy || booking.assignedExecutive || booking.createdBy || "Admin",
      remarks:
        txn.remarks ||
        (inv ? `${paymentTypeLabel(inv.paymentType, index)}` : "Payment"),
    };
  });

  const paidFromTxns = transactions
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amount, 0);
  const paidAmount = paidFromTxns > 0 ? paidFromTxns : booking.paidAmount || 0;

  const { paymentStatus, bookingStatus, invoiceStatus } = resolveStatusesAfterPayment({
    booking,
    paidAmount,
    bookingAmount: booking.bookingAmount,
  });

  return {
    ...booking,
    invoices,
    transactions,
    paidAmount,
    pendingAmount: computePending(booking.bookingAmount, paidAmount),
    paymentStatus:
      booking.paymentStatus === "refunded" || booking.paymentStatus === "failed"
        ? booking.paymentStatus
        : paymentStatus,
    bookingStatus:
      booking.bookingStatus === "cancelled" ||
      booking.bookingStatus === "refunded" ||
      booking.bookingStatus === "completed"
        ? booking.bookingStatus
        : bookingStatus,
    invoiceStatus,
  };
}

export function applyRecordedPayment(
  booking: Booking,
  input: RecordPaymentInput
): Booking {
  const amount = Math.round(Number(input.amount) || 0);
  const currentPaid = booking.paidAmount || 0;
  const bookingAmount = booking.bookingAmount || 0;
  const pending = computePending(bookingAmount, currentPaid);

  if (amount <= 0) {
    throw new Error("Amount received must be greater than zero.");
  }
  if (amount > pending) {
    throw new Error("Amount received cannot exceed the remaining balance.");
  }

  const existingInvoices = getBookingInvoices(booking);
  const invoiceNo = nextInvoiceNo(booking.bookingId, existingInvoices.length);
  const nowIso = input.paymentDate
    ? new Date(input.paymentDate).toISOString()
    : new Date().toISOString();
  const paymentDate = input.paymentDate.includes("T")
    ? input.paymentDate
    : `${input.paymentDate}T12:00:00`;

  const newPaid = currentPaid + amount;
  const remaining = computePending(bookingAmount, newPaid);
  const isFirst = existingInvoices.length === 0;
  const paymentType = resolvePaymentType(isFirst, remaining);
  const collectedBy = input.collectedBy || "Admin";
  const typeIndex = existingInvoices.length;
  const remarks =
    input.notes.trim() ||
    paymentTypeLabel(paymentType, typeIndex);

  const txnId = `TXN-${Date.now().toString().slice(-8)}`;
  const invoiceId = `inv-${Date.now().toString().slice(-8)}`;
  const fee = platformFeeForAmount(amount);

  const transaction: BookingTransaction = {
    id: `t-${Date.now()}`,
    transactionId: txnId,
    method: input.method,
    amount,
    reference: input.reference.trim() || "—",
    status: "success",
    date: paymentDate,
    invoiceNo,
    paymentType,
    collectedBy,
    remarks,
  };

  const invoice: BookingInvoice = {
    id: invoiceId,
    invoiceNo,
    invoiceDate: paymentDate,
    paymentType,
    paymentMethod: input.method,
    amountReceived: amount,
    remainingBalance: remaining,
    status: "paid",
    transactionId: txnId,
    gstAmount: booking.taxAmount || 0,
    platformFee: fee,
    platformFeePercent: PLATFORM_COMMISSION_PERCENT,
  };

  const { paymentStatus, bookingStatus, invoiceStatus } = resolveStatusesAfterPayment({
    booking,
    paidAmount: newPaid,
    bookingAmount,
  });

  const timeline = [
    ...(booking.timeline || []),
    {
      id: `tl-pay-${Date.now()}`,
      type: "payment" as const,
      title: `${paymentTypeLabel(paymentType, typeIndex)} Received`,
      description: `${paymentTypeLabel(paymentType, typeIndex)} of ₹${amount.toLocaleString("en-IN")} received via ${paymentMethodLabel(String(input.method))}.`,
      date: paymentDate,
      actor: collectedBy,
    },
    {
      id: `tl-inv-${Date.now() + 1}`,
      type: "invoice" as const,
      title: "Invoice Generated",
      description: `Invoice ${invoiceNo} generated for ${paymentTypeLabel(paymentType, typeIndex).toLowerCase()}.`,
      date: paymentDate,
      actor: "System",
    },
  ];

  if (remaining <= 0) {
    timeline.push({
      id: `tl-paid-${Date.now() + 2}`,
      type: "status",
      title: "Booking Fully Paid",
      description:
        "Remaining balance cleared. Platform fee is non-refundable and calculated on the total booking amount.",
      date: paymentDate,
      actor: collectedBy,
    });
  }

  return {
    ...booking,
    advancePaid: isFirst ? amount : booking.advancePaid,
    paidAmount: newPaid,
    pendingAmount: remaining,
    paymentStatus,
    bookingStatus,
    invoiceStatus,
    paymentMethod: (input.method as PaymentMethod) || booking.paymentMethod,
    transactions: [...(booking.transactions || []), transaction],
    invoices: [...existingInvoices, invoice],
    timeline,
    updatedAt: nowIso,
    updatedBy: collectedBy,
  };
}

/** Seed first advance payment + invoice when a booking is created with advance. */
export function seedAdvancePayment(booking: Booking): Booking {
  if ((booking.transactions || []).length > 0 || (booking.invoices || []).length > 0) {
    return hydrateBookingPayments(booking);
  }
  if (booking.advancePaid <= 0) {
    return {
      ...booking,
      invoices: booking.invoices || [],
      transactions: booking.transactions || [],
      paymentStatus: "unpaid",
      bookingStatus:
        booking.bookingStatus === "cancelled" || booking.bookingStatus === "refunded"
          ? booking.bookingStatus
          : booking.bookingStatus === "draft"
            ? "draft"
            : "pending",
    };
  }

  return applyRecordedPayment(
    {
      ...booking,
      paidAmount: 0,
      pendingAmount: booking.bookingAmount,
      paymentStatus: "unpaid",
    },
    {
      paymentDate: (booking.createdAt || new Date().toISOString()).slice(0, 10),
      amount: booking.advancePaid,
      method: booking.paymentMethod || "upi",
      reference: "ADVANCE",
      notes: "Advance Payment",
      collectedBy: booking.createdBy || "Admin",
    }
  );
}
