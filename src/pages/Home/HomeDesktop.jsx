// src/pages/Home/HomeDesktop.jsx
import React from "react";
import Select from "react-select";
import { motion } from "framer-motion";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch } from "react-icons/fa";

import {
  PALETTE,
  SECTION_WRAP,
  SECTION_INNER,
  CalendarPopover,
  isRefVisible,
  getReadableDate,
  CustomMenu, // ✅ restore custom menu
} from "./_core";

/**
 * Props expected (all from useHomeCore):
 * {
 *   from, setFrom, to, setTo, date, setDate,
 *   fromOptions, toOptions, recent, selectStyles,
 *   todayStr, tomorrowStr,
 *   desktopDateAnchorRef, calOpen, setCalOpen,
 *   handleSearch, swapLocations
 * }
 */
const HomeDesktop = ({
  from,
  setFrom,
  to,
  setTo,
  date,
  setDate,
  fromOptions,
  toOptions,
  recent,
  selectStyles,
  todayStr,
  tomorrowStr,
  desktopDateAnchorRef,
  calOpen,
  setCalOpen,
  handleSearch,
  swapLocations,
}) => {
  return (
    <>
      {/* ===== Hero Section (desktop only) ===== */}
      <div
        className="hidden lg:block w-screen relative left-1/2 ml-[-50vw] overflow-hidden pb-20 lg:pb-40"
        style={{
          backgroundImage: "url('/images/wer.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent" />

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

      {/* ===== Desktop Search Widget ===== */}
      <div className={`${SECTION_WRAP}`}>
        <div className={`${SECTION_INNER} relative z-20 mt-4 lg:-mt-32`}>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="bg-white border border-gray-300 rounded-xl lg:rounded-2xl lg:shadow-2xl"
          >
            {/* ----- DESKTOP VIEW ----- */}
            <div className="hidden lg:flex rounded-2xl overflow-hidden">
              {/* FROM */}
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
                    onChange={(s) => setFrom(s?.value || "")}
                    placeholder="Select departure"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null,
                      Menu: CustomMenu("from"), // ✅ custom menu with Suggested/Recent/Popular
                    }}
                    recent={recent}
                    closeMenuOnSelect={true}
                  />
                </div>

                {/* Swap button */}
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

              {/* TO */}
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
                    onChange={(s) => setTo(s?.value || "")}
                    placeholder="Select destination"
                    isClearable
                    styles={selectStyles}
                    menuPortalTarget={document.body}
                    components={{
                      DropdownIndicator: () => null,
                      IndicatorSeparator: () => null,
                      Menu: CustomMenu("to"), // ✅ custom menu
                    }}
                    recent={recent}
                    closeMenuOnSelect={true}
                  />
                </div>
              </div>

              {/* DATE */}
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

              {/* SEARCH BUTTON */}
              <div className="p-4 flex items-center">
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
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default HomeDesktop;
