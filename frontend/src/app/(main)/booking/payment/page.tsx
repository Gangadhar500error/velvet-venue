"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Building2,
  CheckCircle2,
} from "lucide-react";
import {
  clearPendingBooking,
  formatDisplayDate,
  readPendingBooking,
  type PendingBookingDraft,
} from "@/app/(main)/venues/[city]/[id]/components/bookingDraft";
import { formatINR } from "@/app/(main)/venues/[city]/[id]/components/resolvePublicVenue";

export default function BookingPaymentPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<PendingBookingDraft | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    const data = readPendingBooking();
    if (!data) {
      router.replace("/");
      return;
    }
    setDraft(data);
  }, [router]);

  if (!draft) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAFAFA] text-sm text-[#6B7280]">
        Loading booking…
      </div>
    );
  }

  const handlePay = () => {
    setPaying(true);
    // Demo payment gateway — no backend change
    window.setTimeout(() => {
      setPaying(false);
      setPaid(true);
      clearPendingBooking();
    }, 1400);
  };

  if (paid) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-[20px] border border-[#ECECEC] bg-white p-8 text-center shadow-[0_12px_40px_rgba(0,0,0,0.06)]">
          <CheckCircle2 className="mx-auto h-14 w-14 text-[#22C55E]" />
          <h1 className="mt-4 font-display text-2xl font-bold text-[#1F2937]">
            Payment Successful
          </h1>
          <p className="mt-2 text-[14px] text-[#6B7280]">
            Your booking request for{" "}
            <span className="font-semibold text-[#1F2937]">{draft.venueName}</span>{" "}
            has been received. Our team will confirm shortly.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-[#C89B3C] px-5 py-2.5 text-[14px] font-semibold text-white hover:bg-[#A77A20]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="border-b border-[#ECECEC] bg-white">
        <div className="container-custom flex items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#1F2937] hover:text-[#C89B3C]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <span className="text-[#D1D5DB]">/</span>
          <span className="text-[13px] font-semibold text-[#1F2937]">
            Payment
          </span>
        </div>
      </div>

      <div className="container-custom grid gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div className="rounded-[20px] border border-[#ECECEC] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-5 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#C89B3C]" />
            <h1 className="font-display text-xl font-bold text-[#1F2937]">
              Secure Payment
            </h1>
          </div>
          <p className="mb-6 text-[13px] text-[#6B7280]">
            Review your booking and pay the advance to confirm your slot. This is
            a demo payment step — no real charge is made.
          </p>

          <div className="mb-6 space-y-3 rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-4 text-[13px]">
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7280]">Pay now (advance)</span>
              <span className="font-bold text-[#C89B3C]">
                {formatINR(draft.payOnlineNow || draft.estimatedTotal)}
              </span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-[#6B7280]">Booking total</span>
              <span className="font-semibold text-[#1F2937]">
                {formatINR(draft.estimatedTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={paying}
            onClick={handlePay}
            className="w-full rounded-xl bg-[#C89B3C] py-3.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(200,155,60,0.35)] transition-all duration-250 hover:bg-[#A77A20] disabled:opacity-70"
          >
            {paying ? "Processing…" : "Pay Securely"}
          </button>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#6B7280]">
            <ShieldCheck className="h-3.5 w-3.5 text-[#C89B3C]" />
            Encrypted · Velvet Venues secure checkout
          </p>
        </div>

        <div className="rounded-[20px] border border-[#ECECEC] bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#C89B3C]" />
            <h2 className="font-display text-lg font-bold text-[#1F2937]">
              Booking Details
            </h2>
          </div>
          <div className="space-y-2.5 text-[13px]">
            <Row label="Venue" value={draft.venueName} />
            <Row
              label="Booking Type"
              value={
                draft.bookingType === "venue_food"
                  ? "Venue + Food"
                  : "Venue Only"
              }
            />
            {draft.bookingType === "venue_only" && (
              <Row label="Mode / Slot" value={draft.slotLabel || "Full Day"} />
            )}
            {draft.foodSlotLabels?.length > 0 && (
              <Row label="Meals" value={draft.foodSlotLabels.join(", ")} />
            )}
            <Row
              label="Date(s)"
              value={draft.selectedDates.map(formatDisplayDate).join(", ")}
            />
            <Row label="Guests" value={String(draft.guestCount)} />
            <Row
              label="Services"
              value={
                draft.services.length ? draft.services.join(", ") : "None"
              }
            />
            {draft.notes && <Row label="Notes" value={draft.notes} />}
            <div className="my-2 border-t border-[#ECECEC]" />
            <Row label="Name" value={draft.customerName} />
            <Row label="Mobile" value={draft.customerPhone} />
            <Row label="Email" value={draft.customerEmail} />
            {draft.customerCity && (
              <Row label="City" value={draft.customerCity} />
            )}
            <div className="mt-3 flex justify-between border-t border-[#ECECEC] pt-3">
              <span className="font-semibold text-[#1F2937]">Estimated Total</span>
              <span className="text-[16px] font-bold text-[#C89B3C]">
                {formatINR(draft.estimatedTotal)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="shrink-0 text-[#6B7280]">{label}</span>
      <span className="max-w-[65%] text-right font-medium text-[#1F2937]">
        {value}
      </span>
    </div>
  );
}
