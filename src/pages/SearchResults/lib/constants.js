// src/pages/lib/constants.js

/* ---------------- Palette ---------------- */
export const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F0F2F5",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
  green: "#28a745",
  orange: "#fd7e14",
  yellow: "#FFC107",
  datePillBg: "#FFF9DB",
  acPillBg: "#EAF5FF",
  seatPillBg: "#FFE9EC",
};

/* ---------------- Constants ---------------- */
export const TIME_SLOTS = {
  Morning: [4, 12],
  Afternoon: [12, 17],
  Evening: [17, 21],
  Night: [21, 24],
};

export const RESULTS_PER_PAGE = 5;

/* Near real-time refresh cadence (fallback if no websockets) */
export const LIVE_POLL_MS = 6000;
export const MAX_REFRESH_BUSES = 10;
export const AVAIL_TTL_MS = 8000;
export const AVAIL_FORCE_TTL_MS = 2000;
export const MAX_INIT_AVAIL_CONCURRENCY = 6;

// Stable empties to avoid re-allocations
export const EMPTY_ARR = Object.freeze([]);
export const EMPTY_OBJ = Object.freeze({});
