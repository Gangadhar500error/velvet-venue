"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type BreakpointSlides = {
  default: number;
  md: number;
  lg: number;
};

interface PremiumCarouselProps<T> {
  items: T[];
  renderSlide: (item: T, index: number) => ReactNode;
  slidesPerView: BreakpointSlides;
  gap?: number;
  autoPlayMs?: number;
  ariaLabel: string;
  getItemKey: (item: T, index: number) => string | number;
}

function useSlidesPerView(config: BreakpointSlides) {
  const [count, setCount] = useState(config.default);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setCount(config.lg);
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setCount(config.md);
      } else {
        setCount(config.default);
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [config.default, config.md, config.lg]);

  return count;
}

export default function PremiumCarousel<T extends unknown>(
  props: PremiumCarouselProps<T>
) {
  const {
    items,
    renderSlide,
    slidesPerView,
    gap = 24,
    autoPlayMs = 5000,
    ariaLabel,
    getItemKey,
  } = props;
  const viewportRef = useRef<HTMLDivElement>(null);
  const visible = useSlidesPerView(slidesPerView);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);

  const pageCount = Math.max(1, Math.ceil(items.length / visible));
  const maxPage = pageCount - 1;
  const slideWidth =
    viewportWidth > 0
      ? (viewportWidth - gap * Math.max(visible - 1, 0)) / visible
      : 0;

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
    setActivePage((p) => Math.min(p, maxPage));
  }, [maxPage]);

  const goTo = useCallback(
    (page: number) => {
      const normalized = ((page % pageCount) + pageCount) % pageCount;
      setActivePage(normalized);
    },
    [pageCount]
  );

  const goNext = useCallback(() => {
    goTo(activePage >= maxPage ? 0 : activePage + 1);
  }, [activePage, goTo, maxPage]);

  const goPrev = useCallback(() => {
    goTo(activePage <= 0 ? maxPage : activePage - 1);
  }, [activePage, goTo, maxPage]);

  useEffect(() => {
    if (isPaused || !autoPlayMs || pageCount <= 1) return;
    const timer = window.setInterval(goNext, autoPlayMs);
    return () => window.clearInterval(timer);
  }, [autoPlayMs, goNext, isPaused, pageCount]);

  const pageOffset = activePage * visible * (slideWidth + gap);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setIsPaused(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  };

  const onTouchEnd = () => {
    if (touchDeltaX.current > 50) goPrev();
    else if (touchDeltaX.current < -50) goNext();
    window.setTimeout(() => setIsPaused(false), 800);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
    >
      <div ref={viewportRef} className="overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-out will-change-transform"
          style={{
            gap: `${gap}px`,
            transform: `translateX(-${pageOffset}px)`,
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {items.map((item, index) => (
            <div
              key={getItemKey(item, index)}
              className="shrink-0"
              style={{ width: slideWidth > 0 ? `${slideWidth}px` : "100%" }}
              aria-roledescription="slide"
            >
              {renderSlide(item, index)}
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#ECECEC] bg-white text-[#1F2937] shadow-md transition hover:border-[#C89B3C] hover:text-[#C89B3C] md:h-11 md:w-11"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[#ECECEC] bg-white text-[#1F2937] shadow-md transition hover:border-[#C89B3C] hover:text-[#C89B3C] md:h-11 md:w-11"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-8 flex items-center justify-center gap-2">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  i === activePage
                    ? "w-8 bg-[#C89B3C]"
                    : "w-2.5 bg-[#E5E7EB] hover:bg-[#D1D5DB]"
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activePage}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
