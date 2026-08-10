"use client";

import { useMemo, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  MapPin,
  Share2,
  Heart,
  BadgeCheck,
  Users,
  Building2,
  Car,
  UtensilsCrossed,
  DoorClosed,
} from "lucide-react";
import { workspaces, type Workspace } from "../data/workspaces";
import { venuesPath } from "@/lib/routes";
import { resolvePublicVenue, formatINR } from "./components/resolvePublicVenue";
import VenueHeroGallery from "./components/VenueHeroGallery";
import VenueBookingCard from "./components/VenueBookingCard";
import VenueContentSections from "./components/VenueContentSections";
import VenueFloatingActions from "./components/VenueFloatingActions";

const RECENT_KEY = "vv_recently_viewed_venues";

function readRecentlyViewed(currentId: string): Workspace[] {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids
      .filter((id) => id !== currentId)
      .map((id) => workspaces.find((w) => w.id === id))
      .filter((w): w is Workspace => Boolean(w))
      .slice(0, 8);
  } catch {
    return [];
  }
}

function trackRecentlyViewed(id: string) {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const prev: string[] = raw ? JSON.parse(raw) : [];
    const next = [id, ...prev.filter((x) => x !== id)].slice(0, 12);
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const city = (params.city as string) || "";
  const workspaceId = (params.id as string) || "";

  const formattedCity = city
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const workspace = useMemo(
    () => workspaces.find((ws) => ws.id === workspaceId),
    [workspaceId]
  );

  const venue = useMemo(
    () => (workspace ? resolvePublicVenue(workspace) : null),
    [workspace]
  );

  const related = useMemo(() => {
    if (!workspace) return [];
    return workspaces
      .filter(
        (ws) =>
          ws.id !== workspace.id &&
          ws.city === workspace.city &&
          (ws.type === workspace.type || ws.area === workspace.area)
      )
      .slice(0, 8);
  }, [workspace]);

  const [recentlyViewed, setRecentlyViewed] = useState<Workspace[]>([]);

  useEffect(() => {
    if (!workspace?.id) return;
    setRecentlyViewed(readRecentlyViewed(workspace.id));
    trackRecentlyViewed(workspace.id);
  }, [workspace?.id]);

  const handleShare = useCallback(async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({
          title: workspace?.name,
          text: `Check out ${workspace?.name} on Velvet Venues`,
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert("Link copied to clipboard");
      }
    } catch {
      /* user cancelled */
    }
  }, [workspace?.name]);

  const scrollToBooking = useCallback(() => {
    document.getElementById("booking-card")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  if (!workspace || !venue) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="text-center">
          <h1 className="mb-4 font-display text-2xl font-bold text-[#1F2937]">
            Venue Not Found
          </h1>
          <p className="mb-6 text-[#6B7280]">
            The venue you&apos;re looking for doesn&apos;t exist.
          </p>
          <button
            type="button"
            onClick={() => router.push(venuesPath(city))}
            className="rounded-xl bg-[#C89B3C] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#A77A20]"
          >
            Back to {formattedCity} venues
          </button>
        </div>
      </div>
    );
  }

  const images = venue.galleryImages?.length
    ? venue.galleryImages
    : [venue.coverImage].filter(Boolean);

  const quickInfo = [
    { icon: Building2, label: workspace.type },
    { icon: Users, label: `${venue.maxGuests} Guests` },
    {
      icon: Car,
      label: venue.amenities.some((a) => /park/i.test(a))
        ? "Parking"
        : "Parking on request",
    },
    {
      icon: UtensilsCrossed,
      label: venue.amenities.some((a) => /cater|food/i.test(a))
        ? "Food"
        : "Food on request",
    },
    {
      icon: DoorClosed,
      label: `${venue.bridalRoomCount || 2} Rooms`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-24 lg:pb-12">
      <div className="border-b border-[#ECECEC] bg-white">
        <div className="container-custom px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-[13px] text-[#6B7280]">
            <button
              type="button"
              onClick={() => router.push(venuesPath(city))}
              className="inline-flex items-center gap-1.5 font-medium text-[#1F2937] transition-colors hover:text-[#C89B3C]"
            >
              <ArrowLeft className="h-4 w-4" />
              {formattedCity}
            </button>
            <span>/</span>
            <span>{workspace.area}</span>
            <span>/</span>
            <span className="line-clamp-1 font-medium text-[#1F2937]">
              {workspace.name}
            </span>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/*
          Mobile: hero → header → booking → sections
          Desktop: left 70% (hero, header, sections) | right 30% sticky booking
        */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(300px,3fr)] lg:gap-8">
          <div className="min-w-0 space-y-5 lg:col-start-1 lg:row-start-1">
            <VenueHeroGallery
              images={images}
              name={workspace.name}
              badge={workspace.badge}
              verified={workspace.verified}
              featured={workspace.badge === "Featured" || venue.featured}
              videoUrl={venue.videoUrl}
              onShare={handleShare}
            />

            <section className="rounded-[18px] border border-[#ECECEC] bg-white p-5 shadow-[0_6px_24px_rgba(0,0,0,0.05)] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {workspace.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FBF6EA] px-2.5 py-1 text-[11px] font-semibold text-[#1F2937]">
                        <BadgeCheck className="h-3.5 w-3.5 text-[#C89B3C]" />
                        Verified
                      </span>
                    )}
                    {workspace.badge && (
                      <span className="rounded-full bg-[#1F2937] px-2.5 py-1 text-[11px] font-semibold text-white">
                        {workspace.badge}
                      </span>
                    )}
                  </div>
                  <h1 className="font-display text-2xl font-bold text-[#1F2937] sm:text-3xl">
                    {workspace.name}
                  </h1>
                  <p className="mt-2 flex items-center gap-1.5 text-[14px] text-[#6B7280]">
                    <MapPin className="h-4 w-4 text-[#C89B3C]" />
                    {workspace.area}, {formattedCity}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px]">
                    <span className="inline-flex items-center gap-1 font-semibold text-[#1F2937]">
                      <Star className="h-4 w-4 fill-[#C89B3C] text-[#C89B3C]" />
                      {workspace.rating}
                    </span>
                    <span className="text-[#6B7280]">
                      {workspace.reviewCount} reviews
                    </span>
                    <span className="font-semibold text-[#C89B3C]">
                      Starts from {formatINR(workspace.price)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="rounded-full border border-[#ECECEC] p-2.5 transition-all duration-250 hover:border-[#C89B3C] hover:bg-[#FBF6EA]"
                    aria-label="Share"
                  >
                    <Share2 className="h-4 w-4 text-[#1F2937]" />
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-[#ECECEC] p-2.5 transition-all duration-250 hover:border-[#C89B3C] hover:bg-[#FBF6EA]"
                    aria-label="Wishlist"
                  >
                    <Heart className="h-4 w-4 text-[#1F2937]" />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {quickInfo.map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#ECECEC] bg-[#FAFAFA] px-3 py-1.5 text-[12px] font-medium text-[#1F2937]"
                    >
                      <Icon className="h-3.5 w-3.5 text-[#C89B3C]" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Booking: after header on mobile; sticky right column on desktop spanning full left height */}
          <aside
            id="booking-card"
            className="min-w-0 scroll-mt-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:sticky lg:top-24 lg:self-start"
          >
            <VenueBookingCard
              venue={venue}
              onBook={scrollToBooking}
              onScheduleVisit={scrollToBooking}
            />
          </aside>

          <div className="min-w-0 lg:col-start-1 lg:row-start-2">
            <VenueContentSections
              venue={venue}
              workspace={workspace}
              related={related}
              recentlyViewed={recentlyViewed}
              citySlug={city}
              formattedCity={formattedCity}
            />
          </div>
        </div>
      </div>

      <VenueFloatingActions
        phone={venue.contactPhone || venue.ownerPhone}
        onBook={scrollToBooking}
        onShare={handleShare}
      />
    </div>
  );
}
