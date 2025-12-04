// FINAL ROUTESBOOK MOBILE FILTER PANEL – REDBUS STYLE
// Top chip bar removed + bottom action buttons fixed

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
  const resetText = activeFilterCount > 0 ? `Reset (${activeFilterCount})` : "Reset";

  // Boarding options
  const boardingOptions = useMemo(() => {
    const set = new Set();
    sortedBuses?.forEach((bus) => {
      const arr =
        bus?.boardingPoints?.length
          ? bus.boardingPoints
          : bus?.boardingPointList || [];
      arr.forEach((p) => {
        const label = typeof p === "string" ? p : p?.name || p?.label || "";
        if (label) set.add(label);
      });
    });
    return [...set];
  }, [sortedBuses]);

  // Dropping options
  const droppingOptions = useMemo(() => {
    const set = new Set();
    sortedBuses?.forEach((bus) => {
      const arr =
        bus?.droppingPoints?.length
          ? bus.droppingPoints
          : bus?.droppingPointList || [];
      arr.forEach((p) => {
        const label = typeof p === "string" ? p : p?.name || p?.label || "";
        if (label) set.add(label);
      });
    });
    return [...set];
  }, [sortedBuses]);

  const RadioRow = ({ label, checked, onClick }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-xl border text-sm mb-2 ${
        checked ? "border-[#D84E55] bg-[#FFF1F2]" : "border-gray-200 bg-white"
      }`}
    >
      <span className="text-gray-800 text-[14px]">{label}</span>
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

  // ---------------- DESKTOP (unchanged logic) ----------------
  if (!isMobile) {
    return (
      <div className="p-6 space-y-8">
        <div
          className="flex justify-between items-center border-b pb-4"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3 className="text-xl font-bold flex items-center gap-3">
            <FaSlidersH style={{ color: PALETTE.accentBlue }} />
            {headerText}
          </h3>

          <button
            onClick={resetFilters}
            className={`text-sm font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${
              activeFilterCount > 0 ? "text-red-600 font-semibold" : "text-gray-500"
            }`}
          >
            <FaSyncAlt /> {resetText}
          </button>
        </div>

        {/* Desktop sections unchanged */}
        <section>
          <h4 className="font-bold mb-3">Sort by</h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full border-2 rounded-lg px-3 py-2 text-sm"
          >
            <option value="time-asc">Departure: Earliest</option>
            <option value="time-desc">Departure: Latest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </section>

        <section>
          <h4 className="font-bold mb-4">Departure Time</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(TIME_SLOTS).map((slot) => (
              <button
                key={slot}
                onClick={() => handleTimeSlotFilter(slot)}
                className={`px-2 py-2 rounded-lg border text-sm ${
                  filters.timeSlots[slot]
                    ? "bg-blue-600 text-white"
                    : "border-gray-200"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h4 className="font-bold mb-3">Bus Type</h4>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="w-full border-2 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </select>
        </section>
      </div>
    );
  }

  // ---------------- MOBILE UI (Redbus Style) ----------------

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
    <div className="flex flex-col h-full bg-white">

      {/* ---- HEADER ---- */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="text-base font-bold">{headerText}</h3>
        <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full">
          <FaTimes />
        </button>
      </div>

      {/* ---- LEFT MENU + CONTENT ---- */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT MENU */}
        <div className="w-36 bg-gray-50 border-r overflow-y-auto">
          {mobileSections.map((sec) => (
            <button
              key={sec.key}
              onClick={() => setActiveSection(sec.key)}
              className={`w-full text-left px-4 py-3 text-[13px] border-b ${
                activeSection === sec.key
                  ? "bg-white font-semibold text-[#D84E55]"
                  : "text-gray-700"
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 px-4 py-4 overflow-y-auto">

          {activeSection === "sort" && (
            <>
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
            </>
          )}

          {activeSection === "departure" &&
            Object.keys(TIME_SLOTS).map((slot) => (
              <RadioRow
                key={slot}
                label={slot}
                checked={!!filters.timeSlots[slot]}
                onClick={() => handleTimeSlotFilter(slot)}
              />
            ))}

          {activeSection === "type" && (
            <>
              <RadioRow
                label="All types"
                checked={!filters.type}
                onClick={() => setFilters((p) => ({ ...p, type: "" }))}
              />
              <RadioRow
                label="AC"
                checked={filters.type === "AC"}
                onClick={() => setFilters((p) => ({ ...p, type: "AC" }))}
              />
              <RadioRow
                label="Non-AC"
                checked={filters.type === "Non-AC"}
                onClick={() => setFilters((p) => ({ ...p, type: "Non-AC" }))}
              />
            </>
          )}

          {activeSection === "boarding" && (
            <>
              <RadioRow
                label="Any boarding point"
                checked={!selectedBoarding}
                onClick={() => setFilters((p) => ({ ...p, boardingPoint: "" }))}
              />
              {boardingOptions.map((label) => (
                <RadioRow
                  key={label}
                  label={label}
                  checked={selectedBoarding === label}
                  onClick={() =>
                    setFilters((p) => ({ ...p, boardingPoint: label }))
                  }
                />
              ))}
            </>
          )}

          {activeSection === "dropping" && (
            <>
              <RadioRow
                label="Any dropping point"
                checked={!selectedDropping}
                onClick={() => setFilters((p) => ({ ...p, droppingPoint: "" }))}
              />
              {droppingOptions.map((label) => (
                <RadioRow
                  key={label}
                  label={label}
                  checked={selectedDropping === label}
                  onClick={() =>
                    setFilters((p) => ({ ...p, droppingPoint: label }))
                  }
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ---- FIXED BOTTOM BUTTONS ---- */}
      <div className="px-4 py-3 border-t bg-white flex gap-3">
        <button
          onClick={resetFilters}
          className="flex-1 h-11 rounded-full border font-semibold"
        >
          Clear all
        </button>

        <button
          onClick={() => setIsFilterOpen(false)}
          className="flex-1 h-11 rounded-full text-white font-semibold"
          style={{ backgroundColor: PALETTE.primaryRed }}
        >
          Apply
        </button>
      </div>
    </div>
  );
}
