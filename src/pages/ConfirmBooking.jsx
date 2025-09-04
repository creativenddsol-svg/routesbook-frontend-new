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
  FaChair,
  FaMapMarkerAlt,
  FaMale,
  FaFemale,
  FaChevronLeft,
  FaTimes,
} from "react-icons/fa";
import apiClient from "../api"; // ✅ use apiClient (configure localhost/baseURL inside ../api when running locally)

/* --- helpers & palette --- */
const PALETTE = {
  primary: "#3B82F6", // matches your gradient blue
  primaryDark: "#2563EB",
  textDark: "#0F172A",
};

const getNiceDate = (dateStr) => {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr || "--";
  }
};

/* --- render only one layout at a time to avoid mobile keyboard glitches --- */
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 1024 : false
  );
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return isDesktop;
};

/* --- simple input row (NO placeholders) --- */
const InputRow = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  inputMode,
  enterKeyHint,
  icon,
  required,
}) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {icon ? (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
          {icon}
        </div>
      ) : null}
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        inputMode={inputMode}
        enterKeyHint={enterKeyHint}
        className={`w-full ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition`}
        required={required}
      />
    </div>
  </div>
);

/* --- cancel modal --- */
const ConfirmCancelModal = ({ open, onClose, onConfirm }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[10002] flex items-end md:items-center justify-center">
      <button className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full md:w-[420px] bg-white rounded-t-2xl md:rounded-2xl shadow-xl p-5">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Cancel this booking?</h3>
          <button onClick={onClose} className="p-2 -mr-2 rounded-full hover:bg-gray-100" aria-label="Close">
            <FaTimes />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Going back will cancel this booking and you’ll lose your selected seats and points.
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
            className="flex-1 px-4 py-2 rounded-lg text-white font-semibold bg-red-600 hover:bg-red-700"
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
  const isDesktop = useIsDesktop();

  const {
    bus,
    selectedSeats,
    date,
    totalPrice, // may come as number
    priceDetails, // or object { basePrice, convenienceFee, totalPrice }
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    seatGenders,
  } = location.state || {};

  // compute prices in a normalized way
  const computed = {
    basePrice: priceDetails?.basePrice ?? (typeof totalPrice === "number" ? totalPrice : 0),
    convenienceFee: priceDetails?.convenienceFee ?? 0,
    total: priceDetails?.totalPrice ?? totalPrice ?? 0,
  };

  const [form, setForm] = useState({ name: "", mobile: "", nic: "", email: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Lock back navigation (mobile hardware back)
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

  // build passengers list from selected seats (with default gender from seatGenders)
  const initialPassengers = useMemo(
    () =>
      (selectedSeats || []).map((seatNo) => ({
        seat: String(seatNo),
        name: "",
        age: "",
        gender: seatGenders?.[String(seatNo)] === "F" ? "F" : "M",
      })),
    [selectedSeats, seatGenders]
  );
  const [passengers, setPassengers] = useState(initialPassengers);
  useEffect(() => {
    setPassengers(initialPassengers);
  }, [initialPassengers]);

  const setPassenger = (seat, patch) => {
    setPassengers((prev) => prev.map((p) => (p.seat === String(seat) ? { ...p, ...patch } : p)));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // stable update (no placeholder/focus tricks)
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.mobile || !form.nic || !form.email) {
      alert("Please fill in all passenger contact details.");
      return;
    }
    for (const p of passengers) {
      if (!p.name || !p.gender) {
        alert(`Please fill in Name and Gender for seat ${p.seat}.`);
        return;
      }
    }
    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to proceed.");
      return;
    }

    // (Optional) Example of using apiClient without localhost hardcoding:
    // await apiClient.post("/booking/validate", { busId: bus._id, seats: selectedSeats });

    // Prepare genders map for next step
    const seatGendersOut = {};
    passengers.forEach((p) => (seatGendersOut[p.seat] = p.gender));

    navigate("/payment", {
      state: {
        bus,
        selectedSeats,
        date,
        departureTime,
        passenger: form,
        priceDetails: {
          basePrice: computed.basePrice,
          convenienceFee: computed.convenienceFee,
          totalPrice: computed.total,
        },
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

  // guard if missing data
  if (
    !bus ||
    !selectedSeats ||
    !date ||
    computed.total === undefined ||
    !selectedBoardingPoint ||
    !selectedDroppingPoint
  ) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 font-semibold">Booking details are incomplete. Please start again.</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  /* ========================= MOBILE (matches your basic UI) ========================= */
  const Mobile = () => (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-[#F4F7FE] min-h-screen">
      <div className="sticky top-0 left-0 right-0 z-20 -mx-4 px-4 py-3 bg-[#F4F7FE] border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCancelModal(true)}
            className="p-2 rounded-full hover:bg-gray-200"
            aria-label="Back"
            title="Back / Cancel"
          >
            <FaChevronLeft />
          </button>
          <h1 className="text-lg font-semibold text-[#0F172A]">Confirm Your Booking</h1>
        </div>
      </div>

      <BookingSteps currentStep={3} />

      <div className="bg-white shadow-lg rounded-xl p-6 mt-6">
        {/* Contact form (NO placeholders) */}
        <h2 className="text-xl font-bold mb-4 text-[#0F172A]">Contact Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputRow
            id="m-name"
            name="name"
            label="Full Name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            enterKeyHint="next"
            icon={<FaUser />}
            required
          />
          <InputRow
            id="m-mobile"
            name="mobile"
            label="Mobile Number"
            type="tel"
            value={form.mobile}
            onChange={handleChange}
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            icon={<FaPhone />}
            required
          />
          <InputRow
            id="m-nic"
            name="nic"
            label="NIC / Passport"
            value={form.nic}
            onChange={handleChange}
            autoComplete="off"
            enterKeyHint="next"
            icon={<FaIdCard />}
            required
          />
          <InputRow
            id="m-email"
            name="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="done"
            icon={<FaEnvelope />}
            required
          />
        </div>

        {/* Passenger details */}
        <h2 className="text-xl font-bold mb-3 text-[#0F172A]">Passenger Details</h2>
        <div className="space-y-4 mb-6">
          {passengers.map((p, idx) => (
            <div key={`m-pass-${p.seat}`} className="border p-4 rounded-lg bg-[#F8FAFF]">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#1F2937]">Passenger {idx + 1}</p>
                <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-[#EAF0FB] text-[#1F2937]">
                  Seat {p.seat}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <InputRow
                  id={`m-pname-${p.seat}`}
                  name={`m-pname-${p.seat}`}
                  label="Name"
                  value={p.name}
                  onChange={(e) => setPassenger(p.seat, { name: e.target.value })}
                  autoComplete="name"
                  enterKeyHint="next"
                />
                <InputRow
                  id={`m-page-${p.seat}`}
                  name={`m-page-${p.seat}`}
                  label="Age"
                  type="number"
                  value={p.age}
                  onChange={(e) => setPassenger(p.seat, { age: e.target.value })}
                  inputMode="numeric"
                  enterKeyHint="next"
                />
                <div className="w-full">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Gender</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPassenger(p.seat, { gender: "M" })}
                      className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        p.gender === "M" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50 border-gray-300"
                      }`}
                    >
                      <FaMale /> Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassenger(p.seat, { gender: "F" })}
                      className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        p.gender === "F" ? "bg-pink-600 text-white border-pink-600" : "bg-white hover:bg-pink-50 border-gray-300"
                      }`}
                    >
                      <FaFemale /> Female
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey summary (your basic card look) */}
        <div className="border p-4 rounded-lg bg-[#EAF0FB] mb-6 text-sm space-y-2">
          <h3 className="font-semibold mb-2 text-[#1F2937]">Journey Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p>
              <strong>Bus:</strong> {bus.name}
            </p>
            <p>
              <strong>Date:</strong> {getNiceDate(date)}{departureTime ? ` at ${departureTime}` : ""}
            </p>
            <p>
              <strong>Route:</strong> {bus.from} to {bus.to}
            </p>
            <p>
              <strong>Seats:</strong>{" "}
              <span className="font-bold text-blue-600">{selectedSeats.join(", ")}</span>
            </p>
          </div>
          <hr className="my-2 border-gray-300" />
          <div>
            <p>
              <strong>Boarding Point:</strong> {selectedBoardingPoint.point} at{" "}
              <strong>{selectedBoardingPoint.time}</strong>
            </p>
            <p>
              <strong>Dropping Point:</strong> {selectedDroppingPoint.point} at{" "}
              <strong>{selectedDroppingPoint.time}</strong>
            </p>
          </div>
          <hr className="my-2 border-gray-300" />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {Number(computed.basePrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Fee</span>
              <span>Rs. {Number(computed.convenienceFee).toFixed(2)}</span>
            </div>
            <p className="text-lg font-bold text-right">
              <strong>Total Price:</strong> Rs. {Number(computed.total).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center text-sm text-[#1F2937]">
            <input
              type="checkbox"
              className="mr-2 form-checkbox"
              checked={termsAccepted}
              onChange={() => setTermsAccepted((v) => !v)}
              required
            />
            I agree to all Terms &amp; Conditions
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!termsAccepted}
          className="w-full py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300 tracking-wide shadow-md bg-gradient-to-r from-blue-400 to-blue-500 hover:scale-105 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Proceed to Pay
        </button>
      </div>

      {/* Cancel modal */}
      <ConfirmCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate("/")}
      />
    </div>
  );

  /* ========================= DESKTOP (same visual language) ========================= */
  const Desktop = () => (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-[#F4F7FE] min-h-screen">
      <BookingSteps currentStep={3} />

      <div className="bg-white shadow-lg rounded-xl p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4 text-[#0F172A]">Confirm Your Booking</h2>

        {/* Contact form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <InputRow
            id="d-name"
            name="name"
            label="Full Name"
            value={form.name}
            onChange={handleChange}
            autoComplete="name"
            enterKeyHint="next"
            icon={<FaUser />}
            required
          />
          <InputRow
            id="d-mobile"
            name="mobile"
            label="Mobile Number"
            type="tel"
            value={form.mobile}
            onChange={handleChange}
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            icon={<FaPhone />}
            required
          />
          <InputRow
            id="d-nic"
            name="nic"
            label="NIC / Passport"
            value={form.nic}
            onChange={handleChange}
            autoComplete="off"
            enterKeyHint="next"
            icon={<FaIdCard />}
            required
          />
          <InputRow
            id="d-email"
            name="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={handleChange}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="done"
            icon={<FaEnvelope />}
            required
          />
        </div>

        {/* Passengers */}
        <h3 className="text-xl font-bold mb-3 text-[#0F172A]">Passenger Details</h3>
        <div className="space-y-4 mb-6">
          {passengers.map((p, idx) => (
            <div key={`d-pass-${p.seat}`} className="border p-4 rounded-lg bg-[#F8FAFF]">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#1F2937]">Passenger {idx + 1}</p>
                <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-[#EAF0FB] text-[#1F2937]">
                  Seat {p.seat}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
                <div className="md:col-span-2">
                  <InputRow
                    id={`d-pname-${p.seat}`}
                    name={`d-pname-${p.seat}`}
                    label="Name"
                    value={p.name}
                    onChange={(e) => setPassenger(p.seat, { name: e.target.value })}
                    autoComplete="name"
                    enterKeyHint="next"
                  />
                </div>
                <div className="md:col-span-1">
                  <InputRow
                    id={`d-page-${p.seat}`}
                    name={`d-page-${p.seat}`}
                    label="Age"
                    type="number"
                    value={p.age}
                    onChange={(e) => setPassenger(p.seat, { age: e.target.value })}
                    inputMode="numeric"
                    enterKeyHint="next"
                  />
                </div>
                <div className="md:col-span-2">
                  <span className="block text-sm font-medium text-gray-700 mb-1">Gender</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPassenger(p.seat, { gender: "M" })}
                      className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        p.gender === "M" ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-blue-50 border-gray-300"
                      }`}
                    >
                      <FaMale /> Male
                    </button>
                    <button
                      type="button"
                      onClick={() => setPassenger(p.seat, { gender: "F" })}
                      className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                        p.gender === "F" ? "bg-pink-600 text-white border-pink-600" : "bg-white hover:bg-pink-50 border-gray-300"
                      }`}
                    >
                      <FaFemale /> Female
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Journey summary */}
        <div className="border p-4 rounded-lg bg-[#EAF0FB] mb-6 text-sm space-y-2">
          <h3 className="font-semibold mb-2 text-[#1F2937]">Journey Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p><strong>Bus:</strong> {bus.name}</p>
            <p>
              <strong>Date:</strong> {getNiceDate(date)}{departureTime ? ` at ${departureTime}` : ""}
            </p>
            <p><strong>Route:</strong> {bus.from} to {bus.to}</p>
            <p>
              <strong>Seats:</strong>{" "}
              <span className="font-bold text-blue-600">{selectedSeats.join(", ")}</span>
            </p>
          </div>
          <hr className="my-2 border-gray-300" />
          <div>
            <p>
              <strong>Boarding Point:</strong> {selectedBoardingPoint.point} at{" "}
              <strong>{selectedBoardingPoint.time}</strong>
            </p>
            <p>
              <strong>Dropping Point:</strong> {selectedDroppingPoint.point} at{" "}
              <strong>{selectedDroppingPoint.time}</strong>
            </p>
          </div>
          <hr className="my-2 border-gray-300" />
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {Number(computed.basePrice).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Fee</span>
              <span>Rs. {Number(computed.convenienceFee).toFixed(2)}</span>
            </div>
            <p className="text-lg font-bold text-right">
              <strong>Total Price:</strong> Rs. {Number(computed.total).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center text-sm text-[#1F2937]">
            <input
              type="checkbox"
              className="mr-2 form-checkbox"
              checked={termsAccepted}
              onChange={() => setTermsAccepted((v) => !v)}
              required
            />
            I agree to all Terms &amp; Conditions
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            className="px-4 py-3 rounded-lg font-semibold border border-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!termsAccepted}
            className="flex-1 py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300 tracking-wide shadow-md bg-gradient-to-r from-blue-400 to-blue-500 hover:scale-105 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Proceed to Pay
          </button>
        </div>
      </div>

      <ConfirmCancelModal
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate("/")}
      />
    </div>
  );

  return isDesktop ? <Desktop /> : <Mobile />;
};

export default ConfirmBooking;

