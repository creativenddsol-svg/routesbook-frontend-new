// src/components/SeatLegend.jsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

/* Minimal pill */
const Pill = ({ children }) => (
  <div
    className="
      inline-flex items-center justify-center gap-1
      px-2 py-0.5 rounded-full
      text-[10px] sm:text-xs leading-none
      border border-transparent bg-transparent
      min-w-0
    "
  >
    {children}
  </div>
);

/* Seat square */
const SquareSeat = ({ className, children }) => (
  <div
    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-[6px] flex items-center justify-center shrink-0 ${className}`}
  >
    {children}
  </div>
);

const SeatLegend = () => {
  return (
    <div
      className="
        w-full max-w-full
        bg-white/60 border border-gray-200
        rounded-lg p-2 sm:p-2.5
        overflow-hidden
      "
    >
      {/* Single compact row, 4 equal slots (no scrollbar, no wrap/overlay) */}
      <div className="grid grid-cols-4 items-center gap-1 sm:gap-2">
        {/* Available */}
        <Pill>
          <SquareSeat className="bg-white border border-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[68px] sm:max-w-[90px]">
            Available
          </span>
        </Pill>

        {/* Female booked */}
        <Pill>
          <SquareSeat className="bg-[#E05B88] border border-[#D04B78] text-white">
            <FaFemale className="text-[8px] sm:text-[10px]" />
          </SquareSeat>
          <span className="text-gray-700 font-medium truncate max-w-[68px] sm:max-w-[90px]">
            Female booked
          </span>
        </Pill>

        {/* Male booked */}
        <Pill>
          <SquareSeat className="bg-[#6D5BD0] border border-[#5B4FCF] text-white">
            <FaMale className="text-[8px] sm:text-[10px]" />
          </SquareSeat>
          <span className="text-gray-700 font-medium truncate max-w-[68px] sm:max-w-[90px]">
            Male booked
          </span>
        </Pill>

        {/* Booked (generic) — matches seat layout reds */}
        <Pill>
          <SquareSeat className="bg-[#EF4444] border border-[#DC2626]" />
          <span className="text-gray-700 font-medium truncate max-w-[68px] sm:max-w-[90px]">
            Booked
          </span>
        </Pill>
      </div>
    </div>
  );
};

export default SeatLegend;
