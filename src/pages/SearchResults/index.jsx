import {
  useSearchParams,
  useNavigate,
  createSearchParams,
  useLocation,
} from "react-router-dom";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import apiClient, { getClientId } from "../../api";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FaExclamationCircle,
  FaHourglassHalf,
  FaChevronLeft,
  FaTimes,
  FaSlidersH,
  FaSearch,
} from "react-icons/fa";

/* ---------------- TEMP direct UI deps we already have ---------------- */
import SpecialNoticeCard, {
  SpecialNoticeSkeleton,
} from "../../components/SpecialNoticeCard";
import SeatLayout from "../../components/SeatLayout";
import PointSelection from "../../components/PointSelection";
import BookingSummary from "../../components/BookingSummary";
import SeatLegend from "../../components/SeatLegend";

/* ---------------- Mini-split TODOs (we’ll create these next) ---------------- */
import SearchHeader from "./SearchHeader";                 // TODO: create
import FilterPanel from "./FilterPanel";                   // TODO: create
import ResultsList from "./ResultsList";                   // TODO: create
// Mobile flows (kept inline for now, you can split later if you prefer)
import MobileBottomSheet from "./MobileBottomSheet";
// import MobileSearchSheet from "./MobileSearchSheet";
// import MobileCityPicker from "./MobileCityPicker";
// import MobileCalendarSheet from "./MobileCalendarSheet";

/* ---- Newly extracted sections ---- */
import SpecialNoticesSection from "./SpecialNoticesSection";
import { ErrorDisplay, NoResultsMessage } from "./Messages";

/* ---------------- Palette & constants (we’ll extract later) ---------------- */
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F0F2F5",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  green: "#28a745",
  orange: "#fd7e14",
  yellow: "#FFC107",
  datePillBg: "#FFF9DB",
  acPillBg: "#EAF5FF",
  seatPillBg: "#FFE9EC",
};
const TIME_SLOTS = {
  Morning: [4, 12],
  Afternoon: [12, 17],
  Evening: [17, 21],
  Night: [21, 24],
};
const RESULTS_PER_PAGE = 5;

/* Near real-time refresh cadence (fallback if no websockets) */
const LIVE_POLL_MS = 6000;
const MAX_REFRESH_BUSES = 10;
const AVAIL_TTL_MS = 8000;
const AVAIL_FORCE_TTL_MS = 2000;
const MAX_INIT_AVAIL_CONCURRENCY = 6;

/* ---------------- Helpers (extract later) ---------------- */
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
const getDisplayPrice = (bus, from, to) => {
  if (bus.fares && Array.isArray(bus.fares)) {
    const specificFare = bus.fares.find(
      (fare) => fare.boardingPoint === from && fare.droppingPoint === to
    );
    if (specificFare && specificFare.price) return specificFare.price;
  }
  return bus.price;
};
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;
const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/* -------------- lock registry (same as your current file) -------------- */
const LOCK_REGISTRY_KEY = "rb_lock_registry_v1";
const readLockReg = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_REGISTRY_KEY) || "[]");
  } catch {
    return [];
  }
};
const writeLockReg = (arr) =>
  sessionStorage.setItem(LOCK_REGISTRY_KEY, JSON.stringify(arr));
const lockKey = (busId, time, date) => `${busId}__${time}__${date}`;
const addToRegistry = (bus, date, seats) => {
  const key = lockKey(bus._id, bus.departureTime, date);
  const reg = readLockReg();
  const i = reg.findIndex((r) => r.key === key);
  if (i >= 0) {
    const s = new Set([...(reg[i].seats || []), ...seats.map(String)]);
    reg[i].seats = Array.from(s);
  } else {
    reg.push({
      key,
      busId: bus._id,
      departureTime: bus.departureTime,
      date,
      seats: seats.map(String),
    });
  }
  writeLockReg(reg);
};
const removeFromRegistry = (bus, date, seats) => {
  const key = lockKey(bus._id, bus.departureTime, date);
  const reg = readLockReg();
  const i = reg.findIndex((r) => r.key === key);
  if (i >= 0) {
    const setToRemove = new Set(seats.map(String));
    const remaining = (reg[i].seats || []).filter((s) => !setToRemove.has(s));
    if (remaining.length) reg[i].seats = remaining;
    else reg.splice(i, 1);
    writeLockReg(reg);
  }
};
const releaseAllFromRegistry = async () => {
  const reg = readLockReg();
  if (!reg.length) return;
  const token = getAuthToken();
  await Promise.allSettled(
    reg.map((r) =>
      apiClient.delete("/bookings/release", {
        ...buildAuthConfig(token),
        data: {
          busId: r.busId,
          date: r.date,
          departureTime: r.departureTime,
          seats: r.seats,
          clientId: getClientId(),
        },
      })
    )
  );
  writeLockReg([]);
};

/* ---------------- Page ---------------- */
export default function SearchResults({ showNavbar, headerHeight, isNavbarAnimating }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const { from, to, date: searchDateParam } =
    Object.fromEntries(searchParams.entries());

  /* -------- State -------- */
  const [buses, setBuses] = useState([]);
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [page, setPage] = useState(1);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("time-asc");
  const [filters, setFilters] = useState({ type: "", maxPrice: 5000, timeSlots: {} });

  const [specialNotices, setSpecialNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  const [searchFrom, setSearchFrom] = useState(from || "");
  const [searchTo, setSearchTo] = useState(to || "");
  const [searchDate, setSearchDate] = useState(searchDateParam || toLocalYYYYMMDD(new Date()));
  const [allBusesForDropdown, setAllBusesForDropdown] = useState([]);
  const dateInputRef = useRef(null);
  const mobileDateInputRef = useRef(null);

  const stickySearchCardRef = useRef(null);
  const [stickySearchCardOwnHeight, setStickySearchCardOwnHeight] = useState(0);

  const todayStr = toLocalYYYYMMDD(new Date());

  /* --- Mobile dropdown/search state --- */
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobilePickerMode, setMobilePickerMode] = useState("from");
  const [calOpen, setCalOpen] = useState(false);
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
  const openMobilePicker = (mode) => {
    setMobilePickerMode(mode);
    setMobilePickerOpen(true);
  };
  const handleMobilePick = (city) => {
    if (mobilePickerMode === "from") {
      setSearchFrom(city);
      pushRecent("from", city);
    } else {
      setSearchTo(city);
      pushRecent("to", city);
    }
    setMobilePickerOpen(false);
  };

  /* -------- Inline booking state -------- */
  const [expandedBusId, setExpandedBusId] = useState(null);
  const [busSpecificBookingData, setBusSpecificBookingData] = useState({});
  const [mobileSheetStepByBus, setMobileSheetStepByBus] = useState({});
  const [locking, setLocking] = useState({}); // prevent double toggles while locking

  // latest refs for unmount cleanup
  const latestBookingRef = useRef(busSpecificBookingData);
  const latestBusesRef = useRef(buses);
  useEffect(() => { latestBookingRef.current = busSpecificBookingData; }, [busSpecificBookingData]);
  useEffect(() => { latestBusesRef.current = buses; }, [buses]);

  const availabilityRef = useRef(availability);
  useEffect(() => { availabilityRef.current = availability; }, [availability]);

  // throttle/de-dupe/backoff refs
  const inFlightAvailRef = useRef(new Map());
  const lastFetchedAtRef = useRef(new Map());
  const backoffUntilRef = useRef(0);

  const parseBusKey = (key) => {
    const lastDash = key.lastIndexOf("-");
    return { id: lastDash >= 0 ? key.slice(0, lastDash) : key, time: lastDash >= 0 ? key.slice(lastDash + 1) : "" };
  };

  const releaseAllSelectedSeats = useCallback(
    async (clearLocal = true) => {
      const entries = Object.entries(latestBookingRef.current || {});
      const tasks = [];
      for (const [key, data] of entries) {
        const seats = data?.selectedSeats || [];
        if (!seats.length) continue;
        const { id, time } = parseBusKey(key);
        const busObj = (latestBusesRef.current || []).find(
          (b) => b._id === id && b.departureTime === time
        );
        if (busObj) {
          tasks.push(
            apiClient.delete("/bookings/release", {
              ...buildAuthConfig(getAuthToken()),
              data: {
                busId: busObj._id,
                date: searchDateParam,
                departureTime: busObj.departureTime,
                seats: seats.map(String),
                clientId: getClientId(),
              },
            }).catch(() => {})
          );
        }
      }
      if (tasks.length) await Promise.allSettled(tasks);

      if (clearLocal) {
        setBusSpecificBookingData((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            next[k] = {
              ...next[k],
              selectedSeats: [],
              seatGenders: {},
              basePrice: 0,
              convenienceFee: 0,
              totalPrice: 0,
            };
          });
          return next;
        });
      }
      writeLockReg([]);
    },
    [searchDateParam]
  );

  // logout / multi-tab token removal
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await releaseAllFromRegistry();
      } finally {
        setExpandedBusId(null);
        setBusSpecificBookingData({});
        sessionStorage.removeItem("rb_skip_release_on_unmount");
      }
    };
    const onStorage = (e) => {
      if (
        ["token", "authToken", "jwt"].includes(e.key) &&
        (e.newValue === null || e.newValue === "")
      ) {
        handleLogout();
      }
    };
    window.addEventListener("rb:logout", handleLogout);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("rb:logout", handleLogout);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const refreshAvailability = useCallback(
    async (targetBuses, opts = {}) => {
      const { force = false } = opts;
      const list = (targetBuses && targetBuses.length ? targetBuses : buses) || [];
      if (!list.length) return;
      const now = Date.now();
      if (!force && now < backoffUntilRef.current) return;

      const updates = {};
      await Promise.all(
        list.map(async (bus) => {
          const key = `${bus._id}-${bus.departureTime}`;
          const last = lastFetchedAtRef.current.get(key) || 0;
          const minGap = force ? AVAIL_FORCE_TTL_MS : AVAIL_TTL_MS;
          if (!force && now - last < minGap) return;

          if (inFlightAvailRef.current.has(key)) {
            try {
              const data = await inFlightAvailRef.current.get(key);
              if (data) updates[key] = data;
            } catch {}
            return;
          }

          const p = (async () => {
            try {
              const res = await apiClient.get(`/bookings/availability/${bus._id}`, {
                params: { date: searchDateParam, departureTime: bus.departureTime },
              });
              const payload = {
                available: res.data.availableSeats,
                window: res.data.availableWindowSeats || null,
                bookedSeats: Array.isArray(res.data.bookedSeats)
                  ? res.data.bookedSeats.map(String)
                  : [],
                seatGenderMap: res.data.seatGenderMap || {},
              };
              lastFetchedAtRef.current.set(key, Date.now());
              return payload;
            } catch (e) {
              if (e?.response?.status === 429) {
                backoffUntilRef.current = Date.now() + 15000;
              }
              const prev = availabilityRef.current?.[key];
              return (
                prev || { available: null, window: null, bookedSeats: [], seatGenderMap: {} }
              );
            } finally {
              inFlightAvailRef.current.delete(key);
            }
          })();

          inFlightAvailRef.current.set(key, p);
          const data = await p;
          if (data) updates[key] = data;
        })
      );

      if (Object.keys(updates).length) {
        setAvailability((prev) => ({ ...prev, ...updates }));
      }
    },
    [buses, searchDateParam]
  );

  useEffect(() => {
    const onLogin = () => refreshAvailability();
    window.addEventListener("rb:login", onLogin);
    return () => window.removeEventListener("rb:login", onLogin);
  }, [refreshAvailability]);

  const visibleForPolling = useMemo(() => (buses ? [...buses] : []), [buses]);
  const pollInFlightRef = useRef(false);

  useEffect(() => {
    if (!buses.length) return;
    let stopped = false;

    const tick = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        if (document.hidden) return;
        const list = [];
        if (expandedBusId) {
          const lastDash = expandedBusId.lastIndexOf("-");
          const id = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
          const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
          const b = buses.find((x) => x._id === id && x.departureTime === time);
          if (b) list.push(b);
        }
        const visible = visibleForPolling.slice(0, page * RESULTS_PER_PAGE);
        for (const b of visible) {
          const key = `${b._id}-${b.departureTime}`;
          if (expandedBusId && key === expandedBusId) continue;
          list.push(b);
          if (list.length >= MAX_REFRESH_BUSES) break;
        }
        if (!stopped && list.length) await refreshAvailability(list);
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const id = setInterval(tick, LIVE_POLL_MS);
    tick();
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [buses, visibleForPolling, page, expandedBusId, refreshAvailability]);

  useEffect(() => {
    return () => {
      const skip = sessionStorage.getItem("rb_skip_release_on_unmount");
      if (skip === "1") {
        sessionStorage.removeItem("rb_skip_release_on_unmount");
        return;
      }
      releaseAllSelectedSeats(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stickySearchCardRef.current) {
      setStickySearchCardOwnHeight(stickySearchCardRef.current.offsetHeight);
    }
  }, [loading, fetchError, from, to, searchDate]);

  const searchCardStickyTopOffset = useMemo(
    () => (showNavbar ? headerHeight : 0),
    [showNavbar, headerHeight]
  );

  /* ---------------- Fetches ---------------- */
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

  const handleModifySearch = async () => {
    if (!searchFrom || !searchTo || !searchDate) {
      toast.error("Please fill all fields before searching");
      return;
    }
    await releaseAllSelectedSeats(true);
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({ from: searchFrom, to: searchTo, date: searchDate })}`,
    });
    setExpandedBusId(null);
  };
  const updateSearchWithDate = async (newDate) => {
    if (!searchFrom || !searchTo || !newDate) return;
    await releaseAllSelectedSeats(true);
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({ from: searchFrom, to: searchTo, date: newDate })}`,
    });
    setExpandedBusId(null);
  };
  const handleMobileDateChange = (e) => {
    const d = e.target.value;
    setSearchDate(d);
    updateSearchWithDate(d);
  };

  /* ---------------- Fetch results + initial availability fan-out ---------------- */
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
      const res = await apiClient.get("/buses", { params: { from, to, date: searchDateParam } });
      setBuses(res.data);

      const seatData = {};
      const items = res.data || [];

      for (let i = 0; i < items.length; i += MAX_INIT_AVAIL_CONCURRENCY) {
        const slice = items.slice(i, i + MAX_INIT_AVAIL_CONCURRENCY);
        await Promise.all(
          slice.map(async (bus) => {
            const key = `${bus._id}-${bus.departureTime}`;
            try {
              const availabilityRes = await apiClient.get(`/bookings/availability/${bus._id}`, {
                params: { date: searchDateParam, departureTime: bus.departureTime },
              });
              seatData[key] = {
                available: availabilityRes.data.availableSeats,
                window: availabilityRes.data.availableWindowSeats || null,
                bookedSeats: Array.isArray(availabilityRes.data.bookedSeats)
                  ? availabilityRes.data.bookedSeats.map(String)
                  : [],
                seatGenderMap: availabilityRes.data.seatGenderMap || {},
              };
              lastFetchedAtRef.current.set(key, Date.now());
            } catch (availErr) {
              seatData[key] = {
                available: null,
                window: null,
                bookedSeats: [],
                seatGenderMap: {},
              };
            }
          })
        );
      }
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

  /* ---------------- Body scroll lock for mobile flows ---------------- */
  const scrollLockRef = useRef({ y: 0 });
  useEffect(() => {
    const mobileFlowOpen = !!expandedBusId && window.innerWidth < 1024;
    const shouldLock = isFilterOpen || mobileFlowOpen || mobileSearchOpen;

    if (shouldLock) {
      scrollLockRef.current.y = window.scrollY || window.pageYOffset || 0;
      const body = document.body;
      body.style.position = "fixed";
      body.style.top = `-${scrollLockRef.current.y}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    } else {
      const body = document.body;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
      window.scrollTo(0, scrollLockRef.current.y || 0);
    }

    return () => {
      const body = document.body;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      body.style.overflow = "";
      body.style.touchAction = "";
    };
  }, [isFilterOpen, expandedBusId, mobileSearchOpen]);

  /* ---------------- Filtering / sorting / pagination ---------------- */
  const { filteredBuses } = useMemo(() => {
    const now = new Date();
    const today = new Date();
    const currentDateString = toLocalYYYYMMDD(today);
    const searchingToday = searchDateParam === currentDateString;

    return {
      filteredBuses: buses.filter((bus) => {
        if (!searchDateParam || !bus.departureTime) return false;

        const [depHour, depMinute] = bus.departureTime.split(":").map(Number);
        const [y, m, d] = searchDateParam.split("-").map(Number);
        const departureDateTime = new Date(y, m - 1, d, depHour, depMinute);
        const busDepartureTimestamp = departureDateTime.getTime();

        if (searchingToday && busDepartureTimestamp <= now.getTime()) return false;

        const bookingDeadlineTimestamp = busDepartureTimestamp - 1 * 60 * 60 * 1000;
        if (bookingDeadlineTimestamp <= now.getTime()) return false;

        const activeTimeSlots = Object.keys(filters.timeSlots).filter((slot) => filters.timeSlots[slot]);
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
      setPage((prev) => prev + 1);
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

  /* ---------------- Seats: lock / release / flow helpers ---------------- */
  const lockSeat = async (bus, seat) => {
    const token = getAuthToken();
    const payload = {
      busId: bus._id,
      date: searchDateParam,
      departureTime: bus.departureTime,
      seats: [String(seat)],
      clientId: getClientId(),
    };
    try {
      const res = await apiClient.post("/bookings/lock", payload, buildAuthConfig(token));
      if (res?.data?.ok) addToRegistry(bus, searchDateParam, [seat]);
      refreshAvailability([bus], { force: true });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        console.warn("Seat lock skipped (guest fallback):", err?.response?.data || err.message);
        return { ok: true, skipped: true };
      }
      throw err;
    }
  };
  const releaseSeats = async (bus, seats) => {
    const token = getAuthToken();
    const payload = {
      busId: bus._id,
      date: searchDateParam,
      departureTime: bus.departureTime,
      seats: seats.map(String),
      clientId: getClientId(),
    };
    try {
      await apiClient.delete("/bookings/release", { ...buildAuthConfig(token), data: payload });
      removeFromRegistry(bus, searchDateParam, seats);
      refreshAvailability([bus], { force: true });
    } catch (e) {
      console.warn("Release seats failed:", e?.response?.data || e.message);
    }
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

  const handleToggleSeatLayout = async (bus) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    if (expandedBusId === busKey) {
      const seatsToRelease = busSpecificBookingData[busKey]?.selectedSeats || [];
      if (seatsToRelease.length) {
        try { await releaseSeats(bus, seatsToRelease); } catch {}
      }
      setExpandedBusId(null);
    } else {
      await releaseAllSelectedSeats(true);
      setExpandedBusId(busKey);
      initializeBusBookingData(bus);
      setMobileSheetStepByBus((prev) => ({ ...prev, [busKey]: prev[busKey] || 1 }));
    }
  };

  const handleSeatToggle = async (bus, seat) => {
    const busKey = `${bus._id}-${bus.departureTime}`;
    const availabilityKey = `${bus._id}-${bus.departureTime}`;
    const currentBusData = busSpecificBookingData[busKey];
    if (!currentBusData) return;

    const { bookedSeats: unavailable = [] } = availability[availabilityKey] || {
      bookedSeats: [],
    };
    const seatStr = String(seat);
    const alreadySelected = currentBusData.selectedSeats.includes(seatStr);
    const lkKey = `${busKey}-${seatStr}`;
    if (locking[lkKey]) return;
    if (!alreadySelected && unavailable.includes(seatStr)) return;

    if (alreadySelected) {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [busKey]: {
          ...prev[busKey],
          selectedSeats: prev[busKey].selectedSeats.filter((s) => s !== seatStr),
          seatGenders: Object.fromEntries(
            Object.entries(prev[busKey].seatGenders).filter(([k]) => k !== seatStr)
          ),
        },
      }));
      releaseSeats(bus, [seatStr]).catch(() => {});
      return;
    }

    if (currentBusData.selectedSeats.length >= 4) {
      toast.error("🚫 You can select a maximum of 4 seats.");
      return;
    }

    setBusSpecificBookingData((prev) => ({
      ...prev,
      [busKey]: {
        ...prev[busKey],
        selectedSeats: [...prev[busKey].selectedSeats, seatStr],
        seatGenders: {
          ...prev[busKey].seatGenders,
          [seatStr]: prev[busKey].seatGenders[seatStr] || "M",
        },
      },
    }));

    setLocking((v) => ({ ...v, [lkKey]: true }));
    try {
      const resp = await lockSeat(bus, seatStr);
      if (!resp?.ok) {
        setBusSpecificBookingData((prev) => ({
          ...prev,
          [busKey]: {
            ...prev[busKey],
            selectedSeats: prev[busKey].selectedSeats.filter((s) => s !== seatStr),
            seatGenders: Object.fromEntries(
              Object.entries(prev[busKey].seatGenders).filter(([k]) => k !== seatStr)
            ),
          },
        }));
        toast.error("Sorry, that seat was just locked by another user.");
      }
    } catch {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [busKey]: {
          ...prev[busKey],
          selectedSeats: prev[busKey].selectedSeats.filter((s) => s !== seatStr),
          seatGenders: Object.fromEntries(
            Object.entries(prev[busKey].seatGenders).filter(([k]) => k !== seatStr)
          ),
        },
      }));
      toast.error("Seat lock failed. Please try again.");
    } finally {
      setLocking((v) => {
        const c = { ...v };
        delete c[lkKey];
        return c;
      });
    }
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

  /* -------- Price calc on selection change -------- */
  useEffect(() => {
    if (!expandedBusId || !buses.length) return;

    const lastDash = expandedBusId.lastIndexOf("-");
    const currentBusId = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
    const currentBusTime = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";

    const currentBus = buses.find(
      (b) => b._id === currentBusId && b.departureTime === currentBusTime
    );
    const busData = busSpecificBookingData[expandedBusId];
    if (!currentBus || !busData) return;

    const { selectedSeats, selectedBoardingPoint, selectedDroppingPoint } = busData;

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
        convenienceFeeValue = (basePrice * currentBus.convenienceFee.value) / 100;
      } else {
        convenienceFeeValue = currentBus.convenienceFee.value * selectedSeats.length;
      }
    }

    const newTotalPrice = basePrice + convenienceFeeValue;

    if (newTotalPrice !== busData.totalPrice || basePrice !== busData.basePrice) {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [expandedBusId]: {
          ...prev[expandedBusId],
          basePrice,
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

    sessionStorage.setItem("rb_skip_release_on_unmount", "1");

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
        clientId: getClientId(),
      },
    });
  };

  /* ---------------- Derived selections for mobile sheet ---------------- */
  const selectedBus = useMemo(() => {
    if (!expandedBusId) return null;
    const lastDash = expandedBusId.lastIndexOf("-");
    const id = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
    const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
    return buses.find((b) => b._id === id && b.departureTime === time) || null;
  }, [expandedBusId, buses]);
  const selectedAvailability = expandedBusId ? availability[expandedBusId] || {} : {};
  const selectedBookingData =
    (expandedBusId && busSpecificBookingData[expandedBusId]) || {
      selectedSeats: [],
      seatGenders: {},
      selectedBoardingPoint: selectedBus?.boardingPoints?.[0] || null,
      selectedDroppingPoint: selectedBus?.droppingPoints?.[0] || null,
      basePrice: 0,
      convenienceFee: 0,
      totalPrice: 0,
    };
  const currentMobileStep = (expandedBusId && mobileSheetStepByBus[expandedBusId]) || 1;
  const setCurrentMobileStep = (n) =>
    setMobileSheetStepByBus((prev) => ({ ...prev, [expandedBusId]: n }));

  /* ---------------- Layout ---------------- */
  const filterPanelTopOffset = useMemo(() => {
    const buffer = 16;
    return searchCardStickyTopOffset + stickySearchCardOwnHeight + buffer;
  }, [searchCardStickyTopOffset, stickySearchCardOwnHeight]);

  const drawerVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
  };

  const renderMainContent = () => {
    if (fetchError) return <ErrorDisplay message={fetchError} onRetry={fetchData} />;
    if (loading) {
      return (
        <ResultsList
          buses={[]}
          availability={{}}
          loading={true}
          page={page}
          perPage={RESULTS_PER_PAGE}
          expandedKey={expandedBusId}
          onToggleExpand={() => {}}
        />
      );
    }
    if (visibleBuses.length === 0) {
      return (
        <NoResultsMessage
          hasActiveFilters={activeFilterCount > 0}
          onReset={resetFilters}
        />
      );
    }
    return (
      <ResultsList
        buses={visibleBuses}
        availability={availability}
        from={from}
        to={to}
        page={page}
        perPage={RESULTS_PER_PAGE}
        loading={loading}
        expandedKey={expandedBusId}
        onToggleExpand={handleToggleSeatLayout}
        renderCardExtras={(bus) => {
          const key = `${bus._id}-${bus.departureTime}`;
          const av = availability[key] || {};
          const bookingData = busSpecificBookingData[key] || {};
          return (
            <>
              <div className="mt-3">
                <SeatLegend />
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <SeatLayout
                    seatLayout={bus.seatLayout}
                    bookedSeats={[...(av.bookedSeats || [])]}
                    selectedSeats={bookingData.selectedSeats || []}
                    onSeatClick={(seat) => handleSeatToggle(bus, seat)}
                    bookedSeatGenders={av.seatGenderMap || {}}
                    selectedSeatGenders={{}}
                  />
                </div>
              </div>

              <div className="mt-3">
                <PointSelection
                  boardingPoints={bus.boardingPoints}
                  droppingPoints={bus.droppingPoints}
                  selectedBoardingPoint={bookingData.selectedBoardingPoint}
                  setSelectedBoardingPoint={(p) => handleBoardingPointSelect(bus, p)}
                  selectedDroppingPoint={bookingData.selectedDroppingPoint}
                  setSelectedDroppingPoint={(p) => handleDroppingPointSelect(bus, p)}
                />
              </div>

              <div className="mt-3">
                <BookingSummary
                  bus={bus}
                  selectedSeats={bookingData.selectedSeats || []}
                  date={searchDateParam}
                  basePrice={bookingData.basePrice || 0}
                  convenienceFee={bookingData.convenienceFee || 0}
                  totalPrice={bookingData.totalPrice || 0}
                  onProceed={() => handleProceedToPayment(bus)}
                  boardingPoint={bookingData.selectedBoardingPoint}
                  droppingPoint={bookingData.selectedDroppingPoint}
                />
              </div>
            </>
          );
        }}
      />
    );
  };

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

              <button
                onClick={() => mobileDateInputRef.current?.showPicker()}
                className="flex flex-col items-center justify-center px-3 py-1.5 rounded-full border"
                aria-label="Change date"
                style={{ background: PALETTE.datePillBg, borderColor: "#FCEFC7" }}
              >
                <span className="text-sm font-semibold leading-none">
                  {getMobileDateParts(searchDate).top}
                </span>
                <span className="text-[10px] text-gray-600 leading-none mt-0.5">
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
              aria-hidden
            />
          </div>

          {/* Desktop sticky search card */}
          <div
            ref={stickySearchCardRef}
            className={`hidden lg:block ${!isNavbarAnimating ? "sticky" : ""}`}
            style={{ top: `${searchCardStickyTopOffset}px`, zIndex: 20, transition: "top 0.3s" }}
          >
            <SearchHeader
              from={searchFrom}
              to={searchTo}
              date={searchDate}
              fromOptions={fromOptions}
              toOptions={toOptions}
              onChangeFrom={setSearchFrom}
              onChangeTo={setSearchTo}
              onChangeDate={(d) => setSearchDate(d)}
              onSwap={() => {
                setSearchFrom(searchTo);
                setSearchTo(searchFrom);
              }}
              onSubmit={handleModifySearch}
              getReadableDate={getReadableDate}
              PALETTE={PALETTE}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 w-full pb-8" style={{ backgroundColor: PALETTE.bgLight }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 lg:gap-8 items-start">
            <aside
              className={`hidden lg:block lg:col-span-1 bg-white rounded-2xl p-6 border border-gray-300 ${
                !isNavbarAnimating ? "sticky" : ""
              }`}
              style={{ top: `${filterPanelTopOffset}px`, zIndex: 20, transition: "top 0.3s" }}
            >
              <FilterPanel
                isMobile={false}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filters={filters}
                setFilters={setFilters}
                activeFilterCount={activeFilterCount}
                TIME_SLOTS={TIME_SLOTS}
                resetFilters={resetFilters}
                PALETTE={PALETTE}
                sortedCount={sortedBuses.length}
              />
            </aside>

            <main className="lg:col-span-3 space-y-5">
              <SpecialNoticesSection
                noticesLoading={noticesLoading}
                specialNotices={specialNotices}
              />

              {/* Mobile drawer button */}
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
              <FilterPanel
                isMobile={true}
                sortBy={sortBy}
                setSortBy={setSortBy}
                filters={filters}
                setFilters={setFilters}
                activeFilterCount={activeFilterCount}
                TIME_SLOTS={TIME_SLOTS}
                resetFilters={resetFilters}
                PALETTE={PALETTE}
                sortedCount={sortedBuses.length}
                onClose={() => setIsFilterOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile bottom sheet (extracted) */}
      <MobileBottomSheet
        open={!!expandedBusId}
        bus={selectedBus}
        availability={selectedAvailability}
        bookingData={selectedBookingData}
        currentStep={currentMobileStep}
        setStep={setCurrentMobileStep}
        onSeatToggle={(seat) => selectedBus && handleSeatToggle(selectedBus, seat)}
        onBoarding={(p) => selectedBus && handleBoardingPointSelect(selectedBus, p)}
        onDropping={(p) => selectedBus && handleDroppingPointSelect(selectedBus, p)}
        onProceed={() => selectedBus && handleProceedToPayment(selectedBus)}
        onClose={() => setExpandedBusId(null)}
        from={from}
        to={to}
        date={searchDateParam}
      />
    </div>
  );
}
