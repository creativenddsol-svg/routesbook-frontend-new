// src/components/SpecialNoticesCarousel.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import apiClient from "../api"; // ✅ use shared client (baseURL includes /api)
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { Link } from "react-router-dom";
import SpecialNoticeCard, { SpecialNoticeSkeleton } from "./SpecialNoticeCard";

const SpecialNoticesCarousel = ({
  title = "Special Notices",
  aspect = "4:3",
  api = "/special-notices", // ✅ removed /api prefix
}) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const trackRef = useRef(null);
  const slideRefs = useRef([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get(api); // ✅ use apiClient
        if (mounted) setItems(res.data || []);
      } catch (e) {
        console.error("Failed to load special notices", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [api]);

  slideRefs.current = useMemo(
    () =>
      Array(items.length)
        .fill(null)
        .map((_, i) => slideRefs.current[i] || null),
    [items.length]
  );

  const scrollTo = (idx) => {
    const node = slideRefs.current[idx];
    if (node)
      node.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
  };

  const onPrev = () => {
    const next = Math.max(0, activeIndex - 1);
    setActiveIndex(next);
    scrollTo(next);
  };
  const onNext = () => {
    const next = Math.min(items.length - 1, activeIndex + 1);
    setActiveIndex(next);
    scrollTo(next);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const w = el.clientWidth;
      const idx = Math.round(el.scrollLeft / w);
      setActiveIndex(Math.min(items.length - 1, Math.max(0, idx)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold">{title}</h2>

        <Link
          to="/special-notices"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          View more
        </Link>

        {items.length > 1 && (
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <button
              onClick={onPrev}
              disabled={activeIndex === 0}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              aria-label="Previous"
            >
              <FaChevronLeft />
            </button>
            <button
              onClick={onNext}
              disabled={activeIndex === items.length - 1}
              className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
              aria-label="Next"
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="relative w-full overflow-x-auto no-scrollbar snap-x snap-mandatory"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="flex">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="min-w-full snap-start px-1">
                  <SpecialNoticeSkeleton />
                </div>
              ))
            : items.map((n, i) => (
                <div
                  key={n._id || i}
                  ref={(el) => (slideRefs.current[i] = el)}
                  className="min-w-full snap-start px-1"
                >
                  {/* ✅ Always opens the full list page */}
                  <SpecialNoticeCard
                    notice={n}
                    aspect={aspect}
                    linkTo="/special-notices"
                  />
                </div>
              ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {items.map((_, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={i}
                onClick={() => {
                  setActiveIndex(i);
                  scrollTo(i);
                }}
                className={[
                  "h-2.5 rounded-full transition-all duration-200",
                  active
                    ? "w-6 bg-gray-900"
                    : "w-2.5 bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
                aria-label={`Go to slide ${i + 1}`}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SpecialNoticesCarousel;
