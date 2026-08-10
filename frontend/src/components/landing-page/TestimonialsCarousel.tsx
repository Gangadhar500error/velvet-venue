"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import { homeTestimonials } from "@/data/homeTestimonials";

const GAP = 20;
const AUTO_MS = 6000;

function GoldStars() {
  return (
    <div className="flex items-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-[#C89B3C] text-[#C89B3C]"
          strokeWidth={0}
        />
      ))}
    </div>
  );
}

function useCardsPerView() {
  const [count, setCount] = useState(1.08);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 768px)").matches) {
        setCount(2.12);
      } else {
        setCount(1.08);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export default function TestimonialsCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const cardsPerView = useCardsPerView();
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const maxIndex = Math.max(
    0,
    homeTestimonials.length - Math.floor(cardsPerView)
  );
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
    <section className="w-full bg-[#FAFAFA] py-16 md:py-20 overflow-x-hidden">
      <div className="container-custom px-4 md:px-6 lg:px-8">
        <div className="mb-10 md:mb-12 text-center">
          <h2 className="text-2xl md:text-[28px] lg:text-[32px] font-bold text-[#111111] font-display">
            Loved by Thousands of Happy Customers
          </h2>
          <p className="mt-3 text-sm md:text-[15px] text-[#6B7280] max-w-2xl mx-auto leading-relaxed font-body">
            Real experiences from people who celebrated unforgettable moments
            with Velvet Venues.
          </p>
        </div>

        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          aria-roledescription="carousel"
          aria-label="Customer testimonials"
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
              {homeTestimonials.map((testimonial) => (
                <article
                  key={testimonial.id}
                  className="group flex shrink-0 flex-col rounded-[24px] border border-[#ECECEC] bg-white p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
                  style={{
                    width: slideWidth > 0 ? `${slideWidth}px` : "100%",
                  }}
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <GoldStars />
                    <Quote
                      className="h-8 w-8 shrink-0 text-[#C89B3C]/25"
                      strokeWidth={1.5}
                    />
                  </div>

                  <p className="flex-1 text-sm md:text-[15px] leading-relaxed text-[#374151] font-body">
                    &ldquo;{testimonial.review}&rdquo;
                  </p>

                  <div className="mt-6 flex items-center gap-4 border-t border-[#F3F4F6] pt-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C89B3C]/15 text-sm font-bold text-[#A77A20]">
                      {testimonial.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#111111] font-display">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-[#6B7280] font-body">
                        {testimonial.city} · {testimonial.venueType}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {dotCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-4 md:gap-5">
              <button
                type="button"
                onClick={goPrev}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[#D1D5DB] bg-white text-[#374151] transition hover:border-[#C89B3C] hover:text-[#C89B3C]"
                aria-label="Previous testimonials"
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
                    aria-label={`Go to testimonial slide ${i + 1}`}
                    aria-current={i === activeIndex}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={goNext}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#C89B3C] text-white shadow-[0_4px_14px_rgba(200,155,60,0.35)] transition hover:bg-[#B8892F]"
                aria-label="Next testimonials"
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
