// src/pages/SearchResults/Desktop.jsx
import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Select, { components } from "react-select";
import {
  FaBus,
  FaClock,
  FaRoute,
  FaChevronLeft,
  FaExchangeAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaCalendarAlt,
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

/* ------------------------------------------------------------------
   Desktop calendar popover (copied to match Home.jsx look & behavior)
-------------------------------------------------------------------*/
const toLocalYYYYMMDD = (dateObj) => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};
const parseYMD = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const sameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const CalendarPopover = ({
  anchorRef,
  open,
  value,
  minDateString,
  onChange,
  onClose,
}) => {
  const popRef = useRef(null);
  const today = new Date();
  const minDate = minDateString ? parseYMD(minDateString) : today;
  const selected = value ? parseYMD(value) : null;

  const [viewMonth, setViewMonth] = useState(
    selected ? startOfMonth(selected) : startOfMonth(today)
  );

  // close on outside/esc
  useState(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (
        popRef.current &&
        !popRef.current.contains(e.target) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose?.();
      }
    };
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose, anchorRef]);

  // sync view when value changes
  useState(() => {
    if (selected) setViewMonth(startOfMonth(selected));
  }, [value]);

  if (!open || !anchorRef.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();
  const top = rect.bottom + 8;
  const width = 360;
  const maxLeft = Math.max(8, window.innerWidth - width - 8);
  const left = Math.min(rect.left, maxLeft);

  const start = startOfMonth(viewMonth);
  const end = endOfMonth(viewMonth);
  const firstDow = (start.getDay() + 6) % 7;
  const totalCells = firstDow + end.getDate();
  const rows = Math.ceil(totalCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayNum = i - firstDow + 1;
    if (dayNum < 1 || dayNum > end.getDate()) return null;
    return new Date(viewMonth.getFullYear(), viewMonth.getMonth(), dayNum);
  });

  const isDisabled = (d) =>
    d < new Date(new Date().toDateString()) || d < minDate;

  const selectDay = (d) => {
    if (isDisabled(d)) return;
    onChange?.(toLocalYYYYMMDD(d));
    onClose?.();
  };

  return (
    <div
      ref={popRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ top, left, zIndex: 9999, width, position: "fixed" }}
      className="bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2 border-b border-gray-100">
        <div className="text-xs uppercase font-medium tracking-wider text-gray-500">
          Date of Journey
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="text-base font-semibold text-gray-900">
            {value
              ? parseYMD(value).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Select Date"}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="w-8 h-8 rounded-full border hover:bg-gray-50 border-gray-200"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-full border hover:bg-gray-50 border-gray-200"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-1 text-sm font-medium text-gray-900">
          {viewMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs py-2 text-gray-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="select-none">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
        {cells.map((d, idx) => {
          if (!d) return <div key={idx} />;

          const selectedDay = value && sameYMD(parseYMD(value), d);
          const isToday = sameYMD(new Date(), d);
          const disabled = isDisabled(d);

          let classes =
            "mx-auto my-1 flex items-center justify-center w-9 h-9 rounded-full text-sm transition select-none ";
          if (disabled) classes += "text-gray-300 cursor-not-allowed";
          else if (selectedDay) classes += "text-white font-semibold";
          else classes += "hover:bg-red-50 cursor-pointer";

          return (
            <button
              key={idx}
              className={classes}
              onClick={() => selectDay(d)}
              style={{
                backgroundColor: selectedDay ? "#D84E55" : undefined,
                border:
                  isToday && !selectedDay ? "1px solid #D84E55" : undefined,
                color: disabled ? "#D1D5DB" : selectedDay ? "#FFFFFF" : "#1A1A1A",
              }}
              disabled={disabled}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="space-x-3">
          <button
            onClick={() => {
              const t = new Date();
              onChange?.(toLocalYYYYMMDD(t));
              onClose?.();
            }}
            className="text-sm font-medium text-[#3A86FF] hover:underline"
          >
            Today
          </button>
          <button
            onClick={() => {
              const tm = new Date();
              tm.setDate(tm.getDate() + 1);
              onChange?.(toLocalYYYYMMDD(tm));
              onClose?.();
            }}
            className="text-sm font-medium text-[#3A86FF] hover:underline"
          >
            Tomorrow
          </button>
        </div>

        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
};

/* ---------------- Popular cities + CustomMenu (same as Home.jsx) --------------- */
const POPULAR_CITIES = [
  "Colombo",
  "Kandy",
  "Galle",
  "Matara",
  "Jaffna",
  "Negombo",
  "Kurunegala",
  "Gampaha",
  "Badulla",
  "Anuradhapura",
];

const CustomMenu = (menuKey) => {
  return (props) => {
    const { selectProps } = props;
    const recents = selectProps.recent?.[menuKey] || [];

    const finishPickAndClose = () => {
      props.selectProps.onMenuClose &&
        requestAnimationFrame(() => props.selectProps.onMenuClose());
    };
    const onPick = (city) => {
      selectProps.onChange({ value: city, label: city }, { action: "select-option" });
      finishPickAndClose();
    };
    const handlePointerPick = (e, city) => {
      if (e.pointerType !== "touch") e.preventDefault?.();
      e.stopPropagation?.();
      onPick(city);
    };

    return (
      <components.Menu {...props}>
        {/* 1) Suggested cities (typeahead results) */}
        <div className="px-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Suggested Cities
          </div>
        </div>
        <components.MenuList {...props}>{props.children}</components.MenuList>

        {/* 2) Recents */}
        <div className="px-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
            <FaClock className="opacity-70" />
            Recent searches
          </div>
          {recents.length === 0 ? (
            <div className="text-xs text-gray-400 mb-3">No recent searches</div>
          ) : (
            <div className="mb-3 divide-y rounded-lg border border-gray-100 overflow-hidden">
              {recents.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-red-50 transition"
                  style={{ touchAction: "manipulation" }}
                  onPointerDown={(e) => handlePointerPick(e, city)}
                >
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span className="text-sm font-medium text-gray-800">{city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3) Popular cities */}
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Popular Cities
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c}
                type="button"
                className="px-3 py-1.5 rounded-full border text-sm hover:bg-red-50"
                style={{
                  borderColor: "#E5E7EB",
                  color: "#1F2937",
                  touchAction: "manipulation",
                }}
                onPointerDown={(e) => handlePointerPick(e, c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </components.Menu>
    );
  };
};

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
const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

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
    // dateInputRef,                 // no longer needed (we use popover)
    // handleDateContainerClick,     // replaced with local open handler
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
    handleProceedToPayment,
  } = useSearchCore();

  /* ---- recents (same keys used on Home.jsx) ---- */
  const [recent, setRecent] = useState(() => {
    try {
      return {
        from: JSON.parse(localStorage.getItem("rb_recent_from") || "[]"),
        to: JSON.parse(localStorage.getItem("rb_recent_to") || "[]"),
      };
    } catch {
      return { from: [], to: [] };
    }
  });
  const pushRecent = (key, city) => {
    setRecent((prev) => {
      const next = { ...prev };
      const list = [city, ...prev[key].filter((c) => c !== city)].slice(0, 5);
      next[key] = list;
      try {
        localStorage.setItem(
          key === "from" ? "rb_recent_from" : "rb_recent_to",
          JSON.stringify(list)
        );
      } catch {}
      return next;
    });
  };

  /* ---- calendar popover state (desktop) ---- */
  const desktopDateAnchorRef = useRef(null);
  const [calOpen, setCalOpen] = useState(false);

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
      backgroundColor: "#FFFFFF",
    }),
    menuPortal: (p) => ({ ...p, zIndex: 9999 }),
    option: (p, state) => ({
      ...p,
      backgroundColor: state.isSelected
        ? PALETTE.primaryRed
        : state.isFocused
        ? "#FEE2E2"
        : "#FFFFFF",
      color: state.isSelected ? "#FFFFFF" : PALETTE.textDark,
      cursor: "pointer",
      padding: "12px 16px",
      transition: "background-color 0.2s ease, color 0.2s ease",
    }),
  };

  const filterPanelTopOffset = useMemo(
    () => stickySearchCardOwnHeight + 16,
    [stickySearchCardOwnHeight]
  );

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
          <p className="mb-6" style={{ color: PALETTE.textLight }}>
            {fetchError}
          </p>
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
                        <h3 className="text/base font-semibold text-gray-900">
                          {bus.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-600">
                            {bus.busType}
                          </p>
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
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            Departs
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.departureTime}
                          </span>
                        </div>
                        <div className="flex-1 mx-3">
                          <div className="h-[2px] w-full rounded bg-gray-200" />
                        </div>
                        <div className="flex flex-col min-w-[84px] text-right">
                          <span className="text-[11px] uppercase tracking-wide text-gray-500">
                            Arrives
                          </span>
                          <span className="text-xl font-semibold tabular-nums text-gray-900">
                            {bus.arrivalTime}
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <FaClock />{" "}
                          {calculateDuration(
                            bus.departureTime,
                            bus.arrivalTime
                          )}
                        </span>
                        {typeof availableSeats === "number" && (
                          <span>{availableSeats} seats</span>
                        )}
                        {typeof availableWindowSeats === "number" &&
                          availableWindowSeats > 0 && (
                            <span>{availableWindowSeats} window</span>
                          )}
                      </div>
                    </div>

                    {timerProps && <BookingDeadlineTimer {...timerProps} />}
                  </div>

                  <div className="flex flex-col items-start md:items-end">
                    <p
                      className="text-sm font-medium"
                      style={{
                        color:
                          typeof availableSeats === "number" &&
                          availableSeats > 0
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
                        <div className="text-xs line-through text-gray-400">
                          Rs. {bus.originalPrice}
                        </div>
                      )}
                      <div className="leading-tight">
                        <span className="text-[11px] font-medium mr-1 align-top text-gray-500">
                          Rs.
                        </span>
                        <span className="text-2xl font-bold tabular-nums text-gray-900">
                          {displayPrice}
                        </span>
                      </div>
                      <div className="text-[11px] font-medium mt-0.5 text-gray-500">
                        Onwards
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSeatLayout(bus)}
                      disabled={isSoldOut}
                      className="w-full md:w-auto mt-3 px-6 py-2.5 text-white font-semibold rounded-full transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isSoldOut ? "#9CA3AF" : "#DC2626",
                      }}
                    >
                      {isSoldOut
                        ? "Sold Out"
                        : expandedBusId === `${bus._id}-${bus.departureTime}`
                        ? "Hide Seats"
                        : "View seats"}
                    </button>
                  </div>
                </div>

                {expandedBusId === `${bus._id}-${bus.departureTime}` && (
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
                              bookedSeats={[...(availability?.[`${bus._id}-${bus.departureTime}`]?.bookedSeats || [])]}
                              selectedSeats={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedSeats) ||
                                []
                              }
                              onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                              bookedSeatGenders={
                                availability?.[`${bus._id}-${bus.departureTime}`]?.seatGenderMap || {}
                              }
                              selectedSeatGenders={{}}
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex flex-col gap-4">
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <PointSelection
                              boardingPoints={bus.boardingPoints}
                              droppingPoints={bus.droppingPoints}
                              selectedBoardingPoint={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedBoardingPoint) ||
                                bus.boardingPoints?.[0] ||
                                null
                              }
                              setSelectedBoardingPoint={(p) =>
                                handleBoardingPointSelect(bus, p)
                              }
                              selectedDroppingPoint={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedDroppingPoint) ||
                                bus.droppingPoints?.[0] ||
                                null
                              }
                              setSelectedDroppingPoint={(p) =>
                                handleDroppingPointSelect(bus, p)
                              }
                            />
                          </div>
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <BookingSummary
                              bus={bus}
                              selectedSeats={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedSeats) ||
                                []
                              }
                              date={searchDateParam}
                              basePrice={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.basePrice) ||
                                0
                              }
                              convenienceFee={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.convenienceFee) ||
                                0
                              }
                              totalPrice={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.totalPrice) ||
                                0
                              }
                              onProceed={() => handleProceedToPayment(bus)}
                              boardingPoint={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedBoardingPoint) ||
                                null
                              }
                              droppingPoint={
                                (busSpecificBookingData[`${bus._id}-${bus.departureTime}`]?.selectedDroppingPoint) ||
                                null
                              }
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
              <FaChevronLeft className="text-xl mr-2 cursor-pointer" onClick={() => navigate(-1)} />
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
              {/* FROM */}
              <div className="relative flex-1 p-4 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    From
                  </label>
                  <Select
                    options={fromOptions}
                    value={searchFrom ? { value: searchFrom, label: searchFrom } : null}
                    onChange={(s) => {
                      const v = s?.value || "";
                      setSearchFrom(v);
                      if (v) pushRecent("from", v);
                    }}
                    placeholder="Select departure"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null,
                      Menu: CustomMenu("from"),
                    }}
                    recent={recent}
                    closeMenuOnSelect
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

              {/* TO */}
              <div className="flex-1 p-4 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    To
                  </label>
                  <Select
                    options={toOptions}
                    value={searchTo ? { value: searchTo, label: searchTo } : null}
                    onChange={(s) => {
                      const v = s?.value || "";
                      setSearchTo(v);
                      if (v) pushRecent("to", v);
                    }}
                    placeholder="Select destination"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null,
                      Menu: CustomMenu("to"),
                    }}
                    recent={recent}
                    closeMenuOnSelect
                  />
                </div>
              </div>

              {/* DATE (Desktop – same as Home) */}
              <div className="flex-1 p-4 flex items-center relative">
                <FaCalendarAlt className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    Date of Journey
                  </label>
                  <div
                    ref={desktopDateAnchorRef}
                    onClick={() => setCalOpen(true)}
                    className="cursor-pointer"
                  >
                    <span className="text-lg font-medium" style={{ color: PALETTE.textDark }}>
                      {getReadableDate(searchDate)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchDate(toLocalYYYYMMDD(new Date()));
                      }}
                      className="text-xs font-medium mr-3 hover:underline"
                      style={{
                        color:
                          searchDate === toLocalYYYYMMDD(new Date())
                            ? PALETTE.primaryRed
                            : "#3A86FF",
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const tm = new Date();
                        tm.setDate(tm.getDate() + 1);
                        setSearchDate(toLocalYYYYMMDD(tm));
                      }}
                      className="text-xs font-medium hover:underline"
                      style={{
                        color:
                          (() => {
                            const tm = new Date();
                            tm.setDate(tm.getDate() + 1);
                            return toLocalYYYYMMDD(tm);
                          })() === searchDate
                            ? PALETTE.primaryRed
                            : "#3A86FF",
                      }}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <CalendarPopover
                  anchorRef={desktopDateAnchorRef}
                  open={calOpen}
                  value={searchDate}
                  minDateString={toLocalYYYYMMDD(new Date())}
                  onChange={setSearchDate}
                  onClose={() => setCalOpen(false)}
                />
              </div>

              {/* SEARCH */}
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
