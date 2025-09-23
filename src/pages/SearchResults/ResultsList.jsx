import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaClock,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

/**
 * Props:
 * - buses: Array<Bus>
 * - availability: Record<`${id}-${time}`, { available, bookedSeats, seatGenderMap }>
 * - from, to: string (for fare lookup)
 * - page, perPage: numbers (used upstream; list just renders what it gets)
 * - loading: boolean (if true and buses empty, show skeletons)
 * - expandedKey: string | null (`${bus._id}-${bus.departureTime}`)
 * - onToggleExpand: (bus) => void
 * - renderCardExtras?: (bus) => ReactNode  // content when a card is expanded
 */

const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F0F2F5",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  green: "#28a745",
  yellow: "#FFC107",
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const calculateDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "-";
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  let start = sh * 60 + sm;
  let end = eh * 60 + em;
  if (end < start) end += 24 * 60; // overnight
  const dur = end - start;
  const h = Math.floor(dur / 60);
  const m = dur % 60;
  return `${h}h ${m}m`;
};

const getDisplayPrice = (bus, from, to) => {
  if (bus?.fares && Array.isArray(bus.fares)) {
    const f = bus.fares.find(
      (fare) => fare.boardingPoint === from && fare.droppingPoint === to
    );
    if (f?.price != null) return f.price;
  }
  return bus?.price ?? 0;
};

const BusCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 border border-gray-300 animate-pulse">
    <div className="flex justify-between gap-4">
      <div className="flex-1">
        <div className="h-5 w-2/3 bg-gray-200 rounded mb-3" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
      </div>
      <div className="h-10 w-24 rounded-lg bg-gray-200" />
    </div>
    <div className="border-t border-dashed my-5 border-gray-200" />
    <div className="flex items-center justify-between">
      <div className="h-8 w-28 bg-gray-200 rounded-full" />
      <div className="h-10 w-32 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

export default function ResultsList({
  buses = [],
  availability = {},
  from,
  to,
  loading,
  expandedKey,
  onToggleExpand,
  renderCardExtras,
}) {
  const empty = !loading && buses.length === 0;

  const list = useMemo(() => buses, [buses]);

  if (loading && buses.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <BusCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">
        <p className="text-lg font-semibold" style={{ color: PALETTE.textDark }}>
          No buses to show.
        </p>
        <p className="text-sm mt-1" style={{ color: PALETTE.textLight }}>
          Try changing your filters or date.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {list.map((bus) => {
        const key = `${bus._id}-${bus.departureTime}`;
        const av = availability[key] || {};
        const price = getDisplayPrice(bus, from, to);
        const seatsLeft =
          typeof av.available === "number"
            ? av.available
            : Array.isArray(bus?.seatLayout)
            ? Math.max(0, bus.seatLayout.flat().filter((s) => !s?.booked).length)
            : null;

        const isExpanded = expandedKey === key;

        return (
          <motion.div
            key={key}
            variants={itemVariants}
            className="bg-white rounded-2xl p-6 border border-gray-300"
          >
            {/* Top row: title + price */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <FaBus className="text-gray-500" />
                  <h3
                    className="text-lg font-bold truncate"
                    style={{ color: PALETTE.textDark }}
                    title={bus?.name || "Bus"}
                  >
                    {bus?.name || "Bus"}
                  </h3>
                </div>
                <div className="mt-1 text-sm" style={{ color: PALETTE.textLight }}>
                  {bus?.busType || "—"}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div
                  className="text-2xl font-extrabold leading-none"
                  style={{ color: PALETTE.textDark }}
                >
                  ₹ {price}
                </div>
                {typeof seatsLeft === "number" && (
                  <div className="text-xs mt-1 font-medium">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: seatsLeft > 5 ? "#E7F9ED" : "#FFF4E5",
                        color: seatsLeft > 5 ? PALETTE.green : PALETTE.yellow,
                      }}
                    >
                      {seatsLeft} seats left
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed my-5 border-gray-200" />

            {/* Times & duration */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-base font-semibold" style={{ color: PALETTE.textDark }}>
                  {bus?.departureTime}
                </div>
                <span className="text-sm" style={{ color: PALETTE.textLight }}>
                  →
                </span>
                <div className="text-base font-semibold" style={{ color: PALETTE.textDark }}>
                  {bus?.arrivalTime}
                </div>
                <div className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
                     style={{ background: "#F3F4F6", color: PALETTE.textLight }}>
                  <FaClock /> {calculateDuration(bus?.departureTime, bus?.arrivalTime)}
                </div>
              </div>

              <button
                onClick={() => onToggleExpand && onToggleExpand(bus)}
                className="px-4 py-2 rounded-lg font-bold text-white flex items-center gap-2"
                style={{ background: PALETTE.accentBlue }}
                type="button"
              >
                {isExpanded ? (
                  <>
                    <FaChevronUp /> Hide details
                  </>
                ) : (
                  <>
                    <FaChevronDown /> Select seats
                  </>
                )}
              </button>
            </div>

            {/* Expanded content (seat layout, points, summary) */}
            {isExpanded && renderCardExtras && (
              <div className="mt-5">{renderCardExtras(bus)}</div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}
