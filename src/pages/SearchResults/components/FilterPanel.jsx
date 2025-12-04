// FINAL FIXED VERSION – ONLY TWO CHANGES DONE:
// 1) REMOVED TOP CHIP BAR
// 2) FIXED BOTTOM BUTTON VISIBILITY (added overflow-hidden)

import React, { useState, useMemo } from "react";
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

  const [activeSection, setActiveSection] = useState("sort");

  const handleTimeSlotFilter = (slot) =>
    setFilters((prev) => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
    }));

  const headerText = isMobile ? "Sort and filter buses" : "Filters";
  const resetText =
    activeFilterCount > 0 ? `Reset (${activeFilterCount})` : "Reset";

  // Derive simple boarding / dropping lists from current buses (best-effort, safe)
  const boardingOptions = useMemo(() => {
    const set = new Set();
    (sortedBuses || []).forEach((bus) => {
      const raw =
        Array.isArray(bus?.boardingPoints) && bus.boardingPoints.length
          ? bus.boardingPoints
          : Array.isArray(bus?.boardingPointList)
          ? bus.boardingPointList
          : [];
      raw.forEach((p) => {
        const label =
          typeof p === "string" ? p : p?.name || p?.point || p?.label || "";
        if (label) set.add(label);
      });
    });
    return Array.from(set);
  }, [sortedBuses]);

  const droppingOptions = useMemo(() => {
    const set = new Set();
    (sortedBuses || []).forEach((bus) => {
      const raw =
        Array.isArray(bus?.droppingPoints) && bus.droppingPoints.length
          ? bus.droppingPoints
          : Array.isArray(bus?.droppingPointList)
          ? bus.droppingPointList
          : [];
      raw.forEach((p) => {
        const label =
          typeof p === "string" ? p : p?.name || p?.point || p?.label || "";
        if (label) set.add(label);
      });
    });
    return Array.from(set);
  }, [sortedBuses]);

  // Helpers to render radio-style rows (used in mobile panel)
  const RadioRow = ({ label, checked, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-sm mb-2 ${
        checked ? "border-[#D84E55] bg-[#FFF1F2]" : "border-gray-200 bg-white"
      }`}
    >
      <span className="text-gray-800 text-[14px] text-left">{label}</span>
      <span
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          checked ? "border-[#D84E55]" : "border-gray-300"
        }`}
      >
        {checked && (
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: PALETTE.primaryRed }}
          />
        )}
      </span>
    </button>
  );

  // ------------- DESKTOP VERSION (unchanged logic) -------------
  if (!isMobile) {
    return (
      <div className="p-6 space-y-8">
        {/* Header */}
        <div
          className="flex justify-between items-center border-b pb-4"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3
            className="text-xl font-bold flex items-center gap-3"
            style={{ color: PALETTE.textDark }}
          >
            <FaSlidersH style={{ color: PALETTE.accentBlue }} />
            {headerText}
          </h3>
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
        </div>

        {/* Sort by (desktop keeps full set) */}
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

        {/* Departure time */}
        <section>
          <h4 className="font-bold mb-4" style={{ color: PALETTE.textDark }}>
            Departure Time
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(TIME_SLOTS).map((slot) => (
              <button
                key={slot}
                type="button"
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

        {/* Bus type */}
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
      </div>
    );
  }

  // ------------- MOBILE REDBUS-LIKE PANEL -------------
  const mobileSections = [
    { key: "sort", label: "Sort by" },
    { key: "departure", label: "Departure time" },
    { key: "type", label: "Bus type" },
    { key: "boarding", label: "Boarding points" },
    { key: "dropping", label: "Dropping points" },
  ];

  const selectedBoarding = filters.boardingPoint || "";
  const selectedDropping = filters.droppingPoint || "";

  return (
    <>
      {/* 🔥🔥🔥 FIX 1: Removed the TOP FILTER CHIPS BAR COMPLETELY */}

      {/* Main sheet content – Redbus style */}
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3
            className="text-base font-bold"
            style={{ color: PALETTE.textDark }}
          >
            {headerText}
          </h3>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body: left menu + right content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left vertical menu */}
          <div className="w-36 bg-gray-50 border-r overflow-y-auto">
            {mobileSections.map((sec) => (
              <button
                key={sec.key}
                type="button"
                onClick={() => setActiveSection(sec.key)}
                className={`w-full text-left px-4 py-3 text-[13px] border-b ${
                  activeSection === sec.key
                    ? "bg-white font-semibold text-[#D84E55]"
                    : "text-gray-700"
                }`}
                style={{
                  borderColor: "#F3F4F6",
                }}
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div className="flex-1 px-4 py-4 overflow-y-auto">
            {activeSection === "sort" && (
              <div className="space-y-2">
                <RadioRow
                  label="Departure: Earliest First"
                  checked={sortBy === "time-asc"}
                  onClick={() => setSortBy("time-asc")}
                />
                <RadioRow
                  label="Departure: Latest First"
                  checked={sortBy === "time-desc"}
                  onClick={() => setSortBy("time-desc")}
                />
              </div>
            )}

            {activeSection === "departure" && (
              <div className="space-y-2">
                {Object.keys(TIME_SLOTS).map((slot) => {
                  const active = !!filters.timeSlots[slot];
                  return (
                    <RadioRow
                      key={slot}
                      label={slot}
                      checked={active}
                      onClick={() => handleTimeSlotFilter(slot)}
                    />
                  );
                })}
              </div>
            )}

            {activeSection === "type" && (
              <div className="space-y-2">
                <RadioRow
                  label="All types"
                  checked={!filters.type}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "",
                    }))
                  }
                />
                <RadioRow
                  label="AC"
                  checked={filters.type === "AC"}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "AC",
                    }))
                  }
                />
                <RadioRow
                  label="Non-AC"
                  checked={filters.type === "Non-AC"}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      type: "Non-AC",
                    }))
                  }
                />
              </div>
            )}

            {activeSection === "boarding" && (
              <div className="space-y-2">
                {boardingOptions.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Boarding points will appear here when available for this
                    route.
                  </p>
                ) : (
                  <>
                    <RadioRow
                      label="Any boarding point"
                      checked={!selectedBoarding}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          boardingPoint: "",
                        }))
                      }
                    />
                    {boardingOptions.map((label) => (
                      <RadioRow
                        key={label}
                        label={label}
                        checked={selectedBoarding === label}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            boardingPoint: label,
                          }))
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            )}

            {activeSection === "dropping" && (
              <div className="space-y-2">
                {droppingOptions.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    Dropping points will appear here when available for this
                    route.
                  </p>
                ) : (
                  <>
                    <RadioRow
                      label="Any dropping point"
                      checked={!selectedDropping}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          droppingPoint: "",
                        }))
                      }
                    />
                    {droppingOptions.map((label) => (
                      <RadioRow
                        key={label}
                        label={label}
                        checked={selectedDropping === label}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            droppingPoint: label,
                          }))
                        }
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 🔥🔥🔥 FIX 2: Bottom action buttons - visible always */}
        <div
          className="px-4 py-3 border-t bg-white flex gap-3"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <button
            type="button"
            onClick={() => resetFilters()}
            className="flex-1 h-11 rounded-full border text-[14px] font-semibold"
            style={{
              borderColor: "#D1D5DB",
              color: PALETTE.textDark,
              backgroundColor: "white",
            }}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => setIsFilterOpen(false)}
            className="flex-1 h-11 rounded-full text-[14px] font-semibold text-white"
            style={{ backgroundColor: PALETTE.primaryRed }}
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
