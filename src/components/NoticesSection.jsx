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
// Keeping consistent padding for elements that SHOULD NOT scroll (Header, Dots)
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
    // ... (rest of fetch logic remains the same)
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

    // Adjust calculation to account for the initial 16px (pl-4) margin being part of the scroll area
    // This provides a smoother snap
    const scrollOffset = el.scrollLeft; 
    const newIndex = Math.round(scrollOffset / cardScrollWidth);
    
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const cardWidth = el.firstChild?.offsetWidth || 300;
    const gap = 16;
    
    // The rail starts with 16px of padding, so we just calculate the target left position 
    // based on the card's position * (cardWidth + gap)
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
      <section className="w-full max-w-7xl mx-auto py-8 sm:py-12">
        <div className={`flex items-center justify-between mb-4 sm:mb-6 ${CONTAINER_MARGIN_X}`}>
          {/* ✅ FIX: Name change & reduced boldness (font-semibold) */}
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Deals and Offers
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
    <section className="w-full max-w-7xl mx-auto py-8 sm:py-12">
      
      {/* Header (aligned with screen edge padding) */}
      <div className={`flex items-center justify-between mb-4 sm:mb-6 ${CONTAINER_MARGIN_X}`}>
        {/* ✅ FIX: Name change & reduced boldness (font-semibold) */}
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

      {/* Rail Container */}
      <div className="w-full overflow-hidden">
        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex}
          // ✅ FIX: The pl-4 adds the 16px spacing to the left of the first card
          // This ensures the first card is visible and starts correctly.
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pl-4 hide-scrollbar snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((n, index) => (
            <div 
              key={n._id} 
              // Added pr-4 to the LAST card to ensure it doesn't stick to the right edge
              className={`w-[300px] flex-shrink-0 snap-start ${index === items.length - 1 ? 'pr-4' : ''}`}
            >
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Tiny Navigation Dots */}
      <div className={`${CONTAINER_MARGIN_X}`}>
        {items.length > 1 && (
            <Dots 
                count={items.length} 
                activeIndex={activeIndex} 
                goToIndex={scrollToCard} 
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

export default NoticesSection;
