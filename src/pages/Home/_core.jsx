// src/pages/Home/_core.jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createPortal } from "react-dom";
import { components } from "react-select";
import {
  FaClock,
  FaMapMarkerAlt,
} from "react-icons/fa";

import apiClient from "../../api";

/* ---------------- Calendar helpers ---------------- */
export const toLocalYYYYMMDD = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const parseYMD = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
export const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
export const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
export const sameYMD = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/* ---------------- Theme ---------------- */
export const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#FFFFFF",
  borderLight: "#E0E0E0",
  white: "#FFFFFF",
};

export const SECTION_WRAP = "full-bleed";
export const SECTION_INNER =
  "w-full max-w-[1400px] 2xl:max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8";

/* ---------------- Utility: is a ref visible? ---------------- */
export const isRefVisible = (ref) => {
  const el = ref?.current;
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return !(style.display === "none" || rect.width === 0 || rect.height === 0);
};

/* -------- Redbus-like Calendar Popover (portal, single instance) -------- */
export const CalendarPopover = ({
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

/* --------- Mobile Bottom-Sheet Calendar --------- */
export const MobileCalendarSheet = ({
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
      <div
        className="lg:hidden fixed inset-0 z-[10000] bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="lg:hidden fixed inset-x-0 bottom-0 z-[10001] bg-white rounded-t-2xl shadow-2xl"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ height: "env(safe-area-inset-top)" }} />

        <div className="pt-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

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

        <div className="px-4 pt-2 text-sm font-medium">
          {viewMonth.toLocaleString("en-GB", {
            month: "long",
            year: "numeric",
          })}
        </div>

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

        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </motion.div>
    </>,
    document.body
  );
};

/* ---------------- Popular Cities for quick-pick ---------------- */
export const POPULAR_CITIES = [
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
export const CustomMenu = (menuKey) => {
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
        <div className="px-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Suggested Cities
          </div>
        </div>
        <components.MenuList {...props}>{props.children}</components.MenuList>

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
export const MobileCityPicker = ({
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

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[10000] bg-white flex flex-col">
      <div style={{ height: "env(safe-area-inset-top)" }} />

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

      <div className="px-4 py-3 border-b">
        <input
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

      <div className="flex-1 overflow-y-auto">
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

      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
};

/* ---------------- Data (unchanged) ---------------- */
export const whyChooseUsData = [
  { icon: null, title: "Real-Time Seats", desc: "Live seat availability for immediate booking." },
  { icon: null, title: "Instant Booking", desc: "Book your tickets in just a few clicks." },
  { icon: null, title: "Secure Payments", desc: "100% safe and secure online transactions." },
  { icon: null, title: "Mobile Ready", desc: "Book on any device, anywhere, anytime." },
];

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

/* ---- helper to ensure/patch meta tags ---- */
export const setOrCreateMeta = (name, content, attrs = {}) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
};

export const IOS_BAR_COLOR = "#ffffff";

/* ---------------- Home Core Hook ---------------- */
export const useHomeCore = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(toLocalYYYYMMDD(new Date()));
  const [allBuses, setAllBuses] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const isIOS =
      /iP(hone|od|ad)/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document);

    try {
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

      setOrCreateMeta("theme-color", IOS_BAR_COLOR);
      setOrCreateMeta("theme-color", IOS_BAR_COLOR, {
        media: "(prefers-color-scheme: light)",
      });
      setOrCreateMeta("theme-color", IOS_BAR_COLOR, {
        media: "(prefers-color-scheme: dark)",
      });

      setOrCreateMeta("apple-mobile-web-app-capable", "yes");
      setOrCreateMeta("apple-mobile-web-app-status-bar-style", "default");
    } catch {}

    if (isIOS) document.documentElement.style.webkitTextSizeAdjust = "100%";
  }, []);

  const [calOpen, setCalOpen] = useState(false);
  const desktopDateAnchorRef = useRef(null);
  const mobileDateAnchorRef = useRef(null);

  const [mobilePickerOpen, setMobilePickerOpen] = useState(false);
  const [mobilePickerMode, setMobilePickerMode] = useState("from"); // 'from' | 'to'

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

  const todayStr = useMemo(() => toLocalYYYYMMDD(new Date()), []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return toLocalYYYYMMDD(t);
  }, []);

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

  const fromOptions = useMemo(
    () =>
      [...new Set(allBuses.map((b) => b.from))].map((val) => ({
        value: val,
        label: val,
      })),
    [allBuses]
  );

  const toOptions = useMemo(
    () =>
      [...new Set(allBuses.map((b) => b.to))].map((val) => ({
        value: val,
        label: val,
      })),
    [allBuses]
  );

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

  return {
    // state
    from, setFrom,
    to, setTo,
    date, setDate,
    allBuses,
    calOpen, setCalOpen,
    mobilePickerOpen, mobilePickerMode,
    recent, pushRecent,

    // refs
    desktopDateAnchorRef,
    mobileDateAnchorRef,

    // derived
    fromOptions,
    toOptions,
    todayStr,
    tomorrowStr,
    selectStyles,

    // handlers
    handleSearch,
    swapLocations,
    openMobilePicker,
    handleMobilePick,

    // misc
    navigate,
  };
};
