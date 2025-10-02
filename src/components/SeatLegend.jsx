import React from "react";

/* Component to mimic the outline chair icon (Now with fixed alignment) */
const SeatOutlineIcon = ({ className }) => (
  // The outer container sets the frame and centers its content (the inner seat)
  <div
    className={`w-full h-full flex items-center justify-center border-2 rounded-lg ${className}`}
  >
    {/* Inner 'seat' area to create the outline look */}
    <div
      className={`w-2/3 h-2/3 rounded-sm border-2 ${className}`}
      style={{
        // FIX: Push the inner seat down slightly (by 3px) to achieve the correct visual alignment
        marginTop: '3px',
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

const SeatLegend = () => {
    // Define custom color classes for clarity and easy maintenance
    const colors = {
        // Available: no color (light default outline)
        available: "border-gray-300 text-gray-300",
        
        // Female Booked: mat pink (#D81B60)
        femaleBooked: "border-[#D81B60] text-[#D81B60] shadow-sm", 
        
        // Male Booked: mat purple (#673AB7)
        maleBooked: "border-[#673AB7] text-[#673AB7] shadow-sm", 
        
        // Booked (generic): verry light red (#FFB7B7)
        genericBooked: "border-[#FFB7B7] text-[#FFB7B7]", 
    };

    // Helper component to wrap the icon and size it correctly
    const LegendWrapper = ({ colorClass }) => (
        <div className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center">
            <SeatOutlineIcon className={colorClass} />
        </div>
    );

  return (
    <div className="w-full rounded-xl shadow-lg border border-gray-100 bg-white/80 backdrop-blur-sm p-3">
      
      {/* Changed to 4 columns for the 4 seat states */}
      <div className="grid grid-cols-4 items-center text-center gap-1 sm:gap-2">
        
        {/* 1. Available */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendWrapper colorClass={colors.available} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Available
          </span>
        </div>

        {/* Removed 'Selected' icon block here */}

        {/* 2. Female Booked (Mat Pink Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendWrapper colorClass={colors.femaleBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Female Booked
          </span>
        </div>

        {/* 3. Male Booked (Mat Purple Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendWrapper colorClass={colors.maleBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Male Booked
          </span>
        </div>

        {/* 4. Booked (Generic) (Very Light Red Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendWrapper colorClass={colors.genericBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Booked
          </span>
        </div>

      </div>
    </div>
  );
};

export default SeatLegend;
