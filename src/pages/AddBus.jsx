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
    // --- NEW: Contacts (Admin only) ---
    conductor: {
      name: "",
      mobile: "",
      altMobile: "",
    },
    owner: {
      name: "",
    },
    ownerNotifyMobile: "",

    // ✅ NEW: Media (Cloudinary) + richer info
    media: {
      cover: { url: "", publicId: "" },
      gallery: [], // [{url, publicId, caption}]
    },
    routeMeta: {
      via: [], // array of strings
      distanceKm: "",
      durationMin: "",
    },
    facilities: {
      ac: false,
      recliner: false,
      tv: false,
      music: false,
      blanket: false,
      water: false,
      restroom: false,
      gps: false,
      liveTracking: false,
      luggage: false,
      usb: false,
      readingLight: false,
      airSuspension: false,
      extraTags: [],
    },
    vehicle: {
      registrationNo: "",
      year: "",
      make: "",
      model: "",
      seatCount: "",
    },
    // Free-form
    details: "",
    detailsHtml: "",
    tags: [],
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

  // ✅ NEW: Cloudinary upload states
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  // ---- NEW: UI selection for rotated point manager
  const [selectedDayOffset, setSelectedDayOffset] = useState(null);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState(null);

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

  // Keep selected Day/Turn sensible as intervals change
  useEffect(() => {
    const intervals = form.rotationSchedule.intervals || [];
    if (!intervals.length) {
      setSelectedDayOffset(null);
      setSelectedTurnIndex(null);
      return;
    }
    // If no day selected, select first available
    let day = selectedDayOffset;
    if (
      day === null ||
      !intervals.find((i) => i.dayOffset === day && (i.turns || []).length)
    ) {
      const firstWithTurns = intervals.find((i) => (i.turns || []).length);
      day = firstWithTurns ? firstWithTurns.dayOffset : intervals[0].dayOffset;
    }

    const turns =
      intervals.find((i) => i.dayOffset === day)?.turns || [];
    let turnIdx = selectedTurnIndex;
    if (turnIdx === null || turnIdx >= turns.length) {
      turnIdx = turns.length ? 0 : null;
    }

    setSelectedDayOffset(day);
    setSelectedTurnIndex(turnIdx);
  }, [form.rotationSchedule.intervals]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ✅ NEW: Facilities change
  const handleFacilitiesChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [name]: checked },
    }));
  };

  // ✅ NEW: Tags & via management
  const parseCommaList = (val) =>
    val
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

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
    // ensure turn exists
    if (!dayEntry.turns[turnIndex]) {
      dayEntry.turns[turnIndex] = {
        departureTime: "",
        arrivalTime: "",
        boardingPoints: [],
        droppingPoints: [],
      };
    }
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
    // Initialize a new turn by touching a field (guarantees arrays exist)
    const turns =
      form.rotationSchedule.intervals.find((i) => i.dayOffset === dayOffset)
        ?.turns || [];
    const newTurnIndex = turns.length;
    handleIntervalChange(dayOffset, newTurnIndex, "departureTime", "");
    // also set selection to the newly added turn for convenience
    setSelectedDayOffset(dayOffset);
    setSelectedTurnIndex(newTurnIndex);
  };

  const removeDayTurn = (dayOffset, turnIndex) => {
    setForm((prev) => {
      const intervals = [...(prev.rotationSchedule.intervals || [])];
      const dayIdx = intervals.findIndex((i) => i.dayOffset === dayOffset);
      if (dayIdx === -1) return prev;
      const turns = intervals[dayIdx].turns || [];
      turns.splice(turnIndex, 1);
      if (!turns.length) {
        intervals.splice(dayIdx, 1);
      } else {
        intervals[dayIdx].turns = turns;
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

  // ✅ NEW: Cloudinary uploaders for cover / gallery
  const uploadToCloudinary = async (file, folder) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await apiClient.post(`/upload?folder=${encodeURIComponent(folder)}`, fd, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data; // { imageUrl, publicId }
  };

  const onPickCover = async (file) => {
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const { imageUrl, publicId } = await uploadToCloudinary(file, "buses/covers");
      setForm((prev) => ({
        ...prev,
        media: { ...prev.media, cover: { url: imageUrl, publicId } },
      }));
    } catch (e) {
      alert("Cover upload failed.");
    } finally {
      setIsUploadingCover(false);
    }
  };

  const onPickGallery = async (files) => {
    if (!files?.length) return;
    try {
      setIsUploadingGallery(true);
      const next = [];
      for (const f of files) {
        const { imageUrl, publicId } = await uploadToCloudinary(f, "buses/gallery");
        next.push({ url: imageUrl, publicId, caption: "" });
      }
      setForm((prev) => ({
        ...prev,
        media: { ...prev.media, gallery: [...prev.media.gallery, ...next] },
      }));
    } catch (e) {
      alert("Gallery upload failed.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryItem = (idx) => {
    setForm((prev) => {
      const g = [...prev.media.gallery];
      g.splice(idx, 1);
      return { ...prev, media: { ...prev.media, gallery: g } };
    });
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
      // only include top-level points & fares when NOT rotating
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
          ? parseInt(form.rotationSchedule.rotationLength)
          : undefined,
        intervals: form.rotationSchedule.isRotating
          ? (form.rotationSchedule.intervals || []).map((i) => ({
              dayOffset: parseInt(i.dayOffset),
              turns: (i.turns || []).map((t) => ({
                departureTime: t.departureTime || "",
                arrivalTime: t.arrivalTime || "",
                // ✅ NEW: include per-turn points (cleaned)
                boardingPoints: cleanPoints(t.boardingPoints),
                droppingPoints: cleanPoints(t.droppingPoints),
              })),
            }))
          : [],
      },
      // ✅ Normalize extra structured inputs
      routeMeta: {
        via: Array.isArray(form.routeMeta.via)
          ? form.routeMeta.via
          : parseCommaList(String(form.routeMeta.via || "")),
        distanceKm:
          form.routeMeta.distanceKm === "" ? undefined : Number(form.routeMeta.distanceKm),
        durationMin:
          form.routeMeta.durationMin === "" ? undefined : Number(form.routeMeta.durationMin),
      },
      facilities: {
        ...form.facilities,
        extraTags: Array.isArray(form.facilities.extraTags)
          ? form.facilities.extraTags
          : parseCommaList(String(form.facilities.extraTags || "")),
      },
      vehicle: {
        registrationNo: form.vehicle.registrationNo,
        year: form.vehicle.year ? Number(form.vehicle.year) : undefined,
        make: form.vehicle.make,
        model: form.vehicle.model,
        seatCount: form.vehicle.seatCount ? Number(form.vehicle.seatCount) : undefined,
      },
      tags: Array.isArray(form.tags) ? form.tags : parseCommaList(String(form.tags || "")),
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

  // helpers to read currently selected turn (for the Rotated Points Manager)
  const intervals = form.rotationSchedule.intervals || [];
  const selectedDayEntry =
    selectedDayOffset === null
      ? null
      : intervals.find((i) => i.dayOffset === selectedDayOffset) || null;
  const selectedTurn =
    selectedDayEntry &&
    selectedTurnIndex !== null &&
    (selectedDayEntry.turns || [])[selectedTurnIndex]
      ? selectedDayEntry.turns[selectedTurnIndex]
      : null;

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

              {/* ✅ NEW: Route details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className={LABEL}>Via (comma separated)</label>
                  <input
                    className={INPUT}
                    placeholder="Matara, Galle, Kalutara"
                    value={Array.isArray(form.routeMeta.via) ? form.routeMeta.via.join(", ") : form.routeMeta.via}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        routeMeta: { ...prev.routeMeta, via: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Distance (km)</label>
                  <input
                    type="number"
                    min="0"
                    className={INPUT}
                    placeholder="e.g., 180"
                    value={form.routeMeta.distanceKm}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        routeMeta: { ...prev.routeMeta, distanceKm: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Duration (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    className={INPUT}
                    placeholder="e.g., 240"
                    value={form.routeMeta.durationMin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        routeMeta: { ...prev.routeMeta, durationMin: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Boarding & Dropping */}
          {!form.rotationSchedule.isRotating && (
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
          )}

          {/* Price Matrix */}
          {!form.rotationSchedule.isRotating && (
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
          )}

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

          {/* ✅ NEW: Media (Cover + Gallery via Cloudinary) */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Media</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={LABEL}>Cover Photo</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickCover(e.target.files?.[0])}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {isUploadingCover && (
                      <span className="text-xs text-gray-500">Uploading…</span>
                    )}
                    {form.media.cover?.url && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            media: { ...prev.media, cover: { url: "", publicId: "" } },
                          }))
                        }
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.media.cover?.url && (
                    <div className="mt-3">
                      <img
                        src={form.media.cover.url}
                        alt="Cover preview"
                        className="h-28 w-auto rounded border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className={LABEL}>Gallery Images</label>
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => onPickGallery(e.target.files)}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {isUploadingGallery && (
                      <span className="text-xs text-gray-500">Uploading…</span>
                    )}
                  </div>
                  {form.media.gallery?.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {form.media.gallery.map((g, idx) => (
                        <div key={idx} className="relative">
                          <img
                            src={g.url}
                            alt={`Gallery ${idx + 1}`}
                            className="h-24 w-full object-cover rounded border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryItem(idx)}
                            className="absolute -top-2 -right-2 bg-white border border-red-200 text-red-600 rounded-full px-2 py-0.5 text-xs shadow"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ✅ NEW: Facilities (expanded) */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Facilities</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["ac","recliner","tv","music","blanket","water","restroom","gps","liveTracking","luggage","usb","readingLight","airSuspension"].map((key) => (
                  <label key={key} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={key}
                      checked={!!form.facilities[key]}
                      onChange={handleFacilitiesChange}
                    />
                    <span className="text-sm text-gray-700">{key}</span>
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className={LABEL}>Extra Tags (comma separated)</label>
                  <input
                    className={INPUT}
                    placeholder="Ladies seat, 2+2 layout"
                    value={Array.isArray(form.facilities.extraTags) ? form.facilities.extraTags.join(", ") : form.facilities.extraTags}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        facilities: { ...prev.facilities, extraTags: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Public Tags (comma separated)</label>
                  <input
                    className={INPUT}
                    placeholder="Express, Highway"
                    value={Array.isArray(form.tags) ? form.tags.join(", ") : form.tags}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tags: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ✅ NEW: Vehicle details */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Vehicle Details</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <label className={LABEL}>Registration No</label>
                  <input
                    className={INPUT}
                    placeholder="ND-1234"
                    value={form.vehicle.registrationNo}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, registrationNo: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Year</label>
                  <input
                    type="number"
                    className={INPUT}
                    placeholder="2019"
                    value={form.vehicle.year}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, year: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Make</label>
                  <input
                    className={INPUT}
                    placeholder="Ashok Leyland"
                    value={form.vehicle.make}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, make: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Model</label>
                  <input
                    className={INPUT}
                    placeholder="Viking"
                    value={form.vehicle.model}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, model: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Seat Count</label>
                  <input
                    type="number"
                    min="1"
                    className={INPUT}
                    placeholder="49"
                    value={form.vehicle.seatCount}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        vehicle: { ...prev.vehicle, seatCount: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Rotating Schedule (turns only) */}
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

                      {(form.rotationSchedule.intervals.find(
                        (i) => i.dayOffset === dayOffset
                      )?.turns || []
                      ).map((turn, tIndex) => (
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
                                value={turn?.departureTime || ""}
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
                                value={turn?.arrivalTime || ""}
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
                                onClick={() => removeDayTurn(dayOffset, tIndex)}
                                className="w-full text-red-600 text-sm border border-red-200 rounded-md px-3 py-2 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          {/* ⬆️ Only times here. Points handled in dedicated section below. */}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ✅ NEW: Rotated Points Manager (separate section with Day/Turn dropdowns) */}
          {form.rotationSchedule.isRotating && (
            <section className={CARD}>
              <div className={CARD_HEAD}>
                <h2 className="text-base font-semibold text-gray-800">
                  Rotated Points Manager
                </h2>
              </div>
              <div className={CARD_BODY}>
                {intervals.length === 0 ||
                !intervals.some((i) => (i.turns || []).length) ? (
                  <p className="text-sm text-gray-500">
                    Add at least one turn in the Rotating Schedule above to
                    manage boarding/dropping points.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className={LABEL}>Day of Rotation</label>
                        <select
                          className={INPUT}
                          value={selectedDayOffset ?? ""}
                          onChange={(e) => {
                            const nextDay = Number(e.target.value);
                            setSelectedDayOffset(nextDay);
                            // reset turn to first available for this day
                            const turns =
                              intervals.find((i) => i.dayOffset === nextDay)
                                ?.turns || [];
                            setSelectedTurnIndex(turns.length ? 0 : null);
                          }}
                        >
                          {intervals
                            .filter((i) => (i.turns || []).length)
                            .map((i) => (
                              <option key={i.dayOffset} value={i.dayOffset}>
                                Day {i.dayOffset}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className={LABEL}>Turn</label>
                        <select
                          className={INPUT}
                          value={selectedTurnIndex ?? ""}
                          onChange={(e) =>
                            setSelectedTurnIndex(Number(e.target.value))
                          }
                        >
                          {(selectedDayEntry?.turns || []).map((_, idx) => (
                            <option key={idx} value={idx}>
                              Turn {idx + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <div className="text-xs text-gray-500">
                          Set boarding & dropping points for the selected
                          Day/Turn.
                        </div>
                      </div>
                    </div>

                    {selectedTurn ? (
                      <>
                        <div className="mb-6">
                          <RotatedPointManager
                            label="Boarding Points"
                            points={selectedTurn.boardingPoints || []}
                            onChange={(updatedPoints) =>
                              handleIntervalChange(
                                selectedDayOffset,
                                selectedTurnIndex,
                                "boardingPoints",
                                updatedPoints
                              )
                            }
                          />
                        </div>
                        <div>
                          <RotatedPointManager
                            label="Dropping Points"
                            points={selectedTurn.droppingPoints || []}
                            onChange={(updatedPoints) =>
                              handleIntervalChange(
                                selectedDayOffset,
                                selectedTurnIndex,
                                "droppingPoints",
                                updatedPoints
                              )
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">
                        No turns found for the selected day.
                      </p>
                    )}
                  </>
                )}
              </div>
            </section>
          )}

          {/* ✅ NEW: Contacts (Admin Only) */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Contacts (Admin)</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={LABEL}>Conductor Name</label>
                  <input
                    className={INPUT}
                    placeholder="e.g., Kamal Perera"
                    value={form.conductor.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        conductor: { ...prev.conductor, name: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Conductor Mobile</label>
                  <input
                    className={INPUT}
                    placeholder="0771234567"
                    value={form.conductor.mobile}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        conductor: { ...prev.conductor, mobile: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Conductor Alt Mobile (optional)</label>
                  <input
                    className={INPUT}
                    placeholder="0719876543"
                    value={form.conductor.altMobile}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        conductor: {
                          ...prev.conductor,
                          altMobile: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Owner Name</label>
                  <input
                    className={INPUT}
                    placeholder="Lakshan Transport (Pvt) Ltd"
                    value={form.owner.name}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        owner: { ...prev.owner, name: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={LABEL}>Owner Notify Mobile</label>
                  <input
                    className={INPUT}
                    placeholder="0777654321"
                    value={form.ownerNotifyMobile}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ownerNotifyMobile: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                These contacts are stored with the bus and can be used later for notifications.
              </p>
            </div>
          </section>

          {/* ✅ NEW: Free-form details */}
          <section className={CARD}>
            <div className={CARD_HEAD}>
              <h2 className="text-base font-semibold text-gray-800">Extra Details</h2>
            </div>
            <div className={CARD_BODY}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <label className={LABEL}>Details (plain/markdown)</label>
                  <textarea
                    rows={5}
                    className={INPUT}
                    placeholder="Write anything about this bus (policies, notes, highlights)…"
                    value={form.details}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, details: e.target.value }))
                    }
                  />
                </div>
                <div className="md:col-span-1">
                  <label className={LABEL}>Details HTML (optional)</label>
                  <textarea
                    rows={5}
                    className={INPUT}
                    placeholder="<p>Rich content with <strong>HTML</strong>…</p>"
                    value={form.detailsHtml}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, detailsHtml: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
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
