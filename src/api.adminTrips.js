// src/api.adminTrips.js
import apiClient from "./api";

/**
 * Admin manual trigger: mark a specific trip as 'Arrived' and SMS passengers.
 * @param {Object} payload
 * @param {string} payload.busId
 * @param {string} payload.date          // "YYYY-MM-DD"
 * @param {string} payload.departureTime // exact time string used in Booking
 * @param {string} payload.standPoint    // e.g., "Matara Highway Stand"
 * @param {string} [payload.platform]    // optional, e.g., "3"
 * @returns {Promise<{ok:boolean, sent:number}>}
 */
export async function adminTripArrived(payload) {
  // Slightly longer timeout to be safe if many SMS are sent
  const res = await apiClient.post("/admin/trips/arrived", payload, {
    timeout: 30000,
  });
  return res.data;
}
