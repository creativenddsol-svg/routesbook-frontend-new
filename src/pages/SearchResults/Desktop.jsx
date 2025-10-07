// src/pages/SearchResults/Desktop.jsx
import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import {
  FaBus,
  FaClock,
  FaRoute,
  FaChevronLeft,
  FaExchangeAlt,
  FaSearch,
} from "react-icons/fa";

import {
  // shared context + helpers from _core
  useSearchCore,
  PALETTE,
  calculateDuration,
  getDisplayPrice,
  getReadableDate,
} from "./_core";

import BookingDeadlineTimer from "./components/BookingDeadlineTimer";
import FilterPanel from "./components/FilterPanel";
import SpecialNoticesSection from "./components/SpecialNoticesSection";

import SeatLayout from "../../components/SeatLayout";
import SeatLegend from "../../components/SeatLegend";
import BookingSummary from "../../components/BookingSummary";
import PointSelection from "../../components/PointSelection";

/* ————————————————————————————————
   Small skeleton while loading
——————————————————————————————— */
const BusCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-300">
    <div className="flex justify-between items-start">
      <div className="flex-1 pr-4">
        <div className="h-6 w-3/5 rounded bg-gray-200 mb-4" />
        <div className="h-4 w-4/5 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-24 rounded-lg bg-gray-200" />
    </div>
    <div className="border-t border-dashed my-5 border-gray-200" />
    <div className="flex justify-between items-center">
      <div className="flex gap-4">
        <div className="h-8 w-24 rounded-full bg-gray-200" />
        <div className="h-8 w-24 rounded-full bg-gray-200" />
      </div>
      <div className="h-12 w-32 rounded-lg bg-gray-200" />
    </div>
  </div>
);

const listVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const itemVariants = { hidden: { y: 16, opacity: 0 }, visible: { y: 0, opacity: 1 } };

export default function Desktop() {
  const {
    // routing/search context
    navigate,
    from,
    to,
    searchDate,
    setSearchDate,
    searchDateParam,

    // options + inputs
    fromOptions,
    toOptions,
    searchFrom,
    setSearchFrom,
    searchTo,
    setSearchTo,
    dateInputRef,
    handleDateContainerClick,
    handleModifySearch,
    todayStr,
    tomorrowStr,

    // data
    loading,
    fetchError,
    visibleBuses,
    sortedBuses,
    availability,
    fetchData,

    // filters
    sortBy,
    setSortBy,
    activeFilterCount,

    // sticky bits
    stickySearchCardRef,
    stickySearchCardOwnHeight,

    // booking state/actions
    expandedBusId,
    handleToggleSeatLayout,
    handleSeatToggle,
    busSpecificBookingData,
    handleBoardingPointSelect,
    handleDroppingPointSelect,

    // 🆕 ensure desktop can add-to-cart/continue using the same core flow
    handleProceedToPayment,
  } = useSearchCore();

  const selectStyles = {
    control: (p) => ({
      ...p,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      minHeight: "auto",
      height: "auto",
      cursor: "pointer",
    }),
    valueContainer: (p) => ({ ...p, padding: "0" }),
    placeholder: (p) => ({
      ...p,
      color: PALETTE.textLight,
      fontSize: "16px",
      fontWeight: "500",
    }),
    singleValue: (p) => ({
      ...p,
      color: PALETTE.textDark,
      fontSize: "18px",
      fontWeight: "600",
    }),
    menu: (p) => ({
      ...p,
      borderRadius: "12px",
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    }),
    menuPortal: (p) => ({ ...p, zIndex: 9999 }),
    option: (p, state) => ({
      ...p,
      backgroundColor: state.isSelected
        ? PALETTE.primaryRed
        : state.isFocused
        ? "#FEE2E2"
        : PALETTE.white,
      color: state.isSelected ? PALETTE.white : PALETTE.textDark,
      cursor: "pointer",
      padding: "12px 16px",
      transition: "background-color 0.2s ease, color 0.2s ease",
    }),
  };

  const filterPanelTopOffset = useMemo(() => {
    // keep the sidebar just below the sticky search card
    return stickySearchCardOwnHeight + 16;
  }, [stickySearchCardOwnHeight]);

  const renderCards = () => {
    if (loading) {
      return Array.from({ length: 5 }).map((_, i) => <BusCardSkeleton key={i} />);
    }
    if (fetchError) {
      return (
        <div className="text-center p-10 bg-white rounded-2xl shadow">
          <h3 className="text-2xl font-bold mb-2" style={{ color: PALETTE.textDark }}>
            Oops! Something went wrong.
          </h3>
          <p className="mb-6" style={{ color: PALETTE.textLight }}>{fetchError}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 font-semibold rounded-lg text-white"
            style={{ backgroundColor: PALETTE.accentBlue }}
          >
            Try again
          </button>
        </div>
      );
    }
    if (!visibleBuses.length) {
      return (
        <div className="text-center p-10 bg-white rounded-2xl shadow">
          <h3 className="text-2xl font-bold mb-2" style={{ color: PALETTE.textDark }}>
            {activeFilterCount ? "No Buses Match Your Filters" : "No Buses Available"}
          </h3>
          <p className="mb-6" style={{ color: PALETTE.textLight }}>
            {activeFilterCount
              ? "Try adjusting or resetting your filters."
              : "No buses were found for this route on the selected date."}
          </p>
        </div>
      );
    }

    return (
      <motion.div variants={listVariants} initial="hidden" animate="visible">
        {visibleBuses.map((bus) => {
          const busKey = `${bus._id}-${bus.departureTime}`;
          const displayPrice = getDisplayPrice(bus, from, to);

          // Timer within 12h window
          let timerProps = null;
          if (searchDateParam && bus.departureTime) {
            const now = new Date();
            const [h, m] = bus.departureTime.split(":").map(Number);
            const [yy, mm, dd] = searchDateParam.split("-").map(Number);
            const dep = new Date(yy, mm - 1, dd, h, m).getTime();
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
          const availableWindowSeats = a?.window;
          const isSoldOut = availableSeats === 0;

          const currentBusBookingData = busSpecificBookingData[busKey] || {
            selectedSeats: [],
            seatGenders: {},
            selectedBoardingPoint: bus.boardingPoints?.[0] || null,
            selectedDroppingPoint: bus.droppingPoints?.[0] || null,
            basePrice: 0,
            convenienceFee: 0,
            totalPrice: 0,
          };

          const hasStrike =
            typeof bus.originalPrice === "number" &&
            bus.originalPrice > displayPrice;

          return (
            <motion.div
              key={busKey}
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md mb-4"
            >
              {/* Desktop card */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 flex items-center justify-center">
                        {bus.operatorLogo ? (
                          <img
                            src={bus.operatorLogo}
                            alt={`${bus.name} logo`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <FaBus className="text-3xl text-gray-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{bus.name}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-600">{bus.busType}</p>
                        </div>
                        {bus.liveTracking && (
                          <p className="text-xs font-medium mt-1 flex items-center gap-1 text-gray-500">
                            <FaRoute /> Live Tracking
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-1">
                      <div className="flex items-center">
                        <div className="flex flex-col min-w-[84px]">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">Departs</span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.departureTime}
                          </span>
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="h-[2px] w-full rounded bg-gray-200" />
                        </div>
                        <div className="flex flex-col min-w-[84px] text-right">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">Arrives</span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.arrivalTime}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <FaClock /> {calculateDuration(bus.departureTime, bus.arrivalTime)}
                        </span>
                        {typeof availableSeats === "number" && <span>{availableSeats} seats</span>}
                        {typeof availableWindowSeats === "number" && availableWindowSeats > 0 && (
                          <span>{availableWindowSeats} window</span>
                        )}
                      </div>
                    </div>

                    {timerProps && (
                      <BookingDeadlineTimer {...timerProps} />
                    )}
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          typeof availableSeats === "number" && availableSeats > 0
                            ? "#EF4444"
                            : "#9CA3AF",
                      }}
                    >
                      {isSoldOut
                        ? "Sold Out"
                        : availableSeats == null
                        ? "Checking..."
                        : `${availableSeats} Seats Left`}
                    </p>

                    <div className="mt-2 inline-block text-right">
                      {hasStrike && (
                        <div className="text-xs line-through text-gray-400">Rs. {bus.originalPrice}</div>
                      )}
                      <div className="leading-tight">
                        <span className="text-[11px] font-medium mr-1 align-top text-gray-500">Rs.</span>
                        <span className="text-2xl font-bold tabular-nums text-gray-900">{displayPrice}</span>
                      </div>
                      <div className="text-[11px] font-medium mt-0.5 text-gray-500">Onwards</div>
                    </div>

                    <button
                      onClick={() => handleToggleSeatLayout(bus)}
                      disabled={isSoldOut}
                      className="w-full md:w-auto mt-3 px-6 py-2.5 text-white font-semibold rounded-full transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ backgroundColor: isSoldOut ? "#9CA3AF" : "#DC2626" }}
                    >
                      {isSoldOut
                        ? "Sold Out"
                        : expandedBusId === busKey
                        ? "Hide Seats"
                        : "View seats"}
                    </button>
                  </div>
                </div>

                {expandedBusId === busKey && (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="mt-6 border-t pt-6 border-gray-200"
                    >
                      <div className="grid grid-cols-2 gap-4 items-start">
                        <div className="col-span-1 flex flex-col gap-4">
                          <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 h-full">
                            <SeatLegend />
                            <SeatLayout
                              seatLayout={bus.seatLayout}
                              bookedSeats={[...(a?.bookedSeats || [])]}
                              selectedSeats={currentBusBookingData.selectedSeats}
                              onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                              bookedSeatGenders={a?.seatGenderMap || {}}
                              /* ✅ use the tracked genders from current booking data */
                              selectedSeatGenders={currentBusBookingData.seatGenders || {}}
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex flex-col gap-4">
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <PointSelection
                              boardingPoints={bus.boardingPoints}
                              droppingPoints={bus.droppingPoints}
                              selectedBoardingPoint={currentBusBookingData.selectedBoardingPoint}
                              setSelectedBoardingPoint={(p) => handleBoardingPointSelect(bus, p)}
                              selectedDroppingPoint={currentBusBookingData.selectedDroppingPoint}
                              setSelectedDroppingPoint={(p) => handleDroppingPointSelect(bus, p)}
                            />
                          </div>
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <BookingSummary
                              bus={bus}
                              selectedSeats={currentBusBookingData.selectedSeats}
                              date={searchDateParam}
                              basePrice={currentBusBookingData.basePrice}
                              convenienceFee={currentBusBookingData.convenienceFee}
                              totalPrice={currentBusBookingData.totalPrice}
                              /* ✅ FIX: use core flow so seats are actually added to cart (or continue) */
                              onProceed={() => handleProceedToPayment(bus)}
                              boardingPoint={currentBusBookingData.selectedBoardingPoint}
                              droppingPoint={currentBusBookingData.selectedDroppingPoint}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: PALETTE.bgLight }}>
      {/* Header */}
      <div className="w-full bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="hidden lg:block">
            <div className="flex items-center mb-2">
              <FaChevronLeft
                className="text-xl mr-2 cursor-pointer"
                onClick={() => navigate(-1)}
              />
              <span className="text-sm font-medium" style={{ color: PALETTE.textLight }}>
                Bus Ticket
              </span>
              <span className="mx-1 text-gray-400 text-sm">&gt;</span>
              <span className="text-sm font-medium" style={{ color: PALETTE.textLight }}>
                {from} to {to} Bus
              </span>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: PALETTE.textDark }}>
              {from} <FaExchangeAlt className="inline-block mx-2 text-gray-500" /> {to}
            </h1>
            {!loading && !fetchError && (
              <p className="text-sm text-gray-500 mb-4">{sortedBuses.length} buses</p>
            )}
          </div>
        </div>
      </div>

      {/* Sticky search controls (desktop) */}
      <div
        ref={stickySearchCardRef}
        className="sticky top-0 z-40 w-full bg-opacity-95 backdrop-blur-sm shadow-sm"
        style={{ backgroundColor: `${PALETTE.white}F2` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-white border border-gray-300 rounded-3xl">
            <div className="hidden lg:flex rounded-2xl">
              <div className="relative flex-1 p-4 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    From
                  </label>
                  <Select
                    options={fromOptions}
                    value={searchFrom ? { value: searchFrom, label: searchFrom } : null}
                    onChange={(s) => setSearchFrom(s?.value || "")}
                    placeholder="Select departure"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                  />
                </div>
                <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-20">
                  <button
                    className="bg-white p-2 rounded-full shadow-lg"
                    style={{ border: `2px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                    onClick={() => {
                      setSearchFrom(searchTo);
                      setSearchTo(searchFrom);
                    }}
                  >
                    <FaExchangeAlt style={{ color: PALETTE.textLight }} />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    To
                  </label>
                  <Select
                    options={toOptions}
                    value={searchTo ? { value: searchTo, label: searchTo } : null}
                    onChange={(s) => setSearchTo(s?.value || "")}
                    placeholder="Select destination"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                  />
                </div>
              </div>

              <div className="flex-1 p-4 flex items-center">
                <div className="mr-4">
                  <svg width="22" height="22" viewBox="0 0 24 24" className="text-gray-400"><path fill="currentColor" d="M7 11h5v5H7z"/><path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5a3 3 0 0 0-3 3v11a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3m1 14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10h16z"/></svg>
                </div>
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    Date of Journey
                  </label>
                  <div onClick={handleDateContainerClick} className="cursor-pointer">
                    <span className="text-lg font-medium" style={{ color: PALETTE.textDark }}>
                      {getReadableDate(searchDate)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={() => setSearchDate(todayStr)}
                      className="text-xs font-medium mr-3 hover:underline"
                      style={{ color: searchDate === todayStr ? PALETTE.primaryRed : PALETTE.accentBlue }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setSearchDate(tomorrowStr)}
                      className="text-xs font-medium hover:underline"
                      style={{ color: searchDate === tomorrowStr ? PALETTE.primaryRed : PALETTE.accentBlue }}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                  min={todayStr}
                  className="absolute opacity-0 pointer-events-none"
                />
              </div>

              <div className="p-3 flex items-center">
                <button
                  onClick={handleModifySearch}
                  className="font-heading w-full lg:w-auto flex items-center justify-center gap-2 text-white font-bold tracking-wider px-8 py-3 rounded-xl shadow-lg"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch /> SEARCH
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 w-full pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 items-start">
            {/* Sidebar filters (desktop) */}
            <aside
              className="hidden lg:block lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-300 sticky"
              style={{ top: `${filterPanelTopOffset}px`, zIndex: 20 }}
            >
              <FilterPanel isMobile={false} sortBy={sortBy} setSortBy={setSortBy} />
            </aside>

            {/* Main column */}
            <main className="lg:col-span-3 space-y-5">
              <SpecialNoticesSection />
              <AnimatePresence>{renderCards()}</AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
