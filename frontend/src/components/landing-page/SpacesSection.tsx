"use client";

import Image from "next/image";
import Link from "next/link";
import { allCities } from "@/data/cities";
import { venuesPath } from "@/lib/routes";

const citySubtitles: Record<string, string> = {
  hyderabad: "City of Nizams",
  secunderabad: "Twin City Venues",
  warangal: "Heritage City Venues",
  karimnagar: "Celebration Hub",
  khammam: "Event City",
  nizamabad: "Northern TS Venues",
  visakhapatnam: "Coastal Wedding City",
  vijayawada: "Event Capital of AP",
  tirupati: "Temple City Celebrations",
  guntur: "Heart of AP",
  rajahmundry: "Godavari Celebrations",
  kakinada: "Port City Venues",
  bengaluru: "Garden City Venues",
  mysuru: "Heritage & Gardens",
  mangaluru: "Coastal Karnataka",
  hubballi: "North Karnataka Hub",
  chennai: "Coastal Celebration Hub",
  coimbatore: "Manchester of South",
  madurai: "Temple City TN",
  tiruchirappalli: "Rockfort Celebrations",
};

const citySpaces = allCities.map((city, index) => ({
  id: index + 1,
  city: city.name,
  slug: city.slug,
  subtitle: citySubtitles[city.slug] || `Top Venues in ${city.state}`,
  image: city.image,
}));

export default function SpacesSection() {
  return (
    <section className="relative w-full bg-white pb-5 lg:py-10 overflow-hidden">
      <div className="container-custom relative z-10 px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-8 lg:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl font-bold text-gray-900 leading-tight font-display inline-block">
            <span className="relative z-10">Top Venues Across India</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {citySpaces.map((space) => (
            <Link
              key={space.id}
              href={venuesPath(space.slug)}
              className="group relative block rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            >
              <div className="relative w-full h-44 sm:h-48 md:h-56 lg:h-64">
                <Image
                  src={space.image}
                  alt={`Wedding venue in ${space.city}`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 lg:p-6">
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white mb-0.5 sm:mb-1 md:mb-1.5 font-display">
                    {space.city}
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-white/95 font-body">
                    {space.subtitle}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
