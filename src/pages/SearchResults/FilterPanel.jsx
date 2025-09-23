import React from "react";
import { FaSlidersH, FaSyncAlt, FaTimes } from "react-icons/fa";

/**
 * Props:
 * - isMobile (bool)              // controls header + footer buttons
 * - sortBy, setSortBy            // "time-asc" | "time-desc" | "price-asc" | "price-desc"
 * - filters, setFilters          // { type: string, maxPrice: number, timeSlots: Record<string,bool> }
 * - activeFilterCount (number)   // used for reset label and badge on mobile
 * - TIME_SLOTS (object)          // { Morning:[4,12], Afternoon:[12,17], Evening:[17,21], Night:[21,24] }
 * - resetFilters (fn)            // resets filters to defaults
 * - PALETTE (object)             // color tokens
 * - sortedCount (number)         // number of results after filters
 * - onClose? (fn)                // mobile drawer close
 */
export default function FilterPanel({
  isMobile,
  sortBy,
  setSortBy,
  filters,
  setFilters,
  activeFilterCount,
  TIME_SLOTS,
  resetFilters,
  PALETTE,
  sortedCount,
  onClose,
}) {
  const handleTimeSlotFilter = (slot) =>
    setFilters((prev) => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
    }));

  const headerText = isMobile ? "Filter & Sort" : "Filters";
  const resetText =
    activeFilterCount > 0 ? `Reset (${activeFilterCount})` : "Reset";

  return (
    <div className={isMobile ? "p-6 space-y-8" : "space-y-8"}>
      {/* Header */}
      <div
        className={`flex justify-between items-center ${
          isMobile ? "border-b pb-4" : ""
        }`}
        style={{ borderColor: PALETTE.borderLight }}
      >
        <h3
          className="text-xl font-bold flex items-center gap-3"
          style={{ color: PALETTE.textDark }}
        >
          {isMobile && (
            <FaSlidersH className="lg:hidden" style={{ color: PALETTE.accentBlue }} />
          )}
          {headerText}
        </h3>

        {isMobile ? (
          <button
            onClick={onClose || (() => {})}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label="Close filters"
            type="button"
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
            type="button"
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
          style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
        >
          <option value="time-asc">Departure: Earliest</option>
          <option value="time-desc">Departure: Latest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </section>

      {/* Departure Time */}
      <section>
        <h4 className="font-bold mb-4" style={{ color: PALETTE.textDark }}>
          Departure Time
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(TIME_SLOTS).map((slot) => {
            const active = !!filters.timeSlots[slot];
            return (
              <button
                key={slot}
                onClick={() => handleTimeSlotFilter(slot)}
                className={`px-2 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                  active ? "text-white border-blue-500" : "border-gray-200"
                }`}
                style={{
                  backgroundColor: active ? PALETTE.accentBlue : PALETTE.white,
                  color: active ? PALETTE.white : PALETTE.textDark,
                }}
                type="button"
              >
                {slot}
              </button>
            );
          })}
        </div>
      </section>

      {/* Bus Type */}
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
          style={{ borderColor: PALETTE.borderLight, color: PALETTE.textDark }}
        >
          <option value="">All Types</option>
          <option value="AC">AC</option>
          <option value="Non-AC">Non-AC</option>
        </select>
      </section>

      {/* Max Price */}
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
            setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))
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

      {/* Mobile footer actions */}
      {isMobile && (
        <div className="pt-4 border-t" style={{ borderColor: PALETTE.borderLight }}>
          <button
            onClick={onClose || (() => {})}
            className="w-full py-3 font-bold text-white rounded-lg"
            style={{ backgroundColor: PALETTE.primaryRed }}
            type="button"
          >
            Show {sortedCount} Buses
          </button>
          <button
            onClick={() => {
              resetFilters();
              (onClose || (() => {}))();
            }}
            className="w-full mt-2 py-2 font-bold rounded-lg"
            style={{ color: PALETTE.textLight }}
            type="button"
          >
            {resetText}
          </button>
        </div>
      )}
    </div>
  );
}
