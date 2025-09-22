// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* ---------- Palette ---------- */
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
  booked: "#D1D5DB",
  bookedBorder: "#C7CBD1",
};

/* ---------- Single Seat ---------- */
const Seat = ({ seat, isBooked, isLocked, isSelected, gender, onClick, title }) => {
  const stateClasses = isBooked
    ? gender === "F"
      ? "bg-[#E05B88] text-white border-[#D04B78] cursor-not-allowed"
      : "bg-[#6D5BD0] text-white border-[#5B4FCF] cursor-not-allowed"
    : isLocked
    ? "bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5] cursor-not-allowed"
    : isSelected
    ? "bg-[#4C6EF5] text-white border-[#3F5ED8] shadow-sm cursor-pointer"
    : "bg-white text-[#1A1A1A] border-[#E5E7EB] hover:bg-[#EEF2FF] hover:border-[#4C6EF5] cursor-pointer";

  return (
    <div
      onClick={!isBooked && !isLocked ? onClick : undefined}
      title={title}
      className={`flex items-center justify-center font-semibold border-2 rounded-lg transition-colors duration-150 select-none
        w-9 h-9 text-[11px] sm:w-10 sm:h-10 sm:text-[12px]`}
      style={{ willChange: "transform" }}
    >
      <div className={`flex items-center justify-center w-full h-full rounded-md ${stateClasses}`}>
        {isBooked ? (gender === "F" ? <FaFemale /> : <FaMale />) : seat}
      </div>
    </div>
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

/* ---------- Legend chips (AbhiBus-style) ---------- */
const LegendChips = () => {
  const Chip = ({ children, bg, bd, fg, icon }) => (
    <div
      className="px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
      style={{ background: bg, borderColor: bd, color: fg }}
    >
      {icon}
      {children}
    </div>
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
      <Chip bg="#FFF" bd={PALETTE.border} fg={PALETTE.textSubtle}>
        All
      </Chip>
      <Chip bg="#F8FAFF" bd={PALETTE.blueBorder} fg={PALETTE.blue}>
        Available
      </Chip>
      <Chip
        bg="#FFF0F4"
        bd={PALETTE.femaleBorder}
        fg="#C13563"
        icon={<FaFemale className="text-[12px]" />}
      >
        For Female
      </Chip>
      <Chip
        bg="#F2EFFE"
        bd={PALETTE.maleBorder}
        fg="#4E43C9"
        icon={<FaMale className="text-[12px]" />}
      >
        For Male
      </Chip>
      <Chip bg="#FCE7EF" bd={PALETTE.femaleBorder} fg="#C13563">
        Female booked
      </Chip>
      <Chip bg="#F3F4F6" bd={PALETTE.bookedBorder} fg="#6B7280">
        Booked
      </Chip>
    </div>
  );
};

/* ---------- Layout ---------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats,
  selectedSeats,
  onSeatClick,
  bookedSeatGenders,
  showLegendBar = true, // optional, defaults to true
}) => {
  const is49Seater = seatLayout.length === 49;
  const is37Seater = seatLayout.length === 37;

  const getAdjacentSeatInfo = (seatNumber, layoutGrid) => {
    for (const row of layoutGrid) {
      const idx = row.indexOf(seatNumber);
      if (idx !== -1) {
        if (idx > 0 && row[idx - 1] !== null) {
          const neighborSeat = String(row[idx - 1]);
          if (bookedSeatGenders[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        if (idx < row.length - 1 && row[idx + 1] !== null) {
          const neighborSeat = String(row[idx + 1]);
          if (bookedSeatGenders[neighborSeat]) return bookedSeatGenders[neighborSeat];
        }
        return null;
      }
    }
    return null;
  };

  const getSeatStatus = (seat) => {
    const isBooked = !!bookedSeatGenders[seat];
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
        className="flex justify-center items-center gap-x-1.5 sm:gap-x-2"
        style={{ minHeight: 40 }}
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            return <div key={`aisle-${rowIndex}-${i}`} className="w-5 sm:w-6 h-9 sm:h-10" />;
          }
          const seat = String(seatNumber);
          if (!seatLayout.includes(seat)) {
            return <div key={`placeholder-${seat}`} className="w-9 h-9 sm:w-10 sm:h-10" />;
          }

          const seatStatus = getSeatStatus(seat);
          let tooltipTitle = "";
          if (!seatStatus.isBooked && !seatStatus.isLocked && !seatStatus.isSelected) {
            const adj = getAdjacentSeatInfo(seatNumber, layoutGrid);
            if (adj) tooltipTitle = `Adjacent seat booked by a ${adj === "F" ? "Female" : "Male"}`;
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
      className="p-4 rounded-xl overflow-x-auto"
      style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
    >
      {/* Top Title/Steering (kept minimal to avoid jumps) */}
      <div className="relative flex justify-between items-center mb-3 px-2 sm:px-4">
        <span
          className="font-bold text-xs sm:text-sm uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Front
        </span>
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

      {/* AbhiBus-style legend chips */}
      {showLegendBar && (
        <div className="mb-3 px-1">
          <LegendChips />
        </div>
      )}

      {/* Seat grid */}
      <div className="space-y-1.5 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center font-medium" style={{ color: PALETTE.blue }}>
            Unsupported seat layout.
          </p>
        )}
      </div>

      {/* Footer label */}
      <div
        className="font-bold text-xs sm:text-sm uppercase tracking-wider text-center mt-4"
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
  showLegendBar: PropTypes.bool,
};

export default SeatLayout;
