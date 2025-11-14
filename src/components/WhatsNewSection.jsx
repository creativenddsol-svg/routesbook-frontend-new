// src/components/WhatsNewSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import WhatsNewCard from "./WhatsNewCard";
import apiClient, { toImgURL } from "../api";

/* Match the search bar / notices / holidays container exactly */
const DESKTOP_CONTAINER =
  "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";
const CONTAINER_MARGIN_X = "px-4 sm:px-4 lg:px-8";

/* ─────────────────────────────────────────────
   Centered Redbus-style pager (polished)
   - Chip sits over the middle of the dots row
   - Active dot darker and slightly larger
   ───────────────────────────────────────────── */
const Dots = ({ count, activeIndex, goToIndex, className = "" }) => {
  const total = Math.max(1, count || 1);
  const safeIndex = Math.min(Math.max(0, activeIndex || 0), total - 1);

  return (
    <div className={`lg:hidden mt-4 flex justify-center ${className}`}>
      {/* Fixed-height lane to avoid clipping */}
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
                className={`rounded-full transition-transform duration-200
                            ${isActive ? "bg-gray-700 scale-125" : "bg-gray-300"}
                            ${isActive ? "h-[7px] w-[7px]" : "h-[6px] w-[6px]"}`}
              />
            );
          })}
        </div>

        {/* Count chip centered ON the dots */}
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

/** Simple loading card */
const Skeleton = () => (
  <div className="w-[300px] h-40 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
);

const WhatsNewSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollStopTimer = useRef(null);

  // Fetch active items
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/whats-new/active");
        if (!alive) return;
        const normalized = Array.isArray(data)
          ? data.map((it) => ({
              ...it,
              imageUrl: toImgURL(it?.imageUrl || it?.image || it?.cover || ""),
            }))
          : [];
        setItems(normalized);
      } catch (e) {
        if (!alive) return;
        setErr(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to load What's new."
        );
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
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

  // Debounced scroll end (so momentum/snap ends update the chip cleanly)
  const handleScroll = useCallback(() => {
    updateActiveIndex();
    if (scrollStopTimer.current)
      clearTimeout(scrollStopTimer.current);
    scrollStopTimer.current = setTimeout(updateActiveIndex, 120);
  }, [updateActiveIndex]);

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

  // Scroll to a specific index (for dot click)
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

  /* ---------------- Loading ---------------- */
  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div
          className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}
        >
          <h2 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 tracking-tight">
            What’s new
          </h2>
        </div>

        {/* Mobile skeleton rail */}
        <div className="lg:hidden">
          <div className="flex gap-4 overflow-x-auto pl-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        </div>

        {/* Desktop skeleton grid (5 columns) */}
        <div className="hidden lg:block">
          <div className={`${DESKTOP_CONTAINER}`}>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-40 bg-gray-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full py-8 sm:py-12">
      {/* Header */}
      <div
        className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}
      >
        <h2 className="text-[18px] sm:text-[20px] font-semibold text-gray-900 tracking-tight">
          What’s new
        </h2>

        {/* Chip-style View all (same as Holidays/Notices) */}
        <Link
          to="/whats-new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] sm:text-[12px] font-semibold
                     border-gray-200 bg-white text-[var(--rb-primary,#D84E55)]
                     shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                     hover:border-[var(--rb-primary,#D84E55)] hover:bg-[#FFF5F5]
                     transition-colors duration-150"
        >
          <span>View all</span>
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[var(--rb-primary,#D84E55)] text-white text-[10px] leading-none">
            →
          </span>
        </Link>
      </div>

      {/* ---------- Desktop: 5-up grid aligned with search/notice width ---------- */}
      <div className="hidden lg:block">
        <div className={`${DESKTOP_CONTAINER}`}>
          <div className="grid grid-cols-5 gap-4">
            {items.slice(0, 5).map((it) => (
              <div
                key={it._id || it.id}
                className="rounded-xl overflow-hidden"
              >
                <WhatsNewCard item={it} linkTo="/whats-new" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Mobile/Tablet: horizontal scroll with pager ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        <div
          ref={railRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-4 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollPaddingLeft: "1rem",
          }}
        >
          {items.map((it, index) => (
            <div
              key={it._id || it.id}
              className={`w-[300px] flex-shrink-0 snap-start ${
                index === items.length - 1 ? "pr-4" : ""
              }`}
            >
              <WhatsNewCard item={it} linkTo="/whats-new" />
            </div>
          ))}
        </div>

        {/* Centered dots + count chip */}
        {items.length > 1 && (
          <Dots
            count={items.length}
            activeIndex={activeIndex}
            goToIndex={scrollToCard}
            className={CONTAINER_MARGIN_X}
          />
        )}
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default WhatsNewSection;
