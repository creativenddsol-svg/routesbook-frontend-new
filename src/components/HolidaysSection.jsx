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
  rose:    { chipBg: "bg-rose-50",    chipText: "text-rose-700",    pillBg: "bg-rose-100",    ring: "ring-rose-200" },
  indigo:  { chipBg: "bg-indigo-50",  chipText: "text-indigo-700",  pillBg: "bg-indigo-100",  ring: "ring-indigo-200" },
  emerald: { chipBg: "bg-emerald-50", chipText: "text-emerald-700", pillBg: "bg-emerald-100", ring: "ring-emerald-200" },
  amber:   { chipBg: "bg-amber-50",   chipText: "text-amber-800",   pillBg: "bg-amber-100",   ring: "ring-amber-200" },
  slate:   { chipBg: "bg-slate-50",   chipText: "text-slate-700",   pillBg: "bg-slate-100",   ring: "ring-slate-200" },
};

const fmtDayMon = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : "DD Mon";

/* ========= Tiny navigation dots (mobile only, like Notices) ========= */
const Dots = ({ count, activeIndex, goToIndex }) => (
  <div className="flex justify-center mt-4 space-x-2 lg:hidden">
    {[...Array(count)].map((_, index) => (
      <button
        key={index}
        onClick={() => goToIndex(index)}
        className={`h-2 w-2 rounded-full transition-all ${
          index === activeIndex ? "bg-blue-600 w-4" : "bg-gray-300 hover:bg-gray-400"
        }`}
        aria-label={`Go to slide ${index + 1}`}
      />
    ))}
  </div>
);

/* ========= Small skeleton card ========= */
const Skeleton = () => (
  <div className="w-[220px] h-[86px] rounded-2xl bg-gray-100 ring-1 ring-gray-200 animate-pulse flex-shrink-0" />
);

/* ========= Single Holiday small card ========= */
const HolidayChipCard = ({ holiday }) => {
  const pal = PALETTES[holiday.colorKey] || PALETTES.rose;
  return (
    <div className={`rounded-2xl px-4 py-3 ring-1 ${pal.ring} ${pal.chipBg}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${pal.pillBg} ${pal.chipText}`}
        >
          {fmtDayMon(holiday.date)}
        </span>
        <span className={`text-sm font-semibold truncate ${pal.chipText}`} title={holiday.title}>
          {holiday.title}
        </span>
      </div>
      {holiday.ctaLabel && (
        <div className="mt-1.5 text-[12px] font-medium text-gray-700 truncate">
          {holiday.ctaLabel}
          {holiday.link ? (
            <a
              href={holiday.link}
              target="_blank"
              rel="noreferrer"
              className="ml-1 underline"
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

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await apiClient.get("/holidays/active");
        const data = Array.isArray(res.data) ? res.data : [];
        if (live) setItems(data);
      } catch (e) {
        if (live) setErr(e?.response?.data?.message || "Failed to load holidays.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Active dot update on scroll (mobile)
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;
    const cardWidth = el.firstChild?.offsetWidth || 220; // 220px + 16 gap
    const gap = 16;
    const cardScrollWidth = cardWidth + gap;
    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);

  const scrollToCard = useCallback(
    (index) => {
      const el = railRef.current;
      if (!el || items.length === 0 || index < 0 || index >= items.length) return;
      const cardWidth = el.firstChild?.offsetWidth || 220;
      const gap = 16;
      el.scrollTo({ left: index * (cardWidth + gap), behavior: "smooth" });
      setActiveIndex(index);
      setTimeout(updateActiveIndex, 350);
    },
    [items.length, updateActiveIndex]
  );

  useEffect(() => {
    updateActiveIndex();
    const el = railRef.current;
    if (el) {
      el.addEventListener("scroll", updateActiveIndex);
      return () => el.removeEventListener("scroll", updateActiveIndex);
    }
  }, [items, updateActiveIndex]);

  /* ================== Loading ================== */
  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
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
                <div key={i} className="h-[86px] rounded-2xl bg-gray-100 ring-1 ring-gray-200 animate-pulse" />
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
      <div className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
          Upcoming Holidays
        </h2>
        <Link
          to="/holidays"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          View All →
        </Link>
      </div>

      {/* ---------- Desktop: fixed 5-card grid ---------- */}
      <div className="hidden lg:block">
        <div className={`${DESKTOP_CONTAINER}`}>
          <div className="grid grid-cols-5 gap-4">
            {items.slice(0, 5).map((h) => (
              <div key={h._id} className="relative group rounded-2xl overflow-hidden">
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
          onScroll={updateActiveIndex}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{ 
            WebkitOverflowScrolling: "touch",
            /* ✅ Ensures first snapped card respects the left padding, matching Notices fix */
            scrollPaddingLeft: "1rem"
          }}
        >
          {items.map((h, index) => (
            <div
              key={h._id}
              className={`w-[220px] flex-shrink-0 snap-start ${index === items.length - 1 ? "pr-4" : ""}`}
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

        {/* Tiny Navigation Dots */}
        <div className={`${CONTAINER_MARGIN_X}`}>
          {items.length > 1 && (
            <Dots count={items.length} activeIndex={activeIndex} goToIndex={scrollToCard} />
          )}
        </div>
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
