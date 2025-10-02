import React from "react";
import PropTypes from "prop-types";
// The original import for 'react-icons/fa' is commented out/removed to fix the compilation error
// and replaced with inline SVGs for stability in this environment.

/* ---------- SVG Icons to replace react-icons/fa ---------- */

// Male Icon (FaMale replacement)
const MaleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 448 512"
    fill="currentColor"
    className="w-3 h-3 sm:w-4 sm:h-4"
  >
    <path d="M256 64c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H128c-17.7 0-32 14.3-32 32s14.3 32 32 32H224V416c0 17.7 14.3 32 32 32s32-14.3 32-32V288H352c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V64z" />
  </svg>
);

// Female Icon (FaFemale replacement)
const FemaleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    fill="currentColor"
    className="w-3 h-3 sm:w-4 sm:h-4"
  >
    <path d="M416 256c0 6.1-5.1 11.1-11.6 12.3c35.6 23 60.1 63.8 60.1 111.4c0 88.4-71.6 160-160 160s-160-71.6-160-160c0-47.5 24.5-88.4 60.1-111.4c-6.5-1.3-11.6-6.2-11.6-12.3c0-44.2 35.8-80 80-80c.7 0 1.4 .1 2.1 .2c10.8-19.1 27.6-35.3 47.9-46.7V48c0-26.5 21.5-48 48-48s48 21.5 48 48V131.5c20.3 11.5 37.1 27.7 47.9 46.7c.7-.1 1.4-.2 2.1-.2c44.2 0 80 35.8 80 80zM320 256c0-35.3-28.7-64-64-64s-64 28.7-64 64s28.7 64 64 64s64-28.7 64-64z" />
  </svg>
);

/* ---------- Matte palette (selected = blue) ---------- */
const PALETTE = {
  blue: "#4C6EF5",
  blueBorder: "#3F5ED8",
  blueHoverTint: "#EEF2FF",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  male: "#6D5BD0",
  maleBorder: "#5B4FCF",
  female: "#E05B88",
  femaleBorder: "#D04B78",
};

/* ---------- Single Seat Component ---------- */
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
    ? "bg-[#4C6EF5] text-white border-[#3F5ED8] shadow-sm"
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-[#4C6EF5]";

  const disabled = isBooked || isLocked;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={`Seat ${seat}`}
      aria-pressed={isSelected}
      disabled={disabled}
      className={`
        relative group select-none
        w-12 h-12 sm:w-10 sm:h-10
        rounded-xl flex items-center justify-center
        transition-transform duration-100
        active:scale-95 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#4C6EF5]/60
        disabled:opacity-90
      `}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <span
        className={`
          absolute inset-1 sm:inset-[3px]
          border-2 rounded-lg
          flex items-center justify-center
          font-semibold
          text-[11px] sm:text-xs
          ${innerSeatClasses}
        `}
      >
        {/* Using the local SVG icons */}
        {isBooked ? gender === "F" ? <FemaleIcon /> : <MaleIcon /> : seat}
      </span>
      {/* Small, flatter bottom bar (AbhiBus style) */}
      <div
        className={`
          absolute bottom-0 left-1 right-1 sm:left-[3px] sm:right-[3px]
          h-[3px] sm:h-[2px] rounded-full
          transition-colors duration-100
          ${
            isBooked
              ? gender === "F"
                ? "bg-[#D04B78]" // femaleBorder
                : "bg-[#5B4FCF]" // maleBorder
              : isLocked
              ? "bg-[#FCA5A5]" // Locked border
              : isSelected
              ? "bg-[#3F5ED8]" // blueBorder
              : "bg-[#E5E7EB]" // border
          }
        `}
      />
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

/* ---------- Seat Layout Component (Main Logic) ---------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats,
  selectedSeats,
  onSeatClick,
  bookedSeatGenders,
}) => {
  // Normalize to strings once to avoid type mismatches
  const layoutAsStrings = Array.isArray(seatLayout)
    ? seatLayout.map(String)
    : [];

  const is49Seater = layoutAsStrings.length === 49;
  const is37Seater = layoutAsStrings.length === 37;

  // Use Sets for faster lookup
  const bookedSet = new Set(
    (Array.isArray(bookedSeats) ? bookedSeats : []).map(String)
  );
  const selectedSet = new Set(
    (Array.isArray(selectedSeats) ? selectedSeats : []).map(String)
  );

  /**
   * Checks adjacent seats for gender information to enforce booking rules (e.g., female next to female).
   * @param {number|string} seatNumber - The current seat number.
   * @param {Array<Array<number|string|null>>} layoutGrid - The grid representation of the layout.
   * @returns {string|null} The gender ('M' or 'F') of an adjacent booked seat, or null.
   */
  const getAdjacentSeatInfo = (seatNumber, layoutGrid) => {
    for (const row of layoutGrid) {
      const idx = row.indexOf(seatNumber);
      if (idx !== -1) {
        // Check left neighbor
        if (idx > 0 && row[idx - 1] !== null) {
          const neighborSeat = String(row[idx - 1]);
          if (bookedSeatGenders[neighborSeat])
            return bookedSeatGenders[neighborSeat];
        }
        // Check right neighbor
        if (idx < row.length - 1 && row[idx + 1] !== null) {
          const neighborSeat = String(row[idx + 1]);
          if (bookedSeatGenders[neighborSeat])
            return bookedSeatGenders[neighborSeat];
        }
        return null;
      }
    }
    return null;
  };

  /**
   * Determines the booking and selection status of a given seat.
   * @param {number|string} seat - The seat number.
   * @returns {{isBooked: boolean, isLocked: boolean, isSelected: boolean, gender: string|null}}
   */
  const getSeatStatus = (seat) => {
    const seatStr = String(seat);
    // isBooked means the seat has a gender assigned (i.e., it's confirmed booked)
    const isBooked = !!bookedSeatGenders[seatStr];
    
    // isLocked means the seat is reserved but doesn't have a gender yet (or is blocked for other reasons)
    // The previous logic for 'isLocked' seems to have intended to identify seats that are in 'bookedSeats' 
    // but not fully confirmed with a gender in 'bookedSeatGenders'. However, for a standard bus seat map, 
    // we primarily focus on fully 'isBooked' and 'isSelected'.
    // We will simplify: if it's not booked with a gender, it's either available or selected.
    const isLocked = bookedSet.has(seatStr) && !isBooked && !selectedSet.has(seatStr);

    return {
      isBooked,
      isLocked,
      isSelected: selectedSet.has(seatStr),
      gender: isBooked ? bookedSeatGenders[seatStr] : null,
    };
  };

  /**
   * Renders the grid of seats based on the layout structure.
   * @param {Array<Array<number|string|null>>} layoutGrid
   */
  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        className="flex justify-center items-center gap-x-2 sm:gap-x-2"
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            // Invisible placeholder for the aisle to maintain column alignment
            return (
              <div
                key={`aisle-${rowIndex}-${i}`}
                className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl"
                style={{ opacity: 0 }}
              />
            );
          }
          const seat = String(seatNumber);
          
          // Skip rendering if the seat number is not part of the provided layout array
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
          
          // Add a tooltip only if the seat is available and an opposite gender is adjacent
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

  /**
   * Generates the 5-column grid structure based on the total seat count.
   */
  const getLayoutGrid = () => {
    if (is49Seater) {
      const grid = [];
      // 11 rows of 4 seats + aisle
      for (let i = 0; i < 11; i++) {
        // [1, 2, null, 3, 4], [5, 6, null, 7, 8], ...
        grid.push([i * 4 + 1, i * 4 + 2, null, i * 4 + 3, i * 4 + 4]);
      }
      // Last row of 5 seats
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
        [29, 30, null, 31, 32], // 8 rows of 4 seats
      ];
      // Last row of 5 seats
      return [...base, [33, 34, 35, 36, 37]];
    }

    // Default return for unsupported layouts
    return [];
  };

  const layoutGrid = getLayoutGrid();

  return (
    <div
      className="p-3 sm:p-4 rounded-xl overflow-x-auto mx-auto max-w-sm"
      style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header: Driver Cab/Front */}
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
          {/* Steering wheel icon */}
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

      {/* Seat grid container */}
      <div className="space-y-2 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center p-4 text-sm" style={{ color: PALETTE.textSubtle }}>
            Bus seat configuration is not supported (only 37 or 49 seats).
          </p>
        )}
      </div>

      {/* Footer: Rear */}
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
  bookedSeatGenders: PropTypes.object.isRequired,
};

export default SeatLayout;
