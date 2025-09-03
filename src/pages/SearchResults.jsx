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
  FaExclamationCircle,
  FaHourglassHalf,
  FaSyncAlt,
  FaSlidersH,
  FaCalendarAlt,
  FaExchangeAlt,
  FaSearch,
} from "react-icons/fa";

import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../components/SpecialNoticeCard";
import SeatLayout from "../components/SeatLayout";
import PointSelection from "../components/PointSelection";
import BookingSummary from "../components/BookingSummary";
import SeatLegend from "../components/SeatLegend";

/* =========================
   PALETTE & CONSTANTS
========================= */
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F0F2F5",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  orange: "#fd7e14",
};
const TIME_SLOTS = {
  Morning: [4, 12],
  Afternoon: [12, 17],
  Evening: [17, 21],
  Night: [21, 24],
};
const RESULTS_PER_PAGE = 5;

/* =========================
   HELPERS
========================= */
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
  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  let s = sH * 60 + sM;
  let e = eH * 60 + eM;
  if (e < s) e += 24 * 60;
  const d = e - s;
  const h = Math.floor(d / 60);
  const m = d % 60;
  return `${h}h ${m}m`;
};
const getDisplayPrice = (bus, from, to) => {
  if (bus.fares && Array.isArray(bus.fares)) {
    const specific = bus.fares.find(
      (f) => f.boardingPoint === from && f.droppingPoint === to
    );
    if (specific?.price) return specific.price;
  }
  return bus.price;
};
const isACType = (t = "") => {
  const s = t.toLowerCase();
  return s.includes("ac") && !s.includes("non-ac") && !s.includes("non ac");
};
const stripACWord = (type = "") =>
  type.replace(/\bAC\b/gi, "").replace(/\s{2,}/g, " ").trim();

/* =========================
   BOOKING DEADLINE TIMER
========================= */
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
    const t = setInterval(() => {
      const left = deadlineTimestamp - Date.now();
      if (left <= 0) {
        setTimeLeft(0);
        clearInterval(t);
        onDeadline && onDeadline();
      } else {
        setTimeLeft(left);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadlineTimestamp, departureTimestamp, onDeadline]);

  if (Date.now() >= departureTimestamp) {
    return (
      <p className="text-xs font-medium mt-1" style={{ color: PALETTE.textLight }}>
        <FaHourglassHalf className="inline mr-1" /> Departed
      </p>
    );
  }
  if (timeLeft <= 0) {
    return (
      <p className="text-xs font-bold mt-1" style={{ color: PALETTE.primaryRed }}>
        <FaHourglassHalf className="inline mr-1" /> Booking Closed
      </p>
    );
  }
  const h = Math.floor(timeLeft / (1000 * 60 * 60));
  const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return (
    <div
      className="text-xs font-semibold mt-1 tabular-nums"
      style={{ color: PALETTE.orange }}
    >
      <FaHourglassHalf className="inline mr-1 animate-pulse" />
      Booking closes in: {String(h).padStart(2, "0")}:
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </div>
  );
};

/* =========================
   SKELETON CARD
========================= */
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

/* =========================
   MAIN
========================= */
const SearchResults = ({ showNavbar, headerHeight, isNavbarAnimating }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { from, to, date: searchDateParam } =
    Object.fromEntries(searchParams.entries());

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

  // Desktop inline expanded bus
  const [expandedBusId, setExpandedBusId] = useState(null);

  // Per-bus booking scratch
  const [busSpecificBookingData, setBusSpecificBookingData] = useState({});

  // NEW: Mobile bottom sheet active bus
  const [mobileSheetBusId, setMobileSheetBusId] = useState(null);

  // Lock body scroll when drawers/sheets open
  useEffect(() => {
    const locked = isFilterOpen || !!mobileSheetBusId;
    document.body.style.overflow = locked ? "hidden" : "unset";
    return () => (document.body.style.overflow = "unset");
  }, [isFilterOpen, mobileSheetBusId]);

  useEffect(() => {
    if (stickySearchCardRef.current) {
      setStickySearchCardOwnHeight(stickySearchCardRef.current.offsetHeight);
    }
  }, [loading, fetchError, from, to, searchDate]);

  const searchCardStickyTopOffset = useMemo(
    () => (showNavbar ? headerHeight : 0),
    [showNavbar, headerHeight]
  );

  /* ======= Fetch data ======= */
  useEffect(() => {
    const fetchSpecialNotices = async () => {
      try {
        setNoticesLoading(true);
        const res = await apiClient.get("/special-notices");
        setSpecialNotices(res.data);
      } catch (err) {
        console.error("Failed to fetch special notices:", err);
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
      } catch (err) {
        console.error("Failed to fetch bus locations for dropdowns", err);
      }
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
    setMobileSheetBusId(null);
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
    setMobileSheetBusId(null);
  };

  const swapLocations = () => {
    setSearchFrom(searchTo);
    setSearchTo(searchFrom);
  };

  const handleDateContainerClick = () => dateInputRef.current?.showPicker();
  const handleMobileDateChipClick = () =>
    mobileDateInputRef.current?.showPicker();

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
    setMobileSheetBusId(null);
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
                params: { date: searchDateParam, departureTime: bus.departureTime },
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
          } catch (err) {
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
      console.error("Error fetching bus results:", err);
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

  /* ======= Filters & sorting ======= */
  const { filteredBuses } = useMemo(() => {
    const now = new Date();
    const currentDateString = toLocalYYYYMMDD(new Date());
    const searchingToday = searchDateParam === currentDateString;

    return {
      filteredBuses: buses.filter((bus) => {
        if (!searchDateParam || !bus.departureTime) return false;
        const [depH, depM] = bus.departureTime.split(":").map(Number);
        const [yy, mm, dd] = searchDateParam.split("-").map(Number);
        const depDT = new Date(yy, mm - 1, dd, depH, depM);
        const depTs = depDT.getTime();

        if (searchingToday && depTs <= now.getTime()) return false;

        const deadlineTs = depTs - 60 * 60 * 1000;
        if (deadlineTs <= now.getTime()) return false;

        const activeTimeSlots = Object.keys(filters.timeSlots).filter(
          (slot) => filters.timeSlots[slot]
        );
        const inSlot =
          activeTimeSlots.length === 0 ||
          activeTimeSlots.some((slot) => {
            const [start, end] = TIME_SLOTS[slot];
            return slot === "Night"
              ? depH >= start || depH < TIME_SLOTS["Morning"][0]
              : depH >= start && depH < end;
          });

        const matchType = filters.type ? bus.busType === filters.type : true;
        const price = getDisplayPrice(bus, from, to);
        const matchPrice = price <= filters.maxPrice;
        return inSlot && matchType && matchPrice;
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
  const visibleBuses = sortedBuses.slice(0, page * RESULTS_PER_PAGE);

  // Infinite scroll
  useEffect(() => {
    const onScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop <
          document.documentElement.offsetHeight - 200 ||
        page >= totalPages ||
        loading
      ) {
        return;
      }
      setPage((p) => p + 1);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [page, totalPages, loading]);

  const activeFilterCount =
    Object.values(filters.timeSlots).filter(Boolean).length +
    (filters.type ? 1 : 0) +
    (filters.maxPrice < 5000 ? 1 : 0);

  const resetFilters = () => {
    setFilters({ type: "", maxPrice: 5000, timeSlots: {} });
    setPage(1);
  };

  /* =========================
     FILTER PANEL
  ========================= */
  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };
  const FilterPanel = ({ isMobile }) => {
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
            <FaSlidersH className="lg:hidden" style={{ color: PALETTE.accentBlue }} />
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

        {/* Sort */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Sort by
          </h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-0"
            style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
          >
            <option value="time-asc">Departure: Earliest</option>
            <option value="time-desc">Departure: Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </section>

        {/* Time slots */}
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

        {/* Type */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Bus Type
          </h4>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full border-2 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:ring-0"
            style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
          >
            <option value="">All Types</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </section>

        {/* Max price */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Max Price
          </h4>
          <input
            type="range"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{ backgroundColor: PALETTE.borderLight, accentColor: PALETTE.primaryRed }}
            min={500}
            max={5000}
            step={100}
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
            }
          />
          <div className="text-sm mt-2 text-center font-medium" style={{ color: PALETTE.textLight }}>
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
              {resetFilters > 0 ? "Reset" : "Reset"}
            </button>
          </div>
        )}
      </div>
    );
  };

  /* =========================
     BOOKING STATE HELPERS
  ========================= */
  const initializeBusBookingData = (bus) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => {
      if (prev[busKey]) return prev;
      return {
        ...prev,
        [busKey]: {
          selectedSeats: [],
          seatGenders: {}, // {"A1":"M"|"F"}
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
    const key = `${bus._id}-${bus.departureTime}`;
    if (expandedBusId === key) setExpandedBusId(null);
    else {
      setExpandedBusId(key);
      initializeBusBookingData(bus);
    }
  };

  // NEW: open mobile sheet
  const openMobileSheet = (bus) => {
    const key = `${bus._id}-${bus.departureTime}`;
    setMobileSheetBusId(key);
    initializeBusBookingData(bus);
  };
  const closeMobileSheet = () => setMobileSheetBusId(null);

  const handleSeatToggle = (bus, seat) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    const availabilityKey = `${bus._id}-${bus.departureTime}`;

    setBusSpecificBookingData((prev) => {
      const cur = prev[busKey];
      if (!cur) return prev;

      const { bookedSeats } = availability[availabilityKey] || { bookedSeats: [] };
      if (bookedSeats.includes(String(seat))) return prev;

      const isSelected = cur.selectedSeats.includes(String(seat));
      const canAdd = !isSelected && cur.selectedSeats.length < 4;

      const nextSeats = isSelected
        ? cur.selectedSeats.filter((s) => s !== String(seat))
        : canAdd
        ? [...cur.selectedSeats, String(seat)]
        : (toast.error("🚫 You can select a maximum of 4 seats."), cur.selectedSeats);

      const nextGenders = { ...(cur.seatGenders || {}) };
      if (isSelected) {
        delete nextGenders[String(seat)];
      } else if (canAdd) {
        if (!nextGenders[String(seat)]) nextGenders[String(seat)] = "M";
      }

      return {
        ...prev,
        [busKey]: { ...cur, selectedSeats: nextSeats, seatGenders: nextGenders },
      };
    });
  };

  const handleBoardingPointSelect = (bus, point) => {
    const key = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => ({
      ...prev,
      [key]: { ...prev[key], selectedBoardingPoint: point },
    }));
  };
  const handleDroppingPointSelect = (bus, point) => {
    const key = `${bus._id}-${bus.departureTime}`;
    setBusSpecificBookingData((prev) => ({
      ...prev,
      [key]: { ...prev[key], selectedDroppingPoint: point },
    }));
  };

  // Price calculation (works for desktop expanded OR mobile sheet)
  useEffect(() => {
    const activeKey = mobileSheetBusId || expandedBusId;
    if (!activeKey || !buses.length) return;

    const [id, time] = activeKey.split("-");
    const currentBus = buses.find((b) => b._id === id && b.departureTime === time);
    const busData = busSpecificBookingData[activeKey];
    if (!currentBus || !busData) return;

    const { selectedSeats, selectedBoardingPoint, selectedDroppingPoint } =
      busData;

    let pricePerSeat = currentBus.price;
    if (
      selectedBoardingPoint &&
      selectedDroppingPoint &&
      Array.isArray(currentBus.fares) &&
      currentBus.fares.length
    ) {
      const specific = currentBus.fares.find(
        (f) =>
          f.boardingPoint === selectedBoardingPoint.point &&
          f.droppingPoint === selectedDroppingPoint.point
      );
      if (specific) pricePerSeat = specific.price;
    }

    const base = pricePerSeat * selectedSeats.length;
    let conv = 0;
    if (currentBus.convenienceFee) {
      if (currentBus.convenienceFee.amountType === "percentage") {
        conv = (base * currentBus.convenienceFee.value) / 100;
      } else {
        conv = currentBus.convenienceFee.value * selectedSeats.length;
      }
    }
    const total = base + conv;

    if (
      base !== busData.basePrice ||
      conv !== busData.convenienceFee ||
      total !== busData.totalPrice
    ) {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [activeKey]: {
          ...prev[activeKey],
          basePrice: base,
          convenienceFee: conv,
          totalPrice: total,
        },
      }));
    }
  }, [expandedBusId, mobileSheetBusId, busSpecificBookingData, buses]);

  const handleProceedToPayment = (bus) => {
    const key = `${bus._id}-${bus.departureTime}`;
    const data = busSpecificBookingData[key];
    if (!data) return;

    const {
      selectedSeats,
      basePrice,
      convenienceFee,
      totalPrice,
      selectedBoardingPoint,
      selectedDroppingPoint,
      seatGenders,
    } = data;

    if (!selectedSeats.length) return toast.error("Please select at least one seat!");
    if (!selectedBoardingPoint || !selectedDroppingPoint)
      return toast.error("Please select a boarding and dropping point!");

    navigate("/confirm-booking", {
      state: {
        bus,
        busId: bus._id,
        date: searchDateParam,
        departureTime: bus.departureTime,
        selectedSeats,
        seatGenders: seatGenders || {},
        priceDetails: { basePrice, convenienceFee, totalPrice },
        selectedBoardingPoint,
        selectedDroppingPoint,
      },
    });
  };

  /* =========================
     UI SUPPORT
  ========================= */
  const ErrorDisplay = ({ message }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center p-10 bg-white rounded-2xl shadow-md"
    >
      <FaExclamationCircle className="mx-auto text-6xl mb-4" style={{ color: "#FFC107" }} />
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
    const hasActive = activeFilterCount > 0;
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
          {hasActive ? "No Buses Match Your Filters" : "No Buses Available"}
        </h3>
        <p className="max-w-md mx-auto mb-6" style={{ color: PALETTE.textLight }}>
          {hasActive
            ? "Try adjusting or resetting your filters."
            : "Unfortunately, no buses were found for this route on the selected date."}
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

  /* =========================
     MOBILE BOTTOM SHEET
  ========================= */
  const MobileBottomSheet = () => {
    if (!mobileSheetBusId) return null;

    const [id, time] = mobileSheetBusId.split("-");
    const bus = buses.find((b) => b._id === id && b.departureTime === time);
    if (!bus) return null;

    const availabilityKey = `${bus._id}-${bus.departureTime}`;
    const busAvailability = availability?.[availabilityKey] || {};
    const curData =
      busSpecificBookingData[mobileSheetBusId] ||
      {
        selectedSeats: [],
        seatGenders: {},
        selectedBoardingPoint: bus.boardingPoints?.[0] || null,
        selectedDroppingPoint: bus.droppingPoints?.[0] || null,
        basePrice: 0,
        convenienceFee: 0,
        totalPrice: 0,
      };

    return (
      <AnimatePresence>
        {/* Backdrop */}
        <motion.button
          key="backdrop"
          onClick={closeMobileSheet}
          className="fixed inset-0 bg-black/40 z-50 md:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        {/* Sheet */}
        <motion.div
          key="sheet"
          className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
        >
          <div className="bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[88vh] overflow-y-auto">
            {/* Grab handle & header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-100">
              <div className="flex items-center justify-between p-3">
                <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto absolute left-0 right-0 top-2" />
                <div className="flex-1 text-center font-semibold">{bus.name}</div>
                <button
                  onClick={closeMobileSheet}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                  aria-label="Close"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="p-3 space-y-3">
              {/* Seat legend + layout */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <SeatLegend />
                <div className="mt-3">
                  <SeatLayout
                    seatLayout={bus.seatLayout}
                    bookedSeats={busAvailability.bookedSeats || []}
                    selectedSeats={curData.selectedSeats}
                    onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                    bookedSeatGenders={busAvailability.seatGenderMap || {}}
                  />
                </div>
              </div>

              {/* Point selection */}
              <PointSelection
                boardingPoints={bus.boardingPoints}
                droppingPoints={bus.droppingPoints}
                selectedBoardingPoint={curData.selectedBoardingPoint}
                setSelectedBoardingPoint={(p) => handleBoardingPointSelect(bus, p)}
                selectedDroppingPoint={curData.selectedDroppingPoint}
                setSelectedDroppingPoint={(p) => handleDroppingPointSelect(bus, p)}
              />

              {/* Summary */}
              <BookingSummary
                bus={bus}
                selectedSeats={curData.selectedSeats}
                date={searchDateParam}
                basePrice={curData.basePrice}
                convenienceFee={curData.convenienceFee}
                totalPrice={curData.totalPrice}
                onProceed={() => handleProceedToPayment(bus)}
                boardingPoint={curData.selectedBoardingPoint}
                droppingPoint={curData.selectedDroppingPoint}
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  };

  /* =========================
     RESULTS LIST
  ========================= */
  const renderResults = () => {
    if (loading) return Array.from({ length: RESULTS_PER_PAGE }).map((_, i) => <BusCardSkeleton key={i} />);
    if (fetchError) return <ErrorDisplay message={fetchError} />;
    if (visibleBuses.length === 0) return <NoResultsMessage />;

    return (
      <>
        {visibleBuses.map((bus) => {
          const busKey = `${bus._id}-${bus.departureTime}`;
          const displayPrice = getDisplayPrice(bus, from, to);

          // countdown window (<= 12h)
          let timerProps = null;
          if (searchDateParam && bus.departureTime) {
            const now = new Date();
            const [h, m] = bus.departureTime.split(":").map(Number);
            const [yy, mm, dd] = searchDateParam.split("-").map(Number);
            const dt = new Date(yy, mm - 1, dd, h, m);
            const depTs = dt.getTime();
            const diffH = (depTs - now.getTime()) / (1000 * 60 * 60);
            if (diffH > 0 && diffH <= 12) {
              timerProps = {
                deadlineTimestamp: depTs - 60 * 60 * 1000,
                departureTimestamp: depTs,
                onDeadline: () => fetchData(),
              };
            }
          }

          const availabilityKey = `${bus._id}-${bus.departureTime}`;
          const busAvailability = availability?.[availabilityKey];
          const availableSeats = busAvailability?.available;
          const availableWindowSeats = busAvailability?.window;
          const isSoldOut = !availableSeats || availableSeats === 0;

          const currentBusData =
            busSpecificBookingData[busKey] || {
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
            <div
              key={busKey}
              className="bg-white rounded-xl transition-shadow duration-300 mb-3 md:mb-4 overflow-hidden border border-gray-200 hover:shadow-md"
            >
              {/* MOBILE CARD → opens bottom sheet */}
              <div
                className={`md:hidden block ${isSoldOut ? "opacity-60 bg-gray-50" : "cursor-pointer"}`}
                onClick={() => !isSoldOut && openMobileSheet(bus)}
              >
                <div className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[16px] font-normal tabular-nums inline-flex items-center px-2 py-0.5 rounded-lg"
                          style={{ backgroundColor: "#ECFDF5", color: "#065F46" }}
                        >
                          {bus.departureTime}
                        </span>
                        <span className="text-sm text-gray-300">—</span>
                        <span className="text-[18px] font-medium tabular-nums text-gray-400">
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
                            <span className="mx-2">·</span>
                            <span className="text-red-500">{availableSeats} seats left</span>
                          </>
                        )}
                      </div>

                      {timerProps && (
                        <div className="mt-2 inline-flex">
                          <div className="px-2 py-0.5 rounded-lg text-[11px]" style={{ backgroundColor: "#FFF7ED" }}>
                            <BookingDeadlineTimer
                              deadlineTimestamp={timerProps.deadlineTimestamp}
                              departureTimestamp={timerProps.departureTimestamp}
                              onDeadline={timerProps.onDeadline}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right pl-4">
                      {hasStrike && (
                        <div className="text-[12px] text-gray-400 line-through">Rs. {bus.originalPrice}</div>
                      )}
                      <div className="leading-tight">
                        <span className="text-[12px] text-gray-500 mr-1 align-top">Rs.</span>
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
                      <h4 className="text-[15px] font-medium text-gray-800 truncate">{bus.name}</h4>
                      <div className="flex items-center gap-2">
                        {isACType(bus.busType) ? (
                          <>
                            {stripACWord(bus.busType) && (
                              <p className="text-[12px] text-gray-500 truncate">
                                {stripACWord(bus.busType)}
                              </p>
                            )}
                            <span
                              className="px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                              style={{ backgroundColor: "#EFF6FF", color: "#1D4ED8" }}
                            >
                              AC
                            </span>
                          </>
                        ) : (
                          <p className="text-[12px] text-gray-500 truncate">{bus.busType}</p>
                        )}
                      </div>
                    </div>

                    <div className="w-16 h-10 flex-shrink-0 flex items-center justify-center">
                      {bus.operatorLogo ? (
                        <img
                          src={bus.operatorLogo}
                          alt={`${bus.name} logo`}
                          className="max-w-full max-h-full object-contain"
                          style={{ border: "none", boxShadow: "none" }}
                        />
                      ) : (
                        <FaBus className="text-2xl text-gray-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* DESKTOP CARD (unchanged behavior) */}
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
                          <FaBus className="text-3xl text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900">{bus.name}</h3>
                        <p className="text-sm font-medium text-gray-600">{bus.busType}</p>
                        {bus.liveTracking && (
                          <p className="text-xs font-medium mt-1 flex items-center gap-1 text-gray-500">
                            <FaRoute className="inline-block" /> Live Tracking
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
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
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
                      style={{ color: availableSeats > 0 ? "#EF4444" : "#9CA3AF" }}
                    >
                      {!availableSeats || availableSeats === 0
                        ? "Sold Out"
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
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleToggleSeatLayout(bus)}
                      disabled={!availableSeats || availableSeats === 0}
                      className="w-full md:w-auto mt-3 px-6 py-2.5 text-white font-semibold rounded-full transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor:
                          !availableSeats || availableSeats === 0 ? "#9CA3AF" : "#DC2626",
                      }}
                    >
                      {expandedBusId === busKey ? "Hide Seats" : "View seats"}
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
                              selectedSeats={currentBusData.selectedSeats}
                              onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                              bookedSeatGenders={busAvailability?.seatGenderMap || {}}
                            />
                          </div>
                        </div>
                        <div className="col-span-1 flex flex-col gap-4">
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <PointSelection
                              boardingPoints={bus.boardingPoints}
                              droppingPoints={bus.droppingPoints}
                              selectedBoardingPoint={currentBusData.selectedBoardingPoint}
                              setSelectedBoardingPoint={(p) => handleBoardingPointSelect(bus, p)}
                              selectedDroppingPoint={currentBusData.selectedDroppingPoint}
                              setSelectedDroppingPoint={(p) => handleDroppingPointSelect(bus, p)}
                            />
                          </div>
                          <div className="w-full mx-auto xs:max-w-xs sm:max-w-sm">
                            <BookingSummary
                              bus={bus}
                              selectedSeats={currentBusData.selectedSeats}
                              date={searchDateParam}
                              basePrice={currentBusData.basePrice}
                              convenienceFee={currentBusData.convenienceFee}
                              totalPrice={currentBusData.totalPrice}
                              onProceed={() => handleProceedToPayment(bus)}
                              boardingPoint={currentBusData.selectedBoardingPoint}
                              droppingPoint={currentBusData.selectedDroppingPoint}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  /* =========================
     LAYOUT
  ========================= */
  const filterPanelTopOffset = useMemo(() => {
    const buffer = 16;
    return searchCardStickyTopOffset + stickySearchCardOwnHeight + buffer;
  }, [searchCardStickyTopOffset, stickySearchCardOwnHeight]);

  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Toaster position="top-right" />

      {/* HEADER */}
      <div className="w-full" style={{ backgroundColor: PALETTE.white }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          {/* Mobile header */}
          <div className="block lg:hidden">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
                aria-label="Go back"
              >
                <FaChevronLeft className="text-xl" />
              </button>

              {/* Date chip */}
              <button
                onClick={handleMobileDateChipClick}
                className="flex flex-col items-center justify-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50"
                aria-label="Change date"
              >
                <span className="text-sm font-semibold leading-none">
                  {getMobileDateParts(searchDate).top}
                </span>
                <span className="text-[10px] text-gray-500 leading-none mt-0.5">
                  {getMobileDateParts(searchDate).bottom}
                </span>
              </button>
            </div>

            <div className="mt-2">
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: PALETTE.textDark }}>
                {from} <span className="mx-1.5">→</span> {to}
              </h1>
              {!loading && !fetchError && (
                <p className="text-xs text-gray-500 mt-0.5">{sortedBuses.length} buses</p>
              )}
            </div>

            <div className="mt-2 text-[11px] text-gray-500">
              Bus Ticket <span className="mx-1 text-gray-400">›</span>
              {from} to {to} Bus
            </div>

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

          {/* Desktop header */}
          <div className="hidden lg:block">
            <div className="flex items-center mb-2">
              <FaChevronLeft className="text-xl mr-2 cursor-pointer" onClick={() => navigate("/")} />
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

      {/* Sticky desktop search controls */}
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
            {/* Desktop controls only */}
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
                <div className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 z-20">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    className="bg-white p-2 rounded-full shadow-lg"
                    style={{ border: `2px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                    onClick={swapLocations}
                  >
                    <FaExchangeAlt style={{ color: PALETTE.textLight }} />
                  </motion.button>
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
                <FaCalendarAlt className="text-gray-400 mr-4 text-xl shrink-0" />
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

      {/* MAIN */}
      <div className="flex-1 w-full pb-8" style={{ backgroundColor: PALETTE.bgLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 items-start">
            {/* Desktop sidebar filters */}
            <aside
              className={`hidden lg:block lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-300 ${
                !isNavbarAnimating ? "sticky" : ""
              }`}
              style={{ top: `${filterPanelTopOffset}px`, zIndex: 20, transition: "top 0.3s ease-in-out" }}
            >
              <FilterPanel isMobile={false} />
            </aside>

            <main className="lg:col-span-3 space-y-5">
              {/* Special notices */}
              <SpecialNoticesSection
                specialNotices={specialNotices}
                noticesLoading={noticesLoading}
              />

              {/* Mobile "Filter & Sort" button */}
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

              {renderResults()}
            </main>
          </div>
        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
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
              <FilterPanel isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM SHEET (drop-up) */}
      <MobileBottomSheet />
    </div>
  );
};

/* =========================
   SPECIAL NOTICES (local)
========================= */
const SpecialNoticesSection = ({ specialNotices, noticesLoading }) => {
  const items = noticesLoading ? Array.from({ length: 4 }) : specialNotices;

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
  }, [noticesLoading, specialNotices?.length]);

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
        {items.map((item, index) => (
          <div key={noticesLoading ? `skeleton-${index}` : item._id} className="flex-shrink-0 w-1/2 sm:w-1/3 md:w-1/4 p-2">
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
                  active ? "w-6 bg-gray-900" : "w-2.5 bg-gray-300 hover:bg-gray-400",
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

export default SearchResults;

