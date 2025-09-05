// src/components/BookingSummary.jsx
import React from "react";
import PropTypes from "prop-types";

/* -------- Matte palette -------- */
const PALETTE = {
  primary: "#C74A50",      // matte red
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",

  // New soft pills (to match ConfirmBooking/SearchResults)
  datePillBg: "#FFF9DB",   // very light yellow
  acPillBg:   "#EAF5FF",   // very light blue
  seatPillBg: "#FFE9EC",   // very light red
  acText:     "#1D4ED8",   // blue text for AC
};

/* -------- UI atoms -------- */
const Pill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: PALETTE.pillBg, color: PALETTE.text }}
  >
    {children}
  </span>
);

// Specialized pills
const DatePill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
    style={{ background: PALETTE.datePillBg, color: PALETTE.text }}
  >
    {children}
  </span>
);

const AcPill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold"
    style={{ background: PALETTE.acPillBg, color: PALETTE.acText }}
  >
    {children}
  </span>
);

const SeatPill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
    style={{ background: PALETTE.seatPillBg, color: PALETTE.primary }}
  >
    {children}
  </span>
);

const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
    {children}
  </span>
);

/* -------- Helpers -------- */
const getReadableDate = (dateString) => {
  if (!dateString) return "N/A";
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d)); // UTC avoids off-by-one
  return dt.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
};

const money = (n) =>
  (typeof n === "number" ? n : 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/* ================= BookingSummary ================= */
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
  const hasSelection = selectedSeats.length > 0 && !!boardingPoint && !!droppingPoint;
  const busType = bus?.busType || "";
  const isAC = /(^|\s)ac(\s|$)/i.test(busType); // true if type contains "AC"

  return (
    <div
      className="rounded-2xl p-5 h-full flex flex-col shadow-sm"
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header */}
      <div className="mb-4 pb-3" style={{ borderBottom: `1px solid ${PALETTE.border}` }}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold whitespace-nowrap" style={{ color: PALETTE.text }}>
            Booking Summary
          </h3>
        </div>

        {/* Bus meta */}
        <div className="mt-2">
          {bus?.name ? (
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium" style={{ color: PALETTE.text }}>
                {bus.name}
              </p>

              {/* AC pill (icon removed) or generic type pill */}
              {isAC ? (
                <AcPill>AC</AcPill>
              ) : busType ? (
                <Pill>{busType}</Pill>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs" style={{ color: PALETTE.textSubtle }}>
            {bus?.from} → {bus?.to}
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex-grow space-y-4">
        {/* Points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <Label>Boarding Point</Label>
            {boardingPoint ? (
              <p className="font-medium" style={{ color: PALETTE.text }}>
                <span className="tabular-nums font-semibold">{boardingPoint.time}</span>{" "}
                <span className="text-xs" style={{ color: PALETTE.textSubtle }}>
                  at
                </span>{" "}
                {boardingPoint.point}
              </p>
            ) : (
              <p className="text-sm" style={{ color: PALETTE.primary }}>
                Please select a point
              </p>
            )}
          </div>

          <div>
            <Label>Dropping Point</Label>
            {droppingPoint ? (
              <p className="font-medium" style={{ color: PALETTE.text }}>
                <span className="tabular-nums font-semibold">{droppingPoint.time}</span>{" "}
                <span className="text-xs" style={{ color: PALETTE.textSubtle }}>
                  at
                </span>{" "}
                {droppingPoint.point}
              </p>
            ) : (
              <p className="text-sm" style={{ color: PALETTE.primary }}>
                Please select a point
              </p>
            )}
          </div>
        </div>

        <hr className="my-1" style={{ borderColor: PALETTE.border }} />

        {/* Seats */}
        <div>
          <div className="mb-2">
            <h4 className="font-semibold text-sm" style={{ color: PALETTE.text }}>
              Selected Seats ({selectedSeats.length})
            </h4>
          </div>
          {selectedSeats.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <SeatPill key={seat}>Seat {seat}</SeatPill>
              ))}
            </div>
          ) : (
            <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
              No seats selected
            </p>
          )}
        </div>

        <hr className="my-1" style={{ borderColor: PALETTE.border }} />

        {/* Date at the bottom-right of the details card */}
        <div className="flex justify-end">
          <DatePill>{getReadableDate(date)}</DatePill>
        </div>
      </div>

      {/* Footer (prices + CTA) */}
      <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${PALETTE.border}` }}>
        {selectedSeats.length > 0 && (
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between" style={{ color: PALETTE.textSubtle }}>
              <span>Subtotal</span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {money(basePrice)}
              </span>
            </div>
            <div className="flex justify-between" style={{ color: PALETTE.textSubtle }}>
              <span>Convenience Fee</span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {money(convenienceFee)}
              </span>
            </div>
            <hr className="my-2" style={{ borderColor: PALETTE.border }} />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.text }}>
                Total
              </span>
              <span className="tabular-nums font-extrabold" style={{ color: PALETTE.text }}>
                Rs. {money(totalPrice)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={onProceed}
          disabled={!hasSelection}
          className="w-full px-6 py-3 text-white font-semibold rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed text-base"
          style={{ background: hasSelection ? PALETTE.primary : "#9CA3AF" }}
        >
          Proceed to Payment
        </button>
      </div>
    </div>
  );
};

/* -------- PropTypes -------- */
Pill.propTypes = { children: PropTypes.node.isRequired };
DatePill.propTypes = { children: PropTypes.node.isRequired };
AcPill.propTypes = { children: PropTypes.node.isRequired };
SeatPill.propTypes = { children: PropTypes.node.isRequired };

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
