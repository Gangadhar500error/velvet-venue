"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Users,
  Building2,
  DoorClosed,
  Car,
  UtensilsCrossed,
  Sparkles,
  Home,
  Trees,
  Zap,
  Clock,
  Star,
  MapPin,
  BadgeCheck,
  Shield,
  Heart,
  Navigation,
  PartyPopper,
  Music,
  Camera,
  Wifi,
  Snowflake,
  Accessibility,
  Wine,
  PawPrint,
  IndianRupee,
} from "lucide-react";
import type { Venue } from "@/app/admin/venues/types";
import type { Workspace } from "../../data/workspaces";
import { venuesPath, citySlugFromName } from "@/lib/routes";
import { formatINR } from "./resolvePublicVenue";

const EVENT_ICONS: Record<string, typeof PartyPopper> = {
  Wedding: PartyPopper,
  Reception: Sparkles,
  Engagement: Heart,
  Birthday: PartyPopper,
  Corporate: Building2,
  Conference: Users,
  Haldi: Sparkles,
  Mehendi: Sparkles,
  "Baby Shower": Heart,
  Anniversary: Heart,
  Cocktail: Wine,
};

function amenityIcon(label: string) {
  const l = label.toLowerCase();
  if (l.includes("park")) return Car;
  if (l.includes("ac") || l.includes("air")) return Snowflake;
  if (l.includes("wifi")) return Wifi;
  if (l.includes("dj") || l.includes("music")) return Music;
  if (l.includes("photo")) return Camera;
  if (l.includes("food") || l.includes("cater") || l.includes("dining")) return UtensilsCrossed;
  if (l.includes("decor") || l.includes("flower")) return Sparkles;
  if (l.includes("room") || l.includes("bridal")) return DoorClosed;
  if (l.includes("lawn") || l.includes("garden") || l.includes("outdoor")) return Trees;
  if (l.includes("power") || l.includes("generator")) return Zap;
  if (l.includes("wheel") || l.includes("access")) return Accessibility;
  if (l.includes("pet")) return PawPrint;
  return Sparkles;
}

function groupAmenities(amenities: string[]) {
  const groups: Record<string, string[]> = {
    Indoor: [],
    Outdoor: [],
    Accommodation: [],
    Food: [],
    Entertainment: [],
    Parking: [],
    Accessibility: [],
    Safety: [],
  };
  for (const a of amenities) {
    const l = a.toLowerCase();
    if (l.includes("park") || l.includes("valet")) groups.Parking.push(a);
    else if (l.includes("wheel") || l.includes("lift") || l.includes("access"))
      groups.Accessibility.push(a);
    else if (l.includes("power") || l.includes("generator") || l.includes("fire"))
      groups.Safety.push(a);
    else if (l.includes("dj") || l.includes("music") || l.includes("stage") || l.includes("photo"))
      groups.Entertainment.push(a);
    else if (l.includes("food") || l.includes("cater") || l.includes("dining") || l.includes("kitchen"))
      groups.Food.push(a);
    else if (l.includes("room") || l.includes("bridal")) groups.Accommodation.push(a);
    else if (l.includes("lawn") || l.includes("garden") || l.includes("outdoor") || l.includes("pool"))
      groups.Outdoor.push(a);
    else groups.Indoor.push(a);
  }
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

interface Props {
  venue: Venue;
  workspace: Workspace;
  related: Workspace[];
  recentlyViewed?: Workspace[];
  citySlug: string;
  formattedCity: string;
}

function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[18px] border border-[#ECECEC] bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.05)] sm:p-6 ${className}`}
    >
      <div className="mb-4">
        <h2 className="font-display text-xl font-bold text-[#1F2937]">{title}</h2>
        {description && (
          <p className="mt-1 text-[13px] text-[#6B7280]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function VenueCarousel({
  items,
  citySlug,
}: {
  items: Workspace[];
  citySlug: string;
}) {
  if (!items.length) return null;
  return (
    <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
      {items.map((ws) => (
        <Link
          key={ws.id}
          href={venuesPath(citySlugFromName(ws.city) || citySlug, ws.id)}
          className="group w-[240px] shrink-0 overflow-hidden rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] transition-all duration-250 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)]"
        >
          <div className="relative h-[140px]">
            <Image
              src={ws.image}
              alt={ws.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="240px"
            />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5"
              aria-label="Wishlist"
              onClick={(e) => e.preventDefault()}
            >
              <Heart className="h-3.5 w-3.5 text-[#1F2937]" />
            </button>
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-[13px] font-semibold text-[#1F2937]">
              {ws.name}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[12px] text-[#6B7280]">
              <Star className="h-3 w-3 fill-[#C89B3C] text-[#C89B3C]" />
              {ws.rating} Â· {ws.capacity || "â€”"} guests
            </p>
            <p className="mt-1 text-[13px] font-bold text-[#C89B3C]">
              {formatINR(ws.price)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function VenueContentSections({
  venue,
  workspace,
  related,
  recentlyViewed = [],
  citySlug,
  formattedCity,
}: Props) {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [galleryFilter, setGalleryFilter] = useState("All");
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const images = venue.galleryImages?.length
    ? venue.galleryImages
    : [venue.coverImage].filter(Boolean);

  const amenityGroups = useMemo(
    () => groupAmenities(venue.amenities || []),
    [venue.amenities]
  );

  const quickCards = [
    { label: "Capacity", value: `${venue.maxGuests} Guests`, icon: Users },
    { label: "Venue Type", value: workspace.type, icon: Building2 },
    { label: "Rooms", value: `${venue.bridalRoomCount || 2} Rooms`, icon: DoorClosed },
    {
      label: "Parking",
      value: venue.amenities.some((a) => /park/i.test(a)) ? "Available" : "On request",
      icon: Car,
    },
    {
      label: "Food",
      value: venue.amenities.some((a) => /cater|food|dining/i.test(a))
        ? "In-house"
        : "On request",
      icon: UtensilsCrossed,
    },
    {
      label: "Decoration",
      value: venue.amenities.some((a) => /decor/i.test(a)) ? "Available" : "On request",
      icon: Sparkles,
    },
    { label: "Indoor", value: venue.venueType || "Yes", icon: Home },
    {
      label: "Outdoor",
      value: venue.outdoorArea || venue.amenities.some((a) => /lawn|outdoor|garden/i.test(a))
        ? "Available"
        : "â€”",
      icon: Trees,
    },
    {
      label: "Power Backup",
      value: venue.powerBackup ? "Yes" : "â€”",
      icon: Zap,
    },
    {
      label: "Timings",
      value: venue.operatingHours || "9 AM â€“ 11 PM",
      icon: Clock,
    },
  ];

  const pricingCards = [
    {
      title: "Full Day",
      price: venue.pricingSlots.find((s) => s.key === "full_day")?.price || venue.startingPrice,
      note: "Venue only Â· full day access",
    },
    {
      title: "Weekend",
      price: venue.weekendPrice,
      note: "Weekend premium rate",
    },
    {
      title: "Peak Season",
      price: venue.peakPrice,
      note: "Peak / festival pricing",
    },
    {
      title: "Wedding Package",
      price: Math.round(venue.startingPrice * 1.1),
      note: "Decoration + basic setup",
    },
  ];

  const daysInMonth = new Date(
    calMonth.getFullYear(),
    calMonth.getMonth() + 1,
    0
  ).getDate();
  const startWeekday = new Date(
    calMonth.getFullYear(),
    calMonth.getMonth(),
    1
  ).getDay();

  const dayStatus = (day: number): "available" | "limited" | "booked" => {
    const key = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const hit = venue.availability?.find((a) => a.date === key);
    if (!hit) {
      const mod = (day + calMonth.getMonth()) % 7;
      if (mod === 0) return "booked";
      if (mod === 3 || mod === 5) return "limited";
      return "available";
    }
    if (hit.status === "booked" || hit.status === "blocked") return "booked";
    if (hit.status === "holiday" || hit.status === "maintenance") return "limited";
    return "available";
  };

  const nearby = [
    { label: "Airport", distance: "28 km" },
    { label: "Metro", distance: "2.5 km" },
    { label: "Railway", distance: "8 km" },
    { label: "Hotels", distance: "1.2 km" },
    { label: "Hospitals", distance: "3 km" },
    { label: "Parking", distance: "On-site" },
  ];

  const galleryCats = ["All", "Venue", "Decoration", "Rooms", "Food", "Indoor", "Outdoor"];

  return (
    <div className="space-y-5">
      <SectionCard
        title="Quick Overview"
        description="Key details at a glance for planning your event."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className="rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-3.5 transition-all duration-250 hover:-translate-y-0.5 hover:border-[#E9D39B]"
              >
                <Icon className="mb-2 h-5 w-5 text-[#C89B3C]" />
                <p className="text-[12px] text-[#6B7280]">{card.label}</p>
                <p className="mt-0.5 text-[14px] font-semibold text-[#1F2937]">
                  {card.value}
                </p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="About Venue" description="Get to know the space and atmosphere.">
        <p
          className={`text-[14px] leading-relaxed text-[#6B7280] ${
            aboutOpen ? "" : "line-clamp-3"
          }`}
        >
          {venue.detailedDescription || venue.shortDescription}
        </p>
        <button
          type="button"
          onClick={() => setAboutOpen((o) => !o)}
          className="mt-2 text-[13px] font-semibold text-[#C89B3C] hover:text-[#A77A20]"
        >
          {aboutOpen ? "Read Less" : "Read More"}
        </button>
      </SectionCard>

      <SectionCard title="Event Types" description="Celebrations this venue is perfect for.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(venue.eventCategories?.length
            ? venue.eventCategories
            : ["Wedding", "Reception", "Birthday", "Corporate"]
          ).map((ev) => {
            const Icon = EVENT_ICONS[ev] || PartyPopper;
            return (
              <div
                key={ev}
                className="flex items-center gap-2.5 rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] px-3 py-3 transition-all duration-250 hover:border-[#C89B3C] hover:bg-[#FBF6EA]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EA]">
                  <Icon className="h-4 w-4 text-[#C89B3C]" />
                </span>
                <span className="text-[13px] font-semibold text-[#1F2937]">{ev}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard
        title="Amenities & Features"
        description="Everything included to make your event seamless."
      >
        <div className="space-y-5">
          {amenityGroups.map(([group, items]) => (
            <div key={group}>
              <p className="mb-2 text-[13px] font-semibold text-[#6B7280]">{group}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => {
                  const Icon = amenityIcon(item);
                  return (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#ECECEC] bg-[#FAFAFA] px-3 py-1.5 text-[13px] font-medium text-[#1F2937]"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#C89B3C]" />
                      {item}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {venue.highlights?.length > 0 && (
        <SectionCard title="Venue Highlights" description="Standout features guests love.">
          <ul className="grid gap-2 sm:grid-cols-2">
            {venue.highlights.map((h) => (
              <li
                key={h}
                className="flex items-start gap-2 rounded-[14px] border border-[#ECECEC] bg-[#FAFAFA] px-3 py-2.5 text-[13px] text-[#1F2937]"
              >
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C89B3C]" />
                {h}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard
        title="Pricing Packages"
        description="Transparent starting packages. Final quote in booking summary."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {pricingCards.map((card) => (
            <div
              key={card.title}
              className="rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-4 transition-all duration-250 hover:-translate-y-0.5 hover:border-[#E9D39B]"
            >
              <p className="text-[13px] font-medium text-[#6B7280]">{card.title}</p>
              <p className="mt-1 font-display text-2xl font-bold text-[#1F2937]">
                {formatINR(card.price)}
              </p>
              <p className="mt-1 text-[12px] text-[#6B7280]">{card.note}</p>
              <div className="mt-3 space-y-1 text-[12px] text-[#6B7280]">
                <p>
                  Taxes: {venue.gstPercent}% {venue.gstMode}
                </p>
                <p>Advance: {venue.advancePaymentPercent}%</p>
                <p>Security deposit: {formatINR(venue.securityDeposit)}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Availability Calendar"
        description="Green available · Yellow limited · Red booked"
      >
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#C89B3C] hover:bg-[#FBF6EA]"
            onClick={() =>
              setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
            }
          >
            Prev
          </button>
          <p className="text-[14px] font-semibold text-[#1F2937]">
            {calMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })}
          </p>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-[#C89B3C] hover:bg-[#FBF6EA]"
            onClick={() =>
              setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
            }
          >
            Next
          </button>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#6B7280]">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startWeekday }).map((_, i) => (
            <span key={`e-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const status = dayStatus(day);
            const color =
              status === "available"
                ? "bg-[#DCFCE7] text-[#166534]"
                : status === "limited"
                  ? "bg-[#FEF9C3] text-[#854D0E]"
                  : "bg-[#FEE2E2] text-[#991B1B]";
            return (
              <button
                key={day}
                type="button"
                className={`aspect-square rounded-lg text-[12px] font-semibold transition-all duration-250 hover:ring-2 hover:ring-[#C89B3C] ${color}`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Gallery" description="Explore every corner of the venue.">
        <div className="mb-3 flex gap-1.5 overflow-x-auto scrollbar-hide">
          {galleryCats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setGalleryFilter(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-250 ${
                galleryFilter === c
                  ? "bg-[#C89B3C] text-white"
                  : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#FBF6EA]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
          {images.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="group relative aspect-[4/3] overflow-hidden rounded-[14px]"
            >
              <Image
                src={src}
                alt={`${venue.name} gallery ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 30vw"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Nearby Locations & Map" description="Reach the venue with ease.">
        <div className="-mx-1 overflow-hidden rounded-[14px] border border-[#ECECEC]">
          <div className="relative h-[260px] bg-[#F3F4F6]">
            <iframe
              title="Venue map"
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                `${venue.addressLine1}, ${workspace.area}, ${formattedCity}`
              )}&z=14&output=embed`}
            />
          </div>
        </div>
        <div className="mt-4">
          <p className="flex items-start gap-2 text-[14px] text-[#1F2937]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C89B3C]" />
            {[venue.addressLine1, venue.addressLine2, workspace.area, formattedCity]
              .filter(Boolean)
              .join(", ")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {nearby.map((n) => (
              <span
                key={n.label}
                className="rounded-full border border-[#ECECEC] bg-[#FAFAFA] px-3 py-1 text-[12px] font-medium text-[#6B7280]"
              >
                {n.label}: {n.distance}
              </span>
            ))}
          </div>
          <a
            href={venue.mapsLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C89B3C] px-4 py-2.5 text-[13px] font-semibold text-white transition-all duration-250 hover:bg-[#A77A20]"
          >
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        </div>
      </SectionCard>

      <SectionCard title="Reviews & Ratings" description="What guests say about this venue.">
        <div className="mb-5 grid gap-4 rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-4 sm:grid-cols-[160px_1fr]">
          <div className="text-center sm:border-r sm:border-[#ECECEC] sm:pr-4">
            <p className="font-display text-4xl font-bold text-[#1F2937]">{venue.rating}</p>
            <div className="mt-1 flex justify-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(venue.rating)
                      ? "fill-[#C89B3C] text-[#C89B3C]"
                      : "text-[#E5E7EB]"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1 text-[12px] text-[#6B7280]">{venue.totalReviews} reviews</p>
          </div>
          <div className="space-y-2">
            {(venue.ratingDistribution || []).map((row) => {
              const max = Math.max(
                1,
                ...(venue.ratingDistribution || []).map((r) => r.count)
              );
              return (
                <div key={row.stars} className="flex items-center gap-2 text-[12px]">
                  <span className="w-8 text-[#6B7280]">{row.stars}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#C89B3C]"
                      style={{ width: `${(row.count / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[#6B7280]">{row.count}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          {(venue.reviews || []).slice(0, 4).map((review) => (
            <article
              key={review.id}
              className="rounded-[16px] border border-[#ECECEC] bg-[#FAFAFA] p-4"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FBF6EA] text-[12px] font-bold text-[#C89B3C]">
                    {review.avatarInitials ||
                      review.customerName
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-[#1F2937]">
                      {review.customerName}
                    </p>
                    <p className="text-[11px] text-[#6B7280]">
                      {review.eventType || "Event"} · {review.date}
                    </p>
                  </div>
                </div>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        i < review.rating
                          ? "fill-[#C89B3C] text-[#C89B3C]"
                          : "text-[#E5E7EB]"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-[#6B7280]">{review.comment}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      {related.length > 0 && (
        <SectionCard title="Similar Venues" description="More options in the same city.">
          <VenueCarousel items={related} citySlug={citySlug} />
        </SectionCard>
      )}

      {recentlyViewed.length > 0 && (
        <SectionCard
          title="Recently Viewed Venues"
          description="Pick up where you left off."
        >
          <VenueCarousel items={recentlyViewed} citySlug={citySlug} />
        </SectionCard>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { icon: BadgeCheck, label: "Verified Venue" },
          { icon: Shield, label: "Secure Booking" },
          { icon: Zap, label: "Instant Confirmation" },
          { icon: IndianRupee, label: "Best Price" },
          { icon: Sparkles, label: "Premium Quality" },
          { icon: Users, label: "Trusted by Thousands" },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <div
              key={t.label}
              className="flex flex-col items-center rounded-[16px] border border-[#ECECEC] bg-white p-4 text-center shadow-[0_4px_16px_rgba(0,0,0,0.04)]"
            >
              <Icon className="mb-2 h-5 w-5 text-[#C89B3C]" />
              <p className="text-[12px] font-semibold text-[#1F2937]">{t.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
