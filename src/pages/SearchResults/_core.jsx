// src/pages/SearchResults/_core.jsx
// Shared logic provider (state, effects, handlers, utils) for Search Results.
// Mobile.jsx and Desktop.jsx consume this via useSearchCore().

import {
  useSearchParams,
  useNavigate,
  createSearchParams,
  useLocation,
} from "react-router-dom";
import {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import apiClient, { getClientId } from "../../api"; // NOTE: path relative to this folder
import { motion, AnimatePresence } from "framer-motion";
import Select from "react-select";
import toast from "react-hot-toast";
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
  FaChevronDown,
} from "react-icons/fa";
import { createPortal } from "react-dom";

/* ---------------- Context ---------------- */
const SearchCoreContext = createContext(null);
export const useSearchCore = () => {
  const ctx = useContext(SearchCoreContext);
  if (!ctx)
    throw new Error("useSearchCore must be used within a SearchCoreProvider");
  return ctx;
};

/* ---------------- Palette ---------------- */
export const PALETTE = {
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

/* ---------------- Constants ---------------- */
export const TIME_SLOTS = {
  Morning: [4, 12],
  Afternoon: [12, 17],
  Evening: [17, 21],
  Night: [21, 24],
};
export const RESULTS_PER_PAGE = 5;

/* Near real-time refresh cadence (fallback if no websockets) */
const LIVE_POLL_MS = 6000; // 🔁 lighter on server than 3s
const MAX_REFRESH_BUSES = 10; // cap concurrent availability fetches per tick
const AVAIL_TTL_MS = 8000; // throttle per bus normal refreshes
const AVAIL_FORCE_TTL_MS = 2000; // tighter window right after lock/release
const MAX_INIT_AVAIL_CONCURRENCY = 6; // limit initial fan-out

/* ---------------- Helpers ---------------- */
export const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getReadableDate = (dateString) => {
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

/* 🆕 AbhiBus-style compact date: "Tue 23 09 2025" */
export const getAbhiDate = (dateString) => {
  if (!dateString) return "Select Date";
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString("en-GB", { weekday: "short" }); // Tue
  const dd = String(dt.getDate()).padStart(2, "0"); // 23
  const mm = String(dt.getMonth() + 1).padStart(2, "0"); // 09
  const yyyy = String(dt.getFullYear()); // 2025
  return `${weekday} ${dd} ${mm} ${yyyy}`;
};

export const getMobileDateParts = (dateString) => {
  if (!dateString) return { top: "-- ---", bottom: "" };
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const top = dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
  const bottom = dt.toLocaleDateString("en-GB", { weekday: "short" });
  return { top, bottom };
};

export const calculateDuration = (startTime, endTime) => {
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

export const getDisplayPrice = (bus, from, to) => {
  if (bus.fares && Array.isArray(bus.fares)) {
    const specificFare = bus.fares.find(
      (fare) => fare.boardingPoint === from && fare.droppingPoint === to
    );
    if (specificFare && specificFare.price) {
      return specificFare.price;
    }
  }
  return bus.price;
};

export const isACType = (t = "") => {
  const s = t.toLowerCase();
  return s.includes("ac") && !s.includes("non-ac") && !s.includes("non ac");
};

export const stripACWord = (type = "") =>
  type
    .replace(/\bAC\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^\s+|\s+$/g, "");

/* -------- auth helpers -------- */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;
const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/* -------------- 🆕 lock registry (cross-tab aware via logout signal) -------------- */
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

/* 🆕 ---------- persist/rehydrate handoff between pages ---------- */
const CHECKOUT_STATE_KEY = "rb_checkout_state_v1";
const saveCheckoutState = (payload) => {
  try {
    sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(payload));
  } catch {}
};
const readCheckoutState = () => {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};
const clearCheckoutState = () => {
  try {
    sessionStorage.removeItem(CHECKOUT_STATE_KEY);
  } catch {}
};

/* ---------------- BookingDeadlineTimer (UI micro) ---------------- */
export const BookingDeadlineTimer = ({
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
      <p
        className="text-xs font-medium mt-1"
        style={{ color: PALETTE.textLight }}
      >
        <FaHourglassHalf className="inline mr-1" /> Departed
      </p>
    );
  }
  if (timeLeft <= 0) {
    return (
      <p
        className="text-xs font-bold mt-1"
        style={{ color: PALETTE.primaryRed }}
      >
        <FaHourglassHalf className="inline mr-1" /> Booking Closed
      </p>
    );
  }
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  return (
    <div
      className="text-xs font-semibold mt-1 tabular-nums"
      style={{ color: PALETTE.orange }}
    >
      <FaHourglassHalf className="inline mr-1 animate-pulse" />
      Booking closes in: {String(hours).padStart(2, "0")}:
      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
};

/* ---------------- Select styles (shared) ---------------- */
export const selectStyles = {
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

/* ======================================================= */
/*                     PROVIDER COMPONENT                  */
/* ======================================================= */
export function SearchCoreProvider({ children }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    from,
    to,
    date: searchDateParam,
  } = Object.fromEntries(searchParams.entries());

  /* -------- State -------- */
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
  const [stickySearchCardOwnHeight, setStickySearchCardOwnHeight] =
    useState(0);

  const todayStr = toLocalYYYYMMDD(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalYYYYMMDD(tomorrow);

  /* --- Mobile header/search state --- */
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobilePickerMode, setMobilePickerMode] = useState("from"); // 'from' | 'to'
  const [calOpen, setCalOpen] = useState(false); // bottom-sheet calendar
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

  // Refs to always have latest state inside unmount cleanup
  const latestBookingRef = useRef(busSpecificBookingData);
  const latestBusesRef = useRef(buses);
  useEffect(() => {
    latestBookingRef.current = busSpecificBookingData;
  }, [busSpecificBookingData]);
  useEffect(() => {
    latestBusesRef.current = buses;
  }, [buses]);

  // 🆕 keep availability in a ref so refreshAvailability stays stable
  const availabilityRef = useRef(availability);
  useEffect(() => {
    availabilityRef.current = availability;
  }, [availability]);

  // 🆕 throttle/de-dupe/backoff refs
  const inFlightAvailRef = useRef(new Map()); // key -> Promise
  const lastFetchedAtRef = useRef(new Map()); // key -> timestamp
  const backoffUntilRef = useRef(0); // global backoff timestamp

  // Helper to parse "<id>-<time>" key
  const parseBusKey = (key) => {
    const lastDash = key.lastIndexOf("-");
    return {
      id: lastDash >= 0 ? key.slice(0, lastDash) : key,
      time: lastDash >= 0 ? key.slice(lastDash + 1) : "",
    };
  };

  // Release all selected seats across cards (and optionally clear local selections)
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
            (async () => {
              try {
                await apiClient.delete("/bookings/release", {
                  ...buildAuthConfig(getAuthToken()),
                  data: {
                    busId: busObj._id,
                    date: searchDateParam,
                    departureTime: busObj.departureTime,
                    seats: seats.map(String),
                    clientId: getClientId(), // ✅ unified client id
                  },
                });
              } catch {
                // ignore network/release errors here
              }
            })()
          );
        }
      }
      if (tasks.length) {
        try {
          await Promise.allSettled(tasks);
        } catch {
          /* no-op */
        }
      }
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
      // 🆕 also clear the global registry when we bulk-release
      writeLockReg([]);
    },
    [searchDateParam]
  );

  // 🆕 listen for logout (custom event) + token removal (multi-tab)
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await releaseAllFromRegistry();
      } finally {
        // clear any local UI selection
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

  /* 🆕 ensure fresh availability on re-login (without resetting selections) */
  const refreshAvailability = useCallback(
    async (targetBuses, opts = {}) => {
      const { force = false } = opts;
      const list =
        (targetBuses && targetBuses.length ? targetBuses : buses) || [];
      if (!list.length) return;

      const now = Date.now();
      if (!force && now < backoffUntilRef.current) return; // global backoff

      const updates = {};

      await Promise.all(
        list.map(async (bus) => {
          const key = `${bus._id}-${bus.departureTime}`;
          const last = lastFetchedAtRef.current.get(key) || 0;
          const minGap = force ? AVAIL_FORCE_TTL_MS : AVAIL_TTL_MS;

          // throttle per bus
          if (!force && now - last < minGap) return;

          // de-dupe: if a request is already running for this bus, reuse it
          if (inFlightAvailRef.current.has(key)) {
            try {
              const data = await inFlightAvailRef.current.get(key);
              if (data) updates[key] = data;
            } catch {
              /* ignore */
            }
            return;
          }

          const p = (async () => {
            try {
              const res = await apiClient.get(
                `/bookings/availability/${bus._id}`,
                {
                  params: {
                    date: searchDateParam,
                    departureTime: bus.departureTime,
                  },
                }
              );

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
                // back off a bit to be nice to the server
                backoffUntilRef.current = Date.now() + 15000; // 15s
              }
              // keep whatever we had before
              const prev = availabilityRef.current?.[key];
              return (
                prev || {
                  available: null,
                  window: null,
                  bookedSeats: [],
                  seatGenderMap: {},
                }
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
    const onLogin = () => {
      refreshAvailability();
    };
    window.addEventListener("rb:login", onLogin);
    return () => window.removeEventListener("rb:login", onLogin);
  }, [refreshAvailability]);

  /* 🆕 tiny memo so the polling effect doesn't capture sortedBuses before init */
  const visibleForPolling = useMemo(() => {
    // we only need a list to refresh; order doesn't matter
    return buses ? [...buses] : [];
  }, [buses]);

  // 🆕 prevent overlapping polls
  const pollInFlightRef = useRef(false);

  /* 🆕 near real-time polling to reflect other users' locks without page refresh */
  useEffect(() => {
    if (!buses.length) return;
    let stopped = false;

    const tick = async () => {
      if (pollInFlightRef.current) return;
      pollInFlightRef.current = true;
      try {
        if (document.hidden) return; // save resources in background tabs
        // Always prioritize the currently expanded card, then visible list
        const list = [];
        if (expandedBusId) {
          const lastDash = expandedBusId.lastIndexOf("-");
          const id =
            lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
          const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
          const b = buses.find((x) => x._id === id && x.departureTime === time);
          if (b) list.push(b);
        }
        // append first N visible buses (based on current pagination)
        const visible = visibleForPolling.slice(0, page * RESULTS_PER_PAGE);
        for (const b of visible) {
          const key = `${b._id}-${b.departureTime}`;
          if (expandedBusId && key === expandedBusId) continue;
          list.push(b);
          if (list.length >= MAX_REFRESH_BUSES) break;
        }
        if (!stopped && list.length) {
          await refreshAvailability(list);
        }
      } finally {
        pollInFlightRef.current = false;
      }
    };

    const id = setInterval(tick, LIVE_POLL_MS);
    // prime immediately
    tick();

    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [buses, visibleForPolling, page, expandedBusId, refreshAvailability]);

  // 🆕 Rehydrate selection if user returns from ConfirmBooking via browser back
  useEffect(() => {
    const saved = readCheckoutState();
    if (!saved) return;

    const { busKey, date, data } = saved;
    if (!busKey || !date || !data) return;

    // restore UI state
    setExpandedBusId(busKey);
    setBusSpecificBookingData((prev) => ({ ...prev, [busKey]: data }));

    // Try to re-lock seats quietly (best-effort) so they remain “selected”, not red
    const lastDash = busKey.lastIndexOf("-");
    const id = lastDash >= 0 ? busKey.slice(0, lastDash) : busKey;
    const time = lastDash >= 0 ? busKey.slice(lastDash + 1) : "";
    const seats = (data.selectedSeats || []).map(String);

    if (id && time && date && seats.length) {
      apiClient
        .post("/bookings/lock", {
          busId: id,
          date,
          departureTime: time,
          seats,
          clientId: getClientId(),
        })
        .catch(() => {});
    }

    // keep state so multiple back/forward keeps context; clear if you prefer:
    // clearCheckoutState();
  }, []);

  // Release everything on page unmount (back/forward, navigating away)
  useEffect(() => {
    return () => {
      // 👉 Skip releasing if we're intentionally handing off to ConfirmBooking
      const skip = sessionStorage.getItem("rb_skip_release_on_unmount");
      if (skip === "1") {
        sessionStorage.removeItem("rb_skip_release_on_unmount");
        return;
      }
      // fire-and-forget; we don't await on unmount
      releaseAllSelectedSeats(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stickySearchCardRef.current) {
      setStickySearchCardOwnHeight(stickySearchCardRef.current.offsetHeight);
    }
  }, [loading, fetchError, from, to, searchDate]);

  /* Special Notices */
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

  /* Dropdown population (from/to options) */
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

  const fromOptions = useMemo(
    () =>
      [...new Set(allBusesForDropdown.map((b) => b.from))].map((val) => ({
        value: val,
        label: val,
      })),
    [allBusesForDropdown]
  );
  const toOptions = useMemo(
    () =>
      [...new Set(allBusesForDropdown.map((b) => b.to))].map((val) => ({
        value: val,
        label: val,
      })),
    [allBusesForDropdown]
  );

  const handleModifySearch = async () => {
    if (!searchFrom || !searchTo || !searchDate) {
      toast.error("Please fill all fields before searching");
      return;
    }
    await releaseAllSelectedSeats(true);
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

  const updateSearchWithDate = async (newDate) => {
    if (!searchFrom || !searchTo || !newDate) return;
    await releaseAllSelectedSeats(true);
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

  const handleDateContainerClick = () => {
    dateInputRef.current?.showPicker();
  };
  const handleMobileDateChipClick = () => {
    mobileDateInputRef.current?.showPicker();
  };
  const handleMobileDateChange = (e) => {
    const d = e.target.value;
    setSearchDate(d);
    updateSearchWithDate(d);
  };

  /* ---------------- Seat lock helpers (UNIFIED) ---------------- */
  const lockSeat = async (bus, seat) => {
    const token = getAuthToken();
    const payload = {
      busId: bus._id,
      date: searchDateParam,
      departureTime: bus.departureTime,
      seats: [String(seat)],
      clientId: getClientId(), // ✅ unified client id
    };
    // try to lock even if not logged in; fall back gracefully
    try {
      const res = await apiClient.post(
        "/bookings/lock",
        payload,
        buildAuthConfig(token)
      );
      // 🆕 register if actually locked
      if (res?.data?.ok) addToRegistry(bus, searchDateParam, [seat]);
      // quick refresh for this bus so other users' view reflects promptly
      refreshAvailability([bus], { force: true });
      return res.data;
    } catch (err) {
      if (err?.response?.status === 400 || err?.response?.status === 401) {
        console.warn(
          "Seat lock skipped (guest fallback):",
          err?.response?.data || err.message
        );
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
      clientId: getClientId(), // ✅ unified client id
    };
    try {
      await apiClient.delete("/bookings/release", {
        ...buildAuthConfig(token),
        data: payload,
      });
      // 🆕 keep registry in sync + refresh this bus availability
      removeFromRegistry(bus, searchDateParam, seats);
      refreshAvailability([bus], { force: true });
    } catch (e) {
      console.warn("Release seats failed:", e?.response?.data || e.message);
    }
  };

  /* ---------------- Fetch data ---------------- */

  // 🆕 detect “returning from confirm” once (skip clearing state)
  const returningFromConfirmRef = useRef(false);
  useEffect(() => {
    if (sessionStorage.getItem("rb_returning_from_confirm") === "1") {
      returningFromConfirmRef.current = true;
      sessionStorage.removeItem("rb_returning_from_confirm");
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!from || !to || !searchDateParam) {
      setLoading(false);
      setBuses([]);
      setFetchError("Missing search parameters. Please try searching again.");
      return;
    }
    setLoading(true);
    setFetchError(null);

    // 👉 Do not wipe restored state when coming back from confirm page
    if (!returningFromConfirmRef.current) {
      setExpandedBusId(null);
      setBusSpecificBookingData({});
    }

    try {
      const res = await apiClient.get("/buses", {
        params: { from, to, date: searchDateParam },
      });
      setBuses(res.data);

      const seatData = {};
      const items = res.data || [];

      // concurrency-limited availability fan-out
      for (let i = 0; i < items.length; i += MAX_INIT_AVAIL_CONCURRENCY) {
        const slice = items.slice(i, i + MAX_INIT_AVAIL_CONCURRENCY);
        await Promise.all(
          slice.map(async (bus) => {
            const key = `${bus._id}-${bus.departureTime}`;
            try {
              const availabilityRes = await apiClient.get(
                `/bookings/availability/${bus._id}`,
                {
                  params: {
                    date: searchDateParam,
                    departureTime: bus.departureTime,
                  },
                }
              );
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
              console.warn(
                `Could not fetch availability for bus ${bus._id} at ${bus.departureTime}:`,
                availErr
              );
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
      // only skip clearing once
      returningFromConfirmRef.current = false;
    }
  }, [from, to, searchDateParam]);

  useEffect(() => {
    fetchData();
    setPage(1);
    setSearchFrom(from || "");
    setSearchTo(to || "");
    setSearchDate(searchDateParam || toLocalYYYYMMDD(new Date()));
  }, [from, to, searchDateParam, fetchData, location.search]);

  /* ---------------- Filtering/sorting ---------------- */
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

        if (searchingToday && busDepartureTimestamp <= now.getTime()) {
          return false;
        }

        const bookingDeadlineTimestamp =
          busDepartureTimestamp - 1 * 60 * 60 * 1000;
        if (bookingDeadlineTimestamp <= now.getTime()) {
          return false;
        }

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

  const totalPages = useMemo(
    () => Math.ceil(sortedBuses.length / RESULTS_PER_PAGE),
    [sortedBuses]
  );

  /* ---------------- Infinite scroll ---------------- */
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

  const visibleBuses = useMemo(
    () => sortedBuses.slice(0, page * RESULTS_PER_PAGE),
    [sortedBuses, page]
  );

  const resetFilters = () => {
    setFilters({ type: "", maxPrice: 5000, timeSlots: {} });
    setPage(1);
  };

  /* ---------------- Booking helpers ---------------- */
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
      const seatsToRelease =
        busSpecificBookingData[busKey]?.selectedSeats || [];
      if (seatsToRelease.length) {
        try {
          await releaseSeats(bus, seatsToRelease);
        } catch (e) {
          console.warn("Release on close failed:", e);
        }
      }
      setExpandedBusId(null);
    } else {
      // switching cards – release any seats selected on other cards
      await releaseAllSelectedSeats(true);
      setExpandedBusId(busKey);
      initializeBusBookingData(bus);
      setMobileSheetStepByBus((prev) => ({
        ...prev,
        [busKey]: prev[busKey] || 1,
      }));
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

    // prevent toggling while this seat is in-flight
    const lkKey = `${busKey}-${seatStr}`;
    if (locking[lkKey]) return;

    if (!alreadySelected && unavailable.includes(seatStr)) return;

    // UNSELECT (optimistic)
    if (alreadySelected) {
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [busKey]: {
          ...prev[busKey],
          selectedSeats: prev[busKey].selectedSeats.filter(
            (s) => s !== seatStr
          ),
          seatGenders: Object.fromEntries(
            Object.entries(prev[busKey].seatGenders).filter(
              ([k]) => k !== seatStr
            )
          ),
        },
      }));
      // Fire-and-forget release
      releaseSeats(bus, [seatStr]).catch(() => {});
      return;
    }

    // SELECT (optimistic)
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
        // revert on failure
        setBusSpecificBookingData((prev) => ({
          ...prev,
          [busKey]: {
            ...prev[busKey],
            selectedSeats: prev[busKey].selectedSeats.filter(
              (s) => s !== seatStr
            ),
            seatGenders: Object.fromEntries(
              Object.entries(prev[busKey].seatGenders).filter(
                ([k]) => k !== seatStr
              )
            ),
          },
        }));
        toast.error("Sorry, that seat was just locked by another user.");
      }
    } catch (e) {
      // revert on error
      setBusSpecificBookingData((prev) => ({
        ...prev,
        [busKey]: {
          ...prev[busKey],
          selectedSeats: prev[busKey].selectedSeats.filter(
            (s) => s !== seatStr
          ),
          seatGenders: Object.fromEntries(
            Object.entries(prev[busKey].seatGenders).filter(
              ([k]) => k !== seatStr
            )
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

  /* -------- Price calculation -------- */
  useEffect(() => {
    if (!expandedBusId || !buses.length) return;

    const lastDash = expandedBusId.lastIndexOf("-");
    const currentBusId =
      lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
    const currentBusTime =
      lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";

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
      if (specificFare) {
        pricePerSeat = specificFare.price;
      }
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

    // 👉 tell unmount cleanup not to release seats during handoff
    sessionStorage.setItem("rb_skip_release_on_unmount", "1");

    /* 🆕 persist exact selection so Back button restores state */
    saveCheckoutState({
      busKey,
      date: searchDateParam,
      data: busData,
    });

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
        clientId: getClientId(), // ✅ pass same id to confirm page
      },
    });
  };

  /* -------- Derived selections for consumers -------- */
  const selectedBus = useMemo(() => {
    if (!expandedBusId) return null;
    const lastDash = expandedBusId.lastIndexOf("-");
    const id = lastDash >= 0 ? expandedBusId.slice(0, lastDash) : expandedBusId;
    const time = lastDash >= 0 ? expandedBusId.slice(lastDash + 1) : "";
    return buses.find((b) => b._id === id && b.departureTime === time) || null;
  }, [expandedBusId, buses]);

  const selectedAvailability = expandedBusId
    ? availability[expandedBusId] || {}
    : {};

  const selectedBookingData = (expandedBusId &&
    busSpecificBookingData[expandedBusId]) || {
    selectedSeats: [],
    seatGenders: {},
    selectedBoardingPoint: selectedBus?.boardingPoints?.[0] || null,
    selectedDroppingPoint: selectedBus?.droppingPoints?.[0] || null,
    basePrice: 0,
    convenienceFee: 0,
    totalPrice: 0,
  };

  const currentMobileStep =
    (expandedBusId && mobileSheetStepByBus[expandedBusId]) || 1;

  const setCurrentMobileStep = (n) =>
    setMobileSheetStepByBus((prev) => ({ ...prev, [expandedBusId]: n }));

  /* -------- Provider value -------- */
  const value = {
    // routing & params
    navigate,
    location,
    from,
    to,
    searchDateParam,

    // fetch
    fetchData,

    // core data
    buses,
    availability,
    loading,
    fetchError,

    // UI state
    page,
    setPage,
    isFilterOpen,
    setIsFilterOpen,
    sortBy,
    setSortBy,
    filters,
    setFilters,

    // notices
    specialNotices,
    noticesLoading,

    // search controls
    searchFrom,
    setSearchFrom,
    searchTo,
    setSearchTo,
    searchDate,
    setSearchDate,
    fromOptions,
    toOptions,
    dateInputRef,
    mobileDateInputRef,
    handleModifySearch,
    updateSearchWithDate,
    swapLocations,
    handleDateContainerClick,
    handleMobileDateChipClick,
    handleMobileDateChange,

    // sticky helpers
    stickySearchCardRef,
    stickySearchCardOwnHeight,
    todayStr,
    tomorrowStr,

    // mobile header/search state
    mobileSearchOpen,
    setMobileSearchOpen,
    mobilePickerOpen,
    setMobilePickerOpen,
    mobilePickerMode,
    setMobilePickerMode,
    calOpen,
    setCalOpen,
    recent,
    setRecent,
    openMobilePicker,
    handleMobilePick,

    // booking state & actions
    expandedBusId,
    setExpandedBusId,
    busSpecificBookingData,
    setBusSpecificBookingData,
    mobileSheetStepByBus,
    setMobileSheetStepByBus,
    locking,
    setLocking,
    initializeBusBookingData,
    handleToggleSeatLayout,
    handleSeatToggle,
    handleBoardingPointSelect,
    handleDroppingPointSelect,
    handleProceedToPayment,
    releaseAllSelectedSeats,
    refreshAvailability,

    // derived lists
    filteredBuses,
    sortedBuses,
    totalPages,
    activeFilterCount,
    visibleBuses,
    resetFilters,

    // selected bus helpers
    selectedBus,
    selectedAvailability,
    selectedBookingData,
    currentMobileStep,
    setCurrentMobileStep,
  };

  return (
    <SearchCoreContext.Provider value={value}>
      {children}
    </SearchCoreContext.Provider>
  );
}
