// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* ---------- Matte palette (selected = blue) ---------- */
const PALETTE = {
  blue: "#2DC492",
  blueBorder: "#22A57D",
  blueHoverTint: "#D8FFF0",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  male: "#6D5BD0",
  maleBorder: "#5B4FCF",
  female: "#E05B88",
  femaleBorder: "#D04B78",
};

/* ---------- Single Seat ---------- */
const Seat = ({
  seat,
  isBooked,
  isLocked,
  isSelected,
  gender,
  onClick,
  title,
}) => {
  const innerSeatClasses = isBooked
    ? gender === "F"
      ? "bg-[#E05B88] text-white border-[#D04B78] cursor-not-allowed"
      : "bg-[#6D5BD0] text-white border-[#5B4FCF] cursor-not-allowed"
    : isLocked
    ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] cursor-not-allowed"
    : isSelected
    ? "bg-[#2DC492] text-white border-[#22A57D] shadow-sm"
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#D8FFF0] hover:border-[#2DC492]";

  const disabled = isBooked || isLocked;

  const bottomBarColor = isBooked
    ? gender === "F"
      ? "bg-[#D04B78]"
      : "bg-[#5B4FCF]"
    : isLocked
    ? "bg-[#FCA5A5]"
    : isSelected
    ? "bg-[#22A57D]"
    : "bg-gray-300";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={`Seat ${seat}`}
      aria-pressed={isSelected}
      disabled={disabled}
      className="
        relative group select-none
        w-12 h-12 sm:w-10 sm:h-10
        rounded-xl flex items-center justify-center
        transition-transform duration-100
        active:scale-95 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#2DC492]/60
        disabled:opacity-90
      "
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span
        className={`
          absolute inset-1 sm:inset-[3px]
          border-2 rounded-lg
          flex flex-col items-center justify-between
          font-semibold
          text-[11px] sm:text-xs
          ${innerSeatClasses}
        `}
      >
        <span className="flex-1 flex items-center justify-center">
          {isBooked ? (gender === "F" ? <FaFemale /> : <FaMale />) : seat}
        </span>
        <span
          aria-hidden="true"
          className={`w-5 sm:w-4 h-1 rounded-t-sm self-center ${bottomBarColor}`}
        />
      </span>
    </button>
  );
};

Seat.propTypes = {
  seat: PropTypes.string.isRequired,
  isBooked: PropTypes.bool.isRequired,
  isLocked: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  gender: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

/* ---------- Layout ---------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats,
  selectedSeats,
  onSeatClick,
  bookedSeatGenders = {}, // ✅ default to safe empty object
}) => {
  const layoutAsStrings = Array.isArray(seatLayout)
    ? seatLayout.map(String)
    : [];

  const is49Seater = layoutAsStrings.length === 49;
  const is37Seater = layoutAsStrings.length === 37;

  const bookedSet = new Set(
    (Array.isArray(bookedSeats) ? bookedSeats : []).map(String)
  );
  const selectedSet = new Set(
    (Array.isArray(selectedSeats) ? selectedSeats : []).map(String)
  );

  const getAdjacentSeatInfo = (seatNumber, layoutGrid) => {
    for (const row of layoutGrid) {
      const idx = row.indexOf(seatNumber);
      if (idx !== -1) {
        if (idx > 0 && row[idx - 1] !== null) {
          const neighborSeat = String(row[idx - 1]);
          if (bookedSeatGenders?.[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        if (idx < row.length - 1 && row[idx + 1] !== null) {
          const neighborSeat = String(row[idx + 1]);
          if (bookedSeatGenders?.[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        return null;
      }
    }
    return null;
  };

  const getSeatStatus = (seat) => {
    const seatStr = String(seat);
    const isBooked = !!bookedSeatGenders?.[seatStr];
    const isLocked =
      bookedSet.has(seatStr) &&
      !bookedSeatGenders?.[seatStr] &&
      !selectedSet.has(seatStr);

    return {
      isBooked,
      isLocked,
      isSelected: selectedSet.has(seatStr),
      gender: isBooked ? bookedSeatGenders?.[seatStr] : null,
    };
  };

  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        className="flex justify-center items-center gap-x-2 sm:gap-x-2"
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            return (
              <div
                key={`aisle-${rowIndex}-${i}`}
                className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
                style={{ opacity: 0 }}
              />
            );
          }
          const seat = String(seatNumber);
          if (!layoutAsStrings.includes(seat)) {
            return (
              <div
                key={`placeholder-${rowIndex}-${i}`}
                className="w-12 h-12 sm:w-10 sm:h-10"
              />
            );
          }

          const seatStatus = getSeatStatus(seat);
          let tooltipTitle = "";
          if (
            !seatStatus.isBooked &&
            !seatStatus.isLocked &&
            !seatStatus.isSelected
          ) {
            const adj = getAdjacentSeatInfo(seatNumber, layoutGrid);
            if (adj)
              tooltipTitle = `Adjacent seat booked by a ${
                adj === "F" ? "Female" : "Male"
              }`;
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
      const base = [
        [1, 2, null, 3, 4],
        [5, 6, null, 7, 8],
        [9, 10, null, 11, 12],
        [13, 14, null, 15, 16],
        [17, 18, null, 19, 20],
        [21, 22, null, 23, 24],
        [25, 26, null, 27, 28],
        [29, 30, null, 31, 32],
      ];
      return [...base, [33, 34, 35, 36, 37]];
    }

    return [];
  };

  const layoutGrid = getLayoutGrid();

  return (
    <div
      className="p-3 sm:p-4 rounded-xl overflow-x-auto"
      style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header */}
      <div className="relative flex justify-between items-center mb-3 sm:mb-4 px-2 sm:px-4">
        <span
          className="font-bold text-[11px] sm:text-sm uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Front
        </span>
        <svg
          className="w-7 h-7 sm:w-10 sm:h-10"
          style={{ color: "#9CA3AF" }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
          <line x1="12" y1="22" x2="12" y2="18"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="20.39" y1="15.39" x2="17.5" y2="14"></line>
          <line x1="6.5" y1="10" x2="3.61" y2="8.61"></line>
          <line x1="20.39" y1="8.61" x2="17.5" y2="10"></line>
          <line x1="6.5" y1="14" x2="3.61" y2="15.39"></line>
        </svg>
      </div>

      {/* Seat grid */}
      <div className="space-y-2 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center" style={{ color: PALETTE.blue }}>
            Unsupported seat layout.
          </p>
        )}
      </div>

      {/* Footer */}
      <div
        className="font-bold text-[11px] sm:text-sm uppercase tracking-wider text-center mt-3 sm:mt-4"
        style={{ color: PALETTE.textSubtle }}
      >
        Rear
      </div>
    </div>
  );
};

SeatLayout.propTypes = {
  seatLayout: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  bookedSeats: PropTypes.array.isRequired,
  selectedSeats: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ).isRequired,
  onSeatClick: PropTypes.func.isRequired,
  // was required before; now optional because page may not pass it
  bookedSeatGenders: PropTypes.object,
};

SeatLayout.defaultProps = {
  bookedSeatGenders: {}, // ✅ ensure safe access like bookedSeatGenders['1']
};

export default SeatLayout;
