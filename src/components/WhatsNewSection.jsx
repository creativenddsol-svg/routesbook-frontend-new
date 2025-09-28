// src/components/WhatsNewSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import WhatsNewCard from "./WhatsNewCard";
import apiClient from "../api"; // ✅ use the configured axios instance

/** Layout constants */
const CARD_W = 340; // sm:w-[340px]
const GAP = 12;
const STEP = CARD_W + GAP;

const Skeleton = () => (
  <div
    className="
      w-[300px] sm:w-[340px]
      h-[260px]
      bg-gray-100
      animate-pulse shrink-0 snap-start
    "
  />
);

const GlassArrow = ({ side = "left", onClick, show }) => {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${side}`}
      className={`hidden sm:flex absolute ${side}-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center
        rounded-full bg-white/70 backdrop-blur-md border border-gray-300
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const railRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [index, setIndex] = useState(0);

  const atStart = index === 0;
  const atEnd = index === pages - 1;

  // fetch active items
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await apiClient.get("/whats-new/active");
        if (!alive) return;
        setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(
          e?.response?.data?.message || e?.message || "Failed to load What's new."
        );
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const computePages = useCallback(() => {
    const el = railRef.current;
    if (!el) return 1;
    const count = items.length;
    if (!count) return 1;
    const total = count * STEP - GAP;
    const visible = el.clientWidth;
    return Math.max(1, Math.ceil((total - visible) / STEP) + 1);
  }, [items.length]);

  const updatePagerFromScroll = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
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
        <GlassArrow side="left" onClick={() => scrollByStep(-1)} show={!atStart} />
        <GlassArrow side="right" onClick={() => scrollByStep(1)} show={!atEnd} />

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
              <WhatsNewCard item={it} linkTo="/whats-new" />
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
