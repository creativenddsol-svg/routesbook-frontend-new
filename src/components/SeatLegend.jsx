// src/components/SeatLegend.jsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

const Pill = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm">
    {children}
  </div>
);

const SeatIcon = ({ className }) => (
  <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md ${className}`} />
);

const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 bg-white border rounded-xl p-3 sm:p-4">
      {/* Available */}
      <Pill>
        <SeatIcon className="bg-white border border-gray-400" />
        <span className="text-gray-700 font-medium">Available</span>
      </Pill>

      {/* For Male (outline) */}
      <Pill>
        <SeatIcon className="bg-white border-2 border-indigo-400" />
        <span className="text-gray-700 font-medium">For Male</span>
      </Pill>

      {/* Female booked */}
      <Pill>
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-pink-500 text-white flex items-center justify-center">
          <FaFemale className="text-[10px] sm:text-xs" />
        </div>
        <span className="text-gray-700 font-medium">Female booked</span>
      </Pill>

      {/* Male booked (purple) */}
      <Pill>
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#6D5BD0] text-white flex items-center justify-center border border-[#5B4FCF]">
          <FaMale className="text-[10px] sm:text-xs" />
        </div>
        <span className="text-gray-700 font-medium">Male booked</span>
      </Pill>

      {/* Booked (match seat layout red) */}
      <Pill>
        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#EF4444] border border-[#DC2626]" />
        <span className="text-gray-700 font-medium">Booked</span>
      </Pill>
    </div>
  );
};

export default SeatLegend;
