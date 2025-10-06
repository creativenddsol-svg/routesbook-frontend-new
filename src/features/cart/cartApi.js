// src/features/cart/cartApi.js
import api from "../../api";

export const CartAPI = {
  /* ---------------- Cart ---------------- */
  // Add a seat to the active cart for a trip
  // payload: { busId, date, departureTime, seatNo, gender? }
  add: (payload) => api.post("/bookings/cart/add", payload),

  // Remove a seat from cart
  // cartId: string, seatNo: string
  remove: (cartId, seatNo) =>
    api.delete("/bookings/cart/remove", { data: { cartId, seatNo } }),

  // Get my active cart (optionally filter by trip)
  // params?: { busId, date, departureTime }
  mine: (params) => api.get("/bookings/cart/my", { params }),

  /* ---------------- Locks utilities ---------------- */
  // Extend my locks when near expiry (policy enforced server-side)
  // payload: { busId, date, departureTime }
  locksExtend: (payload) => api.patch("/bookings/locks/extend", payload),

  // Public: list currently locked seats for a trip (all owners)
  // params: { busId, date, departureTime }
  locksStatus: (params) => api.get("/bookings/locks/status", { params }),

  /* ---------------- Payments / Checkout ---------------- */
  // Create a (fake) payment intent for a cart
  // returns { paymentIntentId, amount, currency }
  paymentIntent: (cartId) => api.post("/bookings/payments/intent", { cartId }),

  // Idempotent checkout → Booking
  // args: { cartId, paymentIntentId, passengers?, from?, to? }
  checkout: ({ cartId, paymentIntentId, passengers, from, to }) =>
    api.post("/bookings/cart/checkout", {
      cartId,
      paymentIntentId,
      passengers,
      from,
      to,
    }),
};

export default CartAPI;
