"use client";

import Link from "next/link";
import {
  Building2,
  CalendarClock,
  CalendarDays,
  Heart,
  IndianRupee,
  Star,
  Wallet,
  FileText,
  Bell,
  UserRound,
} from "lucide-react";
import { PageHeader } from "../ui/PageHeader";
import { useDemoStore } from "../../store/demoStore";
import { formatCurrency } from "../../bookings/data";
import { toYmd } from "../../venues/availability";
import { useAuth } from "@/contexts/AuthContext";
import { PermissionGate } from "@/components/PermissionGate";

export default function VendorDashboard() {
  const { dashboard } = useAuth();
  const widgets = new Set(dashboard?.widgets || []);
  const venues = useDemoStore((s) => s.venues);
  const bookings = useDemoStore((s) => s.bookings);
  const today = toYmd(new Date());

  const myVenues = venues.length;
  const todaysBookings = bookings.filter((b) => b.eventDate === today).length;
  const upcoming = bookings.filter((b) => b.eventDate > today).length;
  const revenue = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);
  const pending = bookings.filter((b) => b.bookingStatus === "pending").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Vendor Dashboard"
        subtitle="Your venues, bookings, and revenue at a glance."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {widgets.has("my_venues") && (
          <StatCard label="My Venues" value={myVenues} href="/admin/venues" icon={Building2} />
        )}
        {widgets.has("todays_bookings") && (
          <StatCard label="Today's Bookings" value={todaysBookings} href="/admin/bookings" icon={CalendarDays} />
        )}
        {widgets.has("upcoming_bookings") && (
          <StatCard label="Upcoming Bookings" value={upcoming} href="/admin/bookings" icon={CalendarClock} />
        )}
        {widgets.has("revenue") && (
          <StatCard label="Revenue" value={formatCurrency(revenue)} href="/admin/transactions" icon={IndianRupee} isText />
        )}
        {widgets.has("pending_requests") && (
          <StatCard label="Pending Requests" value={pending} href="/admin/bookings" icon={CalendarDays} />
        )}
        {widgets.has("availability") && (
          <StatCard label="Calendar" value="View" href="/admin/calendar" icon={CalendarClock} isText />
        )}
      </div>

      <PermissionGate permission="Review.View">
        <section className="rounded-[14px] border border-[#E8EAF0] bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-[#C89B3C]" />
            <h2 className="text-sm font-semibold text-[#111827]">Customer Reviews</h2>
          </div>
          <p className="text-sm text-[#6B7280]">Reviews from your customers appear here.</p>
        </section>
      </PermissionGate>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  icon: Icon,
  isText,
}: {
  label: string;
  value: string | number;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isText?: boolean;
}) {
  return (
    <Link
      href={href}
      className="rounded-[14px] border border-[#E8EAF0] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
    >
      <Icon className="w-5 h-5 text-[#C89B3C] mb-3" />
      <p className={`font-bold text-[#111827] ${isText ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-[12px] text-[#6B7280] mt-1">{label}</p>
    </Link>
  );
}

export function CustomerDashboard() {
  const { dashboard, user } = useAuth();
  const widgets = new Set(dashboard?.widgets || []);
  const bookings = useDemoStore((s) => s.bookings);
  const today = toYmd(new Date());

  const upcoming = bookings.filter((b) => b.eventDate >= today).length;
  const past = bookings.filter((b) => b.eventDate < today).length;
  const paid = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Welcome, ${user?.first_name || "Guest"}`}
        subtitle="Your bookings, payments, and account."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {widgets.has("upcoming_events") && (
          <StatCard label="Upcoming Events" value={upcoming} href="/admin/bookings" icon={CalendarClock} />
        )}
        {widgets.has("past_bookings") && (
          <StatCard label="Past Bookings" value={past} href="/admin/bookings" icon={CalendarDays} />
        )}
        {widgets.has("wishlist") && (
          <StatCard label="Wishlist" value="View" href="/admin/wishlist" icon={Heart} isText />
        )}
        {widgets.has("payments") && (
          <StatCard label="Payments" value={formatCurrency(paid)} href="/admin/bookings" icon={Wallet} isText />
        )}
        {widgets.has("invoices") && (
          <StatCard label="Invoices" value="View" href="/admin/invoices" icon={FileText} isText />
        )}
        {widgets.has("notifications") && (
          <StatCard label="Notifications" value="View" href="/admin/settings/notifications" icon={Bell} isText />
        )}
        {widgets.has("profile") && (
          <StatCard label="Profile" value="Edit" href="/admin/settings/profile" icon={UserRound} isText />
        )}
      </div>
    </div>
  );
}
