// src/pages/EditBus.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../api";
import SeatLayoutSelector from "../components/SeatLayoutSelector";
import PointManager from "../components/PointManager";
import PriceMatrix from "../components/PriceMatrix";
import RotatedPointManager from "../components/RotatedPointManager"; // Make sure this is imported

// ---- Tiny UI helpers (non-breaking) ----
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const INPUT =
  "w-full border border-gray-300 px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500";

// small helper to sanitize [{time, point}] arrays
const cleanPoints = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map(({ time, point }) => ({
      time: String(time || "").trim(),
      point: String(point || "").trim(),
    }))
    .filter((r) => r.time && r.point);

// ---- NEW: local file -> base64 (for operatorLogo / offer image quick preview) ----
const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ---- NEW: comma list parser (for tags, via, etc.) ----
const parseCommaList = (val) =>
  String(val || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// ---- NEW: parse minimal route stops (">" or "," separated) ----
const parseStops = (val) =>
  String(val || "")
    .split(/>|,/g)
    .map((s) => s.trim())
    .filter(Boolean);

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
      imageUrl: "", // ✅ NEW
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
    // ✅ NEW: Contacts (admin-only metadata)
    conductor: { name: "", mobile: "", altMobile: "" },
    owner: { name: "" },
    ownerNotifyMobile: "",

    // ✅ NEW: Media (Cloudinary-style)
    media: {
      cover: { url: "", publicId: "" },
      gallery: [], // [{url, publicId, caption}]
    },

    // ✅ NEW: Route meta
    routeMeta: {
      via: [],
      distanceKm: "",
      durationMin: "",
    },

    // ✅ NEW: Facilities (expanded)
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

    // ✅ NEW: Vehicle details
    vehicle: {
      registrationNo: "",
      year: "",
      make: "",
      model: "",
      seatCount: "",
    },

    // ✅ NEW: Free-form details & tags
    details: "",
    detailsHtml: "",
    tags: [],

    // ✅ NEW: Minimal ordered route stops text (matches AddBus)
    routeStops: "",
  });

  // State for non-rotating bus points
  const [boardingPoints, setBoardingPoints] = useState([]);
  const [droppingPoints, setDroppingPoints] = useState([]);
  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [operators, setOperators] = useState([]);

  // ---- NEW: local upload UX state ----
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingOfferImage, setIsUploadingOfferImage] = useState(false);

  // ---- NEW: Cloudinary upload UX state ----
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  useEffect(() => {
    const fetchBus = async () => {
      try {
        const res = await apiClient.get(`/buses/${busId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const bus = res.data || {};

        const formattedDate = bus.date ? String(bus.date).split("T")[0] : "";
        const formattedExpiry = bus.trendingOffer?.expiry
          ? String(bus.trendingOffer.expiry).split("T")[0]
          : "";
        const formattedRotationStart = bus.rotationSchedule?.startDate
          ? String(bus.rotationSchedule.startDate).split("T")[0]
          : "";

        setForm((prev) => ({
          ...prev,
          ...bus,
          date: formattedDate,
          seatLayout: Array.isArray(bus.seatLayout)
            ? bus.seatLayout.join(", ")
            : bus.seatLayout || "",
          unavailableDates: Array.isArray(bus.unavailableDates)
            ? bus.unavailableDates.join(", ")
            : bus.unavailableDates || "",
          operatorLogo: bus.operatorLogo || "",
          operator: bus.operator?._id || bus.operator || "",
          features: bus.features || { wifi: false, chargingPort: false },
          trendingOffer: {
            isActive: bus.trendingOffer?.isActive ?? false,
            discountPercent: bus.trendingOffer?.discountPercent ?? 0,
            message: bus.trendingOffer?.message ?? "",
            expiry: formattedExpiry || "",
            imageUrl: bus.trendingOffer?.imageUrl || "",
          },
          convenienceFee:
            bus.convenienceFee || {
              amountType: "fixed",
              value: 0,
            },
          rotationSchedule: bus.rotationSchedule
            ? {
                ...bus.rotationSchedule,
                startDate: formattedRotationStart || "",
              }
            : {
                isRotating: false,
                startDate: "",
                rotationLength: "",
                intervals: [],
              },
          // ✅ Contacts defaults if missing
          conductor: {
            name: bus.conductor?.name || "",
            mobile: bus.conductor?.mobile || "",
            altMobile: bus.conductor?.altMobile || "",
          },
          owner: {
            name: bus.owner?.name || "",
          },
          ownerNotifyMobile: bus.ownerNotifyMobile || "",

          // ✅ NEW blocks with safe defaults
          media: {
            cover: bus.media?.cover || { url: "", publicId: "" },
            gallery: Array.isArray(bus.media?.gallery) ? bus.media.gallery : [],
          },
          routeMeta: {
            via: Array.isArray(bus.routeMeta?.via)
              ? bus.routeMeta.via
              : parseCommaList(bus.routeMeta?.via),
            distanceKm:
              bus.routeMeta?.distanceKm === undefined ||
              bus.routeMeta?.distanceKm === null
                ? ""
                : String(bus.routeMeta.distanceKm),
            durationMin:
              bus.routeMeta?.durationMin === undefined ||
              bus.routeMeta?.durationMin === null
                ? ""
                : String(bus.routeMeta.durationMin),
          },
          facilities: {
            ac: !!bus.facilities?.ac,
            recliner: !!bus.facilities?.recliner,
            tv: !!bus.facilities?.tv,
            music: !!bus.facilities?.music,
            blanket: !!bus.facilities?.blanket,
            water: !!bus.facilities?.water,
            restroom: !!bus.facilities?.restroom,
            gps: !!bus.facilities?.gps,
            liveTracking: !!bus.facilities?.liveTracking,
            luggage: !!bus.facilities?.luggage,
            usb: !!bus.facilities?.usb,
            readingLight: !!bus.facilities?.readingLight,
            airSuspension: !!bus.facilities?.airSuspension,
            extraTags: Array.isArray(bus.facilities?.extraTags)
              ? bus.facilities.extraTags
              : parseCommaList(bus.facilities?.extraTags),
          },
          vehicle: {
            registrationNo: bus.vehicle?.registrationNo || "",
            year:
              bus.vehicle?.year === undefined || bus.vehicle?.year === null
                ? ""
                : String(bus.vehicle.year),
            make: bus.vehicle?.make || "",
            model: bus.vehicle?.model || "",
            seatCount:
              bus.vehicle?.seatCount === undefined ||
              bus.vehicle?.seatCount === null
                ? ""
                : String(bus.vehicle.seatCount),
          },
          details: bus.details || "",
          detailsHtml: bus.detailsHtml || "",
          tags: Array.isArray(bus.tags) ? bus.tags : parseCommaList(bus.tags),

          // ✅ NEW: routeStops text → join with " > " for a nice one-line edit UX
          routeStops: Array.isArray(bus.routeStops)
            ? bus.routeStops.join(" > ")
            : String(bus.routeStops || ""),
        }));

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

  // ✅ NEW: Facilities toggle handler
  const handleFacilitiesChange = (e) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      facilities: { ...prev.facilities, [name]: checked },
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

  // ---- NEW: Cloudinary uploads (cover / gallery) ----
  const uploadToCloudinary = async (file, folder) => {
    const fd = new FormData();
    fd.append("image", file);
    const res = await apiClient.post(
      `/upload?folder=${encodeURIComponent(folder)}`,
      fd,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data; // { imageUrl, publicId }
  };

  const onPickCover = async (file) => {
    if (!file) return;
    try {
      setIsUploadingCover(true);
      const { imageUrl, publicId } = await uploadToCloudinary(
        file,
        "buses/covers"
      );
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
        const { imageUrl, publicId } = await uploadToCloudinary(
          f,
          "buses/gallery"
        );
        next.push({ url: imageUrl, publicId, caption: "" });
      }
      setForm((prev) => ({
        ...prev,
        media: { ...prev.media, gallery: [...(prev.media.gallery || []), ...next] },
      }));
    } catch (e) {
      alert("Gallery upload failed.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const removeGalleryItem = (idx) => {
    setForm((prev) => {
      const g = [...(prev.media.gallery || [])];
      g.splice(idx, 1);
      return { ...prev, media: { ...prev.media, gallery: g } };
    });
  };

  // ---- NEW: Local PC quick uploads (operator logo / offer image) ----
  const onPickOperatorLogo = async (file) => {
    if (!file) return;
    try {
      setIsUploadingLogo(true);
      if (file.size > 1.5 * 1024 * 1024) {
        alert("Please choose an image smaller than 1.5 MB.");
        return;
      }
      const dataUrl = await readFileAsDataURL(file);
      setForm((prev) => ({ ...prev, operatorLogo: dataUrl }));
    } catch {
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
    } catch {
      alert("Failed to load image. Try a different file.");
    } finally {
      setIsUploadingOfferImage(false);
    }
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

      // ✅ NEW: normalize ordered route stops for API
      routeStops: parseStops(form.routeStops),

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

      // ✅ Normalize extra structured inputs (mirror AddBus)
      routeMeta: {
        via: Array.isArray(form.routeMeta.via)
          ? form.routeMeta.via
          : parseCommaList(form.routeMeta.via),
        distanceKm:
          form.routeMeta.distanceKm === "" || form.routeMeta.distanceKm === null
            ? undefined
            : Number(form.routeMeta.distanceKm),
        durationMin:
          form.routeMeta.durationMin === "" ||
          form.routeMeta.durationMin === null
            ? undefined
            : Number(form.routeMeta.durationMin),
      },
      facilities: {
        ...form.facilities,
        extraTags: Array.isArray(form.facilities.extraTags)
          ? form.facilities.extraTags
          : parseCommaList(form.facilities.extraTags),
      },
      vehicle: {
        registrationNo: form.vehicle.registrationNo,
        year:
          form.vehicle.year === "" || form.vehicle.year === null
            ? undefined
            : Number(form.vehicle.year),
        make: form.vehicle.make,
        model: form.vehicle.model,
        seatCount:
          form.vehicle.seatCount === "" || form.vehicle.seatCount === null
            ? undefined
            : Number(form.vehicle.seatCount),
      },
      tags: Array.isArray(form.tags) ? form.tags : parseCommaList(form.tags),
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

  const summary = useMemo(
    () => ({
      title: form.name || "Bus",
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
              <label htmlFor="name" className={LABEL}>
                Bus Name/Number
              </label>
              <input
                id="name"
                name="name"
                className={INPUT}
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
                <option value="">-- Select Operator --</option>
                {operators.map((op) => (
                  <option key={op._id} value={op._id}>
                    {op.fullName || op.email}
                  </option>
                ))}
              </select>
            </div>

            {/* ----- Operator Logo: URL or Upload from PC (NEW) ----- */}
            <div>
              <label htmlFor="operatorLogo" className={LABEL}>
                Operator Logo (URL or upload)
              </label>
              <input
                id="operatorLogo"
                name="operatorLogo"
                className={INPUT}
                placeholder="https://.../logo.png"
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
              {form.operatorLogo ? (
                <div className="mt-2">
                  <img
                    src={form.operatorLogo}
                    alt="Operator Logo"
                    className="h-16 w-auto rounded border border-gray-200"
                  />
                </div>
              ) : null}
            </div>

            <div>
              <label className={`${LABEL} mb-2`}>Seat Layout</label>
              <SeatLayoutSelector
                selectedLayout={form.seatLayout}
                onLayoutChange={handleLayoutChange}
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: You can paste comma separated seats (e.g., A1, A2, B1…).
              </p>
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
        </fieldset>

        {/* --- Pricing --- */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Pricing
          </legend>
          <div className="space-y-4 mt-2">
            <div>
              <label htmlFor="price" className={LABEL}>
                Default Ticket Price (Rs.)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                className={INPUT}
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
                <div>
                  <label className={LABEL}>Fee Value</label>
                  <input
                    type="number"
                    name="value"
                    min="0"
                    step="0.01"
                    className={INPUT}
                    value={form.convenienceFee.value}
                    onChange={handleConvenienceFeeChange}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Convenience fee will be added on top of ticket price.
              </p>
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
                  <label htmlFor="from" className={LABEL}>
                    From
                  </label>
                  <input
                    id="from"
                    name="from"
                    className={INPUT}
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
                    value={form.to}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="date" className={LABEL}>
                    Date of Journey
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
              </div>

              {/* ✅ NEW: Route details (via, distance, duration) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className={LABEL}>Via (comma separated)</label>
                  <input
                    className={INPUT}
                    placeholder="Matara, Galle, Kalutara"
                    value={
                      Array.isArray(form.routeMeta.via)
                        ? form.routeMeta.via.join(", ")
                        : form.routeMeta.via
                    }
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
                        routeMeta: {
                          ...prev.routeMeta,
                          distanceKm: e.target.value,
                        },
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
                        routeMeta: {
                          ...prev.routeMeta,
                          durationMin: e.target.value,
                        },
                      }))
                    }
                  />
                </div>

                {/* ✅ NEW: Minimal ordered route stops */}
                <div className="md:col-span-3">
                  <label className={LABEL}>
                    Minimal Route Stops (ordered) — use <code>&gt;</code> or commas
                  </label>
                  <input
                    className={INPUT}
                    placeholder="Matara Bus Stand > Nupe Junction > Rahula Junction"
                    value={form.routeStops}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, routeStops: e.target.value }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the compact list shown on the card. Example:{" "}
                    <em>Matara Bus Stand &gt; Nupe Junction &gt; Rahula Junction</em>
                  </p>
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
              <label htmlFor="unavailableDates" className={LABEL}>
                Unavailable Dates (comma-separated)
              </label>
              <textarea
                id="unavailableDates"
                name="unavailableDates"
                className={INPUT}
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
              <label htmlFor="isAvailable" className="ml-2 block text-sm text-gray-900">
                Bus is currently available
              </label>
            </div>

            {/* Keep legacy 'features' for backward compatibility */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Basic Features:</p>
              <div className="flex items-center">
                <input
                  id="wifi"
                  type="checkbox"
                  name="wifi"
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  checked={form.features.wifi}
                  onChange={(e) => handleCheckboxChange(e, "features")}
                />
                <label htmlFor="wifi" className="ml-2 block text-sm text-gray-900">
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
                <label htmlFor="chargingPort" className="ml-2 block text-sm text-gray-900">
                  Charging Ports
                </label>
              </div>
            </div>

            {/* ✅ NEW: Expanded Facilities */}
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium text-gray-700">Facilities (expanded):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  "ac",
                  "recliner",
                  "tv",
                  "music",
                  "blanket",
                  "water",
                  "restroom",
                  "gps",
                  "liveTracking",
                  "luggage",
                  "usb",
                  "readingLight",
                  "airSuspension",
                ].map((key) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div>
                  <label className={LABEL}>Extra Tags (comma separated)</label>
                  <input
                    className={INPUT}
                    placeholder="Ladies seat, 2+2 layout"
                    value={
                      Array.isArray(form.facilities.extraTags)
                        ? form.facilities.extraTags.join(", ")
                        : form.facilities.extraTags
                    }
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
                    onChange={(e) => setForm((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
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
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                Activate Trending Offer
              </label>
            </div>
            {form.trendingOffer.isActive && (
              <>
                <div>
                  <label htmlFor="discountPercent" className={LABEL}>
                    Discount (%)
                  </label>
                  <input
                    id="discountPercent"
                    name="discountPercent"
                    type="number"
                    className={INPUT}
                    value={form.trendingOffer.discountPercent}
                    onChange={handleTrendingOfferChange}
                  />
                </div>
                <div>
                  <label htmlFor="message" className={LABEL}>
                    Offer Message
                  </label>
                  <input
                    id="message"
                    name="message"
                    className={INPUT}
                    value={form.trendingOffer.message}
                    onChange={handleTrendingOfferChange}
                  />
                </div>
                <div>
                  <label htmlFor="expiry" className={LABEL}>
                    Offer Expiry Date
                  </label>
                  <input
                    id="expiry"
                    name="expiry"
                    type="date"
                    className={INPUT}
                    value={form.trendingOffer.expiry}
                    onChange={handleTrendingOfferChange}
                  />
                </div>

                {/* ✅ NEW: Offer Image URL + tiny preview OR local upload */}
                <div>
                  <label htmlFor="imageUrl" className={LABEL}>
                    Offer Image (URL or upload)
                  </label>
                  <input
                    id="imageUrl"
                    name="imageUrl"
                    className={INPUT}
                    placeholder="https://.../offer.png"
                    value={form.trendingOffer.imageUrl}
                    onChange={handleTrendingOfferChange}
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickOfferImage(e.target.files?.[0])}
                      className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {isUploadingOfferImage && (
                      <span className="text-xs text-gray-500">Loading…</span>
                    )}
                    {form.trendingOffer.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            trendingOffer: { ...prev.trendingOffer, imageUrl: "" },
                          }))
                        }
                        className="text-sm text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {form.trendingOffer.imageUrl ? (
                    <div className="mt-2">
                      <img
                        src={form.trendingOffer.imageUrl}
                        alt="Offer"
                        className="h-24 w-auto rounded border border-gray-200"
                      />
                    </div>
                  ) : null}
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
                    <label className={LABEL}>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={form.rotationSchedule.startDate || ""}
                      onChange={handleRotationChange}
                      className={INPUT}
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Rotation Length (days)</label>
                    <input
                      type="number"
                      name="rotationLength"
                      value={form.rotationSchedule.rotationLength || ""}
                      onChange={handleRotationChange}
                      placeholder="e.g., 2 for a 2-day cycle"
                      className={INPUT}
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
                              className={INPUT}
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
                              className={INPUT}
                            />
                          </div>
                        </div>

                        {/* Rotated Point Manager Integration (inline per turn) */}
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

        {/* ✅ NEW: Media (Cover + Gallery) */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Media
          </legend>
          <div className="space-y-4 mt-2">
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
                {form.media?.cover?.url && (
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
              {form.media?.cover?.url && (
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
              {form.media?.gallery?.length > 0 && (
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
        </fieldset>

        {/* ✅ NEW: Contacts (Admin) */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Contacts (Admin)
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
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
                    conductor: { ...prev.conductor, altMobile: e.target.value },
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
            These contacts are stored with the bus and can be used later for SMS/alerts.
          </p>
        </fieldset>

        {/* ✅ NEW: Free-form details */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Extra Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
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
            <div>
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
        </fieldset>

        {/* ✅ NEW: Vehicle details */}
        <fieldset className="border p-4 rounded-md">
          <legend className="text-lg font-semibold text-gray-600 px-2">
            Vehicle Details
          </legend>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-2">
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
        </fieldset>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => navigate("/admin/buses")}
            className="w-full md:w-auto mr-3 bg-white border border-gray-300 text-gray-700 font-semibold px-4 py-2.5 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-md shadow-sm"
          >
            Update Bus
          </button>
        </div>

        {/* Right-side lightweight summary (mobile-friendly to keep page width consistent) */}
        <div className="mt-4 p-4 border rounded-md">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">Title:</span>
            <span className="font-medium text-gray-900">{summary.title}</span>
            <span className="text-sm text-gray-500">Route:</span>
            <span className="font-medium text-gray-900">{summary.route}</span>
            <span className="text-sm text-gray-500">Type:</span>
            <span className="font-medium text-gray-900">{summary.type}</span>
            <span className="text-sm text-gray-500">Time:</span>
            <span className="font-medium text-gray-900">{summary.time}</span>
            <span className="text-sm text-gray-500">Price:</span>
            <span className="font-medium text-gray-900">{summary.price}</span>
            <span className="text-sm text-gray-500">Available:</span>
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
      </form>
    </div>
  );
};

export default EditBus;
