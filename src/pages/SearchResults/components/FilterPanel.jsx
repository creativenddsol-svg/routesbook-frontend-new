// src/pages/SearchResults/components/FilterPanel.jsx
import React, { useState, useEffect } from "react";
import { 
  FaSlidersH, 
  FaTimes, 
  FaSyncAlt, 
  FaSun, 
  FaMoon, 
  FaCloudSun, 
  FaRegclock 
} from "react-icons/fa";
import { useSearchCore, PALETTE, TIME_SLOTS } from "../_core";

export default function FilterPanel({ isMobile, sortBy, setSortBy }) {
  const {
    filters,
    setFilters,
    resetFilters,
    activeFilterCount,
    setIsFilterOpen,
  } = useSearchCore();

  // State for Mobile Tabs only
  const [activeTab, setActiveTab] = useState("Sort by");

  // Lock background scroll when mobile modal is open
  useEffect(() => {
    if (isMobile) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile]);

  // --- Helpers & Handlers ---

  const handleTimeSlotFilter = (slot) =>
    setFilters((prev) => ({
      ...prev,
      timeSlots: { ...prev.timeSlots, [slot]: !prev.timeSlots[slot] },
    }));

  const handleTypeToggle = (type) =>
    setFilters((prev) => ({ ...prev, type: prev.type === type ? "" : type }));

  const getTimeIcon = (slot) => {
    switch (slot) {
      case "Morning": return <FaSun className="text-lg mb-1" />;
      case "Afternoon": return <FaCloudSun className="text-lg mb-1" />;
      case "Evening": return <FaRegclock className="text-lg mb-1" />;
      case "Night": return <FaMoon className="text-lg mb-1" />;
      default: return null;
    }
  };

  // --- Shared Sub-Components ---

  // 1. Sort Options List
  const SortOptions = () => (
    <div className="space-y-1">
      {[
        { label: "Relevance", value: "relevance" },
        { label: "Price: Lowest First", value: "price-asc" },
        { label: "Price: Highest First", value: "price-desc" },
        { label: "Rating: Highest First", value: "rating-desc" },
        { label: "Departure: Earliest First", value: "time-asc" },
        { label: "Departure: Latest First", value: "time-desc" },
      ].map((opt) => (
        <label
          key={opt.value}
          className="flex items-center gap-3 py-2 cursor-pointer group hover:bg-gray-50 rounded px-2 -mx-2 transition-colors"
          onClick={() => setSortBy(opt.value)}
        >
          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
            sortBy === opt.value ? "border-red-600" : "border-gray-400"
          }`}>
             {sortBy === opt.value && <div className="w-2 h-2 bg-red-600 rounded-full" />}
          </div>
          <span className={`text-sm ${sortBy === opt.value ? "font-bold text-gray-900" : "text-gray-700"}`}>
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  );

  // 2. Departure Time Grid
  const DepartureFilter = () => (
    <div className="grid grid-cols-2 gap-3">
      {Object.keys(TIME_SLOTS).map((slot) => (
        <button
          key={slot}
          onClick={() => handleTimeSlotFilter(slot)}
          className={`flex flex-col items-center justify-center py-3 px-2 rounded-lg border transition-all duration-200 ${
            filters.timeSlots[slot]
              ? "bg-red-50 border-red-500 text-red-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
          }`}
        >
          {getTimeIcon(slot)}
          <span className="text-xs font-medium">{slot}</span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            {TIME_SLOTS[slot][0]}:00 - {TIME_SLOTS[slot][1]}:00
          </span>
        </button>
      ))}
    </div>
  );

  // 3. Bus Type Toggles
  const BusTypeFilter = () => (
    <div className="flex gap-3">
      {["AC", "Non-AC"].map((type) => (
        <button
          key={type}
          onClick={() => handleTypeToggle(type)}
          className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-all ${
            filters.type === type
              ? "bg-red-50 border-red-500 text-red-600"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
          }`}
        >
          {type} {filters.type === type && "✓"}
        </button>
      ))}
    </div>
  );

  // =========================================================
  // VIEW 1: DESKTOP SIDEBAR (Vertical Stack - NO TABS)
  // =========================================================
  if (!isMobile) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <FaSlidersH className="text-gray-500" /> Filters
          </h3>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 uppercase tracking-wide"
            >
              Clear All
            </button>
          )}
        </div>

        {/* Vertical Stack Content */}
        <div className="p-5 space-y-8">
          
          {/* Section: Bus Type */}
          <section>
            <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Bus Type</h4>
            <BusTypeFilter />
          </section>

          <div className="border-t border-gray-100" />

          {/* Section: Departure Time */}
          <section>
            <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Departure Time</h4>
            <DepartureFilter />
          </section>

          <div className="border-t border-gray-100" />

          {/* Section: Sort By */}
          <section>
            <h4 className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Sort By</h4>
            <SortOptions />
          </section>

          {/* Placeholder for future amenities */}
          <div className="border-t border-gray-100" />
          <section className="opacity-50 pointer-events-none grayscale">
             <h4 className="text-xs font-bold text-gray-900 mb-2 uppercase tracking-wider">Boarding Point</h4>
             <input disabled placeholder="Search points..." className="w-full text-sm p-2 bg-gray-100 rounded border-none" />
          </section>

        </div>
      </div>
    );
  }

  // =========================================================
  // VIEW 2: MOBILE BOTTOM SHEET (Tabs Layout)
  // =========================================================
  
  const LEFT_TABS = [
    "Sort by", 
    "Departure time", 
    "Bus type", 
    "Boarding points", 
    "Dropping points", 
    "Amenities"
  ];

  // Mobile Content Switcher
  const MobileRightContent = () => {
    switch (activeTab) {
      case "Sort by": return <SortOptions />;
      case "Departure time": return <div className="pt-2"><DepartureFilter /></div>;
      case "Bus type": return <div className="pt-2 space-y-3"><BusTypeFilter /></div>;
      default: return (
        <div className="text-sm text-gray-500 flex flex-col items-center justify-center h-40 text-center">
           <p>Select an option from the left menu</p>
        </div>
      );
    }
  };

  return (
    <>
      {/* Mobile Top Sticky Bar (Horizontal Scroll) */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar px-3 py-3 border-b bg-white sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => setIsFilterOpen(true)}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-full whitespace-nowrap shadow-sm ${
            activeFilterCount > 0 ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-300"
          }`}
        >
          <FaSlidersH /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {/* Quick Access Pills */}
        <button 
          onClick={() => handleTypeToggle("AC")} 
          className={`px-4 py-2 text-sm font-medium border rounded-full whitespace-nowrap ${filters.type === "AC" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-300"}`}
        >
          AC Buses
        </button>
        <button 
          onClick={() => handleTimeSlotFilter("Morning")} 
          className={`px-4 py-2 text-sm font-medium border rounded-full whitespace-nowrap ${filters.timeSlots["Morning"] ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-300"}`}
        >
          Morning
        </button>
        <button 
          onClick={() => handleTimeSlotFilter("Night")} 
          className={`px-4 py-2 text-sm font-medium border rounded-full whitespace-nowrap ${filters.timeSlots["Night"] ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-white text-gray-600 border-gray-300"}`}
        >
          Night
        </button>
      </div>

      {/* Mobile Modal (Bottom Sheet) */}
      <div className="fixed inset-0 z-[9999] flex items-end" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsFilterOpen(false)} />
        
        <div className="relative w-full bg-white rounded-t-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold text-gray-900">Sort & Filter</h3>
            <button onClick={() => setIsFilterOpen(false)} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 bg-gray-100 rounded-full">
              <FaTimes />
            </button>
          </div>

          {/* Mobile Body (Split View: Tabs + Content) */}
          <div className="flex flex-1 min-h-0">
            {/* Left Tabs */}
            <nav className="w-[35%] bg-gray-50 overflow-y-auto border-r border-gray-200">
              <ul>
                {LEFT_TABS.map((t) => (
                  <li
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-4 cursor-pointer text-xs font-semibold transition-all border-l-4 leading-relaxed ${
                      activeTab === t
                        ? "bg-white text-red-600 border-red-600 shadow-sm"
                        : "bg-transparent text-gray-500 border-transparent hover:bg-gray-100"
                    }`}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </nav>
            {/* Right Content */}
            <div className="flex-1 bg-white p-5 overflow-y-auto pb-24">
              <MobileRightContent />
            </div>
          </div>

          {/* Mobile Footer */}
          <div className="p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-20">
            <div className="flex gap-3">
              <button onClick={() => { resetFilters(); setIsFilterOpen(false); }} className="flex-1 py-3.5 rounded-xl font-semibold text-gray-600 bg-gray-100">Clear all</button>
              <button onClick={() => setIsFilterOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-red-200" style={{ backgroundColor: PALETTE.primaryRed }}>Apply Filters</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
