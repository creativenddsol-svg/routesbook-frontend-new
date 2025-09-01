// src/pages/Home.jsx
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Select, { components } from "react-select";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {
  FaBus,
  FaCalendarAlt,
  FaExchangeAlt,
  FaShieldAlt,
  FaBolt,
  FaChair,
  FaMobileAlt,
  FaLongArrowAltRight,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";
import { FaClock, FaMapMarkerAlt } from "react-icons/fa";
import Footer from "../components/Footer";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom"; // portal for calendar
import NoticesSection from "../components/NoticesSection";
import WhatsNewSection from "../components/WhatsNewSection";
import apiClient from "../api";

/* ---------------- Calendar helpers ---------------- */
const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

/* ---------------- Theme ---------------- */
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#FFFFFF",
  borderLight: "#E0E0E0",
  white: "#FFFFFF",
};

const SECTION_WRAP = "full-bleed";
const SECTION_INNER =
  "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

/* ---------------- Utility: is a ref visible? ---------------- */
const isRefVisible = (ref) => {
  const el = ref?.current;
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return !(style.display === "none" || rect.width === 0 || rect.height === 0);
};

/* -------- Redbus-like Calendar Popover (portal, single instance) -------- */
const CalendarPopover = ({
  anchorRef,
  open,
  value,
  minDateString,
  onChange,
  onClose,
  palette = PALETTE,
}) => {
  const popRef = useRef(null);
  const today = new Date();
  const minDate = minDateString ? parseYMD(minDateString) : today;
  const selected = value ? parseYMD(value) : null;
  const [viewMonth, setViewMonth] = useState(
    selected ? startOfMonth(selected) : startOfMonth(today)
  );

  useEffect(() => {
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

  useEffect(() => {
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

  return createPortal(
    <div
      ref={popRef}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ top, left, zIndex: 9999, width, position: "fixed" }}
      className="bg-white rounded-2xl shadow-[0_15px_40px_-10px_rgba(0,0,0,0.25)] border border-gray-100 overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2 border-b" style={{ borderColor: PALETTE.borderLight }}>
        <div className="text-xs uppercase font-medium tracking-wider" style={{ color: PALETTE.textLight }}>
          Date of Journey
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-base font-semibold" style={{ color: PALETTE.textDark }}>
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
              className="w-8 h-8 rounded-full border hover:bg-gray-50"
              style={{ borderColor: PALETTE.borderLight }}
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-8 h-8 rounded-full border hover:bg-gray-50"
              style={{ borderColor: PALETTE.borderLight }}
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>
        <div className="mt-1 text-sm font-medium" style={{ color: PALETTE.textDark }}>
          {viewMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })}
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-xs py-2" style={{ color: PALETTE.textLight }}>
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
                backgroundColor: selectedDay ? PALETTE.primaryRed : undefined,
                border:
                  isToday && !selectedDay
                    ? `1px solid ${PALETTE.primaryRed}`
                    : undefined,
                color: disabled
                  ? "#D1D5DB"
                  : selectedDay
                  ? "#FFFFFF"
                  : PALETTE.textDark,
              }}
              disabled={disabled}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t flex items-center justify-between" style={{ borderColor: PALETTE.borderLight }}>
        <div className="space-x-3">
          <button
            onClick={() => {
              const t = new Date();
              onChange?.(toLocalYYYYMMDD(t));
              onClose?.();
            }}
            className="text-sm font-medium hover:underline"
            style={{ color: PALETTE.accentBlue }}
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
            className="text-sm font-medium hover:underline"
            style={{ color: PALETTE.accentBlue }}
          >
            Tomorrow
          </button>
        </div>
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg border hover:bg-gray-50"
          style={{ borderColor: PALETTE.borderLight, color: PALETTE.textLight }}
        >
          Close
        </button>
      </div>
    </div>,
    document.body
  );
};

/* --------- NEW: Mobile Bottom-Sheet Calendar (slides up from bottom) --------- */
const MobileCalendarSheet = ({
  open,
  value,
  minDateString,
  onChange,
  onClose,
}) => {
  const today = new Date();
  const minDate = minDateString ? parseYMD(minDateString) : today;
  const selected = value ? parseYMD(value) : null;
  const [viewMonth, setViewMonth] = useState(
    selected ? startOfMonth(selected) : startOfMonth(today)
  );

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onEsc);
    // Lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (selected) setViewMonth(startOfMonth(selected));
  }, [value]);

  if (!open) return null;

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

  const pick = (d) => {
    if (isDisabled(d)) return;
    onChange?.(toLocalYYYYMMDD(d));
    onClose?.();
  };

  return createPortal(
    <>
      {/* Dimmed backdrop */}
      <div
        className="lg:hidden fixed inset-0 z-[10000] bg-black/40"
        onClick={onClose}
      />
      {/* Bottom sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="lg:hidden fixed inset-x-0 bottom-0 z-[10001] bg-white rounded-t-2xl shadow-2xl"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Safe area for notch */}
        <div style={{ height: "env(safe-area-inset-top)" }} />
        {/* Grab handle */}
        <div className="pt-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">
              Date of Journey
            </div>
            <div className="text-base font-semibold">
              {value
                ? parseYMD(value).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Select Date"}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="w-9 h-9 rounded-full border flex items-center justify-center"
              aria-label="Previous month"
            >
              ←
            </button>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-9 h-9 rounded-full border flex items-center justify-center"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        {/* Month label */}
        <div className="px-4 pt-2 text-sm font-medium">
          {viewMonth.toLocaleString("en-GB", { month: "long", year: "numeric" })}
        </div>

        {/* Calendar grid container (scrollable) */}
        <div className="px-2 pb-2 overflow-y-auto" style={{ maxHeight: "60vh" }}>
          <div className="grid grid-cols-7 text-center text-xs py-2 text-gray-500">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="select-none">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1 pb-2">
            {cells.map((d, idx) => {
              if (!d) return <div key={idx} />;
              const selectedDay = value && sameYMD(parseYMD(value), d);
              const isToday = sameYMD(new Date(), d);
              const disabled = isDisabled(d);

              let classes =
                "mx-auto my-1 flex items-center justify-center w-10 h-10 rounded-full text-sm select-none ";
              if (disabled) classes += "text-gray-300";
              else if (selectedDay) classes += "text-white font-semibold bg-[#D84E55]";
              else classes += "active:bg-red-50";

              return (
                <button
                  key={idx}
                  onClick={() => pick(d)}
                  disabled={disabled}
                  className={classes}
                  style={{
                    border:
                      isToday && !selectedDay
                        ? `1px solid ${PALETTE.primaryRed}`
                        : undefined,
                  }}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer quick actions */}
        <div className="px-4 py-3 border-t flex items-center justify-between">
          <div className="space-x-4">
            <button
              onClick={() => {
                const t = new Date();
                onChange?.(toLocalYYYYMMDD(t));
                onClose?.();
              }}
              className="text-sm font-semibold text-[#3A86FF]"
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
              className="text-sm font-semibold text-[#3A86FF]"
            >
              Tomorrow
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border text-gray-600"
          >
            Close
          </button>
        </div>

        {/* Safe area bottom */}
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </motion.div>
    </>,
    document.body
  );
};

/* ---------------- Popular Cities for quick-pick ---------------- */
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

/* ---------------- Custom Select Menu (desktop only) ---------------- */
const CustomMenu = (menuKey) => {
  return (props) => {
    const { selectProps } = props;
    const recents = selectProps.recent?.[menuKey] || [];

    const finishPickAndClose = () => {
      props.selectProps.onMenuClose &&
        requestAnimationFrame(() => props.selectProps.onMenuClose());
    };

    const onPick = (city) => {
      selectProps.onChange(
        { value: city, label: city },
        { action: "select-option" }
      );
      finishPickAndClose();
    };

    const handlePointerPick = (e, city) => {
      if (e.pointerType !== "touch") e.preventDefault?.();
      e.stopPropagation?.();
      onPick(city);
    };

    return (
      <components.Menu {...props}>
        <div className="px-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
            <FaClock className="opacity-70" /> Recent searches
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
                  <span className="text-sm font-medium text-gray-800">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

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

        <components.MenuList {...props}>{props.children}</components.MenuList>
      </components.Menu>
    );
  };
};

/* ---------------- Mobile full-page city picker ---------------- */
const MobileCityPicker = ({
  open,
  mode, // 'from' | 'to'
  options,
  recent,
  onPick,
  onClose,
}) => {
  const [q, setQ] = useState("");
  const all = options.map((o) => o.label);
  const filtered =
    q.trim() === ""
      ? all
      : all.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[10000] bg-white flex flex-col">
      {/* Safe area for notch */}
      <div style={{ height: "env(safe-area-inset-top)" }} />
      {/* Header */}
      <div className="px-4 pb-3 pt-3 border-b flex items-center gap-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border flex items-center justify-center"
          aria-label="Back"
        >
          ←
        </button>
        <div className="text-base font-semibold">
          {mode === "from" ? "Select From City" : "Select To City"}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          className="w-full rounded-xl border px-4 py-3 text-base outline-none"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          // Prevent iOS Safari zoom-on-focus (keep >=16px) and stabilize text sizing
          style={{ fontSize: 16, WebkitTextSizeAdjust: "100%" }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>

      {/* Content scroll */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent searches */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
            <FaClock className="opacity-70" /> Recent searches
          </div>
          {(recent?.[mode] || []).length === 0 ? (
            <div className="text-sm text-gray-400">No recent searches</div>
          ) : (
            <div className="mb-3 divide-y rounded-xl border border-gray-100 overflow-hidden">
              {recent[mode].map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-gray-50"
                  onClick={() => onPick(city)}
                >
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span className="text-base font-medium text-gray-800">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Popular Cities */}
        <div className="px-4 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Popular Cities
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {POPULAR_CITIES.map((c) => (
              <button
                key={c}
                className="px-3 py-1.5 rounded-full border text-sm active:bg-red-50"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* All cities (filtered) */}
        <div className="px-4 pb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>
          <div className="divide-y rounded-xl border border-gray-100 overflow-hidden">
            {filtered.map((c) => (
              <button
                key={c}
                className="w-full text-left px-3 py-3 active:bg-gray-50"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Safe area bottom */}
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
};

/* ---------------- Data (unchanged) ---------------- */
const whyChooseUsData = [
  { icon: FaChair, title: "Real-Time Seats", desc: "Live seat availability for immediate booking." },
  { icon: FaBolt, title: "Instant Booking", desc: "Book your tickets in just a few clicks." },
  { icon: FaShieldAlt, title: "Secure Payments", desc: "100% safe and secure online transactions." },
  { icon: FaMobileAlt, title: "Mobile Ready", desc: "Book on any device, anywhere, anytime." },
];

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

const Home = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(toLocalYYYYMMDD(new Date()));
  const [allBuses, setAllBuses] = useState([]);
  const navigate = useNavigate();

  // calendar popover state
  const [calOpen, setCalOpen] = useState(false);
  const desktopDateAnchorRef = useRef(null);
  const mobileDateAnchorRef = useRef(null);

  // mobile city picker state
  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobilePickerMode, setMobilePickerMode] = useState("from"); // 'from' | 'to'

  // recents (persist to localStorage)
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

  const todayStr = toLocalYYYYMMDD(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalYYYYMMDD(tomorrow);

  useEffect(() => {
    const fetchAllBuses = async () => {
      try {
        const res = await apiClient.get("/buses");
        setAllBuses(res.data);
      } catch (err) {
        console.error("Failed to fetch buses", err);
        toast.error("Failed to fetch bus locations.");
      }
    };
    fetchAllBuses();
  }, []);

  const fromOptions = [...new Set(allBuses.map((b) => b.from))].map((val) => ({
    value: val,
    label: val,
  }));
  const toOptions = [...new Set(allBuses.map((b) => b.to))].map((val) => ({
    value: val,
    label: val,
  }));

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

  const handleSearch = () => {
    const dateToSearch = date || toLocalYYYYMMDD(new Date());
    if (!from || !to || !dateToSearch) {
      toast.error("Please fill all fields before searching");
      return;
    }
    navigate(`/search-results?from=${from}&to=${to}&date=${dateToSearch}`);
  };

  const swapLocations = () => {
    const tempFrom = from;
    setFrom(to);
    setTo(tempFrom);
  };

  const selectStyles = {
    control: (provided) => ({
      ...provided,
      border: "none",
      boxShadow: "none",
      backgroundColor: "transparent",
      minHeight: "auto",
      height: "auto",
      cursor: "pointer",
    }),
    valueContainer: (provided) => ({ ...provided, padding: "0" }),
    placeholder: (provided) => ({
      ...provided,
      color: PALETTE.textLight,
      fontSize: "16px",
      fontWeight: "500",
      fontFamily: "Inter, sans-serif",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: PALETTE.textDark,
      fontSize: "18px",
      fontWeight: "600",
      fontFamily: "Inter, sans-serif",
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: "12px",
      fontFamily: "Inter, sans-serif",
      backgroundColor: PALETTE.white,
      boxShadow:
        "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
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

  // handlers to open mobile full-page picker
  const openMobilePicker = (mode) => {
    setMobilePickerMode(mode);
    setMobilePickerOpen(true);
  };
  const handleMobilePick = (city) => {
    if (mobilePickerMode === "from") {
      setFrom(city);
      pushRecent("from", city);
    } else {
      setTo(city);
      pushRecent("to", city);
    }
    setMobilePickerOpen(false);
  };

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: PALETTE.bgLight }}>
      {/* notch spacer (mobile only) */}
      <div className="lg:hidden" style={{ height: "env(safe-area-inset-top)", backgroundColor: PALETTE.bgLight }} />

      <Toaster position="top-right" />

      {/* ===== Hero Section (desktop only) ===== */}
      <div
        className="hidden lg:block w-screen relative left-1/2 ml-[-50vw] overflow-hidden pb-20 lg:pb-40"
        style={{ backgroundColor: PALETTE.primaryRed }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent"></div>
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-40 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"
        />
        <div className="relative z-10 px-4 pt-16 sm:pt-24">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8 }}>
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Online Bus Ticket Booking
              </h1>
              <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto">
                Travel Smart with Routesbook.lk - Book Instantly
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ===== Search Widget ===== */}
      <div className={`${SECTION_WRAP}`}>
        <div className={`${SECTION_INNER} relative z-20 mt-4 lg:-mt-32`}>
          <div className="lg:hidden text-left pb-2 px-4 pt-4">
            <h2 className="text-xl font-bold" style={{ color: PALETTE.textDark }}>
              Bus Tickets
            </h2>
          </div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white border border-gray-300 rounded-xl lg:rounded-2xl lg:shadow-2xl"
          >
            {/* ----- DESKTOP VIEW (unchanged) ----- */}
            <div className="hidden lg:flex rounded-2xl overflow-hidden">
              <div className="relative flex-1 p-6 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    From
                  </label>
                  <Select
                    options={fromOptions}
                    value={from ? { value: from, label: from } : null}
                    onChange={(s) => {
                      const v = s?.value || "";
                      setFrom(v);
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
                    closeMenuOnSelect={true}
                  />
                </div>
                <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-20">
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={swapLocations}
                    className="bg-white p-2 rounded-full shadow-lg transition-all duration-200"
                    style={{ border: `2px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                  >
                    <FaExchangeAlt style={{ color: PALETTE.textLight }} />
                  </motion.button>
                </div>
              </div>

              <div className="relative flex-1 p-6 flex items-center border-r" style={{ borderColor: PALETTE.borderLight }}>
                <FaBus className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    To
                  </label>
                  <Select
                    options={toOptions}
                    value={to ? { value: to, label: to } : null}
                    onChange={(s) => {
                      const v = s?.value || "";
                      setTo(v);
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
                    closeMenuOnSelect={true}
                  />
                </div>
              </div>

              {/* DATE (Desktop) */}
              <div className="flex-1 p-6 flex items-center relative">
                <FaCalendarAlt className="text-gray-400 mr-4 text-xl shrink-0" />
                <div className="w-full">
                  <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                    Date of Journey
                  </label>
                  <div ref={desktopDateAnchorRef} onClick={() => setCalOpen(true)} className="cursor-pointer">
                    <span className="text-lg font-medium" style={{ color: PALETTE.textDark }}>
                      {getReadableDate(date)}
                    </span>
                  </div>
                  <div className="mt-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDate(todayStr);
                      }}
                      className="text-xs font-medium mr-3 hover:underline"
                      style={{
                        color: date === todayStr ? PALETTE.primaryRed : PALETTE.accentBlue,
                      }}
                    >
                      Today
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDate(tomorrowStr);
                      }}
                      className="text-xs font-medium hover:underline"
                      style={{
                        color: date === tomorrowStr ? PALETTE.primaryRed : PALETTE.accentBlue,
                      }}
                    >
                      Tomorrow
                    </button>
                  </div>
                </div>

                <CalendarPopover
                  anchorRef={desktopDateAnchorRef}
                  open={calOpen && isRefVisible(desktopDateAnchorRef)}
                  value={date}
                  minDateString={todayStr}
                  onChange={setDate}
                  onClose={() => setCalOpen(false)}
                />
              </div>

              <div className="p-4 flex items-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearch}
                  className="font-heading w-full lg:w-auto flex items-center justify-center gap-2 text-white font-bold tracking-wider px-8 py-4 rounded-xl shadow-lg transition-all duration-300"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch />
                  SEARCH BUSES
                </motion.button>
              </div>
            </div>

            {/* ----- MOBILE VIEW (updated: full-page city picker + bottom-sheet calendar) ----- */}
            <div className="lg:hidden">
              <div className="relative">
                {/* FROM */}
                <div className="p-4">
                  <div className="flex items-center gap-4 pb-4 border-b" style={{ borderColor: PALETTE.borderLight }}>
                    <FaBus className="shrink-0" style={{ color: PALETTE.textLight }} />
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-500">From</label>

                      {/* Tap-to-open full page picker */}
                      <button
                        type="button"
                        onClick={() => openMobilePicker("from")}
                        className="w-full text-left py-2"
                      >
                        <span className={`text-lg ${from ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                          {from || "Matara"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* TO */}
                  <div className="flex items-center gap-4 pt-4">
                    <FaBus className="shrink-0" style={{ color: PALETTE.textLight }} />
                    <div className="w-full">
                      <label className="block text-xs font-medium text-gray-500">To</label>

                      {/* Tap-to-open full page picker */}
                      <button
                        type="button"
                        onClick={() => openMobilePicker("to")}
                        className="w-full text-left py-2"
                      >
                        <span className={`text-lg ${to ? "font-semibold text-gray-900" : "text-gray-400"}`}>
                          {to || "Colombo"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SWAP BUTTON */}
                <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-10">
                  <motion.button
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={swapLocations}
                    className="bg-white p-3 rounded-full shadow-md transition-all duration-200"
                    style={{ border: `1px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                  >
                    {/* Vertical only on mobile */}
                    <FaExchangeAlt className="text-lg rotate-90" style={{ color: PALETTE.textLight }} />
                  </motion.button>
                </div>
              </div>

              {/* DATE (Mobile) */}
              <div className="flex items-center gap-4 p-4 border-t relative" style={{ borderColor: PALETTE.borderLight }}>
                <FaCalendarAlt className="shrink-0" style={{ color: PALETTE.textLight }} />
                <div ref={mobileDateAnchorRef} onClick={() => setCalOpen(true)} className="flex-grow cursor-pointer">
                  <label className="block text-xs font-medium text-gray-500">Date of Journey</label>
                  <span className="text-lg font-semibold" style={{ color: PALETTE.textDark }}>
                    {getReadableDate(date)}
                  </span>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(todayStr);
                    }}
                    className={`text-sm font-semibold hover:text-red-500 ${
                      date === todayStr ? "text-red-500" : "text-gray-600"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(tomorrowStr);
                    }}
                    className={`text-sm font-semibold hover:text-red-500 ${
                      date === tomorrowStr ? "text-red-500" : "text-gray-600"
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>

                {/* Desktop popover is NOT used on mobile anymore.
                   Use bottom-sheet calendar below. */}
              </div>

              {/* SEARCH BUTTON */}
              <div className="p-4 border-t" style={{ borderColor: PALETTE.borderLight }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="font-heading w-full flex items-center justify-center gap-2 text-white font-bold tracking-wider py-4 rounded-xl shadow-lg transition-all"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  SEARCH BUSES
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Offers / Notices ===== */}
      <NoticesSection />

      {/* ===== What's New ===== */}
      <WhatsNewSection />

      {/* ===== Popular Routes ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className={`${SECTION_INNER} py-16`}>
          <h2
            className="font-heading text-3xl font-bold mb-8 text-center lg:text-left"
            style={{ color: PALETTE.textDark }}
          >
            Popular Routes
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {["Colombo → Kandy", "Galle → Colombo", "Matara → Colombo"].map((route, i) => {
              const [routeFrom, routeTo] = route.split(" → ");
              return (
                <motion.div
                  whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  key={i}
                  onClick={() => {
                    const currentDateForRoute = toLocalYYYYMMDD(new Date());
                    navigate(
                      `/search-results?from=${routeFrom.trim()}&to=${routeTo.trim()}&date=${currentDateForRoute}`
                    );
                  }}
                  className="group relative bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 p-6 flex flex-col"
                >
                  <div className="flex-grow">
                    <p className="text-sm font-medium uppercase tracking-wider" style={{ color: PALETTE.textLight }}>
                      Route
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-heading text-xl font-bold" style={{ color: PALETTE.textDark }}>
                        {routeFrom.trim()}
                      </span>
                      <FaLongArrowAltRight style={{ color: PALETTE.primaryRed }} />
                      <span className="font-heading text-xl font-bold" style={{ color: PALETTE.textDark }}>
                        {routeTo.trim()}
                      </span>
                    </div>
                  </div>
                  <div className="mt-8 flex items-center justify-between">
                    <span className="font-sans font-semibold" style={{ color: PALETTE.accentBlue }}>
                      View Available Buses
                    </span>
                    <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: PALETTE.accentBlue }} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ===== Guide / How to Book ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className={`${SECTION_INNER} py-16`}>
          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-gray-100">
            <h2 className="font-heading text-3xl font-bold mb-4" style={{ color: PALETTE.textDark }}>
              Online Bus Ticket Booking on Routesbook
            </h2>

            <p className="mb-4 text-base leading-relaxed" style={{ color: PALETTE.textLight }}>
              Routesbook is your new and reliable companion for booking bus tickets online. Designed for simplicity and
              convenience, Routesbook offers a smooth and secure booking experience across a growing network of trusted
              bus operators. Whether you're traveling across cities or planning a local trip, Routesbook provides a wide
              range of affordable travel options and modern features for every passenger.
            </p>

            <p className="mb-8 text-base leading-relaxed" style={{ color: PALETTE.textLight }}>
              Partnering with emerging private bus operators and transport services, Routesbook ensures comfortable
              journeys with a variety of bus types like AC, Non-AC, Sleeper, Seater, Semi-Sleeper, and Luxury coaches.
              As a newly launched platform, we’re committed to providing transparent pricing, secure payment methods, and
              exceptional customer service.
            </p>

            <h3 className="font-heading text-2xl font-bold mb-6" style={{ color: PALETTE.textDark }}>
              How to Book Bus Tickets on Routesbook?
            </h3>

            <p className="mb-8 text-base" style={{ color: PALETTE.textLight }}>
              Booking your journey on Routesbook is simple and user-friendly. Just follow these quick steps:
            </p>

            <ul className="space-y-5">
              {[
                {
                  t: "Enter Travel Details:",
                  d: "Select your departure city, destination, and travel date to view available bus services.",
                },
                {
                  t: "Search Buses:",
                  d: "Filter results by bus type, fare, timing, boarding & dropping points, seat availability, and onboard amenities.",
                },
                {
                  t: "Choose Your Seat:",
                  d: "Pick your preferred seat and boarding/dropping points. Review the fare and proceed to book.",
                },
                { t: "Enter Passenger Information:", d: "Fill in passenger name, contact number, and any other required details." },
                { t: "Make Payment:", d: "Complete your booking securely using a range of payment options." },
                { t: "Get Ticket Confirmation:", d: "Receive your digital ticket via email and SMS instantly after payment." },
              ].map((step, idx) => (
                <li key={idx} className="flex items-start">
                  <FaArrowRight className="text-sm mr-4 mt-1.5 shrink-0" style={{ color: PALETTE.primaryRed }} />
                  <span style={{ color: PALETTE.textLight }}>
                    <strong className="font-semibold" style={{ color: PALETTE.textDark }}>
                      {step.t}
                    </strong>{" "}
                    {step.d}
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-8 mb-4 text-base leading-relaxed" style={{ color: PALETTE.textLight }}>
              With Routesbook, every ticket booked comes with the assurance of a secure transaction, access to verified
              operators, and a customer-first support team to assist you at every step.
            </p>
            <p className="text-base leading-relaxed font-medium" style={{ color: PALETTE.textLight }}>
              Start your journey the smart way with Routesbook — where your route, your seat, and your journey are just a
              few clicks away.
            </p>
          </div>
        </section>
      </div>

      <Footer />

      {/* === MOBILE FULL-PAGE PICKER MOUNT === */}
      <MobileCityPicker
        open={mobilePickerOpen}
        mode={mobilePickerMode}
        options={mobilePickerMode === "from" ? fromOptions : toOptions}
        recent={recent}
        onPick={handleMobilePick}
        onClose={() => setMobilePickerOpen(false)}
      />

      {/* === MOBILE BOTTOM-SHEET CALENDAR (drop-up) === */}
      <MobileCalendarSheet
        open={calOpen && isRefVisible(mobileDateAnchorRef)}
        value={date}
        minDateString={todayStr}
        onChange={setDate}
        onClose={() => setCalOpen(false)}
      />
    </div>
  );
};

export default Home;
