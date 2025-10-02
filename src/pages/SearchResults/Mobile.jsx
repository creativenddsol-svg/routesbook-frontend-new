// src/pages/SearchResults/Mobile.jsx
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBus,
  FaClock,
  FaChevronLeft,
  FaSlidersH,
  FaPen,
  // FaStar, // Removed FaStar
} from "react-icons/fa";
import { TbSunrise, TbSun, TbSunset, TbMoon } from "react-icons/tb";

import {
  // shared context + helpers from _core (contract listed below)
  useSearchCore,
  PALETTE,
  calculateDuration,
  getDisplayPrice,
  getReadableDate,
  TIME_SLOTS, // ✅ import TIME_SLOTS for chips
} from "./_core";

// mobile-only leaf components
import BookingDeadlineTimer from "./components/BookingDeadlineTimer";
import FilterPanel from "./components/FilterPanel";
import SpecialNoticesSection from "./components/SpecialNoticesSection";
import MobileBottomSheet from "./components/MobileBottomSheet";
import MobileSearchSheet from "./components/MobileSearchSheet";
import MobileCityPicker from "./components/MobileCityPicker";
import MobileCalendarSheet from "./components/MobileCalendarSheet";

// ————————————————————————————————
// Local tiny skeleton used during loading
const BusCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 animate-pulse border border-gray-200 shadow-sm mb-3">
    <div className="flex justify-between">
      <div className="w-2/3">
        <div className="h-5 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
      </div>
      <div className="h-8 w-20 bg-gray-200 rounded" />
    </div>
    <div className="h-10 w-full bg-gray-100 rounded mt-3" />
  </div>
);

// simple fade/slide
const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const itemVariants = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// minimal icon per time slot (redbus-like)
const slotIcon = (slot) => {
  if (/morning/i.test(slot)) return TbSunrise;
  if (/afternoon/i.test(slot)) return TbSun;
  if (/evening/i.test(slot)) return TbSunset;
  if (/night/i.test(slot)) return TbMoon;
  return TbSun;
};


// --------------------------------------------------------------------------------------
// 🚨 NEW SHIMMER STYLES: This CSS is injected to create the shine effect.
// --------------------------------------------------------------------------------------
const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .shimmer-effect {
    position: relative;
    overflow: hidden;
    background-color: #FFF7ED; /* Base background color */
  }

  .shimmer-effect::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4) 30%, transparent 60%);
    transform: translateX(-100%);
    animation: shimmer 1.5s infinite linear;
    animation-delay: 0.5s; /* Delay to make it look like it's part of a loop */
  }
`;
// --------------------------------------------------------------------------------------


export default function Mobile() {
  const nav = useNavigate();
  const {
    from,
    to,
    searchDate,
    setSearchDate,
    searchDateParam,
    todayStr,
    loading,
    fetchError,
    // sortedBuses, // not used directly in renderCards
    visibleBuses,
    availability,

    // card open/close
    // expandedBusId, // not used in Mobile card render
    handleToggleSeatLayout,

    // filters + sort
    isFilterOpen,
    setIsFilterOpen,
    activeFilterCount,
    sortBy,
    setSortBy,
    filters,
    setFilters,

    // pickers/sheets
    // mobileSearchOpen, // not used directly, only setter
    setMobileSearchOpen,
    mobilePickerOpen,
    setMobilePickerOpen,
    mobilePickerMode,
    setMobilePickerMode,
    calOpen,
    setCalOpen,

    fromOptions,
    toOptions,
    recent,

    // navigation search update
    updateSearchWithDate,
    fetchData,
    handleMobilePick,
  } = useSearchCore();

  // hidden native <input type="date"> for the header chip quick change
  const mobileDateInputRef = useRef(null);
  // const openDateNative = () => mobileDateInputRef.current?.showPicker(); // Removed as we use the calendar sheet
  const onNativeDateChange = (e) => {
    const d = e.target.value;
    setSearchDate(d);
    updateSearchWithDate(d);
  };

  const activeIsSoldOut = (busKey) => {
    const a = availability?.[busKey];
    return typeof a?.available === "number" && a.available === 0;
  };

  // --------------------------------------------------------------------------------------
  // RENDER CARDS (UPDATED UI)
  // --------------------------------------------------------------------------------------
  const renderCards = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => <BusCardSkeleton key={i} />);
    }
    if (fetchError) {
      return (
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200">
          <div className="text-lg font-semibold mb-1" style={{ color: PALETTE.textDark }}>
            Oops! Something went wrong.
          </div>
          <div className="text-sm mb-4" style={{ color: PALETTE.textLight }}>
            {fetchError}
          </div>
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: PALETTE.accentBlue }}
          >
            Try again
          </button>
        </div>
      );
    }
    if (!visibleBuses.length) {
      return (
        <div className="text-center p-8 bg-white rounded-2xl border border-gray-200">
          <div className="text-lg font-semibold mb-1" style={{ color: PALETTE.textDark }}>
            {activeFilterCount ? "No Buses Match Your Filters" : "No Buses Available"}
          </div>
          <div className="text-sm" style={{ color: PALETTE.textLight }}>
            {activeFilterCount
              ? "Try adjusting or resetting your filters."
              : "No buses were found for this route on the selected date."}
          </div>
        </div>
      );
    }

    return (
      <motion.div 
        variants={listVariants} 
        initial="hidden" 
        animate="visible"
        className="space-y-3"
      >
        {visibleBuses.map((bus) => {
          const busKey = `${bus._id}-${bus.departureTime}`;
          const displayPrice = getDisplayPrice(bus, from, to);

          let timerProps = null;
          if (searchDateParam && bus.departureTime) {
            const now = new Date();
            const [depH, depM] = bus.departureTime.split(":").map(Number);
            // searchDateParam is YYYY-MM-DD
            const [yy, mm, dd] = searchDateParam.split("-").map(Number);
            // Date constructor: year, monthIndex (0-11), day, hour, minute
            const dep = new Date(yy, mm - 1, dd, depH, depM).getTime();
            const diffHrs = (dep - now.getTime()) / (1000 * 60 * 60);
            // Show timer if departure is within the next 12 hours
            if (diffHrs > 0 && diffHrs <= 12) {
              // Set deadline 1 hour before departure
              timerProps = {
                deadlineTimestamp: dep - 60 * 60 * 1000,
                departureTimestamp: dep,
                onDeadline: fetchData, // Refresh data on deadline
              };
            }
          }

          const a = availability?.[busKey];
          const availableSeats = a?.available;
          const isSoldOut = activeIsSoldOut(busKey);
          const hasStrike =
            typeof bus.originalPrice === "number" && bus.originalPrice > displayPrice;

          return (
            <motion.div
              key={busKey}
              variants={itemVariants}
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${
                isSoldOut ? "opacity-60" : "hover:shadow-md"
              }`}
            >
              <button
                type="button"
                className={`w-full text-left p-4 ${isSoldOut ? "cursor-not-allowed" : ""}`}
                onClick={() => !isSoldOut && handleToggleSeatLayout(bus)}
                disabled={isSoldOut} // Disable the whole card if sold out
              >
                {/* START: Card Content - FINAL UI with Shimmer */}
                
                {/* 1. Bus Operator & Type Group (Top Left) */}
                <div className="flex items-start justify-between">
                    <div className="min-w-0 pr-3 flex-1">
                        {/* Operator Name */}
                        <p className="text-sm font-semibold text-gray-900 truncate mb-1">
                            {bus.name}
                        </p>
                        
                        {/* Bus Type and Seat Count Pills (Aligned on second line) */}
                        <div className="flex items-center gap-2">
                           {/* Bus Type in Light Gray Pill - Non-Bold, Black Text */}
                            <span 
                                className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                                style={{ 
                                  color: '#1F2937', // Gray 900 (Black)
                                  backgroundColor: '#F3F4F6', // Gray 100
                                }}
                            >
                                {bus.busType}
                            </span>
                            {/* Seat Count Down Pill - Non-Bold, Black Text */}
                            {typeof availableSeats === "number" && (
                              <span
                                  className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full"
                                  style={{ 
                                    color: '#1F2937', // Gray 900 (Black)
                                    backgroundColor: '#F3F4F6', // Gray 100
                                  }}
                              >
                                  {availableSeats} Seats
                              </span>
                            )}
                        </div>
                    </div>

                    {/* Operator Logo/Placeholder (Top Right) */}
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100">
                      {bus.operatorLogo ? (
                        <img
                          src={bus.operatorLogo}
                          alt={`${bus.name} logo`}
                          className="max-w-full max-h-full object-contain rounded-full"
                        />
                      ) : (
                        <FaBus className="text-lg text-gray-400" />
                      )}
                    </div>
                </div>

                {/* --- Divider for Main Info Section --- */}
                <hr className="my-3 border-gray-100" />

                {/* 2. Time & Duration Group (Compact, one line with labels below) */}
                <div className="flex items-center justify-between">
                    
                    {/* DEPARTURE TIME + LABEL */}
                    <div className="flex flex-col items-start min-w-0 pr-1 text-left">
                        <span className="text-xl tabular-nums text-black font-semibold">
                            {bus.departureTime}
                        </span>
                        {/* New label style */}
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">
                            Departure
                        </p>
                    </div>

                    {/* DURATION (CENTERED) */}
                    <div className="flex flex-col items-center flex-1 mx-2">
                         <span className="text-[10px] text-gray-500">
                            {calculateDuration(bus.departureTime, bus.arrivalTime)}
                        </span>
                        <span className="h-[1px] w-full bg-gray-300 rounded-full my-1" />
                        <span className="text-[10px] text-gray-500 uppercase">Duration</span>
                    </div>

                    {/* ARRIVAL TIME + LABEL */}
                    <div className="flex flex-col items-end min-w-0 pl-1 text-right">
                        <span className="text-xl tabular-nums text-gray-500 font-medium">
                            {bus.arrivalTime}
                        </span>
                        {/* New label style */}
                        <p className="text-[10px] text-gray-500 mt-1 uppercase">
                            Arrival
                        </p>
                    </div>
                </div>

                {/* --- Price and Countdown (Bottom Action Strip) --- */}
                <hr className="my-3 border-gray-100" />
                <div className="flex items-center justify-between mt-3">
                    
                    {/* Booking Deadline Timer (LEFT SIDE) - Non-Bold, Black Text */}
                     <div className="flex-1 min-w-0">
                         {timerProps && (
                             <span
                                 className="shimmer-effect px-2 py-0.5 rounded-full text-xs inline-block relative"
                                 style={{ color: "#1F2937" }} // Gray 900 (Black)
                             >
                                 <BookingDeadlineTimer {...timerProps} />
                             </span>
                         )}
                     </div>
                    
                    {/* Price Block (RIGHT SIDE - Black, smaller font) */}
                    <div className="flex-shrink-0 leading-tight flex flex-col items-end">
                         {hasStrike && (
                            <div className="text-[10px] text-gray-400 line-through">
                                Rs. {bus.originalPrice}
                            </div>
                         )}
                        <div className="flex items-baseline">
                            <span className="text-sm text-gray-600 mr-0.5 align-bottom">
                                Rs.
                            </span>
                            {/* Price is text-xl and only font-semibold (not extra bold) */}
                            <span
                                className="text-xl tabular-nums text-black font-semibold"
                            >
                                {displayPrice}
                            </span>
                        </div>
                    </div>
                </div>

                {/* END: Card Content */}
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };
  // --------------------------------------------------------------------------------------
  // END RENDER CARDS
  // --------------------------------------------------------------------------------------

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
       {/* 🚨 INJECTING SHIMMER STYLES */}
      <style>{shimmerStyles}</style>

      {/* Header pill - Fixed at top */}
      <div className="sticky top-0 z-10 bg-white px-4 pt-2 pb-2 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => nav(-1)}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 mr-2 flex-shrink-0"
            aria-label="Go back"
          >
            <FaChevronLeft className="text-lg" />
          </button>

          <button
            onClick={() => setMobileSearchOpen(true)}
            className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-gray-100 mr-2"
          >
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[13px] font-semibold text-gray-900">
                {from && to ? `${from} → ${to}` : "Search route"}
              </span>
              <span className="text-[11px] text-gray-600">
                {searchDate ? getReadableDate(searchDate) : "Select Date"}
              </span>
            </div>
            <FaPen className="text-gray-700 text-sm flex-shrink-0 ml-2" />
          </button>
          
          {/* Quick Date Change Button */}
          <button
            onClick={() => setCalOpen(true)}
            className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex-shrink-0"
            aria-label="Change date"
          >
            {/* The calendar icon or a small date representation could go here */}
            <FaClock className="text-gray-700 text-base" /> 
          </button>
          

          <input
            ref={mobileDateInputRef}
            type="date"
            value={searchDate}
            min={todayStr}
            onChange={onNativeDateChange}
            className="absolute opacity-0 pointer-events-none"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
      </div>
      
      {/* Filter/Chip Section */}
      <div className="bg-white sticky top-[60px] z-10 py-2 border-b border-gray-200 shadow-xs"> 
        <div className="max-w-7xl mx-auto px-4">
            <SpecialNoticesSection />

            <div className="flex gap-2 overflow-x-auto hide-scrollbar pt-1 pb-1">
              
              {/* 1. Filter/Sort Button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center gap-1.5 h-8 px-2.5 border border-gray-200 rounded-xl text-[12.5px] leading-none font-medium bg-white whitespace-nowrap flex-shrink-0 shadow-sm"
                aria-label="Open Filter & Sort"
              >
                <FaSlidersH className="text-[14px]" />
                {"Filter \u00A0&\u00A0 Sort"}
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 text-[11px] font-semibold text-white bg-red-500 rounded-full w-4 h-4 flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* 2. Time Slot Chips */}
              {Object.keys(TIME_SLOTS).map((slot) => {
                const Icon = slotIcon(slot);
                const active = !!filters.timeSlots[slot];
                return (
                  <button
                    key={slot}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
                      }))
                    }
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12.5px] leading-none font-medium whitespace-nowrap border flex-shrink-0 transition duration-150 ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                    }`}
                    aria-pressed={active}
                  >
                    <Icon className="text-[16px]" />
                    {slot}
                  </button>
                );
              })}

              {/* 3. AC/Non-AC Chips */}
              {["AC", "Non-AC"].map((type) => {
                const active = filters.type === type;
                return (
                  <button
                    key={type}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        type: prev.type === type ? "" : type, // Toggle logic
                      }))
                    }
                    className={`h-8 px-3 rounded-xl text-[12.5px] leading-none font-medium whitespace-nowrap border flex-shrink-0 transition duration-150 ${
                      active
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50"
                    }`}
                    aria-pressed={active}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
        </div>
      </div>
      {/* --- End of Sticky Filter/Chip Section --- */}


      {/* Main Bus List Content */}
      <div className="flex-1 w-full pb-6 pt-3">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatePresence>{renderCards()}</AnimatePresence>
        </div>
      </div>
      {/* --- End of Main Content --- */}


      {/* Filter Panel (Left Side Sheet) */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            {/* Panel */}
            <motion.div
              className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white z-50 overflow-y-auto rounded-r-2xl shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              {/* Pass necessary props to FilterPanel */}
              <FilterPanel 
                isMobile 
                sortBy={sortBy} 
                setSortBy={setSortBy} 
                filters={filters}
                setFilters={setFilters}
                onClose={() => setIsFilterOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Other Sheets/Modals */}
      <MobileBottomSheet />
      <MobileSearchSheet />
      <MobileCityPicker
        open={mobilePickerOpen}
        mode={mobilePickerMode}
        options={mobilePickerMode === "from" ? fromOptions : toOptions}
        recent={recent}
        onPick={handleMobilePick}
        onClose={() => setMobilePickerOpen(false)}
      />
      <MobileCalendarSheet
        open={calOpen}
        value={searchDate}
        minDateString={todayStr}
        onPick={(d) => {
          setSearchDate(d);
          updateSearchWithDate(d); // Update URL/trigger new search
          setCalOpen(false);
        }}
        onClose={() => setCalOpen(false)}
      />
    </div>
  );
}
