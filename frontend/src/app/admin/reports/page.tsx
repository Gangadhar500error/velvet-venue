"use client";

import { useMemo } from "react";
import Link from "next/link";
import { PageHeader } from "../_components/ui/PageHeader";
import { useDemoStore } from "../store/demoStore";
import { formatCurrency } from "../bookings/data";

export default function ReportsPage() {
  const businesses = useDemoStore((s) => s.businesses);
  const venues = useDemoStore((s) => s.venues);
  const customers = useDemoStore((s) => s.customers);
  const bookings = useDemoStore((s) => s.bookings);

  const byBusiness = useMemo(() => {
    return businesses.map((b) => {
      const bizBookings = bookings.filter((x) => x.businessId === b.businessId);
      const bizVenues = venues.filter((v) => v.businessId === b.businessId);
      const revenue = bizBookings.reduce((s, x) => s + (x.bookingAmount || 0), 0);
      const collected = bizBookings.reduce((s, x) => s + (x.paidAmount || 0), 0);
      return {
        id: b.id,
        name: b.businessName,
        venues: bizVenues.length,
        bookings: bizBookings.length,
        revenue,
        collected,
        status: b.status,
      };
    });
  }, [businesses, venues, bookings]);

  const totals = useMemo(
    () => ({
      revenue: bookings.reduce((s, b) => s + (b.bookingAmount || 0), 0),
      collected: bookings.reduce((s, b) => s + (b.paidAmount || 0), 0),
      pending: bookings.reduce((s, b) => s + (b.pendingAmount || 0), 0),
      customers: customers.length,
      confirmed: bookings.filter((b) => b.bookingStatus === "confirmed").length,
    }),
    [bookings, customers]
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      <PageHeader
        title="Reports"
        subtitle="Session-linked performance across businesses and bookings."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Reports" },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Metric label="Collected revenue" value={formatCurrency(totals.collected)} />
        <Metric label="Pending payments" value={formatCurrency(totals.pending)} />
        <Metric label="Customers" value={String(totals.customers)} />
        <Metric label="Confirmed bookings" value={String(totals.confirmed)} />
      </div>

      <div className="bg-white border border-[#E8EAF0] rounded-[14px] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#E8EAF0]">
          <h2 className="text-sm font-semibold text-[#111827]">Business performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FCFCFD] text-[#6B7280] text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-4 py-2.5">Business</th>
                <th className="text-left font-semibold px-4 py-2.5">Status</th>
                <th className="text-right font-semibold px-4 py-2.5">Venues</th>
                <th className="text-right font-semibold px-4 py-2.5">Bookings</th>
                <th className="text-right font-semibold px-4 py-2.5">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {byBusiness.map((row) => (
                <tr key={row.id} className="border-t border-[#F3F4F6]">
                  <td className="px-4 py-3">
                    <Link href={`/admin/business-profile/${row.id}`} className="font-semibold text-[#111827] hover:text-[#C89B3C]">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize text-[#4B5563]">{row.status}</td>
                  <td className="px-4 py-3 text-right font-medium">{row.venues}</td>
                  <td className="px-4 py-3 text-right font-medium">{row.bookings}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(row.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-[#E8EAF0] rounded-[14px] p-4">
      <p className="text-xs text-[#6B7280] mb-1">{label}</p>
      <p className="text-lg font-bold text-[#111827]">{value}</p>
    </div>
  );
}
