// src/pages/SearchResults/components/MobileSearchSheet.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion"; // <-- Import AnimatePresence
import toast from "react-hot-toast";
import { createSearchParams } from "react-router-dom";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch, FaTimes } from "react-icons/fa"; // <-- Import FaTimes

import {
  useSearchCore,
  toLocalYYYYMMDD,
  getReadableDate,
  PALETTE,
} from "../_core";

const sheetVariants = {
  // Use a slide-down/up animation
  initial: { y: "-100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { type: "tween", duration: 0.3 } },
  exit: { y: "-100%", opacity: 0, transition: { type: "tween", duration: 0.2 } },
};

export default function MobileSearchSheet() {
  const {
    searchFrom,
    setSearchFrom,
    searchTo,
    setSearchTo,
    searchDate,
    setSearchDate,

    mobileSearchOpen,
    setMobileSearchOpen,
    openMobilePicker,
    setCalOpen,

    navigate,
    location,
    setExpandedBusId,
    releaseAllSelectedSeats,
    swapLocations,
  } = useSearchCore();

  const todayStrLocal = toLocalYYYYMMDD(new Date());
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowStrLocal = toLocalYYYYMMDD(tmr);

  const close = () => setMobileSearchOpen(false);

  const doSearch = async () => {
    if (!searchFrom || !searchTo || !searchDate) {
      toast.error("Please fill all fields before searching");
      return;
    }
    // Core logic remains unchanged
    await releaseAllSelectedSeats(true);
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({
        from: searchFrom,
        to: searchTo,
        to: searchTo,
        date: searchDate,
      })}`,
    });
    setExpandedBusId(null);
    close();
  };

  useEffect(() => {
    if (!mobileSearchOpen) return;
    // Keep the body overflow logic for stability
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSearchOpen]);

  // Use AnimatePresence around the portal content for exit animations
  return createPortal(
    <AnimatePresence>
      {mobileSearchOpen && (
        <>
          {/* Backdrop with a slightly darker color */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[10030]"
            onClick={close}
          />
          <motion.div
            variants={sheetVariants} // Apply slide animation variants
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed top-0 left-0 right-0 z-[10031] bg-white rounded-b-3xl shadow-2xl
                       overflow-hidden max-w-lg mx-auto" // Added max-width for better look on tablets/desktop
          >
            {/* Header */}
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <div className="text-xl font-bold text-gray-800">New Search</div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            {/* Location Inputs Group */}
            <div className="p-4 relative">
              <div className="bg-gray-50 rounded-xl shadow-inner border border-gray-200">
                {/* FROM */}
                <div className="p-3">
                  <LocationInput
                    label="Departure City"
                    value={searchFrom}
                    placeholder="Select departure city"
                    onClick={() => openMobilePicker("from")}
                  />
                </div>

                {/* Separator line */}
                <div className="h-px bg-gray-200 mx-4" />

                {/* TO */}
                <div className="p-3">
                  <LocationInput
                    label="Arrival City"
                    value={searchTo}
                    placeholder="Select destination city"
                    onClick={() => openMobilePicker("to")}
                  />
                </div>
              </div>

              {/* SWAP BUTTON - Centered and more prominent on the divider */}
              <motion.button
                whileTap={{ scale: 0.85, rotate: -360 }} // More engaging animation
                onClick={swapLocations}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20
                           bg-white p-3 rounded-full shadow-lg border-4 border-white text-red-500" // Vibrant, centered button
                aria-label="Swap"
                title="Swap locations"
              >
                <FaExchangeAlt className="text-lg rotate-90" />
              </motion.button>
            </div>

            {/* DATE Input */}
            <div className="p-4 pt-0">
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-200">
                <FaCalendarAlt className="shrink-0 text-xl text-red-500" />
                <div className="flex-grow">
                  <div className="text-xs font-medium text-gray-500">
                    Date of Journey
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <button
                      type="button"
                      onClick={() => setCalOpen(true)}
                      className="text-left py-0.5"
                    >
                      <span className="text-base font-bold text-gray-900">
                        {getReadableDate(searchDate)}
                      </span>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DateQuickSelect
                    label="Today"
                    date={todayStrLocal}
                    currentDate={searchDate}
                    setSearchDate={setSearchDate}
                  />
                  <DateQuickSelect
                    label="Tomorrow"
                    date={tomorrowStrLocal}
                    currentDate={searchDate}
                    setSearchDate={setSearchDate}
                  />
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="p-4 pt-0">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={doSearch}
                className="w-full flex items-center justify-center gap-2 text-lg font-bold text-white rounded-xl px-4 py-3 shadow-lg transition-transform"
                style={{ backgroundColor: PALETTE.primaryRed }}
              >
                <FaSearch /> Search Buses
              </motion.button>
            </div>

            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

// --- Helper Components for clean code ---

const LocationInput = ({ label, value, placeholder, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full text-left flex items-center gap-3"
  >
    <FaBus className="shrink-0 text-xl text-gray-600" />
    <div className="w-full">
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <span
        className={`text-lg transition-colors ${
          value ? "font-semibold text-gray-900" : "text-gray-400"
        }`}
      >
        {value || placeholder}
      </span>
    </div>
  </button>
);

const DateQuickSelect = ({ label, date, currentDate, setSearchDate }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={() => setSearchDate(date)}
    className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200
      ${
        currentDate === date
          ? "bg-red-500 text-white shadow-md"
          : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"
      }`}
  >
    {label}
  </motion.button>
);
