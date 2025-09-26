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
              className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${
                isSoldOut ? "opacity-60" : "hover:shadow-md"
              } mb-3`}
            >
              <button
                type="button"
                className={`w-full text-left ${isSoldOut ? "cursor-not-allowed" : ""}`}
                onClick={() => !isSoldOut && handleToggleSeatLayout(bus)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[15px] font-medium tabular-nums"
                        style={{
                          backgroundColor: "#ECFDF5",
                          color: "#065F46",
                          borderColor: "#A7F3D0",
                        }}
                      >
                        {bus.departureTime}
                      </span>

                      <div className="mt-1.5 text-xs text-gray-500 flex items-center">
                        <span className="inline-flex items-center gap-1">
                          <FaClock className="text-[10px]" />
                          {calculateDuration(bus.departureTime, bus.arrivalTime)}
                        </span>

                        {/* ✅ Arrival time added inline (compact) */}
                        {bus.arrivalTime && (
                          <>
                            <span className="mx-2">&middot;</span>
                            <span className="tabular-nums text-gray-700 font-semibold text-[12px]">
                              Arr {bus.arrivalTime}
                            </span>
                          </>
                        )}

                        {typeof availableSeats === "number" && (
                          <>
                            <span className="mx-2">&middot;</span>
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                              style={{
                                background: "#FFE9EC",
                                color: PALETTE.primaryRed,
                              }}
                            >
                              {availableSeats} seats left
                            </span>
                          </>
                        )}
                      </div>

                      {timerProps && (
                        <div className="mt-2 inline-flex">
                          <div
                            className="px-2 py-0.5 rounded-lg text-[11px]"
                            style={{ backgroundColor: "#FFF7ED" }}
                          >
                            <BookingDeadlineTimer {...timerProps} />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right pl-3">
                      {hasStrike && (
                        <div className="text-[12px] text-gray-400 line-through">
                          Rs. {bus.originalPrice}
                        </div>
                      )}
                      <div className="leading-tight">
                        <span className="text-[12px] text-gray-500 mr-1 align-top">
                          Rs.
                        </span>
                        <span className="text-[20px] font-semibold tabular-nums text-gray-900">
                          {displayPrice}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">Onwards</div>
                    </div>
                  </div>

                  <hr className="my-2 border-t border-gray-100" />

                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <h4 className="text-[15px] font-medium text-gray-800 truncate">
                        {bus.name}
                      </h4>
                      <p className="text-[12px] text-gray-500 truncate">{bus.busType}</p>
                    </div>
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
      {/* Header pill (more compact) */}
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
          {/* notices carousel (tighter spacing) */}
          <div className="mb-1">
            <SpecialNoticesSection />
          </div>

          {/* ✅ Compact redbus-style horizontal filter bar right under the notice */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar px-0.5 -mt-1 mb-2">
            {/* Filter & Sort */}
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

            {/* Time slots */}
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

            {/* Bus Type */}
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

          {/* card list */}
          <AnimatePresence>{renderCards()}</AnimatePresence>
        </div>
      </div>

      {/* mobile filter drawer */}
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

      {/* global mobile sheets */}
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
