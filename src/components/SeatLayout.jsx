// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* ---------- Matte palette (selected = blue) ---------- */
const PALETTE = {
  // Selected seat
  blue: "#4C6EF5", // matte blue
  blueBorder: "#3F5ED8",
  blueHoverTint: "#EEF2FF",

  // General UI
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",

  // Booked seats
  male: "#6D5BD0", // violet
  maleBorder: "#5B4FCF",
  female: "#E05B88", // pink
  femaleBorder: "#D04B78",
};

/* ---------- Single Seat (thumb-friendly) ---------- */
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
      ? "bg-[#E05B88] text-white border-[#D04B78] cursor-not-allowed" // female booked
      : "bg-[#6D5BD0] text-white border-[#5B4FCF] cursor-not-allowed" // male booked
    : isLocked
    ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] cursor-not-allowed" // LOCKED (low red)
    : isSelected
    ? "bg-[#4C6EF5] text-white border-[#3F5ED8] shadow-sm" // SELECTED = matte blue
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-[#4C6EF5]"; // available + blue hover

  // Small bottom bar color (AbhiBus-style)
  let barColor = "#9CA3AF"; // default grey for available
  if (isSelected) barColor = PALETTE.blueBorder;
  if (isLocked) barColor = "#B91C1C"; // muted red for locked
  if (isBooked) barColor = gender === "F" ? PALETTE.femaleBorder : PALETTE.maleBorder;

  const disabled = isBooked || isLocked;

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={title}
      aria-label={`Seat ${seat}`}
      aria-pressed={isSelected}
      disabled={disabled}
      /* Outer hitbox = larger tap target on mobile (48px). Desktop keeps your old density. */
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
      {/* Visual seat slightly inset so the hitbox is bigger than the seat */}
      <span
        className={`
          absolute inset-1 sm:inset-[3px]
          border-2 rounded-lg
          flex items-center justify-center
          font-semibold
          text-[11px] sm:text-xs
          relative
          ${innerSeatClasses}
        `}
      >
        {/* Seat label/icon */}
        {isBooked ? (gender === "F" ? <FaFemale /> : <FaMale />) : seat}

        {/* --- NEW: tiny bottom bar (seat edge) --- */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-md"
          style={{
            bottom: 3, // px
            height: 4,
            width: "62%",
            backgroundColor: barColor,
          }}
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
  bookedSeats, // kept for API compatibility (unused directly)
  selectedSeats,
  onSeatClick,
  bookedSeatGenders,
}) => {
  const is49Seater = seatLayout.length === 49;
  const is37Seater = seatLayout.length === 37;

  const getAdjacentSeatInfo = (seatNumber, layoutGrid) => {
    for (const row of layoutGrid) {
      const idx = row.indexOf(seatNumber);
      if (idx !== -1) {
        if (idx > 0 && row[idx - 1] !== null) {
          const neighborSeat = String(row[idx - 1]);
          if (bookedSeatGenders[neighborSeat])
            return bookedSeatGenders[neighborSeat];
        }
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

  const getSeatStatus = (seat) => {
    const isBooked = !!bookedSeatGenders[seat];
    // "Locked by others" if it's in bookedSeats (no gender mapping) and not selected by me
    const isLocked =
      Array.isArray(bookedSeats) &&
      bookedSeats.includes(seat) &&
      !bookedSeatGenders[seat] &&
      !selectedSeats.includes(seat);

    return {
      isBooked,
      isLocked,
      isSelected: selectedSeats.includes(seat),
      gender: isBooked ? bookedSeatGenders[seat] : null,
    };
  };

  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        /* Slightly wider gaps on mobile to prevent mis-taps */
        className="flex justify-center items-center gap-x-2 sm:gap-x-2"
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            return (
              <div
                key={`aisle-${rowIndex}-${i}`}
                className="w-4 h-12 sm:w-6 sm:h-10"
              />
            );
          }
          const seat = String(seatNumber);
          if (!seatLayout.includes(seat)) {
            return <div key={`placeholder-${seat}`} className="w-12 h-12 sm:w-10 sm:h-10" />;
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

  /* ---------- ONLY MOBILE tweak for 37-seater last row alignment ---------- */
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640; // Tailwind sm breakpoint

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
      // Standard rows (2 | aisle | 2)
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

      if (isMobile) {
        // MOBILE ONLY:
        // Align columns with the rows above:
        // [33,34 | aisle | 36,37] and put 35 centered under the aisle.
        return [
          ...base,
          [33, 34, null, 36, 37],
          [null, null, 35, null, null],
        ];
      }

      // Desktop/original: 5 across
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
      {/* Header (Front / wheel) */}
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

      {/* Footer label */}
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
  seatLayout: PropTypes.arrayOf(PropTypes.string).isRequired,
  bookedSeats: PropTypes.array.isRequired,
  selectedSeats: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSeatClick: PropTypes.func.isRequired,
  bookedSeatGenders: PropTypes.object.isRequired,
};

export default SeatLayout;
