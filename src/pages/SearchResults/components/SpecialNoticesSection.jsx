// src/pages/SearchResults/components/SpecialNoticesSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSearchCore } from "../_core";
import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../../../components/SpecialNoticeCard";

export default function SpecialNoticesSection() {
  const { specialNotices, noticesLoading } = useSearchCore();

  // Render skeletons while loading, otherwise the fetched notices
  const itemsToRender = useMemo(
    () => (noticesLoading ? Array.from({ length: 4 }) : specialNotices),
    [noticesLoading, specialNotices]
  );

  const trackRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [activePage, setActivePage] = useState(0);

  // Compute number of pages from scroll width vs container width
  const computePages = () => {
    const el = trackRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(Math.min(total - 1, Math.max(0, idx)));
  };

  // Recompute on load/resize or when the items change
  useEffect(() => {
    computePages();
    const onResize = () => computePages();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticesLoading, specialNotices?.length]);

  // Track active page while the user scrolls the row
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

  // Nothing to show once loaded and there are no notices
  if (!noticesLoading && (!specialNotices || specialNotices.length === 0)) {
    return null;
  }

  return (
    <motion.div
      className="mb-8 relative"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Horizontal, snapping track */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 lg:pb-0"
        style={{ scrollBehavior: "smooth" }}
      >
        {itemsToRender.map((item, index) => (
          <div
            key={noticesLoading ? `skeleton-${index}` : item._id}
            className="flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/4 xl:w-1/4 snap-start p-2"
          >
            {noticesLoading ? (
              <SpecialNoticeSkeleton />
            ) : (
              <SpecialNoticeCard notice={item} linkTo="/special-notices" />
            )}
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-center gap-2">
          {Array.from({ length: pages }).map((_, i) => {
            const active = i === activePage;
            return (
              <button
                key={i}
                onClick={() => goToPage(i)}
                className={[
                  "h-2.5 rounded-full transition-all duration-200",
                  active ? "w-6 bg-gray-900" : "w-2.5 bg-gray-300 hover:bg-gray-400",
                ].join(" ")}
                aria-label={`Go to page ${i + 1}`}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
