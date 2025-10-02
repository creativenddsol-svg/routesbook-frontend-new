import React from "react";

/* Component to mimic the outline chair icon */
const SeatOutlineIcon = ({ className }) => (
  // className sets the border and text color (the outline color)
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

/* Unified component to display the legend icon - now only rendering the SeatOutlineIcon */
const LegendIcon = ({ colorClass }) => {
    // Base size for all legend icons
    const baseClasses = "w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center";

    return (
        <div className={baseClasses}>
            <SeatOutlineIcon className={colorClass} />
        </div>
    );
};


const SeatLegend = () => {
    // Define custom color classes for clarity and easy maintenance
    const colors = {
        // Available: no color (light default outline)
        available: "border-gray-300 text-gray-300",
        
        // Selected: mat blue
        selected: "border-[#4A69BB] text-[#4A69BB] shadow-sm", 
        
        // Female Booked: mat pink
        femaleBooked: "border-[#D81B60] text-[#D81B60] shadow-sm", 
        
        // Male Booked: mat purple
        maleBooked: "border-[#673AB7] text-[#673AB7] shadow-sm", 
        
        // Booked (generic): verry light red (A pale red border is used for visibility)
        genericBooked: "border-[#FFB7B7] text-[#FFB7B7]", 
    };

  return (
    <div className="w-full rounded-xl shadow-lg border border-gray-100 bg-white/80 backdrop-blur-sm p-3">
      
      {/* 5 columns for the 5 seat states */}
      <div className="grid grid-cols-5 items-center text-center gap-1 sm:gap-2">
        
        {/* 1. Available */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendIcon colorClass={colors.available} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Available
          </span>
        </div>

        {/* 2. Selected (Mat Blue Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendIcon colorClass={colors.selected} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Selected
          </span>
        </div>

        {/* 3. Female Booked (Mat Pink Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendIcon colorClass={colors.femaleBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Female Booked
          </span>
        </div>

        {/* 4. Male Booked (Mat Purple Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendIcon colorClass={colors.maleBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Male Booked
          </span>
        </div>

        {/* 5. Booked (Generic) (Very Light Red Outline) */}
        <div className="flex flex-col items-center gap-1 min-w-0">
          <LegendIcon colorClass={colors.genericBooked} />
          <span className="text-[10px] sm:text-xs text-gray-600 leading-tight truncate font-medium">
            Booked
          </span>
        </div>

      </div>
    </div>
  );
};

export default SeatLegend;
