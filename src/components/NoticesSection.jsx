// src/components/NoticesSection.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import apiClient from "../api";
import NoticeCard from "./NoticeCard";
import { Link } from "react-router-dom";

/** Layout constants */
const CARD_W = 340; // desktop/large
const GAP = 12;
const STEP = CARD_W + GAP;

const Skeleton = () => (
  <div className="w-[86vw] max-w-[360px] sm:w-[340px] h-[210px] rounded-3xl ring-1 ring-black/5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] animate-pulse shrink-0 snap-start" />
);

const GlassArrow = ({ side = "left", onClick, show }) => {
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Scroll ${side}`}
      className={`hidden lg:flex absolute ${side}-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 items-center justify-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 hover:bg-white/90 active:scale-95 transition`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
};

const NoticesSection = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const railRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [index, setIndex] = useState(0);

  const atStart = index === 0;
  const atEnd = index === pages - 1;

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await apiClient.get("/notices/active");
        const data = Array.isArray(res.data) ? res.data : [];
        if (live) setItems(data);
      } catch (e) {
        if (live)
          setErr(
            (e?.response?.data?.message) || "Failed to load notices."
          );
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => (live = false);
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
    setIndex((p) => Math.max(0, Math.min(current, pages - 1)));
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
    (dir) => scrollToIndex(index + dir),
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
          <h2 className="text-[22px] sm:text-2xl font-bold text-gray-900">Offers For You</h2>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[...Array(4)].map((_, i) => <Skeleton key={i} />)}
        </div>
      </section>
    );
  }
  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-0 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-2 px-4 sm:px-0">
        <h4 className="text-[20px] sm:text-2xl font-bold text-gray-900">Offers For You</h4>
        <Link to="/notices" className="text-sm font-semibold text-blue-600 hover:underline">
          View more
        </Link>
      </div>

      <div className="relative">
        {/* Desktop glass arrows only */}
        <GlassArrow side="left" onClick={() => scrollByStep(-1)} show={!atStart} />
        <GlassArrow side="right" onClick={() => scrollByStep(1)} show={!atEnd} />

        {/* App-like full-bleed rail on mobile */}
        <div
          ref={railRef}
          className="
            flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1
            px-4 sm:px-0
            [scrollbar-width:none] [-ms-overflow-style:none]
          "
          style={{ WebkitOverflowScrolling: "touch" }}
          onScroll={updatePagerFromScroll}
        >
          {/* hide scrollbar (WebKit) */}
          <style>{`.hide-scrollbar::-webkit-scrollbar{display:none}`}</style>
          {items.map((n) => (
            <div key={n._id} className="shrink-0 snap-start">
              <NoticeCard notice={n} linkTo="/notices" />
            </div>
          ))}
        </div>

        {/* Pager dots (pill style) */}
        <div className="mt-3 flex w-full items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? "w-6 bg-gray-900" : "w-2.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default NoticesSection;
