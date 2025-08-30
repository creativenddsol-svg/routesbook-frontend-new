// PointSelection.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

// A single-list component to render either boarding or dropping points
const SinglePointList = ({ points, selectedPoint, onSelect }) => (
  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
    {!points || points.length === 0 ? (
      <p className="text-sm text-gray-500">No points available.</p>
    ) : (
      points.map((point, index) => (
        <label
          key={point._id || point.point || index} // More robust key
          onClick={() => onSelect(point)}
          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200
            ${
              selectedPoint && selectedPoint.point === point.point
                ? "bg-red-50 border-red-500 shadow-sm"
                : "bg-gray-50 border-gray-200 hover:border-gray-400"
            }`}
        >
          <div className="flex flex-col flex-grow">
            <p className="font-semibold text-base text-gray-700">
              {point.point}
            </p>
            {point.description && (
              <p className="text-xs text-gray-600">{point.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <p className="font-bold text-gray-700 text-sm">{point.time}</p>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200
                ${
                  selectedPoint && selectedPoint.point === point.point
                    ? "border-red-500"
                    : "border-gray-400"
                }`}
            >
              {selectedPoint && selectedPoint.point === point.point && (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              )}
            </div>
            <input
              type="radio"
              name="point"
              checked={selectedPoint && selectedPoint.point === point.point}
              onChange={() => {}}
              className="hidden"
            />
          </div>
        </label>
      ))
    )}
  </div>
);

// The main component that holds both columns
const PointSelection = ({
  boardingPoints,
  droppingPoints,
  selectedBoardingPoint,
  setSelectedBoardingPoint,
  selectedDroppingPoint,
  setSelectedDroppingPoint,
}) => {
  const [activeTab, setActiveTab] = useState("boarding");

  // This function now handles both setting the point and switching the tab
  const handleBoardingPointSelect = (point) => {
    setSelectedBoardingPoint(point); // Set the selected boarding point
    setActiveTab("dropping"); // Automatically switch to the dropping points tab
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
      {/* ✅ NEW: Pinned Summary Section */}
      <div className="p-3 mb-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-gray-500">Boarding</p>
            <p
              className="font-semibold text-gray-800 truncate"
              title={selectedBoardingPoint ? selectedBoardingPoint.point : ""}
            >
              {selectedBoardingPoint
                ? selectedBoardingPoint.point
                : "Not Selected"}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("boarding")}
            className="text-sm text-red-500 font-medium flex-shrink-0"
          >
            Change
          </button>
        </div>
        <hr className="my-2 border-dashed" />
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-xs text-gray-500">Dropping</p>
            <p
              className="font-semibold text-gray-800 truncate"
              title={selectedDroppingPoint ? selectedDroppingPoint.point : ""}
            >
              {selectedDroppingPoint
                ? selectedDroppingPoint.point
                : "Not Selected"}
            </p>
          </div>
          <button
            onClick={() => setActiveTab("dropping")}
            className="text-sm text-red-500 font-medium flex-shrink-0"
          >
            Change
          </button>
        </div>
      </div>

      <div className="flex border-b border-gray-200 mb-4">
        {/* Tab Buttons */}
        <button
          className={`flex-1 py-2 text-center font-semibold text-base
            ${
              activeTab === "boarding"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("boarding")}
        >
          Boarding Points
        </button>
        <button
          className={`flex-1 py-2 text-center font-semibold text-base
            ${
              activeTab === "dropping"
                ? "border-b-2 border-red-500 text-red-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          onClick={() => setActiveTab("dropping")}
        >
          Dropping Points
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder={`Search ${
            activeTab === "boarding" ? "Boarding" : "Dropping"
          } Point`}
          className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-700 placeholder-gray-400"
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          ></path>
        </svg>
      </div>

      <div className="flex-grow">
        {activeTab === "boarding" ? (
          <SinglePointList
            points={boardingPoints}
            selectedPoint={selectedBoardingPoint}
            onSelect={handleBoardingPointSelect}
          />
        ) : (
          <SinglePointList
            points={droppingPoints}
            selectedPoint={selectedDroppingPoint}
            onSelect={setSelectedDroppingPoint}
          />
        )}
      </div>
    </div>
  );
};

// PropTypes for better component contract
PointSelection.propTypes = {
  boardingPoints: PropTypes.array,
  droppingPoints: PropTypes.array,
  selectedBoardingPoint: PropTypes.object,
  setSelectedBoardingPoint: PropTypes.func.isRequired,
  selectedDroppingPoint: PropTypes.object,
  setSelectedDroppingPoint: PropTypes.func.isRequired,
};

SinglePointList.propTypes = {
  points: PropTypes.array,
  selectedPoint: PropTypes.object,
  onSelect: PropTypes.func.isRequired,
};

export default PointSelection;
