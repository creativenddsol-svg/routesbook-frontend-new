import React from "react";
import { FaClock, FaMapMarkerAlt, FaTrash, FaPlus } from "react-icons/fa";

const PointManager = ({ points, setPoints, pointType }) => {
  const handleAddPoint = () => {
    setPoints([...points, { time: "", point: "" }]);
  };

  const handleRemovePoint = (index) => {
    if (points.length > 1) {
      const newPoints = points.filter((_, i) => i !== index);
      setPoints(newPoints);
    }
  };

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    const newPoints = [...points];
    newPoints[index][name] = value;
    setPoints(newPoints);
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 border-b pb-2">
        Manage {pointType} Points
      </h3>
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {points.map((point, index) => (
          <div
            key={index}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border rounded-lg bg-gray-50/70 transition-shadow hover:shadow-sm"
          >
            {/* Time Input */}
            <div className="w-full sm:w-auto relative">
              <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="time"
                name="time"
                value={point.time}
                onChange={(e) => handleChange(index, e)}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {/* Location Input */}
            <div className="w-full sm:flex-1 relative">
              <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="point"
                placeholder="e.g., Central Bus Stand"
                value={point.point}
                onChange={(e) => handleChange(index, e)}
                className="w-full border border-gray-300 pl-10 pr-3 py-2 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            {/* Remove Button */}
            <button
              type="button"
              onClick={() => handleRemovePoint(index)}
              disabled={points.length <= 1}
              className="w-full sm:w-auto flex justify-center items-center bg-red-100 text-red-600 h-10 w-10 rounded-md hover:bg-red-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              title="Remove Point"
            >
              <FaTrash />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Point Button */}
      <button
        type="button"
        onClick={handleAddPoint}
        className="mt-2 w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-transform hover:scale-[1.02]"
      >
        <FaPlus /> Add {pointType} Point
      </button>
    </div>
  );
};

export default PointManager;
