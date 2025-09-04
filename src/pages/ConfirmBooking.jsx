// src/pages/ConfirmBooking.jsx
import { useMemo, useState, useCallback, memo, useEffect } from "react";
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
  FaChevronLeft,
  FaCalendarAlt,
} from "react-icons/fa";
import apiClient from "../api";

/* ---------------- Match SearchResults palette & type scale ---------------- */
const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F0F2F5",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  green: "#28a745",
  orange: "#fd7e14",
  yellow: "#FFC107",
};

/* ---------------- Helpers used in both pages ---------------- */
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

const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textLight }}>
    {children}
  </span>
);

const Chip = ({ children, tone = "neutral" }) => {
  const toneMap = {
    neutral: { bg: "#F7F7F8", text: PALETTE.textDark, border: PALETTE.borderLight },
    blue: { bg: "#EAF2FF", text: PALETTE.accentBlue, border: "#D6E4FF" },
    red: { bg: "#FFE9EB", text: PALETTE.primaryRed, border: "#FFD5DA" },
    green: { bg: "#EAF7EE", text: PALETTE.green, border: "#D4F0DB" },
    yellow: { bg: "#FFF8E6", text: PALETTE.yellow, border: "#FFEFC4" },
  };
  const c = toneMap[tone] || toneMap.neutral;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      {children}
    </span>
  );
};

const Divider = () => <hr className="my-4" style={{ borderColor: PALETTE.borderLight }} />;

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
  placeholder,
}) => (
  <div className="w-full">
    <Label>{label}</Label>
    <div
      className="relative rounded-xl border focus-within:ring-2 transition"
      style={{ borderColor: PALETTE.borderLight }}
    >
      {icon ? (
        <div
          className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          style={{ color: PALETTE.textLight }}
        >
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
        placeholder={placeholder}
        className={`w-full bg-white ${icon ? "pl-10" : "pl-3"} pr-3 py-3 rounded-xl outline-none`}
        style={{
          color: PALETTE.textDark,
        }}
        required={required}
      />
    </div>
  </div>
);

/* -------- Passenger row (memoized; inputs won't remount) -------- */
const PassengerRow = memo(function PassengerRow({ p, index, onName, onAge, onGender }) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: "#FBFCFF", border: `1px solid ${PALETTE.borderLight}` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: PALETTE.textDark }}>
          Passenger {index + 1}
        </p>
        <Chip tone="blue">
          <FaChair className="mr-1" /> Seat {p.seat}
        </Chip>
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
            placeholder="e.g., Ramesh Perera"
            icon={<FaUser />}
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
            placeholder="e.g., 28"
          />
        </div>
        <div className="md:col-span-2">
          <Label>Gender</Label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onGender(p.seat, "M")}
              className="flex-1 py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition"
              style={{
                borderColor: p.gender === "M" ? PALETTE.accentBlue : PALETTE.borderLight,
                background: p.gender === "M" ? "#EAF2FF" : PALETTE.white,
                color: p.gender === "M" ? PALETTE.accentBlue : PALETTE.textDark,
              }}
            >
              <FaMale /> Male
            </button>
            <button
              type="button"
              onClick={() => onGender(p.seat, "F")}
              className="flex-1 py-2.5 rounded-xl border-2 flex items-center justify-center gap-2 transition"
              style={{
                borderColor: p.gender === "F" ? "#E91E63" : PALETTE.borderLight,
                background: p.gender === "F" ? "#FFE9F1" : PALETTE.white,
                color: p.gender === "F" ? "#E91E63" : PALETTE.textDark,
              }}
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

  // ---- guard (AFTER all hooks) ----
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
        <p className="font-semibold" style={{ color: PALETTE.primaryRed }}>
          Booking details are incomplete. Please start again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 rounded-md text-white"
          style={{ background: PALETTE.primaryRed }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen" style={{ background: PALETTE.bgLight }}>
      {/* Mobile top bar like SearchResults */}
      <div
        className="sticky top-0 z-30"
        style={{ background: PALETTE.primaryRed, paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10"
          >
            <FaChevronLeft className="text-white" />
          </button>
          <div className="flex-1">
            <p className="text-white text-base font-semibold leading-tight">Confirm Booking</p>
            <p className="text-white/90 text-xs">
              {bus?.from} → {bus?.to}
            </p>
          </div>
          <Chip tone="yellow">
            <FaCalendarAlt className="mr-1" />
            {getNiceDate(date, departureTime)}
          </Chip>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-40"> {/* bottom space for sticky CTA */}
        {/* Steps (kept) */}
        <div className="pt-4">
          <BookingSteps currentStep={3} />
        </div>

        {/* Bus & Journey Summary card — mirrors SearchResults card visuals */}
        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.borderLight}` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "#FFF5F6", color: PALETTE.primaryRed }}
            >
              <FaBus />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold" style={{ color: PALETTE.textDark }}>
                {bus?.name || "Bus"}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Chip tone="red">{bus?.busType || "Seating"}</Chip>
                <Chip>
                  {bus?.from} → {bus?.to}
                </Chip>
                <Chip tone="blue">
                  <FaChair className="mr-1" />
                  {selectedSeats?.length} Seat{selectedSeats?.length > 1 ? "s" : ""}
                </Chip>
              </div>
            </div>
          </div>

          <Divider />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <FaMapMarkerAlt style={{ color: PALETTE.textLight }} />
              <div>
                <Label>Boarding</Label>
                <p className="font-medium" style={{ color: PALETTE.textDark }}>
                  {selectedBoardingPoint.point} <span className="text-xs">at</span>{" "}
                  <span className="tabular-nums font-semibold">{selectedBoardingPoint.time}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <FaMapMarkerAlt style={{ color: PALETTE.textLight }} />
              <div>
                <Label>Dropping</Label>
                <p className="font-medium" style={{ color: PALETTE.textDark }}>
                  {selectedDroppingPoint.point} <span className="text-xs">at</span>{" "}
                  <span className="tabular-nums font-semibold">{selectedDroppingPoint.time}</span>
                </p>
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Selected Seats</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s) => (
                  <Chip key={s} tone="blue">
                    <FaChair className="mr-1" /> {s}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.borderLight}` }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Contact Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RowInput
              id="name"
              name="name"
              label="Full Name"
              value={form.name}
              onChange={onChangeForm}
              autoComplete="name"
              enterKeyHint="next"
              placeholder="e.g., Ramesh Perera"
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
              placeholder="e.g., 07XXXXXXXX"
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
              placeholder="e.g., 200012345678"
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
              placeholder="e.g., ramesh@email.com"
              icon={<FaEnvelope />}
              required
            />
          </div>
        </div>

        {/* Passenger Details */}
        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.borderLight}` }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Passenger Details
          </h3>
          <div className="space-y-4">
            {passengers.map((p, idx) => (
              <PassengerRow
                key={p.seat}
                p={p}
                index={idx}
                onName={setPassengerName}
                onAge={setPassengerAge}
                onGender={setPassengerGender}
              />
            ))}
          </div>
        </div>

        {/* Fare Summary */}
        <div
          className="mt-4 rounded-2xl p-4"
          style={{ background: PALETTE.white, border: `1px solid ${PALETTE.borderLight}` }}
        >
          <h3 className="text-lg font-bold mb-3" style={{ color: PALETTE.textDark }}>
            Fare Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium" style={{ color: PALETTE.textLight }}>
                Subtotal
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.textDark }}
              >
                Rs. {prices.basePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium" style={{ color: PALETTE.textLight }}>
                Convenience Fee
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.textDark }}
              >
                Rs. {prices.convenienceFee.toFixed(2)}
              </span>
            </div>
            <Divider />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.textDark }}>
                Total
              </span>
              <span
                className="tabular-nums font-extrabold"
                style={{ color: PALETTE.textDark }}
              >
                Rs. {prices.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="mt-4">
          <label className="flex items-center text-sm" style={{ color: PALETTE.textDark }}>
            <input
              type="checkbox"
              className="mr-2"
              checked={termsAccepted}
              onChange={() => setTermsAccepted((v) => !v)}
              required
            />
            I agree to all Terms &amp; Conditions
          </label>
        </div>
      </div>

      {/* Sticky bottom CTA (matches SearchResults style) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: PALETTE.white, borderTop: `1px solid ${PALETTE.borderLight}` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs" style={{ color: PALETTE.textLight }}>
              Payable Amount
            </p>
            <p className="text-xl font-extrabold tabular-nums" style={{ color: PALETTE.textDark }}>
              Rs. {prices.total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            disabled={!termsAccepted}
            onClick={(e) => {
              // Submit via the same handler
              // Create a fake event so we reuse validation
              handleSubmit({ preventDefault: () => {} });
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PALETTE.primaryRed }}
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;
