import React from "react";

const RotatedPointManager = ({ label, points = [], onChange }) => {
  // This function now correctly uses the 'onChange' prop
  const handleChange = (index, field, value) => {
    const updated = [...points];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  // This function now correctly uses the 'onChange' prop
  const addPoint = () => {
    onChange([...points, { time: "", point: "" }]);
  };

  // This function now correctly uses the 'onChange' prop
  const removePoint = (index) => {
    const updated = [...points];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="mt-2 space-y-2">
      {/* Use the 'label' prop for the title */}
      <p className="font-semibold text-sm text-gray-700">{label}</p>
      {(points || []).map((p, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="time"
            value={p.time}
            onChange={(e) => handleChange(idx, "time", e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md w-1/3"
            required
          />
          <input
            type="text"
            value={p.point}
            onChange={(e) => handleChange(idx, "point", e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md flex-1"
            placeholder={`Enter ${label} location`}
            required
          />
          <button
            type="button"
            className="text-red-500 hover:text-red-700 text-sm"
            onClick={() => removePoint(idx)}
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="text-blue-600 hover:underline text-sm"
        onClick={addPoint}
      >
        {/* Use the 'label' prop for the button text */}+ Add {label}
      </button>
    </div>
  );
};

export default RotatedPointManager;
