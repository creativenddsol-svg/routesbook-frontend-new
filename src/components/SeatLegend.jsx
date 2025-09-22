// src/components/SeatLegend.jsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

/* Compact pill + seat icon */
const Pill = ({ children }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs sm:text-sm">
    {children}
  </div>
);

const SquareSeat = ({ className, children }) => (
  <div
    className={`w-[18px] h-[18px] sm:w-5 sm:h-5 rounded-[6px] flex items-center justify-center ${className}`}
  >
    {children}
  </div>
);

const SeatLegend = () => {
  return (
    <div className="bg-white border rounded-xl p-2 sm:p-3 overflow-x-auto">
      {/* SINGLE ROW, tight spacing, scroll if needed on narrow screens */}
      <div className="flex items-center whitespace-nowrap gap-2 sm:gap-3">
        {/* Available */}
        <Pill>
          <SquareSeat className="bg-white border border-gray-400" />
          <span className="text-gray-700 font-medium">Available</span>
        </Pill>

        {/* Female booked */}
        <Pill>
          <SquareSeat className="bg-[#E05B88] border border-[#D04B78] text-white">
            <FaFemale className="text-[9px] sm:text-xs" />
          </SquareSeat>
          <span className="text-gray-700 font-medium">Female booked</span>
        </Pill>

        {/* Male booked */}
        <Pill>
          <SquareSeat className="bg-[#6D5BD0] border border-[#5B4FCF] text-white">
            <FaMale className="text-[9px] sm:text-xs" />
          </SquareSeat>
          <span className="text-gray-700 font-medium">Male booked</span>
        </Pill>

        {/* Booked (generic) — matches seat layout reds */}
        <Pill>
          <SquareSeat className="bg-[#EF4444] border border-[#DC2626]" />
          <span className="text-gray-700 font-medium">Booked</span>
        </Pill>
      </div>
    </div>
  );
};

export default SeatLegend;
