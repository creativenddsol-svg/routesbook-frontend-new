// src/pages/lib/locks.js
import apiClient, { getClientId } from "./api";

/**
 * Cross-tab/session lightweight seat-lock registry.
 * We mirror the logic you already used inside SearchResults, just centralized.
 */

export const LOCK_REGISTRY_KEY = "rb_lock_registry_v1";

export const readLockReg = () => {
  try {
    return JSON.parse(sessionStorage.getItem(LOCK_REGISTRY_KEY) || "[]");
  } catch {
    return [];
  }
};

export const writeLockReg = (arr) => {
  sessionStorage.setItem(LOCK_REGISTRY_KEY, JSON.stringify(arr));
};

export const lockKey = (busId, time, date) => `${busId}__${time}__${date}`;

export const addToRegistry = (bus, date, seats) => {
  const key = lockKey(bus._id, bus.departureTime, date);
  const reg = readLockReg();
  const i = reg.findIndex((r) => r.key === key);
  if (i >= 0) {
    const s = new Set([...(reg[i].seats || []), ...seats.map(String)]);
    reg[i].seats = Array.from(s);
  } else {
    reg.push({
      key,
      busId: bus._id,
      departureTime: bus.departureTime,
      date,
      seats: seats.map(String),
    });
  }
  writeLockReg(reg);
};

export const removeFromRegistry = (bus, date, seats) => {
  const key = lockKey(bus._id, bus.departureTime, date);
  const reg = readLockReg();
  const i = reg.findIndex((r) => r.key === key);
  if (i >= 0) {
    const setToRemove = new Set(seats.map(String));
    const remaining = (reg[i].seats || []).filter((s) => !setToRemove.has(s));
    if (remaining.length) {
      reg[i].seats = remaining;
    } else {
      reg.splice(i, 1);
    }
    writeLockReg(reg);
  }
};

/**
 * Best-effort release for all seats tracked in the registry.
 * Clears the registry afterward regardless of success.
 */
export const releaseAllFromRegistry = async () => {
  const reg = readLockReg();
  if (!reg.length) return;

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    sessionStorage.getItem("token") ||
    null;

  const authConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

  await Promise.allSettled(
    reg.map((r) =>
      apiClient.delete("/bookings/release", {
        ...authConfig,
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

  writeLockReg([]);
};
