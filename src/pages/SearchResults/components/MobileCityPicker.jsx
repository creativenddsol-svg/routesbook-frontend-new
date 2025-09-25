// src/pages/SearchResults/components/MobileCityPicker.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaSearch } from "react-icons/fa";

export default function MobileCityPicker({
  open,
  mode,
  options,
  recent,
  onPick,
  onClose,
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef(null);

  // Autofocus search input when sheet opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      setQ(""); // reset search when closing
    }
  }, [open]);

  // Filtering logic: matches both label and value
  const filtered =
    q.trim() === ""
      ? options
      : options.filter(
          (o) =>
            o.label.toLowerCase().includes(q.trim().toLowerCase()) ||
            o.value?.toLowerCase().includes(q.trim().toLowerCase())
        );

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[10050] bg-white flex flex-col">
      {/* Safe area top */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center gap-3 bg-white shadow-sm">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border flex items-center justify-center hover:bg-gray-100"
          aria-label="Back"
        >
          <FaChevronLeft className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "from" ? "Select Departure City" : "Select Destination City"}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === "from"
              ? "Choose where you’ll start your journey"
              : "Choose where you’ll end your journey"}
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50">
        <FaSearch className="text-gray-500" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          className="w-full bg-transparent text-base outline-none placeholder-gray-400"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          style={{ fontSize: 16, WebkitTextSizeAdjust: "100%" }}
        />
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {/* Recent */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Recent Searches
          </div>
          {(recent?.[mode] || []).length === 0 ? (
            <div className="text-sm text-gray-400">No recent searches</div>
          ) : (
            <div className="mb-4 bg-gray-50 rounded-xl border border-gray-100 divide-y">
              {recent[mode].map((city, idx) => (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  key={idx}
                  type="button"
                  className="w-full flex items-center px-4 py-3 text-left hover:bg-gray-100 active:bg-gray-200"
                  onClick={() => onPick(city)}
                >
                  <span className="text-base font-medium text-gray-800">
                    {city}
                  </span>
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* All / Matching */}
        <div className="px-4 pb-6">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>
          <div className="rounded-xl border border-gray-100 divide-y">
            <AnimatePresence>
              {filtered.length > 0 ? (
                filtered.map((o) => (
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    key={o.value}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 text-gray-800"
                    onClick={() => onPick(o.label)}
                  >
                    {o.label}
                  </motion.button>
                ))
              ) : (
                <div className="text-sm text-gray-400 px-4 py-6 text-center">
                  No results found
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Safe area bottom */}
      <div style={{ height: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
