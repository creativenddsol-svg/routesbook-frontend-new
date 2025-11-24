// src/pages/SearchResults/components/FilterPanel.jsx
// Reference image (RedBus filter): /mnt/data/WhatsApp Image 2025-11-24 at 23.09.21_c5fae017.jpg

import React, { useState } from "react";
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

  const [activeTab, setActiveTab] = useState("Sort by");

  const LEFT_TABS = [
    "Sort by",
    "Departure time from source",
    "Bus type",
    "Single window seater/sleeper",
    "Boarding points",
    "Dropping points",
    "Bus operator",
    "Amenities",
  ];

  const handleTimeSlotFilter = (slot) =>
    setFilters((prev) => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
    }));

  const handleTypeToggle = (type) =>
    setFilters((prev) => ({ ...prev, type: prev.type === type ? "" : type }));

  const headerText = isMobile ? "Sort and filter buses" : "Filters";
  const resetText =
    activeFilterCount > 0 ? `Clear (${activeFilterCount})` : "Clear";

  // Helper to render radio-style option used in Sort by (matching RedBus)
  const RadioOption = ({ label, value }) => (
    <label
      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
      style={{ borderColor: PALETTE.borderLight }}
      onClick={() => setSortBy(value)}
    >
      <span className="text-base font-medium" style={{ color: PALETTE.textDark }}>
        {label}
      </span>
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center border ${
          sortBy === value ? "border-red-600" : "border-gray-300"
        }`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            sortBy === value ? "bg-red-600" : "bg-transparent"
          }`}
        />
      </span>
    </label>
  );

  // Main panel content for the right column (renders according to activeTab)
  const RightContent = () => {
    switch (activeTab) {
      case "Sort by":
        return (
          <div className="space-y-4">
            <RadioOption label="Relevance" value="relevance" />
            <RadioOption label="Price: Lowest First" value="price-asc" />
            <RadioOption label="Rating: Highest First" value="rating-desc" />
            <RadioOption label="Departure: Earliest First" value="time-asc" />
            <RadioOption label="Departure: Latest First" value="time-desc" />
          </div>
        );

      case "Departure time from source":
        return (
          <div>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(TIME_SLOTS).map((slot) => (
                <button
                  key={slot}
                  onClick={() => handleTimeSlotFilter(slot)}
                  className={`flex items-center justify-center px-3 py-2 rounded-md font-semibold border transition-all ${
                    filters.timeSlots[slot]
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        );

      case "Bus type":
        return (
          <div className="space-y-3">
            <button
              onClick={() => handleTypeToggle("AC")}
              className={`w-full text-left px-4 py-3 rounded-lg border flex items-center justify-between ${
                filters.type === "AC"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
            >
              <span>AC</span>
              {filters.type === "AC" && <span className="text-sm">Selected</span>}
            </button>

            <button
              onClick={() => handleTypeToggle("Non-AC")}
              className={`w-full text-left px-4 py-3 rounded-lg border flex items-center justify-between ${
                filters.type === "Non-AC"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-800 border-gray-200"
              }`}
            >
              <span>Non-AC</span>
              {filters.type === "Non-AC" && <span className="text-sm">Selected</span>}
            </button>
          </div>
        );

      case "Single window seater/sleeper":
      case "Boarding points":
      case "Dropping points":
      case "Bus operator":
      case "Amenities":
        return (
          <div className="text-sm text-gray-600">
            {/* Placeholder area — keep simple list or controls here as needed */}
            <p className="mb-3">Options for <strong>{activeTab}</strong> will appear here.</p>
            <p className="text-xs text-gray-400">You can populate this with checkbox lists, search, or operator lists as needed.</p>
          </div>
        );

      default:
        return null;
    }
  };

  // Panel body marker - shared layout used for desktop and mobile modal
  const PanelBody = () => (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left nav (sticky on desktop) */}
      <nav className="w-full lg:w-64">
        <div className="bg-white border rounded-lg overflow-hidden" style={{ borderColor: PALETTE.borderLight }}>
          <ul className="divide-y" style={{ borderColor: PALETTE.borderLight }}>
            {LEFT_TABS.map((t) => (
              <li
                key={t}
                className={`px-4 py-3 cursor-pointer ${
                  activeTab === t ? "bg-red-50" : "bg-white hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab(t)}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${activeTab === t ? "text-red-600" : "text-gray-800"}`}>
                    {t}
                  </span>
                  {t === "Sort by" && activeFilterCount > 0 && (
                    <span className="text-xs text-gray-500">({activeFilterCount})</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Right content */}
      <div className="flex-1">
        <div className="bg-white border rounded-lg p-4" style={{ borderColor: PALETTE.borderLight }}>
          <h4 className="text-base font-semibold mb-3" style={{ color: PALETTE.textDark }}>
            {activeTab}
          </h4>
          <RightContent />
        </div>
      </div>
    </div>
  );

  // Mobile bottom-sheet modal
  const MobileSheet = () => (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={() => setIsFilterOpen(false)} />

      <div
        className="relative w-full max-h-[90vh] bg-white rounded-t-2xl shadow-xl flex flex-col"
        style={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: PALETTE.borderLight }}>
          <h3 className="text-lg font-bold">{headerText}</h3>
          <button onClick={() => setIsFilterOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
            <FaTimes />
          </button>
        </div>

        <div className="overflow-y-auto p-4" style={{ maxHeight: "calc(90vh - 140px)" }}>
          <PanelBody />
        </div>

        {/* Fixed footer actions */}
        <div className="p-4 border-t bg-white" style={{ borderColor: PALETTE.borderLight }}>
          <div className="flex gap-3">
            <button
              onClick={() => {
                resetFilters();
                setIsFilterOpen(false);
              }}
              className="flex-1 py-3 rounded-lg border font-semibold"
              style={{
                borderColor: PALETTE.borderLight,
                color: PALETTE.textDark,
                background: "white",
              }}
            >
              {resetText}
            </button>

            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-3 rounded-lg font-bold text-white"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop inline panel (non-modal) — two-column layout with sticky left nav and fixed bottom actions when used as modal
  return (
    <>
      {/* Mobile quick horizontal bar (kept from your original) */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-2 border-b bg-white">
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
              <span className="ml-2 text-xs text-blue-600">({activeFilterCount})</span>
            )}
          </button>

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

          <button
            onClick={() => handleTypeToggle("AC")}
            className={`px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
              filters.type === "AC" ? "border-blue-600 text-blue-600 font-semibold" : "border-gray-300 text-gray-700"
            }`}
          >
            AC
          </button>
          <button
            onClick={() => handleTypeToggle("Non-AC")}
            className={`px-3 py-2 text-sm font-medium border rounded-md whitespace-nowrap ${
              filters.type === "Non-AC" ? "border-blue-600 text-blue-600 font-semibold" : "border-gray-300 text-gray-700"
            }`}
          >
            Non-AC
          </button>
        </div>
      )}

      {/* Desktop / Tablet inline panel */}
      <div className="hidden lg:block p-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-6" style={{ borderColor: PALETTE.borderLight }}>
            <h3 className="text-xl font-bold flex items-center gap-3" style={{ color: PALETTE.textDark }}>
              <FaSlidersH style={{ color: PALETTE.accentBlue }} /> {headerText}
            </h3>

            <div className="flex items-center gap-3">
              <button
                onClick={resetFilters}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium hover:bg-red-50 ${activeFilterCount > 0 ? "text-red-600" : "text-gray-600"}`}
                style={{ color: activeFilterCount > 0 ? PALETTE.primaryRed : PALETTE.textLight }}
              >
                <FaSyncAlt /> {resetText}
              </button>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: PALETTE.primaryRed }}
              >
                Apply
              </button>
            </div>
          </div>

          <PanelBody />
        </div>
      </div>

      {/* Mobile modal when opened */}
      {isMobile && (
        MobileSheet()
      )}
    </>
  );
}
