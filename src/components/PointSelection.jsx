// PointSelection.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";

/* ---------- Matte palette to match ConfirmBooking / BookingSummary ---------- */
const PALETTE = {
  primary: "#C74A50",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  // low light red fill for small buttons
  softRedBg: "#FFE9EC",
  softRedBorder: "#FAD1D6",
};

/* ---------- Small atoms ---------- */
const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
    {children}
  </span>
);

/* ---------- Single list (boarding OR dropping) ---------- */
const SinglePointList = ({ points, selectedPoint, onSelect, mode }) => {
  const isSelected = (p) =>
    selectedPoint &&
    selectedPoint.point === p.point &&
    (selectedPoint.time ? selectedPoint.time === p.time : true);

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
      {!points || points.length === 0 ? (
        <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
          No points available.
        </p>
      ) : (
        points.map((point, index) => {
          const selected = isSelected(point);
          return (
            <label
              key={point._id || `${point.point}-${point.time}-${index}`}
              onClick={() => onSelect(point)}
              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200"
              style={{
                background: selected ? "#FFF5F5" : PALETTE.surface,
                borderColor: selected ? PALETTE.primary : PALETTE.border,
              }}
            >
              <div className="flex flex-col flex-grow min-w-0">
                <p className="font-semibold text-base truncate" style={{ color: PALETTE.text }}>
                  {point.point}
                </p>
                {point.description ? (
                  <p className="text-xs truncate" style={{ color: PALETTE.textSubtle }}>
                    {point.description}
                  </p>
                ) : null}
              </div>

              <div className="flex items-center gap-3 flex-shrink-0 pl-3">
                {/* Clean numeric time for both lists */}
                <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                  {point.time}
                </span>

                {/* Radio look */}
                <span
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors duration-200"
                  style={{ borderColor: selected ? PALETTE.primary : "#D1D5DB" }}
                  aria-checked={selected}
                  role="radio"
                >
                  {selected ? (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: PALETTE.primary }}
                    />
                  ) : null}
                </span>

                <input
                  type="radio"
                  name={`point-${mode}`}
                  checked={!!selected}
                  onChange={() => {}}
                  className="hidden"
                />
              </div>
            </label>
          );
        })
      )}
    </div>
  );
};

/* ---------- Main component (two tabs + pinned summary) ---------- */
const PointSelection = ({
  boardingPoints,
  droppingPoints,
  selectedBoardingPoint,
  setSelectedBoardingPoint,
  selectedDroppingPoint,
  setSelectedDroppingPoint,
}) => {
  const [activeTab, setActiveTab] = useState("boarding");

  // flicker flags
  const [flashBoarding, setFlashBoarding] = useState(false);
  const [flashDropping, setFlashDropping] = useState(false);

  const triggerFlicker = (which) => {
    if (which === "boarding") {
      setFlashBoarding(true);
      setTimeout(() => setFlashBoarding(false), 450);
    } else {
      setFlashDropping(true);
      setTimeout(() => setFlashDropping(false), 450);
    }
  };

  const handleBoardingPointSelect = (point) => {
    setSelectedBoardingPoint(point);
    triggerFlicker("boarding");
    setActiveTab("dropping"); // proceed flow
  };

  const handleDroppingPointSelect = (point) => {
    setSelectedDroppingPoint(point);
    triggerFlicker("dropping");
  };

  return (
    <div
      className="rounded-2xl p-4 sm:p-5 h-full flex flex-col"
      style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
    >
      {/* Local keyframes for dim/light flicker */}
      <style>{`
        @keyframes flashDimLight {
          0%   { opacity: 1; }
          35%  { opacity: 0.35; }
          70%  { opacity: 1; }
          85%  { opacity: 0.75; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Pinned summary (matches cards) */}
      <div
        className="p-3 rounded-xl text-sm mb-4"
        style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
      >
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <Label>Boarding</Label>
            <p
              className="font-semibold truncate"
              style={{
                color: PALETTE.text,
                animation: flashBoarding ? "flashDimLight 450ms ease-in-out" : "none",
              }}
              title={selectedBoardingPoint ? selectedBoardingPoint.point : ""}
            >
              {selectedBoardingPoint ? selectedBoardingPoint.point : "Not Selected"}
            </p>
          </div>
          {/* Small filled button with low light red */}
          <button
            onClick={() => {
              setActiveTab("boarding");
              triggerFlicker("boarding");
            }}
            className="text-sm font-semibold rounded-full px-3 py-1 border transition active:scale-[.98]"
            style={{
              background: PALETTE.softRedBg,
              borderColor: PALETTE.softRedBorder,
              color: PALETTE.primary,
            }}
          >
            Change
          </button>
        </div>

        <hr className="my-2 border-dashed" style={{ borderColor: PALETTE.border }} />

        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <Label>Dropping</Label>
            <p
              className="font-semibold truncate"
              style={{
                color: PALETTE.text,
                animation: flashDropping ? "flashDimLight 450ms ease-in-out" : "none",
              }}
              title={selectedDroppingPoint ? selectedDroppingPoint.point : ""}
            >
              {selectedDroppingPoint ? selectedDroppingPoint.point : "Not Selected"}
            </p>
          </div>
          {/* Small filled button with low light red */}
          <button
            onClick={() => {
              setActiveTab("dropping");
              triggerFlicker("dropping");
            }}
            className="text-sm font-semibold rounded-full px-3 py-1 border transition active:scale-[.98]"
            style={{
              background: PALETTE.softRedBg,
              borderColor: PALETTE.softRedBorder,
              color: PALETTE.primary,
            }}
          >
            Change
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mb-4 border-b" style={{ borderColor: PALETTE.border }}>
        <button
          className="flex-1 py-2 text-center font-semibold"
          style={{
            color: activeTab === "boarding" ? PALETTE.primary : PALETTE.textSubtle,
            borderBottom: `2px solid ${
              activeTab === "boarding" ? PALETTE.primary : "transparent"
            }`,
          }}
          onClick={() => setActiveTab("boarding")}
        >
          Boarding Points
        </button>
        <button
          className="flex-1 py-2 text-center font-semibold"
          style={{
            color: activeTab === "dropping" ? PALETTE.primary : PALETTE.textSubtle,
            borderBottom: `2px solid ${
              activeTab === "dropping" ? PALETTE.primary : "transparent"
            }`,
          }}
          onClick={() => setActiveTab("dropping")}
        >
          Dropping Points
        </button>
      </div>

      {/* Search (visual only, matches inputs elsewhere) */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder={`Search ${activeTab === "boarding" ? "Boarding" : "Dropping"} Point`}
          className="w-full rounded-xl pl-4 pr-10 py-2 outline-none"
          style={{
            border: `1px solid ${PALETTE.border}`,
            color: PALETTE.text,
          }}
          onChange={() => {}}
        />
        <svg
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5"
          style={{ color: PALETTE.textSubtle }}
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

      {/* Lists */}
      <div className="flex-grow">
        {activeTab === "boarding" ? (
          <SinglePointList
            mode="boarding"
            points={boardingPoints}
            selectedPoint={selectedBoardingPoint}
            onSelect={handleBoardingPointSelect}
          />
        ) : (
          <SinglePointList
            mode="dropping"
            points={droppingPoints}
            selectedPoint={selectedDroppingPoint}
            onSelect={handleDroppingPointSelect}
          />
        )}
      </div>
    </div>
  );
};

/* ---------- PropTypes ---------- */
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
  mode: PropTypes.oneOf(["boarding", "dropping"]).isRequired,
};

Label.propTypes = { children: PropTypes.node.isRequired };

export default PointSelection;
