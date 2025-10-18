import React from "react";

const ensure = (v) => (Array.isArray(v) ? v : []);

export default function RotatedPointManager({ label, points = [], onChange }) {
  const safeOnChange = (next) => (onChange ? onChange(ensure(next)) : void 0);
  const list = ensure(points);

  const handleChange = (index, field, value) => {
    const updated = [...list];
    const row = { ...(updated[index] || { time: "", point: "" }) };
    // trim only for point; keep raw time input format
    updated[index] = { ...row, [field]: field === "point" ? value.trimStart() : value };
    safeOnChange(updated);
  };

  const addPoint = () => safeOnChange([...list, { time: "", point: "" }]);

  const removePoint = (index) => {
    const updated = [...list];
    updated.splice(index, 1);
    safeOnChange(updated);
  };

  const rows = list.length ? list : [{ time: "", point: "" }];

  return (
    <div className="mt-2 space-y-2">
      <p className="font-semibold text-sm text-gray-700">{label}</p>

      {rows.map((p, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="time"
            value={p.time || ""}
            onChange={(e) => handleChange(idx, "time", e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md w-28"
            aria-label={`${label} time`}
          />
          <input
            type="text"
            value={p.point || ""}
            onChange={(e) => handleChange(idx, "point", e.target.value)}
            className="border border-gray-300 px-2 py-1 rounded-md flex-1"
            placeholder={`Enter ${label} location`}
            aria-label={`${label} location`}
          />
          {list.length > 0 && (
            <button
              type="button"
              className="text-red-500 hover:text-red-700 text-sm"
              onClick={() => removePoint(idx)}
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        className="text-blue-600 hover:underline text-sm"
        onClick={addPoint}
      >
        + Add {label}
      </button>
    </div>
  );
}
