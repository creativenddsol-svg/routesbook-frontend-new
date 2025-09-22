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

      {/* For Female (outline) */}
      <Pill>
        <SeatIcon className="bg-white border-2 border-pink-400" />
        <span className="text-gray-700 font-medium">For Female</span>
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

      {/* Booked (unknown gender) */}
      <Pill>
        <SeatIcon className="bg-red-500" />
        <span className="text-gray-700 font-medium">Booked</span>
      </Pill>
    </div>
  );
};

export default SeatLegend;
