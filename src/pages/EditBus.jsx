// src/pages/EditBus.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api";
import SeatLayoutSelector from "../components/SeatLayoutSelector";
import PointManager from "../components/PointManager";
import PriceMatrix from "../components/PriceMatrix";
import RotatedPointManager from "../components/RotatedPointManager"; // Make sure this is imported

// small helper to sanitize [{time, point}] arrays
const cleanPoints = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map(({ time, point }) => ({
      time: String(time || "").trim(),
      point: String(point || "").trim(),
    }))
    .filter((r) => r.time && r.point);

const EditBus = () => {
  const { busId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    date: "",
    departureTime: "",
    arrivalTime: "",
    busType: "AC",
    seatLayout: "",
    price: "",
    operatorLogo: "",
    unavailableDates: "",
    isAvailable: true,
    operator: "",
    features: { wifi: false, chargingPort: false },
    trendingOffer: {
      isActive: false,
      discountPercent: 0,
      message: "",
      expiry: "",
    },
    convenienceFee: {
      amountType: "fixed",
      value: 0,
    },
    rotationSchedule: {
      isRotating: false,
      startDate: "",
      rotationLength: "",
      intervals: [],
    },
  });

  // State for non-rotating bus points
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchBus = async () => {
      try {
        const res = await apiClient.get(`/buses/${busId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const bus = res.data;

        const formattedDate = bus.date ? bus.date.split("T")[0] : "";
        const formattedExpiry = bus.trendingOffer?.expiry
          ? bus.trendingOffer.expiry.split("T")[0]
          : "";
        const formattedRotationStart = bus.rotationSchedule?.startDate
          ? bus.rotationSchedule.startDate.split("T")[0]
          : "";

        setForm({
          ...bus,
          date: formattedDate,
          seatLayout: bus.seatLayout?.join(", ") || "",
          unavailableDates: bus.unavailableDates?.join(", ") || "",
          operatorLogo: bus.operatorLogo || "",
          operator: bus.operator?._id || bus.operator || "",
          features: bus.features || { wifi: false, chargingPort: false },
          trendingOffer: {
            isActive: bus.trendingOffer?.isActive ?? false,
            discountPercent: bus.trendingOffer?.discountPercent ?? 0,
            message: bus.trendingOffer?.message ?? "",
            expiry: formattedExpiry,
          },
          convenienceFee:
            bus.convenienceFee || {
              amountType: "fixed",
              value: 0,
            },
          rotationSchedule: bus.rotationSchedule
            ? {
                ...bus.rotationSchedule,
                startDate: formattedRotationStart,
              }
            : {
                isRotating: false,
                startDate: "",
                rotationLength: "",
                intervals: [],
              },
        });

        // Only set these for non-rotating buses
        if (!bus.rotationSchedule?.isRotating) {
          setBoardingPoints(
            bus.boardingPoints?.length
              ? bus.boardingPoints
              : [{ time: "", point: "" }]
          );
          setDroppingPoints(
            bus.droppingPoints?.length
              ? bus.droppingPoints
              : [{ time: "", point: "" }]
          );
        }

        setFares(bus.fares || []);
      } catch (err) {
        setError("Failed to load bus details. Please try again.");
        console.error(err);
      }
    };

    const fetchOperators = async () => {
      try {
        // Matches AddBus.jsx endpoint
        const res = await apiClient.get("/admin/operators", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOperators(res.data || []);
      } catch (err) {
        console.error("Failed to load operators:", err);
      }
    };

    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBus(), fetchOperators()]);
      setLoading(false);
    };

    if (busId) loadData();
  }, [busId]);

  // --- Standard Field Handlers ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e, field) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [field]: { ...prev[field], [name]: checked },
    }));
  };

  const handleLayoutChange = (layoutString) => {
    setForm({ ...form, seatLayout: layoutString });
  };

  const handleConvenienceFeeChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      convenienceFee: {
        ...prev.convenienceFee,
        [name]: name === "value" ? Number(value) : value,
      },
    }));
  };

  const handleTrendingOfferChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      trendingOffer: {
        ...prev.trendingOffer,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  // --- Rotation Schedule Handlers ---
  const handleRotationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      rotationSchedule: {
        ...prev.rotationSchedule,
        [name]: type === "checkbox" ? checked : value,
      },
    }));
  };

  const getDaysForRotation = () => {
    const length = Number(form.rotationSchedule.rotationLength);
    return isNaN(length) || length <= 0 ? [] : [...Array(length).keys()];
  };

  /**
   * Universal handler for updating any field within a rotation interval turn.
   * This includes departure/arrival times and boarding/dropping points.
   */
  const handleIntervalChange = (dayOffset, turnIndex, field, value) => {
    const intervals = [...(form.rotationSchedule.intervals || [])];
    let dayEntry = intervals.find((i) => i.dayOffset === dayOffset);

    // If the day doesn't exist in the intervals array, create it.
    if (!dayEntry) {
      dayEntry = { dayOffset, turns: [] };
      intervals.push(dayEntry);
    }

    if (!dayEntry.turns) dayEntry.turns = [];

    // If the turn doesn't exist for that day, initialize it.
    if (!dayEntry.turns[turnIndex]) {
      dayEntry.turns[turnIndex] = {
        departureTime: "",
        arrivalTime: "",
        boardingPoints: [],
        droppingPoints: [],
      };
    }

    // Update the specified field for the turn.
    dayEntry.turns[turnIndex][field] = value;

    // Sort intervals by dayOffset to maintain order.
    intervals.sort((a, b) => a.dayOffset - b.dayOffset);

    setForm((prev) => ({
      ...prev,
      rotationSchedule: { ...prev.rotationSchedule, intervals },
    }));
  };

  const addDayTurn = (dayOffset) => {
    const turns =
      form.rotationSchedule.intervals.find((i) => i.dayOffset === dayOffset)
        ?.turns || [];
    const newTurnIndex = turns.length;
    // Add a new turn by setting a default field (and the handler will init arrays)
    handleIntervalChange(dayOffset, newTurnIndex, "departureTime", "");
  };

  const removeDayTurn = (dayOffset, turnIndex) => {
    const intervals = [...(form.rotationSchedule.intervals || [])];
    const dayEntry = intervals.find((i) => i.dayOffset === dayOffset);
    if (dayEntry && dayEntry.turns) {
      dayEntry.turns.splice(turnIndex, 1);
      // If no turns are left for a day, remove the day entry itself.
      if (dayEntry.turns.length === 0) {
        const dayEntryIndex = intervals.findIndex(
          (i) => i.dayOffset === dayOffset
        );
        if (dayEntryIndex > -1) {
          intervals.splice(dayEntryIndex, 1);
        }
      }
    }
    setForm((prev) => ({
      ...prev,
      rotationSchedule: { ...prev.rotationSchedule, intervals },
    }));
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const seatArray = (form.seatLayout || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s);

    const unavailableArray = (form.unavailableDates || "")
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d);

    const payload = {
      ...form,
      seatLayout: seatArray,
      unavailableDates: unavailableArray,
      // For non-rotating buses, send the top-level points & fares; otherwise keep them empty
      boardingPoints: !form.rotationSchedule.isRotating
        ? cleanPoints(boardingPoints)
        : [],
      droppingPoints: !form.rotationSchedule.isRotating
        ? cleanPoints(droppingPoints)
        : [],
      fares: !form.rotationSchedule.isRotating ? fares : [],
      rotationSchedule: {
        ...form.rotationSchedule,
        rotationLength: form.rotationSchedule.isRotating
          ? parseInt(form.rotationSchedule.rotationLength, 10)
          : undefined,
        // Ensure intervals are clean and correctly formatted for the API
        intervals: form.rotationSchedule.isRotating
          ? (form.rotationSchedule.intervals || []).map((i) => ({
              ...i,
              dayOffset: parseInt(i.dayOffset, 10),
              turns: (i.turns || []).map((t) => ({
                departureTime: t.departureTime || "",
                arrivalTime: t.arrivalTime || "",
                boardingPoints: cleanPoints(t.boardingPoints),
                droppingPoints: cleanPoints(t.droppingPoints),
              })),
            }))
          : [],
      },
    };

    try {
      await apiClient.put(`/buses/${busId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("✅ Bus updated successfully!");
      navigate("/admin/buses");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update bus");
      console.error("Update failed:", err);
    }
  };

  if (loading) return <div className="p-6 text-center text-lg">Loading...</div>;
  if (error)
    return <div className="p-6 text-center text-lg text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-700 border-b pb-3">
        Edit Bus Details
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- Bus Information --- */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Bus Information
          </legend>
          <div className="space-y-4 mt-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bus Name/Number
              </label>
              <input
                id="name"
                name="name"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label
                htmlFor="operator"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Assign Operator
              </label>
              <select
                id="operator"
                name="operator"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.operator}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Operator --</option>
                {operators.map((op) => (
                  <option key={op._id} value={op._id}>
                    {op.fullName || op.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="operatorLogo"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Operator Logo URL
              </label>
              <input
                id="operatorLogo"
                name="operatorLogo"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.operatorLogo}
                onChange={handleChange}
              />
            </div>
            <div>
              <label
                htmlFor="busType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Bus Type
              </label>
              <select
                id="busType"
                name="busType"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.busType}
                onChange={handleChange}
              >
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
                <option value="Sleeper">Sleeper</option>
              </select>
            </div>

            <SeatLayoutSelector
              selectedLayout={form.seatLayout}
              onLayoutChange={handleLayoutChange}
            />
          </div>
        </fieldset>

        {/* --- Pricing --- */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Pricing
          </legend>
          <div className="space-y-4 mt-2">
            <div>
              <label
                htmlFor="price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Default Ticket Price (Rs.)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>
            <div className="p-4 border-t pt-4">
              <label className="block text-base font-semibold text-gray-700 mb-2">
                Convenience Fee
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Type
                  </label>
                  <select
                    name="amountType"
                    value={form.convenienceFee.amountType}
                    onChange={handleConvenienceFeeChange}
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                  >
                    <option value="fixed">Fixed (LKR)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fee Value
                  </label>
                  <input
                    type="number"
                    name="value"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.convenienceFee.value}
                    onChange={handleConvenienceFeeChange}
                  />
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* --- Route & Schedule (Non-Rotating) --- */}
        {!form.rotationSchedule.isRotating && (
          <>
            <fieldset className="border p-4 rounded-md">
              <legend className="text-lg font-semibold text-gray-600 px-2">
                Route & Schedule
              </legend>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label
                    htmlFor="from"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    From
                  </label>
                  <input
                    id="from"
                    name="from"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.from}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="to"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    To
                  </label>
                  <input
                    id="to"
                    name="to"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.to}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date of Journey
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="departureTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Departure Time
                  </label>
                  <input
                    id="departureTime"
                    name="departureTime"
                    type="time"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="arrivalTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Arrival Time
                  </label>
                  <input
                    id="arrivalTime"
                    name="arrivalTime"
                    type="time"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.arrivalTime}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="border p-4 rounded-md">
              <legend className="text-lg font-semibold text-gray-600 px-2">
                Boarding & Dropping Points
              </legend>
              <div className="space-y-6 mt-2">
                <PointManager
                  points={boardingPoints}
                  setPoints={setBoardingPoints}
                  pointType="Boarding"
                />
                <hr />
                <PointManager
                  points={droppingPoints}
                  setPoints={setDroppingPoints}
                  pointType="Dropping"
                />
              </div>
            </fieldset>

            <PriceMatrix
              boardingPoints={boardingPoints}
              droppingPoints={droppingPoints}
              fares={fares}
              setFares={setFares}
            />
          </>
        )}

        {/* --- Availability & Features --- */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Availability & Features
          </legend>
          <div className="space-y-4 mt-2">
            <div>
              <label
                htmlFor="unavailableDates"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Unavailable Dates (comma-separated)
              </label>
              <textarea
                id="unavailableDates"
                name="unavailableDates"
                className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                value={form.unavailableDates}
                onChange={handleChange}
                rows={2}
                placeholder="YYYY-MM-DD,YYYY-MM-DD"
              />
            </div>
            <div className="flex items-center">
              <input
                id="isAvailable"
                type="checkbox"
                name="isAvailable"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                checked={form.isAvailable}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isAvailable: e.target.checked }))
                }
              />
              <label
                htmlFor="isAvailable"
                className="ml-2 block text-sm text-gray-900"
              >
                Bus is currently available
              </label>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Features:</p>
              <div className="flex items-center">
                <input
                  id="wifi"
                  type="checkbox"
                  name="wifi"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={form.features.wifi}
                  onChange={(e) => handleCheckboxChange(e, "features")}
                />
                <label
                  htmlFor="wifi"
                  className="ml-2 block text-sm text-gray-900"
                >
                  WiFi Available
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="chargingPort"
                  type="checkbox"
                  name="chargingPort"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={form.features.chargingPort}
                  onChange={(e) => handleCheckboxChange(e, "features")}
                />
                <label
                  htmlFor="chargingPort"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Charging Ports
                </label>
              </div>
            </div>
          </div>
        </fieldset>

        {/* --- Trending Offer --- */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Trending Offer
          </legend>
          <div className="space-y-4 mt-2">
            <div className="flex items-center">
              <input
                id="isActive"
                type="checkbox"
                name="isActive"
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                checked={form.trendingOffer.isActive}
                onChange={handleTrendingOfferChange}
              />
              <label
                htmlFor="isActive"
                className="ml-2 block text-sm text-gray-900"
              >
                Activate Trending Offer
              </label>
            </div>
            {form.trendingOffer.isActive && (
              <>
                <div>
                  <label
                    htmlFor="discountPercent"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Discount (%)
                  </label>
                  <input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.trendingOffer.discountPercent}
                    onChange={handleTrendingOfferChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Offer Message
                  </label>
                  <input
                    id="message"
                    name="message"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.trendingOffer.message}
                    onChange={handleTrendingOfferChange}
                  />
                </div>
                <div>
                  <label
                    htmlFor="expiry"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Offer Expiry Date
                  </label>
                  <input
                    id="expiry"
                    name="expiry"
                    type="date"
                    className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                    value={form.trendingOffer.expiry}
                    onChange={handleTrendingOfferChange}
                  />
                </div>
              </>
            )}
          </div>
        </fieldset>

        {/* --- Rotating Schedule --- */}
        <fieldset className="border p-4 rounded-md mt-6">
          <legend className="text-lg font-semibold text-gray-600">
            Rotating Schedule
          </legend>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isRotating"
                checked={form.rotationSchedule.isRotating}
                onChange={handleRotationChange}
                className="mr-2 h-4 w-4"
              />
              Enable Rotating Schedule
            </label>

            {form.rotationSchedule.isRotating && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.rotationSchedule.startDate || ""}
                      onChange={handleRotationChange}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rotation Length (days)
                    </label>
                    <input
                      type="number"
                      name="rotationLength"
                      value={form.rotationSchedule.rotationLength || ""}
                      onChange={handleRotationChange}
                      placeholder="e.g., 2 for a 2-day cycle"
                      className="w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm"
                      required
                    />
                  </div>
                </div>

                {getDaysForRotation().map((dayOffset) => (
                  <div
                    key={dayOffset}
                    className="border p-3 rounded-md bg-gray-50 mt-4"
                  >
                    <h4 className="font-semibold text-gray-800">
                      Day {dayOffset + 1} of Rotation
                    </h4>
                    {(
                      form.rotationSchedule.intervals.find(
                        (i) => i.dayOffset === dayOffset
                      )?.turns || []
                    ).map((turn, tIndex) => (
                      <div
                        key={tIndex}
                        className="border p-3 rounded-md mb-2 mt-2 bg-white shadow-sm"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-semibold">Turn {tIndex + 1}</h5>
                          <button
                            type="button"
                            onClick={() => removeDayTurn(dayOffset, tIndex)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove Turn
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm block font-medium">
                              Departure Time
                            </label>
                            <input
                              type="time"
                              value={turn.departureTime || ""}
                              onChange={(e) =>
                                handleIntervalChange(
                                  dayOffset,
                                  tIndex,
                                  "departureTime",
                                  e.target.value
                                )
                              }
                              className="border px-2 py-1 rounded-md w-full"
                            />
                          </div>
                          <div>
                            <label className="text-sm block font-medium">
                              Arrival Time
                            </label>
                            <input
                              type="time"
                              value={turn.arrivalTime || ""}
                              onChange={(e) =>
                                handleIntervalChange(
                                  dayOffset,
                                  tIndex,
                                  "arrivalTime",
                                  e.target.value
                                )
                              }
                              className="border px-2 py-1 rounded-md w-full"
                            />
                          </div>
                        </div>

                        {/* Rotated Point Manager Integration */}
                        <div className="mt-4">
                          <RotatedPointManager
                            label="Boarding Points"
                            points={turn.boardingPoints || []}
                            onChange={(updatedPoints) =>
                              handleIntervalChange(
                                dayOffset,
                                tIndex,
                                "boardingPoints",
                                updatedPoints
                              )
                            }
                          />
                        </div>
                        <div className="mt-4">
                          <RotatedPointManager
                            label="Dropping Points"
                            points={turn.droppingPoints || []}
                            onChange={(updatedPoints) =>
                              handleIntervalChange(
                                dayOffset,
                                tIndex,
                                "droppingPoints",
                                updatedPoints
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline text-sm mt-2"
                      onClick={() => addDayTurn(dayOffset)}
                    >
                      + Add Turn for Day {dayOffset + 1}
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </fieldset>

        <div className="pt-2">
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-md shadow-sm"
          >
            Update Bus
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBus;
