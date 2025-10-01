// src/components/NoticesSection.jsx
import React, { useEffect, useRef, useState } from "react";
import apiClient from "../api";
import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";

const NoticesSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

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

  const updateArrowVisibility = () => {
    const el = railRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setAtStart(scrollLeft <= 0);
    setAtEnd(scrollLeft + clientWidth >= scrollWidth - 5);
  };

  const scrollBy = (dir) => {
    if (!railRef.current) return;
    const cardWidth = railRef.current.firstChild?.offsetWidth || 320;
    railRef.current.scrollBy({
      left: dir * (cardWidth + 16),
      behavior: "smooth",
    });
    setTimeout(updateArrowVisibility, 400);
  };

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
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 relative">
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

      {/* Left arrow with mist */}
      {!atStart && (
        <div className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start bg-gradient-to-r from-white via-white/70 to-transparent z-20">
          <button
            onClick={() => scrollBy(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
          >
            ‹
          </button>
        </div>
      )}

      {/* Right arrow with mist */}
      {!atEnd && (
        <div className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end bg-gradient-to-l from-white via-white/70 to-transparent z-20">
          <button
            onClick={() => scrollBy(1)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 shadow hover:bg-white transition"
          >
            ›
          </button>
        </div>
      )}

      {/* Horizontal scroll rail */}
      <div
        ref={railRef}
        onScroll={updateArrowVisibility}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 hide-scrollbar"
      >
        {items.map((n) => (
          <div key={n._id} className="w-[300px] flex-shrink-0">
            <NoticeCard notice={n} linkTo="/notices" />
          </div>
        ))}
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
