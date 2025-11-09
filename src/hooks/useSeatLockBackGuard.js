// src/hooks/useSeatLockBackGuard.js
import { useEffect, useRef } from "react";
import apiClient, { getClientId } from "../api";

/**
 * Intercepts browser Back when a seat lock is active.
 * If user confirms, releases the lock then runs onConfirmBack().
 * Otherwise, stays on the page (re-arms the guard).
 */

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

export default function useSeatLockBackGuard({
  enabled,                 // boolean: arm only when lock is active
  busId,
  date,
  departureTime,
  seats,                   // array of seat labels/ids
  onConfirmBack,           // e.g., () => navigate(-1)
  confirmMessage = "Cancel this booking and release your held seats?",
}) {
  const armedRef = useRef(false);

  useEffect(() => {
    if (!enabled || !busId || !date || !departureTime || !seats?.length) return;

    // push a history entry so the next Back hits our handler
    if (!armedRef.current) {
      window.history.pushState({ rbGuard: true }, "");
      armedRef.current = true;
    }

    const releaseLock = async () => {
      const token = getAuthToken();
      try {
        await apiClient.delete("/bookings/release", {
          data: {
            busId,
            date,
            departureTime,
            seats: seats.map(String),
            clientId: getClientId(),       // ✅ keep in sync with _core.jsx
          },
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } catch {
        // ignore; lock will expire anyway
      } finally {
        localStorage.removeItem("rb_active_lock");
      }
    };

    const onPop = async () => {
      const ok = window.confirm(confirmMessage);
      if (ok) {
        await releaseLock();
        if (typeof onConfirmBack === "function") onConfirmBack();
        else window.history.back();
      } else {
        // re-arm so another Back still triggers this guard
        window.history.pushState({ rbGuard: true }, "");
      }
    };

    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    enabled,
    busId,
    date,
    departureTime,
    confirmMessage,
    // stringify seats to avoid stale closures but not over-trigger
    JSON.stringify(seats),
    onConfirmBack,
  ]);
}
