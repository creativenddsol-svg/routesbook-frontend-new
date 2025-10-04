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

// Helper component for the navigation dots
const Dots = ({ count, activeIndex, goToIndex }) => {
  return (
    <div className="flex justify-center mt-4 space-x-2">
      {[...Array(count)].map((_, index) => (
        <button
          key={index}
          onClick={() => goToIndex(index)}
          className={`h-2 w-2 rounded-full transition-all ${
            index === activeIndex
              ? "bg-red-600 w-4" // Active dot is slightly wider
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
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

  // Recalculate the active dot index on scroll
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;

    // Use a consistent card width + gap for calculation: 300px + 16px (gap-4)
    const cardScrollWidth = el.firstChild?.offsetWidth ? el.firstChild.offsetWidth + 16 : 316;

    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const cardWidth = el.firstChild?.offsetWidth || 300;
    const gap = 16;
    
    el.scrollTo({
      left: index * (cardWidth + gap),
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
      el.addEventListener('scroll', updateActiveIndex);
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex]);


  if (loading) {
    return (
      // ✅ FIX: Removed mobile px-4 from section, used py-8 for better mobile spacing
      <section className="w-full max-w-7xl mx-auto py-8 sm:py-12">
        {/* ✅ FIX: Applied CONTAINER_MARGIN_X to header for mobile alignment */}
        <div className={`flex items-center justify-between mb-4 sm:mb-6 ${CONTAINER_MARGIN_X}`}>
          {/* ✅ FIX: Smaller, eye-catching heading on mobile (text-xl sm:text-2xl) */}
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
            Discount Deals & Offers
          </h2>
        </div>
        
        <div className="w-full overflow-hidden">
            {/* Horizontal scroll rail for loading state */}
            <div className="flex gap-4 overflow-x-auto pl-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} />
              ))}
            </div>
        </div>
      </section>
    );
  }
  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    // ✅ FIX: Removed mobile px-4 from section, used py-8 for better mobile spacing
    <section className="w-full max-w-7xl mx-auto py-8 sm:py-12">
      
      {/* Header */}
      {/* ✅ FIX: Applied CONTAINER_MARGIN_X to header for mobile alignment */}
      <div className={`flex items-center justify-between mb-4 sm:mb-6 ${CONTAINER_MARGIN_X}`}>
        {/* ✅ FIX: Smaller, eye-catching heading on mobile (text-xl sm:text-2xl) */}
        <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
          Discount Deals & Offers
        </h2>
        {/* ✅ FIX: Use 'View all' for better UX */}
        <Link
          to="/notices"
          className="text-sm font-semibold text-red-600 hover:text-red-700 transition"
        >
          View All →
        </Link>
      </div>

      {/* Rail Container */}
      <div className="w-full overflow-hidden">
        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex}
          // ✅ FIX: Added pl-4 for left padding and scroll-snap for app-like scrolling
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((n, index) => (
            <div 
              key={n._id} 
              // ✅ FIX: Added snap-start for clean snapping and pr-4 for the last card
              className={`w-[300px] flex-shrink-0 snap-start ${index === items.length - 1 ? 'pr-4' : ''}`}
            >
              {/* Note: To make the cards *truly* prettier and smaller, you must also update NoticeCard.jsx */}
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Tiny Navigation Dots */}
      {/* ✅ FIX: Applied CONTAINER_MARGIN_X to dots container for alignment */}
      {items.length > 1 && (
        <div className={`${CONTAINER_MARGIN_X}`}>
            <Dots 
                count={items.length} 
                activeIndex={activeIndex} 
                goToIndex={scrollToCard} 
            />
        </div>
      )}

      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default NoticesSection;
