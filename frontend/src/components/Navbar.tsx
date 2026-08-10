"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Phone, Globe, User, X } from "lucide-react";
import SecondaryNav from "./SecondaryNav";
import ProfileSidebar from "./ProfileSidebar";
import { allCities } from "@/data/cities";
import { venuesPath } from "@/lib/routes";

export default function Navbar() {
  const router = useRouter();
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigateToCitySearch = (raw: string) => {
    const q = raw.trim().toLowerCase();
    if (!q) return;

    const match = allCities.find(
      (c) =>
        c.name.toLowerCase() === q ||
        c.slug === q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.includes(q.replace(/\s+/g, "-"))
    );

    if (match) {
      setSearchQuery("");
      setMobileSearchOpen(false);
      router.push(venuesPath(match.slug));
    }
  };

  const onSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      navigateToCitySearch(searchQuery);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white">
      <div className="h-1 bg-[#C89B3C]" />

      {mobileSearchOpen && (
        <div className="md:hidden border-b border-gray-200 bg-white">
          <div className="container-custom px-4 md:px-6 lg:px-8 flex items-center gap-2 py-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={onSearchKeyDown}
                placeholder="Search city"
                autoFocus
                className="w-full rounded-full border border-gray-300 bg-white pl-10 pr-4 py-2 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setMobileSearchOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Close search"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {!mobileSearchOpen && (
        <div
          className={`border-b border-gray-200 bg-white transition-all duration-500 ease-in-out overflow-hidden ${
            isScrolled
              ? "max-h-0 opacity-0 -translate-y-full"
              : "max-h-[100px] opacity-100 translate-y-0"
          }`}
        >
          <div className="container-custom px-4 md:px-6 lg:px-6 flex items-center justify-between gap-3 md:gap-4 py-3">
            <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-10">
              <Link href="/" className="shrink-0">
                <div className="relative h-12 sm:h-16 w-auto">
                  <img
                    src="/assets/valvetvenue.png"
                    alt="Velvet Venues"
                    className="h-full w-auto max-w-[140px] sm:max-w-[180px] object-contain object-left"
                  />
                </div>
              </Link>

              <div className="hidden md:block min-w-0 flex-1 max-w-sm lg:max-w-md">
                <div className="relative w-full">
                  <Search className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={onSearchKeyDown}
                    placeholder="Search city"
                    className="w-full rounded-full border border-gray-300 bg-white pl-10 lg:pl-12 pr-4 lg:pr-5 py-2 lg:py-2.5 text-sm lg:text-base text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                aria-label="Search"
                onClick={() => {
                  setMobileSearchOpen(true);
                  setProfileSidebarOpen(false);
                }}
                className="md:hidden p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <Search className="h-5 w-5 text-gray-700" />
              </button>

              <button
                aria-label="Phone"
                onClick={() => (window.location.href = "tel:+919876543210")}
                className="md:hidden p-2 rounded-full bg-orange-500 hover:bg-orange-600 transition-colors"
              >
                <Phone className="h-5 w-5 text-white" />
              </button>

              <button
                aria-label="Language"
                className="md:hidden p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              >
                <Globe className="h-5 w-5 text-gray-700" />
              </button>

              <button
                aria-label="Phone"
                onClick={() => (window.location.href = "tel:+919876543210")}
                className="hidden md:flex items-center gap-2 lg:gap-3 rounded-full bg-orange-500 px-4 py-2 lg:px-6 lg:py-3 text-sm lg:text-base font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                <Phone className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden lg:inline">+91 98765 43210</span>
              </button>

              <button
                aria-label="Language"
                className="hidden md:flex items-center gap-2 lg:gap-3 rounded-full border border-gray-300 bg-white px-3 py-2 lg:px-5 lg:py-3 text-sm lg:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Globe className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>EN</span>
              </button>

              <button
                aria-label="Profile Menu"
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileSidebarOpen(true);
                  setMobileSearchOpen(false);
                }}
                className="flex items-center gap-2 lg:gap-3 rounded-full border border-gray-300 bg-white px-3 py-2 lg:px-5 lg:py-3 text-sm lg:text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 lg:h-5 lg:w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!mobileSearchOpen && <SecondaryNav isScrolled={isScrolled} />}

      <ProfileSidebar
        isOpen={profileSidebarOpen}
        onClose={() => setProfileSidebarOpen(false)}
      />
    </header>
  );
}
