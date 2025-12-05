// FINAL UPDATED VERSION:
// - Desktop panel now uses same functional sections as mobile (sort, time, type, boarding, dropping)
// - Mobile panel kept exactly as your current working version

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

  // ---------------- DESKTOP VERSION ----------------
  if (!isMobile) {
    const desktopSections = [
      { key: "sort", label: "Sort by" },
      { key: "departure", label: "Departure time" },
      { key: "type", label: "Bus type" },
      { key: "boarding", label: "Boarding points" },
      { key: "dropping", label: "Dropping points" },
    ];

    const desktopSelectedBoarding = filters.boardingPoint || "";
    const desktopSelectedDropping = filters.droppingPoint || "";

    return (
      <div
        className="bg-white rounded-xl shadow-sm border flex flex-col h-full"
        style={{ borderColor: PALETTE.borderLight }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center px-4 py-3 border-b"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <h3
            className="text-base font-bold flex items-center gap-3"
            style={{ color: PALETTE.textDark }}
          >
            <FaSlidersH style={{ color: PALETTE.accentBlue }} />
            {headerText}
          </h3>

          <button
            onClick={resetFilters}
            className={`text-xs font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:bg-red-50 ${
              activeFilterCount > 0 ? "font-semibold" : ""
            }`}
            style={{
              color:
                activeFilterCount > 0 ? PALETTE.primaryRed : PALETTE.textLight,
            }}
          >
            <FaSyncAlt /> {resetText}
          </button>
        </div>

        {/* Body: same functional sections as mobile */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left menu */}
          <div className="w-40 bg-gray-50 border-r overflow-y-auto">
            {desktopSections.map((sec) => (
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
                {Object.keys(TIME_SLOTS).map((slot) => (
                  <RadioRow
                    key={slot}
                    label={slot}
                    checked={!!filters.timeSlots[slot]}
                    onClick={() => handleTimeSlotFilter(slot)}
                  />
                ))}
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
                      checked={!desktopSelectedBoarding}
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
                        checked={desktopSelectedBoarding === label}
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
                      checked={!desktopSelectedDropping}
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
                        checked={desktopSelectedDropping === label}
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

        {/* Bottom actions (desktop) */}
        <div
          className="px-4 py-3 border-t bg-white flex gap-3"
          style={{ borderColor: PALETTE.borderLight }}
        >
          <button
            type="button"
            onClick={() => resetFilters()}
            className="flex-1 h-10 rounded-full border text-[13px] font-semibold"
            style={{
              borderColor: "#D1D5DB",
              color: PALETTE.textDark,
              backgroundColor: "white",
            }}
          >
            Clear all
          </button>

          {/* Apply just keeps panel open; filters auto-apply on change */}
          <button
            type="button"
            className="flex-1 h-10 rounded-full text-[13px] font-semibold text-white"
            style={{ backgroundColor: PALETTE.primaryRed }}
          >
            Apply
          </button>
        </div>
      </div>
    );
  }

  // ---------------- MOBILE VERSION ----------------
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
      {/* FULLSCREEN CONTENT (height controlled by outer sheet) */}
      <div className="flex flex-col h-full bg-white overflow-hidden">
        {/* Header */}
        <div
          className="flex itemscenter justify-between px-4 py-3 border-b"
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

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left menu */}
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
                {Object.keys(TIME_SLOTS).map((slot) => (
                  <RadioRow
                    key={slot}
                    label={slot}
                    checked={!!filters.timeSlots[slot]}
                    onClick={() => handleTimeSlotFilter(slot)}
                  />
                ))}
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

        {/* Bottom Buttons */}
        <div
          className="px-4 py-3 border-t bg-white flex gap-3 pb-4"
          style={{
            borderColor: PALETTE.borderLight,
          }}
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
