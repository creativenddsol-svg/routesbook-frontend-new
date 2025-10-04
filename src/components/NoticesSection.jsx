// src/components/NoticesSection.jsx
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import apiClient from "../api";
import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";

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

const NoticesSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  // Removed atStart and atEnd

  const [activeIndex, setActiveIndex] = useState(0); // New state for active dot

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

    // Get the width of one card (assuming they are uniform)
    // Fallback to 300px + 16px gap = 316px
    const cardScrollWidth = el.firstChild?.offsetWidth ? el.firstChild.offsetWidth + 16 : 316;

    // Calculate the index of the item that is currently most visible on the left
    // Math.round() ensures it snaps to the closest card index
    const newIndex = Math.round(el.scrollLeft / cardScrollWidth);
    
    // Ensure the index is within bounds
    setActiveIndex(Math.max(0, Math.min(newIndex, items.length - 1)));
  }, [items.length]);

  // Scroll to a specific index
  const scrollToCard = useCallback((index) => {
    const el = railRef.current;
    if (!el || items.length === 0 || index < 0 || index >= items.length) return;

    // Get the width of one card (assuming they are uniform)
    const cardWidth = el.firstChild?.offsetWidth || 300;
    const gap = 16;
    
    el.scrollTo({
      left: index * (cardWidth + gap),
      behavior: "smooth",
    });

    // Update the active index right away for responsiveness
    setActiveIndex(index); 
    
    // Although the index is set above, we keep the timeout for safety on smooth scroll end
    setTimeout(updateActiveIndex, 350); 
  }, [items.length, updateActiveIndex]);

  // Ensure initial active index is correct and set up scroll listener on mount
  useEffect(() => {
    updateActiveIndex(); // Set initial active index
    const el = railRef.current;
    if (el) {
      el.addEventListener('scroll', updateActiveIndex);
      return () => el.removeEventListener('scroll', updateActiveIndex);
    }
  }, [items, updateActiveIndex]);


  if (loading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Bus Booking Discount Offers
          </h2>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-[300px] h-40 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }
  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Bus Booking Discount Offers
        </h2>
        <Link
          to="/notices"
          className="text-sm font-semibold text-red-600 hover:underline"
        >
          View All →
        </Link>
      </div>

      {/* Rail wrapper (no longer relative as arrows are removed) */}
      <div>
        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
          onScroll={updateActiveIndex} // Updated to call updateActiveIndex
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar"
        >
          {items.map((n) => (
            <div key={n._id} className="w-[300px] flex-shrink-0">
              <NoticeCard notice={n} linkTo="/notices" />
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

export default NoticesSection;
