// src/components/WhatsNewSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import WhatsNewCard from "./WhatsNewCard";
import apiClient, { toImgURL } from "../api";

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
              ? "bg-blue-600 w-4" // Active dot is slightly wider (using blue for "What's new" to match the View More link)
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
};

/** Simple loading card */
const Skeleton = () => (
  // Updated size to w-[300px] and h-40 to match Notice Card
  <div className="w-[300px] h-40 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
);

const WhatsNewSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const railRef = useRef(null);
  // Removed atStart and atEnd states

  const [activeIndex, setActiveIndex] = useState(0); // New state for active dot

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
        setErr(e?.response?.data?.message || e?.message || "Failed to load What's new.");
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);


  // Recalculate the active dot index on scroll
  const updateActiveIndex = useCallback(() => {
    const el = railRef.current;
    if (!el || items.length === 0) return;

    // Get the width of one card + gap (assuming w-[300px] + gap-4 = 316px)
    // Using 316px as the standard scroll distance (300px width + 16px gap)
    const cardScrollWidth = 316; // 300px card width + 16px (gap-4)

    // Calculate the index of the item that is currently most visible on the left
    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    
    // Ensure the index is within bounds
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);


  // Scroll to a specific index (for dot click)
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    // Get the width of one card + gap
    const cardWidth = 300;
    const gap = 16;
    
    el.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });

    // Update the active index right away for responsiveness
    setActiveIndex(index); 
    
    // Allow smooth scroll to settle then recompute for safety
    setTimeout(updateActiveIndex, 350); 
  }, [items.length, updateActiveIndex]);

  // Ensure initial active index is correct and set up scroll listener on mount
  useEffect(() => {
    updateActiveIndex(); // Set initial active index
    const el = railRef.current;
    if (el) {
      // Use the native onScroll event for continuous updates
      el.addEventListener('scroll', updateActiveIndex); 
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex]);


  if (loading) {
    return (
      // Updated max-w-7xl to match NoticesSection
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12"> 
        <div className="flex items-center justify-between mb-6"> {/* Updated mb-6 */}
          <h2 className="text-2xl font-bold text-gray-900">What’s new</h2> {/* Updated size */}
        </div>
        <div className="flex gap-4 overflow-x-auto"> {/* Updated gap-4 */}
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    // Updated max-w-7xl and py-12 to match NoticesSection
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6"> {/* Updated mb-6 */}
        <h4 className="text-2xl font-bold text-gray-900">What’s new</h4> {/* Updated size */}
        <Link 
          to="/whats-new" 
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          View more → {/* Added arrow to match NoticesSection */}
        </Link>
      </div>

      {/* Rail wrapper - removed 'relative' and arrows */}
      <div>
        {/* Horizontal scroll rail (single row) */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex} // Updated to track scroll position
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar" // Updated gap-4
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((it) => (
            {/* Updated card width to w-[300px] */}
            <div key={it._id || it.id} className="w-[300px] flex-shrink-0">
              <WhatsNewCard item={it} linkTo="/whats-new" />
            </div>
          ))}
        </div>
      </div>
      
      {/* Tiny Navigation Dots */}
      {items.length > 1 && (
        <Dots 
          count={items.length} 
          activeIndex={activeIndex} 
          goToIndex={scrollToCard} 
        />
      )}

      {/* Hide scrollbar */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
};

export default WhatsNewSection;
