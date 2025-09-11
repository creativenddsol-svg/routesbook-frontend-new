// src/pages/Payment.jsx
import { useEffect, useMemo, useRef, useState } from "react";
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

/* ---------------- Hold countdown for THIS user's seats ---------------- */
// Reworked to fetch ONCE per seat set and then tick locally.
// Also passes a cache-busting param to avoid 304/stale caching.
const HoldCountdown = ({
  busId,
  date,
  departureTime,
  seats = [], // array of seat strings
  onExpire,
  onTick,
}) => {
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

    const fetchRemaining = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await apiClient.get("/bookings/lock-remaining", {
          params: {
            busId,
            date,
            departureTime,
            seats: Array.isArray(seats) ? seats : [],
            t: Date.now(), // cache-bust to avoid 304/stale issues
          },
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        const ms = res?.data?.remainingMs ?? res?.data?.ms ?? null;
        const serverExpiry = res?.data?.expiresAt || null;
        const target = serverExpiry
          ? new Date(serverExpiry).getTime()
          : ms != null
          ? Date.now() + Math.max(0, Number(ms))
          : null;

        if (!cancelled && target) {
          expiryRef.current = target;
          startTicking();
        }
      } catch {
        // graceful fallback: short timer so user can re-lock
        expiryRef.current = Date.now() + 30 * 1000;
        startTicking();
      }
    };

    // Only refetch when the identity of the lock changes (bus/date/time/seats)
    fetchRemaining();

    // Pause/resume ticking when tab visibility changes
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

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // seats in stringified form to avoid identity churn triggering refetch
  }, [busId, date, departureTime, onExpire, onTick, JSON.stringify(seats)]);

  if (remainingMs == null) return null;

  const total = Math.ceil(remainingMs / 1000);
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");

  return (
    <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
      {total <= 0 ? "Hold expired" : `Hold: ${mm}:${ss}`}
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
  } = state || {};

  // ---- lock status on Payment page ----
  const [locking, setLocking] = useState(false);
  const [lockOk, setLockOk] = useState(false);
  const [lockMsg, setLockMsg] = useState("");
  const [holdExpired, setHoldExpired] = useState(false);

  const isIncomplete =
    !bus || !priceDetails || !passenger || !departureTime;

  // 🚫 Avoid seats array identity churn across renders
  const selectedSeatStrings = useMemo(
    () => selectedSeats.map(String),
    [selectedSeats]
  );

  // 🔒 Back-button seat-release guard on Payment page — go HOME on confirm
  useSeatLockBackGuard({
    enabled: !isIncomplete && !holdExpired && lockOk && selectedSeatStrings.length > 0,
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
    onConfirmBack: () => navigate("/"),
  });

  // ✅ NEW: auto-release on unload / route change, with manual controls
  const { releaseSeats, suppressAutoRelease } = useSeatLockCleanup({
    busId: bus?._id,
    date,
    departureTime,
    seats: selectedSeatStrings,
  });

  const makeSeatAllocations = () => {
    return passengers.length > 0
      ? passengers.map((p) => ({ seat: String(p.seat), gender: p.gender }))
      : selectedSeatStrings.map((s) => ({
          seat: s,
          gender: seatGenders[s] || "M",
        }));
  };

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

    setLocking(true);
    setLockMsg("");
    try {
      const payload = {
        busId: bus._id,
        date,
        departureTime,
        seats: selectedSeatStrings,
        // 🔒 send genders too – some backends bind lock to seat+gender
        seatAllocations: makeSeatAllocations(),
      };
      const res = await apiClient.post("/bookings/lock", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ok = res?.data?.ok !== false;
      setLockOk(ok);
      if (!ok) setLockMsg(res?.data?.message || "Seat lock failed.");
      if (ok) setHoldExpired(false);
      return ok;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Seat lock failed. Try again.";
      setLockOk(false);
      setLockMsg(msg);
      return false;
    } finally {
      setLocking(false);
    }
  };

  // 🔓 Cancel helper (release lock + go Home)
  const cancelAndHome = async () => {
    try {
      // ✅ NEW: use shared release helper (also cleans up timers/flags)
      await releaseSeats();
    } catch {
      // fallback to direct API in case helper fails for any reason
      const token = localStorage.getItem("token");
      try {
        await apiClient.delete("/bookings/release", {
          data: {
            busId: bus._id,
            date,
            departureTime,
            seats: selectedSeatStrings,
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch {
        // ignore
      }
    } finally {
      navigate("/");
    }
  };

  // Try to secure (or refresh) the lock when user lands on Payment
  useEffect(() => {
    if (isIncomplete) return;
    ensureSeatLock();
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
      // ✅ Ensure backend can match the held lock
      clientId: getClientId(),
    };
    return apiClient.post("/bookings", bookingPayload, {
      headers: { Authorization: `Bearer ${token}` },
    });
  };

  const handleFakePayment = async () => {
    // Re-check/refresh the lock right before paying
    let ok = await ensureSeatLock();
    if (!ok) {
      alert(
        lockMsg ||
          "Could not verify seat lock. Please press 'Re-lock seats' and try again."
      );
      return;
    }
    if (holdExpired) {
      alert("Your seat hold has expired. Please re-lock the seats.");
      return;
    }

    // ✅ NEW: prevent auto-release while payment is in progress / redirecting
    suppressAutoRelease();

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please login to complete the booking.");
        navigate("/login");
        return;
      }

      // 1st attempt
      let res = await tryCreateBooking();
      alert("Payment successful (simulated)");
      navigate("/download-ticket", {
        state: {
          bookingDetails: { ...state, bookingId: res?.data?.booking?._id },
        },
      });
    } catch (err) {
      const apiMsg = err?.response?.data?.message;
      const isLockIssue =
        err?.response?.status === 409 ||
        /lock(ed)?|expired|no longer locked|conflict/i.test(apiMsg || "");

      if (isLockIssue) {
        // Re-lock once and retry automatically
        const relocked = await ensureSeatLock();
        if (relocked) {
          try {
            const res2 = await tryCreateBooking();
            alert("Payment successful (simulated)");
            navigate("/download-ticket", {
              state: {
                bookingDetails: {
                  ...state,
                  bookingId: res2?.data?.booking?._id,
                },
              },
            });
            return;
          } catch (err2) {
            const apiMsg2 = err2?.response?.data?.message;
            setLockOk(false);
            setLockMsg(apiMsg2 || "Seat lock conflict. Please try again.");
            alert(
              `Payment failed: ${
                apiMsg2 ||
                "Seat lock conflict even after re-lock. Please re-select seats."
              }`
            );
            return;
          }
        }
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
    <div className="bg-white shadow-md rounded-xl p-6 border">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3 mb-4">
        {icon} {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );

  if (isIncomplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border">
          <FaExclamationTriangle className="mx-auto text-5xl text-red-400 mb-4" />
          <h1 className="text-xl font-bold text-red-600">Booking Error</h1>
          <p className="text-gray-700 mt-2">
            Your booking details are incomplete. Please start over.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-transform hover:scale-105"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <BookingSteps currentStep={4} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
          {/* Left Column: Details broken into cards */}
          <div className="lg:col-span-7 space-y-6">
            <InfoCard
              icon={<FaBus className="text-red-500" />}
              title="Journey Details"
            >
              <div className="text-gray-800">
                <p className="text-xl font-semibold">{bus.name}</p>
                <p className="text-sm text-gray-500">{bus.busType}</p>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Route:</span>
                <span className="font-medium text-gray-800">
                  {bus.from} to {bus.to}
                </span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Date & Time:</span>
                <span className="font-medium text-gray-800">
                  {new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {departureTime}
                </span>
              </div>
            </InfoCard>

            <InfoCard
              icon={<FaMapMarkerAlt className="text-red-500" />}
              title="Boarding & Dropping Points"
            >
              <div className="flex items-start gap-4">
                <FaMapMarkerAlt className="text-green-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Boarding From</p>
                  <p className="font-semibold text-gray-800">
                    {selectedBoardingPoint.point} at {selectedBoardingPoint.time}
                  </p>
                </div>
              </div>
              <div className="pl-2">
                <FaArrowDown className="text-gray-300" />
              </div>
              <div className="flex items-start gap-4">
                <FaMapMarkerAlt className="text-red-500 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Dropping At</p>
                  <p className="font-semibold text-gray-800">
                    {selectedDroppingPoint.point} at{" "}
                    {selectedDroppingPoint.time}
                  </p>
                </div>
              </div>
            </InfoCard>

            {/* Passenger Information */}
            <InfoCard
              icon={<FaUsers className="text-red-500" />}
              title="Passenger Information"
            >
              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-2">
                  Primary Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-800">
                  <div className="flex items-center gap-2">
                    <FaUserCircle className="text-gray-400" />
                    <span className="font-medium">{passenger.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaPhone className="text-gray-400" />
                    <span className="font-medium">{passenger.mobile}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaIdCard className="text-gray-400" />
                    <span className="font-medium">{passenger.nic}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="text-gray-400" />
                    <span className="font-medium">{passenger.email}</span>
                  </div>
                </div>
              </div>

              <hr className="border-dashed" />

              <div>
                <h4 className="text-sm font-semibold text-gray-500 mb-3">
                  Travellers
                </h4>
                <ul className="space-y-3">
                  {passengers.map((p) => (
                    <li
                      key={p.seat}
                      className="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-red-800 bg-red-100 rounded-full w-8 h-8 flex items-center justify-center">
                          {p.seat}
                        </span>
                        <span className="font-medium text-gray-700">
                          {p.name || "-"}
                        </span>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                          p.gender === "F"
                            ? "bg-pink-100 text-pink-800"
                            : "bg-violet-100 text-violet-800"
                        }`}
                      >
                        {p.gender === "F" ? <FaFemale /> : <FaMale />}
                        <span>{p.gender === "F" ? "Female" : "Male"}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </InfoCard>
          </div>

          {/* Right Column: Fare Summary + Pay */}
          <div className="lg:col-span-5">
            <div className="sticky top-24">
              <div className="bg-white shadow-md rounded-xl p-6 border">
                <h3 className="text-xl font-bold border-b pb-3 mb-4 text-gray-800 flex items-center gap-3">
                  <FaMoneyBillWave className="text-green-500" />
                  Fare Summary
                </h3>
                <div className="space-y-2 text-gray-800 font-medium">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs. {priceDetails.basePrice?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Convenience Fee</span>
                    <span>Rs. {priceDetails.convenienceFee?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-700 font-bold text-2xl mt-2 pt-2 border-t">
                    <span>Total Payable</span>
                    <span>Rs. {priceDetails.totalPrice?.toFixed(2)}</span>
                  </div>

                  {/* Lock/Hold status */}
                  <div className="mt-3 flex items-center gap-2">
                    {lockOk ? (
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
                        Seats secured
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700">
                        {lockMsg || "Seats not secured"}
                      </span>
                    )}
                    <HoldCountdown
                      busId={bus._id}
                      date={date}
                      departureTime={departureTime}
                      seats={selectedSeatStrings}
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

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={ensureSeatLock}
                      className="text-xs underline text-blue-600 hover:text-blue-700 disabled:text-gray-400"
                      disabled={locking}
                    >
                      {locking ? "Locking…" : "Re-lock seats"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = window.confirm(
                          "Release your held seats and cancel this booking?"
                        );
                        if (!ok) return;
                        await cancelAndHome();
                      }}
                      className="ml-4 text-xs underline text-red-600 hover:text-red-700"
                    >
                      Cancel booking
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <button
                  onClick={handleFakePayment}
                  disabled={locking || !lockOk || holdExpired}
                  className="w-full py-3.5 rounded-lg text-white font-semibold text-lg transition-all duration-300 shadow-lg bg-red-600 hover:bg-red-700 hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                >
                  Pay Rs. {priceDetails.totalPrice.toFixed(2)}
                </button>
                {!lockOk || holdExpired ? (
                  <p className="text-xs text-center mt-2 text-gray-500">
                    Ensure seats are locked before paying.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
