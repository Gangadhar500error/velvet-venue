"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  IndianRupee,
  MapPin,
  Plus,
  ShieldAlert,
  Sparkles,
  Store,
  TrendingUp,
  UserCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { PageHeader } from "./_components/ui/PageHeader";
import { useDemoStore } from "./store/demoStore";
import { formatCurrency } from "./bookings/data";
import { toYmd } from "./venues/availability";
import type { Booking } from "./bookings/types";

type ScheduleRow = {
  id: string;
  time: string;
  customer: string;
  venue: string;
  event: string;
  status: string;
  href: string;
};

const STATIC_TODAYS_SCHEDULE: ScheduleRow[] = [
  {
    id: "demo-1",
    time: "10:00 AM",
    customer: "Aarav Sharma",
    venue: "Grand Orchid Hall",
    event: "Corporate Meet",
    status: "confirmed",
    href: "/admin/bookings",
  },
  {
    id: "demo-2",
    time: "12:30 PM",
    customer: "Diya Patel",
    venue: "Lakeview Banquet",
    event: "Birthday Party",
    status: "pending",
    href: "/admin/bookings",
  },
  {
    id: "demo-3",
    time: "03:00 PM",
    customer: "Rohan Verma",
    venue: "Skyline Terrace",
    event: "Engagement",
    status: "checked_in",
    href: "/admin/bookings",
  },
  {
    id: "demo-4",
    time: "06:30 PM",
    customer: "Meera Nair",
    venue: "Palm Grove Pavilion",
    event: "Wedding Reception",
    status: "confirmed",
    href: "/admin/bookings",
  },
];

export default function AdminDashboardPage() {
  const [now, setNow] = useState(() => new Date());
  const [mounted, setMounted] = useState(false);
  const businesses = useDemoStore((s) => s.businesses);
  const venues = useDemoStore((s) => s.venues);
  const bookings = useDemoStore((s) => s.bookings);

  useEffect(() => {
    setMounted(true);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = toYmd(now);
  const weekStart = useMemo(() => {
    const d = new Date(`${today}T00:00:00`);
    d.setDate(d.getDate() - 6);
    return toYmd(d);
  }, [today]);
  const monthPrefix = today.slice(0, 7);

  const metrics = useMemo(() => {
    const activeBookings = bookings.filter(
      (b) => b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded"
    );
    const todaysEvents = activeBookings.filter((b) => coversToday(b, today));
    const upcomingEvents = activeBookings.filter(
      (b) => b.eventDate > today
    ).length;
    const todaysRevenue = bookings
      .flatMap((b) => b.transactions || [])
      .filter((t) => t.status === "success" && (t.date || "").slice(0, 10) === today)
      .reduce((s, t) => s + t.amount, 0);
    const weekRevenue = bookings
      .flatMap((b) => b.transactions || [])
      .filter((t) => t.status === "success" && (t.date || "").slice(0, 10) >= weekStart)
      .reduce((s, t) => s + t.amount, 0);
    const monthRevenue = bookings
      .flatMap((b) => b.transactions || [])
      .filter((t) => t.status === "success" && (t.date || "").startsWith(monthPrefix))
      .reduce((s, t) => s + t.amount, 0);
    const pendingPayments = bookings.reduce((s, b) => s + (b.pendingAmount || 0), 0);
    const collected = bookings.reduce((s, b) => s + (b.paidAmount || 0), 0);

    const venueApprovalPending = venues.filter((v) => v.approval === "pending").length;
    const businessApprovalPending = businesses.filter((b) => b.verification === "pending").length;
    const pendingApprovals = venueApprovalPending + businessApprovalPending;
    const refundRequests = bookings.filter(
      (b) => b.bookingStatus === "refunded" || (b.refundAmount || 0) > 0
    ).length;

    const bookedTodayVenues = new Set(
      venues
        .flatMap((v) =>
          (v.availability || [])
            .filter((a) => a.date === today && a.status === "booked")
            .map(() => v.id)
        )
    ).size;
    const blockedTodayVenues = venues.filter((v) =>
      (v.availability || []).some(
        (a) =>
          a.date === today &&
          (a.status === "blocked" || a.status === "maintenance" || a.status === "holiday")
      )
    ).length;
    const availableTodayVenues = venues.filter((v) => {
      const row = (v.availability || []).find((a) => a.date === today);
      if (!row) return true;
      return row.status === "available";
    }).length;

    const slots = venues.flatMap((v) => v.availability || []).filter((a) => a.date === today);
    const bookedSlots = slots.filter((s) => s.status === "booked").length;
    const occupancy =
      slots.length > 0 ? Math.round((bookedSlots / slots.length) * 100) : 0;

    return {
      businesses: businesses.length,
      venues: venues.filter((v) => v.status === "published").length,
      todaysBookings: todaysEvents.length,
      upcomingEvents,
      todaysRevenue,
      pendingApprovals,
      weekRevenue,
      monthRevenue,
      pendingPayments,
      collected,
      venueApprovalPending,
      businessApprovalPending,
      refundRequests,
      pendingPaymentCount: bookings.filter(
        (b) => b.paymentStatus === "unpaid" || b.paymentStatus === "partial"
      ).length,
      availableTodayVenues,
      bookedTodayVenues,
      blockedTodayVenues,
      occupancy,
    };
  }, [businesses, venues, bookings, today, weekStart, monthPrefix]);

  const todaysSchedule = useMemo(
    () =>
      bookings
        .filter((b) => coversToday(b, today))
        .filter((b) => b.bookingStatus !== "cancelled" && b.bookingStatus !== "refunded")
        .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
        .slice(0, 6),
    [bookings, today]
  );

  const todaysScheduleRows = useMemo<ScheduleRow[]>(
    () =>
      todaysSchedule.length > 0
        ? todaysSchedule.map((b) => ({
            id: b.id,
            time: b.startTime || "All day",
            customer: b.customerName,
            venue: b.venueName,
            event: b.eventType,
            status: b.bookingStatus,
            href: `/admin/bookings/${b.id}`,
          }))
        : STATIC_TODAYS_SCHEDULE,
    [todaysSchedule]
  );

  const upcomingTimeline = useMemo(
    () =>
      bookings
        .filter(
          (b) =>
            b.eventDate >= today &&
            b.bookingStatus !== "cancelled" &&
            b.bookingStatus !== "refunded"
        )
        .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
        .slice(0, 5),
    [bookings, today]
  );

  const recentBookings = useMemo(
    () =>
      [...bookings]
        .sort((a, b) => (b.createdAt || b.bookingDate).localeCompare(a.createdAt || a.bookingDate))
        .slice(0, 5),
    [bookings]
  );

  const recentPayments = useMemo(
    () =>
      bookings
        .flatMap((b) =>
          (b.transactions || []).map((t) => ({
            id: t.id,
            transactionId: t.transactionId,
            customerName: b.customerName,
            amount: t.amount,
            method: t.method,
            status: t.status,
            date: t.date,
            bookingRef: b.id,
          }))
        )
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5),
    [bookings]
  );

  const activityFeed = useMemo(() => buildActivityFeed(bookings, venues, today).slice(0, 5), [
    bookings,
    venues,
    today,
  ]);

  const sidebarUpcoming = useMemo(() => upcomingTimeline.slice(0, 5), [upcomingTimeline]);

  const notifications = useMemo(
    () => buildNotifications(bookings, venues, businesses, today).slice(0, 5),
    [bookings, venues, businesses, today]
  );

  const collectionProgress =
    metrics.collected + metrics.pendingPayments > 0
      ? Math.round((metrics.collected / (metrics.collected + metrics.pendingPayments)) * 100)
      : 100;

  return (
    <div
      className={`space-y-5 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      <PageHeader
        title="Dashboard"
        subtitle="Business health, today's work, and what needs your attention."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden sm:inline text-[12px] text-[#9CA3AF] mr-1">
              {now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <Link
              href="/admin/bookings/create"
              className="h-9 px-3.5 rounded-xl bg-[#C89B3C] text-white text-sm font-medium inline-flex items-center gap-1.5 hover:bg-[#B8862B] shadow-sm transition-all hover:shadow-md"
            >
              <Plus className="w-4 h-4" /> New Booking
            </Link>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Businesses"
          value={metrics.businesses}
          subtitle="Active profiles"
          trend={`${businesses.filter((b) => b.status === "active").length} active`}
          href="/admin/business-profile"
          accent="green"
          icon={Building2}
          animate={mounted}
        />
        <KpiCard
          label="Venues"
          value={metrics.venues}
          subtitle="Published venues"
          trend={`${venues.length} total`}
          href="/admin/venues"
          accent="orange"
          icon={Store}
          animate={mounted}
        />
        <KpiCard
          label="Today's Bookings"
          value={metrics.todaysBookings}
          subtitle="Events today"
          trend="Live schedule"
          href="/admin/bookings"
          accent="blue"
          icon={CalendarDays}
          animate={mounted}
        />
        <KpiCard
          label="Upcoming Events"
          value={metrics.upcomingEvents}
          subtitle="Future bookings"
          trend="Next 30 days"
          href="/admin/bookings"
          accent="purple"
          icon={CalendarClock}
          animate={mounted}
        />
        <KpiCard
          label="Today's Revenue"
          value={metrics.todaysRevenue}
          subtitle="Collected today"
          trend={formatCurrency(metrics.weekRevenue) + " this week"}
          href="/admin/bookings"
          accent="teal"
          icon={IndianRupee}
          animate={mounted}
          formatValue={(n) => formatCurrency(n)}
        />
        <KpiCard
          label="Pending Approvals"
          value={metrics.pendingApprovals}
          subtitle="Needs review"
          trend={`${metrics.pendingPaymentCount} payments due`}
          href="/admin/venues"
          accent="red"
          icon={ShieldAlert}
          animate={mounted}
        />
      </div>

      <div className="space-y-4">
        {/* Main column */}
        <div className="space-y-4">
          {/* Today's Schedule */}
          <Panel accent="blue" title="Today's Schedule" icon={Clock3}>
            <div className="space-y-2">
              {todaysScheduleRows.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-[#F1F5F9] bg-[#FCFCFD] px-3 py-2.5 hover:border-[#BFDBFE] transition-colors"
                >
                  <span className="text-[12px] font-semibold text-[#2563EB] w-16 shrink-0">{item.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#111827] truncate">{item.customer}</p>
                    <p className="text-[12px] text-[#6B7280] truncate">
                      {item.venue} · {item.event}
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                  <Link href={item.href} className="text-[12px] font-semibold text-[#C89B3C] hover:underline shrink-0">
                    View
                  </Link>
                </div>
              ))}
            </div>
          </Panel>

          {/* Upcoming Bookings timeline */}
          <Panel accent="purple" title="Upcoming Bookings" icon={TrendingUp}>
            {upcomingTimeline.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title="No upcoming bookings"
                description="New reservations will appear here as customers book."
                actionLabel="View Calendar"
                actionHref="/admin/calendar"
              />
            ) : (
              <div className="relative pl-4 border-l-2 border-[#E8EAF0] space-y-4">
                {upcomingTimeline.map((b, i) => (
                  <div key={b.id} className="relative pl-4 animate-fadeIn" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-[#C89B3C] ring-4 ring-white" />
                    <div className="flex flex-wrap items-start gap-3 rounded-xl border border-[#F1F5F9] p-3 hover:shadow-sm transition-shadow">
                      <Avatar name={b.customerName} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#111827]">{b.customerName}</p>
                        <p className="text-[12px] text-[#6B7280]">
                          {b.venueName} · {formatDateShort(b.eventDate)}
                        </p>
                        <p className="text-sm font-semibold text-[#111827] mt-1">
                          {formatCurrency(b.bookingAmount)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={b.bookingStatus} />
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="text-[11px] font-semibold text-[#C89B3C] hover:underline"
                        >
                          View Booking
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Compact trio: Revenue | Availability | Pending */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-[14px] border border-[#E8EAF0] bg-gradient-to-br from-[#F0FDF4] to-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-sm font-semibold text-[#111827]">Revenue</h3>
              </div>
              <div className="space-y-2.5">
                <MetricLine label="Today" value={formatCurrency(metrics.todaysRevenue)} />
                <MetricLine label="This Week" value={formatCurrency(metrics.weekRevenue)} />
                <MetricLine label="This Month" value={formatCurrency(metrics.monthRevenue)} />
                <MetricLine label="Pending" value={formatCurrency(metrics.pendingPayments)} tone="text-[#B8862B]" />
                <MetricLine label="Collected" value={formatCurrency(metrics.collected)} tone="text-[#16A34A]" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[11px] text-[#9CA3AF] mb-1">
                  <span>Collection rate</span>
                  <span>{collectionProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16A34A] transition-all duration-700"
                    style={{ width: `${collectionProgress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[14px] border border-[#E8EAF0] bg-gradient-to-br from-[#EFF6FF] to-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-semibold text-[#111827]">Availability</h3>
              </div>
              <div className="space-y-2.5">
                <MetricLine label="Available Venues" value={metrics.availableTodayVenues} />
                <MetricLine label="Booked Today" value={metrics.bookedTodayVenues} tone="text-[#DC2626]" />
                <MetricLine label="Blocked" value={metrics.blockedTodayVenues} tone="text-[#6B7280]" />
                <MetricLine label="Occupancy" value={`${metrics.occupancy}%`} tone="text-[#7C3AED]" />
              </div>
              <Link
                href="/admin/calendar"
                className="mt-4 inline-flex items-center gap-1 text-[12px] font-semibold text-[#C89B3C] hover:underline"
              >
                Open Calendar <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="rounded-[14px] border border-[#E8EAF0] bg-gradient-to-br from-[#FCFAF8] to-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-4 h-4 text-[#B8862B]" />
                <h3 className="text-sm font-semibold text-[#111827]">Pending Actions</h3>
              </div>
              <div className="space-y-1.5">
                <ActionLink label="Venue Approvals" value={metrics.venueApprovalPending} href="/admin/venues" />
                <ActionLink label="Business Approvals" value={metrics.businessApprovalPending} href="/admin/business-profile" />
                <ActionLink label="Pending Payments" value={metrics.pendingPaymentCount} href="/admin/bookings" />
                <ActionLink label="Refund Requests" value={metrics.refundRequests} href="/admin/bookings" />
              </div>
            </div>
          </div>

          {/* Recent Bookings + Payments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Panel
              accent="orange"
              title="Recent Bookings"
              icon={CalendarDays}
              actionHref="/admin/bookings"
              actionLabel="View All"
            >
              {recentBookings.length === 0 ? (
                <EmptyState
                  icon={CalendarDays}
                  title="No bookings yet"
                  description="Your latest reservations will show up here."
                  actionLabel="View Bookings"
                  actionHref="/admin/bookings"
                  compact
                />
              ) : (
                <div className="space-y-2">
                  {recentBookings.map((b) => (
                    <div
                      key={b.id}
                      className="grid grid-cols-[1fr_auto] gap-2 rounded-xl border border-[#F1F5F9] px-3 py-2.5 hover:bg-[#FFFBF7] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#111827] truncate">{b.bookingId}</p>
                        <p className="text-[12px] text-[#6B7280] truncate">
                          {b.customerName} · {b.venueName}
                        </p>
                        <p className="text-[11px] text-[#9CA3AF] truncate">{b.eventType}</p>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1">
                        <span className="text-sm font-semibold text-[#111827]">
                          {formatCurrency(b.bookingAmount)}
                        </span>
                        <StatusBadge status={b.bookingStatus} compact />
                        <Link href={`/admin/bookings/${b.id}`} className="text-[11px] text-[#C89B3C] font-semibold">
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel accent="teal" title="Recent Payments" icon={Wallet}>
              {recentPayments.length === 0 ? (
                <EmptyState
                  icon={Wallet}
                  title="No payments yet"
                  description="Successful transactions will appear here."
                  actionLabel="View Bookings"
                  actionHref="/admin/bookings"
                  compact
                />
              ) : (
                <div className="space-y-2">
                  {recentPayments.map((p, idx) => (
                    <div
                      key={`${p.id}-${p.bookingRef}-${p.date}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[#F1F5F9] px-3 py-2.5 hover:bg-[#F0FDFA] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#111827] truncate">{p.transactionId}</p>
                        <p className="text-[12px] text-[#6B7280] truncate">{p.customerName}</p>
                        <p className="text-[11px] text-[#9CA3AF] capitalize">
                          {String(p.method).replace(/_/g, " ")}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-[#111827]">{formatCurrency(p.amount)}</p>
                        <TxnBadge status={p.status} />
                        <Link
                          href={`/admin/bookings/${p.bookingRef}`}
                          className="text-[11px] text-[#C89B3C] font-semibold"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SidebarWidget title="Today's Activity" icon={Sparkles} items={activityFeed} empty="No activity today." />
            <SidebarWidget
              title="Upcoming Events"
              icon={CalendarClock}
              items={sidebarUpcoming.map((b) => ({
                id: b.id,
                label: b.customerName,
                sub: `${b.venueName} · ${formatDateShort(b.eventDate)}`,
                href: `/admin/bookings/${b.id}`,
              }))}
              empty="Nothing scheduled ahead."
            />
            <SidebarWidget
              title="Notifications"
              icon={Bell}
              items={notifications}
              empty="You're all caught up."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function coversToday(b: Booking, today: string) {
  const selected = (b.selectedDates || "")
    .split(",")
    .map((d) => d.trim())
    .filter(Boolean);
  if (selected.length > 0) return selected.includes(today);
  if (b.eventDate === today) return true;
  if (b.eventEndDate && b.eventDate <= today && b.eventEndDate >= today) return true;
  return false;
}

function formatDateShort(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function buildActivityFeed(
  bookings: Booking[],
  venues: ReturnType<typeof useDemoStore.getState>["venues"],
  today: string
) {
  const items: Array<{ id: string; label: string; sub: string; href?: string }> = [];
  bookings.forEach((b) => {
    if ((b.createdAt || "").slice(0, 10) === today) {
      items.push({
        id: `bk-${b.id}`,
        label: `${b.customerName} booked ${b.venueName}`,
        sub: b.bookingId,
        href: `/admin/bookings/${b.id}`,
      });
    }
    (b.transactions || []).forEach((t) => {
      if (t.status === "success" && (t.date || "").slice(0, 10) === today) {
        items.push({
          id: `txn-${t.id}`,
          label: `Payment ${formatCurrency(t.amount)} received`,
          sub: b.customerName,
          href: `/admin/bookings/${b.id}`,
        });
      }
    });
  });
  venues.forEach((v) => {
    const blocked = (v.availability || []).find(
      (a) =>
        a.date === today &&
        (a.status === "blocked" || a.status === "maintenance")
    );
    if (blocked) {
      items.push({
        id: `blk-${v.id}`,
        label: `${v.name} marked ${blocked.status}`,
        sub: "Availability",
        href: `/admin/venues/${v.id}?tab=availability`,
      });
    }
  });
  return items;
}

function buildNotifications(
  bookings: Booking[],
  venues: ReturnType<typeof useDemoStore.getState>["venues"],
  businesses: ReturnType<typeof useDemoStore.getState>["businesses"],
  today: string
) {
  const items: Array<{ id: string; label: string; sub: string; href?: string }> = [];
  venues
    .filter((v) => v.approval === "pending")
    .slice(0, 2)
    .forEach((v) => {
      items.push({
        id: `v-${v.id}`,
        label: `Venue approval: ${v.name}`,
        sub: "Pending review",
        href: `/admin/venues/${v.id}`,
      });
    });
  businesses
    .filter((b) => b.verification === "pending")
    .slice(0, 2)
    .forEach((b) => {
      items.push({
        id: `biz-${b.id}`,
        label: `Verify ${b.businessName}`,
        sub: "Business profile",
        href: `/admin/business-profile/${b.id}`,
      });
    });
  bookings
    .filter((b) => b.paymentStatus === "partial" || b.paymentStatus === "unpaid")
    .slice(0, 2)
    .forEach((b) => {
      items.push({
        id: `pay-${b.id}`,
        label: `Payment pending · ${b.customerName}`,
        sub: formatCurrency(b.pendingAmount),
        href: `/admin/bookings/${b.id}`,
      });
    });
  bookings
    .filter((b) => (b.createdAt || "").slice(0, 10) === today)
    .slice(0, 1)
    .forEach((b) => {
      items.push({
        id: `new-${b.id}`,
        label: `New booking ${b.bookingId}`,
        sub: b.venueName,
        href: `/admin/bookings/${b.id}`,
      });
    });
  return items;
}

const ACCENT_STYLES = {
  green: {
    bg: "from-[#ECFDF3] to-white",
    border: "border-[#BBF7D0]",
    icon: "bg-[#DCFCE7] text-[#16A34A]",
    hover: "hover:border-[#86EFAC]",
  },
  orange: {
    bg: "from-[#FCFAF8] to-white",
    border: "border-[#FED7AA]",
    icon: "bg-[#FFEDD5] text-[#B8862B]",
    hover: "hover:border-[#FDBA74]",
  },
  blue: {
    bg: "from-[#EFF6FF] to-white",
    border: "border-[#BFDBFE]",
    icon: "bg-[#DBEAFE] text-[#2563EB]",
    hover: "hover:border-[#93C5FD]",
  },
  purple: {
    bg: "from-[#F5F3FF] to-white",
    border: "border-[#DDD6FE]",
    icon: "bg-[#EDE9FE] text-[#7C3AED]",
    hover: "hover:border-[#C4B5FD]",
  },
  red: {
    bg: "from-[#FEF2F2] to-white",
    border: "border-[#FECACA]",
    icon: "bg-[#FEE2E2] text-[#DC2626]",
    hover: "hover:border-[#FCA5A5]",
  },
  teal: {
    bg: "from-[#F0FDFA] to-white",
    border: "border-[#99F6E4]",
    icon: "bg-[#CCFBF1] text-[#0D9488]",
    hover: "hover:border-[#5EEAD4]",
  },
} as const;

function KpiCard({
  label,
  value,
  subtitle,
  trend,
  href,
  accent,
  icon: Icon,
  animate,
  formatValue,
}: {
  label: string;
  value: number;
  subtitle: string;
  trend: string;
  href: string;
  accent: keyof typeof ACCENT_STYLES;
  icon: React.ComponentType<{ className?: string }>;
  animate: boolean;
  formatValue?: (n: number) => string;
}) {
  const styles = ACCENT_STYLES[accent];
  const display = useCountUp(value, animate, formatValue);
  return (
    <Link
      href={href}
      className={`rounded-[14px] border bg-gradient-to-br ${styles.bg} ${styles.border} ${styles.hover} p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`p-2 rounded-xl ${styles.icon}`}>
          <Icon className="w-4 h-4" />
        </span>
        <TrendingUp className="w-3.5 h-3.5 text-[#9CA3AF]" />
      </div>
      <p className="text-2xl font-bold text-[#111827] tracking-tight">{display}</p>
      <p className="text-[12px] font-medium text-[#374151] mt-0.5">{label}</p>
      <p className="text-[11px] text-[#9CA3AF] mt-1">{subtitle}</p>
      <p className="text-[11px] text-[#6B7280] mt-2 truncate">{trend}</p>
    </Link>
  );
}

function useCountUp(target: number, animate: boolean, format?: (n: number) => string) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (!animate) {
      setCurrent(target);
      return;
    }
    const duration = 600;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCurrent(Math.round(target * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, animate]);
  return format ? format(current) : String(current);
}

function Panel({
  accent,
  title,
  icon: Icon,
  children,
  actionHref,
  actionLabel,
}: {
  accent: keyof typeof ACCENT_STYLES;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  const s = ACCENT_STYLES[accent];
  return (
    <section className={`rounded-[14px] border ${s.border} bg-white p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${s.icon}`}>
            <Icon className="w-4 h-4" />
          </span>
          <h2 className="text-sm font-semibold text-[#111827]">{title}</h2>
        </div>
        {actionHref && actionLabel ? (
          <Link href={actionHref} className="text-[12px] font-semibold text-[#C89B3C] hover:underline">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function SidebarWidget({
  title,
  icon: Icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Array<{ id: string; label: string; sub: string; href?: string }>;
  empty: string;
}) {
  return (
    <div className="rounded-[14px] border border-[#E8EAF0] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#C89B3C]" />
        <h3 className="text-[13px] font-semibold text-[#111827]">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-[12px] text-[#9CA3AF] py-4 text-center">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="block rounded-lg px-2 py-1.5 -mx-2 hover:bg-[#FFF8F3] transition-colors">
                  <p className="text-[12px] font-medium text-[#111827] truncate">{item.label}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{item.sub}</p>
                </Link>
              ) : (
                <div>
                  <p className="text-[12px] font-medium text-[#111827] truncate">{item.label}</p>
                  <p className="text-[11px] text-[#9CA3AF] truncate">{item.sub}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  compact,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
  compact?: boolean;
}) {
  return (
    <div className={`text-center ${compact ? "py-6" : "py-10"}`}>
      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FFF4ED] text-[#C89B3C] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      <p className="text-[12px] text-[#6B7280] mt-1 max-w-xs mx-auto">{description}</p>
      <Link
        href={actionHref}
        className="inline-flex mt-3 text-[12px] font-semibold text-[#C89B3C] hover:underline"
      >
        {actionLabel}
      </Link>
    </div>
  );
}

function MetricLine({
  label,
  value,
  tone = "text-[#111827]",
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-[#6B7280]">{label}</span>
      <span className={`font-semibold ${tone}`}>{value}</span>
    </div>
  );
}

function ActionLink({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg px-2 py-2 -mx-2 hover:bg-[#FFF8F3] transition-colors"
    >
      <span className="text-[12px] text-[#4B5563]">{label}</span>
      <span className="text-[12px] font-bold text-[#111827]">{value}</span>
    </Link>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#B8862B] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
      {initials}
    </div>
  );
}

function StatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const key = status.toLowerCase();
  const map: Record<string, string> = {
    confirmed: "bg-[#ECFDF3] text-[#16A34A]",
    completed: "bg-[#F5F3FF] text-[#7C3AED]",
    pending: "bg-[#FCFAF8] text-[#B8862B]",
    draft: "bg-[#F3F4F6] text-[#6B7280]",
    cancelled: "bg-[#FEF2F2] text-[#DC2626]",
    refunded: "bg-[#FEF2F2] text-[#DC2626]",
    checked_in: "bg-[#EFF6FF] text-[#2563EB]",
  };
  const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <span
      className={`inline-flex rounded-full font-semibold animate-fadeIn ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]"} ${map[key] || map.pending}`}
    >
      {label}
    </span>
  );
}

function TxnBadge({ status }: { status: string }) {
  const key = status.toLowerCase();
  if (key === "success") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#16A34A]">
        <CheckCircle2 className="w-3 h-3" /> Paid
      </span>
    );
  }
  if (key === "failed") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#DC2626]">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#B8862B]">
      <Clock3 className="w-3 h-3" /> Pending
    </span>
  );
}
