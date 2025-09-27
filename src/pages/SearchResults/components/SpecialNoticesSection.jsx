// src/pages/SearchResults/components/SpecialNoticesSection.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "../../../api";
import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../../../components/SpecialNoticeCard";

export default function SpecialNoticesSection() {
  const [specialNotices, setSpecialNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Load notices via API (with abort + single retry)
  useEffect(() => {
    let mounted = true;
    const ac = new AbortController();

    const fetchOnce = async () => {
      try {
        const res = await apiClient.get("/special-notices", {
          signal: ac.signal,
        });
        if (!mounted) return;
        setSpecialNotices(res?.data || []);
        setError("");
      } catch (err) {
        if (!mounted || ac.signal.aborted) return;
        // One quick retry for flaky mobile networks
        try {
          const res2 = await apiClient.get("/special-notices", {
            signal: ac.signal,
          });
          if (!mounted) return;
          setSpecialNotices(res2?.data || []);
          setError("");
        } catch (err2) {
          console.error("Failed to fetch special notices", err2);
          if (!mounted) return;
          setError("Could not load special notices.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOnce();
    return () => {
      mounted = false;
      ac.abort();
    };
  }, []);

  const itemsToRender = useMemo(
    () => (loading ? Array.from({ length: 4 }) : specialNotices),
    [loading, specialNotices]
  );

  const trackRef = useRef(null);
  const [pages, setPages] = useState(1);
  const [activePage, setActivePage] = useState(0);

  const computePages = () => {
    const el = trackRef.current;
    if (!el) return;
    const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
    setPages(total);
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActivePage(Math.min(total - 1, Math.max(0, idx)));
  };

  // Recompute on load/data change + true element resize (mobile-safe)
  useEffect(() => {
    computePages();

    const onResize = () => computePages();
    window.addEventListener("resize", onResize);

    const el = trackRef.current;
    let ro;
    if (el && "ResizeObserver" in window) {
      ro = new ResizeObserver(() => computePages());
      ro.observe(el);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (ro) ro.disconnect();
    };
  }, [loading, specialNotices?.length]);

  // Update page on scroll
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

  // 🔇 If not loading and empty, show a tiny empty state instead of rendering nothing
  if (!loading && !error && (!specialNotices || specialNotices.length === 0)) {
    return (
      <div className="mb-6">
        <div className="px-2 py-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-600">
          No special notices at the moment.
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="mb-6 relative"
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
    >
      {/* Optional error banner (mobile-friendly) */}
      {error && !loading ? (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Scrollable Row */}
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-1 -mx-2 px-2"
        style={{ scrollBehavior: "smooth", WebkitOverflowScrolling: "touch" }}
      >
        {itemsToRender.map((item, index) => (
          <div
            key={loading ? `skeleton-${index}` : item?._id || `notice-${index}`}
            className="flex-shrink-0 w-4/5 sm:w-1/3 md:w-1/5 snap-start px-1.5"
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

      {/* ⬇️ Pagination dots intentionally omitted */}
    </motion.div>
  );
}
