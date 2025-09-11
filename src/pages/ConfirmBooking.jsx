// src/pages/ConfirmBooking.jsx
import { useMemo, useState, useCallback, memo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import apiClient from "../api"; // baseURL configured inside ../api
import useSeatLockBackGuard from "../hooks/useSeatLockBackGuard";
import useSeatLockCleanup from "../hooks/useSeatLockCleanup";

/* ---------------- Matte palette ---------------- */
const PALETTE = {
  primary: "#C74A50", // matte red to match SearchResults
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

  // Soft pill backgrounds
  datePillBg: "#FFF9DB", // very light yellow
  acPillBg: "#EAF5FF", // very light blue
  seatPillBg: "#FFE9EC", // very light red (matches matte red theme)

  // Very light green for time pill
  timeGreenBg: "#ECFDF5",
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
    style={{
      background: PALETTE.surface,
      border: `1px solid ${PALETTE.border}`,
    }}
  >
    {title ? (
      <h3
        className="text-lg font-semibold mb-3"
        style={{ color: PALETTE.text }}
      >
        {title}
      </h3>
    ) : null}
    {children}
  </div>
);

const Label = ({ children }) => (
  <span
    className="block text-xs font-semibold mb-1"
    style={{ color: PALETTE.textSubtle }}
  >
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

// Soft-colored pill variants (summary pills)
const SoftPill = ({ children, bg }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: bg, color: PALETTE.text }}
  >
    {children}
  </span>
);
const DatePill = ({ children }) => (
  <SoftPill bg={PALETTE.datePillBg}>{children}</SoftPill>
);
const AcPill = ({ children }) => (
  <SoftPill bg={PALETTE.acPillBg}>{children}</SoftPill>
);
const SeatPill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
    style={{ background: PALETTE.seatPillBg, color: PALETTE.primary }}
  >
    {children}
  </span>
);

// UPDATED: green time pill now matches other pills (no border)
const TimeGreenPill = ({ children }) => (
  <SoftPill bg={PALETTE.timeGreenBg}>{children}</SoftPill>
);

// Seat pill that follows selected gender (PassengerRow)
const GenderSeatPill = ({ gender, children }) => {
  const isMale = gender === "M";
  const bg = isMale ? PALETTE.violetBg : PALETTE.pinkBg;
  const fg = isMale ? PALETTE.violet : PALETTE.pink;
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ background: bg, color: fg }}
    >
      {children}
    </span>
  );
};

// --- Live hold countdown (15 min seat lock) ---
// UPDATED: accepts `seats` and prefers server `remainingMs` to avoid clock skew.
const HoldCountdown = ({ busId, date, departureTime, seats = [], onExpire }) => {
  const [remainingMs, setRemainingMs] = useState(null);
  const expiryRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const startTicking = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const tick = () => {
        const left = Math.max(0, (expiryRef.current ?? Date.now()) - Date.now());
        setRemainingMs(left);
        if (left <= 0) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          onExpire && onExpire();
        }
      };
      tick();
      timerRef.current = setInterval(tick, 1000);
    };

    const fetchOnce = async () => {
      const params = { busId, date, departureTime, seats };
      try {
        let ms = null;
        let serverExpiry = null;
        try {
          const r1 = await apiClient.get("/bookings/lock-remaining", { params });
          ms = r1?.data?.remainingMs ?? r1?.data?.ms ?? null;
          serverExpiry = r1?.data?.expiresAt || null;
        } catch {
          const r2 = await apiClient.get("/bookings/lock/remaining", { params });
          ms = r2?.data?.remainingMs ?? r2?.data?.ms ?? null;
          serverExpiry = r2?.data?.expiresAt || null;
        }

        // ✅ Prefer server-computed duration to neutralize client/server clock skew
        const leftMs =
          ms != null
            ? Math.max(0, Number(ms))
            : serverExpiry
            ? Math.max(0, new Date(serverExpiry).getTime() - Date.now())
            : 15 * 60 * 1000; // fallback

        if (cancelled) return;
        expiryRef.current = Date.now() + leftMs;
        startTicking();
      } catch {
        // conservative fallback (10 min) if API temporarily unavailable
        expiryRef.current = Date.now() + 10 * 60 * 1000;
        startTicking();
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } else if (!timerRef.current && expiryRef.current) {
        startTicking();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    fetchOnce();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // ✅ fetch only when the identity of the hold changes
  }, [busId, date, departureTime, onExpire, JSON.stringify(seats)]);

  if (remainingMs == null) {
    return (
      <span
        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
        style={{ background: PALETTE.seatPillBg, color: PALETTE.primary }}
      >
        Securing seats…
      </span>
    );
  }

  const total = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  const expired = total <= 0;

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold tabular-nums"
      style={{
        background: expired ? "#FEE2E2" : PALETTE.seatPillBg,
        color: expired ? "#991B1B" : PALETTE.primary,
      }}
      title="Your reserved seats are held for 15 minutes"
    >
      {expired ? "Hold expired" : `Hold: ${mm}:${ss}`}
    </span>
  );
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
const PassengerRow = memo(function PassengerRow({
  p,
  index,
  onName,
  onAge,
  onGender,
}) {
  return (
    <div
      className="p-4 rounded-2xl"
      style={{
        background: PALETTE.surfaceAlt,
        border: `1px solid ${PALETTE.border}`,
      }}
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: PALETTE.text }}>
          Passenger {index + 1}
        </p>
        {/* Seat pill now changes color with gender */}
        <GenderSeatPill gender={p.gender}>Seat {p.seat}</GenderSeatPill>
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
    const base =
      priceDetails?.basePrice ??
      (typeof totalPrice === "number" ? totalPrice : 0);
    const fee = priceDetails?.convenienceFee ?? 0;
    const tot = priceDetails?.totalPrice ?? totalPrice ?? base + fee;
    return {
      basePrice: Number(base) || 0,
      convenienceFee: Number(fee) || 0,
      total: Number(tot) || 0,
    };
  }, [priceDetails, totalPrice]);

  // ---- contact form (controlled) ----
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    nic: "",
    email: "",
  });
  const onChangeForm = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) =>
      prev[name] === value ? prev : { ...prev, [name]: value }
    );
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

  // track hold status to protect proceed action
  const [holdExpired, setHoldExpired] = useState(false);

  // Seats as strings (for hook)
  const selectedSeatStrings = useMemo(
    () => (selectedSeats || []).map(String),
    [selectedSeats]
  );

  // 🔧 Auto cleanup of locks when user cancels / leaves this page.
  // Suppress cleanup when actually proceeding to payment.
  const { releaseSeats, suppressAutoRelease } = useSeatLockCleanup({
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
  });

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (holdExpired) {
        alert("Your seat hold has expired. Please go back and reselect seats.");
        return;
      }

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

      const seatGendersOut = {};
      passengers.forEach((p) => (seatGendersOut[p.seat] = p.gender));

      // 👉 keep the lock while going to external payment flow
      suppressAutoRelease();

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
      holdExpired,
      suppressAutoRelease,
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

  // 🔒 Back-button seat-release guard (works on this page too)
  useSeatLockBackGuard({
    enabled: !missingData && !holdExpired && selectedSeatStrings.length > 0,
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
    onConfirmBack: () => navigate("/"),
  });

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
        style={{
          background: PALETTE.primary,
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-white text-base font-semibold leading-tight">
            Confirm Booking
          </p>
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
              <h2
                className="text-lg font-bold truncate"
                style={{ color: PALETTE.text }}
              >
                {bus?.name || "Bus"}
              </h2>
              <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
                {bus?.from} → {bus?.to}
              </p>
            </div>

            {/* Right-side pills with space-managed wrap, now includes DATE with colors */}
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <DatePill>{getNiceDate(date, departureTime)}</DatePill>
              <AcPill>{bus?.busType || "Seating"}</AcPill>
              <SeatPill>
                {selectedSeats?.length} Seat
                {selectedSeats?.length > 1 ? "s" : ""}
              </SeatPill>
              {/* Live hold countdown */}
              <HoldCountdown
                busId={bus?._id}
                date={date}
                departureTime={departureTime}
                seats={selectedSeatStrings}
                onExpire={() => {
                  setHoldExpired(true);
                  // proactively release if countdown reached zero while on page
                  releaseSeats();
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <Label>Boarding</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedBoardingPoint.point}{" "}
                <span className="text-xs">at</span>{" "}
                {/* Boarding time pill (now borderless & consistent) */}
                <TimeGreenPill>{selectedBoardingPoint.time}</TimeGreenPill>
              </p>
            </div>
            <div>
              <Label>Dropping</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedDroppingPoint.point}{" "}
                <span className="text-xs">at</span>{" "}
                <span className="tabular-nums">
                  {selectedDroppingPoint.time}
                </span>
              </p>
            </div>
            <div className="sm:col-span-2">
              <Label>Selected Seats</Label>
              <div className="flex flex-wrap gap-2">
                {/* Each seat chip uses the same low-red style as the seat-count pill */}
                {selectedSeats.map((s) => (
                  <SeatPill key={s}>Seat {s}</SeatPill>
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
              <span
                className="font-medium"
                style={{ color: PALETTE.textSubtle }}
              >
                Subtotal
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.basePrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span
                className="font-medium"
                style={{ color: PALETTE.textSubtle }}
              >
                Convenience Fee
              </span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.convenienceFee.toFixed(2)}
              </span>
            </div>
            <hr className="my-3" style={{ borderColor: PALETTE.border }} />
            <div className="flex justify-between text-base">
              <span className="font-bold" style={{ color: PALETTE.text }}>
                Total
              </span>
              <span
                className="tabular-nums font-extrabold"
                style={{ color: PALETTE.text }}
              >
                Rs. {prices.total.toFixed(2)}
              </span>
            </div>
            {holdExpired && (
              <p
                className="text-xs mt-2 font-semibold"
                style={{ color: "#991B1B" }}
              >
                Your seat hold has expired. Please go back and reselect seats.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Terms */}
        <div className="mt-4">
          <label
            className="flex items-center text-sm"
            style={{ color: PALETTE.text }}
          >
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
        style={{
          background: PALETTE.surface,
          borderTop: `1px solid ${PALETTE.border}`,
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-xs" style={{ color: PALETTE.textSubtle }}>
              Payable Amount
            </p>
            <p
              className="text-xl font-extrabold tabular-nums"
              style={{ color: PALETTE.text }}
            >
              Rs. {prices.total.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            disabled={!termsAccepted || holdExpired}
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
