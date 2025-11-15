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

      {/* Top sheet wrapper (centers card + matches Home width) */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[10031] flex justify-center"
      >
        {/* Inner container: same horizontal padding as Home.jsx */}
        <div className="w-full max-w-[480px] px-4 pt-3">
          {/* Card: same style as Home mobile search widget */}
          <div
            className="bg-white border border-gray-300 rounded-xl shadow-md flex flex-col max-h-[85vh]"
            style={{ borderColor: PALETTE.border }}
          >
            {/* Header bar (search your buses + close) */}
            <div className="px-4 py-2.5 border-b flex items-center justify-between">
              <div className="text-sm font-semibold">Search your Buses</div>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full border flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Scrollable content: FROM / TO / DATE */}
            <div className="flex-1 overflow-y-auto">
              {/* FROM + TO block – copied from Home mobile card, but using searchFrom/searchTo */}
              <div className="relative">
                {/* FROM */}
                <div className="p-3">
                  <div
                    className="flex items-center gap-3 pb-3 border-b"
                    style={{ borderColor: PALETTE.border }}
                  >
                    <FaBus
                      className="shrink-0 text-base"
                      style={{ color: PALETTE.textSubtle }}
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

                  {/* TO */}
                  <div className="flex items-center gap-3 pt-3">
                    <FaBus
                      className="shrink-0 text-base"
                      style={{ color: PALETTE.textSubtle }}
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

                {/* SWAP button – same position as Home mobile */}
                <div className="absolute top-1/2 right-3 transform -translate-y-1/2 z-10">
                  <motion.button
                    whileTap={{ scale: 0.9, rotate: 180 }}
                    onClick={swapLocations}
                    className="bg-white p-2.5 rounded-full shadow-md transition-all duration-200"
                    style={{ border: `1px solid ${PALETTE.border}` }}
                    title="Swap locations"
                  >
                    <FaExchangeAlt
                      className="text-base rotate-90"
                      style={{ color: PALETTE.textSubtle }}
                    />
                  </motion.button>
                </div>
              </div>

              {/* DATE – same layout as Home mobile card */}
              <div
                className="flex items-center gap-3 p-3 border-t"
                style={{ borderColor: PALETTE.border }}
              >
                <FaCalendarAlt
                  className="shrink-0 text-base"
                  style={{ color: PALETTE.textSubtle }}
                />
                <div
                  onClick={() => setCalOpen(true)}
                  className="flex-grow cursor-pointer"
                >
                  <label className="block text-[11px] font-medium text-gray-500">
                    Date of Journey
                  </label>
                  <span
                    className="text-base font-semibold"
                    style={{ color: PALETTE.text }}
                  >
                    {getReadableDate(searchDate)}
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchDate(todayStrLocal);
                    }}
                    className={`text-xs font-semibold ${
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
                    className={`text-xs font-semibold ${
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

            {/* Fixed footer: Search button – same pill style as Home mobile */}
            <div
              className="p-3 border-t"
              style={{ borderColor: PALETTE.border }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={doSearch}
                className="font-heading w-full flex items-center justify-center gap-2 text-white font-semibold tracking-wide py-3 rounded-full shadow-none"
                style={{ backgroundColor: PALETTE.primary }}
              >
                <FaSearch />
                Search Buses
              </motion.button>
            </div>

            {/* safe-area bottom (for iOS) */}
            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </div>
        </div>
      </motion.div>
    </>,
    document.body
  );
}
