"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BookingWorkspace } from "../components/BookingWorkspace";
import { Button } from "../../_components/ui/Button";
import { PageHeader } from "../../_components/ui/PageHeader";
import { confirmAction, notify } from "../../_components/ui/Toast";
import { useDemoStore } from "../../store/demoStore";

export default function ViewBookingPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const booking = useDemoStore((s) => s.bookings.find((b) => b.id === id || b.bookingId === id));
  const updateBooking = useDemoStore((s) => s.updateBooking);

  if (!booking) {
    return (
      <div className="space-y-4 animate-fadeIn">
        <PageHeader
          title="Booking Not Found"
          subtitle="The requested reservation could not be located."
          breadcrumbs={[
            { label: "Dashboard", href: "/admin" },
            { label: "Booking Management" },
            { label: "Bookings", href: "/admin/bookings" },
            { label: "Not Found" },
          ]}
          actions={
            <Button variant="secondary" icon={ArrowLeft} onClick={() => router.push("/admin/bookings")}>
              Back to Bookings
            </Button>
          }
        />
        <div className="bg-white border border-[#E8EAF0] rounded-[14px] px-6 py-14 text-center">
          <p className="text-sm text-[#6B7280] mb-4">
            No booking exists for ID <span className="font-medium text-[#111827]">{id}</span>.
          </p>
          <Link href="/admin/bookings" className="text-sm font-medium text-[#C89B3C] hover:underline">
            Return to bookings list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <BookingWorkspace
      booking={booking}
      mode="view"
      onEdit={() => router.push(`/admin/bookings/${booking.id}/edit`)}
      onDelete={async () => {
        const ok = await confirmAction({
          title: "Cancel Booking?",
          message: `Are you sure you want to cancel booking ${booking.bookingId}?`,
          confirmLabel: "Cancel Booking",
        });
        if (!ok) return;
        updateBooking(booking.id, {
          bookingStatus: "cancelled",
          updatedAt: new Date().toISOString(),
        });
        notify.statusUpdated("Booking cancelled successfully.");
        router.push("/admin/bookings");
      }}
    />
  );
}
