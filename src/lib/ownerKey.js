// src/lib/ownerKey.js

const STORAGE_KEY = "rb_owner_key";

/** Safe, browser-only random ID */
function makeId() {
  try {
    if (typeof crypto !== "undefined" && crypto?.randomUUID) {
      return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && crypto?.getRandomValues) {
      const a = new Uint32Array(4);
      crypto.getRandomValues(a);
      // uuid-ish without dependencies
      return (
        a[0].toString(16).padStart(8, "0") + "-" +
        a[1].toString(16).padStart(8, "0") + "-" +
        a[2].toString(16).padStart(8, "0") + "-" +
        a[3].toString(16).padStart(8, "0")
      );
    }
  } catch {
    // fall through to time/random
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Basic sanity check so we don't persist garbage */
function looksValid(s) {
  if (!s || typeof s !== "string") return false;
  if (s.length < 10) return false;
  // allow uuid-ish or our fallback pattern
  return /^[a-z0-9\-]+$/i.test(s);
}

/**
 * Returns a stable per-device "owner key" used to associate carts & locks.
 * It is persisted in localStorage and safe to call on every request.
 */
export function getOwnerKey() {
  try {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!looksValid(key)) {
      key = makeId();
      localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
  } catch {
    // If localStorage is unavailable (e.g., private mode), return an ephemeral key.
    return `guest-${makeId()}`;
  }
}

/**
 * Optional helper: attach as a default header on an Axios instance.
 * Usage: attachOwnerKeyHeader(apiClient);
 */
export function attachOwnerKeyHeader(axiosInstance) {
  try {
    const k = getOwnerKey();
    if (axiosInstance?.defaults?.headers?.common) {
      axiosInstance.defaults.headers.common["x-owner-key"] = k;
    }
  } catch {
    // no-op
  }
}
