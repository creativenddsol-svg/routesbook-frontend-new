import React from "react";
import PropTypes from "prop-types";
import { FaMale, FaFemale } from "react-icons/fa";

const Seat = ({ seat, isBooked, isSelected, gender, onClick, title }) => (
  <div
    onClick={!isBooked ? onClick : undefined}
    title={title}
    className={`flex items-center justify-center font-bold border-2 rounded-lg transition-all duration-200
      w-8 h-8 text-xs sm:w-10 sm:h-10 sm:text-sm
      ${
        isBooked
          ? gender === "F" // ✅ FIX: Check gender for booked seats
            ? "bg-pink-500 text-white border-pink-600 cursor-not-allowed" // Female is Pink
            : "bg-violet-500 text-white border-violet-600 cursor-not-allowed" // Male is Violet
          : isSelected
          ? "bg-blue-600 text-white border-blue-700 scale-110 shadow-lg cursor-pointer"
          : "bg-white text-gray-700 border-gray-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
      }`}
  >
    {isBooked ? gender === "F" ? <FaFemale /> : <FaMale /> : seat}
  </div>
);

// ... (The rest of the SeatLayout component does not need to be changed)

const SeatLayout = ({
  seatLayout,
  bookedSeats,
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
          if (bookedSeatGenders[neighborSeat])
            return bookedSeatGenders[neighborSeat];
        }
        if (seatIndex < row.length - 1 && row[seatIndex + 1] !== null) {
          const neighborSeat = String(row[seatIndex + 1]);
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
    return {
      isBooked,
      isSelected: selectedSeats.includes(seat),
      gender: isBooked ? bookedSeatGenders[seat] : null,
    };
  };

  const renderLayout = (layoutGrid) => {
    return layoutGrid.map((row, rowIndex) => (
      <div
        key={`row-${rowIndex}`}
        className="flex justify-center items-center gap-x-1 sm:gap-x-2"
      >
        {row.map((seatNumber) => {
          if (seatNumber === null) {
            return (
              <div
                key={`aisle-${rowIndex}-${Math.random()}`}
                className="w-6 h-8 sm:w-10 sm:h-10"
              ></div>
            );
          }
          const seat = String(seatNumber);
          if (!seatLayout.includes(seat)) {
            return (
              <div
                key={`placeholder-${seat}`}
                className="w-8 h-8 sm:w-10 sm:h-10"
              ></div>
            );
          }

          const seatStatus = getSeatStatus(seat);
          let tooltipTitle = "";
          if (!seatStatus.isBooked && !seatStatus.isSelected) {
            const adjacentGender = getAdjacentSeatInfo(seatNumber, layoutGrid);
            if (adjacentGender) {
              tooltipTitle = `Adjacent seat booked by a ${
                adjacentGender === "F" ? "Female" : "Male"
              }`;
            }
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
  };

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
    <div className="p-4 bg-white rounded-xl border border-gray-200 overflow-x-auto">
      <div className="relative flex justify-between items-center mb-4 px-2 sm:px-4">
        <span className="font-bold text-sm uppercase tracking-wider text-gray-500">
          Front
        </span>
        <svg
          className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
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
      <div className="space-y-1 sm:space-y-2 inline-block min-w-full">
        {layoutGrid.length > 0 ? (
          renderLayout(layoutGrid)
        ) : (
          <p className="text-center text-red-500">Unsupported seat layout.</p>
        )}
      </div>
      <div className="font-bold text-sm uppercase tracking-wider text-gray-500 text-center mt-4">
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

Seat.propTypes = {
  seat: PropTypes.string.isRequired,
  isBooked: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  gender: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  title: PropTypes.string,
};

export default SeatLayout;
