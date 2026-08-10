"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "../_components/ui/PageHeader";
import { useDemoStore } from "../store/demoStore";
import { formatCurrency, formatDateTime } from "../bookings/data";

export default function TransactionsPage() {
  const bookings = useDemoStore((s) => s.bookings);

  const rows = useMemo(
    () =>
      bookings.flatMap((b) =>
        (b.transactions || []).map((t) => ({
          ...t,
          bookingId: b.bookingId,
          bookingRef: b.id,
          customerName: b.customerName,
          venueName: b.venueName,
          businessName: b.businessName,
        }))
      ),
    [bookings]
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Transactions"
        subtitle="Payments collected across bookings in this session."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Finance" },
          { label: "Transactions" },
        ]}
      />

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FCFCFD] text-xs uppercase tracking-wide text-[#6B7280]">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold">Transaction</th>
                <th className="text-left px-4 py-2.5 font-semibold">Booking</th>
                <th className="text-left px-4 py-2.5 font-semibold">Customer</th>
                <th className="text-left px-4 py-2.5 font-semibold">Venue</th>
                <th className="text-right px-4 py-2.5 font-semibold">Amount</th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#F3F4F6]">
                  <td className="px-4 py-3 font-semibold text-[#111827]">
                    <Link
                      href={`/admin/transactions/${encodeURIComponent(r.transactionId)}`}
                      className="text-[#C89B3C] hover:underline"
                    >
                      {r.transactionId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/bookings/${r.bookingRef}`} className="text-[#C89B3C] hover:underline font-medium">
                      {r.bookingId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3">{r.venueName}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                  <td className="px-4 py-3 text-[#6B7280]">{formatDateTime(r.date)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#6B7280]">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
