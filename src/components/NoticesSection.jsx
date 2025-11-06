// src/components/NoticesSection.jsx
import React, { 
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import apiClient from "../api";
import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";

// Define a constant for consistent mobile/desktop horizontal padding
const CONTAINER_MARGIN_X = "px-4 sm:px-4 lg:px-8"; 

// ✅ Use the SAME container as the Home.jsx search bar section
const DESKTOP_CONTAINER = "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

/* ─────────────────────────────────────────────
   Centered Redbus-style pager (chip + dots)
   ───────────────────────────────────────────── */
const Dots = ({ count, activeIndex, goToIndex, className = "" }) => {
  const total = Math.max(1, count || 1);
  const safeIndex = Math.min(Math.max(0, activeIndex || 0), total - 1);
  return (
    <div className={`lg:hidden mt-3 flex justify-center ${className}`}>
      <div className="inline-flex items-center gap-3">
        {/* chip */}
        <span
          className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5
                     text-[10px] font-semibold rounded-full
                     bg-[var(--rb-primary,#D84E55)] text-white whitespace-nowrap"
          aria-live="polite"
        >
          {safeIndex + 1}/{total}
        </span>
        {/* dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: total }).map((_, i) => {
            const isActive = i === safeIndex;
            return (
              <button
                key={i}
                onClick={() => goToIndex(i)}
                aria-label={`Go to card ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                  isActive ? "bg-gray-700 scale-110" : "bg-gray-300"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Simple loading card skeleton
const Skeleton = () => (
  <div className="w-[300px] h-48 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
);

const NoticesSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const [activeIndex, setActiveIndex] = useState(0); 
  const railRef = useRef(null);
  const scrollStopTimer = useRef(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await apiClient.get("/notices/active");
        const data = Array.isArray(res.data) ? res.data : [];
        if (live) setItems(data);
      } catch (e) {
        if (live) setErr(e?.response?.data?.message || "Failed to load notices.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => { live = false; };
  }, []);

  /* --- Most-visible slide calculator (robust for any width/gap/DPR) --- */
  const calcMostVisibleIndex = (el) => {
    const railRect = el.getBoundingClientRect();
    const kids = el.children || [];
    let bestIdx = 0;
    let bestRatio = -1;

    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      const visibleW = Math.max(0, Math.min(r.right, railRect.right) - Math.max(r.left, railRect.left));
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

  // Debounce scroll end (so momentum/snap ends update the chip cleanly)
  const handleScroll = useCallback(() => {
    updateActiveIndex();
    if (scrollStopTimer.current) clearTimeout(scrollStopTimer.current);
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

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const target = el.children?.[index];
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    } else {
      el.scrollTo({ left: target?.offsetLeft || 0, behavior: "smooth" });
    }
  }, [items.length]);

  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Deals and Offers
          </h2>
        </div>
        
        {/* Mobile skeleton rail */}
        <div className="lg:hidden w-full overflow-hidden">
          <div className="flex gap-4 overflow-x-auto pl-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} />
            ))}
          </div>
        </div>

        {/* Desktop skeleton grid to match 5-up */}
        <div className="hidden lg:block">
          <div className={`${DESKTOP_CONTAINER}`}>
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
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
      {/* Header (aligned with screen edge padding) */}
      <div className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}>
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
          Deals and Offers
        </h2>
        <Link
          to="/notices"
          className="text-sm font-semibold text-red-600 hover:text-red-700 transition"
        >
          View All →
        </Link>
      </div>

      {/* ---------- Desktop: fixed 5-card grid aligned with search width ---------- */}
      <div className="hidden lg:block">
        <div className={`${DESKTOP_CONTAINER}`}>
          <div className="grid grid-cols-5 gap-4">
            {items.slice(0, 5).map((n) => (
              <div key={n._id} className="rounded-xl overflow-hidden">
                <NoticeCard notice={n} linkTo="/notices" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Mobile/Tablet: horizontal rail with centered pager ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{ 
            WebkitOverflowScrolling: "touch",
            scrollPaddingLeft: "1rem"
          }}
        >
          {items.map((n, index) => (
            <div 
              key={n._id} 
              className={`w-[300px] flex-shrink-0 snap-start ${index === items.length - 1 ? 'pr-4' : ''}`}
            >
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}
        </div>

        {/* Centered pager: red 1/N chip + dots together */}
        <Dots
          count={items.length}
          activeIndex={activeIndex}
          goToIndex={scrollToCard}
          className={CONTAINER_MARGIN_X}
        />
      </div>

      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default NoticesSection;
