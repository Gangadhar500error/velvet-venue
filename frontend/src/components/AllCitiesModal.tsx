"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Search } from "lucide-react";
import { allCities, getCitiesByState } from "@/data/cities";
import { venuesPath } from "@/lib/routes";

interface AllCitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AllCitiesModal({ isOpen, onClose }: AllCitiesModalProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const citiesByState = useMemo(() => getCitiesByState(), []);

  const filteredByState = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return citiesByState;

    const result: Record<string, typeof allCities> = {};
    for (const [state, cities] of Object.entries(citiesByState)) {
      const matched = cities.filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q)
      );
      if (matched.length) result[state] = matched;
    }
    return result;
  }, [citiesByState, searchQuery]);

  const handleCityClick = (slug: string) => {
    onClose();
    router.push(venuesPath(slug));
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative flex flex-col overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 font-display">
            All Locations
          </h2>
          <p className="text-xs md:text-sm text-gray-600 mt-1">
            Select a city to view available venues
          </p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city or state..."
              className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 md:p-6 space-y-5">
          {Object.keys(filteredByState).length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-6">No cities found</p>
          ) : (
            Object.entries(filteredByState).map(([state, cities]) => (
              <div key={state}>
                <h3 className="text-sm font-bold text-gray-800 mb-2.5 font-display">
                  {state}
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                  {cities.map((city) => (
                    <button
                      key={city.slug}
                      type="button"
                      onClick={() => handleCityClick(city.slug)}
                      className="flex flex-col items-center p-2 md:p-1 rounded-lg border border-gray-200 hover:border-orange-500 hover:shadow-md transition-all bg-white"
                    >
                      <div className="relative w-12 h-12 md:w-14 md:h-14 mb-2 rounded-full overflow-hidden">
                        <Image
                          src={city.image}
                          alt={city.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 48px, 56px"
                          unoptimized
                        />
                      </div>
                      <span className="text-xs font-semibold text-gray-700 hover:text-orange-600 transition-colors text-center leading-tight">
                        {city.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
