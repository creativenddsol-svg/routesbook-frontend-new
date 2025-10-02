// src/components/SeatLegend.jsx

import React from "react";

import { FaMale, FaFemale } from "react-icons/fa";



/* Component to mimic the outline chair icon from the image */

const SeatIcon = ({ className }) => (

  // The 'className' is primarily used to set the border/text color

  <div

    className={`w-full h-full flex items-center justify-center border-2 rounded-lg ${className}`}

  >

    {/* Inner 'seat' area to create the outline look */}

    <div

      className={`w-2/3 h-2/3 rounded-sm border-2 ${className}`}

      style={{

        // Custom style to only show the inner bottom/sides of the 'chair'

        borderTop: 'none',

        borderBottomLeftRadius: '2px',

        borderBottomRightRadius: '2px',

        borderTopLeftRadius: '0',

        borderTopRightRadius: '0',

      }}

    />

  </div>

);



/* Small square "seat" - Refactored to act as a container for the new icon */

const SeatSquare = ({ className, children }) => (

  // The 'rounded-[6px]' and sizing from the original component is kept as the container

  // The actual icon (SeatIcon or Fa* icons) is placed inside.

  <div

    className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center`} // Increased size for better visual

  >

    {/* If there are no children, display the new outline seat icon */}

    {children ? (

      <div className="w-full h-full flex items-center justify-center">

        {/* For Male/Female booked, we just use the original SeatSquare structure but with new colors */}

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

      {/* Single row, equal columns, icon above text (like AbhiBus spacing) */}

      <div className="grid grid-cols-4 items-center text-center gap-1 sm:gap-2">

        {/* Available - Dark Gray Outline */}

        <div className="flex flex-col items-center gap-1 min-w-0">

          {/* Using a gray outline to match the first icon in your image */}

          <SeatSquare className="border-2 border-gray-600 text-gray-600" />

          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">

            Available

          </span>

        </div>



        {/* Female booked - Pink Outline (Matches 2nd image icon) */}

        <div className="flex flex-col items-center gap-1 min-w-0">

          {/* Using a bright pink outline to match the second icon in your image */}

          <SeatSquare className="border-2 border-[#ff3366] text-[#ff3366]" />

          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">

            Female booked

          </span>

        </div>



        {/* Male booked - Blue Outline (Matches 3rd image icon) */}

        <div className="flex flex-col items-center gap-1 min-w-0">

          {/* Using a bright blue outline to match the third icon in your image */}

          <SeatSquare className="border-2 border-[#3399ff] text-[#3399ff]" />

          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">

            Male booked

          </span>

        </div>



        {/* Booked (generic) – Filled Gray/Pink (Matches 4th and 5th image icon concept) */}

        <div className="flex flex-col items-center gap-1 min-w-0">

          {/* This is a common practice for 'Booked' in the new UI style (e.g., Pink/Gray filled) */}

          <SeatSquare className="bg-gray-300 border border-gray-400" />

          <span className="text-[10px] sm:text-xs text-gray-700 leading-tight truncate">

            Booked

          </span>

        </div>

      </div>

    </div>

  );

};



export default SeatLegend;
