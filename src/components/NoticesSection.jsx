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
const DESKTOP_CONTAINER =
  "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

// Centered dots only (chip is now on the active card itself)
const Dots = ({ count, activeIndex, goToIndex }) => {
  const total = Math.max(1, count || 1);
  const safeIndex = Math.min(Math.max(0, activeIndex || 0), total - 1);
  return (
    <div className="flex items-center justify-center mt-3 lg:hidden">
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, index) => {
          const isActive = index === safeIndex;
          return (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${
                isActive ? "bg-gray-700 scale-110" : "bg-gray-300"
              }`}
            />
          );
        })}
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
        // give the rail a tick to layout, then compute index once
        setTimeout(() => {
          if (live) updateActiveIndex();
        }, 0);
      }
    })();
    return () => (live = false);
  }, []);

  // Robust center-based detector: find the child whose center is closest to rail center
  const getIndexFromScroll = (el) => {
    const mid = el.scrollLeft + el.clientWidth / 2;
    const kids = el.children || [];
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < kids.length; i++) {
      const child = kids[i];
      const center = child.offsetLeft + child.offsetWidth / 2;
      const d = Math.abs(center - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }
    return best;
  };

  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;
    const idx = getIndexFromScroll(el);
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  }, [items.length]);

  // Keep index synced on resize, too
  useEffect(() => {
    const onResize = () => updateActiveIndex();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateActiveIndex]);

  // Scroll to a specific slide
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

  const total = items.length;

  return (
    <section className="w-full py-8 sm:py-12">
      {/* Header */}
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

      {/* ---------- Desktop: fixed 5-card grid ---------- */}
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

      {/* ---------- Mobile/Tablet: rail + centered dots; chip over active card ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        {/* Rail */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{ 
            WebkitOverflowScrolling: "touch",
            scrollPaddingLeft: "1rem"
          }}
        >
          {items.map((n, index) => (
            <div 
              key={n._id}
              className={`relative w-[300px] flex-shrink-0 snap-start ${index === items.length - 1 ? 'pr-4' : ''}`}
            >
              <NoticeCard notice={n} linkTo="/notices" />

              {/* Redbus-style chip on the ACTIVE card only */}
              {index === activeIndex && (
                <span
                  className="absolute left-2 bottom-2 inline-flex items-center justify-center
                             min-w-[36px] px-2 py-0.5 text-[10px] font-semibold rounded-full
                             bg-[var(--rb-primary,#D84E55)] text-white"
                >
                  {activeIndex + 1}/{total}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Centered dots */}
        <div className={`${CONTAINER_MARGIN_X}`}>
          {items.length > 1 && (
            <Dots 
              count={items.length} 
              activeIndex={activeIndex} 
              goToIndex={scrollToCard} 
            />
          )}
        </div>
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
