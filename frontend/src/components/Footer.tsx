"use client";

import { MapPin, Mail, Phone, Facebook, Twitter, Globe, Linkedin, Instagram } from "lucide-react";
import { useState, useEffect } from "react";
import { allCities } from "@/data/cities";

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number>(2025);
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative bg-[#1B2230] text-white overflow-hidden">
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, #C89B3C 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      
      {/* Gradient accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#C89B3C]/20 to-[#6A1830]/15 rounded-full blur-3xl" />

      <div className="relative z-10 container-custom px-4 sm:px-6 lg:px-8 py-5 lg:py-5">
        {/* Our Presence Section - First */}
        <div className="mb-8 pb-6 border-b border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 font-display uppercase tracking-wide">
            Our Presence
          </h3>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-base text-[#DDC4AB] font-body">
            {allCities.map((city, index, array) => (
              <span key={city.slug} className="flex items-center">
                <span className="hover:text-[#C89B3C] transition-colors cursor-default">{city.name}</span>
                {index < array.length - 1 && <span className="text-white/30 mx-2">|</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-6">
          {/* Useful Links Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 font-display uppercase tracking-wide">
              Useful Links
            </h3>
            <div className="space-y-1.5">
              {[
                "About Us",
                "Careers",
                "Contact Us",
                "Venue Owners",
                "List Your Venue",
                "Privacy Policy",
                "Terms And Conditions",
                "Cookie Policy"
              ].map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className="block text-sm text-[#DDC4AB] hover:text-[#C89B3C] transition-colors font-body leading-relaxed"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>

          {/* Corporate & Registered Office */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 font-display uppercase tracking-wide">
              Corporate Office
            </h3>
            <p className="text-sm text-[#DDC4AB] leading-relaxed font-body mb-4">
              5th Floor, Prestige Tower,<br />
              Road No. 36, Jubilee Hills,<br />
              Hyderabad, Telangana, India - 500033
            </p>
            <h3 className="text-base font-bold text-white mb-3 font-display uppercase tracking-wide">
              Registered Office
            </h3>
            <p className="text-sm text-[#DDC4AB] leading-relaxed font-body">
              Plot 12, Financial District,<br />
              Gachibowli,<br />
              Hyderabad, Telangana, India - 500032
            </p>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 font-display uppercase tracking-wide">
              Contact Us
            </h3>
            <div className="space-y-2">
              <a 
                href="mailto:info@velvetvenues.com" 
                className="flex items-center gap-2 text-sm text-[#DDC4AB] hover:text-[#C89B3C] transition-colors group"
              >
                <Mail className="w-4 h-4 text-[#C89B3C] shrink-0" />
                <span className="font-body break-all">info@velvetvenues.com</span>
              </a>
              <a 
                href="tel:+919876543210" 
                className="flex items-center gap-2 text-sm text-[#DDC4AB] hover:text-[#C89B3C] transition-colors group"
              >
                <Phone className="w-4 h-4 text-[#C89B3C] shrink-0" />
                <span className="font-body">+91 98765 43210</span>
              </a>
              <a 
                href="https://www.google.com/maps/search/?api=1&query=Hyderabad+Telangana+India" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-[#DDC4AB] hover:text-[#C89B3C] transition-colors group"
              >
                <MapPin className="w-4 h-4 text-[#C89B3C] shrink-0 mt-0.5" />
                <span className="font-body">Multiple locations across India</span>
              </a>
            </div>
          </div>

          {/* Social Media Section */}
          <div>
            <h3 className="text-base font-bold text-white mb-3 font-display uppercase tracking-wide">
              Follow Us
            </h3>
            <div className="flex gap-2 flex-wrap">
              {[
                { icon: Linkedin, href: "#", label: "LinkedIn" },
                { icon: Facebook, href: "#", label: "Facebook" },
                { icon: Instagram, href: "#", label: "Instagram" },
                { icon: Twitter, href: "#", label: "Twitter" },
                { icon: Globe, href: "https://www.velvetvenues.com/", label: "Website" }
              ].map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#C89B3C] transition-all duration-300 hover:bg-[#6A1830] hover:text-white hover:scale-110 border border-[#DDC4AB]/30"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2">
            <div className="text-sm text-[#DDC4AB] font-body text-center md:text-left">
              Copyright - {currentYear}. <span className="font-semibold text-white">Velvet Venues</span> | All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
