// src/components/WhatsNewSection.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import WhatsNewCard from "./WhatsNewCard";
import apiClient, { toImgURL } from "../api";

/** Simple loading card */
const Skeleton = () => (
  <div className="w-[300px] sm:w-[340px] h-[220px] bg-gray-100 rounded-xl animate-pulse flex-shrink-0" />
);

const WhatsNewSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const railRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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

  const updateArrowVisibility = () => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 0);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
  };

  const scrollBy = (dir) => {
    const el = railRef.current;
    if (!el) return;
    const cardW = el.firstChild?.offsetWidth || 320;
    el.scrollBy({ left: dir * (cardW + 16), behavior: "smooth" });
    setTimeout(updateArrowVisibility, 350);
  };

  useEffect(() => {
    // ensure correct arrow state after items mount
    updateArrowVisibility();
  }, [items]);

  if (loading) {
    return (
      <section className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[22px] sm:text-2xl font-bold text-gray-900">What’s new</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[22px] sm:text-2xl font-bold text-gray-900">What’s new</h4>
        <Link to="/whats-new" className="text-sm font-semibold text-blue-600 hover:underline">
          View more
        </Link>
      </div>

      {/* Rail wrapper is relative so mist + arrows sit ONLY over the card row */}
      <div className="relative">
        {/* Left mist + arrow */}
        {!atStart && (
          <>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white via-white/70 to-transparent z-10" />
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition"
            >
              ‹
            </button>
          </>
        )}

        {/* Right mist + arrow */}
        {!atEnd && (
          <>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white via-white/70 to-transparent z-10" />
            <button
              onClick={() => scrollBy(1)}
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/10 hover:bg-white transition"
            >
              ›
            </button>
          </>
        )}

        {/* Horizontal scroll rail (single row) */}
        <div
          ref={railRef}
          onScroll={updateArrowVisibility}
          className="flex gap-3 overflow-x-auto scroll-smooth pb-2 hide-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {items.map((it) => (
            <div key={it._id || it.id} className="w-[300px] sm:w-[340px] flex-shrink-0">
              <WhatsNewCard item={it} linkTo="/whats-new" />
            </div>
          ))}
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

export default WhatsNewSection;
