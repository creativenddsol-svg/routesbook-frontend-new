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
} from "react-icons/fa";
import { TbSunrise, TbSun, TbSunset, TbMoon } from "react-icons/tb";

import {
  // shared context + helpers from _core (contract listed below)
  useSearchCore,
  PALETTE,
  calculateDuration,
  getDisplayPrice,
  getReadableDate,
  getMobileDateParts,
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
  <div className="bg-white rounded-2xl p-4 animate-pulse border border-gray-200">
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
    sortedBuses,
    visibleBuses,
    availability,

    // card open/close
    expandedBusId,
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
    mobileSearchOpen,
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
  const openDateNative = () => mobileDateInputRef.current?.showPicker();
  const onNativeDateChange = (e) => {
    const d = e.target.value;
    setSearchDate(d);
    updateSearchWithDate(d);
  };

  const activeIsSoldOut = (busKey) => {
    const a = availability?.[busKey];
    return typeof a?.available === "number" && a.available === 0;
  };

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
      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {visibleBuses.map((bus) => {
          const busKey = `${bus._id}-${bus.departureTime}`;
          const displayPrice = getDisplayPrice(bus, from, to);

          let timerProps = null;
          if (searchDateParam && bus.departureTime) {
            const now = new Date();
            const [depH, depM] = bus.departureTime.split(":").map(Number);
            const [yy, mm, dd] = searchDateParam.split("-").map(Number);
            const dep = new Date(yy, mm - 1, dd, depH, depM).getTime();
            const diffHrs = (dep - now.getTime()) / (1000 * 60 * 60);
            if (diffHrs > 0 && diffHrs <= 12) {
              timerProps = {
                deadlineTimestamp: dep - 60 * 60 * 1000,
                departureTimestamp: dep,
                onDeadline: fetchData,
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
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm ${ // Added shadow-sm for better separation
                isSoldOut ? "opacity-60" : "hover:shadow-md"
              } mb-3`} // mb-3 for consistent spacing
            >
              <button
                type="button"
                className={`w-full text-left ${isSoldOut ? "cursor-not-allowed" : ""}`}
                onClick={() => !isSoldOut && handleToggleSeatLayout(bus)}
              >
                {/* START: Card Content (p-4 for better padding/spacing)
                */}
                <div className="p-4"> 
                  {/* 1. Bus Operator & Type Group (Top Section) */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0 pr-3">
                      {/* Typo Hierarchy: Bus Name is biggest/boldest */}
                      <h4 className="text-lg font-bold text-gray-900 truncate">
                        {bus.name}
                      </h4>
                      {/* Bus Type is secondary, lighter text */}
                      <p className="text-sm text-gray-600 truncate mt-0.5">
                        {bus.busType}
                      </p>
                      {/* TODO: Add a rating element here if available, for trust */}
                    </div>
                    {/* Operator Logo (moved here for grouping) */}
                    <div className="w-16 h-10 flex-shrink-0 flex items-center justify-center">
                      {bus.operatorLogo ? (
                        <img
                          src={bus.operatorLogo}
                          alt={`${bus.name} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <FaBus className="text-2xl text-gray-300" />
                      )}
                    </div>
                  </div>

                  {/* 2. Time & Duration Group (Middle Section) */}
                  <div className="flex items-center justify-between mt-3 mb-4">
                    {/* Departure Time */}
                    <div className="text-center">
                      <span className="text-xl font-bold tabular-nums text-gray-900">
                        {bus.departureTime}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {from}
                      </p>
                    </div>

                    {/* Duration Display */}
                    <div className="flex flex-col items-center flex-1 mx-3">
                      <span className="text-[12px] font-medium text-gray-700 whitespace-nowrap">
                        {calculateDuration(bus.departureTime, bus.arrivalTime)}
                      </span>
                      <span className="h-[1px] w-full bg-gray-300 rounded-full my-1.5" />
                      <FaClock className="text-[14px] text-gray-500" />
                    </div>

                    {/* Arrival Time */}
                    <div className="text-center">
                      <span className="text-xl font-bold tabular-nums text-gray-900">
                        {bus.arrivalTime}
                      </span>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {to}
                      </p>
                    </div>
                  </div>

                  {/* Seats-left / Timer (Below Timing) */}
                  <div className="flex items-center gap-2 mb-2">
                    {typeof availableSeats === "number" && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{
                          background: availableSeats <= 5 ? "#FFE9EC" : "#E6FFFA", // Red for low seats, Green for high
                          color: availableSeats <= 5 ? PALETTE.primaryRed : "#065F46",
                        }}
                      >
                        {availableSeats} seats left
                      </span>
                    )}

                    {timerProps && (
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{ backgroundColor: "#FFF7ED", color: "#B45309" }}
                      >
                        <BookingDeadlineTimer {...timerProps} />
                      </span>
                    )}
                  </div>
                </div>
                {/* END: Card Content
                */}

                {/* 3. Price & CTA Group (Footer Section) */}
                <div
                  className="p-4 pt-3 flex items-center justify-between rounded-b-xl border-t"
                  style={{ borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" }} // Subtle background for the footer
                >
                  {/* Price Block */}
                  <div className="leading-tight">
                    {hasStrike && (
                      <div className="text-xs text-gray-500 line-through">
                        Rs. {bus.originalPrice}
                      </div>
                    )}
                    <div className="flex items-baseline">
                      <span className="text-sm text-gray-500 mr-1 align-bottom">
                        Rs.
                      </span>
                      {/* Price is largest/boldest in its group */}
                      <span
                        className="text-2xl font-extrabold tabular-nums"
                        style={{ color: PALETTE.primaryRed }}
                      >
                        {displayPrice}
                      </span>
                    </div>
                  </div>

                  {/* CTA Button - High Contrast */}
                  <div className="flex-shrink-0">
                    <button
                      type="button"
                      // Use a strong, non-primary-blue color for the action button
                      style={{ backgroundColor: PALETTE.primaryRed, color: 'white' }} 
                      className="px-6 py-2 rounded-lg font-bold text-sm shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        !isSoldOut && handleToggleSeatLayout(bus);
                      }}
                      disabled={isSoldOut}
                    >
                      {isSoldOut ? "SOLD OUT" : "View Seats"}
                    </button>
                  </div>
                </div>
              </button>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5]">
      {/* Header pill */}
      <div className="bg-white px-4 pt-2 pb-1.5">
        <div className="flex items-center">
          <button
            onClick={() => nav(-1)}
            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 mr-2"
            aria-label="Go back"
          >
            <FaChevronLeft className="text-lg" />
          </button>

          <button
            onClick={() => setMobileSearchOpen(true)}
            className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-2xl bg-gray-100"
          >
            <div className="flex flex-col text-left leading-tight">
              <span className="text-[13px] font-semibold text-gray-900">
                {from && to ? `${from} → ${to}` : "Search route"}
              </span>
              <span className="text-[11px] text-gray-600">
                {searchDate ? getReadableDate(searchDate) : "Select Date"}
              </span>
            </div>
            <FaPen className="text-gray-700 text-sm" />
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

      {/* content */}
      <div className="flex-1 w-full pb-6">
        <div className="max-w-7xl mx-auto px-4 pt-1">
          <div className="mb-1">
            <SpecialNoticesSection />
          </div>

          <div className="flex gap-1 overflow-x-auto hide-scrollbar px-0.5 -mt-1 mb-2">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-1.5 h-8 px-2.5 border border-gray-200 rounded-xl text-[12.5px] leading-none font-medium bg-white whitespace-nowrap"
              aria-label="Open Filter & Sort"
            >
              <FaSlidersH className="text-[14px]" />
              {"Filter \u00A0&\u00A0 Sort"}
              {activeFilterCount > 0 && (
                <span className="ml-0.5 text-[11px] font-semibold text-red-600">
                  ({activeFilterCount})
                </span>
              )}
            </button>

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
                  className={`flex items-center gap-1.5 h-8 px-2.5 rounded-xl text-[12.5px] leading-none font-medium whitespace-nowrap border ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-800 border-gray-200"
                  }`}
                  aria-pressed={active}
                >
                  <Icon className="text-[16px]" />
                  {slot}
                </button>
              );
            })}

            {["AC", "Non-AC"].map((type) => {
              const active = filters.type === type;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: prev.type === type ? "" : type,
                    }))
                  }
                  className={`h-8 px-2.5 rounded-xl text-[12.5px] leading-none font-medium whitespace-nowrap border ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-800 border-gray-200"
                  }`}
                  aria-pressed={active}
                >
                  {type}
                </button>
              );
            })}
          </div>

          <AnimatePresence>{renderCards()}</AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white z-50 overflow-y-auto rounded-r-2xl shadow-xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <FilterPanel isMobile sortBy={sortBy} setSortBy={setSortBy} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
        onPick={(d) => setSearchDate(d)}
        onClose={() => setCalOpen(false)}
      />
    </div>
  );
}
