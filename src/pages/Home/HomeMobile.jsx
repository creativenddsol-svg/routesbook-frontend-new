// src/pages/Home/HomeMobile.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FaBus,
  FaCalendarAlt,
  FaExchangeAlt,
  FaSearch,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

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
   - Tweaked typography & colors to feel closer to Search Results UI
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
      : all.filter((c) =>
          c.toLowerCase().includes(q.trim().toLowerCase())
        );

  if (!open) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-[10000] bg-white flex flex-col">
      {/* Safe area for notch */}
      <div style={{ height: "env(safe-area-inset-top)" }} />

      {/* Header */}
      <div className="px-4 pb-3 pt-3 border-b flex items-center gap-3 border-gray-200">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-sm text-gray-700"
          aria-label="Back"
        >
          ←
        </button>
        <div
          className="text-sm font-semibold"
          style={{ color: PALETTE.textDark }}
        >
          {mode === "from" ? "Select From City" : "Select To City"}
        </div>
      </div>

      {/* Search bar */}
      <div className="px-4 py-3 border-b border-gray-200">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search city"
          className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none text-gray-900 placeholder:text-gray-400"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          style={{ WebkitTextSizeAdjust: "100%" }}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* ===== TOP: Matching Cities (when typing) ===== */}
        <div className="px-4 pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2">
            {q ? "Matching Cities" : "All Cities"}
          </div>

          <div className="divide-y rounded-xl border border-gray-100 overflow-hidden bg-white">
            {(q ? filtered : all).map((c) => (
              <button
                key={c}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-900 active:bg-gray-100"
                onClick={() => onPick(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Next: Recent Searches ===== */}
        <div className="px-4 pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2 flex items-center gap-2">
            <FaClock className="opacity-70 text-[13px] text-gray-500" />
            <span>Recent searches</span>
          </div>

          {(recent?.[mode] || []).length === 0 ? (
            <div className="text-sm text-gray-400">
              No recent searches
            </div>
          ) : (
            <div className="mb-3 divide-y rounded-xl border border-gray-100 overflow-hidden bg-white">
              {recent[mode].map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left active:bg-gray-100"
                  onClick={() => onPick(city)}
                >
                  <FaMapMarkerAlt className="text-gray-400 text-sm" />
                  <span className="text-sm font-medium text-gray-900">
                    {city}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ===== Finally: Popular Cities ===== */}
        <div className="px-4 pt-2 pb-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 mb-2">
            Popular Cities
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(
              new Set([
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
              ])
            ).map((c) => (
              <button
                key={c}
                className="px-3 py-1.5 rounded-full border border-gray-200 text-[11px] font-medium text-gray-700 bg-white active:bg-gray-50"
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
          <div className="bg-white border border-gray-200 rounded-2xl">
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
                      className="shrink-0 text-[17px]"
                      style={{ color: PALETTE.textLight }}
                    />
                    <div className="w-full">
                      <label
                        className="block text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: PALETTE.textLight }}
                      >
                        From
                      </label>
                      <button
                        type="button"
                        onClick={() => openMobilePicker("from")}
                        className="w-full text-left pt-1.5 pb-0.5"
                      >
                        <span
                          className={`text-sm leading-tight ${
                            from ? "font-semibold" : "font-normal"
                          }`}
                          style={{
                            color: from
                              ? PALETTE.textDark
                              : "#9CA3AF",
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
                      className="shrink-0 text-[17px]"
                      style={{ color: PALETTE.textLight }}
                    />
                    <div className="w-full">
                      <label
                        className="block text-[10px] font-semibold uppercase tracking-[0.14em]"
                        style={{ color: PALETTE.textLight }}
                      >
                        To
                      </label>
                      <button
                        type="button"
                        onClick={() => openMobilePicker("to")}
                        className="w-full text-left pt-1.5 pb-0.5"
                      >
                        <span
                          className={`text-sm leading-tight ${
                            to ? "font-semibold" : "font-normal"
                          }`}
                          style={{
                            color: to
                              ? PALETTE.textDark
                              : "#9CA3AF",
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
                    className="bg-white p-2.5 rounded-full shadow-md transition-all duration-200 border border-gray-200"
                    title="Swap locations"
                  >
                    <FaExchangeAlt
                      className="text-[14px] rotate-90 text-gray-500"
                    />
                  </motion.button>
                </div>
              </div>

              {/* DATE (Mobile) */}
              <div
                className="flex items-center gap-3 p-3 border-t"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <FaCalendarAlt
                  className="shrink-0 text-[17px]"
                  style={{ color: PALETTE.textLight }}
                />
                <div
                  ref={mobileDateAnchorRef}
                  onClick={() => setCalOpen(true)}
                  className="flex-grow cursor-pointer"
                >
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-[0.14em]"
                    style={{ color: PALETTE.textLight }}
                  >
                    Date of Journey
                  </label>
                  <span
                    className="text-sm font-semibold leading-tight"
                    style={{ color: PALETTE.textDark }}
                  >
                    {getReadableDate(date)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(todayStr);
                    }}
                    className="px-2.5 py-1 rounded-full border text-[11px] font-medium"
                    style={{
                      borderColor:
                        date === todayStr
                          ? PALETTE.primaryRed
                          : "#E5E7EB",
                      color:
                        date === todayStr
                          ? PALETTE.primaryRed
                          : "#4B5563",
                      backgroundColor:
                        date === todayStr ? "#FFF1F2" : "#F9FAFB",
                    }}
                  >
                    Today
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDate(tomorrowStr);
                    }}
                    className="px-2.5 py-1 rounded-full border text-[11px] font-medium"
                    style={{
                      borderColor:
                        date === tomorrowStr
                          ? PALETTE.primaryRed
                          : "#E5E7EB",
                      color:
                        date === tomorrowStr
                          ? PALETTE.primaryRed
                          : "#4B5563",
                      backgroundColor:
                        date === tomorrowStr ? "#FFF1F2" : "#F9FAFB",
                    }}
                  >
                    Tomorrow
                  </button>
                </div>
              </div>

              {/* SEARCH BUTTON */}
              <div
                className="p-3 border-t"
                style={{ borderColor: PALETTE.borderLight }}
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSearch}
                  className="font-heading w-full flex items-center justify-center gap-2 text-white font-semibold tracking-wide py-2.5 rounded-full shadow-sm text-sm"
                  style={{ backgroundColor: PALETTE.primaryRed }}
                >
                  <FaSearch className="text-[13px]" />
                  <span>Search Buses</span>
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
