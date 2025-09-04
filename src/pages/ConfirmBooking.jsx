// src/pages/ConfirmBooking.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaBus,
  FaCalendarAlt,
  FaChair,
  FaMapMarkerAlt,
  FaMale,
  FaFemale,
  FaUserCircle,
  FaUsers,
  FaChevronLeft,
  FaTimes,
} from "react-icons/fa";

/* ---- Palette + date helpers (match SearchResults mobile look) ---- */
const PALETTE = {
  primaryRed: "#D84E55",
  textDark: "#1A1A1A",
};

const getMobileDateParts = (dateString) => {
  if (!dateString) return { top: "-- ---", bottom: "" };
  const [y, m, d] = dateString.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const top = dt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const bottom = dt.toLocaleDateString("en-GB", { weekday: "short" });
  return { top, bottom };
};

/* ---- Small confirm-modal used for Cancel action and back-block ---- */
const ConfirmCancelModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10002] flex items-end md:items-center justify-center">
      <button
        className="absolute inset-0 bg-black/40"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cancel this booking?</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          You’ve completed Steps 1–3. Going back will cancel this booking and you’ll
          lose your selected seats and points.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold"
          >
            Keep Booking
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 rounded-lg text-white font-semibold"
            style={{ backgroundColor: PALETTE.primaryRed }}
          >
            Cancel Booking
          </button>
        </div>
      </div>
    </div>
  );
};

const ConfirmBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    bus,
    selectedSeats,
    date,
    priceDetails,
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    seatGenders,
  } = location.state || {};

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    nic: "",
    email: "",
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  /* ---------- Lock back navigation while on this page ---------- */
  useEffect(() => {
    const handlePop = () => {
      window.history.pushState(null, "", window.location.href);
      setShowCancelModal(true);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePop);

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePop);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const initialPassengers = useMemo(() => {
    return (selectedSeats || []).map((seatNo) => ({
      seat: String(seatNo),
      name: "",
      age: "",
      gender: seatGenders?.[String(seatNo)] === "F" ? "F" : "M",
    }));
  }, [selectedSeats, seatGenders]);

  const [passengers, setPassengers] = useState(initialPassengers);

  const setPassenger = (seat, patch) => {
    setPassengers((prev) =>
      prev.map((p) => (p.seat === String(seat) ? { ...p, ...patch } : p))
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (!bus || !selectedSeats || !date || !priceDetails) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 font-semibold">
          Booking details are incomplete. Please start again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.mobile || !form.nic || !form.email) {
      alert("Please fill in all contact details.");
      return;
    }
    for (const p of passengers) {
      if (!p.name || !p.gender) {
        alert(
          `Please fill in the Name and Gender for the passenger in seat ${p.seat}.`
        );
        return;
      }
    }
    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to proceed.");
      return;
    }

    const seatGendersOut = {};
    passengers.forEach((p) => {
      seatGendersOut[p.seat] = p.gender;
    });

    navigate("/payment", {
      state: {
        bus,
        selectedSeats,
        date,
        departureTime,
        passenger: form,
        priceDetails,
        selectedBoardingPoint,
        selectedDroppingPoint,
        passengers: passengers.map(({ seat, name, age, gender }) => ({
          seat,
          name,
          age: age === "" ? undefined : Number(age),
          gender,
        })),
        seatGenders: seatGendersOut,
      },
    });
  };

  // Floating label input
  const FormInput = ({ icon, label, ...props }) => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
        {icon}
      </div>
      <input
        {...props}
        className="peer w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-red-200 focus:border-red-500 transition placeholder-transparent"
        placeholder=" "
      />
      <label
        htmlFor={props.id}
        className="absolute left-10 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all
                 peer-placeholder-shown:top-2.5 peer-placeholder-shown:text-base
                 peer-placeholder-shown:text-gray-400 peer-focus:-top-2.5
                 peer-focus:text-sm peer-focus:text-red-600"
      >
        {label}
      </label>
    </div>
  );

  /* ===================== MOBILE (locked, step 4) ===================== */
  const Mobile = () => (
    <div className="lg:hidden bg-white min-h-screen">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="px-4 py-2.5 flex items-center justify-between">
          {/* Back button now triggers cancel modal instead of navigating back */}
          <button
            onClick={() => setShowCancelModal(true)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200"
            aria-label="Cancel booking"
            title="Cancel booking"
          >
            <FaChevronLeft />
          </button>

          <div className="text-center min-w-0">
            <h2
              className="text-base font-semibold truncate"
              style={{ color: PALETTE.textDark }}
            >
              Confirm Details
            </h2>
            <p className="text-[11px] text-gray-500 truncate">
              {bus?.from} → {bus?.to} • {departureTime}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center px-3 py-1 rounded-full border border-gray-200 bg-gray-50">
            <span className="text-xs font-semibold leading-none">
              {getMobileDateParts(date).top}
            </span>
            <span className="text-[10px] text-gray-500 leading-none mt-0.5">
              {getMobileDateParts(date).bottom}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="px-4 pt-3 pb-28 space-y-4">
          {/* Journey card */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 pr-3">
                <div
                  className="inline-flex items-center px-2 py-0.5 rounded-lg border text-[12px] tabular-nums"
                  style={{
                    background: "#ECFDF5",
                    color: "#065F46",
                    borderColor: "#A7F3D0",
                  }}
                >
                  {departureTime}
                </div>
                <h3 className="text-[15px] font-medium text-gray-800 mt-1 truncate">
                  {bus?.name}
                </h3>
                <p className="text-xs text-gray-500">
                  <FaBus className="inline mr-1" />
                  {bus?.from} → {bus?.to}
                </p>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-gray-500">Total</div>
                <div className="text-xl font-semibold tabular-nums">
                  Rs. {priceDetails?.totalPrice?.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-[13px]">
              <div className="flex items-start gap-2">
                <FaChair className="text-gray-400 mt-0.5" />
                <div>
                  <div className="text-gray-600">
                    Seats:{" "}
                    <span className="font-semibold text-red-600">
                      {selectedSeats.join(", ")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-green-600 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-800">Boarding</div>
                  <div className="text-gray-600 truncate">
                    {selectedBoardingPoint?.point} at{" "}
                    <span className="font-semibold">
                      {selectedBoardingPoint?.time}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="text-red-600 mt-0.5" />
                <div className="min-w-0">
                  <div className="font-medium text-gray-800">Dropping</div>
                  <div className="text-gray-600 truncate">
                    {selectedDroppingPoint?.point} at{" "}
                    <span className="font-semibold">
                      {selectedDroppingPoint?.time}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-[15px] font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <FaUserCircle className="text-red-500" /> Contact Details
            </h4>
            <div className="grid grid-cols-1 gap-3">
              <FormInput
                icon={<FaUser />}
                id="name"
                name="name"
                type="text"
                label="Full Name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <FormInput
                icon={<FaPhone />}
                id="mobile"
                name="mobile"
                type="tel"
                label="Mobile Number"
                value={form.mobile}
                onChange={handleChange}
                required
              />
              <FormInput
                icon={<FaIdCard />}
                id="nic"
                name="nic"
                type="text"
                label="NIC / Passport"
                value={form.nic}
                onChange={handleChange}
                required
              />
              <FormInput
                icon={<FaEnvelope />}
                id="email"
                name="email"
                type="email"
                label="Email Address"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-[15px] font-semibold text-gray-800 flex items-center gap-2 mb-2">
              <FaUsers className="text-red-500" /> Passenger Details
            </h4>
            <div className="space-y-3">
              {passengers.map((p, idx) => (
                <div key={p.seat} className="rounded-lg border bg-gray-50/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-gray-700">
                      Passenger {idx + 1}
                    </p>
                    <span
                      className="px-2 py-0.5 rounded-lg text-xs font-semibold border"
                      style={{
                        background: "#FFE4E6",
                        color: "#9F1239",
                        borderColor: "#FDA4AF",
                      }}
                    >
                      Seat {p.seat}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3">
                    <FormInput
                      type="text"
                      id={`p-name-${p.seat}`}
                      label="Name"
                      value={p.name}
                      onChange={(e) => setPassenger(p.seat, { name: e.target.value })}
                      required
                    />
                    <FormInput
                      type="number"
                      id={`p-age-${p.seat}`}
                      min="0"
                      label="Age"
                      value={p.age}
                      onChange={(e) => setPassenger(p.seat, { age: e.target.value })}
                    />
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPassenger(p.seat, { gender: "M" })}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition
                          ${p.gender === "M" ? "bg-violet-500 text-white border-violet-500" : "bg-white hover:bg-violet-50"}`}
                      >
                        <FaMale /> Male
                      </button>
                      <button
                        type="button"
                        onClick={() => setPassenger(p.seat, { gender: "F" })}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition
                          ${p.gender === "F" ? "bg-pink-500 text-white border-pink-500" : "bg-white hover:bg-pink-50"}`}
                      >
                        <FaFemale /> Female
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fare summary */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h4 className="text-[15px] font-semibold text-gray-800 mb-2">Fare Summary</h4>
            <div className="space-y-1 text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rs. {priceDetails.basePrice?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Convenience Fee</span>
                <span>Rs. {priceDetails.convenienceFee?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total</span>
                <span>Rs. {priceDetails.totalPrice?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom bar */}
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t">
          <div className="px-4 pt-3">
            <label className="flex items-start gap-2 text-[12px] text-gray-700 pb-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)}
                className="h-4 w-4 mt-0.5 rounded text-red-600 focus:ring-red-500"
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" className="text-red-600 underline">
                  Terms &amp; Conditions
                </a>
              </span>
            </label>
          </div>
          <div className="px-4 pb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-3 rounded-xl font-semibold border border-gray-300 text-gray-700"
            >
              Cancel
            </button>
            <div className="flex-1 rounded-xl border px-3 py-2">
              <div className="text-[11px] text-gray-500">To Pay</div>
              <div className="text-xl font-bold tabular-nums">
                Rs. {priceDetails?.totalPrice?.toFixed(2)}
              </div>
            </div>
            <button
              type="submit"
              disabled={!termsAccepted}
              className="flex-[1.4] px-5 py-3 rounded-xl font-bold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: PALETTE.primaryRed }}
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </form>

      {/* Cancel modal */}
      <ConfirmCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate("/")}
      />
    </div>
  );

  /* ===================== DESKTOP (unchanged layout, + cancel) ===================== */
  const Desktop = () => (
    <div className="hidden lg:block bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Step 4 now */}
        <BookingSteps currentStep={4} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <FaUserCircle className="text-red-500" />
                Contact Details (for E-ticket/SMS)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  icon={<FaUser />}
                  id="name"
                  name="name"
                  type="text"
                  label="Full Name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaPhone />}
                  id="mobile"
                  name="mobile"
                  type="tel"
                  label="Mobile Number"
                  value={form.mobile}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaIdCard />}
                  id="nic"
                  name="nic"
                  type="text"
                  label="NIC / Passport"
                  value={form.nic}
                  onChange={handleChange}
                  required
                />
                <FormInput
                  icon={<FaEnvelope />}
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="bg-white shadow-md rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-3">
                <FaUsers className="text-red-500" />
                Passenger Details
              </h2>
              <div className="space-y-4">
                {passengers.map((p, index) => (
                  <div key={p.seat} className="border rounded-lg p-4 bg-gray-50/70">
                    <p className="font-semibold text-gray-700 mb-3">
                      Passenger {index + 1} -{" "}
                      <span className="text-red-500">Seat {p.seat}</span>
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="md:col-span-2">
                        <FormInput
                          type="text"
                          id={`p-name-${p.seat}`}
                          label="Name"
                          value={p.name}
                          onChange={(e) => setPassenger(p.seat, { name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="md:col-span-1">
                        <FormInput
                          type="number"
                          id={`p-age-${p.seat}`}
                          min="0"
                          label="Age"
                          value={p.age}
                          onChange={(e) => setPassenger(p.seat, { age: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setPassenger(p.seat, { gender: "M" })}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            p.gender === "M"
                              ? "bg-violet-500 text-white border-violet-500"
                              : "bg-white hover:bg-violet-50"
                          }`}
                        >
                          <FaMale /> Male
                        </button>
                        <button
                          type="button"
                          onClick={() => setPassenger(p.seat, { gender: "F" })}
                          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 transition ${
                            p.gender === "F"
                              ? "bg-pink-500 text-white border-pink-500"
                              : "bg-white hover:bg-pink-50"
                          }`}
                        >
                          <FaFemale /> Female
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right (sticky) */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white shadow-md rounded-xl p-6 border">
                <h3 className="text-xl font-bold border-b pb-3 mb-4 text-gray-800">
                  Journey Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FaBus className="text-gray-400 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">{bus.name}</p>
                      <p className="text-gray-500">
                        {bus.from} to {bus.to}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaCalendarAlt className="text-gray-400 mt-1" />
                    <p className="font-medium text-gray-700">
                      {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}{" "}
                      at {departureTime}
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaChair className="text-gray-400 mt-1" />
                    <p className="font-medium text-gray-700">
                      Seats:{" "}
                      <span className="font-bold text-red-500">
                        {selectedSeats.join(", ")}
                      </span>
                    </p>
                  </div>
                </div>
                <hr className="my-4 border-dashed" />
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-green-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">Boarding Point</p>
                      <p className="text-gray-600">
                        {selectedBoardingPoint.point} at{" "}
                        <span className="font-bold">{selectedBoardingPoint.time}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FaMapMarkerAlt className="text-red-500 mt-1" />
                    <div>
                      <p className="font-semibold text-gray-800">Dropping Point</p>
                      <p className="text-gray-600">
                        {selectedDroppingPoint.point} at{" "}
                        <span className="font-bold">{selectedDroppingPoint.time}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <hr className="my-4" />
                <div className="space-y-2 text-gray-800 font-medium">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>Rs. {priceDetails.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Fee</span>
                    <span>Rs. {priceDetails.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold text-xl mt-2 pt-2 border-t">
                    <span>Total Price</span>
                    <span>Rs. {priceDetails.totalPrice?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700"
                    disabled={!termsAccepted}
                  >
                    Proceed to Pay
                  </button>
                </div>

                <div className="mt-4">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={() => setTermsAccepted(!termsAccepted)}
                      className="h-4 w-4 mr-2 form-checkbox rounded text-red-600 focus:ring-red-500"
                      required
                    />
                    I agree to the{" "}
                    <a href="/terms" target="_blank" className="text-red-500 underline ml-1">
                      Terms & Conditions
                    </a>
                  </label>
                </div>
              </div>
            </div>
          </div>
          {/* /Right */}
        </div>
      </div>

      {/* Cancel modal for desktop route */}
      <ConfirmCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate("/")}
      />
    </div>
  );

  return (
    <>
      {/* Step index here is 4 (1: Seats, 2: Points, 3: Summary, 4: Confirm, 5: Payment, 6: Ticket) */}
      <Mobile />
      <Desktop />
    </>
  );
};

export default ConfirmBooking;
