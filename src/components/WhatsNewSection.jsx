// src/components/WhatsNewSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
// import WhatsNewCard from "./WhatsNewCard"; // ❌ We'll define a simple card here for demo
import apiClient from "../api"; // ✅ use the configured axios instance

/** * ================================================
 * NEW: WhatsNewCard Component (for demonstration)
 * ================================================
 * - Applies the modern, matte UI styling.
 * - Uses an illustration placeholder to show layering/integration.
 */
const WhatsNewCard = ({ item }) => {
  const { title, description, buttonText, color, iconUrl } = item;

  // Style based on the color property from the item (e.g., 'red', 'indigo')
  const baseColorClass = color || 'indigo'; // Default to indigo
  const bgColorClass = `bg-${baseColorClass}-600`;
  const bgIllustrationClass = `bg-${baseColorClass}-50`;
  const btnColorClass = `text-${baseColorClass}-200 hover:text-white`;

  // Determine an icon based on the title for the illustration placeholder
  let illustrationSvg = (
    <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
  ); // Default icon (Clock)

  if (title.toLowerCase().includes('cancellation')) {
    illustrationSvg = (
      <svg className="w-12 h-12 text-pink-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    ); // Cross
  } else if (title.toLowerCase().includes('bus timings')) {
    illustrationSvg = (
      <svg className="w-12 h-12 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13.48m-3.479-2.93a7.485 7.485 0 01-1.205-1.928m-6.527-7.291a9 9 0 0115.011-3.693l-.337.337M12 8.253a4 4 0 100 8.5v-8.5z"></path></svg>
    ); // Mobile/Time
  } else if (title.toLowerCase().includes('assurance')) {
    illustrationSvg = (
      <svg className="w-12 h-12 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.617 10.617a9 9 0 11-12.617-12.617 9 9 0 0112.617 12.617z"></path></svg>
    ); // Check
  }


  return (
    <div
      className={`
        relative w-full h-[260px] p-6 pt-10 
        ${bgColorClass} // Primary background color (e.g., bg-red-600)
        rounded-2xl sm:rounded-3xl 
        overflow-hidden cursor-pointer shrink-0 snap-start
        shadow-xl hover:shadow-2xl transition-shadow duration-300 // Key shadow for the card look
      `}
    >
      {/* The integrated, "matte" illustration area. 
        It uses absolute positioning and a different background color (bg-red-50) 
        to appear integrated and layered.
      */}
      <div
        className={`
          absolute bottom-0 right-0 
          w-full h-2/3 
          ${bgIllustrationClass} // Light background color (e.g., bg-red-50)
        `}
      />

      {/* Illustration/Icon - Positioned over the background area
        This is where you would place your custom SVG or illustration component.
      */}
      <div 
        className="absolute bottom-4 right-4 p-4 rounded-full bg-white/50 backdrop-blur-sm shadow-lg"
      >
        {illustrationSvg}
      </div>

      {/* Card Content (always on top) */}
      <div className="relative z-10 text-white flex flex-col justify-between h-full">
        <div>
          <h5 className="text-2xl font-bold mb-2 leading-snug">
            {title || "Default Title"}
          </h5>
          <p className="text-sm font-medium opacity-80 mb-4">
            {description || "A quick summary of the new feature or offer."}
          </p>
        </div>
        <Link
          to="/whats-new"
          className={`
            text-sm font-semibold inline-flex items-center 
            ${btnColorClass} // Button text color (e.g., text-red-200)
            transition-colors duration-200
          `}
        >
          {buttonText || "Know More"} &rarr;
        </Link>
      </div>
    </div>
  );
};


/** Layout constants (match Offers rail) */
const CARD_W = 340; // sm:w-[340px]
const GAP = 12;
const STEP = CARD_W + GAP;

const Skeleton = () => (
  <div
    className="
      w-[300px] sm:w-[340px]
      h-[260px]
      rounded-3xl
      ring-1 ring-black/5 bg-gray-100 // Updated background for the skeleton
      shadow-[0_1px_2px_rgba(0,0,0,0.04)]
      animate-pulse shrink-0 snap-start
    "
  />
);

// (GlassArrow component remains unchanged)
const GlassArrow = ({ side = "left", onClick, show }) => {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${side}`}
      className={`hidden sm:flex absolute ${side}-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center 
      rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10
      hover:bg-white/90 active:scale-95 transition`}
    >
      {side === "left" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-gray-800"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
};

const WhatsNewSection = () => {
  const [items, setItems] = useState([
    // Mock data to demonstrate the new card UI
    { _id: '1', title: 'Free Cancellation', description: 'Get 100% refund on bookings until 1 hour before travel.', buttonText: 'Know More', color: 'pink' },
    { _id: '2', title: 'Introducing Bus Timings', description: 'Get live timings between cities in your state.', buttonText: 'Explore Now', color: 'blue' },
    { _id: '3', title: 'FlexiTicket & Date Change', description: 'Get amazing benefits on Date Change & Cancellation', buttonText: 'Check Details', color: 'red' },
    { _id: '4', title: 'Assurance Program', description: 'Insure your trip against cancellations and accidents.', buttonText: 'View Options', color: 'green' },
  ]);
  const [loading, setLoading] = useState(false); // Set to false to show mock data
  const [err, setErr] = useState("");

  const railRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [index, setIndex] = useState(0);

  const atStart = index === 0;
  const atEnd = index === pages - 1;

  // fetch active items (KEEPING THIS LOGIC BUT DISABLING FETCH FOR MOCK)
  /*
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await apiClient.get("/whats-new/active"); 
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []); 
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
  */

  const computePages = useCallback(() => {
    const el = railRef.current;
    if (!el) return 1;
    const count = items.length;
    if (!count) return 1;
    const total = count * STEP - GAP;
    const visible = el.clientWidth;
    // Calculation for pages
    return Math.max(1, Math.ceil((total - visible) / STEP) + 1);
  }, [items.length]);

  const updatePagerFromScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    // Only update index if a full step is scrolled past
    const current = Math.round(el.scrollLeft / STEP); 
    setIndex(Math.max(0, Math.min(current, pages - 1)));
  }, [pages]);

  const scrollToIndex = useCallback(
    (i) => {
      const el = railRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(i, pages - 1));
      el.scrollTo({ left: clamped * STEP, behavior: "smooth" });
      setIndex(clamped);
    },
    [pages]
  );

  const scrollByStep = useCallback(
    (dir) => {
      scrollToIndex(index + dir);
    },
    [index, scrollToIndex]
  );

  useEffect(() => {
    const recalc = () => {
      const p = computePages();
      setPages(p);
      setIndex((prev) => Math.max(0, Math.min(prev, p - 1)));
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [computePages]);

  if (loading) {
    return (
      <section className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] sm:text-2xl font-bold text-gray-900">
            What’s new
          </h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  // Hide the section when there is an error or no items
  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[22px] sm:text-2xl font-bold text-gray-900">
          What’s new
        </h4>
        <Link
          to="/whats-new"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          View more
        </Link>
      </div>

      <div className="relative">
        <GlassArrow side="left"  onClick={() => scrollByStep(-1)} show={!atStart} />
        <GlassArrow side="right" onClick={() => scrollByStep(1)}  show={!atEnd}  />

        <div
          ref={railRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 hide-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
          onScroll={updatePagerFromScroll}
        >
          {items.map((it) => (
            <div
              key={it._id || it.id}
              className="w-[300px] sm:w-[340px] shrink-0 snap-start"
            >
              {/* Use the new WhatsNewCard component with modern styling */}
              <WhatsNewCard item={it} /> 
            </div>
          ))}
        </div>

        {/* Dots / pager */}
        <div className="mt-3 flex w-full items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-gray-900"
                  : "w-2.5 bg-gray-300 hover:bg-gray-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhatsNewSection;
