// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* * NOTE: PALETTE and Seat component are largely unchanged 
 * as the request was to keep colors and core design.
 * The innerSeatClasses logic is already highly optimized.
 */
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

/* ---------- Single Seat (Minimal visual changes, mostly refactoring classes) ---------- */
const Seat = ({
  seat,
  isBooked,
  isLocked,
  isSelected,
  gender,
  onClick,
  title,
}) => {
  const isFemaleBooked = isBooked && gender === "F";
  const isMaleBooked = isBooked && gender === "M";
  const disabled = isBooked || isLocked;

  // Consolidate dynamic classes for clarity
  const innerSeatClasses = isFemaleBooked
    ? "bg-[#E05B88] text-white border-[#D04B78] cursor-not-allowed"
    : isMaleBooked
    ? "bg-[#6D5BD0] text-white border-[#5B4FCF] cursor-not-allowed"
    : isLocked
    ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] cursor-not-allowed"
    : isSelected
    ? "bg-[#4C6EF5] text-white border-[#3F5ED8] shadow-sm"
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-[#4C6EF5]";

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
        w-12 h-12 sm:w-10 sm:h-10 // Consistent sizing
        rounded-xl flex items-center justify-center
        transition-transform duration-100
        active:scale-95 focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-[#4C6EF5]/60
        disabled:opacity-90 disabled:shadow-none
      `}
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {/* UX/Clarity improvement: Ensure text size is consistent and icon/text rendering is clean. 
        Using `leading-none` to prevent font spacing from causing alignment issues.
      */}
      <span
        className={`
          absolute inset-1 sm:inset-[3px]
          border-2 rounded-lg
          flex items-center justify-center
          font-semibold
          text-[13px] sm:text-sm leading-none // Slightly increased font size for better mobile readability
          ${innerSeatClasses}
        `}
      >
        {isBooked ? (isFemaleBooked ? <FaFemale /> : <FaMale />) : seat}
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

/* ---------- Layout (Core structure improvements for mobile UX) ---------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats,
  selectedSeats,
  onSeatClick,
  bookedSeatGenders,
}) => {
  // Normalize to strings once
  const layoutAsStrings = Array.isArray(seatLayout)
    ? seatLayout.map(String)
    : [];

  const is49Seater = layoutAsStrings.length === 49;
  const is37Seater = layoutAsStrings.length === 37;

  // Use Sets for O(1) lookups
  const bookedSet = new Set(
    (Array.isArray(bookedSeats) ? bookedSeats : []).map(String)
  );
  const selectedSet = new Set(
    (Array.isArray(selectedSeats) ? selectedSeats : []).map(String)
  );

  /**
   * Helper function to determine the gender of a booked adjacent seat.
   * This logic is crucial for the "Female/Male only" locking feature.
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
   * Utility to get all seat status flags.
   */
  const getSeatStatus = (seat) => {
    const seatStr = String(seat);
    // bookedSeatGenders[seatStr] can be 'M' or 'F' for booked, or undefined/null for not booked
    const isBooked = !!bookedSeatGenders[seatStr]; 
    
    // Original logic for 'Locked': Booked but no gender (e.g., placeholder, or seat held by a 3rd party system)
    // The image shows only 4x rows, which is what the layout grid does, so this 'isLocked' logic might be for a different use case. 
    // I'll keep the original logic but ensure the Seat component handles it visually (red tint).
    const isLocked =
      bookedSet.has(seatStr) &&
      !isBooked && // isBooked is true only if a gender is present
      !selectedSet.has(seatStr);

    return {
      isBooked,
      isLocked,
      isSelected: selectedSet.has(seatStr),
      gender: isBooked ? bookedSeatGenders[seatStr] : null,
    };
  };

  /**
   * Renders the grid of seats.
   */
  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      /* UX Improvement: Use a consistent, slightly larger gap for mobile 
        to enhance touch targets and visual separation.
        Using `grid` for the row content ensures perfect column alignment 
        even with the invisible aisle placeholder.
      */
      <div
        key={`row-${rowIndex}`}
        className="grid grid-cols-5 gap-x-2 sm:gap-x-2 justify-items-center"
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            // Invisible placeholder for the aisle. Width/Height needs to match Seat.
            // Using a `div` that occupies a grid column.
            return (
              <div
                key={`aisle-${rowIndex}-${i}`}
                className="w-12 h-12 sm:w-10 sm:h-10"
                aria-hidden="true"
              />
            );
          }
          const seat = String(seatNumber);
          
          // Render only seats that are actually in the provided layout
          if (!layoutAsStrings.includes(seat)) {
            // Render an empty column slot if the layout doesn't use this number
            return (
              <div
                key={`placeholder-${rowIndex}-${i}`}
                className="w-12 h-12 sm:w-10 sm:h-10"
                aria-hidden="true"
              />
            );
          }

          const seatStatus = getSeatStatus(seat);
          let tooltipTitle = "";

          // UX Improvement: Provide a clear title for seats next to a booked seat of a specific gender.
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
   * Generates the seat grid structure based on the total number of seats.
   * This is a robust way to handle the 2+null+2 pattern.
   */
  const getLayoutGrid = () => {
    // The provided image shows a 2+null+2 layout, which matches both the 49 and 37 seater logic.
    if (is49Seater) {
      const grid = [];
      // 11 rows of 4 seats (1-44)
      for (let i = 0; i < 11; i++) {
        // [1, 2, null, 3, 4], [5, 6, null, 7, 8], ...
        grid.push([i * 4 + 1, i * 4 + 2, null, i * 4 + 3, i * 4 + 4]);
      }
      // Last row: 5 seats (45-49)
      grid.push([45, 46, 47, 48, 49]);
      return grid;
    }

    if (is37Seater) {
      // 8 rows of 4 seats (1-32)
      const base = [
        [1, 2, null, 3, 4], [5, 6, null, 7, 8], [9, 10, null, 11, 12],
        [13, 14, null, 15, 16], [17, 18, null, 19, 20], [21, 22, null, 23, 24],
        [25, 26, null, 27, 28], [29, 30, null, 31, 32],
      ];
      // Last row: 5 seats (33-37)
      // The original code uses [33, 34, 35, 36, 37] which means seat 35 is in the middle aisle column.
      // This is necessary to keep the column alignment consistent (5 seats across).
      return [...base, [33, 34, 35, 36, 37]];
    }

    return [];
  };

  const layoutGrid = getLayoutGrid();

  /* UX/Structure Improvement: Ensure the entire component is padded correctly 
    and the overflow-x is only on the wrapper to handle ultra-narrow screens gracefully, 
    though with 5 columns, it's usually fine.
  */
  return (
    <div
      className="p-3 sm:p-4 rounded-xl overflow-x-auto"
      style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header: Use standard `justify-between` but give the title a more pronounced, 
        yet subtle, look. The 'Front' label is a key visual marker.
      */}
      <div className="flex justify-between items-center mb-4 px-1">
        <span
          className="font-extrabold text-xs sm:text-sm uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Front
        </span>
        {/* Bus steering icon remains unchanged */}
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10"
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

      {/* Seat grid container. Inline-block with min-w-full ensures the grid is centered 
          if it's narrower than the container (unlikely for 5 columns on mobile) 
          but also handles scroll correctly. */}
      <div className="space-y-3 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center p-8 text-sm" style={{ color: PALETTE.blue }}>
            Unsupported seat layout. Please contact support.
          </p>
        )}
      </div>

      {/* Footer: More structured/spaced for clarity */}
      <div
        className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-center pt-4 mt-4 border-t border-gray-100"
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
