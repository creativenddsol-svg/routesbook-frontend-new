// src/pages/SearchResults/components/MobileCityPicker.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
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
  const all = options.map((o) => o.label);
  const filtered =
    q.trim() === ""
      ? all
      : all.filter((c) => c.toLowerCase().includes(q.trim().toLowerCase()));

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[10050] bg-white flex flex-col">
      {/* Safe area top */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header with pill style */}
      <div className="px-4 py-3 border-b flex items-center gap-3 bg-white">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border flex items-center justify-center"
          aria-label="Back"
        >
          <FaChevronLeft className="text-gray-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900">
            {mode === "from" ? "Select Departure City" : "Select Destination City"}
          </h2>
          <p className="text-xs text-gray-500">
            {mode === "from" ? "Choose where you’ll start your journey" : "Choose where you’ll end your journey"}
          </p>
        </div>
      </div>

      {/* Search input */}
      <div className="px-4 py-3 border-b flex items-center gap-2 bg-gray-50">
        <FaSearch className="text-gray-500" />
        <input
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
                  <span className="text-base font-medium text-gray-800">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* All / Matching */}
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
}
