"use client";

import { useEffect, useState } from "react";
import { Phone, MessageCircle, Share2, ArrowUp, CalendarCheck } from "lucide-react";

interface VenueFloatingActionsProps {
  phone?: string;
  onBook?: () => void;
  onShare?: () => void;
}

export default function VenueFloatingActions({
  phone,
  onBook,
  onShare,
}: VenueFloatingActionsProps) {
  const [showTop, setShowTop] = useState(false);
  const digits = (phone || "").replace(/\D/g, "");
  const wa = digits ? (digits.startsWith("91") ? digits : `91${digits.slice(-10)}`) : "";

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Desktop sticky right rail */}
      <div className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 lg:flex">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="rounded-full bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#FBF6EA]"
            aria-label="Call venue"
          >
            <Phone className="h-4 w-4 text-[#C89B3C]" />
          </a>
        )}
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#FBF6EA]"
            aria-label="WhatsApp"
          >
            <MessageCircle className="h-4 w-4 text-[#22C55E]" />
          </a>
        )}
        <button
          type="button"
          onClick={onShare}
          className="rounded-full bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#FBF6EA]"
          aria-label="Share"
        >
          <Share2 className="h-4 w-4 text-[#1F2937]" />
        </button>
        <button
          type="button"
          onClick={onBook}
          className="rounded-full bg-[#C89B3C] p-3 text-white shadow-[0_8px_24px_rgba(200,155,60,0.4)] transition-all duration-250 hover:-translate-y-0.5 hover:bg-[#A77A20]"
          aria-label="Book now"
        >
          <CalendarCheck className="h-4 w-4" />
        </button>
        {showTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="rounded-full bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-all duration-250 hover:-translate-y-0.5"
            aria-label="Back to top"
          >
            <ArrowUp className="h-4 w-4 text-[#1F2937]" />
          </button>
        )}
      </div>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#ECECEC] bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg gap-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ECECEC] py-3 text-[13px] font-semibold text-[#1F2937]"
            >
              <Phone className="h-4 w-4 text-[#C89B3C]" />
              Call
            </a>
          )}
          {wa && (
            <a
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#ECECEC] py-3 text-[13px] font-semibold text-[#1F2937]"
            >
              <MessageCircle className="h-4 w-4 text-[#22C55E]" />
              WhatsApp
            </a>
          )}
          <button
            type="button"
            onClick={onBook}
            className="inline-flex flex-[1.4] items-center justify-center rounded-xl bg-[#C89B3C] py-3 text-[13px] font-semibold text-white shadow-sm"
          >
            Book Now
          </button>
        </div>
      </div>
    </>
  );
}
