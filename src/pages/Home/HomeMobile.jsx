// src/pages/Home/HomeMobile.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch, FaMapMarkerAlt, FaClock } from "react-icons/fa";

import {
  PALETTE,
  SECTION_WRAP,
  SECTION_INNER,
  getReadableDate,
  // MobileCityPicker,  // ⬅️ we’ll use a local “Plus” version below to avoid touching _core.jsx
  MobileCalendarSheet,
} from "./_core";

/* ------------------------------------------------------------------
   Local MobileCityPickerPlus
   - Same props/signature as the original MobileCityPicker
   - Shows Matching Cities under the search bar when typing,
     then Recent Searches, then Popular Cities
   - Neutral active highlight to match original feel
------------------------------------------------------------------- */
const MobileCityPickerPlus = ({
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
          style={{ fontSize: 16, WebkitTextSizeAdjust: "100%" }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== TOP: Matching Cities (when typing) ===== */}
        <div className="px-4 pt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>

          <div className="divide-y rounded-xl border border-gray-100 overflow-hidden">
            {(q ? filtered : all).map((c) => (
              <button
                key={c}
                className="w-full text-left px-3 py-3 active:bg-gray-100"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Next: Recent Searches ===== */}
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
                  className="w-full flex items-center gap-3 px-3 py-3 text-left active:bg-gray-100"
                  onClick={() => onPick(city)}
                >
                  <FaMapMarkerAlt className="text-gray-500" />
                  <span className="text-base font-medium text-gray-800">{city}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== Finally: Popular Cities ===== */}
        <div className="px-4 pt-2 pb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Popular Cities
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set(
                ["Colombo","Kandy","Galle","Matara","Jaffna","Negombo","Kurunegala","Gampaha","Badulla","Anuradhapura"]
              )
            ).map((c) => (
              <button
                key={c}
                className="px-3 py-1.5 rounded-full border text-sm active:bg-gray-100"
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

/**
 * Props expected (all from useHomeCore):
 * {
 *   from, setFrom, to, setTo, date, setDate,
 *   todayStr, tomorrowStr,
 *   mobileDateAnchorRef,
 *   calOpen, setCalOpen,
 *   mobilePickerOpen, mobilePickerMode,
 *   recent, fromOptions, toOptions,
 *   openMobilePicker, handleMobilePick,
 *   handleSearch, swapLocations
 * }
 */
const HomeMobile = ({
  from,
  setFrom,
  to,
  setTo,
  date,
  setDate,
  todayStr,
  tomorrowStr,
  mobileDateAnchorRef,
  calOpen,
  setCalOpen,
  mobilePickerOpen,
  mobilePickerMode,
  recent,
  fromOptions,
  toOptions,
  openMobilePicker,
  handleMobilePick,
  handleSearch,
  swapLocations,
}) => {
  return (
    <div className="lg:hidden">
      {/* ===== Search Widget (Mobile) ===== */}
      <div className={`${SECTION_WRAP}`}>
        <div className={`${SECTION_INNER} relative z-20 mt-4`}>
          <div className="bg-white border border-gray-300 rounded-xl">
            {/* ----- MOBILE VIEW (COMPACT) ----- */}
            <div>
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
                          className={`text-base ${from ? "font-semibold" : ""}`}
                          style={{
                            color: from ? PALETTE.textDark : "#9CA3AF",
                          }}
                        >
                          {from || "Select departure"}
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
                          className={`text-base ${to ? "font-semibold" : ""}`}
                          style={{
                            color: to ? PALETTE.textDark : "#9CA3AF",
                          }}
                        >
                          {to || "Select destination"}
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
                    className="text-xs font-semibold"
                    style={{
                      color:
                        date === todayStr ? PALETTE.primaryRed : PALETTE.accentBlue,
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(tomorrowStr);
                    }}
                    className="text-xs font-semibold"
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

              {/* SEARCH BUTTON */}
              <div className="p-3 border-t" style={{ borderColor: PALETTE.borderLight }}>
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
          </div>
        </div>
      </div>

      {/* === MOBILE FULL-PAGE PICKER === */}
      <MobileCityPickerPlus
        open={mobilePickerOpen}
        mode={mobilePickerMode}
        options={mobilePickerMode === "from" ? fromOptions : toOptions}
        recent={recent}
        onPick={handleMobilePick}
        onClose={() => openMobilePicker(null)} // ✅ correctly close the picker
      />

      {/* === MOBILE BOTTOM-SHEET CALENDAR === */}
      <MobileCalendarSheet
        open={calOpen}
        value={date}
        minDateString={todayStr}
        onChange={setDate}
        onClose={() => setCalOpen(false)}
      />
    </div>
  );
};

export default HomeMobile;
