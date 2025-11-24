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

  // Refactored Radio Option (Clean List Style)
  const RadioOption = ({ label, value }) => (
    <label
      className="flex items-center justify-between py-4 cursor-pointer group hover:bg-gray-50 -mx-4 px-4 transition-colors"
      onClick={() => setSortBy(value)}
    >
      <span
        className={`text-base ${
          sortBy === value ? "font-bold text-gray-900" : "text-gray-700"
        }`}
      >
        {label}
      </span>
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all ${
          sortBy === value ? "border-red-600" : "border-gray-400"
        }`}
      >
        {sortBy === value && (
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
        )}
      </span>
    </label>
  );

  // Main panel content for the right column
  const RightContent = () => {
    switch (activeTab) {
      case "Sort by":
        return (
          <div className="flex flex-col">
            <RadioOption label="Relevance" value="relevance" />
            <RadioOption label="Price: Lowest First" value="price-asc" />
            <RadioOption label="Rating: Highest First" value="rating-desc" />
            <RadioOption label="Departure: Earliest First" value="time-asc" />
            <RadioOption label="Departure: Latest First" value="time-desc" />
          </div>
        );

      case "Departure time from source":
        return (
          <div className="pt-2">
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
          <div className="space-y-3 pt-2">
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
              {filters.type === "Non-AC" && (
                <span className="text-sm">Selected</span>
              )}
            </button>
          </div>
        );

      case "Single window seater/sleeper":
      case "Boarding points":
      case "Dropping points":
      case "Bus operator":
      case "Amenities":
        return (
          <div className="text-sm text-gray-600 pt-4">
            <p className="mb-3">
              Options for <strong>{activeTab}</strong> will appear here.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  // Panel body - Split View Layout (Gray Left, White Right)
  const PanelBody = () => (
    <div className="flex flex-row h-full min-h-[400px]">
      {/* Left Nav (Gray Background) */}
      <nav className="w-[38%] bg-gray-100 overflow-y-auto hide-scrollbar">
        <ul className="pb-20"> {/* Padding bottom for scrolling clearance */}
          {LEFT_TABS.map((t) => (
            <li
              key={t}
              onClick={() => setActiveTab(t)}
              className={`
                px-4 py-4 cursor-pointer text-sm font-medium transition-colors border-l-4
                ${
                  activeTab === t
                    ? "bg-white text-red-600 border-red-600" // Active state
                    : "bg-gray-100 text-gray-700 border-transparent hover:bg-gray-200" // Inactive state
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="leading-snug">{t}</span>
                {t === "Sort by" && activeFilterCount > 0 && (
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    ({activeFilterCount})
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Right Content (White Background) */}
      <div className="flex-1 bg-white p-5 overflow-y-auto">
        <RightContent />
      </div>
    </div>
  );

  // Mobile bottom-sheet modal
  const MobileSheet = () => (
    <div
      className="fixed inset-0 z-50 flex items-end"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={() => setIsFilterOpen(false)}
      />

      <div
        className="relative w-full h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-white z-10">
          <h3 className="text-lg font-bold text-gray-900">{headerText}</h3>
          <button
            onClick={() => setIsFilterOpen(false)}
            className="p-2 -mr-2 text-gray-500 hover:text-gray-800"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <PanelBody />
        </div>

        {/* Footer Actions (Pill Buttons) */}
        <div className="p-4 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10">
          <div className="flex gap-4">
            <button
              onClick={() => {
                resetFilters();
                setIsFilterOpen(false);
              }}
              className="flex-1 py-3 rounded-full border border-gray-400 font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Clear all
            </button>

            <button
              onClick={() => setIsFilterOpen(false)}
              className="flex-1 py-3 rounded-full font-bold text-white transition-colors"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Desktop inline panel
  return (
    <>
      {/* Mobile Quick Filters Bar */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-2 border-b bg-white sticky top-0 z-20">
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
              <span className="ml-2 text-xs text-blue-600">
                ({activeFilterCount})
              </span>
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
              filters.type === "AC"
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-gray-300 text-gray-700"
            }`}
          >
            AC
          </button>
          <button
            onClick={() => handleTypeToggle("Non-AC")}
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

      {/* Desktop Panel Implementation */}
      <div className="hidden lg:block p-6">
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          {/* Desktop Header */}
          <div className="flex items-center justify-between p-5 border-b">
            <h3 className="text-xl font-bold flex items-center gap-3 text-gray-800">
              <FaSlidersH className="text-gray-500" /> {headerText}
            </h3>

            <div className="flex items-center gap-3">
              <button
                onClick={resetFilters}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium hover:bg-gray-100 ${
                  activeFilterCount > 0 ? "text-red-600" : "text-gray-500"
                }`}
              >
                <FaSyncAlt /> Clear
              </button>

              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-6 py-2 rounded-full font-semibold text-white bg-red-600 hover:bg-red-700"
              >
                Apply
              </button>
            </div>
          </div>

          <PanelBody />
        </div>
      </div>

      {/* Render Mobile Modal */}
      {isMobile && MobileSheet()}
    </>
  );
}
