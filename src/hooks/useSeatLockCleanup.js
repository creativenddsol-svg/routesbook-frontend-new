// src/hooks/useSeatLockCleanup.js
import { useEffect, useRef, useCallback } from "react";
import apiClient, { getClientId } from "../api";

/* Keep these helpers consistent with your SearchResults.jsx */
const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

const buildAuthConfig = (token) =>
  token ? { headers: { Authorization: `Bearer ${token}` } } : {};

/**
 * useSeatLockCleanup
 *
 * Ensures seats are released when the user cancels or abandons the flow.
 * Returns:
 *   - releaseSeats(): call this in your "Cancel" button handler.
 *   - suppressAutoRelease(): call this right before redirecting to a payment gateway
 *     if you want the hold to persist during external payment.
 *   - allowAutoRelease(): re-enable automatic cleanup if you suppressed it earlier.
 */
export function useSeatLockCleanup({
  busId,
  date,
  departureTime,
  seats = [],
}) {
  const latestRef = useRef({ busId, date, departureTime, seats });
  const releasingRef = useRef(false);
  const suppressAutoReleaseRef = useRef(false);

  // Keep latest values in a ref so callbacks always see fresh data
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
          // ✅ Use the single shared client id everywhere
          clientId: getClientId(),
        },
      });
    } catch (e) {
      // best-effort cleanup; don't throw
      console.warn("Seat release (cleanup) failed:", e?.response?.data || e?.message || e);
    } finally {
      releasingRef.current = false;
    }
  }, []);

  // Automatically release on component unmount (unless suppressed)
  useEffect(() => {
    return () => {
      if (!suppressAutoReleaseRef.current) {
        // fire-and-forget; no await on unmount
        releaseSeats();
      }
    };
  }, [releaseSeats]);

  // Optional: also attempt a last-chance release on tab close/refresh.
  // This uses sendBeacon/fetch keepalive. It will be skipped if suppressed.
  useEffect(() => {
    const sendBeaconRelease = () => {
      if (suppressAutoReleaseRef.current) return;

      const { busId, date, departureTime, seats } = latestRef.current || {};
      if (!busId || !date || !departureTime || !Array.isArray(seats) || seats.length === 0) return;

      const payload = JSON.stringify({
        busId,
        date,
        departureTime,
        seats: seats.map(String),
        // ✅ Use the shared client id for beacon fallback as well
        clientId: getClientId(),
      });

      const baseURL = apiClient?.defaults?.baseURL || "";
      const url =
        (baseURL ? baseURL.replace(/\/$/, "") : "") + "/bookings/release";

      try {
        if (navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          // Some servers accept POST for release when using beacons.
          navigator.sendBeacon(url, blob);
        } else {
          // Fallback: keepalive POST (many browsers don't allow DELETE+keepalive reliably)
          fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        /* no-op */
      }
    };

    // pagehide is more reliable on mobile than beforeunload
    window.addEventListener("pagehide", sendBeaconRelease);
    window.addEventListener("beforeunload", sendBeaconRelease);
    return () => {
      window.removeEventListener("pagehide", sendBeaconRelease);
      window.removeEventListener("beforeunload", sendBeaconRelease);
    };
  }, []);

  const suppressAutoRelease = useCallback(() => {
    suppressAutoReleaseRef.current = true;
  }, []);

  const allowAutoRelease = useCallback(() => {
    suppressAutoReleaseRef.current = false;
  }, []);

  return { releaseSeats, suppressAutoRelease, allowAutoRelease };
}

export default useSeatLockCleanup;
