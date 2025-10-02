// src/components/SeatLegend.jsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

/* Small square "seat" (Original size kept) */
const SeatSquare = ({ className, children }) => (
  <div
    className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[6px] flex items-center justify-center ${className}`}
  >
    {children}
  </div>
);

// New Component: Simple Outline Seat Icon (matching the appearance in the legend image)
const SimpleSeatOutline = ({ className }) => (
  <div
    className={`w-full h-full border-2 rounded-sm ${className}`} // border-2 for outline effect
  >
    {/* Mimics the slight 'armrest' curve/outline visible in the legend image */}
    <div
      className={`absolute inset-0 rounded-sm ${className}`}
      style={{
        border: '2px solid currentColor',
        borderTop: 'none',
        borderBottomLeftRadius: '2px',
        borderBottomRightRadius: '2px',
      }}
    />
  </div>
);

const SeatLegend = () => {
  return (
    <div className="w-full rounded-lg border border-gray-200/70 bg-white/60 px-2 py-1.5 sm:px-3 sm:py-2">
      {/* Single row, equal columns, icon above text (like AbhiBus spacing) */}
      <div className="grid grid-cols-4 items-center text-center gap-1 sm:gap-2">
        {/* Available - Outline Seat Icon */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="bg-white border-0 text-gray-700 relative overflow-hidden">
            {/* Outline icon matching the image style and size */}
            <SimpleSeatOutline className="text-gray-500" /> 
          </SeatSquare>
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Available
          </span>
        </div>

        {/* Female booked - Filled Icon (matching the layout colors) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="bg-[#E05B88] border border-[#D04B78] text-white">
            <FaFemale className="text-[8px] sm:text-[10px]" />
          </SeatSquare>
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Female booked
          </span>
        </div>

        {/* Male booked - Filled Icon (matching the layout colors) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="bg-[#6D5BD0] border border-[#5B4FCF] text-white">
            <FaMale className="text-[8px] sm:text-[10px]" />
          </SeatSquare>
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Male booked
          </span>
        </div>

        {/* Booked (generic) – Filled Red (matching the layout colors) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="bg-[#EF4444] border border-[#DC2626]" />
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Booked
          </span>
        </div>
      </div>
    </div>
  );
};

export default SeatLegend;
