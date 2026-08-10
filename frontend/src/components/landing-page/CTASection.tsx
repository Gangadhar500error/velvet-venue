"use client";

import { Phone, Mail } from "lucide-react";

export default function VenueBookingCTA() {
  return (
    <section className="relative w-full py-8 md:py-10 lg:py-12 overflow-hidden">
      {/* Background image with light opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-90"
        style={{ backgroundImage: "url('/assets/ctabg-new.png')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/40" aria-hidden />

      <div className="relative z-10 container-custom px-4 md:px-6 lg:px-8 mx-auto  flex justify-start">
        <div className="max-w-xl w-full bg-white/90 md:bg-white/80 backdrop-blur-sm p-5 md:p-8 lg:p-10 rounded-xl shadow-lg">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4 md:mb-6">
            Book Your Dream Venue{" "}
            <span className="text-[#C89B3C]">with Velvet Venues</span>
          </h2>

          <p className="text-gray-700 text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-relaxed">
            Wedding Planning • Décor & Catering • Banquet Halls •  
            Farm Houses • Reception Services • Party Hall Access
          </p>

          <div className="mt-5 md:mt-6 pt-4 border-t border-gray-300 space-y-2.5 md:space-y-3">
            <a href="tel:+919876543210" className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-[#C89B3C] transition-colors">
              <Phone className="h-5 w-5 text-[#C89B3C] shrink-0" />
              <span className="break-all">+91 98765 43210</span>
            </a>
            <a href="mailto:info@velvetvenues.com" className="flex items-center gap-2 text-base md:text-lg font-semibold text-gray-800 hover:text-[#C89B3C] transition-colors">
              <Mail className="h-5 w-5 text-[#C89B3C] shrink-0" />
              <span className="break-all">info@velvetvenues.com</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
