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
  <div className="w-full h-40 rounded-xl bg-gray-100 animate-pulse" />
);

const GlassArrow = ({ side = "left", onClick, show }) => {
  // no arrows needed in grid layout, but kept to not break code
  if (!show) return null;
  return null;
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
          setErr(e?.response?.data?.message || "Failed to load notices.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => (live = false);
  }, []);

  const computePages = useCallback(() => {
    return 1; // grid layout → single page
  }, []);

  const updatePagerFromScroll = useCallback(() => {}, []);
  const scrollToIndex = useCallback(() => {}, []);
  const scrollByStep = useCallback(() => {}, []);

  useEffect(() => {
    setPages(1);
  }, [computePages]);

  if (loading) {
    return (
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Bus Booking Discount Offers
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} />
          ))}
        </div>
      </section>
    );
  }
  if (err || !Array.isArray(items) || items.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12">
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

      {/* Grid cards layout */}
      <div
        ref={railRef}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      >
        {items.map((n) => (
          <div
            key={n._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <NoticeCard notice={n} linkTo="/notices" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default NoticesSection;
