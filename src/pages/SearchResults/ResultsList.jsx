import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { FaBus, FaClock, FaChevronDown, FaChevronUp } from "react-icons/fa";

/**
 * Props:
 * - bus: Bus object (required)
 * - availability: { available?: number, bookedSeats?: string[], seatGenderMap?: object }
 * - from, to: strings (for fare lookup)
 * - isExpanded: boolean
 * - onToggleExpand: (bus) => void
 * - renderExtras?: (bus) => ReactNode   // injected expanded content
 * - palette?: override colors (optional)
 */
export default function ResultCard({
  bus,
  availability = {},
  from,
  to,
  isExpanded = false,
  onToggleExpand,
  renderExtras,
  palette,
}) {
  const PALETTE = palette || {
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

  const getDisplayPrice = (busObj, fromCity, toCity) => {
    if (busObj?.fares && Array.isArray(busObj.fares)) {
      const f = busObj.fares.find(
        (fare) => fare.boardingPoint === fromCity && fare.droppingPoint === toCity
      );
      if (f?.price != null) return f.price;
    }
    return busObj?.price ?? 0;
  };

  const { key, price, seatsLeft } = useMemo(() => {
    const k = `${bus?._id}-${bus?.departureTime}`;
    const p = getDisplayPrice(bus, from, to);
    const left =
      typeof availability.available === "number"
        ? availability.available
        : Array.isArray(bus?.seatLayout)
        ? Math.max(0, bus.seatLayout.flat().filter((s) => !s?.booked).length)
        : null;
    return { key: k, price: p, seatsLeft: left };
  }, [bus, availability, from, to]);

  return (
    <motion.div
      key={key}
      className="bg-white rounded-2xl p-6 border border-gray-300"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
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
          <div
            className="text-xs flex items-center gap-1 px-2 py-1 rounded-full"
            style={{ background: "#F3F4F6", color: PALETTE.textLight }}
          >
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

      {/* Expanded content */}
      {isExpanded && renderExtras && <div className="mt-5">{renderExtras(bus)}</div>}
    </motion.div>
  );
}
