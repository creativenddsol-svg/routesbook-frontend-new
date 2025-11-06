// src/components/NoticesSection.jsx
import React, { 
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
// ❌ Import fixes: Commenting out external dependencies for self-contained execution
// import apiClient from "../api";
// import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";
// import NavDots from "./NavDots"; 

// ==============================================================================
// 🛠️ MOCK/PLACEHOLDER COMPONENTS FOR DEMONSTRATION 🛠️
// Replace these with actual imports when integrating into your project structure
// ------------------------------------------------------------------------------

// Placeholder for NoticeCard
const NoticeCard = ({ notice }) => (
  <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 h-full">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-[var(--rb-primary,#D84E55)] rounded-full flex items-center justify-center text-white text-lg font-bold">
        {notice.code.charAt(0)}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{notice.title}</p>
        <p className="text-xs text-gray-500">Valid till {notice.expiry}</p>
      </div>
    </div>
  </div>
);

// Placeholder for NavDots (Logic from NavDots.jsx is merged here)
const NavDots = ({
  current = 0,   // zero-based
  total = 1,
  onDotClick,    // optional (i) => void
  className = "",
}) => {
  const safe = Math.min(Math.max(0, current), Math.max(0, total - 1));
  return (
    <div className={"w-full flex items-center justify-between gap-3 " + className}>
      {/* left: counter chip - The redbus style update! */}
      <span
        className="inline-flex items-center justify-center min-w-[34px] px-2 py-0.5
                   text-[10px] font-semibold rounded-full
                   bg-[var(--rb-primary,#D84E55)] text-white whitespace-nowrap"
        aria-live="polite"
      >
        {safe + 1}/{total}
      </span>

      {/* right: dots */}
      <div className="flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const isActive = i === safe;
          return onDotClick ? (
            <button
              key={i}
              aria-label={`Go to card ${i + 1}`}
              onClick={() => onDotClick(i)}
              className={`h-1.5 w-1.5 rounded-full transition-all duration-200
                          ${isActive ? "bg-gray-700 scale-110" : "bg-gray-300"}`}
            />
          ) : (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-gray-700" : "bg-gray-300"}`}
            />
          );
        })}
      </div>
    </div>
  );
};
// ==============================================================================


// Define a constant for consistent mobile/desktop horizontal padding
const CONTAINER_MARGIN_X = "px-4 sm:px-4 lg:px-8"; 

// ✅ Use the SAME container as the Home.jsx search bar section
const DESKTOP_CONTAINER = "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

// ❌ Removed the local 'Dots' component, replaced by imported NavDots

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
        // 🛠️ MOCK: Replace actual API call with a mock response for compilation
        // const res = await apiClient.get("/notices/active");
        const mockData = [
            { _id: '1', title: 'Save up to Rs 500 on bus tickets', code: 'RED500', expiry: '31 Dec' },
            { _id: '2', title: 'Get 10% off on all Train Bookings', code: 'TRAIN10', expiry: '15 Jan' },
            { _id: '3', title: 'Weekend special discount', code: 'WKENDR', expiry: 'Tues' },
            { _id: '4', title: 'First time user offer', code: 'NEWBIE', expiry: '31 Dec' },
            { _id: '5', title: 'Summer Travel Sale', code: 'SUMMER', expiry: '30 May' },
            { _id: '6', title: 'Monsoon Delight', code: 'RAINY', expiry: '30 Sep' },
        ];
        
        const data = Array.isArray(mockData) ? mockData : []; // Use mockData here
        if (live) setItems(data);
      } catch (e) {
        if (live) setErr("Failed to load mock notices.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => (live = false);
  }, []);

  // --- IntersectionObserver: pick the child most in view (rock-solid on all DPR/zooms) ---
  useEffect(() => {
    const rail = railRef.current;
    if (!rail || items.length === 0) return;

    const kids = Array.from(rail.children || []);
    if (kids.length === 0) return;

    let frame = null;

    const io = new IntersectionObserver(
      (entries) => {
        // pick the entry with largest intersectionRatio
        let bestIdx = 0;
        let bestRatio = -1;
        for (const e of entries) {
          const idx = kids.indexOf(e.target);
          if (idx !== -1 && e.intersectionRatio > bestRatio) {
            bestRatio = e.intersectionRatio;
            bestIdx = idx;
          }
        }
        // schedule state update on rAF to avoid thrashing
        if (frame) cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          setActiveIndex((prev) => (prev === bestIdx ? prev : bestIdx));
        });
      },
      {
        root: rail,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    kids.forEach((el) => io.observe(el));
    return () => {
      kids.forEach((el) => io.unobserve(el));
      io.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const target = el.children?.[index];
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
    } else {
      // fallback
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
            {/* Show only first 5 items on desktop */}
            {items.slice(0, 5).map((n) => (
              <div key={n._id} className="rounded-xl overflow-hidden">
                <NoticeCard notice={n} linkTo="/notices" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Mobile/Tablet: horizontal rail with pager ---------- */}
      <div className="lg:hidden w-full overflow-hidden">
        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
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
            // ✅ Using NavDots component with correct props for Redbus-style counter
            <NavDots 
              total={items.length} 
              current={activeIndex} 
              onDotClick={scrollToCard} 
              className="mt-3" 
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
