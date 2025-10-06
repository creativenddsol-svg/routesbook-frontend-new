// src/pages/Cart.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../features/cart/CartContext";

function useCountdown(expiresAtISO) {
  const [leftMs, setLeftMs] = useState(null);
  const targetRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!expiresAtISO) {
      setLeftMs(null);
      return;
    }
    targetRef.current = new Date(expiresAtISO).getTime();

    const tick = () => {
      const t = targetRef.current || Date.now();
      const left = Math.max(0, t - Date.now());
      setLeftMs(left);
      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAtISO]);

  const mm = useMemo(() => {
    if (leftMs == null) return "--";
    const s = Math.ceil(leftMs / 1000);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  }, [leftMs]);

  return { leftMs, mm, expired: leftMs !== null && leftMs <= 0 };
}

export default function CartPage() {
  const { byTrip, api } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [extending, setExtending] = useState(false);

  // pick the “freshest” cart by expiresAt (fallback to last key)
  const current = useMemo(() => {
    const entries = Object.entries(byTrip || {});
    if (!entries.length) return null;
    const withScore = entries.map(([k, v]) => [k, v, new Date(v?.expiresAt || 0).getTime()]);
    withScore.sort((a, b) => (b[2] || 0) - (a[2] || 0));
    return withScore[0][1];
  }, [byTrip]);

  // Try to load any active cart on mount
  useEffect(() => {
    if (!current) {
      api.getMine().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { leftMs, mm, expired } = useCountdown(current?.expiresAt);

  const removeSeat = async (seatNo) => {
    try {
      await api.removeSeat({
        bus: { _id: current.bus },
        date: current.date,
        departureTime: current.departureTime,
        seatNo: String(seatNo),
      });
    } catch (e) {
      console.warn("Remove seat failed:", e?.response?.data || e?.message);
      alert("Could not remove seat. Please try again.");
    }
  };

  const extendHold = async () => {
    if (!current) return;
    setExtending(true);
    try {
      await api.extendLocks({
        busId: current.bus,
        date: current.date,
        departureTime: current.departureTime,
      });
      // CartContext will refresh on next mutation; here we can soft refresh by re-getMine
      await api.getMine({
        busId: current.bus,
        date: current.date,
        departureTime: current.departureTime,
      });
    } catch (e) {
      console.warn("Extend hold failed:", e?.response?.data || e?.message);
      alert("Could not extend the hold right now.");
    } finally {
      setExtending(false);
    }
  };

  const pay = async () => {
    if (!current) return;
    if (expired) {
      alert("Your cart hold has expired. Please reselect seats.");
      return;
    }
    try {
      setLoading(true);
      const pi = await api.paymentIntent(current.cartId); // { paymentIntentId, amount, currency }
      navigate("/payment", {
        state: {
          // keep compat with your Payment.jsx (it tolerates partial bus info)
          bus: { _id: current.bus },
          date: current.date,
          departureTime: current.departureTime,
          selectedSeats: current.seats,
          seatGenders: current.genders,
          priceDetails: {
            basePrice: current.pricing.subtotal,
            convenienceFee: current.pricing.fee,
            totalPrice: current.pricing.total,
          },
          // pass hold hints
          expiresAt: current.expiresAt,
          holdExpiresAt: current.expiresAt,
          lockExpiresAt: current.expiresAt,
          remainingMs: leftMs ?? undefined,
          // cart + payments
          cartId: current.cartId,
          paymentIntentId: pi.data.paymentIntentId,
        },
      });
    } catch (e) {
      console.warn("Create payment intent failed:", e?.response?.data || e?.message);
      alert("Could not prepare payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!current) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-xl font-bold">Your Cart</h1>
        <p className="mt-4 text-gray-600">No seats in your cart yet.</p>
        <div className="mt-4">
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2 rounded-md bg-rose-600 text-white"
          >
            Search buses
          </button>
        </div>
      </div>
    );
  }

  const { cartId, seats, genders, pricing, date, departureTime } = current;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">Your Cart</h1>

      {/* Trip + hold */}
      <div className="rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Trip</div>
            <div className="text-sm text-gray-600">
              {date} • {departureTime}
            </div>
          </div>
          <div className="text-sm">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full font-semibold tabular-nums ${
                expired ? "bg-red-100 text-red-700" : "bg-rose-50 text-rose-700"
              }`}
              title="Your cart seats are held for a limited time"
            >
              {expired ? "Hold expired" : `Hold: ${mm}`}
            </span>
          </div>
        </div>
        <div className="mt-3">
          <button
            onClick={extendHold}
            disabled={extending || expired}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
            title="Attempt to extend your current hold (within policy)"
          >
            {extending ? "Extending…" : "Extend Hold"}
          </button>
        </div>
      </div>

      {/* Seats */}
      <div className="rounded-lg border p-4">
        <div className="font-medium mb-2">Seats</div>
        {seats.length ? (
          <div className="flex flex-wrap gap-2">
            {seats.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100"
              >
                <span>Seat {s} {genders[s] === "F" ? "(F)" : "(M)"}</span>
                <button
                  onClick={() => removeSeat(s)}
                  className="text-xs underline text-rose-700"
                  title="Remove from cart"
                >
                  remove
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No seats in this cart.</p>
        )}
      </div>

      {/* Totals */}
      <div className="rounded-lg border p-4">
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Subtotal</span>
          <span>Rs. {pricing.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-600">Convenience Fee</span>
          <span>Rs. {pricing.fee.toFixed(2)}</span>
        </div>
        <div className="border-t my-2" />
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>Rs. {pricing.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={pay}
          disabled={loading || !seats.length || expired}
          className="px-5 py-2 rounded-md bg-rose-600 text-white disabled:opacity-60"
          title={expired ? "Hold expired — reselect seats" : "Proceed to payment"}
        >
          {loading ? "Preparing…" : "Proceed to Payment"}
        </button>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-md border"
        >
          Continue selecting
        </button>
      </div>
    </div>
  );
}
