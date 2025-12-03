// src/pages/SearchResults/components/FilterPanel.jsx
import React from "react";
import { FaSlidersH, FaTimes, FaSyncAlt } from "react-icons/fa";
import { useSearchCore, PALETTE, TIME_SLOTS } from "../_core";

export default function FilterPanel({ isMobile, sortBy, setSortBy }) {
  const {
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    sortedBuses,
    setIsFilterOpen,
  } = useSearchCore();

  const handleTimeSlotFilter = (slot) =>
    setFilters((prev) => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
    }));

  const headerText = isMobile ? "Filter & Sort" : "Filters";
  const resetText =
    activeFilterCount > 0 ? `Reset (${activeFilterCount})` : "Reset";

  return (
    <>
      {/* ✅ Mobile horizontal filter bar */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-2 border-b bg-white">
          {/* Filter & Sort button */}
          <button
            onClick={() => setIsFilterOpen(true)}
            className={`flex items-center gap-1 px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
              activeFilterCount > 0
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-gray-300 text-gray-700"
            }`}
          >
            <FaSlidersH /> Filter & Sort
            {activeFilterCount > 0 && (
              <span className="ml-1 text-xs text-blue-600">
                ({activeFilterCount})
              </span>
            )}
          </button>

          {/* Time slots as flat chips */}
          {Object.keys(TIME_SLOTS).map((slot) => (
            <button
              key={slot}
              onClick={() => handleTimeSlotFilter(slot)}
              className={`px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
                filters.timeSlots[slot]
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {slot}
            </button>
          ))}

          {/* Bus Type chips */}
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                type: prev.type === "AC" ? "" : "AC",
              }))
            }
            className={`px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
              filters.type === "AC"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-gray-300 text-gray-700"
            }`}
          >
            AC
          </button>
          <button
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                type: prev.type === "Non-AC" ? "" : "Non-AC",
              }))
            }
            className={`px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
              filters.type === "Non-AC"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Non-AC
          </button>
        </div>
      )}

      {/* ✅ Main Filter Panel (unchanged for desktop, fullscreen modal for mobile) */}
      <div className="p-6 space-y-8 lg:p-0">
        <div
          className="flex justify-between items-center border-b pb-4 lg:border-none lg:pb-0"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: PALETTE.textDark }}
          >
            <FaSlidersH
              className="lg:hidden"
              style={{ color: PALETTE.accentBlue }}
            />{" "}
            {headerText}
          </h3>

          {isMobile ? (
            <button
              onClick={() => setIsFilterOpen(false)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes />
            </button>
          ) : (
            <button
              onClick={resetFilters}
              className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 ${
                activeFilterCount > 0 ? "text-red-600 font-semibold" : ""
              }`}
              style={{
                color:
                  activeFilterCount > 0 ? PALETTE.primaryRed : PALETTE.textLight,
              }}
            >
              <FaSyncAlt /> {resetText}
            </button>
          )}
        </div>

        {/* Sort by */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Sort by
          </h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
            style={{
              borderColor: PALETTE.borderLight,
              color: PALETTE.textDark,
            }}
          >
            <option value="time-asc">Departure: Earliest</option>
            <option value="time-desc">Departure: Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </section>

        {/* Time slot filters (inside panel) */}
        <section>
          <h4 className="font-bold mb-4" style={{ color: PALETTE.textDark }}>
            Departure Time
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(TIME_SLOTS).map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSlotFilter(slot)}
                className={`px-2 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                  filters.timeSlots[slot]
                    ? "text-white border-blue-500"
                    : "border-gray-200"
                }`}
                style={{
                  backgroundColor: filters.timeSlots[slot]
                    ? PALETTE.accentBlue
                    : PALETTE.white,
                  color: filters.timeSlots[slot]
                    ? PALETTE.white
                    : PALETTE.textDark,
                }}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        {/* Bus type select */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Bus Type
          </h4>
          <select
            value={filters.type}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, type: e.target.value }))
            }
            className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
            style={{
              borderColor: PALETTE.borderLight,
              color: PALETTE.textDark,
            }}
          >
            <option value="">All Types</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </section>

        {/* Max price slider */}
        <section>
          <h4 className="font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Max Price
          </h4>
          <input
            type="range"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer"
            style={{
              backgroundColor: PALETTE.borderLight,
              accentColor: PALETTE.primaryRed,
            }}
            min={500}
            max={5000}
            step={100}
            value={filters.maxPrice}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                maxPrice: Number(e.target.value),
              }))
            }
          />
          <div
            className="text-sm mt-2 text-center font-medium"
            style={{ color: PALETTE.textLight }}
          >
            Up to{" "}
            <span className="font-bold" style={{ color: PALETTE.primaryRed }}>
              Rs. {filters.maxPrice}
            </span>
          </div>
        </section>

        {/* Bottom actions (mobile only) */}
        {isMobile && (
          <div
            className="pt-4 border-t"
            style={{ borderColor: PALETTE.borderLight }}
          >
            <button
              onClick={() => setIsFilterOpen(false)}
              className="w-full py-3 font-bold text-white rounded-lg"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Show {sortedBuses.length} Buses
            </button>
            <button
              onClick={() => {
                resetFilters();
                setIsFilterOpen(false);
              }}
              className="w-full mt-2 py-2 font-bold rounded-lg"
              style={{ color: PALETTE.textLight }}
            >
              {resetText}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
