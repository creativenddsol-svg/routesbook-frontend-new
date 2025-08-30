import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

const SeatLegend = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3 rounded-xl border bg-white p-3 shadow-sm">
      {/* Available */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-white border-2 border-gray-400"></div>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          Available
        </span>
      </div>

      {/* Selected */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-blue-600 border-2 border-blue-700"></div>
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          Selected
        </span>
      </div>

      {/* ✅ UPDATED: Booked Group */}
      <div className="flex items-center gap-3">
        <span className="text-xs sm:text-sm text-gray-600 font-medium">
          Booked
        </span>
        <div className="flex items-center gap-3 sm:gap-4 p-1.5 bg-gray-100 rounded-lg">
          {/* Male */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-violet-500 text-white flex items-center justify-center">
              <FaMale size={12} />
            </div>
            <span className="text-xs text-violet-700 font-medium">Male</span>
          </div>
          {/* Female */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-pink-500 text-white flex items-center justify-center">
              <FaFemale size={12} />
            </div>
            <span className="text-xs text-pink-700 font-medium">Female</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatLegend;
