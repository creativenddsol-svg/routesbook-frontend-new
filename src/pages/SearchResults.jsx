// SearchResults.jsx
import {
  useSearchParams,
  useNavigate,
  createSearchParams,
  useLocation,
} from "react-router-dom";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import apiClient from "../api";
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import toast, { Toaster } from "react-hot-toast";
import {
  FaBus,
  FaClock,
  FaRoute,
  FaTimes,
  FaChevronLeft,
  FaMoneyBillWave,
  FaExclamationCircle,
  FaHourglassHalf,
  FaSyncAlt,
  FaSlidersH,
  FaCalendarAlt,
  FaExchangeAlt,
  FaSearch,
  FaStar,
} from "react-icons/fa";

import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../components/SpecialNoticeCard";
import SeatLayout from "../components/SeatLayout";
import PointSelection from "../components/PointSelection";
import BookingSummary from "../components/BookingSummary";
import SeatLegend from "../components/SeatLegend";

// --- Palette ---
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F5F6F7",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  green: "#28a745",
  orange: "#fd7e14",
  yellow: "#FFC107",
};

// --- Constants ---
const TIME_SLOTS = {
  Morning: [4, 12],
  Afternoon: [12, 17],
  Evening: [17, 21],
  Night: [21, 24],
};
const RESULTS_PER_PAGE = 5;

// --- Helpers ---
const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getReadableDate = (dateString) => {
  if (!dateString) return "Select Date";
  const [year, month, day] = dateString.split("-").map(Number);
  const dateObj = new Date(Date.UTC(year, month - 1, day));
  return dateObj.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

const getMobileDateParts = (dateString) => {
  if (!dateString) return { top: "-- ---", bottom: "" };
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const top = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const bottom = dt.toLocaleDateString("en-GB", { weekday: "short" });
  return { top, bottom };
};

const calculateDuration = (startTime, endTime) => {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) endMinutes += 24 * 60;
  const duration = endMinutes - startMinutes;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return `${hours}h ${minutes}m`;
};

// --- Price helper ---
const getDisplayPrice = (bus, from, to) => {
  if (bus.fares && Array.isArray(bus.fares)) {
    const specificFare = bus.fares.find(
      (fare) => fare.boardingPoint === from && fare.droppingPoint === to
    );
    if (specificFare && specificFare.price) return specificFare.price;
  }
  return bus.price;
};

// --- Soft badge (no border) ---
const SoftBadge = ({ color = "gray", className = "", children }) => {
  const map = {
    gray: { bg: "bg-gray-100", fg: "text-gray-700" },
    green: { bg: "bg-green-100", fg: "text-green-700" },
    orange: { bg: "bg-orange-100", fg: "text-orange-700" },
    red: { bg: "bg-red-100", fg: "text-red-700" },
    blue: { bg: "bg-blue-100", fg: "text-blue-700" },
  };
  const c = map[color] || map.gray;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold ${c.bg} ${c.fg} ${className}`}
    >
      {children}
    </span>
  );
};

// --- BookingDeadlineTimer => pill without border ---
const BookingDeadlineTimer = ({
  deadlineTimestamp,
  departureTimestamp,
  onDeadline,
}) => {
  const [timeLeft, setTimeLeft] = useState(deadlineTimestamp - Date.now());
  useEffect(() => {
    if (Date.now() >= deadlineTimestamp || Date.now() >= departureTimestamp) {
      setTimeLeft(0);
      if (
        Date.now() >= deadlineTimestamp &&
        Date.now() < departureTimestamp &&
        onDeadline
      ) {
        onDeadline();
      }
      return;
    }
    const intervalId = setInterval(() => {
      const newTimeLeft = deadlineTimestamp - Date.now();
      if (newTimeLeft <= 0) {
        setTimeLeft(0);
        clearInterval(intervalId);
        if (onDeadline) onDeadline();
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [deadlineTimestamp, departureTimestamp, onDeadline]);

  if (Date.now() >= departureTimestamp) {
    return (
      <SoftBadge color="gray" className="mt-2">
        <FaHourglassHalf className="text-[10px]" />
        Departed
      </SoftBadge>
    );
  }
  if (timeLeft <= 0) {
    return (
      <SoftBadge color="red" className="mt-2">
        <FaHourglassHalf className="text-[10px]" />
        Booking Closed
      </SoftBadge>
    );
  }
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return (
    <SoftBadge color="orange" className="mt-2 tabular-nums">
      <FaHourglassHalf className="text-[10px]" />
      Booking closes in: {String(hours).padStart(2, "0")}:
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </SoftBadge>
  );
};

// --- Skeleton ---
const BusCardSkeleton = () => (
  <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-200">
    <div className="h-6 w-3/5 rounded bg-gray-200 mb-4"></div>
    <div className="h-4 w-4/5 rounded bg-gray-200"></div>
    <div className="border-t my-5 border-gray-100"></div>
    <div className="h-12 w-32 rounded-lg bg-gray-200 ml-auto"></div>
  </div>
);

// --- Main ---
const SearchResults = ({ showNavbar, headerHeight, isNavbarAnimating }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { from, to, date: searchDateParam } = Object.fromEntries(
    searchParams.entries()
  );

  const [buses, setBuses] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("time-asc");
  const [filters, setFilters] = useState({
    type: "",
    maxPrice: 5000,
    timeSlots: {},
  });

  const [specialNotices, setSpecialNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const [searchFrom, setSearchFrom] = useState(from || "");
  const [searchTo, setSearchTo] = useState(to || "");
  const [searchDate, setSearchDate] = useState(
    searchDateParam || toLocalYYYYMMDD(new Date())
  );
  const [allBusesForDropdown, setAllBusesForDropdown] = useState([]);

  const dateInputRef = useRef(null);
  const mobileDateInputRef = useRef(null);

  const stickySearchCardRef = useRef(null);
  const [stickySearchCardOwnHeight, setStickySearchCardOwnHeight] = useState(0);

  const todayStr = toLocalYYYYMMDD(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalYYYYMMDD(tomorrow);

  const [expandedBusId, setExpandedBusId] = useState(null);
  const [busSpecificBookingData, setBusSpecificBookingData] = useState({});

  useEffect(() => {
    if (stickySearchCardRef.current) {
      setStickySearchCardOwnHeight(stickySearchCardRef.current.offsetHeight);
    }
  }, [loading, fetchError, from, to, searchDate]);

  const searchCardStickyTopOffset = useMemo(() => {
    return showNavbar ? headerHeight : 0;
  }, [showNavbar, headerHeight]);

  // data
  useEffect(() => {
    const fetchSpecialNotices = async () => {
      try {
        setNoticesLoading(true);
        const res = await apiClient.get("/special-notices");
        setSpecialNotices(res.data);
      } catch {
      } finally {
        setNoticesLoading(false);
      }
    };
    fetchSpecialNotices();
  }, []);

  useEffect(() => {
    const fetchAllBuses = async () => {
      try {
        const res = await apiClient.get("/buses");
        setAllBusesForDropdown(res.data);
      } catch {}
    };
    fetchAllBuses();
  }, []);

  const fromOptions = [...new Set(allBusesForDropdown.map((b) => b.from))].map(
    (val) => ({ value: val, label: val })
  );
  const toOptions = [...new Set(allBusesForDropdown.map((b) => b.to))].map(
    (val) => ({ value: val, label: val })
  );

  const handleModifySearch = () => {
    if (!searchFrom || !searchTo || !searchDate) {
      toast.error("Please fill all fields before searching");
      return;
    }
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({
        from: searchFrom,
        to: searchTo,
        date: searchDate,
      })}`,
    });
    setExpandedBusId(null);
  };

  const updateSearchWithDate = (newDate) => {
    if (!searchFrom || !searchTo || !newDate) return;
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({
        from: searchFrom,
        to: searchTo,
        date: newDate,
      })}`,
    });
    setExpandedBusId(null);
  };

  const swapLocations = () => {
    setSearchFrom(searchTo);
    setSearchTo(searchFrom);
  };

  const handleDateContainerClick = () => dateInputRef.current?.showPicker();
  const handleMobileDateChipClick = () => mobileDateInputRef.current?.showPicker();
  const handleMobileDateChange = (e) => {
    const d = e.target.value;
    setSearchDate(d);
    updateSearchWithDate(d);
  };

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

  const fetchData = useCallback(async () => {
    if (!from || !to || !searchDateParam) {
      setLoading(false);
      setBuses([]);
      setFetchError("Missing search parameters. Please try searching again.");
      return;
    }
    setLoading(true);
    setFetchError(null);
    setExpandedBusId(null);
    setBusSpecificBookingData({});

    try {
      const res = await apiClient.get("/buses", {
        params: { from, to, date: searchDateParam },
      });
      setBuses(res.data);
      const seatData = {};
      await Promise.all(
        res.data.map(async (bus) => {
          try {
            const availabilityKey = `${bus._id}-${bus.departureTime}`;
            const availabilityRes = await apiClient.get(
              `/bookings/availability/${bus._id}`,
              {
                params: {
                  date: searchDateParam,
                  departureTime: bus.departureTime,
                },
              }
            );
            seatData[availabilityKey] = {
              available: availabilityRes.data.availableSeats,
              window: availabilityRes.data.availableWindowSeats || null,
              bookedSeats: Array.isArray(availabilityRes.data.bookedSeats)
                ? availabilityRes.data.bookedSeats.map(String)
                : [],
              seatGenderMap: availabilityRes.data.seatGenderMap || {},
            };
          } catch {
            const availabilityKey = `${bus._id}-${bus.departureTime}`;
            seatData[availabilityKey] = {
              available: null,
              window: null,
              bookedSeats: [],
              seatGenderMap: {},
            };
          }
        })
      );
      setAvailability(seatData);
    } catch (err) {
      setBuses([]);
      setFetchError(
        err.response?.data?.message ||
          "Could not load bus data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [from, to, searchDateParam]);

  useEffect(() => {
    fetchData();
    setPage(1);
    setSearchFrom(from || "");
    setSearchTo(to || "");
    setSearchDate(searchDateParam || toLocalYYYYMMDD(new Date()));
  }, [from, to, searchDateParam, fetchData, location.search]);

  useEffect(() => {
    if (isFilterOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isFilterOpen]);

  const { filteredBuses } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    const currentDateString = toLocalYYYYMMDD(today);
    const searchingToday = searchDateParam === currentDateString;

    return {
      filteredBuses: buses.filter((bus) => {
        if (!searchDateParam || !bus.departureTime) return false;

        const [depHour, depMinute] = bus.departureTime.split(":").map(Number);
        const [searchYear, searchMonth, searchDay] = searchDateParam
          .split("-")
          .map(Number);
        const departureDateTime = new Date(
          searchYear,
          searchMonth - 1,
          searchDay,
          depHour,
          depMinute
        );
        const busDepartureTimestamp = departureDateTime.getTime();

        if (searchingToday && busDepartureTimestamp <= now.getTime()) return false;

        const bookingDeadlineTimestamp =
          busDepartureTimestamp - 1 * 60 * 60 * 1000;
        if (bookingDeadlineTimestamp <= now.getTime()) return false;

        const activeTimeSlots = Object.keys(filters.timeSlots).filter(
          (slot) => filters.timeSlots[slot]
        );
        const matchTime =
          activeTimeSlots.length === 0 ||
          activeTimeSlots.some((slot) => {
            const [start, end] = TIME_SLOTS[slot];
            return slot === "Night"
              ? depHour >= start || depHour < TIME_SLOTS["Morning"][0]
              : depHour >= start && depHour < end;
          });
        const matchType = filters.type ? bus.busType === filters.type : true;
        const displayPrice = getDisplayPrice(bus, from, to);
        const matchPrice = displayPrice <= filters.maxPrice;
        return matchType && matchPrice && matchTime;
      }),
    };
  }, [buses, filters, searchDateParam, from, to]);

  const sortedBuses = useMemo(() => {
    return [...filteredBuses].sort((a, b) => {
      const priceA = getDisplayPrice(a, from, to);
      const priceB = getDisplayPrice(b, from, to);
      switch (sortBy) {
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "time-asc":
          return a.departureTime.localeCompare(b.departureTime);
        case "time-desc":
          return b.departureTime.localeCompare(a.departureTime);
        default:
          return 0;
      }
    });
  }, [filteredBuses, sortBy, from, to]);

  const totalPages = Math.ceil(sortedBuses.length / RESULTS_PER_PAGE);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop <
          document.documentElement.offsetHeight - 200 ||
        page >= totalPages ||
        loading
      ) {
        return;
      }
      setPage((prevPage) => prevPage + 1);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [page, totalPages, loading]);

  const activeFilterCount =
    Object.values(filters.timeSlots).filter(Boolean).length +
    (filters.type ? 1 : 0) +
    (filters.maxPrice < 5000 ? 1 : 0);

  const visibleBuses = sortedBuses.slice(0, page * RESULTS_PER_PAGE);

  const resetFilters = () => {
    setFilters({ type: "", maxPrice: 5000, timeSlots: {} });
    setPage(1);
  };

  // ===== Special Notices =====
  const SpecialNoticesSection = () => {
    const itemsToRender = noticesLoading
      ? Array.from({ length: 4 })
      : specialNotices;

    const trackRef = useRef(null);
    const [pages, setPages] = useState(1);
    const [activePage, setActivePage] = useState(0);

    const computePages = () => {
      const el = trackRef.current;
      if (!el) return;
      const total = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
      setPages(total);
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setActivePage(Math.min(total - 1, Math.max(0, idx)));
    };

    useEffect(() => {
      computePages();
      const onResize = () => computePages();
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noticesLoading, specialNotices.length]);

    useEffect(() => {
      const el = trackRef.current;
      if (!el) return;
      const onScroll = () => {
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        setActivePage(idx);
      };
      el.addEventListener("scroll", onScroll, { passive: true });
      return () => el.removeEventListener("scroll", onScroll);
    }, []);

    const goToPage = (idx) => {
      const el = trackRef.current;
      if (!el) return;
      const clamped = Math.min(pages - 1, Math.max(0, idx));
      el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
      setActivePage(clamped);
    };

    if (!noticesLoading && specialNotices.length === 0) return null;

    return (
      <motion.div
        className="mb-8 relative"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      >
        <div
          ref={trackRef}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-2 lg:pb-0"
          style={{ scrollBehavior: "smooth" }}
        >
          {itemsToRender.map((item, index) => (
            <div
              key={noticesLoading ? `skeleton-${index}` : item._id}
              className="flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/4 xl:w-1/4 snap-start p-2"
            >
              {noticesLoading ? (
                <SpecialNoticeSkeleton />
              ) : (
                <SpecialNoticeCard notice={item} linkTo="/special-notices" />
              )}
            </div>
          ))}
        </div>

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {Array.from({ length: pages }).map((_, i) => {
              const active = i === activePage;
              return (
                <button
                  key={i}
                  onClick={() => goToPage(i)}
                  className={[
                    "h-2.5 rounded-full transition-all duration-200",
                    active
                      ? "w-6 bg-gray-900"
                      : "w-2.5 bg-gray-300 hover:bg-gray-400",
                  ].join(" ")}
                  aria-label={`Go to page ${i + 1}`}
                />
              );
            })}
          </div>
        )}
      </motion.div>
    );
  };

  const ErrorDisplay = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md"
    >
      <FaExclamationCircle
        className="mx-auto text-6xl mb-4"
        style={{ color: PALETTE.yellow }}
      />
      <h3 className="text-2xl font-bold mb-2" style={{ color: PALETTE.textDark }}>
        Oops! Something went wrong.
      </h3>
      <p className="max-w-md mx-auto mb-6" style={{ color: PALETTE.textLight }}>
        {message || "We encountered an error. Please try again later."}
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fetchData()}
        className="px-6 py-2.5 font-semibold rounded-lg text-white"
        style={{ backgroundColor: PALETTE.accentBlue }}
      >
        Try Again
      </motion.button>
    </motion.div>
  );

  const NoResultsMessage = () => {
    const hasActiveFilters = activeFilterCount > 0;
    let title = hasActiveFilters
      ? "No Buses Match Your Filters"
      : "No Buses Available";
    let message = hasActiveFilters
      ? "Try adjusting or resetting your filters."
      : "Unfortunately, no buses were found for this route on the selected date.";
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-10 bg-white rounded-2xl shadow-md"
      >
        <FaExclamationCircle
          className="mx-auto text-6xl mb-4"
          style={{ color: `${PALETTE.primaryRed}50` }}
        />
        <h3 className="text-2xl font-bold mb-2" style={{ color: PALETTE.textDark }}>
          {title}
        </h3>
        <p className="max-w-md mx-auto mb-6" style={{ color: PALETTE.textLight }}>
          {message}
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={resetFilters}
          className="px-6 py-2.5 font-semibold rounded-lg text-white"
          style={{ backgroundColor: PALETTE.accentBlue }}
        >
          Reset All Filters
        </motion.button>
      </motion.div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
  };

  const FilterPanel = ({ isMobile, sortBy, setSortBy }) => {
    const handleTimeSlotFilter = (slot) =>
      setFilters((prev) => ({
        ...prev,
        timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
      }));
    const headerText = isMobile ? "Filter & Sort" : "Filters";
    const resetText =
      activeFilterCount > 0 ? `Reset (${activeFilterCount})` : "Reset";

    return (
      <div className="p-6 space-y-8 lg:p-0">
        <div
          className="flex justify-between items-center border-b pb-4 lg:border-none lg:pb-0"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: PALETTE.textDark }}
          >
            <FaSlidersH className="lg:hidden" style={{ color: PALETTE.accentBlue }} />{" "}
            {headerText}
          </h3>
          {isMobile ? (
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          ) : (
            <button
              onClick={resetFilters}
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 ${
                activeFilterCount > 0 ? "text-red-600 font-semibold" : ""
              }`}
              style={{
                color:
                  activeFilterCount > 0 ? PALETTE.primaryRed : PALETTE.textLight,
              }}
            >
              <FaSyncAlt /> {resetText}
            </button>
          )}
        </div>
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Sort by
          </h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
            style={{
              borderColor: PALETTE.borderLight,
              color: PALETTE.textDark,
            }}
          >
            <option value="time-asc">Departure: Earliest</option>
            <option value="time-desc">Departure: Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </section>
        <section>
          <h4 className="font-bold mb-4" style={{ color: PALETTE.textDark }}>
            Departure Time
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(TIME_SLOTS).map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSlotFilter(slot)}
                className={`px-2 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                  filters.timeSlots[slot]
                    ? "text-white border-blue-500"
                    : "border-gray-200"
                }`}
                style={{
                  backgroundColor: filters.timeSlots[slot]
                    ? PALETTE.accentBlue
                    : PALETTE.white,
                  color: filters.timeSlots[slot]
                    ? PALETTE.white
                    : PALETTE.textDark,
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Bus Type
          </h4>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
            style={{
              borderColor: PALETTE.borderLight,
              color: PALETTE.textDark,
            }}
          >
            <option value="">All Types</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </section>
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Max Price
          </h4>
          <input
            type="range"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              backgroundColor: PALETTE.borderLight,
              accentColor: PALETTE.primaryRed,
            }}
            min={500}
            max={5000}
            step={100}
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxPrice: Number(e.target.value),
              }))
            }
          />
          <div
            className="text-sm mt-2 text-center font-medium"
            style={{ color: PALETTE.textLight }}
          >
            Up to{" "}
            <span className="font-bold" style={{ color: PALETTE.primaryRed }}>
              Rs. {filters.maxPrice}
            </span>
          </div>
        </section>
        {isMobile && (
          <div className="pt-4 border-t" style={{ borderColor: PALETTE.borderLight }}>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full py-3 font-bold text-white rounded-lg"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Show {sortedBuses.length} Buses
            </button>
            <button
              onClick={() => {
                resetFilters();
                setIsFilterOpen(false);
              }}
              className="w-full mt-2 py-2 font-bold rounded-lg"
              style={{ color: PALETTE.textLight }}
            >
              {resetText}
            </button>
          </div>
        )}
      </div>
    );
  };

  const initializeBusBookingData = (bus) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => {
      if (prev[busKey]) return prev;
      return {
        ...prev,
        [busKey]: {
          selectedSeats: [],
          seatGenders: {},
          selectedBoardingPoint: bus.boardingPoints?.[0] || null,
          selectedDroppingPoint: bus.droppingPoints?.[0] || null,
          basePrice: 0,
          convenienceFee: 0,
          totalPrice: 0,
        },
      };
    });
  };

  const handleToggleSeatLayout = (bus) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    if (expandedBusId === busKey) {
      setExpandedBusId(null);
    } else {
      setExpandedBusId(busKey);
      initializeBusBookingData(bus);
    }
  };

  const handleSeatToggle = (bus, seat) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    const availabilityKey = `${bus._id}-${bus.departureTime}`;

    setBusSpecificBookingData((prev) => {
      const currentBusData = prev[busKey];
      if (!currentBusData) return prev;
      const { bookedSeats } = availability[availabilityKey] || {
        bookedSeats: [],
      };
      if (bookedSeats.includes(String(seat))) return prev;

      const isSelected = currentBusData.selectedSeats.includes(String(seat));
      const canAdd = !isSelected && currentBusData.selectedSeats.length < 4;

      const updatedSelectedSeats = isSelected
        ? currentBusData.selectedSeats.filter((s) => s !== String(seat))
        : canAdd
        ? [...currentBusData.selectedSeats, String(seat)]
        : (toast.error("🚫 You can select a maximum of 4 seats."),
          currentBusData.selectedSeats);

      const updatedSeatGenders = { ...(currentBusData.seatGenders || {}) };
      if (isSelected) {
        delete updatedSeatGenders[String(seat)];
      } else if (canAdd) {
        if (!updatedSeatGenders[String(seat)]) {
          updatedSeatGenders[String(seat)] = "M";
        }
      }

      return {
        ...prev,
        [busKey]: {
          ...currentBusData,
          selectedSeats: updatedSelectedSeats,
          seatGenders: updatedSeatGenders,
        },
      };
    });
  };

  const handleBoardingPointSelect = (bus, point) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => ({
      ...prev,
      [busKey]: { ...prev[busKey], selectedBoardingPoint: point },
    }));
  };

  const handleDroppingPointSelect = (bus, point) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => ({
      ...prev,
      [busKey]: { ...prev[busKey], selectedDroppingPoint: point },
    }));
  };

  // Price calc on expand
  useEffect(() => {
    if (!expandedBusId || !buses.length) return;

    const [currentBusId, currentBusTime] = expandedBusId.split("-");
    const currentBus = buses.find(
      (b) => b._id === currentBusId && b.departureTime === currentBusTime
    );
    const busData = busSpecificBookingData[expandedBusId];

    if (!currentBus || !busData) return;

    const { selectedSeats, selectedBoardingPoint, selectedDroppingPoint } =
      busData;

    let pricePerSeat = currentBus.price;

    if (
      selectedBoardingPoint &&
      selectedDroppingPoint &&
      currentBus.fares &&
      Array.isArray(currentBus.fares)
    ) {
      const specificFare = currentBus.fares.find(
        (f) =>
          f.boardingPoint === selectedBoardingPoint.point &&
          f.droppingPoint === selectedDroppingPoint.point
      );
      if (specificFare) pricePerSeat = specificFare.price;
    }

    const basePrice = pricePerSeat * selectedSeats.length;
    let convenienceFeeValue = 0;

    if (currentBus.convenienceFee) {
      if (currentBus.convenienceFee.amountType === "percentage") {
        convenienceFeeValue =
          (basePrice * currentBus.convenienceFee.value) / 100;
      } else {
        convenienceFeeValue =
          currentBus.convenienceFee.value * selectedSeats.length;
      }
    }

    const newTotalPrice = basePrice + convenienceFeeValue;

    if (
      newTotalPrice !== busData.totalPrice ||
      basePrice !== busData.basePrice
    ) {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [expandedBusId]: {
          ...prev[expandedBusId],
          basePrice: basePrice,
          convenienceFee: convenienceFeeValue,
          totalPrice: newTotalPrice,
        },
      }));
    }
  }, [expandedBusId, busSpecificBookingData, buses, from, to]);

  const handleProceedToPayment = (bus) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    const busData = busSpecificBookingData[busKey];

    if (!busData || !bus) {
      toast.error("Booking data not found.");
      return;
    }

    const {
      selectedSeats,
      basePrice,
      convenienceFee,
      totalPrice,
      selectedBoardingPoint,
      selectedDroppingPoint,
      seatGenders,
    } = busData;

    if (selectedSeats.length === 0) {
      toast.error("Please select at least one seat!");
      return;
    }
    if (!selectedBoardingPoint || !selectedDroppingPoint) {
      toast.error("Please select a boarding and dropping point!");
      return;
    }
    if (totalPrice <= 0 && selectedSeats.length > 0) {
      toast.error("Price could not be determined. Please re-select points.");
      return;
    }

    navigate("/confirm-booking", {
      state: {
        bus,
        busId: bus._id,
        date: searchDateParam,
        departureTime: bus.departureTime,
        selectedSeats,
        seatGenders: seatGenders || {},
        priceDetails: {
          basePrice,
          convenienceFee,
          totalPrice,
        },
        selectedBoardingPoint,
        selectedDroppingPoint,
      },
    });
  };

  // ==== CONTENT ====
  const RatingBadge = ({ score = 4.7, count = 0 }) => (
    <div className="inline-flex items-center gap-1 bg-green-600/90 text-white rounded-md px-2 py-1">
      <FaStar className="text-[10px]" />
      <span className="text-xs font-bold tabular-nums">{score}</span>
    </div>
  );

  const getAcText = (t = "") =>
    /ac/i.test(t) || /a\/c/i.test(t) ? "A/C" : "Non-AC";

  const renderMainContent = () => {
    if (loading) {
      return Array.from({ length: RESULTS_PER_PAGE }).map((_, i) => (
        <BusCardSkeleton key={i} />
      ));
    }
    if (fetchError) return <ErrorDisplay message={fetchError} />;

    if (visibleBuses.length > 0) {
      return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {visibleBuses.map((bus) => {
            const busKey = `${bus._id}-${bus.departureTime}`;
            const displayPrice = getDisplayPrice(bus, from, to);

            let timerProps = null;
            if (searchDateParam && bus.departureTime) {
              const now = new Date();
              const [depHour, depMinute] = bus.departureTime.split(":").map(Number);
              const [year, month, day] = searchDateParam.split("-").map(Number);
              const departureDateTime = new Date(
                year,
                month - 1,
                day,
                depHour,
                depMinute
              );
              const busDepartureTimestamp = departureDateTime.getTime();
              const diffMilliseconds = busDepartureTimestamp - now.getTime();
              const diffHours = diffMilliseconds / (1000 * 60 * 60);

              if (diffHours > 0 && diffHours <= 12) {
                const bookingDeadlineTimestamp =
                  busDepartureTimestamp - 1 * 60 * 60 * 1000;
                timerProps = {
                  deadlineTimestamp: bookingDeadlineTimestamp,
                  departureTimestamp: busDepartureTimestamp,
                  onDeadline: () => fetchData(),
                };
              }
            }

            const availabilityKey = `${bus._id}-${bus.departureTime}`;
            const busAvailability = availability?.[availabilityKey];
            const availableSeats = busAvailability?.available;
            const availableWindowSeats = busAvailability?.window;
            const isSoldOut = !availableSeats || availableSeats === 0;

            const currentBusBookingData = busSpecificBookingData[busKey] || {
              selectedSeats: [],
              seatGenders: {},
              selectedBoardingPoint: bus.boardingPoints?.[0] || null,
              selectedDroppingPoint: bus.droppingPoints?.[0] || null,
              basePrice: 0,
              convenienceFee: 0,
              totalPrice: 0,
            };

            const neutralTitle = "#111827";
            const neutralText = "#4B5563";
            const neutralMuted = "#6B7280";
            const lineColor = "#E5E7EB";

            const hasStrike =
              typeof bus.originalPrice === "number" &&
              bus.originalPrice > displayPrice;

            const ratingScore =
              typeof bus.rating?.score === "number" ? bus.rating.score : 4.7;
            const ratingCount =
              typeof bus.rating?.count === "number" ? bus.rating.count : undefined;

            return (
              <motion.div
                variants={itemVariants}
                key={busKey}
                className="bg-white rounded-2xl transition-shadow duration-300 mb-4 overflow-hidden border border-gray-200 hover:shadow-md"
              >
                {/* ===== MOBILE CARD ===== */}
                <div
                  className={`md:hidden block ${
                    isSoldOut ? "opacity-60 bg-gray-50" : "cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isSoldOut) {
                      navigate(
                        `/book/${bus._id}?date=${searchDateParam}&departureTime=${bus.departureTime}`
                      );
                    }
                  }}
                >
                  <div className="p-4">
                    {/* times + price */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-900">
                          <span className="text-[18px] font-semibold tabular-nums">
                            {bus.departureTime}
                          </span>
                          <span className="text-sm text-gray-400">—</span>
                          <span className="text-[18px] font-semibold tabular-nums">
                            {bus.arrivalTime}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs text-gray-500 flex items-center">
                          <span className="inline-flex items-center gap-1">
                            <FaClock className="text-[10px]" />
                            {calculateDuration(bus.departureTime, bus.arrivalTime)}
                          </span>
                          {!isSoldOut && typeof availableSeats === "number" && (
                            <>
                              <span className="mx-2">&middot;</span>
                              <span className="text-red-500">
                                {availableSeats} seats left
                              </span>
                            </>
                          )}
                        </div>
                        {/* booking closes pill (no border) */}
                        {timerProps && (
                          <div className="mt-2">
                            <BookingDeadlineTimer
                              deadlineTimestamp={timerProps.deadlineTimestamp}
                              departureTimestamp={timerProps.departureTimestamp}
                              onDeadline={timerProps.onDeadline}
                            />
                          </div>
                        )}
                      </div>
                      <div className="text-right pl-4">
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

                    <hr className="my-3 border-t border-gray-100" />

                    {/* name + bus type + AC badge + rating */}
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 pr-3">
                        <h4 className="text-[15px] font-semibold text-gray-900 truncate">
                          {bus.name}
                        </h4>
                        <div className="flex items-center gap-2">
                          <p className="text-[12px] text-gray-600 truncate">
                            {bus.busType}
                          </p>
                          {/* AC pill — NO BORDER */}
                          <SoftBadge>{getAcText(bus.busType)}</SoftBadge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RatingBadge score={ratingScore} />
                        {typeof ratingCount === "number" && (
                          <span className="text-xs text-gray-600 tabular-nums">
                            {ratingCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ===== DESKTOP CARD ===== */}
                <div className="hidden md:block p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="md:col-span-2">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center">
                          {bus.operatorLogo ? (
                            <img
                              src={bus.operatorLogo}
                              alt={`${bus.name} logo`}
                              className="w-full h-full object-contain"
                              style={{ border: "none", boxShadow: "none" }}
                            />
                          ) : (
                            <FaBus className="text-3xl" style={{ color: "#6B7280" }} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <h3
                              className="text-base font-semibold truncate"
                              style={{ color: neutralTitle }}
                            >
                              {bus.name}
                            </h3>
                            <div className="flex items-center gap-2">
                              <RatingBadge score={ratingScore} />
                              {typeof ratingCount === "number" && (
                                <span className="text-xs text-gray-600 tabular-nums">
                                  {ratingCount}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium" style={{ color: neutralText }}>
                              {bus.busType}
                            </p>
                            {/* AC pill — NO BORDER */}
                            <SoftBadge>{getAcText(bus.busType)}</SoftBadge>
                          </div>
                          {bus.liveTracking && (
                            <p
                              className="text-xs font-medium mt-1 flex items-center gap-1"
                              style={{ color: "#6B7280" }}
                            >
                              <FaRoute className="inline-block" /> Live Tracking
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mb-1">
                        <div className="flex items-center">
                          <div className="flex flex-col min-w-[84px]">
                            <span
                              className="text-[11px] uppercase tracking-wide"
                              style={{ color: "#6B7280" }}
                            >
                              Departs
                            </span>
                            <span
                              className="text-xl font-semibold tabular-nums"
                              style={{ color: neutralTitle }}
                            >
                              {bus.departureTime}
                            </span>
                          </div>
                          <div className="flex-1 mx-3">
                            <div className="h-[2px] w-full rounded" style={{ backgroundColor: lineColor }} />
                          </div>
                          <div className="flex flex-col min-w-[84px] text-right">
                            <span
                              className="text-[11px] uppercase tracking-wide"
                              style={{ color: "#6B7280" }}
                            >
                              Arrives
                            </span>
                            <span
                              className="text-xl font-semibold tabular-nums"
                              style={{ color: neutralTitle }}
                            >
                              {bus.arrivalTime}
                            </span>
                          </div>
                        </div>
                        <div
                          className="mt-1 flex flex-wrap items-center gap-3 text-xs"
                          style={{ color: "#6B7280" }}
                        >
                          <span className="inline-flex items-center gap-1">
                            <FaClock /> {calculateDuration(bus.departureTime, bus.arrivalTime)}
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

                      {/* booking closes pill — NO BORDER */}
                      {timerProps && (
                        <BookingDeadlineTimer
                          deadlineTimestamp={timerProps.deadlineTimestamp}
                          departureTimestamp={timerProps.departureTimestamp}
                          onDeadline={timerProps.onDeadline}
                        />
                      )}
                    </div>

                    <div className="flex flex-col items-start md:items-end">
                      <p
                        className="text-sm font-medium"
                        style={{
                          color: availableSeats > 0 ? "#EF4444" : "#9CA3AF",
                        }}
                      >
                        {isSoldOut
                          ? "Sold Out"
                          : availableSeats === null
                          ? "Checking..."
                          : `${availableSeats} Seats Left`}
                      </p>
                      <div className="mt-2 inline-block text-right">
                        {hasStrike && (
                          <div className="text-xs line-through" style={{ color: "#9CA3AF" }}>
                            Rs. {bus.originalPrice}
                          </div>
                        )}
                        <div className="leading-tight">
                          <span
                            className="text-[11px] font-medium mr-1 align-top"
                            style={{ color: "#6B7280" }}
                          >
                            Rs.
                          </span>
                          <span
                            className="text-2xl font-bold tabular-nums"
                            style={{ color: neutralTitle }}
                          >
                            {displayPrice}
                          </span>
                        </div>
                        <div className="text-[11px] font-medium mt-0.5" style={{ color: "#6B7280" }}>
                          Onwards
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleToggleSeatLayout(bus)}
                        disabled={isSoldOut}
                        className="w-full md:w-auto mt-3 px-6 py-2.5 text-white font-semibold rounded-full transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{
                          backgroundColor: isSoldOut ? "#9CA3AF" : "#DC2626",
                        }}
                      >
                        {isSoldOut
                          ? "Sold Out"
                          : expandedBusId === busKey
                          ? "Hide Seats"
                          : "View seats"}
                      </motion.button>
                    </div>
                  </div>

                  {expandedBusId === busKey && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="mt-6 border-t pt-6 border-gray-200 lg:block hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 items-start">
                          <div className="col-span-1 flex flex-col gap-4">
                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200 h-full">
                              <SeatLegend />
                              <SeatLayout
                                seatLayout={bus.seatLayout}
                                bookedSeats={busAvailability?.bookedSeats || []}
                                selectedSeats={currentBusBookingData.selectedSeats}
                                onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                                bookedSeatGenders={busAvailability?.seatGenderMap || {}}
                                selectedSeatGenders={currentBusBookingData.seatGenders}
                              />
                            </div>
                          </div>
                          <div className="col-span-1 flex flex-col gap-4">
                            <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                              <PointSelection
                                boardingPoints={bus.boardingPoints}
                                droppingPoints={bus.droppingPoints}
                                selectedBoardingPoint={
                                  currentBusBookingData.selectedBoardingPoint
                                }
                                setSelectedBoardingPoint={(point) =>
                                  handleBoardingPointSelect(bus, point)
                                }
                                selectedDroppingPoint={
                                  currentBusBookingData.selectedDroppingPoint
                                }
                                setSelectedDroppingPoint={(point) =>
                                  handleDroppingPointSelect(bus, point)
                                }
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
    }
    return <NoResultsMessage />;
  };

  const filterPanelTopOffset = useMemo(() => {
    const buffer = 16;
    return searchCardStickyTopOffset + stickySearchCardOwnHeight + buffer;
  }, [searchCardStickyTopOffset, stickySearchCardOwnHeight]);

  // ===== RETURN =====
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Toaster position="top-right" />

      {/* Mobile header (unchanged from previous answer) */}
      <div className="lg:hidden sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="max-w-7xl mx-auto px-3 py-3">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-1 rounded-full hover:bg-gray-100 active:bg-gray-200"
              aria-label="Go back"
            >
              <FaChevronLeft className="text-lg" />
            </button>

            <div className="flex-1 min-w-0 pl-1">
              <div className="font-bold text-lg leading-tight truncate" style={{ color: PALETTE.textDark }}>
                {from} <span className="mx-1">→</span> {to}
              </div>
              {!loading && !fetchError && (
                <div className="text-[12px] text-gray-500">{sortedBuses.length} buses</div>
              )}
            </div>

            <button
              onClick={handleMobileDateChipClick}
              className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-rose-50 px-3 py-1.5"
              aria-label="Change date"
            >
              <span className="leading-none font-semibold text-sm">
                {getMobileDateParts(searchDate).top}
              </span>
              <span className="leading-none mt-0.5 text-[11px] text-gray-600">
                {getMobileDateParts(searchDate).bottom}
              </span>
            </button>

            <input
              ref={mobileDateInputRef}
              type="date"
              value={searchDate}
              min={todayStr}
              onChange={handleMobileDateChange}
              className="absolute opacity-0 pointer-events-none"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>

          <div className="mt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white"
              style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
            >
              <FaSlidersH className="text-gray-700" />
              <span className="font-semibold">Filter &amp; Sort</span>
            </button>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white"
              style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
            >
              <FaStar className="text-yellow-500" />
              <span className="font-semibold">Primo Bus</span>
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm bg-white"
              style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
            >
              <FaMoneyBillWave className="text-green-600" />
              <span className="font-semibold">Special price</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden lg:block w-full" style={{ backgroundColor: PALETTE.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center mb-2">
            <FaChevronLeft
              className="text-xl mr-2 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <span className="text-sm font-medium" style={{ color: PALETTE.textLight }}>
              Bus Ticket
            </span>
            <span className="mx-1 text-gray-400 text-sm">&gt;</span>
            <span className="text-sm font-medium" style={{ color: PALETTE.textLight }}>
              {from} to {to} Bus
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: PALETTE.textDark }}>
                {from} <FaExchangeAlt className="inline-block mx-2 text-gray-500" /> {to}
              </h1>
              {!loading && !fetchError && (
                <p className="text-sm text-gray-500">{sortedBuses.length} buses</p>
              )}
            </div>
            <div className="rounded-2xl border px-4 py-2 bg-rose-50 text-right">
              <div className="text-sm font-semibold">{getMobileDateParts(searchDate).top}</div>
              <div className="text-xs text-gray-600">{getMobileDateParts(searchDate).bottom}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky search controls (desktop) */}
      <div
        ref={stickySearchCardRef}
        className={`${!isNavbarAnimating ? "sticky" : ""} z-40 w-full bg-opacity-95 backdrop-blur-sm shadow-sm`}
        style={{
          top: `${searchCardStickyTopOffset}px`,
          backgroundColor: `${PALETTE.white}F2`,
          transition: "top 0.3s ease-in-out",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="bg-white border border-gray-300 rounded-3xl">
            <div className="hidden lg:flex rounded-2xl">
              <div
                className="relative flex-1 p-4 flex items-center border-r"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label
                    className="block text-xs font-medium uppercase tracking-wider"
                    style={{ color: PALETTE.textLight }}
                  >
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
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-white p-2 rounded-full shadow-lg"
                    style={{ border: `2px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                    onClick={() => {
                      const a = searchFrom;
                      setSearchFrom(searchTo);
                      setSearchTo(a);
                    }}
                  >
                    <FaExchangeAlt style={{ color: PALETTE.textLight }} />
                  </motion.button>
                </div>
              </div>
              <div
                className="flex-1 p-4 flex items-center border-r"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label
                    className="block text-xs font-medium uppercase tracking-wider"
                    style={{ color: PALETTE.textLight }}
                  >
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
                <FaCalendarAlt className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label
                    className="block text-xs font-medium uppercase tracking-wider"
                    style={{ color: PALETTE.textLight }}
                  >
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
                      style={{
                        color:
                          searchDate === todayStr ? PALETTE.primaryRed : PALETTE.accentBlue,
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setSearchDate(tomorrowStr)}
                      className="text-xs font-medium hover:underline"
                      style={{
                        color:
                          searchDate === tomorrowStr ? PALETTE.primaryRed : PALETTE.accentBlue,
                      }}
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleModifySearch}
                  className="font-heading w-full lg:w-auto flex items-center justify-center gap-2 text-white font-bold tracking-wider px-8 py-3 rounded-xl shadow-lg"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch /> SEARCH
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 w-full pb-8" style={{ backgroundColor: PALETTE.bgLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 items-start">
            <aside
              className={`hidden lg:block lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-300 ${
                !isNavbarAnimating ? "sticky" : ""
              }`}
              style={{
                top: `${filterPanelTopOffset}px`,
                zIndex: 20,
                transition: "top 0.3s ease-in-out",
              }}
            >
              <FilterPanel isMobile={false} sortBy={sortBy} setSortBy={setSortBy} />
            </aside>
            <main className="lg:col-span-3 space-y-5">
              <SpecialNoticesSection />

              <button
                onClick={() => setIsFilterOpen(true)}
                className="w-full flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-lg lg:hidden text-white"
                style={{ backgroundColor: PALETTE.accentBlue }}
              >
                <FaSlidersH /> Show Filters &amp; Sort
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center w-5 h-5 text-xs text-white bg-red-500 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <AnimatePresence>{renderMainContent()}</AnimatePresence>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close filters"
              onClick={() => setIsFilterOpen(false)}
              className="fixed inset-0 bg-black/40 z-50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 w-[88%] max-w-sm bg-white z-50 lg:hidden overflow-y-auto rounded-r-2xl shadow-xl"
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              <FilterPanel isMobile={true} sortBy={sortBy} setSortBy={setSortBy} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchResults;
