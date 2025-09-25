// src/pages/SearchResults/components/MobileSearchSheet.jsx
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createSearchParams } from "react-router-dom";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch } from "react-icons/fa";

import { useSearchCore } from "../_core";

export default function MobileSearchSheet() {
  const {
    PALETTE,

    // search state
    searchFrom,
    setSearchFrom,
    searchTo,
    setSearchTo,
    searchDate,
    setSearchDate,

    // mobile sheet + pickers
    mobileSearchOpen,
    setMobileSearchOpen,
    openMobilePicker,
    setCalOpen,

    // nav + helpers
    navigate,
    location,
    setExpandedBusId,
    releaseAllSelectedSeats,
    swapLocations,
    getReadableDate,
    toLocalYYYYMMDD,
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
    await releaseAllSelectedSeats(true);
    navigate({
      pathname: location.pathname,
      search: `?${createSearchParams({
        from: searchFrom,
        to: searchTo,
        date: searchDate,
      })}`,
    });
    setExpandedBusId(null);
    close();
  };

  // 🔒 always run hook (don’t skip!)
  useEffect(() => {
    if (!mobileSearchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSearchOpen]);

  if (!mobileSearchOpen) return null; // ✅ early return AFTER hook

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/40 z-[10030]" onClick={close} />
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[10031] bg-white rounded-b-2xl shadow-xl"
      >
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="text-base font-semibold">Modify Search</div>
          <button
            onClick={close}
            className="w-9 h-9 rounded-full border flex items-center justify-center"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* 🔴 Search Pill */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between w-full rounded-full border px-4 py-2 shadow-sm bg-gray-50">
            <div
              className="flex flex-col text-left flex-grow"
              onClick={() => openMobilePicker("from")}
            >
              <span className="text-sm font-semibold text-gray-900 truncate">
                {searchFrom || "Select departure"}
              </span>
              <span className="text-xs text-gray-500">
                {searchDate ? getReadableDate(searchDate) : "Choose date"}
              </span>
            </div>
            <span className="mx-2 text-gray-400">→</span>
            <div
              className="flex flex-col text-right flex-grow"
              onClick={() => openMobilePicker("to")}
            >
              <span className="text-sm font-semibold text-gray-900 truncate">
                {searchTo || "Select destination"}
              </span>
              <span
                onClick={() => setCalOpen(true)}
                className="text-xs text-blue-600 underline cursor-pointer"
              >
                Change Date
              </span>
            </div>
          </div>
        </div>

        {/* FROM */}
        <div className="p-3">
          <div className="flex items-center gap-3 pb-3 border-b">
            <FaBus className="shrink-0 text-base text-gray-500" />
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
                    searchFrom ? "font-semibold text-gray-900" : "text-gray-400"
                  }`}
                >
                  {searchFrom || "Select departure"}
                </span>
              </button>
            </div>
          </div>

          {/* TO */}
          <div className="flex items-center gap-3 pt-3">
            <FaBus className="shrink-0 text-base text-gray-500" />
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
                    searchTo ? "font-semibold text-gray-900" : "text-gray-400"
                  }`}
                >
                  {searchTo || "Select destination"}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* SWAP */}
        <div className="absolute top-[92px] right-3 transform -translate-y-1/2 z-10">
          <motion.button
            whileTap={{ scale: 0.9, rotate: 180 }}
            onClick={swapLocations}
            className="bg-white p-2.5 rounded-full shadow-md transition-all duration-200 border border-gray-200"
            aria-label="Swap"
            title="Swap locations"
          >
            <FaExchangeAlt className="text-base rotate-90 text-gray-600" />
          </motion.button>
        </div>

        {/* DATE */}
        <div className="flex items-center gap-3 p-3 border-t">
          <FaCalendarAlt className="shrink-0 text-base text-gray-500" />
          <div className="flex-grow">
            <div className="text-[11px] font-medium text-gray-500">
              Date of Journey
            </div>
            <div className="flex items-center justify-between mt-1">
              <button
                type="button"
                onClick={() => setCalOpen(true)}
                className="text-left"
              >
                <span className="text-base font-semibold text-gray-900">
                  {getReadableDate(searchDate)}
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchDate(todayStrLocal)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                    searchDate === todayStrLocal
                      ? "text-white"
                      : "text-[#3A86FF]"
                  }`}
                  style={{
                    background:
                      searchDate === todayStrLocal ? "#3A86FF" : "white",
                    borderColor:
                      searchDate === todayStrLocal ? "#3A86FF" : "#E5E7EB",
                  }}
                >
                  Today
                </button>
                <button
                  onClick={() => setSearchDate(tomorrowStrLocal)}
                  className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                    searchDate === tomorrowStrLocal
                      ? "text-white"
                      : "text-[#3A86FF]"
                  }`}
                  style={{
                    background:
                      searchDate === tomorrowStrLocal ? "#3A86FF" : "white",
                    borderColor:
                      searchDate === tomorrowStrLocal ? "#3A86FF" : "#E5E7EB",
                  }}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="p-3 border-t">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={doSearch}
            className="w-full flex items-center justify-center gap-2 font-bold text-white rounded-xl px-4 py-3"
            style={{ backgroundColor: PALETTE.primaryRed }}
          >
            <FaSearch /> SEARCH
          </motion.button>
        </div>

        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </motion.div>
    </>,
    document.body
  );
}
