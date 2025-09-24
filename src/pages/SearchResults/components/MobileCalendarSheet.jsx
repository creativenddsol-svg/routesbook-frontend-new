// src/pages/SearchResults/components/MobileCalendarSheet.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/* ---------------- Helpers (copied exactly from SearchResults) ---------------- */
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

/* ------ Mobile bottom-sheet calendar (split as-is) ------ */
const MobileCalendarSheet = ({ open, value, minDateString, onChange, onClose }) => {
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

  const start = startOfMonth(viewMonth),
    end = endOfMonth(viewMonth);
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

  return (
    <>
      <div
        className="lg:hidden fixed inset-0 z-[10040] bg-black/40"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "tween", duration: 0.25 }}
        className="lg:hidden fixed inset-x-0 bottom-0 z-[10041] bg-white rounded-t-2xl shadow-2xl"
        style={{ maxHeight: "80vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pt-2 flex justify-center">
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-gray-500">
              Date of Journey
            </div>
            <div className="text-base font-semibold">
              {getReadableDate(value)}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, -1))}
              className="w-9 h-9 rounded-full border flex items-center justify-center"
            >
              ←
            </button>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="w-9 h-9 rounded-full border flex items-center justify-center"
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
              <div key={d}>{d}</div>
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
              else if (selectedDay)
                classes += "text-white font-semibold bg-[#D84E55]";
              return (
                <button
                  key={idx}
                  onClick={() => pick(d)}
                  disabled={disabled}
                  className={classes}
                  style={{
                    border:
                      isToday && !selectedDay ? "1px solid #D84E55" : undefined,
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
    </>
  );
};

export default MobileCalendarSheet;
