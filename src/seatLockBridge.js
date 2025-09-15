// src/seatLockBridge.js
import apiClient, { getClientId } from "./api";

const LOCK_REGISTRY_KEY = "rb_lock_registry_v1";

const readReg = () => {
  try { return JSON.parse(sessionStorage.getItem(LOCK_REGISTRY_KEY) || "[]"); }
  catch { return []; }
};
const writeReg = (arr) => sessionStorage.setItem(LOCK_REGISTRY_KEY, JSON.stringify(arr));
const clearReg = () => writeReg([]);

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("jwt") ||
  sessionStorage.getItem("token") ||
  null;

// Call this BEFORE you clear tokens during logout
export async function releaseLocksBeforeLogout() {
  const reg = readReg();
  if (!reg.length) return;

  const token = getToken();
  const auth = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  await Promise.allSettled(
    reg.map(r =>
      apiClient.delete("/bookings/release", {
        ...auth,
        data: {
          busId: r.busId,
          date: r.date,
          departureTime: r.departureTime,
          seats: r.seats,
          clientId: getClientId(),
        },
      })
    )
  );

  clearReg();
}

// Helpers the SearchResults page will use:
export function regAddSeat({ busId, date, departureTime, seat }) {
  const reg = readReg();
  const idx = reg.findIndex(r => r.busId === busId && r.date === date && r.departureTime === departureTime);
  if (idx === -1) {
    reg.push({ busId, date, departureTime, seats: [String(seat)] });
  } else if (!reg[idx].seats.includes(String(seat))) {
    reg[idx].seats.push(String(seat));
  }
  writeReg(reg);
}

export function regRemoveSeats({ busId, date, departureTime, seats }) {
  const reg = readReg();
  const idx = reg.findIndex(r => r.busId === busId && r.date === date && r.departureTime === departureTime);
  if (idx !== -1) {
    const s = new Set(seats.map(String));
    const next = reg[idx].seats.filter(x => !s.has(String(x)));
    if (next.length) reg[idx].seats = next;
    else reg.splice(idx, 1);
    writeReg(reg);
  }
}

// Optional global to call without import (legacy code)
window.rbReleaseLocksBeforeLogout = releaseLocksBeforeLogout;
