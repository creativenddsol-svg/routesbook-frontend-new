// src/components/SeatLegend.jsx
import React from "react";
import { FaMale, FaFemale } from "react-icons/fa";

/* Component to mimic the outline chair icon from the image */
const SeatIcon = ({ className }) => (
  <div
    className={`w-full h-full flex items-center justify-center border-2 rounded-lg ${className}`}
  >
    <div
      className={`w-2/3 h-2/3 rounded-sm border-2 ${className}`}
      style={{
        borderTop: "none",
        borderBottomLeftRadius: "2px",
        borderBottomRightRadius: "2px",
        borderTopLeftRadius: "0",
        borderTopRightRadius: "0",
      }}
    />
  </div>
);

/* Small square "seat" */
const SeatSquare = ({ className, children }) => (
  <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
    {children ? (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className={`w-4 h-4 sm:w-[18px] sm:h-[18px] rounded-[6px] flex items-center justify-center ${className}`}
        >
          {children}
        </div>
      </div>
    ) : (
      <SeatIcon className={className} />
    )}
  </div>
);

const SeatLegend = () => {
  return (
    <div className="w-full rounded-lg border border-gray-200/70 bg-white/60 px-2 py-1.5 sm:px-3 sm:py-2">
      <div className="grid grid-cols-4 items-center text-center gap-1 sm:gap-2">
        {/* Available – no border color (neutral gray only for visibility) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="border-2 border-gray-300 text-gray-300" />
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Available
          </span>
        </div>

        {/* Female booked – Pink border */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="border-2 border-pink-500 text-pink-500" />
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Female Booked
          </span>
        </div>

        {/* Male booked – Purple border */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="border-2 border-purple-500 text-purple-500" />
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Male Booked
          </span>
        </div>

        {/* Booked – Light Red border */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <SeatSquare className="border-2 border-red-300 text-red-300" />
          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">
            Booked
          </span>
        </div>
      </div>
    </div>
  );
};

export default SeatLegend;
