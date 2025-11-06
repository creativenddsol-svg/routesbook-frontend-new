// src/components/NoticesSection.jsx
import React, { 
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import apiClient from "../api";
import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";

// Define a constant for consistent mobile/desktop horizontal padding
const CONTAINER_MARGIN_X = "px-4 sm:px-4 lg:px-8"; 

// ✅ Use the SAME container as the Home.jsx search bar section
const DESKTOP_CONTAINER = "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

// Helper component for the navigation dots
const Dots = ({ count, activeIndex, goToIndex }) => {
  // Redbus-style: left "1/N" chip + right tiny dots
  const safeIndex = Math.min(Math.max(0, activeIndex || 0), Math.max(0, (count || 1) - 1));
  const total = Math.max(1, count || 1);

  return (
    <div className="flex items-center justify-between mt-3 lg:hidden">
      {/* Left: counter chip */}
      <span
        className="inline-flex items-center justify-center min-w-[36px] px-2 py-0.5
                   text-[10px] font-semibold rounded-full
                   bg-[var(--rb-primary,#D84E55)] text-white whitespace-nowrap"
        aria-live="polite"
      >
        {safeIndex + 1}/{total}
      </span>

      {/* Right: tiny dots */}
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
      }
    })();
    return () => (live = false);
  }, []);

  // --- Precise active index from scroll position (robust for any card width/gap) ---
  const getIndexFromScroll = (el) => {
    // each slide wrapper is direct child of the rail
    const child = el.children?.[0];
    if (!child) return 0;

    // the actual slide width (not assumed 300)
    const slideWidth = child.getBoundingClientRect().width;

    // gap is computed from actual first two children positions if available
    let gap = 16; // fallback to your 4 (16px)
    if (el.children.length > 1) {
      const a = el.children[0].getBoundingClientRect();
      const b = el.children[1].getBoundingClientRect();
      gap = Math.max(0, Math.round(b.left - a.right));
    }

    const step = slideWidth + gap;
    return Math.round(el.scrollLeft / Math.max(1, step));
  };

  // Recalculate the active dot index on scroll
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;
    const newIdx = getIndexFromScroll(el);
    setActiveIndex(Math.max(0, Math.min(newIdx, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const child = el.children?.[0];
    const slideWidth = child ? child.getBoundingClientRect().width : 300;

    let gap = 16;
    if (el.children.length > 1) {
      const a = el.children[0].getBoundingClientRect();
      const b = el.children[1].getBoundingClientRect();
      gap = Math.max(0, Math.round(b.left - a.right));
    }

    el.scrollTo({
      left: index * (slideWidth + gap),
      behavior: "smooth",
    });

    setActiveIndex(index);
    setTimeout(updateActiveIndex, 350);
  }, [items.length, updateActiveIndex]);

  // Set up scroll listener on mount
  useEffect(() => {
    updateActiveIndex(); 
    const el = railRef.current;
    if (el) {
      el.addEventListener('scroll', updateActiveIndex, { passive: true });
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex]);

  if (loading) {
    return (
      <section className="w-full py-8 sm:py-12">
        <div className={`${DESKTOP_CONTAINER} flex items-center justify-between mb-4 sm:mb-6`}>
          {/* ✅ FIX: Final title name and reduced boldness (font-semibold) */}
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
        {/* ✅ FIX: Final title name and reduced boldness (font-semibold) */}
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

      {/* ---------- Mobile/Tablet: original horizontal rail ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        {/* Horizontal scroll rail */}
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
              className={`w-[300px] flex-shrink-0 snap-start ${index === items.length - 1 ? 'pr-4' : ''}`}
            >
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}
        </div>

        {/* Pager: red 1/N chip + tiny dots */}
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
