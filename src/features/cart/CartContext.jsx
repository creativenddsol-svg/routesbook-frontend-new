// src/features/cart/CartContext.jsx
import React, { createContext, useContext, useMemo, useState } from "react";
import { CartAPI } from "./cartApi";

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

/** tripKey = `${busId}-${date}-${departureTime}` */
const tk = (busId, date, t) => `${busId}-${date}-${t}`;

export function CartProvider({ children }) {
  // map tripKey -> { cartId, seats[], genders{}, expiresAt, pricing{}, bp, dp, bus, date, departureTime }
  const [byTrip, setByTrip] = useState({});

  const api = useMemo(
    () => ({
      /** Add a seat (locks included server-side) */
      async addSeat({ bus, date, departureTime, seatNo, gender = "M" }) {
        const res = await CartAPI.add({
          busId: bus._id,
          date,
          departureTime,
          seatNo: String(seatNo),
          gender,
        });
        const cart = res?.data;
        const key = tk(bus._id, date, departureTime);
        setByTrip((s) => ({ ...s, [key]: hydrate(cart) }));
        return cart;
      },

      /** Remove a seat (also releases the seat lock) */
      async removeSeat({ bus, date, departureTime, seatNo }) {
        const key = tk(bus._id, date, departureTime);
        const cartId = byTrip[key]?.cartId;
        if (!cartId) return { message: "No active cart" };

        const res = await CartAPI.remove(cartId, String(seatNo));
        const { cart } = res?.data || {};
        setByTrip((s) => ({ ...s, [key]: cart ? hydrate(cart) : empty() }));
        return res?.data;
      },

      /** Fetch my active cart (optionally filter by trip) */
      async getMine({ busId, date, departureTime } = {}) {
        const res = await CartAPI.mine({ busId, date, departureTime });
        const cart = res?.data;
        if (cart) {
          const key = tk(cart.bus, cart.date, cart.departureTime);
          setByTrip((s) => ({ ...s, [key]: hydrate(cart) }));
        }
        return cart;
      },

      /** Extend my locks (server enforces window & max hold) */
      async extendLocks({ busId, date, departureTime }) {
        return CartAPI.locksExtend({ busId, date, departureTime });
      },

      /** (Fake) payment intent for checkout page totals */
      async paymentIntent(cartId) {
        return CartAPI.paymentIntent(cartId);
      },

      /** Create Booking from cart (idempotent; header/body key added in api.js) */
      async checkout({ cartId, paymentIntentId, passengers, from, to }) {
        return CartAPI.checkout({ cartId, paymentIntentId, passengers, from, to });
      },
    }),
    [byTrip]
  );

  return (
    <CartCtx.Provider value={{ byTrip, setByTrip, api }}>
      {children}
    </CartCtx.Provider>
  );
}

/* ---------- helpers ---------- */

function hydrate(cart) {
  if (!cart) return empty();
  return {
    cartId: cart._id,
    seats: (cart.items || []).map((i) => String(i.seatNo)),
    genders: Object.fromEntries(
      (cart.items || []).map((i) => [String(i.seatNo), i.gender || "M"])
    ),
    expiresAt: cart.expiresAt || null,
    pricing: {
      subtotal: Number(cart.subtotal || 0),
      fee: Number(cart.convenienceFee || 0),
      total: Number(cart.total || 0),
    },
    bp: cart.boardingPoint || null,
    dp: cart.droppingPoint || null,
    bus: cart.bus,
    date: cart.date,
    departureTime: cart.departureTime,
  };
}

const empty = () => ({
  cartId: null,
  seats: [],
  genders: {},
  expiresAt: null,
  pricing: { subtotal: 0, fee: 0, total: 0 },
  bp: null,
  dp: null,
  bus: null,
  date: null,
  departureTime: null,
});
