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
const MOBILE_SNAP_PADDING = "1rem"; // Equivalent to Tailwind's px-4

// Helper component for the navigation dots (omitted for brevity, no change)
const Dots = ({ count, activeIndex, goToIndex }) => {
  return (
    <div className="flex justify-center mt-4 space-x-2">
      {[...Array(count)].map((_, index) => (
        <button
          key={index}
          onClick={() => goToIndex(index)}
          className={`h-2 w-2 rounded-full transition-all ${
            index === activeIndex
              ? "bg-red-600 w-4"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

// Simple loading card skeleton (omitted for brevity, no change)
const Skeleton = () => (
  <div className="w-[300px] h-48 bg-gray-200 rounded-xl animate-pulse flex-shrink-0" />
);


const NoticesSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const [activeIndex, setActiveIndex] = useState(0); 
  const railRef = useRef(null);

  // ... (useEffect for fetching data remains the same)

  // Recalculate the active dot index on scroll (remains the same)
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;
    
    // We assume the first child is the card, width 300px + gap 16px (0.5rem)
    const cardScrollWidth = el.firstChild?.offsetWidth ? el.firstChild.offsetWidth + 16 : 316;

    // We must account for the scroll-padding-left being the new 'zero' point.
    // Since we're using 1rem (16px) scroll-padding, we add that to the scrollLeft value
    const scrollLeftWithPadding = el.scrollLeft; 
    
    // Calculate index based on how many full cards have been scrolled past
    const newIndex = Math.round(scrollLeftWithPadding / cardScrollWidth);
    
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index (remains the same)
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

  // Set up scroll listener on mount (remains the same)
  useEffect(() => {
    updateActiveIndex(); 
    const el = railRef.current;
    if (el) {
      el.addEventListener('scroll', updateActiveIndex);
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex]);


  if (loading) {
    // ... (Loading state remains the same for simplicity)
    return (
      <section className="w-full max-w-7xl mx-auto py-8 sm:py-12">
        <div className={`flex items-center justify-between mb-4 sm:mb-6 ${CONTAINER_MARGIN_X}`}>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
            Deals and Offers
          </h2>
        </div>
        
        <div className="w-full overflow-hidden">
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
          // ✅ FIX: Removed pl-4. We will use scroll-padding-left via the style tag.
          // This keeps the element's start flush, but tells the snap feature where to align.
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar snap-x snap-mandatory scroll-pr-4"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((n, index) => (
            <div 
              key={n._id} 
              // ✅ FIX: Removed pr-4 from the last item and added scroll-pr-4 to the rail above.
              className={`w-[300px] flex-shrink-0 snap-start`}
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

      {/* Hide scrollbar and apply scroll-padding-left */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        /* ✅ CRITICAL FIX: Ensures the snap-start point respects the screen padding on mobile */
        /* Use a media query to apply this only on mobile if necessary, or rely on the container's max-width on desktop */
        .snap-x { 
          scroll-padding-left: ${MOBILE_SNAP_PADDING};
        }
      `}</style>
    </section>
  );
};

export default NoticesSection;
