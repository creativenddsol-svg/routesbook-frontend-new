// src/components/SeatLayout.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

/* ---------- Palette (Abhi-style) ---------- */
const PALETTE = {
  selected: "#4C6EF5", // blue (selected)
  selectedBorder: "#3F5ED8",

  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",

  // gendered bookings
  maleFill: "#6D5BD0", // purple for Male (booked)
  maleBorder: "#5B4FCF",
  femaleFill: "#E05B88", // pink for Female (booked)
  femaleBorder: "#D04B78",

  // generic booked (unknown gender)
  bookedFill: "#EF4444",
  bookedBorder: "#DC2626",

  // outlines for "For Female / For Male"
  forFemaleBorder: "#F472B6",
  forMaleBorder: "#818CF8",

  hoverTint: "#F5F7FF",
};

/* ---------- Single Seat ---------- */
const Seat = ({
  seat,
  status, // { type: 'available'|'selected'|'bookedFemale'|'bookedMale'|'booked', outline?: 'female'|'male'}
  onClick,
  title,
}) => {
  let cls = "";
  let content = seat;

  switch (status.type) {
    case "bookedFemale":
      cls =
        "bg-[#E05B88] text-white border-2 border-[#D04B78] cursor-not-allowed";
      content = <FaFemale />;
      break;
    case "bookedMale":
      cls =
        "bg-[#6D5BD0] text-white border-2 border-[#5B4FCF] cursor-not-allowed";
      content = <FaMale />;
      break;
    case "booked":
      cls =
        "bg-[#EF4444] text-white border-2 border-[#DC2626] cursor-not-allowed";
      break;
    case "selected":
      cls =
        "bg-[#4C6EF5] text-white border-2 border-[#3F5ED8] scale-105 shadow-sm cursor-pointer";
      break;
    case "available":
    default: {
      // outline variants for “For Female / For Male”
      const outlineFemale =
        status.outline === "female"
          ? "border-[#F472B6]"
          : "border-[#E5E7EB]";
      const outlineMale =
        status.outline === "male" ? "border-[#818CF8]" : "border-[#E5E7EB]";

      const border =
        status.outline === "female" ? outlineFemale : outlineMale;

      cls = `bg-white text-[#1A1A1A] border-2 ${border} hover:bg-[${PALETTE.hoverTint}] hover:border-[#4C6EF5] cursor-pointer`;
      break;
    }
  }

  return (
    <div
      onClick={
        status.type === "available" || status.type === "selected"
          ? onClick
          : undefined
      }
      title={title}
      className={`flex items-center justify-center font-semibold rounded-lg transition-all duration-150 select-none
        w-8 h-8 text-[10px] sm:w-10 sm:h-10 sm:text-xs ${cls}`}
    >
      {content}
    </div>
  );
};

Seat.propTypes = {
  seat: PropTypes.string.isRequired,
  status: PropTypes.shape({
    type: PropTypes.oneOf([
      "available",
      "selected",
      "bookedFemale",
      "bookedMale",
      "booked",
    ]).isRequired,
    outline: PropTypes.oneOf(["female", "male"]),
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

/* ---------- Layout ---------- */
const SeatLayout = ({
  seatLayout,
  bookedSeats, // array of seats blocked/booked but gender unknown
  selectedSeats,
  onSeatClick,
  bookedSeatGenders, // { "12": "F" | "M", ... }
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
    const gender = bookedSeatGenders[seat]; // 'F' | 'M' | undefined
    const isGenderedBooked = !!gender;
    const isGenericBooked =
      Array.isArray(bookedSeats) &&
      bookedSeats.includes(seat) &&
      !isGenderedBooked;

    if (isGenderedBooked) {
      return { type: gender === "F" ? "bookedFemale" : "bookedMale" };
    }
    if (isGenericBooked) {
      return { type: "booked" }; // red booked
    }
    if (selectedSeats.includes(seat)) {
      return { type: "selected" };
    }

    // Abhi-style “For Female / For Male” hint via adjacency
    const outlineAdj = getAdjacentSeatInfo(Number(seat), layoutGrid);
    if (outlineAdj === "F") return { type: "available", outline: "female" };
    if (outlineAdj === "M") return { type: "available", outline: "male" };
    return { type: "available" };
  };

  const renderLayout = (layoutGrid) =>
    layoutGrid.map((row, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        className="flex justify-center items-center gap-x-1 sm:gap-x-2"
      >
        {row.map((seatNumber, i) => {
          if (seatNumber === null) {
            return (
              <div
                key={`aisle-${rowIndex}-${i}`}
                className="w-5 h-8 sm:w-8 sm:h-10"
              />
            );
          }
          const seat = String(seatNumber);
          if (!seatLayout.includes(seat)) {
            return (
              <div
                key={`placeholder-${seat}`}
                className="w-8 h-8 sm:w-10 sm:h-10"
              />
            );
          }

          const status = getSeatStatus(seat);
          let tooltipTitle = "";
          if (status.type === "available") {
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
              status={status}
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
      className="p-3 sm:p-4 rounded-xl overflow-x-auto"
      style={{ background: "#FFFFFF", border: `1px solid ${PALETTE.border}` }}
    >
      {/* Header (Front / steering) */}
      <div className="relative flex justify-between items-center mb-3 sm:mb-4 px-2 sm:px-4">
        <span
          className="font-bold text-[10px] sm:text-sm uppercase tracking-wider"
          style={{ color: PALETTE.textSubtle }}
        >
          Front
        </span>
        <svg
          className="w-7 h-7 sm:w-9 sm:h-9"
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
      <div className="space-y-1 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center text-xs sm:text-sm" style={{ color: PALETTE.selected }}>
            Unsupported seat layout.
          </p>
        )}
      </div>

      {/* Footer label */}
      <div
        className="font-bold text-[10px] sm:text-sm uppercase tracking-wider text-center mt-3 sm:mt-4"
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
