// src/pages/SearchResults/components/SpecialNoticesSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "../../../api"; // ✅ use shared API client
import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../../../components/SpecialNoticeCard";

export default function SpecialNoticesSection() {
  const [specialNotices, setSpecialNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Load notices via API
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get("/special-notices");
        if (mounted) setSpecialNotices(res.data || []);
      } catch (err) {
        console.error("Failed to fetch special notices", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const itemsToRender = useMemo(
    () => (loading ? Array.from({ length: 4 }) : specialNotices),
    [loading, specialNotices]
  );

  const trackRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [activePage, setActivePage] = useState(0);

  // Compute pages
  const computePages = () => {
    const el = trackRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(Math.min(total - 1, Math.max(0, idx)));
  };

  useEffect(() => {
    computePages();
    const onResize = () => computePages();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [loading, specialNotices?.length]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActivePage(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const goToPage = (idx) => {
    const el = trackRef.current;
    if (!el) return;
    const clamped = Math.min(pages - 1, Math.max(0, idx));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setActivePage(clamped);
  };

  if (!loading && (!specialNotices || specialNotices.length === 0)) {
    return null;
  }

  return (
    <motion.div
      className="mb-6 relative"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Scrollable Row */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2"
        style={{ scrollBehavior: "smooth" }}
      >
        {itemsToRender.map((item, index) => (
          <div
            key={loading ? `skeleton-${index}` : item._id}
            className="flex-shrink-0 w-2/5 sm:w-1/5 snap-start px-2"
          >
            {loading ? (
              <SpecialNoticeSkeleton />
            ) : (
              <SpecialNoticeCard
                notice={item}
                linkTo="/special-notices"
                className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition"
              />
            )}
          </div>
        ))}
      </div>

      {/* Dots */}
      {pages > 1 && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const active = i === activePage;
            return (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={`h-2.5 rounded-full transition-all duration-200 ${
                  active ? "w-6 bg-gray-900" : "w-2.5 bg-gray-300 hover:bg-gray-400"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
