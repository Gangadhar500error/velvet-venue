"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Eye, FileText, Plus, Printer } from "lucide-react";
import { Button } from "../../_components/ui/Button";
import { notify } from "../../_components/ui/Toast";
import { QuickCreateModal, QuickField, quickInputCls } from "./SmartSearchSelect";
import { Booking, PaymentMethod } from "../types";
import {
  formatCurrency,
  formatDate,
  recordPaymentMethodOptions,
} from "../data";
import {
  applyRecordedPayment,
  getBookingInvoices,
  paymentMethodLabel,
  paymentTypeLabel,
} from "../payments";
import { useDemoStore } from "../../store/demoStore";
import { EntityLink, entityHref } from "../../_components/relations/EntityLink";

const sectionCls =
  "bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden";

interface Props {
  booking: Booking;
  allowRecordPayment?: boolean;
}

export function BookingPaymentsPanel({
  booking,
  allowRecordPayment = true,
}: Props) {
  const router = useRouter();
  const updateBooking = useDemoStore((s) => s.updateBooking);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    paymentDate: new Date().toISOString().slice(0, 10),
    amount: "",
    method: "upi" as PaymentMethod | string,
    reference: "",
    notes: "",
  });

  const invoices = useMemo(() => getBookingInvoices(booking), [booking]);

  const remaining = booking.pendingAmount ?? 0;
  const canRecord = allowRecordPayment && remaining > 0;

  const openModal = () => {
    setForm({
      paymentDate: new Date().toISOString().slice(0, 10),
      amount: "",
      method: "upi",
      reference: "",
      notes: "",
    });
    setOpen(true);
  };

  const savePayment = async () => {
    const amount = Number(form.amount);
    if (!form.paymentDate) {
      notify.validation("Please select a Payment Date.");
      return;
    }
    if (!amount || amount <= 0) {
      notify.validation("Please enter a valid Amount Received.");
      return;
    }
    if (amount > remaining) {
      notify.validation("Amount received cannot exceed the remaining balance.");
      return;
    }
    if (!form.method) {
      notify.validation("Please select a Payment Method.");
      return;
    }

    setSaving(true);
    await new Promise((r) => setTimeout(r, 350));
    try {
      const next = applyRecordedPayment(booking, {
        paymentDate: form.paymentDate,
        amount,
        method: form.method,
        reference: form.reference,
        notes: form.notes,
        collectedBy: "Admin",
      });
      updateBooking(booking.id, next);
      notify.created("Payment");
      setOpen(false);
    } catch (err) {
      notify.validation(err instanceof Error ? err.message : "Unable to save payment.");
    } finally {
      setSaving(false);
    }
  };

  const stubAction = (action: string, invoiceNo: string) => {
    notify.statusUpdated(`${action}: ${invoiceNo}`);
  };

  return (
    <div className="space-y-4">
      <section className={sectionCls}>
        <div className="px-4 md:px-5 py-3 border-b border-[#E8EAF0] bg-[#FFF3EB]/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C89B3C]" />
            <h2 className="text-[13px] font-semibold uppercase tracking-wide text-[#111827]">
              Invoices
            </h2>
          </div>
          {canRecord && (
            <Button variant="primary" icon={Plus} onClick={openModal}>
              Record Payment
            </Button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FCFCFD] text-xs uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Invoice No</th>
                <th className="text-left px-4 py-2.5 font-semibold">Invoice Date</th>
                <th className="text-left px-4 py-2.5 font-semibold">Payment Type</th>
                <th className="text-left px-4 py-2.5 font-semibold">Payment Method</th>
                <th className="text-right px-4 py-2.5 font-semibold">Amount Received</th>
                <th className="text-right px-4 py-2.5 font-semibold">Remaining Balance</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-[#F3F4F6]">
                  <td className="px-4 py-3 font-semibold text-[#111827]">
                    <EntityLink href={entityHref.invoice(inv.invoiceNo)}>
                      {inv.invoiceNo}
                    </EntityLink>
                  </td>
                  <td className="px-4 py-3 text-[#374151]">{formatDate(inv.invoiceDate)}</td>
                  <td className="px-4 py-3 text-[#374151]">
                    {paymentTypeLabel(inv.paymentType)}
                  </td>
                  <td className="px-4 py-3 text-[#374151]">
                    {paymentMethodLabel(String(inv.paymentMethod || ""))}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">
                    {formatCurrency(inv.amountReceived)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-[#374151]">
                    {formatCurrency(inv.remainingBalance)}
                  </td>
                  <td className="px-4 py-3">
                    <InvoiceStatusPill status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-[12px] font-medium">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#C89B3C] hover:underline"
                        onClick={() => router.push(entityHref.invoice(inv.invoiceNo))}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                      <span className="text-[#D1D5DB]">|</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#6B7280] hover:text-[#111827]"
                        onClick={() => stubAction("Download", inv.invoiceNo)}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                      <span className="text-[#D1D5DB]">|</span>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#6B7280] hover:text-[#111827]"
                        onClick={() => stubAction("Print", inv.invoiceNo)}
                      >
                        <Printer className="w-3.5 h-3.5" />
                        Print
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6B7280]">
                    No invoices yet. Record a payment to generate the first invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <QuickCreateModal
        open={open}
        title="Record Payment"
        subtitle={`Remaining balance ${formatCurrency(remaining)}`}
        saving={saving}
        onClose={() => setOpen(false)}
        onSave={savePayment}
        saveLabel="Save Payment"
      >
        <QuickField label="Payment Date" required>
          <input
            type="date"
            className={quickInputCls}
            value={form.paymentDate}
            onChange={(e) => setForm((p) => ({ ...p, paymentDate: e.target.value }))}
          />
        </QuickField>
        <QuickField label="Amount Received" required>
          <input
            type="number"
            min={1}
            max={remaining}
            className={quickInputCls}
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
            placeholder="Enter amount"
          />
        </QuickField>
        <QuickField label="Payment Method" required>
          <select
            className={quickInputCls}
            value={form.method}
            onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
          >
            {recordPaymentMethodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </QuickField>
        <QuickField label="Reference Number">
          <input
            className={quickInputCls}
            value={form.reference}
            onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
            placeholder="TXN / UTR / Cheque no."
          />
        </QuickField>
        <QuickField label="Notes">
          <textarea
            className={`${quickInputCls} h-20 py-2 resize-none`}
            value={form.notes}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Optional remarks"
          />
        </QuickField>
      </QuickCreateModal>
    </div>
  );
}

function InvoiceStatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: "bg-[#ECFDF3] text-[#16A34A] border-[#D3F8E1]",
    pending: "bg-[#FCFAF8] text-[#B8862B] border-[#FED7AA]",
    cancelled: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border capitalize ${
        map[status] || "bg-[#F8FAFC] text-[#64748B] border-[#E8EAF0]"
      }`}
    >
      {status}
    </span>
  );
}
