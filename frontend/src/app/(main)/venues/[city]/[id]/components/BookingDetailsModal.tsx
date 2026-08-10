"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { formatINR } from "./resolvePublicVenue";
import { formatDisplayDate } from "./bookingDraft";

export type BookingModalSummary = {
  venueName: string;
  bookingTypeLabel: string;
  dates: string[];
  guestCount: number;
  services: string[];
  estimatedTotal: number;
};

interface BookingDetailsModalProps {
  open: boolean;
  onClose: () => void;
  summary: BookingModalSummary;
  onProceed: (details: {
    fullName: string;
    mobile: string;
    email: string;
    city: string;
  }) => void;
}

export default function BookingDetailsModal({
  open,
  onClose,
  summary,
  onProceed,
}: BookingDetailsModalProps) {
  const [mounted, setMounted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setErrors({});
    }
  }, [open]);

  if (!open || !mounted) return null;

  const validate = () => {
    const next: Record<string, string> = {};
    if (!fullName.trim()) next.fullName = "Full name is required";
    if (!mobile.trim() || mobile.replace(/\D/g, "").length < 10)
      next.mobile = "Enter a valid 10-digit mobile number";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = "Enter a valid email address";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return;
    onProceed({
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: email.trim(),
      city: city.trim(),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 animate-[filterChipIn_0.2s_ease-out_both]"
        aria-label="Close modal"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="relative z-[1] flex max-h-[min(92vh,900px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-[20px] bg-white shadow-2xl animate-[filterChipIn_0.22s_ease-out_both] sm:rounded-[20px]"
      >
        <div className="flex items-start justify-between border-b border-[#ECECEC] px-5 py-4 sm:px-6">
          <div>
            <h2
              id="booking-modal-title"
              className="font-display text-xl font-bold text-[#1F2937]"
            >
              Complete Your Booking
            </h2>
            <p className="mt-1 text-[13px] text-[#6B7280]">
              Please enter your contact details to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#6B7280] hover:bg-[#F3F4F6]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto sm:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3 border-b border-[#ECECEC] p-5 sm:border-b-0 sm:border-r sm:p-6">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
                Full Name *
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-[#C89B3C] ${
                  errors.fullName ? "border-[#EF4444]" : "border-[#ECECEC]"
                }`}
                placeholder="Your full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-[11px] text-[#EF4444]">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
                Mobile Number *
              </label>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                inputMode="tel"
                className={`h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-[#C89B3C] ${
                  errors.mobile ? "border-[#EF4444]" : "border-[#ECECEC]"
                }`}
                placeholder="10-digit mobile number"
              />
              {errors.mobile && (
                <p className="mt-1 text-[11px] text-[#EF4444]">{errors.mobile}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`h-11 w-full rounded-xl border px-3 text-[14px] outline-none focus:border-[#C89B3C] ${
                  errors.email ? "border-[#EF4444]" : "border-[#ECECEC]"
                }`}
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-[#EF4444]">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-[#1F2937]">
                City (Optional)
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-11 w-full rounded-xl border border-[#ECECEC] px-3 text-[14px] outline-none focus:border-[#C89B3C]"
                placeholder="Your city"
              />
            </div>
          </div>

          <div className="bg-[#FAFAFA] p-5 sm:p-6">
            <p className="mb-3 text-[13px] font-semibold text-[#1F2937]">
              Booking Summary
            </p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Venue</span>
                <span className="max-w-[60%] text-right font-medium text-[#1F2937]">
                  {summary.venueName}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Booking Type</span>
                <span className="font-medium text-[#1F2937]">
                  {summary.bookingTypeLabel}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Date(s)</span>
                <span className="max-w-[60%] text-right font-medium text-[#1F2937]">
                  {summary.dates.length
                    ? summary.dates.map(formatDisplayDate).join(", ")
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Guests</span>
                <span className="font-medium text-[#1F2937]">
                  {summary.guestCount}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-[#6B7280]">Services</span>
                <span className="max-w-[60%] text-right font-medium text-[#1F2937]">
                  {summary.services.length ? summary.services.join(", ") : "None"}
                </span>
              </div>
              <div className="mt-3 flex justify-between border-t border-[#ECECEC] pt-3">
                <span className="font-semibold text-[#1F2937]">Estimated Total</span>
                <span className="text-[15px] font-bold text-[#C89B3C]">
                  {formatINR(summary.estimatedTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#ECECEC] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#ECECEC] px-5 py-2.5 text-[14px] font-semibold text-[#1F2937] hover:bg-[#FAFAFA]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="rounded-xl bg-[#C89B3C] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_6px_16px_rgba(200,155,60,0.3)] hover:bg-[#A77A20]"
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
