"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  View,
  Share2,
  Heart,
  BadgeCheck,
  Sparkles,
  Images,
} from "lucide-react";

interface VenueHeroGalleryProps {
  images: string[];
  name: string;
  badge?: string;
  verified?: boolean;
  featured?: boolean;
  videoUrl?: string;
  onShare?: () => void;
}

export default function VenueHeroGallery({
  images,
  name,
  badge,
  verified,
  featured,
  videoUrl,
  onShare,
}: VenueHeroGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [wishlisted, setWishlisted] = useState(false);
  const photos = images.length ? images : [];
  const main = photos[0];
  const thumbs = photos.slice(1, 5);
  while (thumbs.length < 4 && photos.length > 0) {
    thumbs.push(photos[thumbs.length % photos.length]);
  }

  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft")
        setIndex((i) => (i - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, photos.length]);

  const openAt = (i: number) => {
    setIndex(i);
    setLightboxOpen(true);
  };

  if (!main) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-[20px] bg-[#F3F4F6] text-[#6B7280]">
        No images available
      </div>
    );
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-[20px]">
        <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr] sm:gap-2.5">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="group relative h-[240px] w-full overflow-hidden rounded-[18px] sm:h-[420px]"
          >
            <Image
              src={main}
              alt={name}
              fill
              priority
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 55vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </button>

          <div className="hidden grid-cols-2 gap-2.5 sm:grid">
            {thumbs.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                onClick={() => openAt(Math.min(i + 1, photos.length - 1))}
                className="group relative h-[205px] overflow-hidden rounded-[16px]"
              >
                <Image
                  src={src}
                  alt={`${name} ${i + 2}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="25vw"
                />
                {i === 3 && photos.length > 5 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-semibold text-white backdrop-blur-[1px]">
                    +{photos.length - 5} more
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap gap-2 sm:left-4 sm:top-4">
          {verified && (
            <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-semibold text-[#1F2937] shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5 text-[#C89B3C]" />
              Verified
            </span>
          )}
          {featured && (
            <span className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-[#C89B3C] px-2.5 py-1 text-[12px] font-semibold text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Featured
            </span>
          )}
          {badge && badge !== "Featured" && badge !== "Verified" && (
            <span className="pointer-events-auto rounded-full bg-[#1F2937]/90 px-2.5 py-1 text-[12px] font-semibold text-white">
              Luxury
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-2 sm:bottom-4 sm:left-4">
          <button
            type="button"
            onClick={() => openAt(0)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-[#1F2937] shadow-sm transition-all duration-250 hover:-translate-y-0.5"
          >
            <Images className="h-3.5 w-3.5 text-[#C89B3C]" />
            {photos.length} Photos
          </button>
          {videoUrl && (
            <a
              href={videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-[#1F2937] shadow-sm transition-all duration-250 hover:-translate-y-0.5"
            >
              <Play className="h-3.5 w-3.5 text-[#C89B3C]" />
              Video
            </a>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[13px] font-semibold text-[#1F2937] shadow-sm">
            <View className="h-3.5 w-3.5 text-[#C89B3C]" />
            Virtual Tour
          </span>
        </div>

        <div className="absolute bottom-3 right-3 z-10 flex gap-2 sm:bottom-4 sm:right-4">
          <button
            type="button"
            onClick={onShare}
            className="rounded-full bg-white/95 p-2.5 shadow-sm transition-all duration-250 hover:-translate-y-0.5"
            aria-label="Share venue"
          >
            <Share2 className="h-4 w-4 text-[#1F2937]" />
          </button>
          <button
            type="button"
            onClick={() => setWishlisted((w) => !w)}
            className="rounded-full bg-white/95 p-2.5 shadow-sm transition-all duration-250 hover:-translate-y-0.5"
            aria-label="Save to wishlist"
          >
            <Heart
              className={`h-4 w-4 ${wishlisted ? "fill-[#EF4444] text-[#EF4444]" : "text-[#1F2937]"}`}
            />
          </button>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4 animate-[filterChipIn_0.22s_ease-out_both]"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close gallery"
            onClick={() => setLightboxOpen(false)}
          />
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + photos.length) % photos.length);
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % photos.length);
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative z-[1] h-[70vh] w-full max-w-5xl">
            <Image
              src={photos[index]}
              alt={`${name} ${index + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
          <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {index + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
