// src/pages/AddBus.jsx
import { useState, useEffect, useMemo } from "react";
// ✅ use the shared API client instead of axios
import apiClient from "../api";
import { useNavigate } from "react-router-dom";
import SeatLayoutSelector from "../components/SeatLayoutSelector";
import PointManager from "../components/PointManager";
import PriceMatrix from "../components/PriceMatrix";
import RotatedPointManager from "../components/RotatedPointManager"; // ✅ NEW

// Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

const LABEL = "text-sm font-medium text-gray-700";
const INPUT =
  "w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";
const CARD = "bg-white rounded-xl shadow-sm ring-1 ring-gray-200";
const CARD_HEAD = "px-5 py-3 border-b bg-gray-50 rounded-t-xl";
const CARD_BODY = "p-5";

// ---- NEW: tiny helper for local file -> base64 data URL (no backend needed)
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ✅ NEW: sanitize [{time, point}]
const cleanPoints = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map(({ time, point }) => ({
      time: String(time || "").trim(),
      point: String(point || "").trim(),
    }))
    .filter((r) => r.time && r.point);

const AddBus = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    date: getTodayDate(),
    departureTime: "",
    arrivalTime: "",
    busType: "AC",
    seatLayout: "",
    price: "",
    operatorLogo: "",
    unavailableDates: "",
    isAvailable: true,
    operator: "",
    features: {
      wifi: false,
      chargingPort: false,
    },
    trendingOffer: {
      isActive: false,
      discountPercent: 0,
      message: "",
      expiry: null,
      // ---- NEW: optional image for the offer
      imageUrl: "",
    },
    convenienceFee: {
      amountType: "fixed",
      value: 0,
    },
    // --- START: rotationSchedule state (unchanged logic) ---
    rotationSchedule: {
      isRotating: false,
      startDate: "",
      rotationLength: "",
      intervals: [],
    },
    // --- END ---
  });

  const [operators, setOperators] = useState([]);
  const [boardingPoints, setBoardingPoints] = useState([
    { time: "", point: "" },
  ]);
  const [droppingPoints, setDroppingPoints] = useState([
    { time: "", point: "" },
  ]);
  const [fares, setFares] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // ---- NEW: lightweight local upload states (optional)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingOfferImage, setIsUploadingOfferImage] = useState(false);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await apiClient.get("/admin/operators", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (res.data && res.data.length > 0) {
          setOperators(res.data);
          setForm((prevForm) => ({ ...prevForm, operator: res.data[0]._id }));
        } else {
          setError(
            "No operators found. Please add an operator before adding a bus."
          );
        }
      } catch (err) {
        console.error("Failed to load operators:", err);
        setError(
          "Could not load operators. Please ensure the API route is correct."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchOperators();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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

  const handleFeatureChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      features: { ...prev.features, [name]: checked },
    }));
  };

  // --- START: Rotating Schedule handlers (logic unchanged) ---
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

  const handleIntervalChange = (dayOffset, turnIndex, field, value) => {
    const intervals = [...form.rotationSchedule.intervals];
    let dayEntry = intervals.find((i) => i.dayOffset === dayOffset);
    if (!dayEntry) {
      dayEntry = { dayOffset, turns: [] };
      intervals.push(dayEntry);
      intervals.sort((a, b) => a.dayOffset - b.dayOffset);
    }
    dayEntry.turns = dayEntry.turns || [];
    dayEntry.turns[turnIndex] = {
      ...dayEntry.turns[turnIndex],
      [field]: value,
    };
    setForm((prev) => ({
      ...prev,
      rotationSchedule: { ...prev.rotationSchedule, intervals },
    }));
  };

  const addDayTurn = (dayOffset) => {
    setForm((prev) => {
      const intervals = [...(prev.rotationSchedule.intervals || [])];
      let dayEntry = intervals.find((i) => i.dayOffset === dayOffset);
      if (dayEntry) {
        dayEntry.turns = [
          ...(dayEntry.turns || []),
          {
            departureTime: "",
            arrivalTime: "",
            boardingPoints: [],
            droppingPoints: [],
          }, // ✅ NEW arrays
        ];
      } else {
        intervals.push({
          dayOffset,
          turns: [
            {
              departureTime: "",
              arrivalTime: "",
              boardingPoints: [],
              droppingPoints: [],
            },
          ], // ✅ NEW arrays
        });
        intervals.sort((a, b) => a.dayOffset - b.dayOffset);
      }
      return {
        ...prev,
        rotationSchedule: { ...prev.rotationSchedule, intervals },
      };
    });
  };

  const removeDayTurn = (dayOffset, turnIndex) => {
    setForm((prev) => {
      const intervals = [...(prev.rotationSchedule.intervals || [])];
      const dayIndex = intervals.findIndex((i) => i.dayOffset === dayOffset);
      if (dayIndex === -1) return prev;
      const updatedTurns = intervals[dayIndex].turns.filter(
        (_, tIdx) => tIdx !== turnIndex
      );
      if (updatedTurns.length === 0) {
        intervals.splice(dayIndex, 1);
      } else {
        intervals[dayIndex].turns = updatedTurns;
      }
      return {
        ...prev,
        rotationSchedule: { ...prev.rotationSchedule, intervals },
      };
    });
  };

  const getDaysForRotation = () => {
    const rotationLength = Number(form.rotationSchedule.rotationLength);
    return isNaN(rotationLength) || rotationLength <= 0
      ? []
      : [...Array(rotationLength).keys()];
  };
  // --- END ---

  // ---- NEW: local PC file uploads (logo + offer image)
  const onPickOperatorLogo = async (file) => {
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      // (Optional) minimal guard: ~1.5MB cap
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Please choose an image smaller than 1.5 MB.");
        return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setForm((prev) => ({ ...prev, operatorLogo: dataUrl }));
    } catch (e) {
      alert("Failed to load image. Try a different file.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const onPickOfferImage = async (file) => {
    if (!file) return;
    try {
      setIsUploadingOfferImage(true);
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Please choose an image smaller than 1.5 MB.");
        return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setForm((prev) => ({
        ...prev,
        trendingOffer: { ...prev.trendingOffer, imageUrl: dataUrl },
      }));
    } catch (e) {
      alert("Failed to load image. Try a different file.");
    } finally {
      setIsUploadingOfferImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.operator) {
      alert(
        "Operator is not selected. Please select an operator from the list."
      );
      return;
    }

    const seatArray = form.seatLayout
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s);

    const unavailableArray = form.unavailableDates
      ? form.unavailableDates
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d)
      : [];

    // --- START: payload processing for rotation (unchanged shape, now includes per-turn points) ---
    const payload = {
      ...form,
      seatLayout: seatArray,
      unavailableDates: unavailableArray,
      boardingPoints, // keep global as-is (you already use this elsewhere)
      droppingPoints, // keep global as-is
      fares,
      rotationSchedule: {
        ...form.rotationSchedule,
        rotationLength: form.rotationSchedule.isRotating
          ? parseInt(form.rotationSchedule.rotationLength)
          : undefined,
        intervals: form.rotationSchedule.isRotating
          ? (form.rotationSchedule.intervals || []).map((i) => ({
              dayOffset: parseInt(i.dayOffset),
              turns: (i.turns || []).map((t) => ({
                departureTime: t.departureTime,
                arrivalTime: t.arrivalTime,
                // ✅ NEW: include per-turn points (cleaned)
                boardingPoints: cleanPoints(t.boardingPoints),
                droppingPoints: cleanPoints(t.droppingPoints),
              })),
            }))
          : [],
      },
    };
    // --- END ---

    try {
      await apiClient.post("/buses", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      alert("Bus added successfully!");
      navigate("/admin/buses");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add bus");
    }
  };

  const summary = useMemo(
    () => ({
      title: form.name || "New Bus",
      route: form.from && form.to ? `${form.from} → ${form.to}` : "Set route",
      time:
        form.departureTime && form.arrivalTime
          ? `${form.departureTime} → ${form.arrivalTime}`
          : "Set time",
      type: form.busType,
      price: form.price
        ? `Rs. ${Number(form.price).toLocaleString()}`
        : "Price not set",
      available: form.isAvailable,
    }),
    [form]
  );

  if (isLoading)
    return <div className="p-6 text-center text-lg">Loading...</div>;
  if (error)
    return <div className="p-6 text-center text-lg text-red-500">{error}</div>;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          Add New Bus
        </h1>
        <p className="text-gray-500 mt-1">
          Enter route, timing, layout and pricing. You can preview details in
          the right pane.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Left: Main form (2 cols) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Bus & Operator */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">
                Bus & Operator
              </h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className={LABEL}>
                    Bus Name/Number
                  </label>
                  <input
                    id="name"
                    name="name"
                    className={INPUT}
                    placeholder="Ex: SuperLine 07"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="operator" className={LABEL}>
                    Assign Operator
                  </label>
                  <select
                    id="operator"
                    name="operator"
                    className={INPUT}
                    value={form.operator}
                    onChange={handleChange}
                    required
                  >
                    {operators.map((op) => (
                      <option key={op._id} value={op._id}>
                        {op.fullName || op.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ----- Operator Logo: URL or Upload from PC (NEW) ----- */}
                <div className="md:col-span-2">
                  <label htmlFor="operatorLogo" className={LABEL}>
                    Operator Logo URL
                  </label>
                  <input
                    id="operatorLogo"
                    name="operatorLogo"
                    className={INPUT}
                    placeholder="https://.../logo.png (or upload below)"
                    value={form.operatorLogo}
                    onChange={handleChange}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickOperatorLogo(e.target.files?.[0])}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {isUploadingLogo && (
                      <span className="text-xs text-gray-500">Loading…</span>
                    )}
                    {form.operatorLogo && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({ ...prev, operatorLogo: "" }))
                        }
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.operatorLogo && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-1">
                        Preview (stored in <code>operatorLogo</code>)
                      </p>
                      <img
                        src={form.operatorLogo}
                        alt="Operator logo preview"
                        className="h-16 w-auto rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="busType" className={LABEL}>
                    Bus Type
                  </label>
                  <select
                    id="busType"
                    name="busType"
                    className={INPUT}
                    value={form.busType}
                    onChange={handleChange}
                  >
                    <option value="AC">AC</option>
                    <option value="Non-AC">Non-AC</option>
                    <option value="Sleeper">Sleeper</option>
                  </select>
                </div>
              </div>

              <div className="mt-5">
                <label className={`${LABEL} block mb-2`}>Seat Layout</label>
                <SeatLayoutSelector
                  selectedLayout={form.seatLayout}
                  onLayoutChange={handleLayoutChange}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Tip: You can paste comma separated seats (e.g., A1, A2,
                  B1...).
                </p>
              </div>
            </div>
          </section>

          {/* Route & Schedule */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">
                Route & Schedule
              </h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="from" className={LABEL}>
                    From
                  </label>
                  <input
                    id="from"
                    name="from"
                    className={INPUT}
                    placeholder="Colombo"
                    value={form.from}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="to" className={LABEL}>
                    To
                  </label>
                  <input
                    id="to"
                    name="to"
                    className={INPUT}
                    placeholder="Kandy"
                    value={form.to}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="date" className={LABEL}>
                    Date of First Journey
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    className={INPUT}
                    value={form.date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="departureTime" className={LABEL}>
                    Departure Time
                  </label>
                  <input
                    id="departureTime"
                    name="departureTime"
                    type="time"
                    className={INPUT}
                    value={form.departureTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="arrivalTime" className={LABEL}>
                    Arrival Time
                  </label>
                  <input
                    id="arrivalTime"
                    name="arrivalTime"
                    type="time"
                    className={INPUT}
                    value={form.arrivalTime}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="unavailableDates" className={LABEL}>
                    Unavailable Dates
                  </label>
                  <input
                    id="unavailableDates"
                    name="unavailableDates"
                    className={INPUT}
                    placeholder="YYYY-MM-DD, YYYY-MM-DD"
                    value={form.unavailableDates}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma separated. These dates will be blocked from booking.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Boarding & Dropping */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">
                Boarding & Dropping Points
              </h2>
            </div>
            <div className={CARD_BODY}>
              <div className="space-y-6">
                <PointManager
                  points={boardingPoints}
                  setPoints={setBoardingPoints}
                  pointType="Boarding"
                />
                <hr className="border-gray-200" />
                <PointManager
                  points={droppingPoints}
                  setPoints={setDroppingPoints}
                  pointType="Dropping"
                />
              </div>
            </div>
          </section>

          {/* Price Matrix */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">
                Fares Between Points
              </h2>
            </div>
            <div className={CARD_BODY}>
              <PriceMatrix
                boardingPoints={boardingPoints}
                droppingPoints={droppingPoints}
                fares={fares}
                setFares={setFares}
              />
            </div>
          </section>

          {/* Pricing & Fees */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Pricing</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label htmlFor="price" className={LABEL}>
                    Default Ticket Price (Rs.)
                  </label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    className={INPUT}
                    placeholder="1500"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="md:col-span-1">
                  <label className={LABEL}>Fee Type</label>
                  <select
                    name="amountType"
                    value={form.convenienceFee.amountType}
                    onChange={handleConvenienceFeeChange}
                    className={INPUT}
                  >
                    <option value="fixed">Fixed (LKR)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div className="md:col-span-1">
                  <label className={LABEL}>Fee Value</label>
                  <input
                    type="number"
                    name="value"
                    min="0"
                    step="0.01"
                    className={INPUT}
                    placeholder="0"
                    value={form.convenienceFee.value}
                    onChange={handleConvenienceFeeChange}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Convenience fee will be added on top of ticket price.
              </p>
            </div>
          </section>

          {/* Availability, Features & Offers */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">
                Availability, Features & Offers
              </h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <input
                      id="isAvailable"
                      name="isAvailable"
                      type="checkbox"
                      className="h-4 w-4"
                      checked={form.isAvailable}
                      onChange={handleChange}
                    />
                    <label
                      htmlFor="isAvailable"
                      className="text-sm text-gray-700"
                    >
                      Bus is available for booking
                    </label>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Features
                    </p>
                    <div className="flex items-center gap-6">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="wifi"
                          checked={form.features.wifi}
                          onChange={handleFeatureChange}
                        />
                        <span className="text-sm text-gray-700">Wi-Fi</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="chargingPort"
                          checked={form.features.chargingPort}
                          onChange={handleFeatureChange}
                        />
                        <span className="text-sm text-gray-700">
                          Charging Port
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <input
                      id="offerActive"
                      type="checkbox"
                      name="isActive"
                      checked={form.trendingOffer.isActive}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          trendingOffer: {
                            ...prev.trendingOffer,
                            isActive: e.target.checked,
                          },
                        }))
                      }
                    />
                    <label
                      htmlFor="offerActive"
                      className="text-sm text-gray-700"
                    >
                      Enable Promotional Offer
                    </label>
                  </div>

                  {form.trendingOffer.isActive && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className={LABEL}>Discount (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className={INPUT}
                          value={form.trendingOffer.discountPercent}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              trendingOffer: {
                                ...prev.trendingOffer,
                                discountPercent: Number(e.target.value),
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className={LABEL}>Message</label>
                        <input
                          className={INPUT}
                          placeholder="Get 10% off for early booking"
                          value={form.trendingOffer.message}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              trendingOffer: {
                                ...prev.trendingOffer,
                                message: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className={LABEL}>Expiry</label>
                        <input
                          type="date"
                          className={INPUT}
                          value={form.trendingOffer.expiry || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              trendingOffer: {
                                ...prev.trendingOffer,
                                expiry: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      {/* ---- NEW: Offer Image (URL or Upload from PC) ---- */}
                      <div className="md:col-span-3">
                        <label className={LABEL}>Offer Image URL</label>
                        <input
                          className={INPUT}
                          placeholder="https://.../offer.png (or upload below)"
                          value={form.trendingOffer.imageUrl || ""}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              trendingOffer: {
                                ...prev.trendingOffer,
                                imageUrl: e.target.value,
                              },
                            }))
                          }
                        />
                        <div className="mt-2 flex items-center gap-3">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              onPickOfferImage(e.target.files?.[0])
                            }
                            className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                          />
                          {isUploadingOfferImage && (
                            <span className="text-xs text-gray-500">
                              Loading…
                            </span>
                          )}
                          {form.trendingOffer.imageUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  trendingOffer: {
                                    ...prev.trendingOffer,
                                    imageUrl: "",
                                  },
                                }))
                              }
                              className="text-sm text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        {form.trendingOffer.imageUrl && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">
                              Preview (stored in{" "}
                              <code>trendingOffer.imageUrl</code>)
                            </p>
                            <img
                              src={form.trendingOffer.imageUrl}
                              alt="Offer preview"
                              className="h-24 w-auto rounded border border-gray-200"
                            />
                          </div>
                        )}
                      </div>
                      {/* ---- END New Offer Image block ---- */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Rotating Schedule */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">
                  Rotating Schedule
                </h2>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isRotating"
                    checked={form.rotationSchedule.isRotating}
                    onChange={handleRotationChange}
                  />
                  <span>Enable</span>
                </label>
              </div>
            </div>

            {form.rotationSchedule.isRotating && (
              <div className={CARD_BODY}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={LABEL}>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      className={INPUT}
                      value={form.rotationSchedule.startDate}
                      onChange={handleRotationChange}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Rotation Length (days)</label>
                    <input
                      type="number"
                      name="rotationLength"
                      className={INPUT}
                      placeholder="e.g., 12"
                      value={form.rotationSchedule.rotationLength}
                      onChange={handleRotationChange}
                    />
                  </div>
                </div>

                {/* Days grid */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getDaysForRotation().map((dayOffset) => (
                    <div key={dayOffset} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-800">
                          Day {dayOffset}
                        </h4>
                        <button
                          type="button"
                          onClick={() => addDayTurn(dayOffset)}
                          className="text-indigo-600 text-sm hover:underline"
                        >
                          + Add Turn
                        </button>
                      </div>

                      {(
                        form.rotationSchedule.intervals.find(
                          (i) => i.dayOffset === dayOffset
                        )?.turns || []
                      ).map((turn, tIndex) => {
                        // helper to patch only this turn via existing handler
                        const setTurnPatch = (patch) => {
                          Object.entries(patch).forEach(([field, value]) => {
                            handleIntervalChange(
                              dayOffset,
                              tIndex,
                              field,
                              value
                            );
                          });
                        };

                        return (
                          <div
                            key={tIndex}
                            className="rounded-md border border-gray-200 p-3 mb-3 space-y-3"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 items-end">
                              <div className="sm:col-span-2">
                                <label className="text-xs text-gray-600">
                                  Departure
                                </label>
                                <input
                                  type="time"
                                  value={turn.departureTime}
                                  onChange={(e) =>
                                    handleIntervalChange(
                                      dayOffset,
                                      tIndex,
                                      "departureTime",
                                      e.target.value
                                    )
                                  }
                                  className={INPUT}
                                />
                              </div>
                              <div className="sm:col-span-2">
                                <label className="text-xs text-gray-600">
                                  Arrival
                                </label>
                                <input
                                  type="time"
                                  value={turn.arrivalTime}
                                  onChange={(e) =>
                                    handleIntervalChange(
                                      dayOffset,
                                      tIndex,
                                      "arrivalTime",
                                      e.target.value
                                    )
                                  }
                                  className={INPUT}
                                />
                              </div>
                              <div className="sm:col-span-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeDayTurn(dayOffset, tIndex)
                                  }
                                  className="w-full text-red-600 text-sm border border-red-200 rounded-md px-3 py-2 hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {/* ✅ Per-turn boarding points */}
                            <RotatedPointManager
                              label="Boarding point"
                              points={turn.boardingPoints || []}
                              onChange={(next) =>
                                setTurnPatch({ boardingPoints: next })
                              }
                            />

                            {/* ✅ Per-turn dropping points */}
                            <RotatedPointManager
                              label="Dropping point"
                              points={turn.droppingPoints || []}
                              onChange={(next) =>
                                setTurnPatch({ droppingPoints: next })
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/admin/buses")}
              className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-sm"
            >
              Add Bus
            </button>
          </div>
        </div>

        {/* Right: Live Summary */}
        <aside className="lg:sticky lg:top-6 h-fit space-y-6">
          <section className={`${CARD} overflow-hidden`}>
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
              <h3 className="text-white font-semibold">Live Summary</h3>
              <p className="text-indigo-100 text-sm">
                Auto-updates as you type
              </p>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <p className="text-xs text-gray-500">Title</p>
                <p className="font-medium text-gray-900">{summary.title}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Route</p>
                  <p className="font-medium text-gray-900">{summary.route}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Type</p>
                  <p className="font-medium text-gray-900">{summary.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Time</p>
                  <p className="font-medium text-gray-900">{summary.time}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-medium text-gray-900">{summary.price}</p>
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-sm text-gray-700">Available</span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    summary.available
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {summary.available ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </section>

          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h3 className="text-sm font-semibold text-gray-800">Tips</h3>
            </div>
            <div className="p-5 text-sm text-gray-600 space-y-2">
              <p>
                • Use rotation when the bus operates on a repeating multi-day
                cycle.
              </p>
              <p>
                • Set specific fares for point-to-point pairs in the matrix.
              </p>
              <p>
                • Add unavailable dates to block one-off holidays or
                maintenance.
              </p>
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};

export default AddBus;
