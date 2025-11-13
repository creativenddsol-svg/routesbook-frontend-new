// src/pages/Home/HomeMobile.jsx
import React from "react";
import { motion } from "framer-motion";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch } from "react-icons/fa";

import {
  PALETTE,
  SECTION_WRAP,
  SECTION_INNER,
  getReadableDate,
  MobileCityPicker,
  MobileCalendarSheet,
} from "./_core";

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
          {/* ==== MOBILE HEADER (brand on the right) ==== */}
          <div className="flex items-center justify-between pb-2 px-4 pt-4">
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

      {/* === MOBILE FULL-PAGE PICKER MOUNT === */}
      <MobileCityPicker
        open={mobilePickerOpen}
        mode={mobilePickerMode}
        options={mobilePickerMode === "from" ? fromOptions : toOptions}
        recent={recent}
        onPick={handleMobilePick}
        onClose={() => (typeof setCalOpen === "function" ? setCalOpen(false) : null) || null}
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
