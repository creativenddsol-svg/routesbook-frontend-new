// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* --------- Matte palette (aligned with ConfirmBooking) --------- */
const PALETTE = {
  surface: "#FFFFFF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",

  // Selected / hovers
  blue: "#4C6EF5",
  blueBorder: "#3F5ED8",
  blueHoverTint: "#EEF2FF",

  // Booked by gender
  violet: "#6D5BD0",
  violetBorder: "#5B4FCF",
  pink: "#E05B88",
  pinkBorder: "#D04B78",
};

/* --------- Small UI atoms --------- */
const Pill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: PALETTE.pillBg, color: PALETTE.text }}
  >
    {children}
  </span>
);

Pill.propTypes = { children: PropTypes.node.isRequired };

/* --------- Single seat (accessible) --------- */
const Seat = ({ seat, isBooked, isSelected, gender, onClick, title }) => {
  const base =
    "flex items-center justify-center font-semibold border-2 rounded-lg transition-all duration-150 select-none w-8 h-8 text-xs sm:w-10 sm:h-10 sm:text-sm focus:outline-none";

  // states
  const cls = isBooked
    ? gender === "F"
      ? "bg-[#E05B88] text-white border-[#D04B78] cursor-not-allowed"
      : "bg-[#6D5BD0] text-white border-[#5B4FCF] cursor-not-allowed"
    : isSelected
    ? "bg-[#4C6EF5] text-white border-[#3F5ED8] shadow-sm scale-105 cursor-pointer"
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-[#4C6EF5] cursor-pointer";

  return (
    <button
      type="button"
      disabled={isBooked}
      aria-pressed={isSelected}
      aria-label={isBooked ? `Seat ${seat} booked` : `Seat ${seat}`}
      title={title}
      onClick={!isBooked ? onClick : undefined}
      className={`${base} ${cls}`}
    >
      {isBooked ? (gender === "F" ? <FaFemale /> : <FaMale />) : seat}
    </button>
  );
};

Seat.propTypes = {
  seat: PropTypes.string.isRequired,
  isBooked: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  gender: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

/* --------- Layout --------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats, // kept for API compatibility (not used directly)
  selectedSeats,
  onSeatClick,
  bookedSeatGenders,
}) => {
  const is49Seater = seatLayout.length === 49;
  const is37Seater = seatLayout.length === 37;

  const getAdjacentSeatInfo = (seatNumber, layoutGrid) => {
    for (const row of layoutGrid) {
      const seatIndex = row.indexOf(seatNumber);
      if (seatIndex !== -1) {
        if (seatIndex > 0 && row[seatIndex - 1] !== null) {
          const neighborSeat = String(row[seatIndex - 1]);
          if (bookedSeatGenders[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        if (seatIndex < row.length - 1 && row[seatIndex + 1] !== null) {
          const neighborSeat = String(row[seatIndex + 1]);
          if (bookedSeatGenders[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        return null;
      }
    }
    return null;
  };

  const getSeatStatus = (seat) => {
    const isBooked = !!bookedSeatGenders[seat];
    return {
      isBooked,
      isSelected: selectedSeats.includes(seat),
      gender: isBooked ? bookedSeatGenders[seat] : null,
    };
  };

  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      <div key={`row-${rowIndex}`} className="flex justify-center items-center gap-x-1.5 sm:gap-x-2">
        {row.map((seatNumber, colIndex) => {
          if (seatNumber === null) {
            // aisle spacer
            return <div key={`aisle-${rowIndex}-${colIndex}`} className="w-6 h-8 sm:w-10 sm:h-10" />;
          }
          const seat = String(seatNumber);
          if (!seatLayout.includes(seat)) {
            return <div key={`placeholder-${seat}`} className="w-8 h-8 sm:w-10 sm:h-10" />;
          }

          const seatStatus = getSeatStatus(seat);
          let tooltipTitle = "";
          if (!seatStatus.isBooked && !seatStatus.isSelected) {
            const neighbor = getAdjacentSeatInfo(seatNumber, layoutGrid);
            if (neighbor) tooltipTitle = `Adjacent seat booked by a ${neighbor === "F" ? "Female" : "Male"}`;
          }

          return (
            <Seat
              key={seat}
              seat={seat}
              {...seatStatus}
              onClick={() => onSeatClick(seat)}
              title={tooltipTitle}
            />
          );
        })}
      </div>
    ));

  const getLayoutGrid = () => {
    if (is49Seater) {
      const grid = [];
      for (let i = 0; i < 11; i++) {
        grid.push([i * 4 + 1, i * 4 + 2, null, i * 4 + 3, i * 4 + 4]);
      }
      grid.push([45, 46, 47, 48, 49]);
      return grid;
    }
    if (is37Seater) {
      return [
        [1, 2, null, 3, 4],
        [5, 6, null, 7, 8],
        [9, 10, null, 11, 12],
        [13, 14, null, 15, 16],
        [17, 18, null, 19, 20],
        [21, 22, null, 23, 24],
        [25, 26, null, 27, 28],
        [29, 30, null, 31, 32],
        [33, 34, 35, 36, 37],
      ];
    }
    return [];
  };

  const layoutGrid = getLayoutGrid();

  return (
    <div
      className="rounded-2xl p-4 sm:p-5"
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header: title + legend (matches ConfirmBooking chips) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h3 className="text-base sm:text-lg font-semibold" style={{ color: PALETTE.text }}>
          Seat Layout
        </h3>
        <div className="flex flex-wrap gap-2">
          <Pill>Available</Pill>
          <Pill>
            <span
              className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
              style={{ background: PALETTE.blue }}
            />
            Selected
          </Pill>
          <Pill>
            <span
              className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
              style={{ background: PALETTE.violet }}
            />
            Booked (Male)
          </Pill>
          <Pill>
            <span
              className="inline-block w-2 h-2 rounded-sm mr-1.5 align-middle"
              style={{ background: PALETTE.pink }}
            />
            Booked (Female)
          </Pill>
        </div>
      </div>

      {/* Front mark */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span
          className="font-bold text-xs uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Front
        </span>
        <div className="h-px flex-1 mx-2" style={{ background: PALETTE.border }} />
      </div>

      {/* Grid */}
      <div className="space-y-1 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center" style={{ color: PALETTE.textSubtle }}>
            Unsupported seat layout.
          </p>
        )}
      </div>

      {/* Rear mark */}
      <div className="flex items-center justify-between mt-4 px-1">
        <div className="h-px flex-1 mx-2" style={{ background: PALETTE.border }} />
        <span
          className="font-bold text-xs uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Rear
        </span>
      </div>
    </div>
  );
};

SeatLayout.propTypes = {
  seatLayout: PropTypes.arrayOf(PropTypes.string).isRequired,
  bookedSeats: PropTypes.array.isRequired,
  selectedSeats: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSeatClick: PropTypes.func.isRequired,
  bookedSeatGenders: PropTypes.object.isRequired,
};

export default SeatLayout;
