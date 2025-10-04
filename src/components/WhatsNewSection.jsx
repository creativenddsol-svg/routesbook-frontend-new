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
              ? "bg-blue-600 w-4" // Active dot is slightly wider
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
  <div className="w-[300px] h-40 bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
);

const WhatsNewSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  
  const railRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0); 

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

    // Use a more robust calculation for card width + gap
    const cardWidth = 300; 
    const gap = 16; // Based on 'gap-4' (4 * 4px = 16px)
    const cardScrollWidth = cardWidth + gap;

    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);


  // Scroll to a specific index (for dot click)
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    const cardWidth = 300;
    const gap = 16;
    
    el.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });

    setActiveIndex(index); 
    
    // Give it a moment to finish scrolling before updating index
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
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12"> {/* ✅ FIX: Added spacing and width */}
        <div className="flex items-center justify-between mb-6"> {/* ✅ FIX: Title/Button alignment and spacing */}
          <h2 className="text-2xl font-bold text-gray-900">What’s new</h2> 
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12"> {/* ✅ FIX: Added spacing and width */}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6"> {/* ✅ FIX: Title/Button alignment and spacing */}
        <h2 className="text-2xl font-bold text-gray-900">What’s new</h2> 
        <Link 
          to="/whats-new" 
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          View All →
        </Link>
      </div>

      <div>
        {/* Horizontal scroll rail (single row) */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((it) => (
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
