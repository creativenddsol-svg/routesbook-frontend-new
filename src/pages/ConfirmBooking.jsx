// src/pages/ConfirmBooking.jsx
import { useMemo, useState, useCallback, memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import apiClient from "../api"; // baseURL configured inside ../api

/* ---------------- Matte palette ---------------- */
const PALETTE = {
  primary: "#C74A50",      // matte red to match SearchResults
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",

  // New: gender tones
  violet: "#6D5BD0",
  violetBg: "#F1EFFF",
  pink: "#E05B88",
  pinkBg: "#FFEAF2",
};

/* ---------------- Helpers ---------------- */
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

const SectionCard = ({ title, children }) => (
  <div
    className="rounded-2xl p-4 mt-4"
    style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.border}` }}
  >
    {title ? (
      <h3 className="text-lg font-semibold mb-3" style={{ color: PALETTE.text }}>
        {title}
      </h3>
    ) : null}
    {children}
  </div>
);

const Label = ({ children }) => (
  <span className="block text-xs font-semibold mb-1" style={{ color: PALETTE.textSubtle }}>
    {children}
  </span>
);

const Pill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: PALETTE.pillBg, color: PALETTE.text }}
  >
    {children}
  </span>
);

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
  placeholder,
  required,
}) => (
  <div className="w-full">
    <Label>{label}</Label>
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
      required={required}
      className="w-full bg-white px-3 py-3 rounded-xl border outline-none"
      style={{ borderColor: PALETTE.border, color: PALETTE.text }}
    />
  </div>
);

/* -------- Passenger row (memoized; minimal UI) -------- */
const PassengerRow = memo(function PassengerRow({ p, index, onName, onAge, onGender }) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{ background: PALETTE.surfaceAlt, border: `1px solid ${PALETTE.border}` }}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: PALETTE.text }}>
          Passenger {index + 1}
        </p>
        <Pill>Seat {p.seat}</Pill>
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
            required
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
          <div className="grid grid-cols-2 gap-2">
            {/* Male = violet pill */}
            <button
              type="button"
              onClick={() => onGender(p.seat, "M")}
              className="py-2.5 rounded-full border text-sm font-medium transition"
              style={{
                borderColor: p.gender === "M" ? PALETTE.violet : PALETTE.border,
                background: p.gender === "M" ? PALETTE.violetBg : "#FFFFFF",
                color: p.gender === "M" ? PALETTE.violet : PALETTE.text,
              }}
            >
              Male
            </button>
            {/* Female = pink pill */}
            <button
              type="button"
              onClick={() => onGender(p.seat, "F")}
              className="py-2.5 rounded-full border text-sm font-medium transition"
              style={{
                borderColor: p.gender === "F" ? PALETTE.pink : PALETTE.border,
                background: p.gender === "F" ? PALETTE.pinkBg : "#FFFFFF",
                color: p.gender === "F" ? PALETTE.pink : PALETTE.text,
              }}
            >
              Female
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

      // Optional: validate seats on server
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

  // ---- guard ----
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
        <p className="font-semibold" style={{ color: PALETTE.primary }}>
          Booking details are incomplete. Please start again.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 px-4 py-2 rounded-md text-white"
          style={{ background: PALETTE.primary }}
        >
          Go to Home
        </button>
      </div>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      {/* Matte top bar */}
      <div
        className="sticky top-0 z-30"
        style={{ background: PALETTE.primary, paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-white text-base font-semibold leading-tight">Confirm Booking</p>
          <p className="text-white/90 text-xs">
            {bus?.from} → {bus?.to} • {getNiceDate(date, departureTime)}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-40">
        <div className="pt-4">
          <BookingSteps currentStep={3} />
        </div>

        {/* Journey Overview (minimal) */}
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: PALETTE.text }}>
                {bus?.name || "Bus"}
              </h2>
              <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
                {bus?.from} → {bus?.to}
              </p>
            </div>

            {/* Right-side pills with space-managed wrap, now includes DATE */}
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <Pill>{getNiceDate(date, departureTime)}</Pill>
              <Pill>{bus?.busType || "Seating"}</Pill>
              <Pill>
                {selectedSeats?.length} Seat{selectedSeats?.length > 1 ? "s" : ""}
              </Pill>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <Label>Boarding</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedBoardingPoint.point} <span className="text-xs">at</span>{" "}
                <span className="tabular-nums">{selectedBoardingPoint.time}</span>
              </p>
            </div>
            <div>
              <Label>Dropping</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedDroppingPoint.point} <span className="text-xs">at</span>{" "}
                <span className="tabular-nums">{selectedDroppingPoint.time}</span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Selected Seats</Label>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((s) => (
                  <Pill key={s}>Seat {s}</Pill>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Contact Details */}
        <SectionCard title="Contact Details">
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
              required
            />
          </div>
        </SectionCard>

        {/* Passenger Details */}
        <SectionCard title="Passenger Details">
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
        </SectionCard>

        {/* Fare Summary */}
        <SectionCard title="Fare Summary">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium" style={{ color: PALETTE.textSubtle }}>
                Subtotal
              </span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {prices.basePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium" style={{ color: PALETTE.textSubtle }}>
                Convenience Fee
              </span>
              <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                Rs. {prices.convenienceFee.toFixed(2)}
              </span>
            </div>
            <hr className="my-3" style={{ borderColor: PALETTE.border }} />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.text }}>
                Total
              </span>
              <span className="tabular-nums font-extrabold" style={{ color: PALETTE.text }}>
                Rs. {prices.total.toFixed(2)}
              </span>
            </div>
          </div>
        </SectionCard>

        {/* Terms */}
        <div className="mt-4">
          <label className="flex items-center text-sm" style={{ color: PALETTE.text }}>
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

      {/* Sticky bottom CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{ background: PALETTE.surface, borderTop: `1px solid ${PALETTE.border}` }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs" style={{ color: PALETTE.textSubtle }}>
              Payable Amount
            </p>
            <p className="text-xl font-extrabold tabular-nums" style={{ color: PALETTE.text }}>
              Rs. {prices.total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            disabled={!termsAccepted}
            onClick={(e) => {
              // reuse validation
              handleSubmit({ preventDefault: () => {} });
            }}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PALETTE.primary }}
          >
            Proceed to Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBooking;
