import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createSearchParams } from "react-router-dom";
import { FaBus, FaCalendarAlt, FaExchangeAlt, FaSearch } from "react-icons/fa";

import {
  useSearchCore,
  toLocalYYYYMMDD,
  getReadableDate,
  PALETTE,
} from "../_core";

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

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileSearchOpen]);

  if (!mobileSearchOpen) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[10030]" onClick={close} />

      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[10031]"
      >
        {/* Sheet container */}
        <div className="bg-white rounded-b-xl shadow-lg border border-gray-200 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-4 py-2.5 border-b flex items-center justify-between">
            <div className="text-sm font-semibold">Search your Buses</div>
            <button
              onClick={close}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
            >
              ×
            </button>
          </div>

          {/* Scrollable content (From / To / Date) */}
          <div className="flex-1 overflow-y-auto">
            {/* FROM & TO */}
            <div className="relative bg-white">
              {/* FROM */}
              <div
                className="px-3 py-2.5 border-b"
                style={{ borderColor: PALETTE.border }}
              >
                <div className="flex items-center gap-3">
                  <FaBus
                    className="shrink-0 text-sm"
                    style={{ color: PALETTE.textSubtle }}
                  />
                  <div className="w-full">
                    <label className="block text-[10px] font-medium text-gray-500">
                      From
                    </label>
                    <button
                      type="button"
                      onClick={() => openMobilePicker("from")}
                      className="w-full text-left py-1"
                    >
                      <span
                        className={`text-[15px] ${
                          searchFrom
                            ? "font-semibold text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {searchFrom || "Select departure"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SWAP */}
              <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-20">
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 180 }}
                  onClick={swapLocations}
                  className="bg-white p-2 rounded-full shadow-md"
                  style={{ border: `1px solid ${PALETTE.border}` }}
                  title="Swap locations"
                >
                  <FaExchangeAlt
                    className="text-sm rotate-90"
                    style={{ color: PALETTE.textSubtle }}
                  />
                </motion.button>
              </div>

              {/* TO */}
              <div
                className="px-3 py-2.5 border-b"
                style={{ borderColor: PALETTE.border }}
              >
                <div className="flex items-center gap-3">
                  <FaBus
                    className="shrink-0 text-sm"
                    style={{ color: PALETTE.textSubtle }}
                  />
                  <div className="w-full">
                    <label className="block text-[10px] font-medium text-gray-500">
                      To
                    </label>
                    <button
                      type="button"
                      onClick={() => openMobilePicker("to")}
                      className="w-full text-left py-1"
                    >
                      <span
                        className={`text-[15px] ${
                          searchTo
                            ? "font-semibold text-gray-900"
                            : "text-gray-400"
                        }`}
                      >
                        {searchTo || "Select destination"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* DATE */}
            <div
              className="flex items-center gap-3 px-3 py-2.5 border-b"
              style={{ borderColor: PALETTE.border }}
            >
              <FaCalendarAlt
                className="shrink-0 text-sm"
                style={{ color: PALETTE.textSubtle }}
              />

              <div className="flex-grow" onClick={() => setCalOpen(true)}>
                <label className="block text-[10px] font-medium text-gray-500">
                  Date of Journey
                </label>
                <span className="text-[15px] font-semibold text-gray-900">
                  {getReadableDate(searchDate)}
                </span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchDate(todayStrLocal);
                  }}
                  className={`text-[11px] font-semibold ${
                    searchDate === todayStrLocal
                      ? "text-red-500"
                      : "text-gray-600"
                  }`}
                >
                  Today
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchDate(tomorrowStrLocal);
                  }}
                  className={`text-[11px] font-semibold ${
                    searchDate === tomorrowStrLocal
                      ? "text-red-500"
                      : "text-gray-600"
                  }`}
                >
                  Tomorrow
                </button>
              </div>
            </div>
          </div>

          {/* Fixed footer: Search button */}
          <div className="p-3 border-t" style={{ borderColor: PALETTE.border }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={doSearch}
              className="w-full py-3 rounded-full text-white font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: PALETTE.primary }}
            >
              <FaSearch />
              Search Buses
            </motion.button>
          </div>

          {/* Safe area */}
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </div>
      </motion.div>
    </>,
    document.body
  );
}
