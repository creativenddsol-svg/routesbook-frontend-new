// src/components/BookingSummary.jsx
import React from "react";
import PropTypes from "prop-types";

/* Matte palette to match the pages */
const PALETTE = {
  primary: "#C74A50",   // matte red
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",
};

const Pill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: PALETTE.pillBg, color: PALETTE.text }}
  >
    {children}
  </span>
);

const getReadableDate = (dateString) => {
  if (!dateString) return "N/A";
  const [year, month, day] = dateString.split("-").map(Number);
  // Use UTC to prevent timezone off-by-one errors
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const BookingSummary = ({
  bus,
  selectedSeats,
  date,
  basePrice,
  convenienceFee,
  totalPrice,
  onProceed,
  boardingPoint,
  droppingPoint,
}) => {
  const hasSelection =
    selectedSeats.length > 0 && boardingPoint && droppingPoint;

  return (
    <div
      className="rounded-2xl p-5 h-full flex flex-col shadow-sm"
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4 pb-3"
           style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold truncate" style={{ color: PALETTE.text }}>
            Booking Summary
          </h3>
          <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
            {bus.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: PALETTE.textSubtle }}>
            {bus.from} → {bus.to}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <Pill>{getReadableDate(date)}</Pill>
          {bus.busType ? <Pill>{bus.busType}</Pill> : null}
          <Pill>
            {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""}
          </Pill>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow space-y-4">
        {/* Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
              Boarding Point
            </p>
            {boardingPoint ? (
              <p className="font-medium" style={{ color: PALETTE.text }}>
                <span className="tabular-nums font-semibold">{boardingPoint.time}</span>{" "}
                <span className="text-xs" style={{ color: PALETTE.textSubtle }}>at</span>{" "}
                {boardingPoint.point}
              </p>
            ) : (
              <p className="text-sm" style={{ color: PALETTE.primary }}>
                Please select a point
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
              Dropping Point
            </p>
            {droppingPoint ? (
              <p className="font-medium" style={{ color: PALETTE.text }}>
                <span className="tabular-nums font-semibold">{droppingPoint.time}</span>{" "}
                <span className="text-xs" style={{ color: PALETTE.textSubtle }}>at</span>{" "}
                {droppingPoint.point}
              </p>
            ) : (
              <p className="text-sm" style={{ color: PALETTE.primary }}>
                Please select a point
              </p>
            )}
          </div>
        </div>

        {/* Divider */}
        <hr className="my-1" style={{ borderColor: PALETTE.border }} />

        {/* Selected Seats */}
        <div>
          <div className="mb-2">
            <h4 className="font-semibold text-sm" style={{ color: PALETTE.text }}>
              Selected Seats ({selectedSeats.length})
            </h4>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <Pill key={seat}>Seat {seat}</Pill>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
              No seats selected
            </p>
          )}
        </div>

        {/* Divider */}
        <hr className="my-1" style={{ borderColor: PALETTE.border }} />
      </div>

      {/* Footer with Price and Button */}
      <div className="mt-auto pt-4">
        {/* Price Breakdown */}
        {selectedSeats.length > 0 && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between" style={{ color: PALETTE.textSubtle }}>
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {basePrice?.toFixed(2) || "0.00"}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: PALETTE.textSubtle }}>
              <span>Convenience Fee</span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {convenienceFee?.toFixed(2) || "0.00"}
              </span>
            </div>
            <hr className="my-2" style={{ borderColor: PALETTE.border }} />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.text }}>
                Total
              </span>
              <span className="tabular-nums font-extrabold" style={{ color: PALETTE.text }}>
                Rs. {totalPrice?.toFixed(2) || "0.00"}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onProceed}
          disabled={!hasSelection}
          className="w-full px-6 py-3 text-white font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-base"
          style={{
            background: hasSelection ? PALETTE.primary : "#9CA3AF",
          }}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

Pill.propTypes = {
  children: PropTypes.node.isRequired,
};

BookingSummary.propTypes = {
  bus: PropTypes.object.isRequired,
  selectedSeats: PropTypes.arrayOf(PropTypes.string).isRequired,
  date: PropTypes.string.isRequired,
  basePrice: PropTypes.number.isRequired,
  convenienceFee: PropTypes.number.isRequired,
  totalPrice: PropTypes.number.isRequired,
  onProceed: PropTypes.func.isRequired,
  boardingPoint: PropTypes.object,
  droppingPoint: PropTypes.object,
};

export default BookingSummary;
