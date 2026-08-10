"use client";

import Image from "next/image";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import AllCitiesModal from "./AllCitiesModal";
import { allCities } from "@/data/cities";
import { venuesPath } from "@/lib/routes";

interface NavItem {
  name: string;
  image: string;
  slug: string;
}

interface SecondaryNavProps {
  isScrolled?: boolean;
}

const navigationItems: NavItem[] = [
  { name: "All", image: "/assets/city-logos/All-image.png", slug: "all" },
  ...allCities,
];

export default function SecondaryNav({ isScrolled = false }: SecondaryNavProps) {
  const router = useRouter();
  const navScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollRight, setShowScrollRight] = useState(false);
  const [showScrollLeft, setShowScrollLeft] = useState(false);
  const [allCitiesModalOpen, setAllCitiesModalOpen] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");

  const checkScrollability = useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      const canScrollRight = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 5;
      const canScrollLeft = scrollLeft > 5;

      setShowScrollRight(canScrollRight);
      setShowScrollLeft(canScrollLeft);
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      checkScrollability();
      if (navScrollRef.current) {
        navScrollRef.current.scrollLeft = 0;
      }
    }, 150);

    window.addEventListener("resize", checkScrollability);

    const scrollContainer = navScrollRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollability);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", checkScrollability);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", checkScrollability);
      }
    };
  }, [checkScrollability]);

  const scrollNav = (direction: "left" | "right") => {
    if (navScrollRef.current) {
      const scrollAmount = 260;
      const currentScroll = navScrollRef.current.scrollLeft;
      const newPosition =
        direction === "right" ? currentScroll + scrollAmount : currentScroll - scrollAmount;

      navScrollRef.current.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });

      setTimeout(() => {
        checkScrollability();
      }, 350);
    }
  };

  const handleCityClick = (item: NavItem) => {
    if (item.slug === "all") {
      setAllCitiesModalOpen(true);
      return;
    }
    router.push(venuesPath(item.slug));
  };

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
      setLocationQuery("");
      router.push(venuesPath(match.slug));
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white relative">
      <div
        className={`container-custom relative transition-all duration-500 ease-in-out ${
          isScrolled ? "lg:flex lg:items-center lg:gap-4" : "lg:block"
        }`}
      >
        <div
          className={`hidden lg:block transition-all duration-500 ease-in-out ${
            isScrolled
              ? "w-[30%] opacity-100 max-w-[30%] min-w-0 relative shrink-0"
              : "absolute left-0 top-0 w-0 h-0 opacity-0 max-w-0 min-w-0 overflow-hidden pointer-events-none"
          }`}
          style={!isScrolled ? { margin: 0, padding: 0 } : undefined}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  navigateToCitySearch(locationQuery);
                }
              }}
              placeholder="Search for a location"
              className="w-full rounded-full border border-gray-300 bg-white pl-10 pr-4 py-1.5 text-sm text-gray-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div
          className={`relative transition-all duration-500 ease-in-out ${
            isScrolled ? "lg:w-[70%] lg:flex-1" : "w-full"
          }`}
        >
          {showScrollLeft && (
            <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-white via-white to-transparent" />
          )}

          {showScrollRight && (
            <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-white via-white to-transparent" />
          )}

          {showScrollLeft && (
            <button
              aria-label="Scroll left"
              onClick={() => scrollNav("left")}
              className="hidden lg:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 shadow-md transition-all duration-200 backdrop-blur-sm"
            >
              <ChevronLeft className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}

          <div
            ref={navScrollRef}
            className={`flex items-center lg:gap-5 gap-3 overflow-x-auto scrollbar-hide py-2 ${
              showScrollLeft ? "lg:pl-20" : "lg:pl-4"
            } ${showScrollRight ? "lg:pr-20" : "lg:pr-4"}`}
            onScroll={checkScrollability}
          >
            {navigationItems.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => handleCityClick(item)}
                className="flex flex-col items-center gap-1.5 min-w-[75px] shrink-0 text-gray-700 hover:text-orange-500 transition-colors group cursor-pointer"
              >
                <div
                  className={`relative rounded-full overflow-hidden transition-all duration-300 ${
                    isScrolled ? "w-10 h-10 md:w-10 md:h-10" : "w-12 h-12 md:w-14 md:h-14"
                  }`}
                >
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300"
                    sizes={
                      isScrolled
                        ? "(max-width: 768px) 40px, 40px"
                        : "(max-width: 768px) 48px, 56px"
                    }
                  />
                </div>
                <span className="text-[13px] font-semibold text-center text-gray-500 whitespace-nowrap leading-tight">
                  {item.name}
                </span>
              </button>
            ))}
          </div>

          {showScrollRight && (
            <button
              aria-label="Scroll right"
              onClick={() => scrollNav("right")}
              className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 items-center justify-center w-8 h-8 rounded-full bg-white border border-gray-300 text-gray-600 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 backdrop-blur-sm"
            >
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>

      <AllCitiesModal
        isOpen={allCitiesModalOpen}
        onClose={() => setAllCitiesModalOpen(false)}
      />
    </div>
  );
}
