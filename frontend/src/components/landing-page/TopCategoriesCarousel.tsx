"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { homeCategories } from "@/data/homeCategories";

const GAP = 20;
const AUTO_MS = 5000;

function useCardsPerView() {
  const [count, setCount] = useState(1.12);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCount(3.35);
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setCount(2.15);
      } else {
        setCount(1.12);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export default function TopCategoriesCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardsPerView = useCardsPerView();
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const maxIndex = Math.max(0, homeCategories.length - Math.floor(cardsPerView));
  const slideWidth =
    viewportWidth > 0
      ? (viewportWidth - GAP * (Math.ceil(cardsPerView) - 1)) / cardsPerView
      : 0;

  const dotCount = maxIndex + 1;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setViewportWidth(el.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveIndex((i) => Math.min(i, maxIndex));
  }, [maxIndex]);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, maxIndex)));
    },
    [maxIndex]
  );

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i >= maxIndex ? 0 : i + 1));
  }, [maxIndex]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i <= 0 ? maxIndex : i - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(goNext, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused]);

  const offset = activeIndex * (slideWidth + GAP);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (touchDeltaX.current > 40) goPrev();
    else if (touchDeltaX.current < -40) goNext();
    window.setTimeout(() => setIsPaused(false), 600);
  };

  return (
    <section className="w-full bg-white py-5 md:py-12 overflow-x-hidden">
      <div className="container-custom px-4 md:px-6 lg:px-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-2xl md:text-[28px] lg:text-[32px] font-bold uppercase tracking-wide text-[#111111] font-display">
            Top Categories
          </h2>
          <p className="mt-3 text-sm md:text-[15px] text-[#6B7280] max-w-3xl leading-relaxed font-body">
            Explore trending spaces preferred by families, creators, and planners
            alike.
          </p>
        </div>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-roledescription="carousel"
          aria-label="Top venue categories"
        >
          <div ref={viewportRef} className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out will-change-transform"
              style={{
                gap: `${GAP}px`,
                transform: `translateX(-${offset}px)`,
              }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {homeCategories.map((category) => (
                <Link
                  key={category.id}
                  href={category.href}
                  className="group shrink-0 block"
                  style={{
                    width: slideWidth > 0 ? `${slideWidth}px` : "100%",
                  }}
                >
                  <div className="relative h-48 sm:h-52 md:h-56 lg:h-[320px] w-full overflow-hidden rounded-[24px]">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 28vw"
                    />
                  </div>
                  <div className="mt-5 px-1 text-center">
                    <h3 className="text-base md:text-lg font-bold uppercase tracking-wide text-[#111111] font-display">
                      {category.name}
                    </h3>
                    <p className="mt-2 text-xs md:text-sm leading-relaxed text-[#6B7280] font-body">
                      {category.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {dotCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4 md:gap-5">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#D1D5DB] bg-white text-[#374151] transition hover:border-[#C89B3C] hover:text-[#C89B3C]"
                aria-label="Previous categories"
              >
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "h-2.5 w-8 bg-[#C89B3C]"
                        : "h-2.5 w-2.5 border border-[#D1D5DB] bg-transparent hover:border-[#C89B3C]"
                    }`}
                    aria-label={`Go to category slide ${i + 1}`}
                    aria-current={i === activeIndex}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C89B3C] text-white shadow-[0_4px_14px_rgba(200,155,60,0.35)] transition hover:bg-[#B8892F]"
                aria-label="Next categories"
              >
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
