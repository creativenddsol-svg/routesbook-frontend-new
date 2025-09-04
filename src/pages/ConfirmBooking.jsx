// src/pages/ConfirmBooking.jsx
import { useMemo, useState, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaMale,
  FaFemale,
  FaBus,
  FaChair,
  FaMapMarkerAlt,
} from "react-icons/fa";
import apiClient from "../api"; // set baseURL inside ../api (e.g., localhost when dev)

/* ---------------- UI helpers ---------------- */
const getNiceDate = (dateStr, time) => {
  try {
    const d = new Date(dateStr);
    const ds = d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return time ? `${ds} at ${time}` : ds;
  } catch {
    return dateStr || "--";
  }
};

const RowInput = ({
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

/* -------- Passenger row (memoized; inputs won't remount) -------- */
const PassengerRow = memo(function PassengerRow({ p, index, onName, onAge, onGender }) {
  return (
    <div className="border p-4 rounded-lg bg-[#F8FAFF]">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#1F2937]">Passenger {index + 1}</p>
        <span className="px-2 py-0.5 rounded text-xs font-semibold border bg-[#EAF0FB] text-[#1F2937]">
          Seat {p.seat}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-3">
        <div className="md:col-span-2">
          <RowInput
            id={`p-name-${p.seat}`}
            name={`p-name-${p.seat}`}
            label="Name"
            value={p.name}
            onChange={(e) => onName(p.seat, e.target.value)}
            autoComplete="name"
            enterKeyHint="next"
          />
        </div>
        <div className="md:col-span-1">
          <RowInput
            id={`p-age-${p.seat}`}
            name={`p-age-${p.seat}`}
            label="Age"
            type="number"
            value={p.age}
            onChange={(e) => onAge(p.seat, e.target.value)}
            inputMode="numeric"
            enterKeyHint="next"
          />
        </div>
        <div className="md:col-span-2">
          <span className="block text-sm font-medium text-gray-700 mb-1">Gender</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onGender(p.seat, "M")}
              className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                p.gender === "M"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-blue-50 border-gray-300"
              }`}
            >
              <FaMale /> Male
            </button>
            <button
              type="button"
              onClick={() => onGender(p.seat, "F")}
              className={`flex-1 py-2.5 rounded-lg border-2 flex items-center justify-center gap-2 ${
                p.gender === "F"
                  ? "bg-pink-600 text-white border-pink-600"
                  : "bg-white hover:bg-pink-50 border-gray-300"
              }`}
            >
              <FaFemale /> Female
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ========================= Component ========================= */
const ConfirmBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ---- read route state ----
  const {
    bus,
    selectedSeats,
    date,
    totalPrice, // number OR
    priceDetails, // { basePrice, convenienceFee, totalPrice }
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    seatGenders,
  } = location.state || {};

  // ---- normalized pricing (stable) ----
  const prices = useMemo(() => {
    const base = priceDetails?.basePrice ?? (typeof totalPrice === "number" ? totalPrice : 0);
    const fee = priceDetails?.convenienceFee ?? 0;
    const tot = priceDetails?.totalPrice ?? totalPrice ?? base + fee;
    return {
      basePrice: Number(base) || 0,
      convenienceFee: Number(fee) || 0,
      total: Number(tot) || 0,
    };
  }, [priceDetails, totalPrice]);

  // ---- contact form (controlled) ----
  const [form, setForm] = useState({ name: "", mobile: "", nic: "", email: "" });
  const onChangeForm = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => (prev[name] === value ? prev : { ...prev, [name]: value }));
  }, []);

  // ---- passengers initialized once; never reset from props while typing ----
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

  const setPassengerName = useCallback((seat, name) => {
    setPassengers((prev) => {
      const i = prev.findIndex((x) => x.seat === String(seat));
      if (i === -1) return prev;
      if (prev[i].name === name) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], name };
      return next;
    });
  }, []);

  const setPassengerAge = useCallback((seat, age) => {
    setPassengers((prev) => {
      const i = prev.findIndex((x) => x.seat === String(seat));
      if (i === -1) return prev;
      if (prev[i].age === age) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], age };
      return next;
    });
  }, []);

  const setPassengerGender = useCallback((seat, gender) => {
    setPassengers((prev) => {
      const i = prev.findIndex((x) => x.seat === String(seat));
      if (i === -1) return prev;
      if (prev[i].gender === gender) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], gender };
      return next;
    });
  }, []);

  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!form.name || !form.mobile || !form.nic || !form.email) {
        alert("Please fill in all contact details.");
        return;
      }
      for (const p of passengers) {
        if (!p.name || !p.gender) {
          alert(`Please fill in Name and Gender for seat ${p.seat}.`);
          return;
        }
      }
      if (!termsAccepted) {
        alert("Please agree to the Terms & Conditions.");
        return;
      }

      // Example api call (baseURL configured in ../api)
      // await apiClient.post("/booking/validate", { busId: bus?._id, seats: selectedSeats });

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
            basePrice: prices.basePrice,
            convenienceFee: prices.convenienceFee,
            totalPrice: prices.total,
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
    },
    [
      bus,
      date,
      departureTime,
      form,
      navigate,
      passengers,
      selectedSeats,
      selectedDroppingPoint,
      selectedBoardingPoint,
      prices,
      termsAccepted,
    ]
  );

  // ---- guard (AFTER all hooks; safe for rules-of-hooks) ----
  const missingData =
    !bus ||
    !selectedSeats ||
    !date ||
    !selectedBoardingPoint ||
    !selectedDroppingPoint ||
    prices.total === undefined;

  if (missingData) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 font-semibold">
          Booking details are incomplete. Please start again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Go to Home
        </button>
      </div>
    );
  }

  /* -------------------- UI (single responsive layout) -------------------- */
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 bg-[#F4F7FE] min-h-screen">
      <BookingSteps currentStep={3} />

      <form onSubmit={handleSubmit} noValidate className="bg-white shadow-lg rounded-xl p-6 mt-6">
        <h2 className="text-2xl font-bold mb-4 text-[#0F172A]">Confirm Your Booking</h2>

        {/* Contact */}
        <h3 className="text-lg font-semibold mb-3 text-[#0F172A]">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <RowInput
            id="name"
            name="name"
            label="Full Name"
            value={form.name}
            onChange={onChangeForm}
            autoComplete="name"
            enterKeyHint="next"
            icon={<FaUser />}
            required
          />
          <RowInput
            id="mobile"
            name="mobile"
            label="Mobile Number"
            type="tel"
            value={form.mobile}
            onChange={onChangeForm}
            autoComplete="tel"
            inputMode="tel"
            enterKeyHint="next"
            icon={<FaPhone />}
            required
          />
          <RowInput
            id="nic"
            name="nic"
            label="NIC / Passport"
            value={form.nic}
            onChange={onChangeForm}
            autoComplete="off"
            enterKeyHint="next"
            icon={<FaIdCard />}
            required
          />
          <RowInput
            id="email"
            name="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={onChangeForm}
            autoComplete="email"
            inputMode="email"
            enterKeyHint="done"
            icon={<FaEnvelope />}
            required
          />
        </div>

        {/* Passengers */}
        <h3 className="text-lg font-semibold mb-3 text-[#0F172A]">Passenger Details</h3>
        <div className="space-y-4 mb-6">
          {passengers.map((p, idx) => (
            <PassengerRow
              key={p.seat}                // stable key prevents remount
              p={p}
              index={idx}
              onName={setPassengerName}   // stable callbacks
              onAge={setPassengerAge}
              onGender={setPassengerGender}
            />
          ))}
        </div>

        {/* Journey Summary */}
        <div className="border p-4 rounded-lg bg-[#EAF0FB] mb-6 text-sm space-y-2">
          <h3 className="font-semibold mb-2 text-[#1F2937]">Journey Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <p>
              <strong>Bus:</strong> {bus.name}
            </p>
            <p>
              <strong>Date:</strong> {getNiceDate(date, departureTime)}
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
              <span>Rs. {prices.basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Convenience Fee</span>
              <span>Rs. {prices.convenienceFee.toFixed(2)}</span>
            </div>
            <p className="text-lg font-bold text-right">
              <strong>Total Price:</strong> Rs. {prices.total.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Terms + CTA */}
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
          type="submit"
          disabled={!termsAccepted}
          className="w-full py-3 rounded-lg text-white font-semibold text-lg transition-all duration-300 tracking-wide shadow-md bg-gradient-to-r from-blue-400 to-blue-500 hover:scale-105 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Proceed to Pay
        </button>
      </form>
    </div>
  );
};

export default ConfirmBooking;
