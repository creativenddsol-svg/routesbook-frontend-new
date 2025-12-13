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

import { FaClock, FaMapMarkerAlt, FaUserCircle } from "react-icons/fa";

import Footer from "../components/Footer";

import { useState, useEffect, useRef } from "react";

import { createPortal } from "react-dom"; // portal for calendar

import NoticesSection from "../components/NoticesSection";
import WhatsNewSection from "../components/WhatsNewSection";
import HolidaysSection from "../components/HolidaysSection";

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
    if (dayNum < 1 || dayNum > endOfMonth(viewMonth).getDate()) return null;
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
      <div
        className="px-4 pt-4 pb-2 border-b"
        style={{ borderColor: PALETTE.borderLight }}
      >
        <div
          className="text-xs uppercase font-medium tracking-wider"
          style={{ color: PALETTE.textLight }}
        >
          Date of Journey
        </div>

        <div className="flex items-center justify-between mt-1">
          <div
            className="text-base font-semibold"
            style={{ color: PALETTE.textDark }}
          >
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

        <div
          className="mt-1 text-sm font-medium"
          style={{ color: PALETTE.textDark }}
        >
          {viewMonth.toLocaleString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      <div
        className="grid grid-cols-7 text-center text-xs py-2"
        style={{ color: PALETTE.textLight }}
      >
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

      <div
        className="px-4 py-3 border-t flex items-center justify-between"
        style={{ borderColor: PALETTE.borderLight }}
      >
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
          style={{
            borderColor: PALETTE.borderLight,
            color: PALETTE.textLight,
          }}
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
          {viewMonth.toLocaleString("en-GB", {
            month: "long",
            year: "numeric",
          })}
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
                onClose?.()
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
        {
          value: city,
          label: city,
        },
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
        {/* ===== 1) Suggested cities (typeahead results) FIRST ===== */}
        <div className="px-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Suggested Cities
          </div>
        </div>
        <components.MenuList {...props}>{props.children}</components.MenuList>

        {/* ===== 2) Recent searches ===== */}
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
                  <span className="text-sm font-medium text-gray-800">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== 3) Popular cities LAST ===== */}
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

/* ---------------- Mobile full-page city picker ---------------- */
/* ---------------- Mobile full-page city picker (improved) ---------------- */
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
      : all.filter((c) =>
          c.toLowerCase().includes(q.trim().toLowerCase())
        );

  const contentRef = useRef(null);
  const inputRef = useRef(null);

  // autofocus when opened
  useEffect(() => {
    if (open && inputRef.current) {
      // small timeout so keyboard opens reliably on mobile
      setTimeout(() => inputRef.current.focus(), 50);
    } else {
      setQ("");
    }
  }, [open]);

  // scroll to top when query changes so matches are visible
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [q]);

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
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          className="w-full rounded-xl border px-4 py-3 text-base outline-none"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          style={{ fontSize: 16, WebkitTextSizeAdjust: "100%" }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>

      {/* Content scroll (put Matching/All first) */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {/* Matching / All cities (top) */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>

          {filtered.length === 0 ? (
            <div className="text-sm text-gray-400 px-4 pb-4">No matching cities</div>
          ) : (
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
          )}
        </div>

        {/* Recent searches (moved below) */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-2">
            <FaClock className="opacity-70" />
            Recent searches
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

        {/* Popular Cities (below) */}
        <div className="px-4 pt-2 pb-6">
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

/* ---- helper to ensure/patch meta tags ---- */
const setOrCreateMeta = (name, content, attrs = {}) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
};

const IOS_BAR_COLOR = "#ffffff"; // change if you want the status area to be another color

const Home = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(toLocalYYYYMMDD(new Date()));
  const [allBuses, setAllBuses] = useState([]);

  const navigate = useNavigate();

  // ✅ iPhone full-display + notch + colored status bar (like redBus)
  useEffect(() => {
    const isIOS =
      /iP(hone|od|ad)/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    try {
      // 1) viewport-fit=cover so content extends into the notch area
      let viewport = document.querySelector('meta[name="viewport"]');
      if (!viewport) {
        viewport = document.createElement("meta");
        viewport.name = "viewport";
        document.head.appendChild(viewport);
      }
      if (!/viewport-fit=cover/.test(viewport.content || "")) {
        viewport.content =
          (viewport.content ? viewport.content + ", " : "") +
          "viewport-fit=cover";
      }

      // 2) color the iOS status bar area (Safari uses theme-color)
      setOrCreateMeta("theme-color", IOS_BAR_COLOR);
      setOrCreateMeta("theme-color", IOS_BAR_COLOR, {
        media: "(prefers-color-scheme: light)",
      });
      setOrCreateMeta("theme-color", IOS_BAR_COLOR, {
        media: "(prefers-color-scheme: dark)",
      });

      // 3) If user adds to Home Screen, prefer light status bar background
      setOrCreateMeta("apple-mobile-web-app-capable", "yes");
      setOrCreateMeta("apple-mobile-web-app-status-bar-style", "default");
    } catch {}

    if (isIOS) document.documentElement.style.webkitTextSizeAdjust = "100%";
  }, []);

  // calendar popover state
  const [calOpen, setCalOpen] = useState(false);
  const desktopDateAnchorRef = useRef(null);
  const mobileDateAnchorRef = useRef(null);

  // ✅ NEW: scroll-to-search ref + helper (used by CTA buttons)
  const searchCardRef = useRef(null);
  const scrollToSearch = () => {
    if (!searchCardRef.current) return;
    searchCardRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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
    navigate(
      `/search-results?from=${from}&to=${to}&date=${dateToSearch}`
    );
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
    valueContainer: (provided) => ({
      ...provided,
      padding: "0",
    }),
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
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
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
    <div
      className="min-h-screen min-h-[100svh] font-sans"
      style={{
        backgroundColor: PALETTE.bgLight,
        minHeight: "100dvh",
      }}
    >
      {/* Top safe-area */}
      <div
        className="lg:hidden"
        style={{
          height: "env(safe-area-inset-top)",
          backgroundColor: IOS_BAR_COLOR,
        }}
      />

      <Toaster position="top-right" />

      {/* ===== Hero Section (desktop only) ===== */}
      <div
        className="hidden lg:block w-screen relative left-1/2 ml-[-50vw] overflow-hidden pb-20 lg:pb-40"
        style={{
          backgroundImage: "url('/images/wer.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
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
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="font-heading text-4xl sm:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Sri Lanka No:1 Bus Ticket Booking Platform
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
        <div ref={searchCardRef} className={`${SECTION_INNER} relative z-20 mt-4 lg:-mt-32`}>
          {/* ==== MOBILE HEADER (brand on the right) ==== */}
          <div className="lg:hidden flex items-center justify-between pb-2 px-4 pt-4">
            <h2 className="text-xl font-bold" style={{ color: PALETTE.textDark }}>
              Get Your Bus Tickets
            </h2>
            <span
              className="text-lg font-extrabold tracking-tight"
              style={{
                color: PALETTE.primaryRed,
                fontFamily:
                  "'Mont', 'Montserrat', 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'",
              }}
            >
              Routesbook
            </span>
          </div>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white border border-gray-300 rounded-xl lg:rounded-2xl lg:shadow-2xl"
          >
            {/* ----- DESKTOP VIEW ----- */}
            <div className="hidden lg:flex rounded-2xl overflow-hidden">
              <div
                className="relative flex-1 p-6 flex items-center border-r"
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

              <div
                className="relative flex-1 p-6 flex items-center border-r"
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
                  <label
                    className="block text-xs font-medium uppercase tracking-wider"
                    style={{ color: PALETTE.textLight }}
                  >
                    Date of Journey
                  </label>
                  <div
                    ref={desktopDateAnchorRef}
                    onClick={() => setCalOpen(true)}
                    className="cursor-pointer"
                  >
                    <span
                      className="text-lg font-medium"
                      style={{ color: PALETTE.textDark }}
                    >
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
                        color:
                          date === todayStr
                            ? PALETTE.primaryRed
                            : PALETTE.accentBlue,
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
                        color:
                          date === tomorrowStr
                            ? PALETTE.primaryRed
                            : PALETTE.accentBlue,
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
                {/* ✅ FLAT RED PILL (desktop) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="font-heading w-full lg:w-auto flex items-center justify-center gap-2 text-white font-semibold tracking-wide px-6 py-3 rounded-full shadow-none"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch />
                  SEARCH BUSES
                </motion.button>
              </div>
            </div>

            {/* ----- MOBILE VIEW (COMPACT) ----- */}
            <div className="lg:hidden">
              <div className="relative">
                {/* FROM */}
                <div className="p-3">
                  <div
                    className="flex items-center gap-3 pb-3 border-b"
                    style={{ borderColor: PALETTE.borderLight }}
                  >
                    <FaBus
                      className="shrink-0 text-base"
                      style={{ color: PALETTE.textLight }}
                    />
                    <div className="w-full">
                      <label className="block text-[11px] font-medium text-gray-500">
                        From
                      </label>
                      <button
                        type="button"
                        onClick={() => openMobilePicker("from")}
                        className="w-full text-left py-1.5"
                      >
                        <span
                          className={`text-base ${
                            from ? "font-semibold text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {from || "Matara"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* TO */}
                  <div className="flex items-center gap-3 pt-3">
                    <FaBus
                      className="shrink-0 text-base"
                      style={{ color: PALETTE.textLight }}
                    />
                    <div className="w-full">
                      <label className="block text-[11px] font-medium text-gray-500">
                        To
                      </label>
                      <button
                        type="button"
                        onClick={() => openMobilePicker("to")}
                        className="w-full text-left py-1.5"
                      >
                        <span
                          className={`text-base ${
                            to ? "font-semibold text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {to || "Colombo"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* SWAP BUTTON */}
                              
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10">
                  <motion.button
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={swapLocations}
                    className="bg-white p-2.5 rounded-full shadow-md transition-all duration-200"
                    style={{ border: `1px solid ${PALETTE.borderLight}` }}
                    title="Swap locations"
                  >
                    <FaExchangeAlt
                      className="text-base rotate-90"
                      style={{ color: PALETTE.textLight }}
                    />
                  </motion.button>
                </div>

              </div>

              {/* DATE (Mobile) */}
              <div
                className="flex items-center gap-3 p-3 border-t relative"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaCalendarAlt
                  className="shrink-0 text-base"
                  style={{ color: PALETTE.textLight }}
                />
                <div
                  ref={mobileDateAnchorRef}
                  onClick={() => setCalOpen(true)}
                  className="flex-grow cursor-pointer"
                >
                  <label className="block text-[11px] font-medium text-gray-500">
                    Date of Journey
                  </label>
                  <span
                    className="text-base font-semibold"
                    style={{ color: PALETTE.textDark }}
                  >
                    {getReadableDate(date)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(todayStr);
                    }}
                    className={`text-xs font-semibold ${
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
                    className={`text-xs font-semibold ${
                      date === tomorrowStr ? "text-red-500" : "text-gray-600"
                    }`}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {/* SEARCH BUTTON */}
              <div className="p-3 border-t" style={{ borderColor: PALETTE.borderLight }}>
                {/* ✅ FLAT RED PILL (mobile) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="font-heading w-full flex items-center justify-center gap-2 text-white font-semibold tracking-wide py-3 rounded-full shadow-none"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch />
                  Search Buses
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ===== Upcoming Holidays ===== */}
      <div>
        <HolidaysSection />
      </div>

      {/* ===== Offers / Notices ===== */}
      <div className="-mt-8 sm:-mt-10 md:-mt-12 lg:-mt-16">
        <NoticesSection />
      </div>

      {/* ===== What's New ===== */}
      <WhatsNewSection />

      {/* ===== Popular Routes ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className={`${SECTION_INNER} py-16`}>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg border border-gray-100">
            <h2
              className="font-heading text-3xl font-bold mb-6"
              style={{ color: PALETTE.textDark }}
            >
              Popular Routes
            </h2>

            {/* Pastel cards, tighter colors, no bus icon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                "Colombo → Matara",
                "Galle → Colombo",
                "Matara → Colombo",
                "Jaffna → Colombo",
                "Colombo → Katharagama",
                "Badulla → Colombo",
              ].map((route, i) => {
                const [routeFrom, routeTo] = route.split(" → ");

                // tightened pastel palette
                const pastel = [
                  { bg: "bg-[#FFE8EA]", br: "border-[#F7C4C9]" }, // tighter red
                  { bg: "bg-[#EAF4FF]", br: "border-[#C7E2FF]" }, // tighter blue
                  { bg: "bg-[#EAFBF0]", br: "border-[#BFEFD0]" }, // tighter green
                  { bg: "bg-[#FFF1E5]", br: "border-[#F9D6B5]" }, // tighter orange
                  { bg: "bg-[#F3EDFF]", br: "border-[#DCCBFF]" }, // tighter purple
                  { bg: "bg-[#FFEAF4]", br: "border-[#F7C2DF]" }, // tighter pink
                ][i % 6];

                return (
                  <motion.button
                    key={i}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const currentDateForRoute = toLocalYYYYMMDD(new Date());
                      navigate(
                        `/search-results?from=${routeFrom.trim()}&to=${routeTo.trim()}&date=${currentDateForRoute}`
                      );
                    }}
                    className={`group w-full text-left rounded-xl border ${pastel.br} ${pastel.bg} p-4 sm:p-5 shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                          <span
                            className="font-heading text-base sm:text-lg font-semibold truncate"
                            style={{ color: PALETTE.textDark }}
                            title={routeFrom.trim()}
                          >
                            {routeFrom.trim()}
                          </span>
                          <FaLongArrowAltRight className="opacity-60 shrink-0" />
                          <span
                            className="font-heading text-base sm:text-lg font-semibold truncate"
                            style={{ color: PALETTE.textDark }}
                            title={routeTo.trim()}
                          >
                            {routeTo.trim()}
                          </span>
                        </div>
                        <div className="mt-2">
                          <span className="inline-flex items-center text-[11px] sm:text-xs font-medium px-2 py-1 rounded-full bg-white/70 border border-white/80">
                            Popular this week
                          </span>
                        </div>
                      </div>

                      <div className="ml-3 shrink-0 flex items-center gap-2 text-sm font-medium text-[#6B7280]">
                        <span className="hidden sm:inline">View buses</span>
                        <FaArrowRight className="transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ===== UPDATED: Premium policy-page style Info Section ===== */}
      <div className={`${SECTION_WRAP}`}>
        <section className="w-screen relative left-1/2 ml-[-50vw] overflow-hidden">
          <div
            className="py-16 md:py-20"
            style={{
              background:
                "linear-gradient(180deg, rgba(216,78,85,0.08) 0%, rgba(58,134,255,0.06) 40%, rgba(255,255,255,1) 100%)",
            }}
          >
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-10 left-10 w-44 h-44 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(216,78,85,0.18)" }}
            />
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-16 right-12 w-56 h-56 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(58,134,255,0.16)" }}
            />

            <div className={`${SECTION_INNER} relative`}>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <div className="text-sm text-gray-500">
                    Home <span className="mx-2">/</span> About Routesbook
                  </div>
                  <h2
                    className="font-heading text-3xl sm:text-4xl font-extrabold tracking-tight mt-2"
                    style={{ color: PALETTE.textDark }}
                  >
                    Why Routesbook.lk is trusted for bus travel
                  </h2>
                  <p className="mt-3 text-base sm:text-lg max-w-3xl text-gray-600">
                    A real-world booking flow built for Sri Lanka — live seat maps, verified operators,
                    secure payments, and instant e-tickets.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {[
                      "Live seat selection",
                      "Secure payments",
                      "Instant e-ticket",
                      "Boarding & drop points",
                    ].map((t) => (
                      <span
                        key={t}
                        className="text-xs sm:text-sm px-3 py-1.5 rounded-full border bg-white/80"
                        style={{ borderColor: PALETTE.borderLight, color: PALETTE.textLight }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={scrollToSearch}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold shadow-sm"
                    style={{ backgroundColor: PALETTE.primaryRed }}
                  >
                    <FaSearch />
                    Search buses now
                  </button>
                </div>
              </div>

              {/* Main cards */}
              <div className="mt-10 grid lg:grid-cols-2 gap-6 md:gap-8">
                {/* WHY CHOOSE */}
                <div
                  className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                  style={{ borderColor: PALETTE.borderLight }}
                >
                  <div
                    className="p-6 md:p-8 border-b"
                    style={{ borderColor: PALETTE.borderLight }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-semibold"
                      style={{ color: PALETTE.textDark }}
                    >
                      Why choose Routesbook.lk?
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-gray-600">
                      Built to feel like a modern travel platform — fast, clean, and reliable.
                    </p>
                  </div>

                  <div className="p-6 md:p-8 grid sm:grid-cols-2 gap-4">
                    {[
                      {
                        icon: FaChair,
                        title: "Real-time seat map",
                        desc: "Pick your exact seat before paying. No guessing.",
                      },
                      {
                        icon: FaBolt,
                        title: "Fast booking flow",
                        desc: "Search → select seats → pay → receive ticket instantly.",
                      },
                      {
                        icon: FaShieldAlt,
                        title: "Secure payments",
                        desc: "Payments via trusted gateway with safe checkout.",
                      },
                      {
                        icon: FaMobileAlt,
                        title: "Mobile-ready UI",
                        desc: "Works smoothly on phones — designed for touch.",
                      },
                      {
                        icon: FaMapMarkerAlt,
                        title: "Boarding & drop points",
                        desc: "Choose your nearest stop with clear pickup details.",
                      },
                      {
                        icon: FaUserCircle,
                        title: "My Bookings history",
                        desc: "View tickets anytime, download again, manage easily.",
                      },
                    ].map((f) => {
                      const Icon = f.icon;
                      return (
                        <div
                          key={f.title}
                          className="rounded-2xl border p-4 sm:p-5 bg-white hover:shadow-sm transition"
                          style={{ borderColor: "#F1F5F9" }}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border"
                              style={{
                                borderColor: PALETTE.borderLight,
                                backgroundColor: "#fff",
                              }}
                            >
                              <Icon style={{ color: PALETTE.primaryRed }} />
                            </span>
                            <div>
                              <div className="font-semibold text-gray-900">{f.title}</div>
                              <div className="mt-1 text-sm text-gray-600 leading-6">{f.desc}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="px-6 md:px-8 pb-6">
                    <div
                      className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700"
                      style={{ borderColor: "#EEF2F7" }}
                    >
                      <span className="font-semibold">Tip:</span> You can compare buses by time, price, operator,
                      and bus type in search results — then select seats with live availability.
                    </div>
                  </div>
                </div>

                {/* HOW TO BOOK */}
                <div
                  className="rounded-2xl border bg-white shadow-sm overflow-hidden"
                  style={{ borderColor: PALETTE.borderLight }}
                >
                  <div
                    className="p-6 md:p-8 border-b"
                    style={{ borderColor: PALETTE.borderLight }}
                  >
                    <h3
                      className="text-xl md:text-2xl font-semibold"
                      style={{ color: PALETTE.textDark }}
                    >
                      How to book on Routesbook
                    </h3>
                    <p className="mt-2 text-sm md:text-base text-gray-600">
                      A simple step-by-step flow that matches real-world bus platforms.
                    </p>
                  </div>

                  <div className="p-6 md:p-8 space-y-4">
                    {[
                      { title: "Search your route", desc: "Choose From, To, and travel date — then search buses." },
                      { title: "Compare buses", desc: "Use filters for time, price, type, and operator." },
                      { title: "Select seats", desc: "Pick available seats on the live seat layout." },
                      { title: "Choose pickup & drop", desc: "Select your boarding and dropping points." },
                      { title: "Enter passenger details", desc: "Add passenger info and confirm the summary." },
                      { title: "Pay securely", desc: "Complete the payment using a trusted gateway." },
                      { title: "Get e-ticket instantly", desc: "Ticket is available in My Bookings + QR/PNR." },
                    ].map((s, idx) => (
                      <div
                        key={s.title}
                        className="rounded-2xl border p-4 sm:p-5"
                        style={{ borderColor: "#F1F5F9" }}
                      >
                        <div className="flex gap-3">
                          <span className="mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-gray-100 text-gray-700 text-xs font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-gray-900">{s.title}</div>
                            <div className="mt-1 text-sm text-gray-600 leading-6">{s.desc}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={scrollToSearch}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-white font-semibold"
                        style={{ backgroundColor: PALETTE.primaryRed }}
                      >
                        <FaSearch />
                        Start booking
                      </button>

                      <button
                        onClick={() => navigate("/my-bookings")}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border font-semibold"
                        style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
                      >
                        <FaUserCircle />
                        View My Bookings
                      </button>
                    </div>

                    <div
                      className="rounded-xl border bg-gray-50 p-4 text-sm text-gray-700"
                      style={{ borderColor: "#EEF2F7" }}
                    >
                      <span className="font-semibold">Good to know:</span> If payment fails but money is deducted,
                      the gateway typically auto-refunds. You can also contact support with your payment reference.
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div
                className="mt-8 rounded-2xl border bg-white shadow-sm"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <div
                  className="p-6 md:p-8 border-b"
                  style={{ borderColor: PALETTE.borderLight }}
                >
                  <h3 className="text-lg md:text-xl font-semibold text-gray-900">FAQs</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Quick answers customers usually ask before booking.
                  </p>
                </div>

                <div className="p-6 md:p-8 space-y-3">
                  {[
                    {
                      q: "Do I need to print the ticket?",
                      a: "No. Your QR/PNR e-ticket on your phone is enough. You can also open it in My Bookings.",
                    },
                    {
                      q: "Can I cancel my booking?",
                      a: "Cancellations depend on the bus operator’s policy. Your refund rules are shown on the policy pages and (where applicable) before payment.",
                    },
                    {
                      q: "What if the bus operator cancels the trip?",
                      a: "If a trip is cancelled by the operator, the booking is eligible for refund according to the operator/Routesbook policy.",
                    },
                    {
                      q: "Is payment secure?",
                      a: "Yes. Payment is processed via a trusted payment gateway. We do not store your full card details.",
                    },
                  ].map((item) => (
                    <details
                      key={item.q}
                      className="group rounded-2xl border p-4 md:p-5"
                      style={{ borderColor: "#F1F5F9" }}
                    >
                      <summary className="flex cursor-pointer items-center justify-between text-sm md:text-base font-semibold text-gray-900">
                        {item.q}
                        <span className="ml-3 text-gray-400 group-open:rotate-90 transition">
                          <FaArrowRight />
                        </span>
                      </summary>
                      <p className="mt-3 text-sm md:text-[15px] leading-6 text-gray-700">{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Bottom safe-area */}
      <div
        className="lg:hidden"
        style={{
          height: "env(safe-area-inset-bottom)",
          backgroundColor: PALETTE.bgLight,
        }}
      />

      {/* === MOBILE FULL-PAGE PICKER MOUNT === */}
      <MobileCityPicker
        open={mobilePickerOpen}
        mode={mobilePickerMode}
        options={mobilePickerMode === "from" ? fromOptions : toOptions}
        recent={recent}
        onPick={handleMobilePick}
        onClose={() => setMobilePickerOpen(false)}
      />

      {/* === MOBILE BOTTOM-SHEET CALENDAR === */}
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
