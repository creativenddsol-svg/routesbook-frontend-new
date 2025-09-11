// src/hooks/useSeatLockCleanup.js
import { useEffect, useRef, useCallback } from "react";
import apiClient from "../api";

/* Keep these helpers consistent with your SearchResults.jsx */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/** Stable per-browser client id so the backend can group locks by client */
const getClientLockId = () => {
  try {
    let id = localStorage.getItem("clientLockId");
    if (!id) {
      id =
        (typeof crypto !== "undefined" &&
          crypto.randomUUID &&
          crypto.randomUUID()) ||
        `clid-${Date.now().toString(36)}-${Math.random()
          .toString(36)
          .slice(2, 10)}`;
      localStorage.setItem("clientLockId", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
};

/**
 * useSeatLockCleanup (manual mode)
 *
 * Ensures you CAN release seats when the user cancels or the hold truly expires,
 * but it will NOT auto-release on unmount / pagehide anymore (this was causing
 * “Hold expired” while typing due to StrictMode/react-router remounts).
 *
 * Returns:
 *   - releaseSeats(): call this in "Cancel" or when your countdown really hits 0.
 *   - suppressAutoRelease(): kept for API compatibility (no-op now).
 *   - allowAutoRelease(): kept for API compatibility (no-op now).
 */
export function useSeatLockCleanup({
  busId,
  date,
  departureTime,
  seats = [],
}) {
  const latestRef = useRef({ busId, date, departureTime, seats });
  const releasingRef = useRef(false);

  // keep latest values
  useEffect(() => {
    latestRef.current = { busId, date, departureTime, seats };
  }, [busId, date, departureTime, seats]);

  const releaseSeats = useCallback(async () => {
    const { busId, date, departureTime, seats } = latestRef.current || {};
    if (releasingRef.current) return;
    if (!busId || !date || !departureTime || !Array.isArray(seats) || seats.length === 0) return;

    releasingRef.current = true;
    try {
      await apiClient.delete("/bookings/release", {
        ...buildAuthConfig(getAuthToken()),
        data: {
          busId,
          date,
          departureTime,
          seats: seats.map(String),
          clientId: getClientLockId(),
        },
      });
    } catch (e) {
      // best-effort cleanup; don't throw
      console.warn("Seat release (manual) failed:", e?.response?.data || e?.message || e);
    } finally {
      releasingRef.current = false;
    }
  }, []);

  // ❌ Removed: auto-release on unmount (caused accidental releases)
  // ❌ Removed: pagehide/beforeunload beacon release
  // These were the root cause of “Hold expired” while typing.

  const suppressAutoRelease = useCallback(() => {}, []);
  const allowAutoRelease = useCallback(() => {}, []);

  return { releaseSeats, suppressAutoRelease, allowAutoRelease };
}

export default useSeatLockCleanup;
