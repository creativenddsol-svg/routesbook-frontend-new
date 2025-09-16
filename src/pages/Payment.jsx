// src/pages/Payment.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BookingSteps from "../components/BookingSteps";
import {
  FaBus,
  FaMapMarkerAlt,
  FaUserCircle,
  FaUsers,
  FaMale,
  FaFemale,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaArrowDown,
  FaPhone,
  FaIdCard,
  FaEnvelope,
} from "react-icons/fa";

// ✅ Use shared apiClient and getClientId
import apiClient, { getClientId } from "../api";
import useSeatLockBackGuard from "../hooks/useSeatLockBackGuard";
// ✅ NEW: auto-cleanup hook (adds release & suppression helpers)
import useSeatLockCleanup from "../hooks/useSeatLockCleanup";

/* ---------------- Matte palette to match ConfirmBooking ---------------- */
const PALETTE = {
  primary: "#C74A50",
  bg: "#F5F6F8",
  surface: "#FFFFFF",
  surfaceAlt: "#FAFBFC",
  border: "#E5E7EB",
  text: "#1A1A1A",
  textSubtle: "#6B7280",
  pillBg: "#F3F4F6",
  datePillBg: "#FFF9DB",
  acPillBg: "#EAF5FF",
  seatPillBg: "#FFE9EC",
  timeGreenBg: "#ECFDF5",
  violet: "#6D5BD0",
  violetBg: "#F1EFFF",
  pink: "#E05B88",
  pinkBg: "#FFEAF2",
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

const SoftPill = ({ children, bg }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
    style={{ background: bg, color: PALETTE.text }}
  >
    {children}
  </span>
);
const DatePill = ({ children }) => <SoftPill bg={PALETTE.datePillBg}>{children}</SoftPill>;
const AcPill = ({ children }) => <SoftPill bg={PALETTE.acPillBg}>{children}</SoftPill>;
const SeatPill = ({ children }) => (
  <span
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
    style={{ background: PALETTE.seatPillBg, color: PALETTE.primary }}
  >
    {children}
  </span>
);
const TimeGreenPill = ({ children }) => <SoftPill bg={PALETTE.timeGreenBg}>{children}</SoftPill>;

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

/* ---------------- Hold countdown (NO auto extend) ---------------- */
const HoldCountdown = ({
  busId,
  date,
  departureTime,
  seats, // array of seat strings
  onExpire,
  onTick,
  initialExpiry, // optional ms timestamp passed from previous page
}) => {
  const expiryRef = useRef(null);
  const timerRef = useRef(null);
  const [remainingMs, setRemainingMs] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const startTicking = () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const tick = () => {
        const target = expiryRef.current || Date.now();
        const left = Math.max(0, target - Date.now());
        setRemainingMs(left);
        onTick && onTick(left);
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
      try {
        const params = { busId, date, departureTime, seats: Array.isArray(seats) ? seats : [] };
        let r = await apiClient.get("/bookings/lock-remaining", { params });
        if (!r?.data) r = await apiClient.get("/bookings/lock/remaining", { params });

        const ms = r?.data?.remainingMs ?? r?.data?.ms ?? null;
        const serverExpiryISO = r?.data?.expiresAt || null;
        const serverExpiry = serverExpiryISO
          ? new Date(serverExpiryISO).getTime()
          : ms != null
          ? Date.now() + Math.max(0, Number(ms))
          : null;

        const initial =
          typeof initialExpiry === "number"
            ? initialExpiry
            : Number.isFinite(initialExpiry)
            ? Number(initialExpiry)
            : null;

        const target =
          serverExpiry && initial ? Math.min(serverExpiry, initial) : serverExpiry || initial || null;

        if (cancelled) return;
        expiryRef.current = target || Date.now(); // if unknown -> show expired
        startTicking();
      } catch {
        const fallback =
          typeof initialExpiry === "number" && initialExpiry > Date.now() ? initialExpiry : Date.now();
        expiryRef.current = fallback;
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
  }, [busId, date, departureTime, onExpire, onTick, JSON.stringify(seats), initialExpiry]);

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
      title="Your reserved seats are held for a limited time"
    >
      {expired ? "Hold expired" : `Hold: ${mm}:${ss}`}
    </span>
  );
};

const PaymentPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const {
    bus,
    selectedSeats = [],
    date,
    passenger,
    priceDetails,
    selectedBoardingPoint,
    selectedDroppingPoint,
    departureTime,
    passengers = [],
    seatGenders = {},
    // optional hold hints from previous step
    holdExpiresAt,
    lockExpiresAt,
    expiresAt,
    remainingMs,
  } = state || {};

  // ---- lock status on Payment page ----
  const [locking, setLocking] = useState(false);
  const [lockOk, setLockOk] = useState(false);
  const [lockMsg, setLockMsg] = useState("");
  const [holdExpired, setHoldExpired] = useState(false);

  const isIncomplete = !bus || !priceDetails || !passenger || !departureTime;
  const selectedSeatStrings = selectedSeats.map(String);

  // initial expiry timestamp if present
  const initialHoldExpiryTs = (() => {
    const raw = holdExpiresAt || lockExpiresAt || expiresAt || null;
    if (!raw && typeof remainingMs === "number") return Date.now() + Math.max(0, remainingMs);
    if (!raw) return null;
    if (typeof raw === "number") return raw;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  })();

  // 🔒 Back-button guard
  useSeatLockBackGuard({
    enabled: !isIncomplete && !holdExpired && lockOk && selectedSeatStrings.length > 0,
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
    onConfirmBack: () => navigate("/"),
  });

  // ✅ Auto-release helper
  const { releaseSeats, suppressAutoRelease } = useSeatLockCleanup({
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
  });

  const makeSeatAllocations = () =>
    passengers.length > 0
      ? passengers.map((p) => ({ seat: String(p.seat), gender: p.gender }))
      : selectedSeatStrings.map((s) => ({ seat: s, gender: seatGenders[s] || "M" }));

  // Check remaining hold (NO extension)
  const checkRemainingLock = async () => {
    try {
      const params = { busId: bus._id, date, departureTime, seats: selectedSeatStrings };
      let r = await apiClient.get("/bookings/lock-remaining", { params });
      if (!r?.data) r = await apiClient.get("/bookings/lock/remaining", { params });

      const ms = r?.data?.remainingMs ?? r?.data?.ms ?? null;
      const serverExpiryISO = r?.data?.expiresAt || null;
      const msLeft =
        ms != null
          ? Math.max(0, Number(ms))
          : serverExpiryISO
          ? Math.max(0, new Date(serverExpiryISO).getTime() - Date.now())
          : null;

      if (msLeft != null) {
        setLockOk(msLeft > 0);
        setHoldExpired(msLeft <= 0);
        setLockMsg(msLeft > 0 ? "" : "Hold expired. Please re-lock seats.");
      } else {
        if (initialHoldExpiryTs && initialHoldExpiryTs > Date.now()) {
          setLockOk(true);
          setHoldExpired(false);
          setLockMsg("");
        } else {
          setLockOk(false);
          setHoldExpired(true);
          setLockMsg("Unable to verify hold. Please re-lock seats.");
        }
      }
      return msLeft;
    } catch {
      if (initialHoldExpiryTs && initialHoldExpiryTs > Date.now()) {
        setLockOk(true);
        setHoldExpired(false);
        setLockMsg("");
        return initialHoldExpiryTs - Date.now();
      }
      setLockOk(false);
      setHoldExpired(true);
      setLockMsg("Unable to verify hold. Please re-lock seats.");
      return null;
    }
  };

  // Keep ensureSeatLock (not auto-used) to preserve logic footprint
  const ensureSeatLock = async () => {
    if (isIncomplete) {
      setLockOk(false);
      setLockMsg("Booking details are incomplete.");
      return false;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setLockOk(false);
      setLockMsg("Please login to lock seats.");
      return false;
    }
    if (!selectedSeatStrings.length) {
      setLockOk(false);
      setLockMsg("No seats selected.");
      return false;
    }
    const msLeft = await checkRemainingLock();
    if (msLeft != null && msLeft > 0) return true;

    setLocking(true);
    setLockMsg("");
    try {
      const payload = {
        busId: bus._id,
        date,
        departureTime,
        seats: selectedSeatStrings,
        seatAllocations: makeSeatAllocations(),
      };
      const res = await apiClient.post("/bookings/lock", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const ok = res?.data?.ok !== false;
      setLockOk(ok);
      if (!ok) setLockMsg(res?.data?.message || "Seat lock failed.");
      if (ok) setHoldExpired(false);
      return ok;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Seat lock failed. Try again.";
      setLockOk(false);
      setLockMsg(msg);
      return false;
    } finally {
      setLocking(false);
    }
  };

  // Cancel & release
  const cancelAndHome = async () => {
    try {
      await releaseSeats();
    } catch {
      const token = localStorage.getItem("token");
      try {
        await apiClient.delete("/bookings/release", {
          data: { busId: bus._id, date, departureTime, seats: selectedSeatStrings },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch {}
    } finally {
      navigate("/");
    }
  };

  // On mount: verify only
  useEffect(() => {
    if (isIncomplete) return;
    checkRemainingLock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isIncomplete]);

  const tryCreateBooking = async () => {
    const token = localStorage.getItem("token");
    const bookingPayload = {
      busId: bus._id,
      date,
      departureTime,
      passenger,
      selectedSeats: selectedSeatStrings,
      passengers,
      seatAllocations: makeSeatAllocations(),
      boardingPoint: selectedBoardingPoint,
      droppingPoint: selectedDroppingPoint,
      clientId: getClientId(),
    };
    return apiClient.post("/bookings", bookingPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleFakePayment = async () => {
    // Verify only; do NOT re-lock here
    const msLeft = await checkRemainingLock();
    if (msLeft == null || msLeft <= 0 || !lockOk || holdExpired) {
      alert("Your seat hold has expired. Please go back and reselect seats.");
      return;
    }

    suppressAutoRelease();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to complete the booking.");
        navigate("/login");
        return;
      }

      const res = await tryCreateBooking();
      alert("Payment successful (simulated)");
      navigate("/download-ticket", {
        state: { bookingDetails: { ...state, bookingId: res?.data?.booking?._id } },
      });
    } catch (err) {
      const apiMsg = err?.response?.data?.message;
      const lockConflict =
        err?.response?.status === 409 ||
        /lock(ed)?|expired|no longer locked|conflict/i.test(apiMsg || "");
      if (lockConflict) {
        setLockOk(false);
        setHoldExpired(true);
        setLockMsg("Hold expired or conflict. Please re-lock seats.");
        alert("Hold expired or conflict. Please go back and reselect seats.");
        return;
      }
      console.error("Booking error:", err?.response?.data || err?.message);
      alert(
        `Payment failed: ${
          apiMsg || "Could not complete booking. Please re-lock seats and retry."
        }`
      );
    }
  };

  const InfoCard = ({ icon, title, children }) => (
    <SectionCard title={title}>
      <div className="space-y-4">{children}</div>
    </SectionCard>
  );

  if (isIncomplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ background: PALETTE.bg }}>
        <div className="text-center rounded-xl shadow-md border p-8" style={{ background: PALETTE.surface, borderColor: PALETTE.border }}>
          <FaExclamationTriangle className="mx-auto text-5xl" style={{ color: "#F59E0B" }} />
          <h1 className="text-xl font-bold mt-2" style={{ color: PALETTE.primary }}>
            Booking Error
          </h1>
          <p className="mt-2" style={{ color: PALETTE.text }}>
            Your booking details are incomplete. Please start over.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-2 rounded-lg text-white font-semibold"
            style={{ background: PALETTE.primary }}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      {/* Matte top bar to match ConfirmBooking */}
      <div
        className="sticky top-0 z-30"
        style={{ background: PALETTE.primary, paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3">
          <p className="text-white text-base font-semibold leading-tight">Payment</p>
          <p className="text-white/90 text-xs">
            {bus?.from} → {bus?.to} •{" "}
            {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            at {departureTime}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-40">
        <div className="pt-4">
          <BookingSteps currentStep={4} />
        </div>

        {/* Journey Overview pills & hold status */}
        <SectionCard>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate" style={{ color: PALETTE.text }}>
                {bus?.name}
              </h2>
              <p className="text-sm" style={{ color: PALETTE.textSubtle }}>
                {bus?.from} → {bus?.to}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <DatePill>
                {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                at {departureTime}
              </DatePill>
              <AcPill>{bus?.busType}</AcPill>
              <SeatPill>
                {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""}
              </SeatPill>
              <HoldCountdown
                busId={bus._id}
                date={date}
                departureTime={departureTime}
                seats={selectedSeatStrings}
                initialExpiry={initialHoldExpiryTs}
                onExpire={() => {
                  setHoldExpired(true);
                  setLockOk(false);
                  setLockMsg("Hold expired. Please re-lock seats.");
                }}
                onTick={(ms) => {
                  if (ms > 0 && holdExpired) setHoldExpired(false);
                }}
              />
            </div>
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-2">
          {/* Left Column: Details in matte cards */}
          <div className="lg:col-span-7">
            <InfoCard icon={<FaBus />} title="Journey Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <Label>Operator</Label>
                  <p className="font-medium" style={{ color: PALETTE.text }}>
                    {bus.name}
                  </p>
                </div>
                <div>
                  <Label>Type</Label>
                  <p className="font-medium" style={{ color: PALETTE.text }}>
                    {bus.busType}
                  </p>
                </div>
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
            </InfoCard>

            <InfoCard icon={<FaUsers />} title="Passenger Information">
              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: PALETTE.textSubtle }}>
                  Primary Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FaUserCircle className="opacity-60" />
                    <span className="font-medium" style={{ color: PALETTE.text }}>
                      {passenger.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="opacity-60" />
                    <span className="font-medium" style={{ color: PALETTE.text }}>
                      {passenger.mobile}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaIdCard className="opacity-60" />
                    <span className="font-medium" style={{ color: PALETTE.text }}>
                      {passenger.nic}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="opacity-60" />
                    <span className="font-medium" style={{ color: PALETTE.text }}>
                      {passenger.email}
                    </span>
                  </div>
                </div>
              </div>

              <hr className="border-dashed" style={{ borderColor: PALETTE.border }} />

              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: PALETTE.textSubtle }}>
                  Travellers
                </h4>
                <ul className="space-y-3">
                  {passengers.map((p) => (
                    <li
                      key={p.seat}
                      className="flex items-center justify-between p-2 border-b last:border-b-0"
                      style={{ borderColor: PALETTE.border }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="font-bold text-sm rounded-full w-8 h-8 flex items-center justify-center"
                          style={{ color: "#7C1D1D", background: PALETTE.seatPillBg }}
                        >
                          {p.seat}
                        </span>
                        <span className="font-medium" style={{ color: PALETTE.text }}>
                          {p.name || "-"}
                        </span>
                      </div>
                      <GenderSeatPill gender={p.gender}>
                        {p.gender === "F" ? <FaFemale className="mr-1" /> : <FaMale className="mr-1" />}
                        {p.gender === "F" ? "Female" : "Male"}
                      </GenderSeatPill>
                    </li>
                  ))}
                </ul>
              </div>
            </InfoCard>
          </div>

          {/* Right Column: Fare Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <SectionCard title="Fare Summary">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium" style={{ color: PALETTE.textSubtle }}>
                      Subtotal
                    </span>
                    <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                      Rs. {priceDetails.basePrice?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium" style={{ color: PALETTE.textSubtle }}>
                      Convenience Fee
                    </span>
                    <span className="tabular-nums font-semibold" style={{ color: PALETTE.text }}>
                      Rs. {priceDetails.convenienceFee?.toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-3" style={{ borderColor: PALETTE.border }} />
                  <div className="flex justify-between text-base">
                    <span className="font-bold" style={{ color: PALETTE.text }}>
                      Total
                    </span>
                    <span className="tabular-nums font-extrabold" style={{ color: PALETTE.text }}>
                      Rs. {priceDetails.totalPrice?.toFixed(2)}
                    </span>
                  </div>

                  {/* Lock/Hold status */}
                  <div className="mt-3 flex items-center gap-2">
                    {lockOk ? (
                      <span
                        className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#ECFDF5", color: "#065F46" }}
                      >
                        Seats secured
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: "#FEF2F2", color: "#991B1B" }}
                      >
                        {lockMsg || "Seats not secured"}
                      </span>
                    )}
                    <HoldCountdown
                      busId={bus._id}
                      date={date}
                      departureTime={departureTime}
                      seats={selectedSeatStrings}
                      initialExpiry={initialHoldExpiryTs}
                      onExpire={() => {
                        setHoldExpired(true);
                        setLockOk(false);
                        setLockMsg("Hold expired. Please re-lock seats.");
                      }}
                      onTick={(ms) => {
                        if (ms > 0 && holdExpired) setHoldExpired(false);
                      }}
                    />
                  </div>

                  {/* Cancel booking (kept, subtle) */}
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = window.confirm(
                          "Release your held seats and cancel this booking?"
                        );
                        if (!ok) return;
                        await cancelAndHome();
                      }}
                      className="text-xs underline"
                      style={{ color: PALETTE.primary }}
                    >
                      Cancel booking
                    </button>
                  </div>
                </div>
              </SectionCard>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA to match ConfirmBooking */}
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
              Rs. {priceDetails.totalPrice?.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleFakePayment}
            disabled={locking || !lockOk || holdExpired}
            className="px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: PALETTE.primary }}
          >
            Pay Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
