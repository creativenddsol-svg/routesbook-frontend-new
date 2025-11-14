// src/components/HolidaysSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "../api";

// ✅ Same container widths used by Home.jsx search bar & your Notices section
const DESKTOP_CONTAINER =
  "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";
const CONTAINER_MARGIN_X = "px-4 sm:px-4 lg:px-8";

/* ========= Tailwind color presets mapped to Holiday.colorKey ========= */
const PALETTES = {
  rose: {
    chipBg: "bg-rose-50",
    chipText: "text-rose-700",
    pillBg: "bg-rose-100",
    ring: "ring-rose-200",
  },
  indigo: {
    chipBg: "bg-indigo-50",
    chipText: "text-indigo-700",
    pillBg: "bg-indigo-100",
    ring: "ring-indigo-200",
  },
  emerald: {
    chipBg: "bg-emerald-50",
    chipText: "text-emerald-700",
    pillBg: "bg-emerald-100",
    ring: "ring-emerald-200",
  },
  amber: {
    chipBg: "bg-amber-50",
    chipText: "text-amber-800",
    pillBg: "bg-amber-100",
    ring: "ring-amber-200",
  },
  slate: {
    chipBg: "bg-slate-50",
    chipText: "text-slate-700",
    pillBg: "bg-slate-100",
    ring: "ring-slate-200",
  },
};

const fmtDayMon = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      })
    : "DD Mon";

/* ========= Polished Redbus-style pager (chip centered over dots) ========= */
const Dots = ({ count, activeIndex, goToIndex, className = "" }) => {
  const total = Math.max(1, count || 1);
  const safeIndex = Math.min(Math.max(0, activeIndex || 0), total - 1);

  return (
    <div className={`lg:hidden mt-4 flex justify-center ${className}`}>
      {/* Fixed-height lane prevents any clipping */}
      <div className="relative h-6 min-w-[110px] flex items-center justify-center z-10">
        {/* Dots row */}
        <div className="flex items-center gap-[6px]">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === safeIndex;
            return (
              <button
                key={i}
                onClick={() => goToIndex(i)}
                aria-label={`Go to card ${i + 1}`}
                className={`rounded-full transition-transform duration-200 ${
                  isActive
                    ? "bg-gray-700 scale-125 h-[7px] w-[7px]"
                    : "bg-gray-300 h-[6px] w-[6px]"
                }`}
              />
            );
          })}
        </div>

        {/* Chip centered ON the dots, using brand primary like Home search button */}
        <span
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                     inline-flex items-center justify-center min-w-[38px] px-2 py-[2px]
                     text-[10px] font-semibold rounded-full whitespace-nowrap
                     bg-[var(--rb-primary,#D84E55)] text-white
                     shadow-[0_2px_6px_rgba(0,0,0,0.12)] ring-1 ring-red-100/60 outline outline-2 outline-white"
          aria-live="polite"
        >
          {safeIndex + 1}/{total}
        </span>
      </div>
    </div>
  );
};

/* ========= Small skeleton card ========= */
const Skeleton = () => (
  <div className="w-[220px] h-[86px] rounded-2xl bg-gray-100 ring-1 ring-gray-200 animate-pulse flex-shrink-0" />
);

/* ========= Single Holiday small card (fonts & colors aligned with HomeMobile) ========= */
const HolidayChipCard = ({ holiday }) => {
  const pal = PALETTES[holiday.colorKey] || PALETTES.rose;
  return (
    <div
      className={`rounded-2xl px-4 py-3 ring-1 ${pal.ring} ${pal.chipBg} shadow-[0_1px_2px_rgba(15,23,42,0.06)]`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-[10px] font-semibold uppercase tracking-[0.14em] px-2 py-0.5 rounded-full shrink-0 ${pal.pillBg} ${pal.chipText}`}
        >
          {fmtDayMon(holiday.date)}
        </span>
        <span
          className={`text-sm font-semibold truncate ${pal.chipText}`}
          title={holiday.title}
        >
          {holiday.title}
        </span>
      </div>
      {holiday.ctaLabel && (
        <div className="mt-1.5 text-[11px] font-medium text-gray-700 truncate">
          {holiday.ctaLabel}
          {holiday.link ? (
            <a
              href={holiday.link}
              target="_blank"
              rel="noreferrer"
              className="ml-1 underline text-[11px] font-semibold text-[var(--rb-primary,#D84E55)]"
            >
              Learn more
            </a>
          ) : null}
        </div>
      )}
    </div>
  );
};

const HolidaysSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Mobile rail state
  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollStopTimer = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await apiClient.get("/holidays/active");
        const data = Array.isArray(res.data) ? res.data : [];
        if (live) setItems(data);
      } catch (e) {
        if (live)
          setErr(
            e?.response?.data?.message || "Failed to load holidays."
          );
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  /* --- Robust most-visible index (no guessing card width/gap) --- */
  const calcMostVisibleIndex = (el) => {
    const railRect = el.getBoundingClientRect();
    const kids = el.children || [];
    let bestIdx = 0;
    let bestRatio = -1;

    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      const visibleW = Math.max(
        0,
        Math.min(r.right, railRect.right) -
          Math.max(r.left, railRect.left)
      );
      const ratio = visibleW / Math.max(1, r.width);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIdx = i;
      }
    }
    return bestIdx;
  };

  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;
    const idx = calcMostVisibleIndex(el);
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  }, [items.length]);

  // Debounced scroll handler to catch momentum/snap end
  const handleScroll = useCallback(() => {
    updateActiveIndex();
    if (scrollStopTimer.current)
      clearTimeout(scrollStopTimer.current);
    scrollStopTimer.current = setTimeout(updateActiveIndex, 120);
  }, [updateActiveIndex]);

  // Scroll to a specific index
  const scrollToCard = useCallback(
    (index) => {
      const el = railRef.current;
      if (
        !el ||
        items.length === 0 ||
        index < 0 ||
        index >= items.length
      )
        return;

      const target = el.children?.[index];
      if (target?.scrollIntoView) {
        target.scrollIntoView({
          behavior: "smooth",
          inline: "start",
          block: "nearest",
        });
      } else {
        el.scrollTo({
          left: target?.offsetLeft || 0,
          behavior: "smooth",
        });
      }
    },
    [items.length]
  );

  // Keep index synced on resize too
  useEffect(() => {
    const onResize = () => updateActiveIndex();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateActiveIndex]);

  // Call once after items render
  useEffect(() => {
    updateActiveIndex();
  }, [items.length, updateActiveIndex]);

  /* ================== Loading ================== */
  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div
          className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}
        >
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 tracking-tight">
            Upcoming Holidays
          </h2>
        </div>

        {/* Mobile skeleton rail */}
        <div className="lg:hidden w-full overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pl-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        </div>

        {/* Desktop skeleton grid (5-up to match Notices & search width) */}
        <div className="hidden lg:block">
          <div className={`${DESKTOP_CONTAINER}`}>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-[86px] rounded-2xl bg-gray-100 ring-1 ring-gray-200 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (err || !Array.isArray(items) || items.length === 0) return null;

  /* ================== Render ================== */
  return (
    <section className="w-full py-8 sm:py-12">
      {/* Header aligned with search bar container */}
      <div
        className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}
      >
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 tracking-tight">
          Upcoming Holidays
        </h2>
        <Link
          to="/holidays"
          className="text-[13px] sm:text-sm font-semibold text-[var(--rb-primary,#D84E55)] hover:opacity-90 transition"
        >
          View All →
        </Link>
      </div>

      {/* ---------- Desktop: fixed 5-card grid ---------- */}
      <div className="hidden lg:block">
        <div className={`${DESKTOP_CONTAINER}`}>
          <div className="grid grid-cols-5 gap-4">
            {items.slice(0, 5).map((h) => (
              <div
                key={h._id}
                className="relative group rounded-2xl overflow-hidden"
              >
                <HolidayChipCard holiday={h} />
                {/* 🌟 Shimmer overlay */}
                <span className="rb-shine-wrap pointer-events-none absolute inset-0 z-10 rounded-2xl overflow-hidden">
                  <span className="rb-shine-bar" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Mobile/Tablet: horizontal rail ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        <div
          ref={railRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{
            WebkitOverflowScrolling: "touch",
            // ✅ Ensures first snapped card respects the left padding, matching Notices
            scrollPaddingLeft: "1rem",
          }}
        >
          {items.map((h, index) => (
            <div
              key={h._id}
              className={`w-[calc((100vw-2rem)/2)] flex-shrink-0 snap-start ${
                index === items.length - 1 ? "pr-4" : ""
              }`}
            >
              <div className="relative group rounded-2xl overflow-hidden">
                <HolidayChipCard holiday={h} />
                {/* 🌟 Shimmer overlay */}
                <span className="rb-shine-wrap pointer-events-none absolute inset-0 z-10 rounded-2xl overflow-hidden">
                  <span className="rb-shine-bar" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Polished pager, same look as Notices */}
        <Dots
          count={items.length}
          activeIndex={activeIndex}
          goToIndex={scrollToCard}
          className={CONTAINER_MARGIN_X}
        />
      </div>

      {/* Hide scrollbar utility + shimmer animation */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* ===== Stronger, always-visible shimmer ===== */
        .rb-shine-wrap { isolation: isolate; }

        .rb-shine-bar {
          position: absolute;
          top: -40%;
          left: -130%;
          height: 180%;
          width: 55%;
          transform: rotate(18deg);
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0.75) 50%,
            rgba(255,255,255,0) 100%
          );
          filter: blur(1px);
          opacity: .30;
          animation: rb-shine-move 2.8s linear infinite;
          z-index: 1;
        }
        .group:hover .rb-shine-bar {
          opacity: .45;
          animation-duration: 2.2s;
        }
        @keyframes rb-shine-move {
          0%   { left: -130%; }
          100% { left: 145%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-shine-bar { animation: none; opacity: .18; }
        }
      `}</style>
    </section>
  );
};

export default HolidaysSection;
