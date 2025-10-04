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
  // ... (Dots component logic remains the same)
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

  // ... (useEffect for fetching data remains the same)

  // Recalculate the active dot index on scroll
  // NOTE: The updateActiveIndex logic needs to account for the leading spacer card now (items.length + 1)
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;

    // Use a consistent card width + gap for calculation: 300px + 16px (gap-4) = 316
    const cardScrollWidth = el.firstChild?.offsetWidth ? el.firstChild.offsetWidth + 16 : 316;

    // The scroll area starts with the first item (the spacer).
    // Math.round ensures it snaps to the closest card.
    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    
    // We adjust the index by -1 because the first item is the spacer (index 0).
    // The active index should correspond to the real data (1 to N)
    setActiveIndex(Math.max(0, Math.min(newIndex - 1, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const cardWidth = el.firstChild?.offsetWidth || 300;
    const gap = 16;
    
    // We scroll to the index + 1, since the first item is the spacer (index 0).
    el.scrollTo({
      left: (index + 1) * (cardWidth + gap), 
      behavior: "smooth",
    });

    setActiveIndex(index); 
    
    setTimeout(updateActiveIndex, 350); 
  }, [items.length, updateActiveIndex]);

  // Set up scroll listener on mount
  useEffect(() => {
    // We must call scrollToCard(0) on mount to snap the first *real* card into view, 
    // overriding the initial browser position.
    if (!loading && items.length > 0) {
        scrollToCard(0);
    }

    const el = railRef.current;
    if (el) {
      el.addEventListener('scroll', updateActiveIndex);
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex, loading, scrollToCard]); // Added scrollToCard dependency


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
          // ✅ FIX: Removed pl-4 from here. Now padding is handled by the spacer card.
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* ✅ FIX: 1. Spacer card to push the first item off the edge */}
          <div className="w-4 flex-shrink-0 snap-start" /> 

          {items.map((n, index) => (
            <div 
              key={n._id} 
              className="w-[300px] flex-shrink-0 snap-start"
            >
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}

          {/* ✅ FIX: 2. Spacer card at the end to pull the last item off the edge */}
          <div className="w-4 flex-shrink-0" />
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
