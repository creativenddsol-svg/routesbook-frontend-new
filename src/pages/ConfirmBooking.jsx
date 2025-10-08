// src/pages/ConfirmBooking.jsx
import { useMemo, useState, useCallback, memo, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
// import BookingSteps from "../components/BookingSteps";
import apiClient from "../api";
import useSeatLockBackGuard from "../hooks/useSeatLockBackGuard";
import useSeatLockCleanup from "../hooks/useSeatLockCleanup";

// ✅ no-op replacement so existing JSX does not change
const BookingSteps = () => null;

/* ---------------- Matte palette ---------------- */
const PALETTE = {
  primary: "#C74A50",
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",
  violet: "#6D5BD0",
  violetBg: "#F1EFFF",
  pink: "#E05B88",
  pinkBg: "#FFEAF2",
  datePillBg: "#FFF9DB",
  acPillBg: "#EAF5FF",
  seatPillBg: "#FFE9EC",
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
const TimeGreenPill = ({ children }) => (
  <SoftPill bg={PALETTE.timeGreenBg}>{children}</SoftPill>
);

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

/* ----- hold remaining helpers ----- */
async function fetchHoldRemaining({ busId, date, departureTime }) {
  const params = { busId, date, departureTime, t: Date.now() };
  try {
    const r1 = await apiClient.get("/bookings/lock-remaining", { params });
    return {
      ms: r1?.data?.remainingMs ?? r1?.data?.ms ?? null,
      expiresAt: r1?.data?.expiresAt ?? null,
      headers: r1?.headers,
    };
  } catch {
    const r2 = await apiClient.get("/bookings/lock/remaining", { params });
    return {
      ms: r2?.data?.remainingMs ?? r2?.data?.ms ?? null,
      expiresAt: r2?.data?.expiresAt ?? null,
      headers: r2?.headers,
    };
  }
}
function serverNowFromHeaders(headers) {
  const h = headers?.date;
  const t = h ? Date.parse(h) : NaN;
  return Number.isFinite(t) ? t : Date.now();
}

/* --- Live hold countdown (15 min seat lock) --- */
const HoldCountdown = ({ busId, date, departureTime, onExpire }) => {
  const [remainingMs, setRemainingMs] = useState(null);
  const expiryRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const startTicking = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const tick = () => {
        const left = Math.max(
          0,
          (expiryRef.current ?? Date.now()) - Date.now()
        );
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

    const init = async () => {
      try {
        const { ms, expiresAt, headers } = await fetchHoldRemaining({
          busId,
          date,
          departureTime,
        });
        const nowServer = serverNowFromHeaders(headers);
        const target = expiresAt
          ? new Date(expiresAt).getTime()
          : ms != null
          ? nowServer + Math.max(0, Number(ms))
          : nowServer + 15 * 60 * 1000;
        if (cancelled) return;
        expiryRef.current = target;
        startTicking();
      } catch {
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

    init();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [busId, date, departureTime, onExpire]);

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

/* ---------------- persist-to-SearchResults helpers ---------------- */
const CHECKOUT_STATE_KEY = "rb_checkout_state_v1";
function saveCheckoutState(payload) {
  try {
    sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(payload));
  } catch {}
}

/* RowInput (unchanged except error/blur passthrough) */
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
  onBlur,
  error,
  maxLength,
  pattern,
}) => (
  <div className="w-full">
    <Label>{label}</Label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      autoComplete={autoComplete}
      inputMode={inputMode}
      enterKeyHint={enterKeyHint}
      placeholder={placeholder}
      required={required}
      maxLength={maxLength}
      pattern={pattern}
      aria-invalid={!!error}
      className="w-full bg-white px-3 py-3 rounded-xl border outline-none"
      style={{
        borderColor: error ? "#DC2626" : PALETTE.border,
        color: PALETTE.text,
      }}
    />
    {error ? (
      <p className="mt-1 text-xs font-medium" style={{ color: "#B91C1C" }}>
        {error}
      </p>
    ) : null}
  </div>
);

/* -------- Passenger row -------- */
const PassengerRow = memo(function PassengerRow({
  p,
  index,
  onName,
  onAge,
  onGender,
  errorsForSeat,
  onBlurName,
  onBlurAge,
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
            onBlur={() => onBlurName?.(p.seat)}
            autoComplete="name"
            enterKeyHint="next"
            placeholder="e.g., Ramesh Perera"
            required
            error={errorsForSeat?.name}
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
            onBlur={() => onBlurAge?.(p.seat)}
            inputMode="numeric"
            enterKeyHint="next"
            placeholder="e.g., 28"
            error={errorsForSeat?.age}
          />
        </div>
        <div className="md:col-span-2">
          <Label>Gender</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onGender(p.seat, "M")}
              className="py-2.5 rounded-full border text-sm font-medium transition"
              style={{
                borderColor:
                  p.gender === "M"
                    ? PALETTE.violet
                    : errorsForSeat?.gender
                    ? "#DC2626"
                    : PALETTE.border,
                background: p.gender === "M" ? PALETTE.violetBg : "#FFFFFF",
                color: p.gender === "M" ? PALETTE.violet : PALETTE.text,
              }}
            >
              Male
            </button>
            <button
              type="button"
              onClick={() => onGender(p.seat, "F")}
              className="py-2.5 rounded-full border text-sm font-medium transition"
              style={{
                borderColor:
                  p.gender === "F"
                    ? PALETTE.pink
                    : errorsForSeat?.gender
                    ? "#DC2626"
                    : PALETTE.border,
                background: p.gender === "F" ? PALETTE.pinkBg : "#FFFFFF",
                color: p.gender === "F" ? PALETTE.pink : PALETTE.text,
              }}
            >
              Female
            </button>
          </div>
          {errorsForSeat?.gender ? (
            <p className="mt-1 text-xs font-medium" style={{ color: "#B91C1C" }}>
              {errorsForSeat.gender}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
});

/* ========================= Component ========================= */
const ConfirmBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pageTopRef = useRef(null);

  const {
    bus,
    selectedSeats,
    date,
    totalPrice,
    priceDetails,
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    seatGenders,
  } = location.state || {};

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
      if (i === -1 || prev[i].name === name) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], name };
      return next;
    });
  }, []);

  const setPassengerAge = useCallback((seat, age) => {
    setPassengers((prev) => {
      const i = prev.findIndex((x) => x.seat === String(seat));
      if (i === -1 || prev[i].age === age) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], age };
      return next;
    });
  }, []);

  const setPassengerGender = useCallback((seat, gender) => {
    setPassengers((prev) => {
      const i = prev.findIndex((x) => x.seat === String(seat));
      if (i === -1 || prev[i].gender === gender) return prev;
      const next = prev.slice();
      next[i] = { ...next[i], gender };
      return next;
    });
  }, []);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [holdExpired, setHoldExpired] = useState(false);

  // ✅ Inline errors
  const [errors, setErrors] = useState({
    name: "",
    mobile: "",
    nic: "",
    email: "",
    terms: "",
    passengers: {},
  });

  const selectedSeatStrings = useMemo(
    () => (selectedSeats || []).map(String),
    [selectedSeats]
  );

  const { releaseSeats, suppressAutoRelease } = useSeatLockCleanup({
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
  });

  // Final hold verification before navigating to payment
  const verifyHoldAlive = useCallback(async () => {
    try {
      const { ms, expiresAt, headers } = await fetchHoldRemaining({
        busId: bus?._id,
        date,
        departureTime,
      });
      const now = serverNowFromHeaders(headers);
      const left = expiresAt ? new Date(expiresAt).getTime() - now : ms ?? 0;
      return left > 0;
    } catch {
      return true;
    }
  }, [bus?._id, date, departureTime]);

  /* ---------- Validation helpers ---------- */
  const phoneOk = (v) => /^0\d{9,10}$/.test(String(v || "").trim());
  const emailOk = (v) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
  const nonEmpty = (v) => String(v || "").trim().length > 1;

  const computePassengerErrors = useCallback((list) => {
    const pe = {};
    list.forEach((p) => {
      const e = {};
      if (!nonEmpty(p.name)) e.name = "Passenger name is required";
      if (p.age && Number(p.age) < 0) e.age = "Age must be positive";
      if (!p.gender) e.gender = "Please select gender";
      if (Object.keys(e).length) pe[p.seat] = e;
    });
    return pe;
  }, []);

  const validateAll = useCallback(() => {
    const next = {
      name: nonEmpty(form.name) ? "" : "Full name is required",
      mobile: phoneOk(form.mobile)
        ? ""
        : "Enter a valid mobile number (e.g., 07XXXXXXXX)",
      nic: nonEmpty(form.nic) ? "" : "NIC / Passport is required",
      email: emailOk(form.email) ? "" : "Enter a valid email address",
      terms: termsAccepted ? "" : "You must accept the Terms & Conditions",
      passengers: computePassengerErrors(passengers),
    };
    setErrors(next);

    const firstFieldId = next.name
      ? "name"
      : next.mobile
      ? "mobile"
      : next.nic
      ? "nic"
      : next.email
      ? "email"
      : Object.keys(next.passengers)[0]
      ? `p-name-${Object.keys(next.passengers)[0]}`
      : "";

    if (firstFieldId) {
      const el = document.getElementById(firstFieldId);
      if (el?.scrollIntoView)
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el?.focus) setTimeout(() => el.focus(), 200);
      return false;
    }
    return true;
  }, [form, termsAccepted, passengers, computePassengerErrors]);

  const blurValidateField = useCallback(
    (field) => {
      setErrors((prev) => {
        const next = { ...prev };
        if (field === "name")
          next.name = nonEmpty(form.name) ? "" : "Full name is required";
        if (field === "mobile")
          next.mobile = phoneOk(form.mobile)
            ? ""
            : "Enter a valid mobile number (e.g., 07XXXXXXXX)";
        if (field === "nic")
          next.nic = nonEmpty(form.nic) ? "" : "NIC / Passport is required";
        if (field === "email")
          next.email = emailOk(form.email) ? "" : "Enter a valid email address";
        return next;
      });
    },
    [form]
  );

  const blurValidatePassenger = useCallback(
    (seat, field) => {
      setErrors((prev) => {
        const next = { ...prev, passengers: { ...prev.passengers } };
        const p = passengers.find((x) => x.seat === String(seat));
        const slot = { ...(next.passengers[seat] || {}) };
        if (field === "name")
          slot.name = nonEmpty(p?.name) ? "" : "Passenger name is required";
        if (field === "age" && p?.age && Number(p.age) < 0)
          slot.age = "Age must be positive";
        next.passengers[seat] = slot;
        if (!slot.name && !slot.age && !slot.gender)
          delete next.passengers[seat];
        return next;
      });
    },
    [passengers]
  );

  const toggleTerms = () => {
    setTermsAccepted((v) => {
      const nv = !v;
      setErrors((prev) => ({
        ...prev,
        terms: nv ? "" : "You must accept the Terms & Conditions",
      }));
      return nv;
    });
  };

  /* -------- Proceed to payment -------- */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!validateAll()) return;
      if (holdExpired) {
        alert("Your seat hold has expired. Please go back and reselect seats.");
        return;
      }
      if (!termsAccepted) {
        alert("Please agree to the Terms & Conditions.");
        return;
      }

      const stillHeld = await verifyHoldAlive();
      if (!stillHeld) {
        setHoldExpired(true);
        releaseSeats();
        alert("Your seat hold has expired. Please go back and reselect seats.");
        return;
      }

      const seatGendersOut = {};
      (passengers || []).forEach((p) => (seatGendersOut[p.seat] = p.gender));

      // keep the lock while going to external payment flow
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
      verifyHoldAlive,
      releaseSeats,
      validateAll,
    ]
  );

  const missingData =
    !bus ||
    !selectedSeats ||
    !date ||
    !selectedBoardingPoint ||
    !selectedDroppingPoint ||
    prices.total === undefined;

  /* --------- Back behavior: go back to Search Results + keep locks --------- */
  const persistAndGoBack = useCallback(() => {
    // prevent Search Results cleanup from releasing seats
    sessionStorage.setItem("rb_skip_release_on_unmount", "1");
    // mark that we are explicitly returning from confirm
    sessionStorage.setItem("rb_returning_from_confirm", "1");

    // persist snapshot so Search Results can rehydrate
    const busKey = `${bus?._id}-${departureTime}`;
    saveCheckoutState({
      busKey,
      date,
      data: {
        selectedSeats: (selectedSeats || []).map(String),
        seatGenders: seatGenders || {},
        selectedBoardingPoint,
        selectedDroppingPoint,
        basePrice: prices.basePrice,
        convenienceFee: prices.convenienceFee,
        totalPrice: prices.total,
      },
    });

    // don't auto-release in our cleanup hook
    suppressAutoRelease();

    // robustly route back to the SAME search (avoid falling to Home)
    const fromCity = bus?.from;
    const toCity = bus?.to;
    if (fromCity && toCity && date) {
      const qs = `from=${encodeURIComponent(fromCity)}&to=${encodeURIComponent(
        toCity
      )}&date=${encodeURIComponent(date)}`;
      navigate(`/search-results?${qs}`);
    } else {
      // safe fallback if somehow missing metadata
      navigate(-1);
    }
  }, [
    bus?._id,
    bus?.from,
    bus?.to,
    departureTime,
    date,
    selectedSeats,
    seatGenders,
    selectedBoardingPoint,
    selectedDroppingPoint,
    prices,
    suppressAutoRelease,
    navigate,
  ]);

  useSeatLockBackGuard({
    enabled: !missingData && !holdExpired && (selectedSeatStrings?.length || 0) > 0,
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
    // ⬇️ Force the correct back destination + preserve locks and state
    onConfirmBack: persistAndGoBack,
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
    <div ref={pageTopRef} className="min-h-screen" style={{ background: PALETTE.bg }}>
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

      <div className="max-w-6xl mx-auto px-4 pb-24 sm:pb-40">
        <div className="pt-4">
          <BookingSteps currentStep={3} />
        </div>

        {/* Error banner */}
        {errors.name ||
        errors.mobile ||
        errors.nic ||
        errors.email ||
        Object.keys(errors.passengers || {}).length ||
        errors.terms ||
        holdExpired ? (
          <div
            className="mt-3 rounded-xl px-3 py-2 text-xs font-medium"
            style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
          >
            {holdExpired
              ? "Your seat hold has expired. Please go back and reselect seats."
              : "Please correct the highlighted fields below."}
          </div>
        ) : null}

        {/* Journey Overview */}
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

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <DatePill>{getNiceDate(date, departureTime)}</DatePill>
              <AcPill>{bus?.busType || "Seating"}</AcPill>
              <SeatPill>
                {selectedSeats?.length} Seat{selectedSeats?.length > 1 ? "s" : ""}
              </SeatPill>
              <HoldCountdown
                busId={bus?._id}
                date={date}
                departureTime={departureTime}
                onExpire={() => {
                  setHoldExpired(true);
                  releaseSeats();
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-sm">
            <div>
              <Label>Boarding</Label>
              <p className="font-medium" style={{ color: PALETTE.text }}>
                {selectedBoardingPoint.point} <span className="text-xs">at</span>{" "}
                <TimeGreenPill>{selectedBoardingPoint.time}</TimeGreenPill>
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
              onBlur={() => blurValidateField("name")}
              autoComplete="name"
              enterKeyHint="next"
              placeholder="e.g., Ramesh Perera"
              required
              error={errors.name}
              maxLength={80}
            />
            <RowInput
              id="mobile"
              name="mobile"
              label="Mobile Number"
              type="tel"
              value={form.mobile}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("mobile")}
              autoComplete="tel"
              inputMode="tel"
              enterKeyHint="next"
              placeholder="e.g., 07XXXXXXXX"
              required
              error={errors.mobile}
              maxLength={11}
              pattern="^0\\d{9,10}$"
            />
            <RowInput
              id="nic"
              name="nic"
              label="NIC / Passport"
              value={form.nic}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("nic")}
              autoComplete="off"
              enterKeyHint="next"
              placeholder="e.g., 200012345678"
              required
              error={errors.nic}
              maxLength={20}
            />
            <RowInput
              id="email"
              name="email"
              label="Email Address"
              type="email"
              value={form.email}
              onChange={onChangeForm}
              onBlur={() => blurValidateField("email")}
              autoComplete="email"
              inputMode="email"
              enterKeyHint="done"
              placeholder="e.g., ramesh@email.com"
              required
              error={errors.email}
              maxLength={100}
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
                errorsForSeat={errors.passengers?.[p.seat]}
                onBlurName={(seat) => blurValidatePassenger(seat, "name")}
                onBlurAge={(seat) => blurValidatePassenger(seat, "age")}
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
            {holdExpired && (
              <p className="text-xs mt-2 font-semibold" style={{ color: "#991B1B" }}>
                Your seat hold has expired. Please go back and reselect seats.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Terms */}
        <div className="mt-4">
          <label className="flex items-center text-sm" style={{ color: PALETTE.text }}>
            <input
              type="checkbox"
              className="mr-2"
              checked={termsAccepted}
              onChange={toggleTerms}
              required
            />
            I agree to all Terms &amp; Conditions
          </label>
          {errors.terms ? (
            <p className="mt-1 text-xs font-medium" style={{ color: "#B91C1C" }}>
              {errors.terms}
            </p>
          ) : null}
        </div>

        {/* Mobile CTA */}
        <div className="sm:hidden mt-6">
          <button
            type="button"
            disabled={!termsAccepted || holdExpired}
            onClick={(e) => {
              handleSubmit({ preventDefault: () => {} });
            }}
            className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PALETTE.primary }}
          >
            Proceed to Pay
          </button>
          <p className="mt-2 text-center text-xs" style={{ color: PALETTE.textSubtle }}>
            Payable Amount:{" "}
            <span className="font-bold tabular-nums" style={{ color: PALETTE.text }}>
              Rs. {prices.total.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      {/* Desktop sticky CTA */}
      <div
        className="hidden sm:block fixed bottom-0 left-0 right-0 z-40"
        style={{
          background: PALETTE.surface,
          borderTop: `1px solid ${PALETTE.border}`,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
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
            disabled={!termsAccepted || holdExpired}
            onClick={(e) => {
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
