import React from "react";

// Define the seat layouts based on the images you provided
const layouts = {
  "49-seat": [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
  ],
  "37-seat": [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
  ],
};

const SeatLayoutSelector = ({ selectedLayout, onLayoutChange }) => {
  const handleSelectionChange = (e) => {
    const selectedKey = e.target.value;
    const layout = layouts[selectedKey] || [];
    onLayoutChange(layout.join(", ")); // Pass the comma-separated string to the parent form
  };

  // Helper to determine the selected layout key from the current form state
  const getLayoutKey = (layoutString) => {
    if (layoutString === layouts["49-seat"].join(", ")) return "49-seat";
    if (layoutString === layouts["37-seat"].join(", ")) return "37-seat";
    return "custom"; // Fallback for any existing manually entered layouts
  };

  const currentLayoutKey = getLayoutKey(selectedLayout);

  return (
    <div>
      <label
        htmlFor="seatLayoutSelector"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Seat Layout Option
      </label>
      <select
        id="seatLayoutSelector"
        name="seatLayoutSelector"
        className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
        onChange={handleSelectionChange}
        value={currentLayoutKey}
      >
        <option value="" disabled={currentLayoutKey !== "custom"}>
          Select a layout
        </option>
        <option value="49-seat">49-Seat Layout</option>
        <option value="37-seat">37-Seat Layout</option>
        {currentLayoutKey === "custom" && (
          <option value="custom" disabled>
            Custom Layout
          </option>
        )}
      </select>
    </div>
  );
};

export default SeatLayoutSelector;
